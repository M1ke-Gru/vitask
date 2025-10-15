import pytest
from fastapi.testclient import TestClient
from tests.conftest import TEST_PASSWORD


def test_signup(client: TestClient):
    payload = {
        "username": "abcd",
        "password": TEST_PASSWORD,
        "email": "abcd@example.com",
    }
    r = client.post("/auth/signup", json=payload)
    assert r.status_code == 201, r.text


def _assert_token_response(resp_json: dict, require_refresh: bool = False):
    assert resp_json.get("access_token")
    if "token_type" in resp_json:
        assert resp_json["token_type"].lower() == "bearer"
    if require_refresh:
        assert resp_json.get("refresh_token")


def test_login_with_username_success(client: TestClient, seed_user: dict):
    data = {
        "username": seed_user["username"],
        "password": TEST_PASSWORD,
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)  # form-encoded automatically
    assert r.status_code == 200, r.text
    _assert_token_response(r.json(), require_refresh=False)


def test_login_wrong_password(client: TestClient, seed_user: dict):
    data = {
        "username": seed_user["username"],
        "password": "wrong",
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)
    assert r.status_code == 401, r.text
    assert "incorrect" in r.text.lower()


def test_login_unknown_user(client: TestClient):
    data = {
        "username": "does_not_exist",
        "password": "whatever",
        "grant_type": "password",
    }
    r = client.post("/auth/token", data=data)
    assert r.status_code == 401


def test_logout_successful(client: TestClient, user_access_token: str):
    r = client.post(
        "/auth/logout", headers={"Authorization": f"Bearer {user_access_token}"}
    )
    assert r.status_code == 200, r.text
    assert r.json() == {"detail": "Logged out"}, r.text
