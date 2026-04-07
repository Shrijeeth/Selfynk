from sqlmodel import Session, SQLModel, create_engine

from app.schemas.input import InputEntryCreate, InputEntryUpdate
from app.services.input_service import (
    create_entry,
    delete_entry,
    get_entry,
    list_entries,
    update_entry,
)


def _make_session() -> Session:
    engine = create_engine("sqlite://", echo=False)
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def test_create_and_get_entry():
    session = _make_session()
    payload = InputEntryCreate(mode="journal", content="Hello world", context_tags=["learning"])
    entry = create_entry(session, payload)
    assert entry.id is not None
    assert entry.content == "Hello world"

    fetched = get_entry(session, entry.id)
    assert fetched is not None
    assert fetched.id == entry.id


def test_list_entries_empty():
    session = _make_session()
    entries = list_entries(session)
    assert entries == []


def test_list_entries_with_mode_filter():
    session = _make_session()
    create_entry(session, InputEntryCreate(mode="journal", content="j1"))
    create_entry(session, InputEntryCreate(mode="pulse", content="p1"))
    create_entry(session, InputEntryCreate(mode="journal", content="j2"))

    all_entries = list_entries(session)
    assert len(all_entries) == 3

    journal_only = list_entries(session, mode="journal")  # type: ignore[arg-type]
    assert len(journal_only) == 2
    assert all(e.mode == "journal" for e in journal_only)

    pulse_only = list_entries(session, mode="pulse")  # type: ignore[arg-type]
    assert len(pulse_only) == 1


def test_list_entries_limit_and_offset():
    session = _make_session()
    for i in range(5):
        create_entry(session, InputEntryCreate(mode="journal", content=f"entry {i}"))

    limited = list_entries(session, limit=2)
    assert len(limited) == 2

    offset = list_entries(session, limit=2, offset=3)
    assert len(offset) == 2


def test_update_entry():
    session = _make_session()
    entry = create_entry(session, InputEntryCreate(mode="journal", content="original"))

    updated = update_entry(session, entry, InputEntryUpdate(content="updated"))
    assert updated.content == "updated"
    assert updated.mode == "journal"  # unchanged


def test_update_entry_partial():
    session = _make_session()
    entry = create_entry(
        session,
        InputEntryCreate(
            mode="pulse", content="test", context_tags=["meeting"], emotion="energized"
        ),
    )

    updated = update_entry(session, entry, InputEntryUpdate(emotion="drained"))
    assert updated.emotion == "drained"
    assert updated.content == "test"  # unchanged
    assert updated.context_tags == ["meeting"]  # unchanged


def test_delete_entry():
    session = _make_session()
    entry = create_entry(session, InputEntryCreate(mode="journal", content="to delete"))
    assert entry.id is not None

    result = delete_entry(session, entry.id)
    assert result is True

    assert get_entry(session, entry.id) is None


def test_delete_nonexistent():
    session = _make_session()
    result = delete_entry(session, 9999)
    assert result is False


def test_get_nonexistent():
    session = _make_session()
    assert get_entry(session, 9999) is None


def test_create_entry_with_all_fields():
    session = _make_session()
    entry = create_entry(
        session,
        InputEntryCreate(
            mode="pulse",
            content="Full entry",
            context_tags=["meeting", "1:1"],
            emotion="energized",
            alignment_score=8,
        ),
    )
    assert entry.mode == "pulse"
    assert entry.context_tags == ["meeting", "1:1"]
    assert entry.emotion == "energized"
    assert entry.alignment_score == 8
    assert entry.is_analyzed is False
