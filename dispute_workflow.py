import time

def process_dispute(buyer_id: str, order_id: str):
    # 等待 24h 模擬流程（測試用 10 秒）
    time.sleep(10)
    print(f"[AUTO] 24h follow-up for buyer {buyer_id}, order {order_id} - Request evidence or escalate")
