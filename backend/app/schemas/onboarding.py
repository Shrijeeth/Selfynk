from datetime import datetime

from pydantic import BaseModel


class LegacyExerciseRequest(BaseModel):
    answers: dict[str, str]


class DesiredBrandStatementRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    legacy_words: list[str]
    desired_description: str
    reverse_engineered_actions: list[str]
    computed_at: datetime
    version: int


class ValueItemInput(BaseModel):
    value_name: str
    personal_context: str


class ValuesRequest(BaseModel):
    values: list[ValueItemInput]


class ValueItemRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    value_name: str
    personal_context: str
    declared_at: datetime


class VoiceSampleInput(BaseModel):
    content: str
    source_type: str


class VoiceSamplesRequest(BaseModel):
    samples: list[VoiceSampleInput]


class VoiceSampleRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    content: str
    source_type: str
    indexed_at: datetime


class OnboardingStatus(BaseModel):
    legacy_done: bool
    values_done: bool
    voice_done: bool


class MemoryImportResponse(BaseModel):
    answers: dict[str, str]
    confidence: dict[str, str]
    source_type: str
