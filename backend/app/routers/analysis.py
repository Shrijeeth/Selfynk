"""Analysis router — trigger, retrieve, stream, and batch analysis."""

import logging
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.agents.analyst import stream_analysis
from app.database import get_session
from app.models.analysis import Analysis
from app.models.input_entry import InputEntry
from app.schemas.analysis import (
    AnalysisRead,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
)
from app.services.analysis_service import run_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


@router.post("/{entry_id}", response_model=AnalysisRead)
async def trigger_analysis(
    entry_id: int,
    session: Session = Depends(get_session),
) -> Analysis:
    entry = session.get(InputEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    try:
        return await run_analysis(entry_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/{entry_id}", response_model=AnalysisRead)
async def get_analysis(
    entry_id: int,
    session: Session = Depends(get_session),
) -> Analysis:
    statement = select(Analysis).where(Analysis.entry_id == entry_id)
    analysis = session.exec(statement).first()
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this entry",
        )
    return analysis


@router.get("/stream/{entry_id}")
async def stream_analysis_sse(
    entry_id: int,
    session: Session = Depends(get_session),
) -> StreamingResponse:
    entry = session.get(InputEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    async def event_generator() -> AsyncGenerator[str]:
        try:
            async for chunk in stream_analysis(entry):
                yield f"event: chunk\ndata: {chunk}\n\n"
            yield "event: done\ndata: complete\n\n"
        except Exception as e:
            logger.exception("Stream analysis error for entry %s", entry_id)
            yield f"event: error\ndata: {e!s}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/batch", response_model=BatchAnalysisResponse)
async def batch_analysis(
    body: BatchAnalysisRequest,
) -> BatchAnalysisResponse:
    results: list[Analysis] = []
    errors: list[str] = []

    for entry_id in body.entry_ids:
        try:
            analysis = await run_analysis(entry_id)
            results.append(analysis)
        except Exception as e:
            logger.exception("Batch analysis error for entry %s", entry_id)
            errors.append(f"Entry {entry_id}: {e!s}")

    return BatchAnalysisResponse(
        results=[AnalysisRead.model_validate(r) for r in results],
        errors=errors,
    )
