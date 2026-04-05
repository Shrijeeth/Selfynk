"""
Models for representing a user's Brand DNA.
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class BrandDNA(SQLModel, table=True):
    """
    Represents the derived Brand DNA attributes for a user, such as positioning,
    niche, voice, strengths, and content pillars.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    positioning: str  # "You are best positioned as: X"
    niche: str  # Specific area of expertise/identity
    voice: str  # authoritative / conversational / analytical
    strengths: list[str] = Field(default=[], sa_column=Column(JSON))
    content_pillars: list[str] = Field(default=[], sa_column=Column(JSON))
    credibility_score: Optional[int] = None  # 0-100, from CredibilityAgent
    gap_summary: Optional[str] = None  # Current vs desired gap narrative
    entries_analyzed: int = 0  # How many entries this was computed from
    computed_at: datetime = Field(default_factory=datetime.utcnow)
