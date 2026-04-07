"""Tests for onboarding router endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

# ── GET /status ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_onboarding_status_all_false(async_client: AsyncClient) -> None:
    resp = await async_client.get("/api/v1/onboarding/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data == {
        "legacy_done": False,
        "values_done": False,
        "voice_done": False,
    }


@pytest.mark.asyncio
async def test_onboarding_status_after_values(async_client: AsyncClient) -> None:
    await async_client.post(
        "/api/v1/onboarding/values",
        json={"values": [{"value_name": "honesty", "personal_context": "Always tell the truth"}]},
    )

    resp = await async_client.get("/api/v1/onboarding/status")
    data = resp.json()
    assert data["values_done"] is True
    assert data["legacy_done"] is False
    assert data["voice_done"] is False


@pytest.mark.asyncio
async def test_onboarding_status_after_voice(async_client: AsyncClient) -> None:
    await async_client.post(
        "/api/v1/onboarding/voice-samples",
        json={"samples": [{"content": "Sample text", "source_type": "linkedin_post"}]},
    )

    resp = await async_client.get("/api/v1/onboarding/status")
    data = resp.json()
    assert data["voice_done"] is True


# ── POST /legacy-exercise ───────────────────────────────────────────


@pytest.mark.asyncio
@patch("app.routers.onboarding.compute_desired_brand", new_callable=AsyncMock)
async def test_submit_legacy_exercise(mock_compute: AsyncMock, async_client: AsyncClient) -> None:
    mock_compute.return_value = {
        "legacy_words": ["bold", "kind", "relentless"],
        "desired_description": "You want to be known as bold and kind.",
        "reverse_engineered_actions": [
            "Publish a blog post",
            "Mentor someone",
        ],
    }

    resp = await async_client.post(
        "/api/v1/onboarding/legacy-exercise",
        json={"answers": {"q1": "bold, kind, relentless", "q2": "education"}},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["legacy_words"] == ["bold", "kind", "relentless"]
    assert data["desired_description"] == "You want to be known as bold and kind."
    assert len(data["reverse_engineered_actions"]) == 2
    assert data["version"] == 1
    assert data["id"] is not None


@pytest.mark.asyncio
@patch("app.routers.onboarding.compute_desired_brand", new_callable=AsyncMock)
async def test_legacy_exercise_increments_version(
    mock_compute: AsyncMock, async_client: AsyncClient
) -> None:
    mock_compute.return_value = {
        "legacy_words": ["v1"],
        "desired_description": "First version",
        "reverse_engineered_actions": ["action1"],
    }

    resp1 = await async_client.post(
        "/api/v1/onboarding/legacy-exercise",
        json={"answers": {"q1": "v1"}},
    )
    assert resp1.json()["version"] == 1

    mock_compute.return_value = {
        "legacy_words": ["v2"],
        "desired_description": "Second version",
        "reverse_engineered_actions": ["action2"],
    }

    resp2 = await async_client.post(
        "/api/v1/onboarding/legacy-exercise",
        json={"answers": {"q1": "v2"}},
    )
    assert resp2.json()["version"] == 2


@pytest.mark.asyncio
@patch("app.routers.onboarding.compute_desired_brand", new_callable=AsyncMock)
async def test_legacy_exercise_agent_failure(
    mock_compute: AsyncMock, async_client: AsyncClient
) -> None:
    mock_compute.side_effect = RuntimeError("LLM unavailable")

    resp = await async_client.post(
        "/api/v1/onboarding/legacy-exercise",
        json={"answers": {"q1": "test"}},
    )
    assert resp.status_code == 500
    assert "Failed to generate" in resp.json()["detail"]


@pytest.mark.asyncio
@patch("app.routers.onboarding.compute_desired_brand", new_callable=AsyncMock)
async def test_legacy_exercise_updates_status(
    mock_compute: AsyncMock, async_client: AsyncClient
) -> None:
    mock_compute.return_value = {
        "legacy_words": ["a"],
        "desired_description": "desc",
        "reverse_engineered_actions": [],
    }

    await async_client.post(
        "/api/v1/onboarding/legacy-exercise",
        json={"answers": {"q1": "a"}},
    )

    resp = await async_client.get("/api/v1/onboarding/status")
    assert resp.json()["legacy_done"] is True


# ── POST /values ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_submit_values(async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/onboarding/values",
        json={
            "values": [
                {"value_name": "honesty", "personal_context": "Always truthful"},
                {"value_name": "growth", "personal_context": "Never stop learning"},
            ]
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["value_name"] == "honesty"
    assert data[1]["value_name"] == "growth"
    assert data[0]["id"] is not None


@pytest.mark.asyncio
async def test_submit_empty_values(async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/onboarding/values",
        json={"values": []},
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ── GET /values ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_values_empty(async_client: AsyncClient) -> None:
    resp = await async_client.get("/api/v1/onboarding/values")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_values_after_submit(async_client: AsyncClient) -> None:
    await async_client.post(
        "/api/v1/onboarding/values",
        json={
            "values": [
                {"value_name": "courage", "personal_context": "Speak up"},
            ]
        },
    )

    resp = await async_client.get("/api/v1/onboarding/values")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["value_name"] == "courage"


# ── POST /voice-samples ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_submit_voice_samples(async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/onboarding/voice-samples",
        json={
            "samples": [
                {"content": "My LinkedIn post about leadership", "source_type": "linkedin_post"},
                {"content": "An email I wrote to my team", "source_type": "email"},
            ]
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["source_type"] == "linkedin_post"
    assert data[1]["source_type"] == "email"
    assert data[0]["id"] is not None


@pytest.mark.asyncio
async def test_submit_empty_voice_samples(async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/onboarding/voice-samples",
        json={"samples": []},
    )
    assert resp.status_code == 200
    assert resp.json() == []
