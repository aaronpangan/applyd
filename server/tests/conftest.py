"""Shared pytest fixtures.

Tests run against a dedicated ``<db>_test`` PostgreSQL database (a real
database alongside the configured one — never the dev database itself). The
database is created once per session; every table is truncated after each test
so cases stay isolated.

All async fixtures are function-scoped on purpose: the only session-scoped
fixture (``_test_database``) is synchronous and manages its own event loop, so
the async fixtures never have to juggle event-loop scopes.
"""

import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.auth.service import _create_jwt
from src.config import settings
from src.database import get_db
from src.main import app
from src.models import Base, User

# Derive a dedicated test database alongside the configured one.
_BASE_URL, _DB_NAME = settings.DATABASE_URL.rsplit("/", 1)
TEST_DB_NAME = f"{_DB_NAME}_test"
TEST_DB_URL = f"{_BASE_URL}/{TEST_DB_NAME}"
ADMIN_URL = f"{_BASE_URL}/postgres"

_TERMINATE_CONNECTIONS = text(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
    f"WHERE datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid()"
)


async def _recreate_database() -> None:
    admin = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        await conn.execute(_TERMINATE_CONNECTIONS)
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        await conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    await admin.dispose()

    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


async def _drop_database() -> None:
    admin = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    async with admin.connect() as conn:
        await conn.execute(_TERMINATE_CONNECTIONS)
        await conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
    await admin.dispose()


@pytest.fixture(scope="session", autouse=True)
def _test_database():
    """Create a fresh ``<db>_test`` database for the run, drop it afterwards."""
    asyncio.run(_recreate_database())
    yield
    asyncio.run(_drop_database())


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(TEST_DB_URL)
    yield eng
    # Wipe every table so the next test starts clean.
    async with eng.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f'TRUNCATE TABLE "{table.name}" CASCADE'))
    await eng.dispose()


@pytest_asyncio.fixture
async def session(engine):
    """A DB session for arranging test data and asserting on state."""
    maker = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with maker() as s:
        yield s


@pytest_asyncio.fixture
async def client(engine):
    """An HTTP client wired to the app with ``get_db`` pointed at the test DB."""
    maker = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def _override_get_db():
        async with maker() as s:
            yield s

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(session) -> User:
    user = User(
        google_id="test-google-id",
        email="tester@example.com",
        name="Test Tester",
        avatar_url=None,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict[str, str]:
    """Authorization header carrying a valid app JWT for ``test_user``."""
    return {"Authorization": f"Bearer {_create_jwt(test_user)}"}


@pytest.fixture
def job_payload():
    """Factory for a valid ``POST /jobs`` body — override any field as needed."""

    def _make(**overrides) -> dict:
        payload = {
            "company": "Acme Corp",
            "position": "Frontend Engineer",
            "work_setup": "remote",
            "link": "https://acme.test/jobs/fe",
            "applied_at": "2026-03-04",
            "status": "applied",
            "priority": "high",
        }
        payload.update(overrides)
        return payload

    return _make
