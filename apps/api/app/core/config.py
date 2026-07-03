from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+psycopg://alma:alma@localhost:5432/alma"

    # Auth / JWT
    # 32+ bytes so HS256 meets RFC 7518's minimum key length even in dev.
    jwt_secret: str = "dev-only-secret-change-me-in-production!"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 60 * 8

    # Seeded attorney account (created on startup if it does not exist)
    attorney_email: str = "attorney@example.com"
    attorney_password: str = "password123"

    # Email
    email_backend: Literal["console", "smtp", "resend"] = "console"
    email_from: str = "no-reply@example.com"
    resend_api_key: str | None = None
    attorney_notify_email: str = "attorney@example.com"
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = False

    # Storage
    storage_backend: Literal["local"] = "local"
    upload_dir: str = "uploads"
    # Public base URL the API is reached at, used to build resume download links.
    public_api_url: str = "http://localhost:8000"

    # CORS — the web origin allowed to call the public endpoints.
    web_origin: str = "http://localhost:3000"

    # Resume upload constraints
    max_resume_bytes: int = 10 * 1024 * 1024  # 10 MB
    allowed_resume_types: tuple[str, ...] = (
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
