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


from openai import OpenAI
import os
from langchain_ollama import OllamaLLM

from dotenv import load_dotenv
load_dotenv()


# -----------------------------------
# Unified LLM Loader
# -----------------------------------
def _get_llm(model_name: str):
    """
    If model_name starts with 'openai:', call OpenAI model.
    Otherwise use Ollama local model.
    """

    if model_name.startswith("openai:"):
        real_name = model_name.replace("openai:", "")
        return OpenAILLMWrapper(real_name)
    else:
        return OllamaLLM(model=model_name)


class OpenAILLMWrapper:
    def __init__(self, model_name: str):
        from openai import OpenAI
        import os

        key = os.getenv("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY not found in environment variables.")

        self.client = OpenAI(api_key=key)
        self.model_name = model_name

    def invoke(self, prompt: str) -> str:
        """
        Simulate the same interface as OllamaLLM.invoke(prompt),
        returning ONLY the model's text output.
        """

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=2048,   # 足夠你的 JSON 輸出
        )

        return response.choices[0].message.content


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
- Change-of-mind returns (e.g., buyer no longer wants item, misordered, found cheaper elsewhere)
  are ALWAYS Neutral because no objective mismatch exists.

Insufficient Evidence(SND-503):
- Buyer claims an issue but provides no objective evidence of mismatch.

[IMPORTANT FIT RULE — OVERRIDES ALL]
Issues about "fit", "snugness", "tightness", "runs small", "comfort", or “feels like a smaller size” DO NOT count as SNAD.
These are product characteristics or subjective sensations → ALWAYS classify as **Neutral (SND-502)** unless the **SIZE LABEL itself is incorrect**.

Examples:
- Buyer says “fits like 8.5” but box/listing show “US9” → Neutral.
- Model known to run small → Neutral.

[COLOR & LIGHTING RULE — ALWAYS NEUTRAL]
Color differences caused by lighting, angles, photography, camera settings, or screen display variation
do NOT qualify as SNAD. These are considered normal product variation and subjective perception.
Unless the seller explicitly stated a specific color that materially differs from the delivered item,
these cases must ALWAYS be classified as Neutral (SND-502).


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
    raw_snad = data.get("snadResult", {})

    # Normalize SNAD result — LLM may return a string like "SNAD"
    if isinstance(raw_snad, str):
        snad = {"label": raw_snad}
    elif isinstance(raw_snad, dict):
        snad = raw_snad
    else:
        snad = {}

    # reason may appear at top-level OR inside snadResult
    reason = data.get("reason") or snad.get("reason", "") or ""


    final_snad = {
        "label": snad.get("label", "Neutral"),
        "reason": snad.get("reason", "").strip(),
    }

    # Fallback reason (LLM sometimes omits it)
    if final_snad["reason"] == "":
        final_snad["reason"] = "No reason provided by the model."

    return {"snadResult": final_snad}
