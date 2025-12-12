#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Initial Judgement Chatbot — for first-stage SNAD assessment
Supports:
- --file : directly specify any JSON file
- --case-id : fallback to case_id_raw.json
"""

from __future__ import annotations
import argparse
import json
from pathlib import Path

from pipeline.extractor import extract_case
from pipeline.stage2_llm import stage2_llm_evaluate
from pipeline.postprocess import postprocess_stage2_output
from pipeline.policy import (
    compute_snad_policy_anchors,
    compute_recommendation_policy_anchors,
    RECOMMENDATION_TEMPLATES,
)


# ======================================================
# Build human-readable chatbot reply
# ======================================================
def build_chatbot_reply(extracted: dict, stage2: dict) -> str:

    snad = stage2.get("snadResult", {})
    raw_label = snad.get("label", "Neutral")
    label = raw_label.split("(")[0].strip()
    reason = snad.get("reason", "No reason provided.")

    template = RECOMMENDATION_TEMPLATES.get(label, {})
    primary = template.get("primaryOption", {})
    alternative = template.get("alternativeOption", {})

    chatbot_text = f"""
📌 **初次仲裁結果（AI Preliminary Judgement）**

根據案件資料與雙方聊天紀錄，此案件的初步判定為：

👉 **{label}**

**原因：**  
{reason}

---

### 🎯 建議處理方式（Recommendations）

**方案 A — {primary.get("label", "")}**  
{primary.get("details", "")}
"""

    if alternative:
        chatbot_text += f"""
**方案 B — {alternative.get("label", "")}**  
{alternative.get("details", "")}
"""

    chatbot_text += "\n如需進一步處理，也可要求補件或升級人工仲裁。"
    return chatbot_text.strip()


# ======================================================
# Runner
# ======================================================
def run(case_id: str, data_dir: Path, model_name: str, file_path: str | None):

    # ---------- Load JSON ----------
    if file_path:
        raw_path = Path(file_path)
    else:
        raw_path = data_dir / f"{case_id}_raw.json"

    if not raw_path.exists():
        raise FileNotFoundError(f"Case file not found: {raw_path}")

    raw = json.loads(raw_path.read_text(encoding="utf-8"))

    # ---------- Stage 1 ----------
    extracted = extract_case(raw)

    # ---------- Stage 2 (OpenAI Model) ----------
    stage2_raw = stage2_llm_evaluate(
        extracted,
        model_name=model_name,
    )
    stage2 = postprocess_stage2_output(stage2_raw)

    # ---------- Build chatbot answer ----------
    reply = build_chatbot_reply(extracted, stage2)
    return reply


def main():
    parser = argparse.ArgumentParser(description="Initial Judgement Chatbot")
    parser.add_argument("--case-id", default="case1", help="Case ID (used if --file not provided)")
    parser.add_argument("--data-dir", default="./data/source")
    parser.add_argument("--model", default="openai:gpt-4o-mini")
    parser.add_argument("--file", help="Direct path to raw JSON file", default=None)
    args = parser.parse_args()

    text = run(
        case_id=args.case_id,
        data_dir=Path(args.data_dir),
        model_name=args.model,
        file_path=args.file,
    )

    print("\n==============================")
    print("AI 初次判定（Chatbot 回應）")
    print("==============================\n")
    print(text)
    print("\n")


if __name__ == "__main__":
    main()
