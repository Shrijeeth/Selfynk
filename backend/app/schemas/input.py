from datetime import datetime

from pydantic import BaseModel

from app.models.input_entry import Emotion, InputMode


class InputEntryBase(BaseModel):
    mode: InputMode = InputMode.JOURNAL
    content: str
    context_tags: list[str] = []
    emotion: Emotion | None = None
    alignment_score: int | None = None


class InputEntryCreate(InputEntryBase):
    pass


class InputEntryUpdate(BaseModel):
    mode: InputMode | None = None
    content: str | None = None
    context_tags: list[str] | None = None
    emotion: Emotion | None = None
    alignment_score: int | None = None


class InputEntryRead(InputEntryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_analyzed: bool
    analysis_id: int | None
