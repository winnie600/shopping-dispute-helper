from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json

app = FastAPI()

# ========== CORS ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 或改成 ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== API：讀取分析結果 ==========

@app.get("/api/analysis/{case_id}")
def get_analysis(case_id: str):
    file_path = Path(f"data/analysis/{case_id}_analysis.json")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"No analysis found for {case_id}")

    return json.loads(file_path.read_text(encoding="utf-8"))



@app.get("/")
def root():
    return {"message": "C2C Dispute Pipeline Backend Running"}
