"""
Provider factory for LLM models.

Returns the correct Agno model instance based on the configured provider
in settings.llm_provider. Supports Anthropic, OpenAI, and Ollama.
"""

from agno.models.anthropic import Claude
from agno.models.ollama import Ollama
from agno.models.openai import OpenAIChat

from app.config import settings

ModelType = Claude | OpenAIChat


def get_model() -> ModelType:
    if settings.llm_provider == "anthropic":
        return Claude(id=settings.anthropic_model)
    elif settings.llm_provider == "openai":
        return OpenAIChat(id=settings.openai_model)
    elif settings.llm_provider == "ollama":
        return Ollama(id=settings.ollama_model, host=settings.ollama_base_url)  # type: ignore[return-value]
    raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")
