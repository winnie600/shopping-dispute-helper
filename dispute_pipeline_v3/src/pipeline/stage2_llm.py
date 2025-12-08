# src/pipeline/stage2_llm.py  加在哪裡 
# ----------------------------------------
# Stage 2 — LLM SNAD / Neutral / Insufficient Evidence Classification
# ----------------------------------------

import json
import re
from pathlib import Path
from typing import Any, Dict, Optional

from pipeline.postprocess import clean_json_output, coerce_to_json
from langchain_ollama import OllamaLLM


# -------------------------------
# LLM Wrapper
# -------------------------------
def _get_llm(model_name: str):
    return OllamaLLM(model=model_name)


# -------------------------------
# Stage2 Prompt
# -------------------------------
STAGE2_PROMPT = """
You are a Taiwan C2C Arbitration Assistant. Respond **in English only**.
Follow the policy rules STRICTLY. If the facts do not show a clear SNAD breach, default to **Neutral (SND-502)**.
Use ONLY the allowed policy codes provided.

[POLICY RULES — STRICT]
SNAD (SND-501):
- Seller provided incorrect key information (e.g., wrong size label, wrong model, undisclosed repairs, undisclosed major defects, missing guaranteed accessories).
- Must involve an **objective, material mismatch** between listing → delivered item.

Neutral(SND-502):
- Subjective dissatisfaction or non-material differences (e.g., comfort, fit, expectations, minor wear, normal product variation).
- Applies whenever the seller’s information is accurate and no material mismatch exists.

Insufficient Evidence(SND-503):
- Buyer claims an issue but provides no objective evidence of mismatch.

[IMPORTANT FIT RULE — OVERRIDES ALL]
Issues about "fit", "snugness", "tightness", "runs small", "comfort", or “feels like a smaller size” DO NOT count as SNAD.
These are product characteristics or subjective sensations → ALWAYS classify as **Neutral (SND-502)** unless the **SIZE LABEL itself is incorrect**.

Examples:
- Buyer says “fits like 8.5” but box/listing show “US9” → Neutral.
- Model known to run small → Neutral.
- SNAD applies ONLY if the seller listed “US9” but the box label shows “US8.5”.


[WHEN TO CLASSIFY AS SNAD — ONLY IF ALL ARE TRUE]
1) Objective mismatch
2) Material mismatch
3) Seller information incorrect OR incomplete  
4) Undisclosed material fact (e.g., screen replaced, major repairs)
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



Respond ONLY with the JSON above.
""".strip()


# -------------------------------
# Stage 2 LLM Runner
# -------------------------------
def stage2_llm_evaluate(
    extracted: Dict[str, Any],
    model_name: str,
    debug_dump_dir: Optional[Path] = None,
    case_id: Optional[str] = None,
) -> Dict[str, Any]:

    # -------------------------------
    # Build FULL TEXT input for LLM
    # -------------------------------

    listing = extracted.get("listingSummary") or {}

    raw_listing_text = (
        f"Title: {listing.get('title','')}\n"
        f"Price: {listing.get('price','')}\n"
        f"Condition: {listing.get('condition','')}\n"
        f"Attributes: {listing.get('attributes','')}\n"
        f"Disclosed Flaws: {listing.get('disclosedFlaws','')}\n"
        f"Notes: {listing.get('notes','')}\n"
    )

    # Raw chat text (timeline already formatted as “time | sender: msg”)
    raw_chat_text = "\n".join(extracted.get("timeline") or [])

    # Raw complaint
    raw_complaint_text = extracted.get("complaintSummary") or ""

    # FINAL payload = summaries + full text
    payload = json.dumps(
        {
            "listingSummary": listing,
            "complaintSummary": raw_complaint_text,
            "highlightedIssues": extracted.get("highlightedIssues"),
            "timeline": extracted.get("timeline"),

            # NEW: Full original text — this fixes missing SNAD reason
            "rawListingText": raw_listing_text,
            "rawChatText": raw_chat_text,
            "rawComplaintText": raw_complaint_text,
        },
        ensure_ascii=False,
    )

    prompt = f"{STAGE2_PROMPT}\n\n---\nCase data:\n{payload}\n---"

    llm = _get_llm(model_name)

    # -------------------------------
    # LLM Call
    # -------------------------------
    raw = llm.invoke(prompt)

    # DEBUG: print raw LLM output
    print("\n================ RAW LLM OUTPUT ================\n")
    print(raw)
    print("\n================================================\n")


    # Debug dump
    if debug_dump_dir and case_id:
        debug_dump_dir.mkdir(exist_ok=True, parents=True)
        (debug_dump_dir / f"{case_id}_stage2_raw.txt").write_text(raw, encoding="utf-8")


    # -------------------------------
    # Try parsing JSON
    # -------------------------------
    cleaned = clean_json_output(raw)

    try:
        data = json.loads(cleaned)
    except Exception:
        # attempt recovery
        fixed = coerce_to_json(cleaned)
        data = json.loads(fixed)

        if debug_dump_dir and case_id:
            (debug_dump_dir / f"{case_id}_stage2_fixed.json").write_text(
                json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
            )

    # -------------------------------
    # Extract SNAD result
    # -------------------------------
    snad = data.get("snadResult", {}) or {}

    final_snad = {
        "label": snad.get("label", "Neutral"),
        "reason": snad.get("reason", "").strip(),
    }

    # If model STILL returns empty reason → fill it with fallback
    if final_snad["reason"] == "":
        final_snad["reason"] = "The decision is based on policy rules; no material mismatch was identified."

    return {"snadResult": final_snad}
