import os
import tempfile

# Configure the environment BEFORE importing anything from `app`, so cached
# settings/services pick up the test values (console email, temp upload dir,
# in-memory SQLite).
_TMP_UPLOAD_DIR = tempfile.mkdtemp(prefix="alma-uploads-")
os.environ["EMAIL_BACKEND"] = "console"
os.environ["UPLOAD_DIR"] = _TMP_UPLOAD_DIR
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ATTORNEY_EMAIL"] = "attorney@example.com"
os.environ["ATTORNEY_PASSWORD"] = "password123"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db.session import Base
import app.main as main_module

# A single in-memory SQLite database shared across connections/threads.
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

# Point the app's startup hook (which create_all + seeds) at the test engine too.
main_module.engine = test_engine
main_module.SessionLocal = TestSessionLocal


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    Base.metadata.create_all(test_engine)
    main_module.app.dependency_overrides[get_db] = _override_get_db
    with TestClient(main_module.app) as test_client:
        yield test_client
    main_module.app.dependency_overrides.clear()
    Base.metadata.drop_all(test_engine)


@pytest.fixture
def auth_token(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "attorney@example.com", "password": "password123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
