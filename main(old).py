#!/usr/bin/env python3
"""
C2C Shopping Dispute helper - MVP (Version A - Clean PDF Input)
-------------------------------------------------------
輸入：
case_folder/
├─ case.pdf     ← 已清理（只含原始 listing + chat + dispute）
└─ policy.pdf   ← 你們的整合政策（含錨點代碼）

輸出：
- JSON（SNAD 判斷 / Eligibility / Evidence checklist / CS summary）

使用方式：
python main.py --case-folder data/case1
python main.py --case-folder data/case1 --save
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import ollama
from pypdf import PdfReader


# ---------------------------
# PDF Loader
# ---------------------------

def load_pdf_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"找不到 PDF 檔案：{path}")
    reader = PdfReader(str(path))

    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(f"[Page {i}]\n{text}")
    return "\n\n".join(pages).strip()


# ---------------------------
# Prompt Builder
# ---------------------------

def build_prompt(case_text: str, policy_text: str) -> str:
    return f"""
你現在是一個「只依照案件事實」進行判斷的 C2C 爭議助手。

⚠ 最高優先規則（必須遵守）：
1. 你的所有判斷都必須以 CASE_TEXT（案件內容）為主。
2. POLICY_TEXT（政策）只能用來引用錨點與規則（例如 SND-501）。
3. 不可以摘要政策、不可以評論政策、不可以重新解釋政策。
4. 不可以忽略 CASE_TEXT，也不可以把政策當案件內容使用。
5. 最終輸出必須是 JSON（不得包含任何 JSON 外的文字）。

------------------------------------------------
【CASE_TEXT（最重要）】
下面是使用者提供的案件內容（實際 listing + chat + 申訴）：
{case_text}
【CASE_TEXT_END】
------------------------------------------------

你現在必須根據案件內容完成以下工作：

(1) 抽取案件資訊  
(2) 檢查 Eligibility (R1/R2/R3)  
(3) 做 SNAD 判斷  
(4) 做證據 Checklist  
(5) 產生 CS Summary  

請務必只依 CASE_TEXT 進行抽取與推論。

------------------------------------------------
【POLICY_TEXT（僅供查表，不可影響抽取）】
以下是平台政策，用來查詢 R1/R2/R3、SND-501 等錨點（不可重寫案件）：
{policy_text}
【POLICY_TEXT_END】
------------------------------------------------

請輸出下列 JSON（格式不得修改）：

{{
  "extracted_info": {{
    "product_summary": "...",
    "seller_claims": ["..."],
    "buyer_claims": ["..."],
    "timeline": ["..."],
    "potential_issues": ["..."]
  }},
  "eligibility": {{
    "is_eligible": true/false/"unknown",
    "checks": [
      {{"rule": "R1 ...", "pass": true/false/"unknown", "reason": "..."}},
      {{"rule": "R2 ...", "pass": true/false/"unknown", "reason": "..."}},
      {{"rule": "R3 ...", "pass": true/false/"unknown", "reason": "..."}}
    ]
  }},
  "snad_assessment": {{
    "is_snad": true/false/"unknown",
    "reasoning": ["..."],
    "policy_citations": ["SND-501", "EVD-701", ...]
  }},
  "evidence_checklist": {{
    "provided": ["EVD-701", ...],
    "missing": ["EVD-702", ...],
    "notes": ["..."]
  }},
  "cs_summary": {{
    "short_summary": "...(3-5句)",
    "key_points": ["..."],
    "suggested_resolution": ["A) ...", "B) ..."],
    "confidence": 0.0
  }}
}}
""".strip()





# ---------------------------
# LLM Call
# ---------------------------

def call_ollama(prompt: str, model: str = "gemma3:1b") -> str:
    try:
        resp = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are a careful dispute analysis assistant."},
                {"role": "user", "content": prompt},
            ],
            options={"temperature": 0.25, "top_p": 0.9},
        )
        return resp.get("message", {}).get("content", "").strip()
    except Exception as exc:
        return json.dumps(
            {"error": "Ollama 無法連線或模型不存在", "detail": str(exc)},
            ensure_ascii=False,
            indent=2,
        )


# ---------------------------
# Simple JSON Repair (optional)
# ---------------------------

def try_repair_json(text: str) -> str:
    """
    Gemma 有時會多吐一些字。
    這邊做最簡單修復：抓第一個 { 到最後一個 }。
    """
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end+1].strip()
    return text.strip()


# ---------------------------
# CLI
# ---------------------------

def build_arg_parser():
    p = argparse.ArgumentParser(description="C2C Dispute Copilot - Clean PDF A版")
    p.add_argument("--case-folder", default="data/case1",
                   help="包含 case.pdf 與 policy.pdf 的資料夾")
    p.add_argument("--model", default="gemma3:1b", help="Ollama 模型名稱")
    p.add_argument("--save", action="store_true", help="是否輸出 output.json")
    return p


def main():
    args = build_arg_parser().parse_args()
    folder = Path(args.case_folder)

    case_pdf = folder / "case.pdf"
    policy_pdf = folder / "policy.pdf"

    print("讀取 case.pdf ...")
    case_text = load_pdf_text(case_pdf)

    print("讀取 policy.pdf ...")
    policy_text = load_pdf_text(policy_pdf)

    prompt = build_prompt(case_text, policy_text)
    raw_output = call_ollama(prompt, model=args.model)
    output = try_repair_json(raw_output)

    print("\n" + "=" * 72)
    print("AI Output (JSON):\n")
    print(output)

    if args.save:
        out_path = folder / "output.json"
        out_path.write_text(output, encoding="utf-8")
        print(f"\n已輸出：{out_path}")


if __name__ == "__main__":
    main()
