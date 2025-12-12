# src/pipeline/outcome_ai.py
"""
Outcome summarizer (Stage 3 helper)

Use a small LLM (e.g. gemma3:1b) to generate a
ONE-LINE English summary of the final dispute outcome.

這個模組只負責：
- 根據 timeline（聊天紀錄字串列表）
- 呼叫 LLM
- 回傳一行 "Outcome sentence"

不決定 SNAD / Neutral，也不處理 policy，只是寫一句話而已。
"""

from __future__ import annotations

from typing import List, Optional

try:
    # 直接在這裡 import，避免循環依賴
    from langchain_ollama import OllamaLLM  # type: ignore
except Exception as e:  # pragma: no cover
    # 如果沒裝的話，等真正呼叫時才丟錯即可
    OllamaLLM = None  # type: ignore


def _get_llm(model_name: str):
    """
    Internal helper to build an Ollama LLM instance.

    model_name 例如：
    - "gemma3:1b"
    - "gemma3:2b"

    若沒有安裝 langchain-ollama，會在第一次呼叫時報錯。
    """
    if OllamaLLM is None:
        raise RuntimeError(
            "langchain-ollama is not installed. "
            "Please run: pip install langchain-ollama"
        )
    return OllamaLLM(model=model_name)


def ai_summarize_outcome(
    timeline: List[str],
    model_name: str,
) -> Optional[str]:
    """
    Use LLM to summarize the final outcome of this dispute
    into ONE short English sentence.

    Parameters
    ----------
    timeline : List[str]
        已經拼好的時間軸，每一行像：
        "2025-10-07 20:12 | Seller: The screen is genuine Apple..."
    model_name : str
        要給 Ollama 的模型名稱，例如 "gemma3:1b"

    Returns
    -------
    Optional[str]
        一句英文 Outcome，如果 timeline 空就回傳 None。
    """

    if not timeline:
        return None

    # 抓最後 3~5 則訊息（多數時候最後幾句就是協調結果）
    recent_lines = timeline[-5:]
    recent = "\n".join(recent_lines)

    prompt = f"""
Summarize the final outcome of this C2C dispute in ONE short English sentence.

Rules:
- Do NOT quote the chat message.
- Do NOT restate timestamps or usernames.
- Do NOT invent details.
- Focus ONLY on the final agreement or resolution.
- Output must be a single short sentence.

Chat history:
{recent}

Output format:
Outcome: <one short sentence>
""".strip()

    llm = _get_llm(model_name)
    raw = llm.invoke(prompt).strip()

    # 確保格式是 "Outcome: ..."
    lower = raw.lower()
    if lower.startswith("outcome:"):
        # 去掉前綴，只留後面那句話
        return raw[len("Outcome:"):].strip()

    # 如果模型沒完全照格式，也直接拿整句當結果
    return raw
