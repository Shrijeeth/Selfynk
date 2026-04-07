"""Service layer for running analysis on input entries."""

import json
import logging

from sqlmodel import Session

from app.agents.analyst import analyze_entry
from app.database import engine
from app.models.analysis import Analysis
from app.models.input_entry import InputEntry

logger = logging.getLogger(__name__)


async def run_analysis(entry_id: int) -> Analysis:
    """Run the analyst agent on an entry, persist results, and mark entry as analyzed."""
    with Session(engine) as session:
        entry = session.get(InputEntry, entry_id)
        if not entry:
            raise ValueError(f"Entry {entry_id} not found")

        result = await analyze_entry(entry)

        analysis = Analysis(
            entry_id=entry_id,
            themes=result.get("themes", []),
            skills_detected=result.get("skills_detected", []),
            values_detected=result.get("values_detected", []),
            tone=result.get("tone"),
            perception_signals=result.get("perception_signals", []),
            raw_output=json.dumps(result),
        )
        session.add(analysis)
        session.flush()

        entry.is_analyzed = True
        entry.analysis_id = analysis.id
        session.add(entry)
        session.commit()
        session.refresh(analysis)

        logger.info("Analysis %s created for entry %s", analysis.id, entry_id)
        return analysis
