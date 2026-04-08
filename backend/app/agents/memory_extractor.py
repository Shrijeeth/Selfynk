"""
MemoryExtractor — extracts legacy exercise answers from AI conversation exports.

Parses ChatGPT and Claude export formats, then uses an LLM to infer
answers to each of the 10 legacy design questions.
"""

import json
import logging
from typing import Any

from agno.agent import Agent

from app.agents.base import get_model
from app.agents.legacy_vision import LEGACY_QUESTIONS
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 80_000

EXTRACTION_SYSTEM_PROMPT = """\
You are an identity extraction specialist for Selfynk.

The user is providing their AI conversation history or memory export. \
Your job is to read through this data and infer answers to 10 specific \
questions about the user's professional identity, values, and aspirations.

For each question, extract the most relevant answer based on what the \
user has expressed in their conversations. If the user has directly \
discussed a topic, quote or paraphrase their own words. If you can only \
infer an answer indirectly, do your best and mark confidence as "low".

Return a JSON object with exactly these fields:
{
  "q1": "",  // answer to question 1
  "q2": "",  // answer to question 2
  ...
  "q10": "", // answer to question 10
  "confidence": {
    "q1": "high|medium|low",
    ...
    "q10": "high|medium|low"
  }
}

Rules:
- Use the user's own language and phrasing where possible.
- If no relevant information exists for a question, return "" and "low".
- Be specific. Generic answers are worse than empty ones.
- Return ONLY valid JSON. No markdown, no preamble."""


def _truncate(text: str) -> str:
    """Truncate to MAX_TEXT_LENGTH, keeping first 20K + last 60K."""
    if len(text) <= MAX_TEXT_LENGTH:
        return text
    head = text[:20_000]
    tail = text[-(MAX_TEXT_LENGTH - 20_000) :]
    return head + "\n\n[... truncated ...]\n\n" + tail


def parse_chatgpt_export(raw: bytes) -> str:
    """Parse ChatGPT conversations.json export."""
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("Expected a JSON array of conversations")

    messages: list[str] = []
    for conv in data:
        mapping = conv.get("mapping", {})
        if not isinstance(mapping, dict):
            continue
        for node in mapping.values():
            msg = node.get("message")
            if not msg:
                continue
            author = msg.get("author", {})
            role = author.get("role", "")
            if role not in ("user", "assistant"):
                continue
            content = msg.get("content", {})
            parts = content.get("parts", [])
            for part in parts:
                if isinstance(part, str) and part.strip():
                    messages.append(part.strip())

    return _truncate("\n\n".join(messages))


def parse_claude_export(raw: bytes) -> str:
    """Parse Claude conversations.jsonl export (JSON Lines)."""
    text = raw.decode("utf-8", errors="replace")
    messages: list[str] = []

    for line in text.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            conv = json.loads(line)
        except json.JSONDecodeError:
            continue
        chat_messages = conv.get("chat_messages", [])
        for msg in chat_messages:
            content = msg.get("text", "")
            if isinstance(content, str) and content.strip():
                messages.append(content.strip())

    return _truncate("\n\n".join(messages))


def parse_raw_text(text: str) -> str:
    """Passthrough with truncation."""
    return _truncate(text.strip())


def _detect_json_array_format(text: str) -> str | None:
    """Check if JSON array matches ChatGPT or Claude format."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, list) or len(data) == 0:
        return None
    first = data[0]
    if not isinstance(first, dict):
        return None
    if "mapping" in first:
        return "chatgpt"
    if "chat_messages" in first:
        return "claude"
    return None


def _detect_jsonl_format(text: str) -> str | None:
    """Check if first line of JSONL matches Claude format."""
    first_line = text.split("\n", 1)[0].strip()
    if not first_line.startswith("{"):
        return None
    try:
        obj = json.loads(first_line)
        if "chat_messages" in obj:
            return "claude"
    except json.JSONDecodeError:
        pass
    return None


def detect_format(content: bytes) -> str:
    """Auto-detect export format from content structure."""
    try:
        text = content.decode("utf-8", errors="replace").strip()
    except Exception:
        return "raw"

    if text.startswith("["):
        fmt = _detect_json_array_format(text)
        if fmt:
            return fmt

    fmt = _detect_jsonl_format(text)
    if fmt:
        return fmt

    return "raw"


def parse_export(content: bytes, fmt: str) -> str:
    """Parse export content based on detected format."""
    if fmt == "chatgpt":
        return parse_chatgpt_export(content)
    elif fmt == "claude":
        return parse_claude_export(content)
    else:
        return parse_raw_text(content.decode("utf-8", errors="replace"))


def _build_extraction_prompt(text: str) -> str:
    """Build the prompt with questions and conversation text."""
    questions_block = "\n".join(f"Q{i}: {q}" for i, q in enumerate(LEGACY_QUESTIONS, 1))
    return (
        f"Here are the 10 questions to answer:\n\n"
        f"{questions_block}\n\n"
        f"---\n\n"
        f"Here is the user's AI conversation history / memory:\n\n"
        f"{text}"
    )


def build_memory_extractor_agent() -> Agent:
    return Agent(
        model=get_model(),
        description=("Extracts professional identity answers from AI conversation history"),
        instructions=[
            "Read the conversation history carefully.",
            "Infer answers to each of the 10 questions.",
            "Use the user's own words where possible.",
            "Mark confidence as low for uncertain answers.",
        ],
        system_message=EXTRACTION_SYSTEM_PROMPT,
    )


async def extract_legacy_answers(
    text: str,
) -> dict[str, Any]:
    """Extract answers to 10 legacy questions from conversation text."""
    agent = build_memory_extractor_agent()
    prompt = _build_extraction_prompt(text)

    response = await agent.arun(prompt)
    raw: str = response.content if response.content else ""
    logger.debug("MemoryExtractor raw response: %s", raw[:200])

    return extract_json(raw)
