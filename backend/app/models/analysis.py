"""
Models for analysis of user entries.
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class Analysis(SQLModel, table=True):
    """
    Represents the synthesized analysis from an input entry, extracting
    themes, skills, signals, and tone.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    entry_id: int = Field(foreign_key="inputentry.id")
    themes: list[str] = Field(default=[], sa_column=Column(JSON))
    skills_detected: list[str] = Field(default=[], sa_column=Column(JSON))
    values_detected: list[str] = Field(default=[], sa_column=Column(JSON))
    tone: Optional[str] = None  # expert/learner/connector/builder/leader
    perception_signals: list[str] = Field(default=[], sa_column=Column(JSON))
    # ^ phrases that reveal how user is perceived by others
    raw_output: Optional[str] = None  # Full agent response stored for debugging
    created_at: datetime = Field(default_factory=datetime.utcnow)
