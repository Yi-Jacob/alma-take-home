import jwt


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


def test_garbage_token_returns_401(client):
    response = client.get(
        "/api/v1/leads",
        headers={"Authorization": "Bearer not-a-real-jwt"},
    )
    assert response.status_code == 401


def test_token_signed_with_wrong_secret_returns_401(client):
    forged_token = jwt.encode(
        {"sub": "attorney@example.com"}, "a-different-32-byte-signing-secret!!", algorithm="HS256"
    )
    response = client.get(
        "/api/v1/leads",
        headers={"Authorization": f"Bearer {forged_token}"},
    )
    assert response.status_code == 401
