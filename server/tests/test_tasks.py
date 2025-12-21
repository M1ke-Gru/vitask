from fastapi.testclient import TestClient


def test_create_task_success(client: TestClient, user_access_token: str):
    payload = {"name": "Code", "is_done": "false"}
    r = client.post(
        "/task/create",
        headers={"Authorization": f"Bearer {user_access_token}"},
        json=payload,
    )
    assert r.status_code == 201, r.text


def test_get_task(client: TestClient, user_access_token: str, seed_task: dict):
    r = client.get(
        f"/task/{seed_task['id']}",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json() == seed_task


def test_list_tasks(client: TestClient, user_access_token: str, seed_task: dict):
    r = client.get(
        "/task/list", headers={"Authorization": f"Bearer {user_access_token}"}
    )
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), list), r.json()
    assert isinstance(r.json()[0], dict), r.json()[0]
    assert r.json()[0] == seed_task


def test_delete_all_done(
    client: TestClient, user_access_token: str, seed_tasks: list[dict]
):
    res = client.delete(
        "/task/done",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert res.status_code in (200, 204), res.text

    r = client.get(
        "/task/list", headers={"Authorization": f"Bearer {user_access_token}"}
    )
    assert r.status_code == 200, r.text

    # keep NOT-done tasks
    expected = [t for t in seed_tasks if not t["isDone"]]
    # (optional) guard against ordering differences:
    expected_sorted = sorted(expected, key=lambda x: x["id"])
    actual_sorted = sorted(r.json(), key=lambda x: x["id"])
    assert actual_sorted == expected_sorted


def test_delete_task(client: TestClient, user_access_token: str, seed_task: dict):
    r = client.delete(
        f"/task/delete/{seed_task['id']}",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text


def test_task_change_to_done(
    client: TestClient, user_access_token: str, seed_task: dict
):
    r = client.patch(
        f"/task/is_done/{seed_task['id']}/true",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text


def test_task_change_to_not_done(
    client: TestClient, user_access_token: str, seed_task: dict
):
    r = client.patch(
        f"/task/is_done/{seed_task['id']}/false",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text


def test_task_change_name(client: TestClient, user_access_token: str, seed_task: dict):
    r = client.patch(
        f"/task/name/{seed_task['id']}/renamed",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text
