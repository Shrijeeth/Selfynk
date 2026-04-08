"""Tests for memory extractor agent and parsers."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.memory_extractor import (
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
