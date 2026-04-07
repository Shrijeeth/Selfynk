"""
Models for representing a user's self-perception vs external perception.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel


class PerceptionReport(SQLModel, table=True):  # type: ignore[call-arg]
    """
    Represents an analysis of the gap between how a user sees themselves and how they are perceived.
    """

    id: int | None = Field(default=None, primary_key=True)
    self_description_summary: str  # How user describes themselves
    perceived_description: str  # How others likely perceive them
    gap_analysis: str  # Narrative of the gap
    entries_analyzed: int = 0
    generated_at: datetime = Field(default_factory=datetime.utcnow)
