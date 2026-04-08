"""Shared utilities for agent response parsing."""

import json
import re
from typing import Any


def extract_json(text: str) -> dict[str, Any]:
    """Extract JSON from text that may contain markdown fences or preamble."""
    text = text.strip()
    try:
        return json.loads(text)  # type: ignore[no-any-return]
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        return json.loads(match.group(1).strip())  # type: ignore[no-any-return]

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return json.loads(text[start : end + 1])  # type: ignore[no-any-return]

    raise json.JSONDecodeError("No JSON found in response", text, 0)
