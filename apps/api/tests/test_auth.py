def test_login_with_valid_credentials_returns_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "attorney@example.com", "password": "password123"},
    )
    assert response.json()["access_token"]


def test_login_with_valid_credentials_returns_200(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "attorney@example.com", "password": "password123"},
    )
    assert response.status_code == 200


def test_login_with_wrong_password_returns_401(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "attorney@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401
