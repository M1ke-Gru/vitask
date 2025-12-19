import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from uuid import uuid4

from app.main import app
from app.database import Base, get_db
from app import models

TEST_PASSWORD = "P@SSWORD"

engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):
        if trans.nested and not sess.is_active:
            sess.begin_nested()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session  # ← same session for app routes

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def seed_user(client: TestClient) -> dict:
    uid = uuid4().hex[:8]
    payload = {
        "username": f"user_{uid}",
        "password": TEST_PASSWORD,
        "email": f"user_{uid}@example.com",
    }
    r = client.post("/auth/signup", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture(scope="function")
def user_access_token(client: TestClient, seed_user: dict) -> str:
    data = {
        "username": seed_user["username"],
        "password": TEST_PASSWORD,
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="function")
def seed_task(client: TestClient, user_access_token: str) -> dict:
    payload = {"name": "Code", "is_done": "false"}
    r = client.post(
        "/task/create",
        headers={"Authorization": f"Bearer {user_access_token}"},
        json=payload,
    )
    assert r.status_code == 201
    return r.json()


@pytest.fixture(scope="function")
def seed_tasks(client: TestClient, user_access_token: str) -> list[dict]:
    payload = [
        {"name": "Code", "is_done": "false"},
        {"name": "Do dishes", "is_done": "true"},
        {"name": "Study", "is_done": "true"},
        {"name": "Clean my room", "is_done": "false"},
    ]
    responses = []
    for task in payload:
        responses.append(
            client.post(
                "/task/create",
                headers={"Authorization": f"Bearer {user_access_token}"},
                json=task,
            ).json()
        )
    return responses
