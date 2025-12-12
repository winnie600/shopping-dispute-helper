
---

# 📁 **dispute_pipeline_v3.2 專案結構**

```
dispute_pipeline_v3/
│
├── README.md
├── requirements.txt
│
├── src/
│   ├── __init__.py
│   ├── app/
│   │     └── main.py                 ←（v3.1 新增）後端 API（前後端嵌入用）
│   │
│   ├── summary_trigger.py            ←（v3.2 新增）AI 總結觸發器（判斷時間點）
│   │
│   ├── pipeline/
│   │     ├── __init__.py
│   │     ├── extractor.py
│   │     ├── rflags.py
│   │     ├── llm_stage2.py
│   │     ├── postprocess.py
│   │     ├── policy.py
│   │     ├── outcome_ai.py
│   │     ├── summary.py
│   │     └── build.py                ← 整合 Stage1/2/3 + Summary（API/CLI 共用）
│   │
│   ├── arbitration_pipeline.py       ← 主入口（CLI 版，與舊單檔版同功能）
│   └── initial_judgement_chatbot.py  ← 初判聊天機器人版本（單案互動 / 早期原型）
│
└── data/
    ├── source/     ← 你的 case1_raw.json, case2_raw.json, case3_raw.json
    └── analysis/   ← 產出分析結果（eligibility + SNAD + recommendation + summary）

```

---

# ✅ **（1）README.md（v3.2 更新後版本）**

````
# C2C Dispute Arbitration Pipeline (Modular v3.2)

This project implements a modular arbitration pipeline for C2C SNAD (Significantly Not As Described) dispute resolution.  
It follows a 3-stage structure and now includes:

- AI Summary Trigger (based on chat silence intervals)
- Full backend API for frontend integration
- Improved Stage 2 decision stability and JSON consistency

---

### Stage 1 — Extraction
Reads raw case JSON and normalizes:
- Listing info  
- Complaint summary  
- Highlighted messages  
- Timeline (chat log)  
- Transaction metadata (method, dispute hours, order completed)

---

### Stage 2 — LLM Decision Engine
Uses cloud model (OpenAI GPT-4o-mini) or local Gemma models to classify:

- SNAD (SND-501)  
- Neutral (SND-502)  
- Insufficient Evidence (SND-503)

LLM output is restricted to only:

```json
{
  "snadResult": {
    "label": "...",
    "reason": "..."
  }
}
````

Policies (ELI / SND / OUT / FEE) are referenced automatically inside the prompt.

---

### Stage 3 — Formatter

Adds:

* R1/R2/R3 eligibility flags
* Policy anchors
* Recommendation A/B
* AI-generated one-sentence Outcome summary
* Case full summary (Stage 3)

---

### **AI Summary Trigger（v3.2 新增）**

`summary_trigger.py` detects:

* Long silence gaps between chat messages
* End-of-conversation summary moments

Auto-generates:

* Key issues
* Buyer/Seller claims
* Turning points
* Arbitration-relevant facts

Used by both backend API and future frontend chat UI.

---

### **Backend API Integration（v3.1 新增）**

`app/main.py` exposes:

```
GET /api/analysis/{case_id}
```

Frontend can directly embed analysis results:

* Eligibility
* SNAD decision
* Final recommendation
* Full AI summary

---

## Run the pipeline (CLI):

```
python src/arbitration_pipeline.py --case-id case1 --data-dir ./data/source --out-dir ./data/analysis --model openai:gpt-4o-mini
```

Input file:
`data/source/case1_raw.json`

Output file:
`data/analysis/case1_analysis.json`

---

## Run initial chatbot version:

```
python src/initial_judgement_chatbot.py --file ./data/source/case2_raw_raw.json --model openai:gpt-4o-mini
```

---

## Start API server (for frontend integration)

```
uvicorn app.main:app --reload
```

---

## Module Structure

```
src/pipeline/
│
├── extractor.py      # Stage 1 – Parse raw case
├── rflags.py         # Compute R1/R2/R3
├── llm_stage2.py     # Stage 2 – LLM SNAD classification + policy reference
├── postprocess.py    # Clean JSON, enforce formatting rules
├── policy.py         # Policy anchor utilities (ELI/SND/OUT/FEE)
├── outcome_ai.py     # AI-generated outcome statement
├── summary.py        # Build final caseSummary block
└── build.py          # Orchestrates Stage 1/2/3 for API & CLI outputs
```

---

## Notes

This v3.2 modular version includes:

* Improved Stage 2 prompt accuracy
* Stable JSON formatting
* Auto-summary at conversation breakpoints
* Full backend → frontend integration

It is functionally more reliable than v2 and earlier v3 versions.








