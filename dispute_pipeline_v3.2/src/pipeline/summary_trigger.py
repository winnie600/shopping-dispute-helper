#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
summary_trigger.py
-------------------
Automatically determines whether an AI Case Summary should be generated.

Trigger conditions (based on project spec):
1. If either buyer or seller has been inactive for 24 hours.
2. If the conversation has lasted more than 72 hours without resolution.
3. If the user presses the "escalate_to_staff" button (manual trigger).

Return format:
{
    "trigger": True / False,
    "reason": "buyer_inactive_24h" / "seller_inactive_24h" /
              "conversation_exceeds_72h" / "manual_escalation" / None
}

Assumptions:
- chat_log is a list of messages with fields:
    {
        "timestamp": "2025-01-01 10:23",
        "sender": "Buyer" or "Seller" or "AI",
        "text": "...."
    }
- escalation_flag is a boolean provided by frontend/API.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


# ---------------------------
# 🔧 Helper — parse timestamp
# ---------------------------
def _parse_time(ts: str) -> datetime:
    """
    Convert timestamp string into datetime.
    Supports formats like: '2025-10-08 10:23'
    """
    return datetime.strptime(ts, "%Y-%m-%d %H:%M")


# ---------------------------
# 🔥 Main function
# ---------------------------
def check_summary_trigger(
    chat_log: List[Dict[str, Any]],
    escalation_flag: bool = False,
) -> Dict[str, Any]:
    """
    Determine if AI summary should be generated.

    Parameters:
        chat_log: List of chat messages
        escalation_flag: Manual escalation from frontend

    Returns:
        dict with `trigger` and `reason`
    """

    # 1) Manual escalation (highest priority)
    if escalation_flag:
        return {
            "trigger": True,
            "reason": "manual_escalation"
        }

    if not chat_log:
        # No messages → cannot evaluate
        return {"trigger": False, "reason": None}

    # Extract timestamps
    buyer_last = None
    seller_last = None
    first_msg_time = _parse_time(chat_log[0]["timestamp"])
    latest_time = _parse_time(chat_log[-1]["timestamp"])

    for msg in chat_log:
        ts = _parse_time(msg["timestamp"])
        sender = msg.get("sender")

        if sender == "Buyer":
            buyer_last = ts
        elif sender == "Seller":
            seller_last = ts

    now = latest_time  # Use last chat time as reference

    # ---------------------------
    # 2) Check 24h inactivity rule
    # ---------------------------
    if buyer_last:
        if now - buyer_last >= timedelta(hours=24):
            return {
                "trigger": True,
                "reason": "buyer_inactive_24h"
            }

    if seller_last:
        if now - seller_last >= timedelta(hours=24):
            return {
                "trigger": True,
                "reason": "seller_inactive_24h"
            }

    # ---------------------------
    # 3) Check 72h conversation duration
    # ---------------------------
    if now - first_msg_time >= timedelta(hours=72):
        return {
            "trigger": True,
            "reason": "conversation_exceeds_72h"
        }

    # No trigger
    return {
        "trigger": False,
        "reason": None
    }
