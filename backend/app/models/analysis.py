"""
Models for analysis of user entries.
"""

from datetime import datetime

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class Analysis(SQLModel, table=True):  # type: ignore[call-arg]
    """
    Represents the synthesized analysis from an input entry, extracting
    themes, skills, signals, and tone.
    """

    id: int | None = Field(default=None, primary_key=True)
    entry_id: int = Field(foreign_key="inputentry.id")
    themes: list[str] = Field(default=[], sa_column=Column(JSON))
    skills_detected: list[str] = Field(default=[], sa_column=Column(JSON))
    values_detected: list[str] = Field(default=[], sa_column=Column(JSON))
    tone: str | None = None  # expert/learner/connector/builder/leader
    perception_signals: list[str] = Field(default=[], sa_column=Column(JSON))
    # ^ phrases that reveal how user is perceived by others
    raw_output: str | None = None  # Full agent response stored for debugging
    created_at: datetime = Field(default_factory=datetime.utcnow)
