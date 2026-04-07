"""Tests for LegacyVisionAgent."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.legacy_vision import (
    LEGACY_QUESTIONS,
    _build_prompt,
    build_legacy_vision_agent,
    compute_desired_brand,
)

SAMPLE_ANSWERS = {
    "q1": "visionary, empathetic, relentless",
    "q2": "Making tech accessible to underserved communities",
    "q3": "Designing systems that simplify complexity",
    "q4": "Junior engineers I mentored who are now tech leads",
    "q5": "System design and engineering culture",
    "q6": "That individual contributors can shape culture more than managers",
    "q7": "Intellectual honesty and transparency",
    "q8": "Built things that outlasted me and lifted others up",
    "q9": "Not publishing enough, staying invisible in the industry",
    "q10": "Write and publish a technical article series on system design",
}

MOCK_AGENT_RESULT = {
    "legacy_words": ["visionary", "empathetic", "relentless"],
    "desired_description": (
        "You want to be known as a visionary engineer who makes "
        "complex systems accessible. Your legacy is built on lifting "
        "others up through mentorship and transparent leadership."
    ),
    "reverse_engineered_actions": [
        "Publish 4 technical articles on system design this quarter",
        "Mentor 2 junior engineers through a structured program",
        "Give a talk at a local meetup on engineering culture",
        "Open-source one internal tool to increase visibility",
    ],
}


def test_legacy_questions_has_10():
    assert len(LEGACY_QUESTIONS) == 10


def test_build_prompt_includes_all_questions_and_answers():
    prompt = _build_prompt(SAMPLE_ANSWERS)

    for i, question in enumerate(LEGACY_QUESTIONS, 1):
        assert f"Q{i}:" in prompt
        assert question in prompt
        assert f"A{i}:" in prompt
        assert SAMPLE_ANSWERS[f"q{i}"] in prompt


def test_build_prompt_handles_uppercase_keys():
    answers = {"Q1": "bold", "Q2": "kindness"}
    prompt = _build_prompt(answers)

    assert "A1: bold" in prompt
    assert "A2: kindness" in prompt


def test_build_prompt_handles_missing_answers():
    prompt = _build_prompt({"q1": "only first"})

    assert "A1: only first" in prompt
    # Missing answers should be empty strings
    assert "A2: \n" in prompt or "A2: " in prompt


def test_build_legacy_vision_agent_returns_agent():
    with patch("app.agents.legacy_vision.get_model") as mock_model:
        mock_model.return_value = "openai:gpt-4o"
        agent = build_legacy_vision_agent()
        assert agent is not None
        mock_model.assert_called_once()


@pytest.mark.asyncio
@patch("app.agents.legacy_vision.get_model")
async def test_compute_desired_brand(mock_model: MagicMock) -> None:
    mock_model.return_value = MagicMock()

    mock_response = MagicMock()
    mock_response.content = json.dumps(MOCK_AGENT_RESULT)

    with patch("app.agents.legacy_vision.build_legacy_vision_agent") as mock_build:
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        result = await compute_desired_brand(SAMPLE_ANSWERS)

    assert result["legacy_words"] == ["visionary", "empathetic", "relentless"]
    assert "visionary engineer" in result["desired_description"]
    assert len(result["reverse_engineered_actions"]) == 4
    mock_agent.arun.assert_awaited_once()


@pytest.mark.asyncio
@patch("app.agents.legacy_vision.get_model")
async def test_compute_desired_brand_prompt_content(
    mock_model: MagicMock,
) -> None:
    mock_model.return_value = MagicMock()

    mock_response = MagicMock()
    mock_response.content = json.dumps(MOCK_AGENT_RESULT)

    with patch("app.agents.legacy_vision.build_legacy_vision_agent") as mock_build:
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        await compute_desired_brand(SAMPLE_ANSWERS)

    # Verify the prompt sent to the agent contains the answers
    call_args = mock_agent.arun.call_args[0][0]
    assert "visionary, empathetic, relentless" in call_args
    assert "system design" in call_args.lower()


@pytest.mark.asyncio
@patch("app.agents.legacy_vision.get_model")
async def test_compute_desired_brand_empty_response(
    mock_model: MagicMock,
) -> None:
    mock_model.return_value = MagicMock()

    mock_response = MagicMock()
    mock_response.content = ""

    with (
        patch("app.agents.legacy_vision.build_legacy_vision_agent") as mock_build,
        pytest.raises(json.JSONDecodeError),
    ):
        mock_agent = AsyncMock()
        mock_agent.arun.return_value = mock_response
        mock_build.return_value = mock_agent

        await compute_desired_brand(SAMPLE_ANSWERS)
