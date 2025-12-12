# src/pipeline/postprocess.py
"""
Post-processing utilities for Stage 2 LLM output.

This module ensures:
- JSON is extracted correctly (even if the LLM adds extra text)
- Only allowed keys remain in snadResult (label + reason)
- No hallucinated keys (e.g., "weight", "why", "score")
- JSON formatting cleanup (remove trailing commas, quotes, comments)
"""

from __future__ import annotations
import json
import re
from typing import Dict, Any

# Allowed keys inside snadResult
ALLOWED_SNAD_KEYS = {"label", "reason"}

# -------------------------------------------------------------
# JSON CLEANING UTILITIES
# -------------------------------------------------------------

def clean_json_output(text: str) -> str:
    """
    Remove Markdown fences ```json ... ```
    """
    t = text.strip()

    if t.startswith("```"):
        t = t[t.find("\n") + 1 :]

    if t.endswith("```"):
        t = t[: t.rfind("```")]

    return t.strip()


def extract_json_block(text: str) -> str:
    """
    Extract the first {...} JSON object from the output.
    Handles nested braces.
    """
    start = text.find("{")
    if start == -1:
        return text  # fallback — not ideal but safer

    depth = 0
    in_str = False
    escape = False

    for i in range(start, len(text)):
        c = text[i]

        if in_str:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
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
    """
    Remove JS-style // and /* */ comments.
    """
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"(^|\s)//.*?$", r"\1", text, flags=re.MULTILINE)
    return text


def fix_trailing_commas(text: str) -> str:
    """
    Remove trailing commas before } or ]
    """
    return re.sub(r",\s*([}\]])", r"\1", text)


def normalize_quotes(text: str) -> str:
    """
    Normalize curly quotes → straight quotes.
    """
    return text.translate(str.maketrans({
        "“": '"', "”": '"',
        "‘": "'", "’": "'"
    }))


def coerce_to_json(text: str) -> str:
    """
    Perform all cleaning & return a JSON string ready for json.loads().
    """
    s = extract_json_block(text)
    s = strip_json_comments(s)
    s = normalize_quotes(s)
    s = fix_trailing_commas(s)
    return s.strip()


# -------------------------------------------------------------
# MAIN POSTPROCESS FUNCTION
# -------------------------------------------------------------

def postprocess_stage2_output(text):
    """
    Accepts either:
    - raw LLM string output
    - already-parsed dict (if the LLM wrapper auto-parsed JSON)

    Ensures final output is a dict with only allowed SNAD keys.
    """

    # --- CASE 1: Already dict (common when Ollama auto-parses JSON) ---
    if isinstance(text, dict):
        return _clean_snad_dict(text)

    # --- CASE 2: It is a string → must clean + parse ---
    if not isinstance(text, str):
        raise TypeError(f"Stage2 output must be dict or str, got: {type(text)}")

    # Continue with string-cleaning pipeline
    cleaned = clean_json_output(text)
    cleaned = extract_json_block(cleaned)
    cleaned = strip_json_comments(cleaned)
    cleaned = normalize_quotes(cleaned)
    cleaned = fix_trailing_commas(cleaned)

    try:
        data = json.loads(cleaned)
    except Exception:
        raise ValueError("Failed to parse Stage2 JSON output")

    return _clean_snad_dict(data)


def _clean_snad_dict(data):
    """Remove illegal keys and enforce allowed schema."""
    snad = data.get("snadResult", {})
    ALLOWED_SNAD_KEYS = {"label", "reason"}

    clean = {k: v for k, v in snad.items() if k in ALLOWED_SNAD_KEYS}

    # Guarantee required fields exist
    clean.setdefault("label", "Neutral")
    clean.setdefault("reason", "")

    # Put back into structure
    data["snadResult"] = clean
    return data
