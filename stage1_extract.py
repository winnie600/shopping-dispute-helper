#!/usr/bin/env python3
"""
Stage 1 - Chunked Case Extractor
-------------------------------
功能：
1. 優先讀取 case.txt（最乾淨）
2. 若無 txt → 讀 case.pdf（備用）
3. 將長文本切成 chunk（避免小模型忽略大量文字）
4. 每一 chunk 分別抽取 seller_claims / buyer_claims / timeline / issues
5. 最後合併所有 chunk 的抽取結果
6. 輸出 extracted_case.json
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, List

import ollama
from PyPDF2 import PdfReader


# -----------------------------------
# 文字載入（txt 優先，pdf 備用）
# -----------------------------------

def load_case_text(case_folder: Path) -> str:
    txt_path = case_folder / "case.txt"
    pdf_path = case_folder / "case.pdf"

    # 1. 優先讀取 TXT（最乾淨、最適合 LLM）
    if txt_path.exists():
        return txt_path.read_text(encoding="utf-8").strip()

    # 2. fallback：讀 PDF
    if pdf_path.exists():
        reader = PdfReader(str(pdf_path))
        pages = []
        for i, page in enumerate(reader.pages, start=1):
            t = page.extract_text()
            if t:
                pages.append(f"[Page {i}]\n{t.strip()}")
        return "\n\n".join(pages).strip()

    raise FileNotFoundError("case.txt 或 case.pdf 都不存在！")


# -----------------------------------
# Chunk 工具
# -----------------------------------

def chunk_text(text: str, max_chars: int = 1600) -> List[str]:
    """將長文本切成多個 chunk（避免小模型忽略長內容）"""
    chunks = []
    while len(text) > max_chars:
        cut = text[:max_chars]
        chunks.append(cut)
        text = text[max_chars:]
    if text:
        chunks.append(text)
    return chunks


# -----------------------------------
# Prompt（抽取每個 chunk）
# -----------------------------------

def build_chunk_prompt(chunk: str) -> str:
    return f"""
你是 C2C 爭議案件的「資訊抽取器」。

任務：從以下文字 chunk 中抽取買家主張 / 賣家主張 / 時間線 / 潛在爭議點。
限制：
- 僅根據 chunk，本階段不需要完整一致，只要盡可能抽出資訊即可。
- 不要胡亂猜測。
- 輸出必須是 JSON 格式。

【TEXT CHUNK】
{chunk}
【END】

請輸出 JSON：

{{
  "seller_claims": ["..."],
  "buyer_claims": ["..."],
  "timeline": ["..."],
  "potential_issues": ["..."]
}}
""".strip()


# -----------------------------------
# 呼叫 LLM
# -----------------------------------

def call_llm(prompt: str, model: str = "gemma3:1b") -> Dict[str, Any]:
    try:
        resp = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You extract facts only. JSON only."},
                {"role": "user", "content": prompt},
            ],
            options={"temperature": 0.2, "top_p": 0.9},
        )
        raw = resp.get("message", {}).get("content", "")
        # 嘗試修復 JSON
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1:
            fixed = raw[start:end+1]
            return json.loads(fixed)
        return {"error": "無法解析 JSON", "raw": raw}
    except Exception as exc:
        return {"error": "LLM 呼叫失敗", "detail": str(exc)}


# -----------------------------------
# 合併各 chunk 抽取結果
# -----------------------------------

def merge_outputs(outputs: List[Dict[str, Any]]) -> Dict[str, Any]:
    merged = {
        "product_summary": "(由 Stage2 或 product.json 補充，不在 Stage1 處理)",
        "seller_claims": [],
        "buyer_claims": [],
        "timeline": [],
        "potential_issues": [],
    }

    for out in outputs:
        if not isinstance(out, dict):
            continue

        for key in ["seller_claims", "buyer_claims", "timeline", "potential_issues"]:
            if key in out and isinstance(out[key], list):
                merged[key].extend(out[key])

    # 去重 + 去空白
    for key in merged:
        if isinstance(merged[key], list):
            cleaned = list({x.strip() for x in merged[key] if x and isinstance(x, str)})
            merged[key] = cleaned

    return merged


# -----------------------------------
# Stage1 主流程
# -----------------------------------

def run_stage1(case_pdf_or_folder: Path, model: str = "gemma3:1b") -> Dict[str, Any]:
    folder = case_pdf_or_folder.parent if case_pdf_or_folder.is_file() else case_pdf_or_folder

    print("讀取 case.txt / case.pdf ...")
    full_text = load_case_text(folder)

    print("切 chunk ...")
    chunks = chunk_text(full_text, max_chars=1600)

    print(f"共 {len(chunks)} 個 chunk")

    all_outputs = []
    for idx, chunk in enumerate(chunks, start=1):
        print(f"處理 chunk {idx}/{len(chunks)}...")
        prompt = build_chunk_prompt(chunk)
        out = call_llm(prompt, model=model)
        all_outputs.append(out)

    print("合併結果 ...")
    merged = merge_outputs(all_outputs)
    return merged


def save_stage1_output(folder: Path, data: Dict[str, Any]) -> Path:
    out_path = folder / "extracted_case.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path
