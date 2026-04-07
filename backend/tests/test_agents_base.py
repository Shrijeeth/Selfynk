from unittest.mock import patch

import pytest
from agno.models.anthropic import Claude
from agno.models.openai import OpenAIChat

from app.agents.base import get_model


def test_get_model_anthropic():
    with patch("app.agents.base.settings") as mock_settings:
        mock_settings.llm_provider = "anthropic"
        mock_settings.anthropic_model = "claude-sonnet-4-5"
        model = get_model()
        assert isinstance(model, Claude)
        assert model.id == "claude-sonnet-4-5"


def test_get_model_openai():
    with patch("app.agents.base.settings") as mock_settings:
        mock_settings.llm_provider = "openai"
        mock_settings.openai_model = "gpt-4o"
        model = get_model()
        assert isinstance(model, OpenAIChat)
        assert model.id == "gpt-4o"


def test_get_model_ollama():
    with patch("app.agents.base.settings") as mock_settings:
        mock_settings.llm_provider = "ollama"
        mock_settings.ollama_model = "llama3.1"
        mock_settings.ollama_base_url = "http://localhost:11434"
        model = get_model()
        assert model.id == "llama3.1"


def test_get_model_unknown_provider():
    with patch("app.agents.base.settings") as mock_settings:
        mock_settings.llm_provider = "unknown"
        with pytest.raises(ValueError, match="Unknown LLM provider"):
            get_model()
