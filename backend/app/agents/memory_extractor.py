"""
MemoryExtractor — extracts legacy exercise answers from AI conversation exports.

Parses ChatGPT and Claude export formats, then uses an LLM to infer
answers to each of the 10 legacy design questions.

For large exports, uses a two-pass approach:
1. Chunk the text and summarize each chunk for identity-relevant info
2. Combine summaries and extract answers from the combined context
"""

import asyncio
import json
import logging
from typing import Any

from agno.agent import Agent

from app.agents.base import get_model
from app.agents.legacy_vision import LEGACY_QUESTIONS
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 80_000
CHUNK_SIZE = 15_000
SUMMARY_THRESHOLD = 30_000

CHUNK_SUMMARY_SYSTEM_PROMPT = """\
You are an identity extraction specialist. You are reading one chunk of \
a user's AI conversation history.

Extract ONLY information relevant to the user's professional identity:
- Values, beliefs, principles they hold
- Career goals, aspirations, legacy they want to leave
- Skills, expertise, what they're known for
- Who they impact and how
- What drives them, what they care about
- Professional challenges or growth areas
- Bold actions or ambitions they've mentioned

Ignore small talk, technical debugging, and anything unrelated to identity.

Return a concise summary (under 2000 chars) of identity-relevant findings. \
Use the user's own words where possible. If this chunk has no relevant \
information, return "No identity-relevant information found."

Return ONLY the summary text. No JSON, no markdown formatting."""

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


def _chunk_text(text: str) -> list[str]:
    """Split text into chunks of ~CHUNK_SIZE characters at paragraph boundaries."""
    if len(text) <= CHUNK_SIZE:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        if end >= len(text):
            chunks.append(text[start:])
            break
        # Try to break at a paragraph boundary
        boundary = text.rfind("\n\n", start, end)
        if boundary > start:
            chunks.append(text[start:boundary])
            start = boundary + 2
        else:
            chunks.append(text[start:end])
            start = end
    return chunks


MAX_RETRIES = 5
BASE_DELAY = 2.0
MAX_CONCURRENCY = 2


async def _summarize_chunk(chunk: str, chunk_index: int) -> str:
    """Summarize a single chunk with retry on rate limit."""
    for attempt in range(MAX_RETRIES):
        try:
            agent = Agent(
                model=get_model(),
                system_message=CHUNK_SUMMARY_SYSTEM_PROMPT,
            )
            response = await agent.arun(
                f"Here is chunk {chunk_index + 1} of the user's conversation history:\n\n{chunk}"
            )
            return response.content.strip() if response.content else ""
        except Exception as e:
            if "429" in str(e) and attempt < MAX_RETRIES - 1:
                delay = BASE_DELAY * (2**attempt)
                logger.warning(
                    "Rate limited on chunk %d, retrying in %.1fs (attempt %d/%d)",
                    chunk_index,
                    delay,
                    attempt + 1,
                    MAX_RETRIES,
                )
                await asyncio.sleep(delay)
            else:
                raise
    return ""


MAX_SUMMARIZE_DEPTH = 3


async def _chunk_and_summarize(
    text: str,
    depth: int = 0,
    job_id: str | None = None,
    step_index: int = 0,
) -> str:
    """Split text into chunks, summarize with limited concurrency, combine.

    Uses a semaphore to avoid overwhelming the API with parallel requests.
    If combined summaries still exceed SUMMARY_THRESHOLD, recursively
    summarize again (up to MAX_SUMMARIZE_DEPTH levels).
    """
    from app.services.job_store import import_job_store

    chunks = _chunk_text(text)
    logger.info(
        "Summarizing %d chunks from %d chars (depth=%d)",
        len(chunks),
        len(text),
        depth,
    )

    if job_id and depth == 0:
        import_job_store.start_step(job_id, step_index, total=len(chunks))

    semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

    async def _limited_summarize(chunk: str, i: int) -> str:
        async with semaphore:
            result = await _summarize_chunk(chunk, i)
            if job_id and depth == 0:
                import_job_store.advance_step(job_id, step_index)
            return result

    summaries = await asyncio.gather(
        *[_limited_summarize(chunk, i) for i, chunk in enumerate(chunks)]
    )

    # Filter out empty or "no info" summaries
    useful = [s for s in summaries if s and "no identity-relevant information" not in s.lower()]

    combined = "\n\n---\n\n".join(useful)
    logger.info(
        "Combined %d useful summaries into %d chars (from %d total, depth=%d)",
        len(useful),
        len(combined),
        len(summaries),
        depth,
    )

    # If combined summaries are still too large, recurse
    if len(combined) > SUMMARY_THRESHOLD and depth < MAX_SUMMARIZE_DEPTH:
        logger.info(
            "Combined summaries still too large (%d chars), recursing (depth=%d)",
            len(combined),
            depth + 1,
        )
        return await _chunk_and_summarize(combined, depth + 1, job_id, step_index)

    if job_id and depth == 0:
        import_job_store.finish_step(job_id, step_index)

    return combined


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

    return "\n\n".join(messages)


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

    return "\n\n".join(messages)


def parse_raw_text(text: str) -> str:
    """Passthrough with strip."""
    return text.strip()


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
    job_id: str | None = None,
) -> dict[str, Any]:
    """Extract answers to 10 legacy questions from conversation text.

    For large inputs (>SUMMARY_THRESHOLD chars), uses a two-pass approach:
    1. Chunk the text and summarize each chunk for identity-relevant info
    2. Combine summaries and extract answers from the combined context

    For smaller inputs, extracts directly in a single pass.
    """
    from app.services.job_store import import_job_store

    needs_chunking = len(text) > SUMMARY_THRESHOLD

    # Step indices: 0=parse (done before this), 1=summarize (if needed), last=extract
    summarize_step = 1
    extract_step = 2 if needs_chunking else 1

    if needs_chunking:
        logger.info("Large input (%d chars), using chunked summarization", len(text))
        text = await _chunk_and_summarize(text, job_id=job_id, step_index=summarize_step)
    elif job_id:
        import_job_store.skip_step(job_id, summarize_step)

    # Fallback truncation if summaries are still too long
    text = _truncate(text)

    if job_id:
        import_job_store.start_step(job_id, extract_step, total=1)

    agent = build_memory_extractor_agent()
    prompt = _build_extraction_prompt(text)

    for attempt in range(MAX_RETRIES):
        try:
            response = await agent.arun(prompt)
            break
        except Exception as e:
            if "429" in str(e) and attempt < MAX_RETRIES - 1:
                delay = BASE_DELAY * (2**attempt)
                logger.warning(
                    "Rate limited on extraction, retrying in %.1fs (attempt %d/%d)",
                    delay,
                    attempt + 1,
                    MAX_RETRIES,
                )
                await asyncio.sleep(delay)
            else:
                raise
    else:
        response = await agent.arun(prompt)

    raw: str = response.content if response.content else ""
    logger.debug("MemoryExtractor raw response: %s", raw[:200])

    if job_id:
        import_job_store.finish_step(job_id, extract_step)

    return extract_json(raw)
