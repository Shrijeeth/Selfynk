"""
Models for generating weekly credibility and alignment reports.
"""

from datetime import datetime

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class CredibilityReport(SQLModel, table=True):
    """
    Represents a weekly credibility report measuring the alignment of actions with desired brand.
    """

    id: int | None = Field(default=None, primary_key=True)
    week_of: datetime  # Monday of the week
    alignment_score: int  # 0-100
    aligned_moments: list[str] = Field(default=[], sa_column=Column(JSON))
    misaligned_moments: list[str] = Field(default=[], sa_column=Column(JSON))
    values_checked: list[str] = Field(default=[], sa_column=Column(JSON))
    generated_at: datetime = Field(default_factory=datetime.utcnow)
