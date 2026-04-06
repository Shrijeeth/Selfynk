from sqlmodel import Session, col, select

from app.models.input_entry import InputEntry, InputMode
from app.schemas.input import InputEntryCreate, InputEntryUpdate


def create_entry(session: Session, entry_in: InputEntryCreate) -> InputEntry:
    db_entry = InputEntry.model_validate(entry_in)
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry


def list_entries(
    session: Session, mode: InputMode | None = None, limit: int = 100, offset: int = 0
) -> list[InputEntry]:
    statement = select(InputEntry)
    if mode:
        statement = statement.where(InputEntry.mode == mode)
    statement = statement.offset(offset).limit(limit).order_by(col(InputEntry.created_at).desc())
    return list(session.exec(statement).all())


def get_entry(session: Session, entry_id: int) -> InputEntry | None:
    return session.get(InputEntry, entry_id)


def update_entry(session: Session, entry_db: InputEntry, entry_in: InputEntryUpdate) -> InputEntry:
    update_data = entry_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry_db, key, value)

    session.add(entry_db)
    session.commit()
    session.refresh(entry_db)
    return entry_db


def delete_entry(session: Session, entry_id: int) -> bool:
    entry = session.get(InputEntry, entry_id)
    if not entry:
        return False
    session.delete(entry)
    session.commit()
    return True
