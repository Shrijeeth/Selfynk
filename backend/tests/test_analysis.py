"""Tests for analysis router and service."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.models.analysis import Analysis
from app.models.input_entry import InputEntry

MOCK_AGENT_RESULT = {
    "themes": ["product thinking", "team leadership"],
    "skills_detected": ["async communication", "stakeholder management"],
    "values_detected": ["transparency", "ownership"],
    "tone": "leader",
    "perception_signals": ["seen as a decisive operator"],
}


def _create_entry(session: Session, content: str = "Test journal entry") -> InputEntry:
    entry = InputEntry(mode="journal", content=content, context_tags=["meeting"])
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


# ── Router: POST trigger ────────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.routers.analysis.run_analysis")
async def test_trigger_analysis(mock_run: AsyncMock, async_client: AsyncClient) -> None:
    # Create entry first
    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "Led a retro today"},
    )
    entry_id = resp.json()["id"]

    mock_run.return_value = Analysis(
        id=1,
        entry_id=entry_id,
        **MOCK_AGENT_RESULT,
        raw_output="{}",
    )

    resp = await async_client.post(f"/api/v1/analysis/{entry_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["entry_id"] == entry_id
    assert data["themes"] == MOCK_AGENT_RESULT["themes"]
    assert data["tone"] == "leader"
    mock_run.assert_awaited_once_with(entry_id)


@pytest.mark.asyncio
async def test_trigger_analysis_entry_not_found(
    async_client: AsyncClient,
) -> None:
    resp = await async_client.post("/api/v1/analysis/9999")
    assert resp.status_code == 404


# ── Router: GET cached ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_analysis_cached(async_client: AsyncClient) -> None:
    # Create entry
    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "pulse", "content": "Quick check-in"},
    )
    entry_id = resp.json()["id"]

    # Manually insert an analysis (no LLM call)
    from tests.conftest import _get_test_session

    session = next(_get_test_session())
    analysis = Analysis(
        entry_id=entry_id,
        **MOCK_AGENT_RESULT,
        raw_output="{}",
    )
    session.add(analysis)
    session.commit()

    resp = await async_client.get(f"/api/v1/analysis/{entry_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["entry_id"] == entry_id
    assert data["skills_detected"] == MOCK_AGENT_RESULT["skills_detected"]


@pytest.mark.asyncio
async def test_get_analysis_not_found(async_client: AsyncClient) -> None:
    # Create an entry but no analysis
    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "No analysis here"},
    )
    entry_id = resp.json()["id"]

    resp = await async_client.get(f"/api/v1/analysis/{entry_id}")
    assert resp.status_code == 404


# ── Router: GET SSE stream ──────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.routers.analysis.stream_analysis")
async def test_stream_analysis_sse(mock_stream: AsyncMock, async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "Streamed entry"},
    )
    entry_id = resp.json()["id"]

    async def fake_stream(entry: InputEntry):  # type: ignore[no-untyped-def]
        yield '{"themes":'
        yield '["leadership"]}'

    mock_stream.return_value = fake_stream(InputEntry())

    resp = await async_client.get(f"/api/v1/analysis/stream/{entry_id}")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/event-stream; charset=utf-8"

    body = resp.text
    assert "event: chunk" in body
    assert "event: done" in body
    assert '{"themes":' in body


@pytest.mark.asyncio
async def test_stream_analysis_entry_not_found(
    async_client: AsyncClient,
) -> None:
    resp = await async_client.get("/api/v1/analysis/stream/9999")
    assert resp.status_code == 404


@pytest.mark.asyncio
@patch("app.routers.analysis.stream_analysis")
async def test_stream_analysis_error(mock_stream: AsyncMock, async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "Error entry"},
    )
    entry_id = resp.json()["id"]

    async def failing_stream(entry: InputEntry):  # type: ignore[no-untyped-def]
        yield "partial"
        raise RuntimeError("LLM timeout")

    mock_stream.return_value = failing_stream(InputEntry())

    resp = await async_client.get(f"/api/v1/analysis/stream/{entry_id}")
    assert resp.status_code == 200
    body = resp.text
    assert "event: error" in body
    assert "LLM timeout" in body


# ── Router: POST batch ──────────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.routers.analysis.run_analysis")
async def test_batch_analysis(mock_run: AsyncMock, async_client: AsyncClient) -> None:
    # Create two entries
    r1 = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "Entry 1"},
    )
    r2 = await async_client.post(
        "/api/v1/input",
        json={"mode": "pulse", "content": "Entry 2"},
    )
    id1 = r1.json()["id"]
    id2 = r2.json()["id"]

    mock_run.side_effect = [
        Analysis(id=10, entry_id=id1, **MOCK_AGENT_RESULT, raw_output="{}"),
        Analysis(id=11, entry_id=id2, **MOCK_AGENT_RESULT, raw_output="{}"),
    ]

    resp = await async_client.post(
        "/api/v1/analysis/batch",
        json={"entry_ids": [id1, id2]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 2
    assert data["errors"] == []
    assert mock_run.await_count == 2


@pytest.mark.asyncio
@patch("app.routers.analysis.run_analysis")
async def test_batch_analysis_partial_failure(
    mock_run: AsyncMock, async_client: AsyncClient
) -> None:
    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "Good entry"},
    )
    good_id = resp.json()["id"]
    bad_id = 9999

    mock_run.side_effect = [
        Analysis(id=10, entry_id=good_id, **MOCK_AGENT_RESULT, raw_output="{}"),
        ValueError("Entry 9999 not found"),
    ]

    resp = await async_client.post(
        "/api/v1/analysis/batch",
        json={"entry_ids": [good_id, bad_id]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 1
    assert len(data["errors"]) == 1
    assert "9999" in data["errors"][0]


@pytest.mark.asyncio
@patch("app.routers.analysis.run_analysis")
async def test_batch_analysis_empty(mock_run: AsyncMock, async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/analysis/batch",
        json={"entry_ids": []},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["results"] == []
    assert data["errors"] == []
    mock_run.assert_not_awaited()


# ── Service: run_analysis ───────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.services.analysis_service.analyze_entry", new_callable=AsyncMock)
async def test_run_analysis_service(mock_analyze: AsyncMock) -> None:
    from tests.conftest import test_engine

    mock_analyze.return_value = MOCK_AGENT_RESULT

    with Session(test_engine) as session:
        entry = _create_entry(session)
        entry_id = entry.id

    with patch("app.services.analysis_service.engine", test_engine):
        from app.services.analysis_service import run_analysis as svc_run

        result = await svc_run(entry_id)  # type: ignore[arg-type]

    assert result.themes == MOCK_AGENT_RESULT["themes"]
    assert result.tone == "leader"
    assert result.entry_id == entry_id

    with Session(test_engine) as session:
        entry = session.get(InputEntry, entry_id)
        assert entry is not None
        assert entry.is_analyzed is True
        assert entry.analysis_id == result.id


@pytest.mark.asyncio
@patch("app.services.analysis_service.analyze_entry", new_callable=AsyncMock)
async def test_run_analysis_entry_not_found(
    mock_analyze: AsyncMock,
) -> None:
    from tests.conftest import test_engine

    with (
        patch("app.services.analysis_service.engine", test_engine),
        pytest.raises(ValueError, match="not found"),
    ):
        from app.services.analysis_service import run_analysis as svc_run

        await svc_run(9999)

    mock_analyze.assert_not_awaited()
