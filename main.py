from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from workflow_engine.dispute_workflow import process_dispute
from llm.llama_client import query_llm

app = FastAPI()

class DisputePayload(BaseModel):
    complaint: str
    chatLog: str
    buyer_id: str
    order_id: str

@app.get("/")
def read_root():
    return {"message": "Local AI Dispute System Running"}

@app.post("/dispute")
def handle_dispute(payload: DisputePayload, background_tasks: BackgroundTasks):
    ai_reply = query_llm(payload.complaint, payload.chatLog)
    background_tasks.add_task(process_dispute, payload.buyer_id, payload.order_id)
    return {
        "ai_decision": ai_reply,
        "next_step": "Auto dispute workflow started (24h follow-up)"
    }
