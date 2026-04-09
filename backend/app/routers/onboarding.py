"""Onboarding router — legacy exercise, values declaration, voice samples."""

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.agents.legacy_vision import compute_desired_brand
from app.agents.memory_extractor import (
    detect_format,
    extract_legacy_answers,
    parse_export,
)
from app.database import get_session
from app.models.desired_brand import DesiredBrandStatement
from app.models.values import ValueItem
from app.models.voice_sample import VoiceSample
from app.schemas.onboarding import (
    DesiredBrandStatementRead,
    LegacyExerciseRequest,
    MemoryImportResponse,
    OnboardingStatus,
    ValueItemRead,
    ValuesRequest,
    VoiceSampleRead,
    VoiceSamplesRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    session: Session = Depends(get_session),
) -> OnboardingStatus:
    legacy_done = session.exec(select(DesiredBrandStatement).limit(1)).first() is not None
    values_done = session.exec(select(ValueItem).limit(1)).first() is not None
    voice_done = session.exec(select(VoiceSample).limit(1)).first() is not None

    return OnboardingStatus(
        legacy_done=legacy_done,
        values_done=values_done,
        voice_done=voice_done,
    )


@router.post(
    "/legacy-exercise",
    response_model=DesiredBrandStatementRead,
)
async def submit_legacy_exercise(
    body: LegacyExerciseRequest,
    session: Session = Depends(get_session),
) -> DesiredBrandStatement:
    try:
        result = await compute_desired_brand(body.answers)
    except Exception as e:
        logger.exception("Legacy vision agent failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate brand statement: {e!s}",
        ) from e

    # Determine version
    existing = session.exec(
        select(DesiredBrandStatement)
        .order_by(DesiredBrandStatement.version.desc())  # type: ignore[union-attr, attr-defined]
        .limit(1)
    ).first()
    version = (existing.version + 1) if existing else 1

    statement = DesiredBrandStatement(
        legacy_words=result.get("legacy_words", []),
        desired_description=result.get("desired_description", ""),
        reverse_engineered_actions=result.get("reverse_engineered_actions", []),
        version=version,
    )
    session.add(statement)
    session.commit()
    session.refresh(statement)
    return statement


MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/import-memory", response_model=MemoryImportResponse)
async def import_memory(
    files: list[UploadFile] = File([]),
    raw_text: str | None = Form(None),
) -> MemoryImportResponse:
    if not files and not raw_text:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one file upload or raw_text.",
        )

    try:
        text_parts: list[str] = []
        source_types: list[str] = []

        for f in files:
            content = await f.read()
            if len(content) > MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File '{f.filename}' is too large. Maximum size is 50MB.",
                )
            fmt = detect_format(content)
            text_parts.append(parse_export(content, fmt))
            source_types.append(fmt)

        if raw_text:
            text_parts.append(raw_text)
            source_types.append("raw")

        combined_text = "\n\n".join(text_parts)

        # Determine source_type: "mixed" if multiple different types
        unique_types = set(source_types)
        source_type = unique_types.pop() if len(unique_types) == 1 else "mixed"

        result = await extract_legacy_answers(combined_text)

        answers = {k: v for k, v in result.items() if k.startswith("q") and k != "confidence"}
        confidence = result.get("confidence", {})

        return MemoryImportResponse(
            answers=answers,
            confidence=confidence,
            source_type=source_type,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Memory import failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract answers: {e!s}",
        ) from e


@router.post("/values", response_model=list[ValueItemRead])
async def submit_values(
    body: ValuesRequest,
    session: Session = Depends(get_session),
) -> list[ValueItem]:
    items: list[ValueItem] = []
    for v in body.values:
        item = ValueItem(
            value_name=v.value_name,
            personal_context=v.personal_context,
        )
        session.add(item)
        items.append(item)
    session.commit()
    for item in items:
        session.refresh(item)
    return items


@router.get("/values", response_model=list[ValueItemRead])
async def get_values(
    session: Session = Depends(get_session),
) -> list[ValueItem]:
    return list(session.exec(select(ValueItem)).all())


@router.post("/voice-samples", response_model=list[VoiceSampleRead])
async def submit_voice_samples(
    body: VoiceSamplesRequest,
    session: Session = Depends(get_session),
) -> list[VoiceSample]:
    samples: list[VoiceSample] = []
    for s in body.samples:
        sample = VoiceSample(
            content=s.content,
            source_type=s.source_type,
        )
        session.add(sample)
        samples.append(sample)
    session.commit()
    for sample in samples:
        session.refresh(sample)
    return samples
