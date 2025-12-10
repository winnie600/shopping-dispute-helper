# 📁 **dispute_pipeline_v3 專案結構（最終版）**

```
dispute_pipeline_v3/
│
├── README.md
├── requirements.txt
│
├── src/
│   ├── __init__.py
│   ├── pipeline/
│   │     ├── __init__.py
│   │     ├── extractor.py
│   │     ├── rflags.py
│   │     ├── llm_stage2.py
│   │     ├── postprocess.py
│   │     ├── policy.py
│   │     ├── outcome_ai.py
│   │     ├── summary.py
│   │     └── build.py
│   │
│   └── arbitration_pipeline.py   ← 主入口（舊單檔版同功能）
│
└── data/
    ├── source/     ← 你的 case1_raw.json, case2_raw.json, case3_raw.json
    └── analysis/   ← 產出分析結果
```


# ✅ **（1）README.md**

```
# C2C Dispute Arbitration Pipeline (Modular v3)

This project implements a modular arbitration pipeline for C2C SNAD (Significantly Not As Described) dispute resolution.  
It follows a 3-stage structure:

### Stage 1 — Extraction
Reads raw case JSON and normalizes:
- Listing info
- Complaint summary
- Highlighted messages
- Timeline (chat log)
- Transaction metadata (method, dispute hours, order completed)

### Stage 2 — LLM Decision Engine
Uses Gemma 3 1B/2B to classify:
- SNAD (SND-501)
- Neutral (SND-502)
- Insufficient Evidence (SND-503)

LLM output is restricted to only:
```

{
"snadResult": {
"label": "...",
"reason": "..."
}
}

```

### Stage 3 — Formatter
Adds:
- R1/R2/R3 eligibility flags
- Policy anchors (ELI, SND, OUT, FEE)
- Recommendation A/B
- AI-generated one-sentence Outcome summary
- Case summary text

---

## Run the pipeline:

```

python src/arbitration_pipeline.py --case-id case1 --model gemma3:1b

```

Input:
`data/source/case1_raw.json`

Output:
`data/analysis/case1_analysis.json`

---

## Module Structure

```

src/pipeline/
│
├── extractor.py      # Stage 1 – Parse raw case
├── rflags.py         # Compute R1/R2/R3
├── llm_stage2.py     # Stage 2 – LLM SNAD classification
├── postprocess.py    # Clean JSON, strip extra keys, enforce rules
├── policy.py         # Policy anchor helpers
├── outcome_ai.py     # AI one-line final outcome summarizer
├── summary.py        # Build final caseSummary block
└── build.py          # Stage 3 – Gather everything into final output

```

---

## Note
This v3 modular version is functionally identical to the previously working single-file version, but structured for clarity and long-term maintainability.

```

## 使用方法

python src\arbitration_pipeline.py --case-id case1 --data-dir .\data\source --out-dir .\data\analysis --model gemma3:1b
python src\arbitration_pipeline.py --case-id case2 --data-dir .\data\source --out-dir .\data\analysis --model gemma3:1b
python src\arbitration_pipeline.py --case-id case3 --data-dir .\data\source --out-dir .\data\analysis --model gemma3:1b


python src\arbitration_pipeline.py --case-id case1 --data-dir .\data\source --out-dir .\data\analysis --model openai:gpt-4o-mini


python src/initial_judgement_chatbot.py --file ./data/source/case2_raw_raw.json --model openai:gpt-4o-mini

uvicorn app.main:app --reload


---

