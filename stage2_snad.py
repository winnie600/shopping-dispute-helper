#!/usr/bin/env python3
"""
Stage 2 - SNAD Decision Engine (Eligibility by Code)
----------------------------------------------------
輸入：
- extracted_case.json（Stage1 抽出的案件摘要）
- product.json       （固定欄位，用來算 R1/R2/R3）

流程：
1. 讀 product.json → 根據 eligibility_flags 算出 eligibility
2. 讀 extracted_case.json → 交給 LLM 搭配政策 LITE 做 SNAD / EVD / CS summary
3. 最終輸出 final_output.json：
   {{
     "eligibility": {{...}},          ← 由程式產生
     "snad_assessment": {{...}},      ← LLM
     "evidence_checklist": {{...}},   ← LLM
     "cs_summary": {{...}}            ← LLM
   }}
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any

import ollama


# ===== LITE POLICY 一樣保留，用來輔助 SNAD 推論 =====

LITE_POLICY = """
[Eligibility – 硬條件（必須全部通過）]
R1 [ELI-301]：交易為 Carousell App 內「受保護」的交易模式：
    - App 內付款 / Escrow
    - 或 7-ELEVEN 取貨付款（COD）
    - 若非受保護交易 → Out of scope

R2 [ELI-302]：使用者在時限內提出爭議：
    - App 內付款：通常需在收貨後 24 - 48 小時內提出
    - 7-ELEVEN COD：需在取件後立即檢查並儘速提出
    - 若逾期 → Out of scope

R3 [ELI-303]：訂單狀態必須為「尚未完成」
    - 已按下「完成訂單」 → Out of scope（除非重大詐欺）

[Eligibility 判定方式]
若 R1/R2/R3 任一不符 → Out of scope（不給 SNAD A/B 建議，只給證據 checklist）

----------------------------------------------------

[SNAD – 商品與描述不符 判準（任一成立）]

SND-501：重大未揭露瑕疵或維修（螢幕更換、整新、零件維修）
SND-502：Wrong item / Wrong size / Wrong version
SND-503：嚴重不符描述（寫全配件但缺關鍵配件、寫 Like New 但大量瑕疵）
SND-504：外觀/功能差異重大（黃斑、烙印、功能異常）

----------------------------------------------------

[Evidence Checklist（最常要求）]

EVD-701：刊登截圖（Title / Price / Condition）
EVD-702：開箱照（外箱＋商品狀態）
EVD-703：聊天紀錄（是否詢問過瑕疵/維修）
EVD-704：系統資訊（IMEI / 電池健康）
EVD-705：比較照（listing vs 實物）
EVD-706：包裝照
EVD-707：序號證明

----------------------------------------------------

[決策邏輯]
1. 若 R1/R2/R3 全通過 → 可進入 SNAD 判斷
2. 若符合任一 SND-501/502/503/504 → SNAD 成立 (Seller Fault)
3. 若屬主觀（鞋偏小／買家預期不同） → Neutral SNAD
4. 若證據不足 → Unknown（要求補件）
5. 若不符合 SNAD 判準 → Not SNAD

----------------------------------------------------

[A/B 建議]
A) 退貨退款（Seller Fault）
B) 部分退款（Neutral）
C) 要求補件
D) Out of scope（僅給協商模板）
"""


def _try_repair_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1].strip()
    return text.strip()


# ===== 1. 從 product.json 計算 Eligibility（程式負責） =====

def compute_eligibility(product: Dict[str, Any]) -> Dict[str, Any]:
    flags = product.get("eligibility_flags", {}) or {}

    r1 = flags.get("r1_platform_or_7_11_cod")
    r2 = flags.get("r2_within_dispute_window")
    r3 = flags.get("r3_not_completed")

    def norm_flag(v):
        if v is True:
            return True
        if v is False:
            return False
        return "unknown"

    r1_pass = norm_flag(r1)
    r2_pass = norm_flag(r2)
    r3_pass = norm_flag(r3)

    # is_eligible：只要有 False 就 false；全 True 才 true；其他則 unknown
    passes = [r1_pass, r2_pass, r3_pass]
    if False in passes:
        is_eligible = False
    elif all(p is True for p in passes):
        is_eligible = True
    else:
        is_eligible = "unknown"

    # 簡單理由，可以用 order 內容補充
    order = product.get("order", {})
    tx_type = order.get("transaction_type", "")
    status = order.get("order_status", "")

    checks = [
        {
            "rule": "R1 [ELI-301]",
            "pass": r1_pass,
            "reason": f"交易類型為 {tx_type}；is_platform_protected={order.get('is_platform_protected')}"
        },
        {
            "rule": "R2 [ELI-302]",
            "pass": r2_pass,
            "reason": "根據 timestamps 或人工判斷：是否在爭議期限內提出"
        },
        {
            "rule": "R3 [ELI-303]",
            "pass": r3_pass,
            "reason": f"訂單狀態為 {status}"
        },
    ]

    return {
        "is_eligible": is_eligible,
        "checks": checks
    }


# ===== 2. 組 Prompt：告訴 LLM Eligibility 已算好，不要改 =====

def build_stage2_prompt(
    extracted_case: Dict[str, Any],
    product: Dict[str, Any],
    eligibility: Dict[str, Any]
) -> str:
    extracted_block = json.dumps(extracted_case, ensure_ascii=False, indent=2)
    product_block = json.dumps(product, ensure_ascii=False, indent=2)
    eligibility_block = json.dumps(eligibility, ensure_ascii=False, indent=2)

    return f"""
你是 C2C「SNAD 決策引擎」。注意：

1. Eligibility（R1/R2/R3）已由系統根據 product.json 算好，結果在 SYSTEM_ELIGIBILITY 中。
   - 你「不能」修改 is_eligible 或各 R1/R2/R3 的 pass 值
   - 最終輸出的 eligibility 欄位將由系統直接帶入，不由你決定
2. 你主要負責：
   - 根據 extracted_case + LITE_POLICY 判斷 SNAD（snad_assessment）
   - 根據案件內容列出 evidence_checklist
   - 產生 cs_summary（給客服看的摘要與方案建議）

你可以閱讀 SYSTEM_ELIGIBILITY 來理解案件是否在 scope 內，但不要改動裡面的 true/false。

【extracted_case（案件摘要）】
{extracted_block}
【extracted_case_END】

【product_info（訂單與商品結構化資訊）】
{product_block}
【product_info_END】

【SYSTEM_ELIGIBILITY（R1/R2/R3 已計算結果，只能讀不能改）】
{eligibility_block}
【SYSTEM_ELIGIBILITY_END】

【LITE_POLICY（SNAD 規則，僅供參考判斷用）】
{LITE_POLICY}
【LITE_POLICY_END】

請只輸出以下 JSON（三個欄位，不要包含 eligibility）：  

{{
  "snad_assessment": {{
    "is_snad": true/false/"unknown",
    "reasoning": ["...", "..."],
    "policy_citations": ["SND-501", "EVD-701", "..."]
  }},
  "evidence_checklist": {{
    "provided": ["EVD-701", "..."],
    "missing": ["EVD-702", "..."],
    "notes": ["...", "..."]
  }},
  "cs_summary": {{
    "short_summary": "...(3-5句)",
    "key_points": ["...", "..."],
    "suggested_resolution": ["A) ...", "B) ..."],
  }}
}}
""".strip()


# ===== 3. 呼叫 LLM 並組合最終輸出 =====

def run_stage2(case_folder: Path, extracted_case: Dict[str, Any], model: str = "gemma3:1b") -> Dict[str, Any]:
    product_path = case_folder / "product.json"
    if not product_path.exists():
        return {"error": f"找不到 product.json：{product_path}"}

    try:
        product = json.loads(product_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"error": "讀取 product.json 失敗", "detail": str(exc)}

    eligibility = compute_eligibility(product)
    prompt = build_stage2_prompt(extracted_case, product, eligibility)

    try:
        resp = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": "You are a strict SNAD decision engine. JSON only."},
                {"role": "user", "content": prompt},
            ],
            options={"temperature": 0.25, "top_p": 0.9},
        )
        raw = resp.get("message", {}).get("content", "").strip()
    except Exception as exc:
        return {"error": "Ollama 無法連線或模型不存在", "detail": str(exc)}

    fixed = _try_repair_json(raw)
    try:
        llm_part = json.loads(fixed)
    except Exception:
        return {"error": "Stage2 JSON parse failed", "raw_output": fixed}

    # 最終輸出：eligibility 用程式計算，其他三欄由 LLM 產生
    final_output: Dict[str, Any] = {
        "eligibility": eligibility,
    }
    final_output.update(llm_part)
    return final_output


def save_stage2_output(folder: Path, data: Dict[str, Any]) -> Path:
    out_path = folder / "final_output.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path
