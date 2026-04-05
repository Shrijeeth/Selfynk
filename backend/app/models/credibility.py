"""
Models for generating weekly credibility and alignment reports.
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class CredibilityReport(SQLModel, table=True):
    """
    Represents a weekly credibility report measuring the alignment of actions with desired brand.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    week_of: datetime  # Monday of the week
    alignment_score: int  # 0-100
    aligned_moments: list[str] = Field(default=[], sa_column=Column(JSON))
    misaligned_moments: list[str] = Field(default=[], sa_column=Column(JSON))
    values_checked: list[str] = Field(default=[], sa_column=Column(JSON))
    generated_at: datetime = Field(default_factory=datetime.utcnow)
