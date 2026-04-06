"""
Models for analyzing and representing a user's writing voice.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel


class VoiceSample(SQLModel, table=True):
    """
    Represents a sample of a user's writing to learn their unique voice.
    """

    id: int | None = Field(default=None, primary_key=True)
    content: str  # Pasted writing sample
    source_type: str  # linkedin_post / email / bio / other
    indexed_at: datetime = Field(default_factory=datetime.utcnow)
