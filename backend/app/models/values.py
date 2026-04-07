"""
Models for representing a user's core values.
"""

from datetime import datetime

from sqlmodel import Field, SQLModel


class ValueItem(SQLModel, table=True):  # type: ignore[call-arg]
    """
    Represents a core value the user has declared and its context.
    """

    id: int | None = Field(default=None, primary_key=True)
    value_name: str  # e.g. "ownership"
    personal_context: str  # e.g. "I take full accountability..."
    declared_at: datetime = Field(default_factory=datetime.utcnow)
