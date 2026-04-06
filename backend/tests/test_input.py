import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_input_entry(async_client: AsyncClient):
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
