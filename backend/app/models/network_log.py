"""
Models for representing a user's network connections and interactions.
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class NetworkContactType(str, Enum):
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

    id: Optional[int] = Field(default=None, primary_key=True)
    person_name: str
    contact_type: NetworkContactType
    context: Optional[str] = None  # Brief note about the interaction
    value_given: Optional[str] = None
    value_received: Optional[str] = None
    follow_up_needed: bool = False
    logged_at: datetime = Field(default_factory=datetime.utcnow)
