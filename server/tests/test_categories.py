from fastapi.testclient import TestClient


def test_list_categories_default(client: TestClient, user_access_token: str):
    r = client.get(
        "/category/list",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text
    assert len(r.json()) == 1
    assert r.json()[0]["name"] == "Unsorted"


def test_category_crud(client: TestClient, user_access_token: str):
    created = client.post(
        "/category/create",
        headers={"Authorization": f"Bearer {user_access_token}"},
        json={"name": "Work"},
    )
    assert created.status_code == 201, created.text
    created_body = created.json()
    assert created_body["name"] == "Work"
    assert isinstance(created_body["id"], int)

    listed = client.get(
        "/category/list",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert listed.status_code == 200, listed.text
    assert any(c == created_body for c in listed.json())

    renamed = client.patch(
        f"/category/name/{created_body['id']}/Personal",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert renamed.status_code == 200, renamed.text
    assert renamed.json()["id"] == created_body["id"]
    assert renamed.json()["name"] == "Personal"

    fetched = client.get(
        f"/category/{created_body['id']}",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert fetched.status_code == 200, fetched.text
    assert fetched.json() == renamed.json()

    deleted = client.delete(
        f"/category/delete/{created_body['id']}",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert deleted.status_code in (200, 204), deleted.text

    listed_after = client.get(
        "/category/list",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert listed_after.status_code == 200, listed_after.text
    assert not any(c["name"] == "Work" for c in listed_after.json())


def test_list_category_tasks(client: TestClient, user_access_token: str):
    created_category = client.post(
        "/category/create",
        headers={"Authorization": f"Bearer {user_access_token}"},
        json={"name": "Work"},
    )
    assert created_category.status_code == 201, created_category.text
    category_id = created_category.json()["id"]

    created_task = client.post(
        "/task/create",
        headers={"Authorization": f"Bearer {user_access_token}"},
        json={"name": "Code", "isDone": False},
    )
    assert created_task.status_code == 201, created_task.text
    task = created_task.json()

    moved_task = client.patch(
        "/task/update",
        headers={"Authorization": f"Bearer {user_access_token}"},
        json={
            "id": task["id"],
            "name": task["name"],
            "isDone": task["isDone"],
            "category_id": category_id,
        },
    )
    assert moved_task.status_code == 200, moved_task.text
    assert moved_task.json()["categoryId"] == category_id

    r = client.get(
        f"/category/tasks/{category_id}",
        headers={"Authorization": f"Bearer {user_access_token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json() == [moved_task.json()]

