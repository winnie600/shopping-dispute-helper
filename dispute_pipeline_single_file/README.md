
# Dispute Arbitration Pipeline (Single File)

This ZIP contains a single-file runnable pipeline:
- `src/arbitration_pipeline.py` — Stage1 extract → Stage2 LLM → Stage3 analysis (CLI).

## Quick Start

```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Ensure Ollama and a local model exist: https://ollama.com  (e.g., `ollama pull gemma3:1b`)
python src/arbitration_pipeline.py --case-id case1 --data-dir ./data --out-dir ./data --model gemma3:1b --verbose
```

Options:
- `--dry-run` : skip LLM call and only output Stage1 extraction (`*_stage1.json`).
- `--model`   : choose Ollama model (e.g., `gemma3:2b`, `llama3`).

## Data Layout
- `data/case1_raw.json`, `case2_raw.json`, `case3_raw.json`
- Outputs are written alongside inputs by default (e.g., `data/case1_analysis.json`).

## Notes
- LLM output must be valid JSON as specified by the prompt. The script auto-cleans Markdown fences.
- If the LLM returns malformed JSON, the script raises an error with guidance to enable `--verbose`.
