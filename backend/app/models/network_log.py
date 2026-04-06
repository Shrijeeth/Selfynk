"""
Models for representing a user's network connections and interactions.
"""

from datetime import datetime
from enum import StrEnum

from sqlmodel import Field, SQLModel


class NetworkContactType(StrEnum):
    """
    Enum representing different types of network contacts.
    """

    DECISION_MAKER = "decision_maker"
    INFO_SOURCE = "info_source"
    SUPPORTER = "supporter"


class NetworkLog(SQLModel, table=True):
    """
    Represents a log of a networking interaction.
    """

    id: int | None = Field(default=None, primary_key=True)
    person_name: str
    contact_type: NetworkContactType
    context: str | None = None  # Brief note about the interaction
    value_given: str | None = None
    value_received: str | None = None
    follow_up_needed: bool = False
    logged_at: datetime = Field(default_factory=datetime.utcnow)
