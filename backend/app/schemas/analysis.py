from datetime import datetime

from pydantic import BaseModel


class AnalysisRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    entry_id: int
    themes: list[str]
    skills_detected: list[str]
    values_detected: list[str]
    tone: str | None
    perception_signals: list[str]
    raw_output: str | None
    created_at: datetime


class BatchAnalysisRequest(BaseModel):
    entry_ids: list[int]


class BatchAnalysisResponse(BaseModel):
    results: list[AnalysisRead]
    errors: list[str]
