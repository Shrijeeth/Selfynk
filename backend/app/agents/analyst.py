"""
AnalystAgent — extracts identity signals from any input entry.

Returns structured analysis: themes, skills, values, tone, and perception signals.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

from agno.agent import Agent
from agno.run.agent import RunContentEvent

from app.agents.base import get_model
from app.models.input_entry import InputEntry

SYSTEM_PROMPT = """\
You are an identity analyst for a personal brand operating system called Selfynk.
Your job is to analyze a person's writing and extract meaningful signals about who they are.

Given a journal entry, daily pulse check-in, situation debrief, or other personal writing:

Extract and return a JSON object with these exact fields:
{
  "themes": [],          // 2-5 recurring topics or domains
  "skills_detected": [], // concrete skills demonstrated or mentioned
  "values_detected": [], // values implied by behavior or language
  "tone": "",            // one of: expert | learner | connector | builder | leader | reflector
  "perception_signals": [] // 1-3 phrases that reveal how this person might be perceived by others
}

Rules:
- Be specific and grounded in what was actually written. Do not project.
- Perception signals should describe how a third party reading this would likely see the person.
- Tone reflects the dominant mode of communication, not the emotional state.
- Skills and values should be inferred from actions described, not just words used.
- Return ONLY valid JSON. No markdown, no preamble."""


def build_analyst_agent() -> Agent:
    return Agent(
        model=get_model(),
        description="Identity analyst that extracts signals from personal writing",
        instructions=[
            "Analyze the provided text and return structured JSON.",
            "Be specific, grounded, and avoid projection.",
        ],
        system_message=SYSTEM_PROMPT,
    )


def _build_prompt(entry: InputEntry) -> str:
    tags = ", ".join(entry.context_tags) if entry.context_tags else "none"
    return f"Mode: {entry.mode}\nContext tags: {tags}\n---\n{entry.content}"


async def analyze_entry(entry: InputEntry) -> dict[str, Any]:
    agent = build_analyst_agent()
    response = await agent.arun(_build_prompt(entry))
    raw: str = response.content if response.content else ""
    result: dict[str, Any] = json.loads(raw)
    return result


async def stream_analysis(entry: InputEntry) -> AsyncIterator[str]:
    """Generator that yields content chunks for SSE streaming."""
    agent = build_analyst_agent()
    response_stream = agent.arun(_build_prompt(entry), stream=True)
    async for event in response_stream:  # type: ignore[union-attr]
        if isinstance(event, RunContentEvent) and event.content:
            yield event.content
