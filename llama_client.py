import requests

LOCAL_LLM_URL = "http://127.0.0.1:1234/v1/completions"
MODEL_NAME = "Meta-Llama-3.1-8B-Instruct-GGUF"

def query_llm(complaint: str, chat_log: str) -> str:
    prompt = f"""你是一個 Carousell 客訴 AI。根據下列客訴與聊天記錄判斷下一步：
客訴內容: {complaint}
聊天記錄: {chat_log}
請給出：
1. AI 判定 (Return / Partial Refund / Reject)
2. 建議下一步 (要上傳證據、退款流程等等)
"""
    try:
        response = requests.post(LOCAL_LLM_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "max_tokens": 300
        })
        result = response.json()
        return result.get("choices", [{}])[0].get("text", "").strip()
    except Exception as e:
        return f"Error connecting to Local LLM: {e}"
