"""
Models for representing a user's desired brand and legacy statement.
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class DesiredBrandStatement(SQLModel, table=True):
    """
    Represents the target brand state, legacy words, and actionable steps to reach them.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    legacy_words: list[str] = Field(sa_column=Column(JSON))
    # ^ 3-5 words they want to be remembered by
    desired_description: str  # Full narrative of desired brand
    reverse_engineered_actions: list[str] = Field(sa_column=Column(JSON))
    # ^ Quarterly action items reverse-engineered by LegacyVisionAgent
    computed_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1  # Increments each time redone
