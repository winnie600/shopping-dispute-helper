# =============================================
# file: src/pipeline/stage2_canonicalize.py
# =============================================
from __future__ import annotations
import json
from typing import Any, Dict

WHITELIST_TOP = {"snadResult"}
DEFAULT_LABEL = "Insufficient Evidence"

def canonicalize_stage2(obj: Any) -> Dict[str, Any]:
    """Normalize Stage-2 JSON so downstream can always read `snadResult.reason`."""
    if isinstance(obj, str):
        obj = json.loads(obj)
    if not isinstance(obj, dict):
        raise TypeError("stage2 payload must be dict or JSON string")

    snad = dict(obj.get("snadResult") or {})
    # move top-level reason -> nested
    if obj.get("reason") and not snad.get("reason"):
        snad["reason"] = str(obj["reason"]).strip()

    # minimal label default
    label = str(snad.get("label") or "").strip() or DEFAULT_LABEL
    snad["label"] = label

    # reason 保持原樣（可為空，但下游只讀這裡）
    reason = str(snad.get("reason") or "").strip()
    snad["reason"] = reason

    return {"snadResult": {"label": snad["label"], "reason": snad["reason"]}}






