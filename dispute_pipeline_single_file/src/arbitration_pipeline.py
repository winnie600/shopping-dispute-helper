#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C2C Dispute Arbitration Pipeline — with corrected Stage 2 prompt (Neutral for fit/snugness cases)

- Eligibility: original rule-based output
- Stage 2: LLM outputs SNAD / Neutral / Insufficient Evidence using STRICT policy rules
- Stage 3: only formats final JSON (no modification to Stage 2 logic)
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional, List

# ===== Whitelist policy codes =====
ALLOWED_POLICY_CODES: List[str] = [
    "SND-501", "SND-502", "SND-503",
    "EVD-701", "EVD-702", "EVD-703", "EVD-704",
    "OUT-801", "OUT-802", "OUT-803",
    "FEE-A", "FEE-B", "FEE-C",
]

# ---------- Stage 1: Extract ----------
def extract_case(raw_data: dict) -> dict:
    listing = raw_data.get("listingInfo", {})
    complaint = raw_data.get("complaint", "")
    chat = raw_data.get("chatlog", [])
    highlighted_msgs = [
        msg for msg in chat
        if isinstance(msg, dict) and msg.get("highlight") is True
    ]
    timeline = [
        f"{msg['timestamp']} | {msg['sender']}: {msg['text']}"
        for msg in chat
        if isinstance(msg, dict) and "timestamp" in msg and "sender" in msg and "text" in msg
    ]

    return {
        "caseId": raw_data.get("id"),
        "title": raw_data.get("title"),
        "orderMeta": raw_data.get("orderMeta", []),
        "listingSummary": {
            "title": listing.get("title"),
            "price": listing.get("listedPrice"),
            "condition": listing.get("condition"),
            "attributes": listing.get("attributes"),
            "disclosedFlaws": listing.get("disclosedFlaws"),
            "notes": listing.get("notes"),
        },
        "complaintSummary": complaint,
        "highlightedIssues": highlighted_msgs,
        "timeline": timeline,
        "transactionMethod": raw_data.get("transactionMethod"),
        "disputeOpenedAfterHours": raw_data.get("disputeOpenedAfterHours"),
        "orderCompleted": raw_data.get("orderCompleted"),
    }

# ---------- Eligibility notes ----------
def gen_eligibility_notes(method: Optional[str], hours: Optional[int], completed: Optional[bool]) -> str:
    m = method or "In-app"
    h = "?" if hours is None else str(hours)
    status = "Order is completed" if completed is True else "Order is not yet completed"
    return f"{m}; opened ~{h}h after pickup; {status}"

# ---------- LLM + JSON utilities ----------
def _get_llm(model_name: str):
    try:
        from langchain_ollama import OllamaLLM  # type: ignore
    except Exception as e:
        raise RuntimeError("Install dependency: pip install langchain-ollama") from e
    return OllamaLLM(model=model_name)

def clean_json_output(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t[t.find("\n") + 1 :]
    if t.endswith("```"):
        t = t[: t.rfind("```")]
    return t.strip()

def extract_json_block(text: str) -> str:
    start = text.find("{")
    if start == -1:
        return text
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
    return text[start:]

def strip_json_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"(^|\s)//.*?$", r"\1", text, flags=re.MULTILINE)
    return text

def fix_trailing_commas(text: str) -> str:
    return re.sub(r",\s*([}\]])", r"\1", text)

def normalize_quotes(text: str) -> str:
    return text.translate(str.maketrans({"“": '"', "”": '"', "‘": "'", "’": "'"}))

def coerce_to_json(text: str) -> str:
    s = extract_json_block(text.strip())
    s = strip_json_comments(s)
    s = normalize_quotes(s)
    s = fix_trailing_commas(s)
    return s.strip()


# ---------- Stage 2: LLM call ----------
def evaluate_eligibility(
    extracted: Dict[str, Any],
    model_name: str,
    debug_dump_dir: Optional[Path] = None,
    case_id: Optional[str] = None,
) -> Dict[str, Any]:

    # ========= NEW OPTIMIZED PROMPT =========
    prompt = """
You are a Taiwan C2C Arbitration Assistant. Respond **in English only**.
Follow the policy rules STRICTLY. If the facts do not show a clear SNAD breach, default to **Neutral (SND-502)**.
Use ONLY the allowed policy codes provided.

[POLICY RULES — STRICT]
SNAD (SND-501):
- Seller provided incorrect key information (e.g., wrong size label, wrong model, undisclosed repairs, undisclosed major defects, missing guaranteed accessories).
- Must involve an **objective, material mismatch** between listing → delivered item.

Neutral (SND-502):
- Subjective dissatisfaction or non-material differences (e.g., comfort, fit, expectations, minor wear, normal product variation).
- Applies whenever the seller’s information is **accurate** and no material mismatch exists.

Insufficient Evidence (SND-503):
- Buyer claims an issue but provides no objective evidence of mismatch.

[IMPORTANT FIT RULE — OVERRIDES ALL]
Issues about "fit", "snugness", "tightness", "runs small", "comfort", or “feels like a smaller size” **DO NOT count as SNAD**.
These are product characteristics or subjective sensations → ALWAYS classify as **Neutral (SND-502)** unless the **SIZE LABEL itself is incorrect**.

Examples:
- Buyer says “fits like 8.5” but box/listing show “US9” → Neutral.
- Model known to run small → Neutral.
- SNAD applies ONLY if the seller listed “US9” but the box label shows “US8.5”.

[WHEN TO CLASSIFY AS SNAD — ONLY IF ALL ARE TRUE]
1) Objective mismatch
2) Material mismatch
3) The seller’s provided information is incorrect OR incomplete  
4) The seller failed to proactively disclose a material fact (e.g., replaced screen, battery, or major component)
If any is missing → must be Neutral(SND-502).

[OUTPUT FORMAT — STRICT JSON ONLY]
{
  "snadResult": {
    "label": "SNAD" | "Neutral" | "Insufficient Evidence",
    "reason": "One-line English reason explaining the decision."
  }
}


[REASON RULES — REQUIRED]
- The "reason" field is MANDATORY for all labels.
- For SNAD: You MUST describe the material mismatch.
- For SNAD: You MAY include 1–2 quoted fragments, but quoting is OPTIONAL.
- For SNAD: If you cannot find suitable quotes, explain the mismatch clearly in plain English.
- For Neutral: MUST clearly explain why the issue does not qualify as SNAD.
- For Neutral: quoting is OPTIONAL.
- You MUST NOT omit the reason field under any circumstances.
- Do NOT invent mismatches.
- If no material mismatch → reason supports Neutral.
- If evidence incomplete → Insufficient Evidence.

Analyze the listing, complaint, highlighted chat, and timeline below.
Respond ONLY with the JSON object above.
""".strip()
    # ========================================

    case_payload = json.dumps(
        {
            "listing": extracted.get("listingSummary"),
            "complaint": extracted.get("complaintSummary"),
            "issues": extracted.get("highlightedIssues"),
            "timeline": extracted.get("timeline"),
        },
        ensure_ascii=False,
    )

    full_prompt = f"{prompt}\n---\nCase data:\n{case_payload}\n---"

    llm = _get_llm(model_name)
    raw = llm.invoke(full_prompt)
    cleaned = clean_json_output(raw)

    try:
        return _postprocess_json(cleaned)
    except Exception:
        fixed = coerce_to_json(cleaned)
        try:
            return _postprocess_json(fixed)
        finally:
            if debug_dump_dir and case_id:
                debug_dump_dir.mkdir(parents=True, exist_ok=True)
                (debug_dump_dir / f"{case_id}_llm_raw.txt").write_text(raw, encoding="utf-8")
                (debug_dump_dir / f"{case_id}_llm_fixed.json").write_text(fixed, encoding="utf-8")

# ---- Post-parse helpers ----

def normalize_recommendation_to_english(rec: Optional[dict], label: str) -> dict:
    """
    ALWAYS use fixed recommendation templates based on label.
    LLM-generated recommendations are ignored entirely.
    """
    
    if label == "SNAD":
        primary = {
            "label": "Return & Full Refund",
            "details": "Seller reimburses NT$60 COD shipping and provides a return label."
        }
        alt = {
            "label": "Partial Refund & Keep Item",
            "details": "Buyer keeps the item; offer 15–30% partial refund."
        }

    elif label == "Neutral":
        primary = {
            "label": "Partial Refund & Keep Item",
            "details": "Buyer keeps the item; offer 15–30% partial refund."
        }
        alt = {
            "label": "Return & Full Refund",
            "details": "Buyer covers NT$60 shipping."
        }

    else:  # "Insufficient Evidence"
        primary = {
            "label": "Provide Missing Evidence",
            "details": "Request receipts/serial/unboxing photos (EVD-701..704)."
        }
        alt = {
            "label": "Hold",
            "details": "Await evidence before action."
        }

    return {"primaryOption": primary, "alternativeOption": alt}


def _postprocess_json(text: str) -> Dict[str, Any]:

    data = json.loads(text)
    snad = data.setdefault("snadResult", {})

    label = snad.get("label", "Neutral")
    if label not in ("SNAD", "Neutral", "Insufficient Evidence"):
        label = "Neutral"
    snad["label"] = label

    # Only keep allowed keys in snadResult
    ALLOWED_SNAD_KEYS = {"label", "reason"}
    snad = snad or {}
    snad_clean = {k: v for k, v in snad.items() if k in ALLOWED_SNAD_KEYS}
    snad.clear()
    snad.update(snad_clean)


    #  不再信任 LLM 給的 policyAnchors，先拿掉
    snad["policyAnchors"] = []

    if "recommendation" in snad:
        rec_val = snad.pop("recommendation")
        if isinstance(rec_val, dict) and "recommendation" not in data:
            data["recommendation"] = rec_val

    for obj in (data, snad, data.get("recommendation") or {}):
        if isinstance(obj, dict):
            obj.pop("return", None)
            obj.pop("status", None)

    data["recommendation"] = normalize_recommendation_to_english(data.get("recommendation"), label)
    data["snadResult"] = snad
    return data

def evaluate_r_flags(extracted: dict) -> dict:
    """
    Evaluate R1 / R2 / R3 based on raw extracted fields:
    - R1: Protected channel (In-app / Escrow / 7-ELEVEN COD) → ELI-301
    - R2: Dispute filed within dispute window (hours != None) → ELI-302
    - R3: Order not completed → ELI-303
    """
    # ----- R1: Protected channel -----
    method = (extracted.get("transactionMethod") or "").lower()
    protected_keywords = ["in-app", "escrow", "7-eleven cod", "cod"]
    r1 = any(k in method for k in protected_keywords)

    # ----- R2: Within dispute window -----
    # 如你未來要改成 <=48h，也只要改這裡
    hours = extracted.get("disputeOpenedAfterHours")
    r2 = hours is not None

    # ----- R3: Order NOT completed -----
    r3 = extracted.get("orderCompleted") is False

    return {"r1": r1, "r2": r2, "r3": r3}


# ---------- Policy Anchor Auto-Fill Helpers ----------

def compute_eligibility_policy_anchors(extracted: dict, rflags: dict) -> List[str]:
    """
    Return the correct eligibility anchors based on R1/R2/R3 results.
    If any R flag is False → OUT OF SCOPE (ELI-304).
    """
    r1, r2, r3 = rflags["r1"], rflags["r2"], rflags["r3"]

    # 若有任何不符 → Out of scope
    if not (r1 and r2 and r3):
        return ["ELI-304"]

    anchors = []
    if r1: anchors.append("ELI-301")
    if r2: anchors.append("ELI-302")
    if r3: anchors.append("ELI-303")
    return anchors



def compute_snad_policy_anchors(label: str) -> List[str]:
    """
    根據 SNAD / Neutral / IE 決定 SNAD 區塊的政策碼
    """
    if label == "SNAD":
        return ["SND-501"]
    elif label == "Neutral":
        return ["SND-502"]
    elif label == "Insufficient Evidence":
        return ["SND-503"]
    return []

def compute_recommendation_policy_anchors(label: str) -> Dict[str, List[str]]:
    """
    Assign OUT-* (Outcome policy) and FEE-* (Fee responsibility policy) 
    codes based on the arbitration decision type.

    ─────────────────────────────────────────────
    SNAD (SND-501)
    ─────────────────────────────────────────────
    若賣家資訊錯誤造成「商品與描述不符」，平台標準結果為：
    - Primary (主方案)：Return & Full Refund
      → OUT-801：SNAD 的標準主要處理方式為退貨退款
      → FEE-A：賣家需負擔退貨運費（如 7-11 NT$60）

    - Alternative (備案)：Partial Refund & Keep Item
      → OUT-802：買家保留商品後給予部分退款（常用 15–30% 區間）
      → FEE-C：無物流費產生（因為不退貨）

    ─────────────────────────────────────────────
    Neutral (SND-502)
    ─────────────────────────────────────────────
    雙方皆無過錯；通常處理方式較「柔和」：
    - Primary：Partial Refund（輕微補償即可）
      → OUT-802：對 Neutral 案件常提供部分退款以求和解
      → FEE-C：不用退貨，所以沒有物流費

    - Alternative：Return & Full Refund（由買家負擔費用）
      → OUT-801：買家若希望退貨，也可走標準退貨流程
      → FEE-B：Neutral 案件中物流費由買家自行吸收（不是賣家過錯）

    ─────────────────────────────────────────────
    Insufficient Evidence (SND-503)
    ─────────────────────────────────────────────
    證據不足時：
    - Primary：請買家補證據（EVD 系列）
      → SND-503：代表案件尚未可決，需要更多資訊
      → EVD-701..704：證據清單（序號、開箱照、聊天紀錄等）

    - Alternative：Hold（暫緩）
      → SND-503：等待證據，不做進一步判決
    """

    if label == "SNAD":
        primary = ["OUT-801", "FEE-A"]
        alternative = ["OUT-802", "FEE-C"]

    elif label == "Neutral":
        primary = ["OUT-802", "FEE-C"]
        alternative = ["OUT-801", "FEE-B"]

    else:  # Insufficient Evidence (SND-503)
        primary = ["SND-503", "EVD-701", "EVD-702", "EVD-703", "EVD-704"]
        alternative = ["SND-503"]

    return {"primary": primary, "alternative": alternative}


def ai_summarize_outcome(timeline: List[str], model_name: str) -> Optional[str]:
    """
    Use a small LLM (Gemma3 1B/2B) to generate a 1-line English summary 
    of the final dispute resolution outcome.
    """

    if not timeline:
        return None

    # 抓最後 3~5 則訊息（越少越準）
    recent = "\n".join(timeline[-5:])

    prompt = f"""
Summarize the final outcome of this C2C dispute in ONE short English sentence.

Rules:
- Do NOT quote the chat message.
- Do NOT restate timestamps or usernames.
- Do NOT invent details.
- Focus ONLY on the final agreement or resolution.
- Output must be a single short sentence.

Chat history:
{recent}

Output format:
Outcome: <one short sentence>
""".strip()

    llm = _get_llm(model_name)
    raw = llm.invoke(prompt).strip()

    # 確保格式正確
    if raw.lower().startswith("outcome:"):
        return raw[len("Outcome:"):].strip()

    return raw  # fallback（通常模型會乖乖產生）



# ---------- Case summary ----------
def _get_order_id(order_meta: list) -> Optional[str]:
    if not isinstance(order_meta, list):
        return None
    for it in order_meta:
        if isinstance(it, dict) and str(it.get("label")).lower() == "order id":
            v = it.get("value")
            if isinstance(v, str) and v.strip():
                return v.strip()
    return None

_Q = re.compile(r'"([^"]+)"')

def _extract_key_from_reason(reason: str) -> str:
    if not isinstance(reason, str):
        return "Decision rationale available in reason."
    quotes = _Q.findall(reason)
    if len(quotes) >= 2:
        return f"“{quotes[0]}” vs “{quotes[1]}”"
    if len(quotes) == 1:
        return f"“{quotes[0]}”"
    s = reason.strip()
    return s if len(s) <= 500 else s[:493] + "..."

def _summarize_rec_option(opt: dict, prefix: str) -> str:
    if not isinstance(opt, dict):
        return f"{prefix}) -"
    lbl = (opt.get("label") or "").strip() or "-"
    det = (opt.get("details") or "")
    tokens: List[str] = []
    det_l = det.lower()
    if "nt$60" in det_l:
        tokens.append("NT$60")
    if "return label" in det_l:
        tokens.append("label")
    if "15–30%" in det or "15-30%" in det:
        tokens.append("15–30%")
    if tokens:
        return f"{prefix}) {lbl} + " + " + ".join(tokens)
    if "15–30%" in det or "15-30%" in det:
        return f"{prefix}) {lbl} (15–30%)"
    return f"{prefix}) {lbl}"


def build_case_summary(extracted: dict, stage2: dict, eligibility_notes: str, model_name: str) -> str:
    order_id = _get_order_id(extracted.get("orderMeta"))
    reason = ((stage2.get("snadResult") or {}).get("reason") or "").strip()
    label = ((stage2.get("snadResult") or {}).get("label") or "Neutral").strip()
    rec = stage2.get("recommendation") or {}

    # A/B 建議短句（備用）
    a_line = _summarize_rec_option(rec.get("primaryOption", {}), "A")
    b_line = _summarize_rec_option(rec.get("alternativeOption", {}), "B")

    key_line = _extract_key_from_reason(reason)

    # ⭐ 新增：試著從 timeline 抓是否已經有「實際結果」
    timeline = extracted.get("timeline") or []
    outcome = ai_summarize_outcome(timeline, model_name)

    lines = []
    if order_id:
        lines.append(f"Order: {order_id}")
    lines.append("Eligibility: R1/R2/R3 ✅")
    lines.append(f"Key: {key_line}")
    lines.append(f"Decision: {label}")

    if outcome:
        # 若已協調完成，就顯示 Outcome，不再列 Rec A/B
        lines.append(f"Outcome: {outcome}")
    else:
        # 否則顯示建議選項 Rec A/B（給尚未處理的案件用）
        lines.append("Rec:")
        lines.append(f" {a_line}")
        lines.append(f" {b_line}")

    return "\n".join(lines)


# ---------- Stage 3 ----------
def build_analysis(extracted: dict, stage2: dict, model_name: str) -> dict:
    notes = gen_eligibility_notes(
        method=extracted.get("transactionMethod"),
        hours=extracted.get("disputeOpenedAfterHours"),
        completed=extracted.get("orderCompleted"),
    )
    
    # 1) 取得 R1/R2/R3 結果
    rflags = evaluate_r_flags(extracted)

    # 2) 取得 eligibility policy anchors
    eligibility_anchors = compute_eligibility_policy_anchors(extracted, rflags)

    # 3) 填入 eligibility 區塊
    eligibility = {
        "r1": rflags["r1"],
        "r2": rflags["r2"],
        "r3": rflags["r3"],
        "notes": notes,
        "policyAnchors": eligibility_anchors
    }

    # 4) SNAD label
    snad = stage2.get("snadResult") or {}
    label = (snad.get("label") or "Neutral").strip()
    snad["policyAnchors"] = compute_snad_policy_anchors(label)

    # 5) Recommendation policy anchors
    rec = stage2.get("recommendation") or {}
    anchors_rec = compute_recommendation_policy_anchors(label)

    primary = rec.get("primaryOption") or {}
    alt = rec.get("alternativeOption") or {}

    primary["policyAnchors"] = anchors_rec["primary"]
    alt["policyAnchors"] = anchors_rec["alternative"]

    rec["primaryOption"] = primary
    rec["alternativeOption"] = alt

    # 6) Summary
    case_summary = build_case_summary(extracted, stage2, notes, model_name)

    return {
        "eligibility": eligibility,
        "snadResult": snad,
        "recommendation": rec,
        "caseSummary": case_summary,
    }


# ---------- Runner ----------
def run(case_id: str, data_dir: Path, out_dir: Path, model_name: str, debug_dump: bool) -> Path:
    raw_path = data_dir / f"{case_id}_raw.json"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{case_id}_analysis.json"

    if not raw_path.exists():
        raise FileNotFoundError(f"No raw data found for {case_id}: {raw_path}")
    try:
        raw = json.loads(raw_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {raw_path}") from e

    extracted = extract_case(raw)
    stage2 = evaluate_eligibility(
        extracted,
        model_name=model_name,
        debug_dump_dir=out_dir if debug_dump else None,
        case_id=case_id,
    )
    analysis = build_analysis(extracted, stage2, model_name)
    out_path.write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path

def main() -> None:
    parser = argparse.ArgumentParser(description="C2C Dispute Arbitration Pipeline")
    parser.add_argument("--case-id", default="case1")
    parser.add_argument("--data-dir", default="./data/source")
    parser.add_argument("--out-dir", default="./data/analysis")
    parser.add_argument("--model", default="gemma3:1b")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--debug-dump", action="store_true", default=True)
    parser.add_argument("--no-debug-dump", dest="debug_dump", action="store_false")
    parser.add_argument("--verbose", action="store_true")

    args = parser.parse_args()
    data_dir = Path(args.data_dir)
    out_dir = Path(args.out_dir)

    if args.dry_run:
        raw_path = data_dir / f"{args.case_id}_raw.json"
        raw = json.loads(raw_path.read_text(encoding="utf-8"))
        extracted = extract_case(raw)
        notes = gen_eligibility_notes(
            method=extracted.get("transactionMethod"),
            hours=extracted.get("disputeOpenedAfterHours"),
            completed=extracted.get("orderCompleted"),
        )
        preview = {"eligibilityNotes_example": notes, "extracted": extracted}
        out_path = out_dir / f"{args.case_id}_stage1.json"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(preview, indent=2, ensure_ascii=False), encoding="utf-8")
        return

    out_path = run(
        args.case_id,
        data_dir=data_dir,
        out_dir=out_dir,
        model_name=args.model,
        debug_dump=args.debug_dump,
    )

if __name__ == "__main__":
    main()
