# src/pipeline/rflags.py
"""
Evaluate R1 / R2 / R3 eligibility flags.

This module is independent and only reads extracted case data.
It does NOT assign policy codes — that part belongs to policy.py.

Definitions
-----------
R1 = Protected channel
    In-app / Escrow / 7-ELEVEN COD
    → Means the transaction is covered by platform protection.

R2 = Within dispute window
    disputeOpenedAfterHours != None
    (If you want a strict rule like <= 48h or <= 72h,
     change this module only.)

R3 = Order not completed
    orderCompleted == False
"""

from __future__ import annotations
from typing import Dict


def evaluate_r_flags(extracted: dict) -> Dict[str, bool]:
    """
    Compute R1 / R2 / R3 from extracted raw fields.

    Parameters
    ----------
    extracted : dict
        Parsed Stage-1 dictionary from extractor.py

    Returns
    -------
    dict with boolean flags:
        {
            "r1": bool,
            "r2": bool,
            "r3": bool
        }
    """

    # ----- R1: Protected channel -----
    method = (extracted.get("transactionMethod") or "").lower()

    protected_keywords = [
        "in-app",
        "escrow",
        "7-eleven cod",
        "7-11 cod",
        "cod",
    ]

    r1 = any(k in method for k in protected_keywords)

    # ----- R2: Within dispute window -----
    # Basic rule: As long as hours != None → inside allowed window.
    # If you want: r2 = (hours <= 72), modify here.
    hours = extracted.get("disputeOpenedAfterHours")
    r2 = hours is not None

    # ----- R3: Order NOT completed -----
    r3 = extracted.get("orderCompleted") is False

    return {"r1": r1, "r2": r2, "r3": r3}
