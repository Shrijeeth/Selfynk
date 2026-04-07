"""
Application configuration and settings management.
"""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_parse_none_str="",
    )

    # Database
    database_url: str = "sqlite:///./selfynk.db"

    # LLM
    llm_provider: Literal["anthropic", "openai", "ollama"] = "anthropic"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Features
    auto_analyze: bool = True
    brand_dna_recompute_threshold: int = 5

    @property
    def cors_origins_list(self) -> list[str]:
        return [s.strip() for s in self.cors_origins.split(",") if s.strip()]


settings = Settings()
