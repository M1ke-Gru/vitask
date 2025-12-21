def test_read_main(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "hi"}


def test_signup_rejects_duplicate_username(client):
    payload = {
        "username": "dupe_user",
        "password": "P@SSWORD123",
        "email": "first@example.com",
    }
    r1 = client.post("/auth/signup", json=payload)
    assert r1.status_code == 201, r1.text

    payload2 = {
        "username": "dupe_user",
        "password": "P@SSWORD123",
        "email": "second@example.com",
    }
    r2 = client.post("/auth/signup", json=payload2)
    assert r2.status_code == 400


def test_signup_rejects_duplicate_email(client):
    payload = {
        "username": "user_a",
        "password": "P@SSWORD123",
        "email": "dupe@example.com",
    }
    r1 = client.post("/auth/signup", json=payload)
    assert r1.status_code == 201, r1.text

    payload2 = {
        "username": "user_b",
        "password": "P@SSWORD123",
        "email": "dupe@example.com",
    }
    r2 = client.post("/auth/signup", json=payload2)
    assert r2.status_code == 400
