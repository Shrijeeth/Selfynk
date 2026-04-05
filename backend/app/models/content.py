"""
Models for representing generated personal brand content.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class ContentPlatform(str, Enum):
    """
    Enum representing various content compilation target platforms.
    """

    LINKEDIN_POST = "linkedin_post"
    TWITTER_THREAD = "twitter_thread"
    BIO_SHORT = "bio_short"  # 2-3 sentences
    BIO_LONG = "bio_long"  # Full paragraph
    ELEVATOR_PITCH_30S = "elevator_pitch_30s"
    ELEVATOR_PITCH_60S = "elevator_pitch_60s"


class GeneratedContent(SQLModel, table=True):
    """
    Represents content generated from a user's inputs tailored for a specific platform.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    source_entry_id: Optional[int] = Field(default=None, foreign_key="inputentry.id")
    platform: ContentPlatform
    content: str
    status: str = "draft"  # draft / archived
    created_at: datetime = Field(default_factory=datetime.utcnow)
