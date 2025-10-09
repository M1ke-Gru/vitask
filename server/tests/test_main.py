def test_read_main(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "hi"}
