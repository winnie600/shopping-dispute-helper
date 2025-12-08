# src/pipeline/summary.py
"""
Build the final human-readable caseSummary block.

Responsibilities:
-----------------
- Convert SNAD reason → Key line
- Use AI summarizer (if available) to summarize final outcome
- If no outcome detected → fall back to showing Rec A/B choices
- Extract order ID from Stage 1 metadata
"""

from __future__ import annotations
from typing import List, Optional, Dict

import re
from pipeline.outcome_ai import ai_summarize_outcome

# Regex 用來從 reason 抓引號內容
_Q = re.compile(r'"([^"]+)"')


# -----------------------------
# Extract order ID
# -----------------------------
def extract_order_id(order_meta: list) -> Optional[str]:
    if not isinstance(order_meta, list):
        return None

    for item in order_meta:
        if (
            isinstance(item, dict)
            and str(item.get("label", "")).lower() == "order id"
        ):
            value = item.get("value")
            if isinstance(value, str) and value.strip():
                return value.strip()

    return None


# -----------------------------
# Turn reason → Key summary
# -----------------------------
def extract_key_from_reason(reason: str) -> str:
    if not isinstance(reason, str):
        return "Decision rationale available."

    quotes = _Q.findall(reason)

    if len(quotes) >= 2:
        return f"“{quotes[0]}” vs “{quotes[1]}”"
    if len(quotes) == 1:
        return f"“{quotes[0]}”"

    reason = reason.strip()
    return reason if len(reason) <= 400 else reason[:397] + "..."


# -----------------------------
# Convert Rec options to lines
# -----------------------------
def summarize_rec_option(opt: dict, prefix: str) -> str:
    if not isinstance(opt, dict):
        return f"{prefix}) -"

    label = (opt.get("label") or "").strip() or "-"
    details = opt.get("details") or ""

    tokens = []
    det_l = details.lower()

    if "nt$60" in det_l:
        tokens.append("NT$60")
    if "return label" in det_l:
        tokens.append("label")
    if "15–30%" in details or "15-30%" in details:
        tokens.append("15–30%")

    if tokens:
        return f"{prefix}) {label} + " + " + ".join(tokens)
    return f"{prefix}) {label}"


# -----------------------------
# Build final case summary
# -----------------------------
def build_case_summary(extracted: dict, stage2: dict, eligibility_notes: str, model_name: str) -> str:

    # Basic fields
    order_id = extract_order_id(extracted.get("orderMeta"))

    reason = (stage2.get("snadResult", {}).get("reason") or "").strip()
    label = (stage2.get("snadResult", {}).get("label") or "Neutral").strip()
    rec = stage2.get("recommendation") or {}

    # Convert reason → key summary
    key_line = extract_key_from_reason(reason)

    # A/B lines (fallback)
    a_line = summarize_rec_option(rec.get("primaryOption", {}), "A")
    b_line = summarize_rec_option(rec.get("alternativeOption", {}), "B")

    # Try to summarize final outcome using AI
    timeline = extracted.get("timeline") or []
    outcome = ai_summarize_outcome(timeline, model_name)

    # -----------------------------
    # Build final text block
    # -----------------------------
    lines = []

    if order_id:
        lines.append(f"Order: {order_id}")

    lines.append("Eligibility: R1/R2/R3 ✅")
    lines.append(f"Key: {key_line}")
    lines.append(f"Decision: {label}")

    if outcome:
        # If there's a real outcome → display it
        lines.append(f"Outcome: {outcome}")
    else:
        # Otherwise show standard A/B recommendations
        lines.append("Rec:")
        lines.append(f" {a_line}")
        lines.append(f" {b_line}")

    return "\n".join(lines)
