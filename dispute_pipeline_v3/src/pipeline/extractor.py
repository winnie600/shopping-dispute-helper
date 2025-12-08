# extractor.py
"""
Stage 1 – Extract raw case data into a clean, structured format.
"""

from __future__ import annotations
from typing import List, Dict, Any, Optional


# ---------------------------------------------------------
#  Eligibility Notes Generator
# ---------------------------------------------------------
def gen_eligibility_notes(method: str, hours: int | None, completed: bool | None) -> str:
    """
    Produce human-readable eligibility notes based on raw order metadata.
    Example:
    "In-app + 7-ELEVEN COD; opened ~15h after pickup; Order is not yet completed"
    """
    m = method or "In-app"
    h = "?" if hours is None else str(hours)
    status = "Order is completed" if completed else "Order is not yet completed"
    return f"{m}; opened ~{h}h after pickup; {status}"


# ---------------------------------------------------------
#  Stage 1 Extractor
# ---------------------------------------------------------

def extract_case(raw_data: dict) -> dict:
    """
    Stage 1 extraction — preserve FULL original listing + chat text,
    so Stage 2 LLM can accurately detect SNAD mismatches.
    """

    listing = raw_data.get("listingInfo", {})
    complaint = raw_data.get("complaint", "")
    chat = raw_data.get("chatLog", [])  # ← 修正錯誤名稱

    # Highlighted issues
    highlighted_msgs = [
        msg for msg in chat
        if isinstance(msg, dict) and msg.get("highlight") is True
    ]

    # Full timeline text (very important for LLM)
    timeline = []
    for msg in chat:
        if isinstance(msg, dict):
            t = msg.get("timestamp")
            sender = msg.get("sender")
            text = msg.get("text")
            if t and sender and text:
                timeline.append(f"{t} | {sender}: {text}")

    # Build a FULL raw listing text for LLM
    # (舊版輸出靠這個，reason 才會正確生成)
    raw_listing_text = []
    for k, v in listing.items():
        raw_listing_text.append(f"{k}: {v}")
    raw_listing_text = "\n".join(raw_listing_text)

    return {
        "caseId": raw_data.get("id"),
        "title": raw_data.get("title"),
        "orderMeta": raw_data.get("orderMeta", []),

        # Keep summary for structured view
        "listingSummary": listing,  

        "rawListingText": raw_listing_text,     
        "complaintSummary": complaint,
        "rawComplaintText": complaint,          
        "highlightedIssues": highlighted_msgs,

        "timeline": timeline,                   
        "rawChatText": "\n".join(timeline),      

        "transactionMethod": raw_data.get("transactionMethod"),
        "disputeOpenedAfterHours": raw_data.get("disputeOpenedAfterHours"),
        "orderCompleted": raw_data.get("orderCompleted"),
    }
