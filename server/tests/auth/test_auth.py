"""Tests for the /auth routes."""

from src.auth import service
from src.config import get_settings
from src.main import app


async def test_dev_token_creates_user_and_returns_jwt(client):
    resp = await client.post("/auth/dev-token")
    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


async def test_dev_token_blocked_outside_development(client):
    prod_settings = get_settings().model_copy(update={"ENV": "production"})
    app.dependency_overrides[get_settings] = lambda: prod_settings
    try:
        resp = await client.post("/auth/dev-token")
    finally:
        app.dependency_overrides.pop(get_settings, None)
    assert resp.status_code == 404


async def test_me_returns_current_user(client, auth_headers, test_user):
    resp = await client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == str(test_user.id)
    assert body["email"] == test_user.email


async def test_me_requires_auth(client):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


async def test_me_rejects_invalid_token(client):
    resp = await client.get(
        "/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"}
    )
    assert resp.status_code == 401


async def test_logout_clears_cookie(client):
    resp = await client.post("/auth/logout")
    assert resp.status_code == 204


async def test_verify_google_token_sets_cookie(client, monkeypatch):
    def fake_verify(token, request, client_id):
        return {
            "sub": "google-sub-123",
            "email": "googler@example.com",
            "name": "Googler",
            "picture": "https://example.com/avatar.png",
        }

    monkeypatch.setattr(service.id_token, "verify_oauth2_token", fake_verify)
    resp = await client.post("/auth/verify", json={"id_token": "fake-google-token"})
    assert resp.status_code == 200
    assert resp.json()["access_token"]
    assert "access_token" in resp.cookies


async def test_verify_google_token_rejects_invalid(client, monkeypatch):
    def fake_verify(token, request, client_id):
        raise ValueError("invalid token")

    monkeypatch.setattr(service.id_token, "verify_oauth2_token", fake_verify)
    resp = await client.post("/auth/verify", json={"id_token": "bad-token"})
    assert resp.status_code == 401
