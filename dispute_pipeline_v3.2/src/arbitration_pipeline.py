#!/usr/bin/env python3
# src/arbitration_pipeline.py
# -*- coding: utf-8 -*-

"""
C2C Dispute Arbitration Pipeline (v3 Modular)
"""

from __future__ import annotations
import argparse
import json
from pathlib import Path

# === Import modules ===
from pipeline.extractor import extract_case, gen_eligibility_notes
from pipeline.rflags import evaluate_r_flags
from pipeline.stage2_llm import stage2_llm_evaluate
from pipeline.postprocess import postprocess_stage2_output
from pipeline.policy import (
    compute_eligibility_policy_anchors,
    compute_snad_policy_anchors,
    compute_recommendation_policy_anchors,
    RECOMMENDATION_TEMPLATES,  
)
from pipeline.summary import build_case_summary
from pipeline.outcome_ai import ai_summarize_outcome

from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()
# ======================================================
# Stage 3 — Recommendation Builder
# ======================================================
def _build_recommendation(label: str, stage2_rec: dict | None) -> dict:
    """
    Build recommendation using:
    - RECOMMENDATION_TEMPLATES (label + details)
    - compute_recommendation_policy_anchors (OUT-*, FEE-*)
    - Any stage2 overrides (normally none)

    Ensures recommendation always includes:
      primaryOption.label
      primaryOption.details
      primaryOption.policyAnchors
      alternativeOption (or None)
    """
    anchors = compute_recommendation_policy_anchors(label)
    template = RECOMMENDATION_TEMPLATES.get(label, {})

    stage2_rec = stage2_rec or {}

    # ---- Primary Option ----
    primary_template = template.get("primaryOption") or {}
    primary_stage2 = stage2_rec.get("primaryOption") or {}

    primary = {
        **primary_template,
        **primary_stage2,
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
# Stage 3 — Build Final Output
# ======================================================
def build_analysis(extracted: dict, stage2: dict, model_name: str) -> dict:

    # -------- 1) Eligibility notes ----------
    notes = gen_eligibility_notes(
        extracted.get("transactionMethod"),
        extracted.get("disputeOpenedAfterHours"),
        extracted.get("orderCompleted"),
    )

    # -------- 2) Evaluate R1/R2/R3 ----------
    rflags = evaluate_r_flags(extracted)

    # -------- 3) Eligibility anchors ----------
    eligibility_anchors = compute_eligibility_policy_anchors(extracted, rflags)

    eligibility = {
        "r1": rflags["r1"],
        "r2": rflags["r2"],
        "r3": rflags["r3"],
        "notes": notes,
        "policyAnchors": eligibility_anchors,
    }

    # -------- 4) Stage 2 — SNAD result ----------
    snad = stage2.get("snadResult", {})

    raw_label = snad.get("label", "Neutral")
    label = raw_label.split("(")[0].strip()
    snad["label"] = label

    # Add SND policy anchor
    snad["policyAnchors"] = compute_snad_policy_anchors(label)

    # -------- 5) Stage 3 — Build Recommendation ----------
    recommendation = _build_recommendation(
        label,
        stage2.get("recommendation"),   # Stage2 normally empty
    )

    # -------- 6) Summary ----------
    summary = build_case_summary(
        extracted,
        stage2,
        notes,
        "gemma3:1b",   # ← Stage 3 永遠使用本地模型
    )

    return {
        "eligibility": eligibility,
        "snadResult": snad,
        "recommendation": recommendation,
        "caseSummary": summary,
    }


# ======================================================
# Runner
# ======================================================
def run(case_id: str, data_dir: Path, out_dir: Path, model_name: str, debug_dump: bool):

    raw_path = data_dir / f"{case_id}_raw.json"
    out_dir.mkdir(exist_ok=True, parents=True)

    if not raw_path.exists():
        raise FileNotFoundError(f"Case file not found: {raw_path}")

    raw = json.loads(raw_path.read_text(encoding="utf-8"))

    # Stage 1
    extracted = extract_case(raw)

    # Stage 2
    stage2_raw = stage2_llm_evaluate(
        extracted,
        model_name=model_name,
        debug_dump_dir=out_dir if debug_dump else None,
        case_id=case_id,
    )

    stage2 = postprocess_stage2_output(stage2_raw)

    # Stage 3
    analysis = build_analysis(extracted, stage2, model_name)

    # Save
    out_path = out_dir / f"{case_id}_analysis.json"
    out_path.write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")

    return out_path


def main():
    parser = argparse.ArgumentParser(description="C2C Dispute Arbitration Pipeline v3")
    parser.add_argument("--case-id", default="case1")
    parser.add_argument("--data-dir", default="./data/source")
    parser.add_argument("--out-dir", default="./data/analysis")
    parser.add_argument("--model", default="gemma3:1b")
    parser.add_argument("--debug-dump", action="store_true")
    args = parser.parse_args()

    run(
        case_id=args.case_id,
        data_dir=Path(args.data_dir),
        out_dir=Path(args.out_dir),
        model_name=args.model,
        debug_dump=args.debug_dump,
    )


if __name__ == "__main__":
    main()
