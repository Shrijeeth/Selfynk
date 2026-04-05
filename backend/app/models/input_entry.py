"""
Models for representing a user's journal entries and inputs.
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class InputMode(str, Enum):
    """
    Enum representing different input formats for journaling.
    """

    JOURNAL = "journal"
    PULSE = "pulse"  # Daily Brand Pulse (2-min check-in)
    DEBRIEF = "debrief"  # Situation Debrief (post-meeting/interview)
    NETWORK = "network"  # Networking Log
    REVIEW = "review"  # Weekly Brand Review


class Emotion(str, Enum):
    """
    Enum representing user emotional state for an entry.
    """

    ENERGIZED = "energized"
    NEUTRAL = "neutral"
    DRAINED = "drained"


class InputEntry(SQLModel, table=True):
    """
    Represents a distinct user entry or activity log.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    mode: InputMode = InputMode.JOURNAL
    content: str  # Main text content
    context_tags: list[str] = Field(default=[], sa_column=Column(JSON))
    # ^ meeting, interview, presentation, 1:1, learning, content-creation
    emotion: Optional[Emotion] = None
    alignment_score: Optional[int] = None  # 1-10 (pulse mode only)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_analyzed: bool = False
    analysis_id: Optional[int] = Field(default=None, foreign_key="analysis.id")
