"""Tests for memory extractor agent and parsers."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.memory_extractor import (
    SUMMARY_THRESHOLD,
    _chunk_and_summarize,
    _chunk_text,
    _truncate,
    detect_format,
    extract_legacy_answers,
    parse_chatgpt_export,
    parse_claude_export,
    parse_raw_text,
)

# ── Parsers ─────────────────────────────────────────────────────────


def test_parse_chatgpt_export():
    data = [
        {
            "title": "Test conv",
            "mapping": {
                "node1": {
                    "message": {
                        "author": {"role": "user"},
                        "content": {"parts": ["I value transparency"]},
                    }
                },
                "node2": {
                    "message": {
                        "author": {"role": "assistant"},
                        "content": {"parts": ["That's great"]},
                    }
                },
                "node3": {
                    "message": {
                        "author": {"role": "system"},
                        "content": {"parts": ["System message"]},
                    }
                },
            },
        }
    ]
    result = parse_chatgpt_export(json.dumps(data).encode())
    assert "I value transparency" in result
    assert "That's great" in result
    assert "System message" not in result


def test_parse_chatgpt_export_invalid():
    with pytest.raises(ValueError, match="Expected a JSON array"):
        parse_chatgpt_export(b'{"not": "an array"}')


def test_parse_chatgpt_export_empty_parts():
    data = [
        {
            "mapping": {
                "n": {
                    "message": {
                        "author": {"role": "user"},
                        "content": {"parts": ["", "  "]},
                    }
                }
            }
        }
    ]
    result = parse_chatgpt_export(json.dumps(data).encode())
    assert result.strip() == ""


def test_parse_claude_export():
    lines = [
        json.dumps(
            {
                "uuid": "abc",
                "name": "Test",
                "chat_messages": [
                    {"sender": "human", "text": "My goal is impact"},
                    {"sender": "assistant", "text": "Understood"},
                ],
            }
        ),
        json.dumps(
            {
                "uuid": "def",
                "chat_messages": [
                    {"sender": "human", "text": "I care about growth"},
                ],
            }
        ),
    ]
    raw = "\n".join(lines).encode()
    result = parse_claude_export(raw)
    assert "My goal is impact" in result
    assert "Understood" in result
    assert "I care about growth" in result


def test_parse_claude_export_malformed_lines():
    raw = b"not json\n{invalid\n"
    result = parse_claude_export(raw)
    assert result == ""


def test_parse_raw_text():
    result = parse_raw_text("Hello world")
    assert result == "Hello world"


def test_parse_raw_text_strips():
    result = parse_raw_text("  spaced  ")
    assert result == "spaced"


# ── Chunking ───────────────────────────────────────────────────────


def test_chunk_text_short():
    chunks = _chunk_text("short text")
    assert chunks == ["short text"]


def test_chunk_text_splits_at_paragraph_boundary():
    block_a = "a" * 10_000
    block_b = "b" * 10_000
    text = block_a + "\n\n" + block_b
    chunks = _chunk_text(text)
    assert len(chunks) == 2
    assert chunks[0] == block_a
    assert chunks[1] == block_b


def test_chunk_text_splits_large_text():
    text = "x" * 50_000
    chunks = _chunk_text(text)
    assert len(chunks) >= 3
    reassembled = "".join(chunks)
    assert reassembled == text


@pytest.mark.asyncio
@patch("app.agents.memory_extractor.get_model")
async def test_chunk_and_summarize(mock_model: MagicMock) -> None:
    mock_model.return_value = MagicMock()

    # Create text large enough to produce multiple chunks
    text = ("I value honesty and transparency. " * 500 + "\n\n") * 5

    with patch("app.agents.memory_extractor._summarize_chunk") as mock_summarize:
        mock_summarize.return_value = "User values honesty and transparency."
        result = await _chunk_and_summarize(text)

    assert mock_summarize.call_count >= 2
    assert "honesty and transparency" in result


@pytest.mark.asyncio
@patch("app.agents.memory_extractor.get_model")
async def test_chunk_and_summarize_recurses_when_combined_too_large(
    mock_model: MagicMock,
) -> None:
    mock_model.return_value = MagicMock()

    text = "x" * 60_000

    call_count = 0

    async def mock_summarize(chunk: str, _idx: int) -> str:
        nonlocal call_count
        call_count += 1
        # First pass: return large summaries that exceed SUMMARY_THRESHOLD combined
        if len(chunk) > 10_000:
            return "y" * 10_000
        # Second pass (recursion): return short summaries
        return "User values impact."

    with patch("app.agents.memory_extractor._summarize_chunk", side_effect=mock_summarize):
        result = await _chunk_and_summarize(text)

    # Should have been called more times than initial chunks (recursed)
    initial_chunks = len(_chunk_text(text))
    assert call_count > initial_chunks
    assert "impact" in result


@pytest.mark.asyncio
@patch("app.agents.memory_extractor.get_model")
async def test_chunk_and_summarize_filters_empty(mock_model: MagicMock) -> None:
    mock_model.return_value = MagicMock()

    text = "x" * 40_000

    with patch("app.agents.memory_extractor._summarize_chunk") as mock_summarize:
        mock_summarize.side_effect = [
            "User cares about impact.",
            "No identity-relevant information found.",
            "User wants to mentor others.",
        ]
        result = await _chunk_and_summarize(text)

    assert "impact" in result
    assert "mentor" in result
    assert "No identity-relevant" not in result


# ── Truncation ──────────────────────────────────────────────────────


def test_truncate_short_text():
    text = "short"
    assert _truncate(text) == "short"


def test_truncate_long_text():
    text = "a" * 100_000
    result = _truncate(text)
    assert len(result) <= 80_000 + 30  # allow for separator
    assert result.startswith("a" * 20_000)
    assert result.endswith("a" * 60_000)
    assert "[... truncated ...]" in result


# ── Format Detection ────────────────────────────────────────────────


def test_detect_format_chatgpt():
    data = [{"title": "conv", "mapping": {"n": {}}}]
    assert detect_format(json.dumps(data).encode()) == "chatgpt"


def test_detect_format_claude_json_array():
    data = [{"uuid": "x", "chat_messages": []}]
    assert detect_format(json.dumps(data).encode()) == "claude"


def test_detect_format_claude_jsonl():
    line = json.dumps({"uuid": "x", "chat_messages": []})
    assert detect_format(line.encode()) == "claude"


def test_detect_format_raw():
    assert detect_format(b"just some text") == "raw"


def test_detect_format_empty():
    assert detect_format(b"") == "raw"


def test_detect_format_invalid_json():
    assert detect_format(b"[{invalid json") == "raw"


# ── Extraction Agent ────────────────────────────────────────────────


MOCK_EXTRACTION = {
    "q1": "bold, kind, relentless",
    "q2": "education access",
    "q3": "system design",
    "q4": "junior engineers",
    "q5": "distributed systems",
    "q6": "ICs shape culture more than managers",
    "q7": "honesty and transparency",
    "q8": "built things that outlasted me",
    "q9": "not publishing enough",
    "q10": "write a technical article series",
    "confidence": {
        "q1": "high",
        "q2": "medium",
        "q3": "high",
        "q4": "low",
        "q5": "high",
        "q6": "medium",
        "q7": "high",
        "q8": "high",
        "q9": "medium",
        "q10": "high",
    },
}


@pytest.mark.asyncio
@patch("app.agents.memory_extractor.get_model")
async def test_extract_legacy_answers(
    mock_model: MagicMock,
) -> None:
    mock_model.return_value = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps(MOCK_EXTRACTION)

    with patch("app.agents.memory_extractor.build_memory_extractor_agent") as mock_build:
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        result = await extract_legacy_answers("some conversation text")

    assert result["q1"] == "bold, kind, relentless"
    assert result["confidence"]["q1"] == "high"
    assert result["confidence"]["q4"] == "low"
    mock_agent.arun.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.agents.memory_extractor.get_model")
async def test_extract_legacy_answers_prompt_contains_questions(
    mock_model: MagicMock,
) -> None:
    mock_model.return_value = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps(MOCK_EXTRACTION)

    with patch("app.agents.memory_extractor.build_memory_extractor_agent") as mock_build:
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        await extract_legacy_answers("my conversations")

    prompt = mock_agent.arun.call_args[0][0]
    assert "Q1:" in prompt
    assert "Q10:" in prompt
    assert "my conversations" in prompt


@pytest.mark.asyncio
@patch("app.agents.memory_extractor._chunk_and_summarize", new_callable=AsyncMock)
@patch("app.agents.memory_extractor.get_model")
async def test_extract_legacy_answers_large_input_uses_chunking(
    mock_model: MagicMock,
    mock_chunk_summarize: AsyncMock,
) -> None:
    mock_model.return_value = MagicMock()
    mock_chunk_summarize.return_value = "User values honesty."
    mock_response = MagicMock()
    mock_response.content = json.dumps(MOCK_EXTRACTION)

    with patch("app.agents.memory_extractor.build_memory_extractor_agent") as mock_build:
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        large_text = "x" * (SUMMARY_THRESHOLD + 1)
        result = await extract_legacy_answers(large_text)

    mock_chunk_summarize.assert_awaited_once_with(large_text)
    assert result["q1"] == "bold, kind, relentless"


@pytest.mark.asyncio
@patch("app.agents.memory_extractor._chunk_and_summarize", new_callable=AsyncMock)
@patch("app.agents.memory_extractor.get_model")
async def test_extract_legacy_answers_small_input_skips_chunking(
    mock_model: MagicMock,
    mock_chunk_summarize: AsyncMock,
) -> None:
    mock_model.return_value = MagicMock()
    mock_response = MagicMock()
    mock_response.content = json.dumps(MOCK_EXTRACTION)

    with patch("app.agents.memory_extractor.build_memory_extractor_agent") as mock_build:
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        small_text = "I value honesty"
        await extract_legacy_answers(small_text)

    mock_chunk_summarize.assert_not_awaited()


@pytest.mark.asyncio
@patch("app.agents.memory_extractor.get_model")
async def test_extract_legacy_answers_empty_response(
    mock_model: MagicMock,
) -> None:
    mock_model.return_value = MagicMock()
    mock_response = MagicMock()
    mock_response.content = ""

    with (
        patch("app.agents.memory_extractor.build_memory_extractor_agent") as mock_build,
        pytest.raises(json.JSONDecodeError),
    ):
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        await extract_legacy_answers("text")
