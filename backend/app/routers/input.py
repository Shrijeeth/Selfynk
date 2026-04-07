import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlmodel import Session

from app.config import settings
from app.database import get_session
from app.models.input_entry import InputEntry, InputMode
from app.schemas.input import InputEntryCreate, InputEntryRead, InputEntryUpdate
from app.services import input_service
from app.services.analysis_service import run_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/input", tags=["input"])


async def _background_analyze(entry_id: int) -> None:
    try:
        await run_analysis(entry_id)
        logger.info("Auto-analysis completed for entry %s", entry_id)
    except Exception:
        logger.exception("Auto-analysis failed for entry %s", entry_id)


@router.post("", response_model=InputEntryRead)
async def create_input_entry(
    entry_in: InputEntryCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> InputEntry:
    entry = input_service.create_entry(session=session, entry_in=entry_in)
    if settings.auto_analyze and entry.id is not None:
        background_tasks.add_task(_background_analyze, entry.id)
    return entry


@router.get("", response_model=list[InputEntryRead])
async def list_input_entries(
    mode: InputMode | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    session: Session = Depends(get_session),
) -> list[InputEntry]:
    return input_service.list_entries(session=session, mode=mode, limit=limit, offset=offset)


@router.get("/{entry_id}", response_model=InputEntryRead)
async def get_input_entry(entry_id: int, session: Session = Depends(get_session)) -> InputEntry:
    entry = input_service.get_entry(session=session, entry_id=entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Input entry not found")
    return entry


@router.put("/{entry_id}", response_model=InputEntryRead)
async def update_input_entry(
    entry_id: int, entry_in: InputEntryUpdate, session: Session = Depends(get_session)
) -> InputEntry:
    entry = input_service.get_entry(session=session, entry_id=entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Input entry not found")
    return input_service.update_entry(session=session, entry_db=entry, entry_in=entry_in)


@router.delete("/{entry_id}")
async def delete_input_entry(
    entry_id: int, session: Session = Depends(get_session)
) -> dict[str, bool]:
    success = input_service.delete_entry(session=session, entry_id=entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Input entry not found")
    return {"deleted": True}
