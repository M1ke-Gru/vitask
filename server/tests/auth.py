import pytest
from uuid import uuid4

from app.auth import logout

TEST_PASSWORD = "P@SSWORD"


@pytest.mark.anyio
def test_signup(client):
    payload = {
        "username": "abcd",
        "password": TEST_PASSWORD,
        "email": "abcd@example.com",
        "grant_type": "password",
    }
    response = client.post(
        "/auth/signup", headers={"content-type": "application/json"}, json=payload
    )
    assert response.status_code == 201, response.text


@pytest.fixture(scope="function")
def seed_user(client) -> dict:
    uid = uuid4().hex[:8]
    payload = {
        "username": f"user_{uid}",
        "password": TEST_PASSWORD,
        "email": f"user_{uid}@example.com",
    }
    response = client.post(
        "/auth/signup", headers={"content-type": "application/json"}, json=payload
    )
    return response.json()


def _assert_token_response(resp_json):
    assert "access_token" in resp_json and resp_json["access_token"]
    assert "refresh_token" in resp_json and resp_json["refresh_token"]
    if "token_type" in resp_json:
        assert resp_json["token_type"] in ("bearer", "Bearer")


def test_login_with_username_success(client, seed_user):
    data = {
        "username": seed_user["username"],
        "password": TEST_PASSWORD,
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)
    assert r.status_code == 200, r.text + seed_user["username"]
    _assert_token_response(r.json())


def test_login_wrong_password(client, seed_user):
    data = {
        "username": seed_user["username"],
        "password": "wrong_password",
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)
    assert r.status_code == 401, r.text
    assert "incorrect" in r.text.lower()


def test_login_unknown_user(client):
    data = {
        "username": "does_not_exist",
        "password": "whatever",
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)
    assert r.status_code == 401


@pytest.fixture(scope="function")
def user_access_token(client, seed_user) -> dict:
    data = {
        "username": seed_user["username"],
        "password": TEST_PASSWORD,
        "grant_type": "password",
    }
    response = client.post("/auth/token", data=data)
    return response.json()["access_token"]


def test_logout_successful(client, user_access_token):
    res = client.post(
        "/auth/logout", headers={"Authorization": f"Bearer {user_access_token}"}
    )
    assert res.json() == {"detail": "Logged out"}, res.text
