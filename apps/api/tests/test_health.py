def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.json() == {"status": "ok"}
