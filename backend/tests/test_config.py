from app.config import Settings


def test_default_settings():
    s = Settings(
        _env_file=None,  # type: ignore[call-arg]
    )
    assert s.llm_provider == "anthropic"
    assert s.backend_port == 8000
    assert s.auto_analyze is True
    assert s.brand_dna_recompute_threshold == 5


def test_cors_origins_single():
    s = Settings(
        cors_origins="http://localhost:3000",
        _env_file=None,  # type: ignore[call-arg]
    )
    assert s.cors_origins_list == ["http://localhost:3000"]


def test_cors_origins_multiple():
    s = Settings(
        cors_origins="http://localhost:3000, http://example.com",
        _env_file=None,  # type: ignore[call-arg]
    )
    assert s.cors_origins_list == ["http://localhost:3000", "http://example.com"]


def test_cors_origins_empty():
    s = Settings(
        cors_origins="",
        _env_file=None,  # type: ignore[call-arg]
    )
    assert s.cors_origins_list == []
