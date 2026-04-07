"""
Models for representing a user's journal entries and inputs.
"""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class InputMode(StrEnum):
    """
    Enum representing different input formats for journaling.
    """

    JOURNAL = "journal"
    PULSE = "pulse"  # Daily Brand Pulse (2-min check-in)
    DEBRIEF = "debrief"  # Situation Debrief (post-meeting/interview)
    NETWORK = "network"  # Networking Log
    REVIEW = "review"  # Weekly Brand Review


class Emotion(StrEnum):
    """
    Enum representing user emotional state for an entry.
    """

    ENERGIZED = "energized"
    NEUTRAL = "neutral"
    DRAINED = "drained"


class InputEntry(SQLModel, table=True):  # type: ignore[call-arg]
    """
    Represents a distinct user entry or activity log.
    """

    id: int | None = Field(default=None, primary_key=True)
    mode: InputMode = InputMode.JOURNAL
    content: str  # Main text content
    context_tags: list[str] = Field(default=[], sa_column=Column(JSON))
    # ^ meeting, interview, presentation, 1:1, learning, content-creation
    emotion: Emotion | None = None
    alignment_score: int | None = None  # 1-10 (pulse mode only)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_analyzed: bool = False
    analysis_id: int | None = Field(default=None, foreign_key="analysis.id")
