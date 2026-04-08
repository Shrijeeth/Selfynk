"""
LegacyVisionAgent — computes desired brand statement from legacy exercise answers.

Takes the user's 10-question legacy design exercise answers and synthesizes
a desired brand statement plus quarterly action items.
"""

import json
import logging
import re
from typing import Any

from agno.agent import Agent

from app.agents.base import get_model

logger = logging.getLogger(__name__)

LEGACY_QUESTIONS = [
    "When your professional circle thinks of you in 10 years, "
    "what 3 words do you want them to use?",
    "What problem in the world do you most want to be known for caring about?",
    "What kind of work makes you lose track of time?",
    "Who has been most impacted by your work or presence, and how?",
    'What do you want to be the "go-to" person for?',
    "What do you believe about your field that most people don't yet?",
    "What values would you never compromise on, even if it cost you opportunities?",
    "What does a great professional legacy look like to you in one sentence?",
    "What are the 2-3 biggest things holding you back from that legacy right now?",
    "If you took one bold action this quarter toward that vision, what would it be?",
]

SYSTEM_PROMPT = """\
You are a legacy design coach for Selfynk.

The user has completed a 10-question exercise imagining how they want \
to be remembered professionally.
Your job is to synthesize their answers into a clear desired brand \
statement and an action plan.

Return a JSON object:
{
  "legacy_words": [],              // The 3 words from Q1 (cleaned and validated)
  "desired_description": "",       // 2-3 sentence narrative of the desired brand, \
in second person ("You want to be known as...")
  "reverse_engineered_actions": [] // 3-5 concrete quarterly actions that move \
toward this vision
}

Be specific and grounded in their actual answers. Do not project generic ambitions.
The reverse-engineered actions should be real and actionable, not abstract.
Return ONLY valid JSON."""


def build_legacy_vision_agent() -> Agent:
    return Agent(
        model=get_model(),
        description=(
            "Legacy design coach that synthesizes exercise answers into a desired brand statement"
        ),
        instructions=[
            "Synthesize all 10 answers into a cohesive desired brand statement.",
            "Extract the 3 legacy words from Q1, clean and validate them.",
            "Generate 3-5 concrete, actionable quarterly actions.",
            "Be specific and grounded. Avoid generic advice.",
        ],
        system_message=SYSTEM_PROMPT,
    )


def _build_prompt(answers: dict[str, str]) -> str:
    lines = []
    for i, question in enumerate(LEGACY_QUESTIONS, 1):
        answer = answers.get(f"q{i}", answers.get(f"Q{i}", ""))
        lines.append(f"Q{i}: {question}")
        lines.append(f"A{i}: {answer}")
        lines.append("")
    return "\n".join(lines)


def _extract_json(text: str) -> dict[str, Any]:
    """Extract JSON from text that may contain markdown fences or preamble."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)  # type: ignore[no-any-return]
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code fence
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        return json.loads(match.group(1).strip())  # type: ignore[no-any-return]

    # Try finding first { to last }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return json.loads(text[start : end + 1])  # type: ignore[no-any-return]

    raise json.JSONDecodeError("No JSON found in response", text, 0)


async def compute_desired_brand(
    answers: dict[str, str],
) -> dict[str, Any]:
    agent = build_legacy_vision_agent()
    prompt = _build_prompt(answers)

    response = await agent.arun(prompt)
    raw: str = response.content if response.content else ""
    logger.debug("LegacyVision raw response: %s", raw[:200])

    return _extract_json(raw)
