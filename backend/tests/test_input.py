from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_input_entry(async_client: AsyncClient) -> None:
    payload = {
        "mode": "journal",
        "content": "This is a test journal entry",
        "context_tags": ["learning"],
    }
    response = await async_client.post("/api/v1/input", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "This is a test journal entry"
    assert data["mode"] == "journal"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_get_input_entry(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/input",
        json={"mode": "pulse", "content": "Pulse check", "emotion": "energized"},
    )
    entry_id = response.json()["id"]

    response = await async_client.get(f"/api/v1/input/{entry_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == entry_id
    assert data["mode"] == "pulse"


@pytest.mark.asyncio
async def test_update_input_entry(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/input", json={"mode": "journal", "content": "Original content"}
    )
    entry_id = response.json()["id"]

    update_payload = {"content": "Updated content"}
    response = await async_client.put(f"/api/v1/input/{entry_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"


@pytest.mark.asyncio
async def test_delete_input_entry(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/input", json={"mode": "journal", "content": "To be deleted"}
    )
    entry_id = response.json()["id"]

    response = await async_client.delete(f"/api/v1/input/{entry_id}")
    assert response.status_code == 200
    assert response.json()["deleted"] is True

    # Confirm it's gone
    response = await async_client.get(f"/api/v1/input/{entry_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_input_entries_mode_filtering(async_client: AsyncClient):
    # Create two different mode entries
    await async_client.post("/api/v1/input", json={"mode": "journal", "content": "Journal content"})
    await async_client.post("/api/v1/input", json={"mode": "network", "content": "Network content"})

    # Fetch all
    response = await async_client.get("/api/v1/input")
    assert response.status_code == 200
    assert len(response.json()) >= 2

    # Fetch only network
    response = await async_client.get("/api/v1/input?mode=network")
    assert response.status_code == 200
    data = response.json()
    # verify mode
    for entry in data:
        assert entry["mode"] == "network"

    modes = {entry["mode"] for entry in data}
    assert modes == {"network"}


# ── Auto-analysis background task ───────────────────────────────────


@pytest.mark.asyncio
@patch("app.routers.input.settings")
@patch("app.routers.input._background_analyze", new_callable=AsyncMock)
async def test_create_entry_auto_analyze_on(
    mock_bg: AsyncMock,
    mock_settings: AsyncMock,
    async_client: AsyncClient,
) -> None:
    mock_settings.auto_analyze = True

    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "Auto analyze me"},
    )
    assert resp.status_code == 200
    entry_id = resp.json()["id"]

    # BackgroundTasks runs the task inline during tests
    mock_bg.assert_awaited_once_with(entry_id)


@pytest.mark.asyncio
@patch("app.routers.input.settings")
@patch("app.routers.input._background_analyze", new_callable=AsyncMock)
async def test_create_entry_auto_analyze_off(
    mock_bg: AsyncMock,
    mock_settings: AsyncMock,
    async_client: AsyncClient,
) -> None:
    mock_settings.auto_analyze = False

    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "journal", "content": "No auto analyze"},
    )
    assert resp.status_code == 200
    mock_bg.assert_not_awaited()


@pytest.mark.asyncio
@patch("app.routers.input.run_analysis", new_callable=AsyncMock)
@patch("app.routers.input.settings")
async def test_auto_analyze_failure_does_not_break_create(
    mock_settings: AsyncMock,
    mock_run: AsyncMock,
    async_client: AsyncClient,
) -> None:
    mock_settings.auto_analyze = True
    mock_run.side_effect = RuntimeError("LLM down")

    resp = await async_client.post(
        "/api/v1/input",
        json={"mode": "pulse", "content": "Should still save"},
    )
    # Entry is saved regardless of analysis failure
    assert resp.status_code == 200
    assert resp.json()["id"] is not None
