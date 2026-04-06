"""Database configuration and session management."""

from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# Engine parameters, specifically check_same_thread is needed for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}

engine = create_engine(settings.database_url, echo=True, connect_args=connect_args)


def create_db_and_tables() -> None:
    """Create database and tables based on SQLModel metadata."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session]:
    """Dependency to provide a database session."""
    with Session(engine) as session:
        yield session
