#!/usr/bin/env python3
"""
C2C Shopping Dispute Helper - Two Stage (Eligibility by Code)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from stage1_extract import run_stage1, save_stage1_output
from stage2_snad import run_stage2, save_stage2_output


# ---------------------------
# Argument Parser
# ---------------------------

def build_arg_parser():
    p = argparse.ArgumentParser(description="C2C Dispute Helper - Two Stage Pipeline")
    p.add_argument("--case-folder", default="data/case1",
                   help="資料夾路徑，例如 data/case1")
    p.add_argument("--model", default="gemma3:1b",
                   help="Ollama 模型名稱（例如 gemma3:1b）")
    p.add_argument("--only", choices=["extract", "decide"], default=None,
                   help="只跑某一階段")
    return p


# ---------------------------
# Main
# ---------------------------

def main():
    args = build_arg_parser().parse_args()
    folder = Path(args.case_folder)

    # 檔案位置
    case_pdf = folder / "case.pdf"
    extracted_path = folder / "extracted_case.json"

    # Stage 1 ------------------
    if args.only in (None, "extract"):
        print("\n=== Stage 1: Extracting Case Info ===")
        extracted = run_stage1(case_pdf, model=args.model)
        save_stage1_output(folder, extracted)
        print("→ 輸出 extracted_case.json")

        if args.only == "extract":
            print(json.dumps(extracted, ensure_ascii=False, indent=2))
            return
    else:
        # 若沒有跑 Stage1，則讀取現有的 extracted_case.json
        extracted = json.loads(extracted_path.read_text(encoding="utf-8"))

    # Stage 2 ------------------
    if args.only in (None, "decide"):
        print("\n=== Stage 2: SNAD Decision ===")

        final_output = run_stage2(folder, extracted, model=args.model)
        save_stage2_output(folder, final_output)
        print("→ 輸出 final_output.json")

        print(json.dumps(final_output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
