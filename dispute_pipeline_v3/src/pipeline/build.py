"""
Stage 3 — Build Final Arbitration Output

This module merges:
- Stage 1 extracted data
- Stage 2 LLM classification (SNAD / Neutral / IE)
- Eligibility R1/R2/R3 flags
- Policy anchors (ELI / SND / OUT / FEE)
- Final caseSummary (human-readable block)

It does NOT call LLM. It only combines results.
"""

from __future__ import annotations
from typing import Dict, Any

from pipeline.rflags import evaluate_r_flags
from pipeline.policy import (
    compute_eligibility_policy_anchors,
    compute_snad_policy_anchors,
    compute_recommendation_policy_anchors,
    RECOMMENDATION_TEMPLATES,     # 🔥 新增：使用 policy.py 的文案模板
)
from pipeline.summary import build_case_summary


# ======================================================
# Build Recommendation Section (Stage 3)
# ======================================================
def _build_recommendation(label: str, stage2_rec: dict | None) -> dict:
    """
    Merge:
    - Recommendation templates from policy.py
    - Policy anchors (OUT-*, FEE-*, EVD-*)
    - Stage2 override (if any)

    Stage2 normally does NOT provide recommendation fields.
    This function ensures:
    - primaryOption.label
    - primaryOption.details
    - primaryOption.policyAnchors
    - alternativeOption.label/details (if applicable)
    """

    anchors = compute_recommendation_policy_anchors(label)
    template = RECOMMENDATION_TEMPLATES.get(label, {})

    stage2_rec = stage2_rec or {}

    # ---- Primary Option ----
    primary_template = template.get("primaryOption") or {}
    primary_stage2 = stage2_rec.get("primaryOption") or {}

    primary = {
        **primary_template,          # (label + details)
        **primary_stage2,            # allow Stage2 override
        "policyAnchors": anchors["primary"],
    }

    # ---- Alternative Option ----
    alt_template = template.get("alternativeOption")
    alt_stage2 = stage2_rec.get("alternativeOption") or {}

    if alt_template is None and not alt_stage2:
        alternative = None
    else:
        base = alt_template or {}
        alternative = {
            **base,
            **alt_stage2,
            "policyAnchors": anchors["alternative"],
        }

    return {
        "primaryOption": primary,
        "alternativeOption": alternative,
    }


# ======================================================
# Main builder
# ======================================================
def build_analysis(
    extracted: dict,
    stage2: dict,
    model_name: str
) -> Dict[str, Any]:
    """
    Build the final merged output:

    {
      "eligibility": {...},
      "snadResult": {...},
      "recommendation": {...},
      "caseSummary": "..."
    }
    """

    # -------- Stage 1 → Eligibility notes ----------
    method = extracted.get("transactionMethod")
    hours = extracted.get("disputeOpenedAfterHours")
    completed = extracted.get("orderCompleted")

    notes = _gen_eligibility_notes(method, hours, completed)

    # -------- Step 2 → Evaluate R1/R2/R3 ----------
    rflags = evaluate_r_flags(extracted)

    # -------- Step 3 → Eligibility policy anchors ----------
    eligibility_anchors = compute_eligibility_policy_anchors(extracted, rflags)

    eligibility = {
        "r1": rflags["r1"],
        "r2": rflags["r2"],
        "r3": rflags["r3"],
        "notes": notes,
        "policyAnchors": eligibility_anchors,
    }

    # -------- Stage 2 — SNAD result ----------
    snad = stage2.get("snadResult", {})
    raw_label = (snad.get("label") or "Neutral").strip()
    # Normalize label: remove anything inside parentheses, e.g. "Neutral (SND-502)" -> "Neutral"
    label = raw_label.split("(")[0].strip()
    # Save normalized label back
    snad["label"] = label

    # Assign SND-50x anchor
    snad["policyAnchors"] = compute_snad_policy_anchors(label)

    # -------- Stage 3 — Build Recommendation ----------
    recommendation = _build_recommendation(
        label,
        stage2.get("recommendation"),
    )

    # -------- Final human-readable summary ----------
    case_summary = build_case_summary(
        extracted,
        stage2,
        notes,
        model_name,
    )

    return {
        "eligibility": eligibility,
        "snadResult": snad,
        "recommendation": recommendation,
        "caseSummary": case_summary,
    }


# ======================================================
# Helper — Eligibility notes generation
# ======================================================
def _gen_eligibility_notes(method: str, hours: int, completed: bool) -> str:
    m = method or "In-app"
    h = "?" if hours is None else str(hours)
    status = "Order is completed" if completed else "Order is not yet completed"
    return f"{m}; opened ~{h}h after pickup; {status}"
