# policy.py
# Policy logic for Eligibility (R1/R2/R3), SNAD label, and Recommendation anchors.

from __future__ import annotations
from typing import List, Dict


# ─────────────────────────────────────────────
# 1) Whitelist of all policy codes used
# ─────────────────────────────────────────────
ALLOWED_POLICY_CODES: List[str] = [
    # SNAD classification
    "SND-501", "SND-502", "SND-503",
    # Evidence collection
    "EVD-701", "EVD-702", "EVD-703", "EVD-704",
    # Outcome patterns
    "OUT-801", "OUT-802", "OUT-803",
    # Fee responsibility
    "FEE-A", "FEE-B", "FEE-C",
    # Eligibility (hard gates)
    "ELI-301", "ELI-302", "ELI-303", "ELI-304",
]


# ─────────────────────────────────────────────
# 2) Eligibility: evaluate R1 / R2 / R3
# ─────────────────────────────────────────────
def evaluate_r_flags(extracted: dict) -> dict:
    """
    Evaluate R1 / R2 / R3 based on raw extracted fields:

    R1 – Protected channel (ELI-301)
         True if transaction uses a protected channel, e.g.:
         - "In-app"
         - "Escrow"
         - "7-ELEVEN COD"
         - "COD"

    R2 – Within dispute window (ELI-302)
         True if dispute was opened within the allowed window.
         Current rule (簡化版): as long as `disputeOpenedAfterHours` is not None.

    R3 – Order not completed (ELI-303)
         True if order has NOT been marked as completed.

    Returns:
        {"r1": bool, "r2": bool, "r3": bool}
    """
    # ----- R1: Protected channel -----
    method = (extracted.get("transactionMethod") or "").lower()
    protected_keywords = ["in-app", "escrow", "7-eleven cod", "cod"]
    r1 = any(k in method for k in protected_keywords)

    # ----- R2: Within dispute window -----
    # 如你未來要改成 <= 48h / 72h，只要修改這一段判斷即可
    hours = extracted.get("disputeOpenedAfterHours")
    r2 = hours is not None

    # ----- R3: Order NOT completed -----
    r3 = extracted.get("orderCompleted") is False

    return {"r1": r1, "r2": r2, "r3": r3}


def compute_eligibility_policy_anchors(extracted: dict, rflags: dict) -> List[str]:
    """
    Map R1/R2/R3 result to Eligibility policy codes:

    - If ANY of R1/R2/R3 is False → Out of scope:
      → ["ELI-304"]

    - Otherwise:
      R1 == True → "ELI-301" (Protected channel)
      R2 == True → "ELI-302" (Within dispute window)
      R3 == True → "ELI-303" (Order not completed)
    """
    r1, r2, r3 = rflags["r1"], rflags["r2"], rflags["r3"]

    # 若有任何不符 → Out of scope
    if not (r1 and r2 and r3):
        return ["ELI-304"]

    anchors: List[str] = []
    if r1:
        anchors.append("ELI-301")
    if r2:
        anchors.append("ELI-302")
    if r3:
        anchors.append("ELI-303")
    return anchors


# ─────────────────────────────────────────────
# 3) SNAD / Neutral / IE policy anchor
# ─────────────────────────────────────────────
def compute_snad_policy_anchors(label: str) -> List[str]:
    """
    Map Stage 2 classification → SNAD policy code:

    - "SNAD"                 → ["SND-501"]
    - "Neutral"              → ["SND-502"]
    - "Insufficient Evidence"→ ["SND-503"]
    """
    if label == "SNAD":
        return ["SND-501"]
    elif label == "Neutral":
        return ["SND-502"]
    elif label == "Insufficient Evidence":
        return ["SND-503"]
    return []


# ─────────────────────────────────────────────
# 4) Recommendation policy anchors (OUT-* / FEE-* / EVD-*)
# ─────────────────────────────────────────────
def compute_recommendation_policy_anchors(label: str) -> Dict[str, List[str]]:
    """
    Assign OUT-* (Outcome policy) and FEE-* (Fee responsibility policy)
    codes based on the arbitration decision type.

    ─────────────────────────────────────────────
    SNAD (SND-501)
    ─────────────────────────────────────────────
    如果賣家資訊錯誤造成「商品與描述不符」，平台標準處理是：

    Primary (主方案)：Return & Full Refund
      → OUT-801：SNAD 標準處理：退貨 + 全額退款
      → FEE-A：退貨運費由賣家負擔（例如 7-ELEVEN 寄回 NT$60）

    Alternative (備案)：Partial Refund & Keep Item
      → OUT-802：買家保留商品，給予部份退款（常見 15–30% 區間）
      → FEE-C：沒有退貨物流，所以沒有物流費爭議

    ─────────────────────────────────────────────
    Neutral (SND-502)
    ─────────────────────────────────────────────
    雙方皆無過錯（例如商品特性、主觀感受、尺寸感覺等）：

    Primary：Partial Refund & Keep Item
      → OUT-802：以小額部份退款作為「和解金」，買家保留商品
      → FEE-C：沒有物流費（因為不退貨）

    Alternative：Return & Full Refund（但費用由買家負擔）
      → OUT-801：若買家執意退貨，仍可走標準退貨流程
      → FEE-B：屬於 Neutral 案件，退貨物流費由買家自付（因為並非賣家過錯）

    ─────────────────────────────────────────────
    Insufficient Evidence (SND-503)
    ─────────────────────────────────────────────
    證據不足時，主要是「請買家補證」而非直接判 SNAD or Neutral：

    Primary：Provide Missing Evidence
      → SND-503：案件「暫時無法判決」
      → EVD-701..704：引導買家提供必要證據
         * EVD-701：開箱影片或照片
         * EVD-702：商品序號 / 序號貼紙
         * EVD-703：對話紀錄截圖
         * EVD-704：外箱、配件、保證書照片等

    Alternative：Hold
      → SND-503：維持「暫緩 / 等待補件」狀態
    """

    if label == "SNAD":
        primary = ["OUT-801", "FEE-A"]
        alternative = ["OUT-802", "FEE-C"]

    elif label == "Neutral":
        primary = ["OUT-802", "FEE-C"]
        alternative = ["OUT-801", "FEE-B"]

    else:  # Insufficient Evidence (SND-503)
        primary = ["SND-503", "EVD-701", "EVD-702", "EVD-703", "EVD-704"]
        alternative = ["SND-503"]

    return {"primary": primary, "alternative": alternative}

# ─────────────────────────────────────────────
# 5) Recommendation text templates (label + details)
# ─────────────────────────────────────────────
RECOMMENDATION_TEMPLATES = {
    "SNAD": {
        "primaryOption": {
            "label": "Return & Full Refund",
            "details": " Seller reimburses NT$60 COD shipping and provides a return label.",

        },
        "alternativeOption": {
            "label": "Partial Refund & Keep Item",
            "details": "Buyer keeps the item; offer 15–30% partial refund.",

        }
    },

    "Neutral": {
        "primaryOption": {
            "label": "Partial Refund & Keep Item",
            "details": "Buyer keeps the item; offer 15–30% partial refund.",

        },
        "alternativeOption": {
            "label": "Return & Refund",
            "details": "Buyer covers NT$60 COD shipping.",
        }
    },

    "Insufficient Evidence": {
        "primaryOption": {
            "label": "Need Additional Evidence",
            "details": (
                "The buyer must provide missing evidence (e.g., unedited photos, "
                "video, serial number, packaging) to allow proper evaluation."
            )
        },
        "alternativeOption": None
    }
}

