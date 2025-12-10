

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
│   ├── arbitration_pipeline.py        ← Pipeline 主入口（完整 SNAD 判斷流程）
│   └── initial_judgement_chatbot.py   ← 初判聊天機器人（可獨立運作）
│
├── app/
│   └── main.py                        ← FastAPI 後端，提供 /api/analysis/{caseId}
│
└── data/
    ├── source/       ← case1_raw.json, case2_raw.json, case3_raw.json
    └── analysis/     ← Pipeline 產生的分析結果 JSON
```

---

# 📘 **README.md（最新版，含 API + Chatbot）**

```
# C2C Dispute Arbitration Pipeline (Modular v3)

This project implements a modular arbitration pipeline for C2C SNAD  
(Significantly Not As Described) dispute resolution.  
It follows a clear 3-stage architecture and provides both command-line tools  
and a FastAPI backend for front-end integration.

---

# 🔧 System Architecture

### **Stage 1 — Extraction**
Loads raw case JSON and normalizes:
- Listing info
- Buyer complaint summary
- Highlighted messages
- Timeline (chat log)
- Transaction metadata (method, dispute delay, order completed)

---

### **Stage 2 — LLM Decision Engine**
Uses **Gemma 3** or **OpenAI GPT-4o-mini** to classify:

- **SNAD (SND-501)**
- **Neutral (SND-502)**
- **Insufficient Evidence (SND-503)**

Strict structured output:

```

{
"snadResult": {
"label": "...",
"reason": "...",
"policyAnchors": [...]
}
}

```

---

### **Stage 3 — Formatter (build.py)**
Adds:
- R1/R2/R3 eligibility  
- Consistent policy anchors (ELI, SND, OUT, FEE)  
- Recommendation A/B  
- AI-generated **Outcome summary**  
- Full **caseSummary** section  

Result is written to `data/analysis/<caseId>_analysis.json`.

---

# 🧪 Run Pipeline from CLI

### Example (local Gemma 3 model)
```

python src/arbitration_pipeline.py 
--case-id case1 
--data-dir ./data/source 
--out-dir ./data/analysis 
--model gemma3:1b

```

### Using OpenAI GPT-4o-mini
```

python src/arbitration_pipeline.py 
--case-id case1 
--data-dir ./data/source 
--out-dir ./data/analysis 
--model openai:gpt-4o-mini

```

---

# 🤖 Initial Judgement Chatbot (Interactive)

This module simulates an “AI Staff Chatbot”  
that creates preliminary findings from a single case file.

### Run:
```

python src/initial_judgement_chatbot.py 
--file ./data/source/case2_raw_raw.json 
--model openai:gpt-4o-mini

```

Produces:
- Preliminary finding  
- Suggested resolution  
- A structured JSON block  

---

# 🌐 FastAPI Backend (`app/main.py`)

Provides an endpoint for the front-end UI:

### Start the server:
```

uvicorn app.main:app --reload --port 8000

```

### API:
```

GET /api/analysis/{caseId}

```

Server will:
1. Load the case (e.g., data/source/case2_raw.json)
2. Run full arbitration pipeline
3. Return JSON analysis for UI display

This powers the React Staff Console’s **AI Analysis** panel.

---

# 📂 Module Description

```

src/pipeline/
│
├── extractor.py      # Stage 1 – Parse raw case into normalized structure
├── rflags.py         # Compute R1/R2/R3 eligibility rules
├── llm_stage2.py     # Stage 2 – SNAD / Neutral / Insufficient Evidence LLM
├── postprocess.py    # Enforce JSON shape, remove invalid fields
├── policy.py         # Policy validation & anchor whitelisting
├── outcome_ai.py     # One-sentence final outcome (AI)
├── summary.py        # Builds the long-form caseSummary
└── build.py          # Stage 3 – Combines all parts into final analysis JSON

```

---

# 📌 Notes

- v3 modular version improves maintainability.
- Final result structure exactly matches front-end expectations.
- Supports both **local LLM** (Gemma 3) and **OpenAI cloud model**.
- All outputs strictly follow SNAD policy rules and consistent JSON schema.

```



