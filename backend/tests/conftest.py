from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app

test_engine = create_engine(
    "sqlite://",
    echo=False,
    connect_args={"check_same_thread": False},
)


@pytest.fixture(autouse=True)
def setup_db() -> Generator[None]:
    SQLModel.metadata.create_all(test_engine)
    yield
    SQLModel.metadata.drop_all(test_engine)


def _get_test_session() -> Generator[Session]:
    with Session(test_engine) as session:
        yield session


app.dependency_overrides[get_session] = _get_test_session


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
