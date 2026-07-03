import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.user import User

logger = logging.getLogger("app.seed")


def seed_attorney(db: Session) -> User:
    """Create the attorney account from settings if it does not already exist.

    Idempotent: safe to call on every startup.
    """
    settings = get_settings()
    existing = db.scalar(select(User).where(User.email == settings.attorney_email))
    if existing is not None:
        return existing

    user = User(
        email=settings.attorney_email,
        hashed_password=hash_password(settings.attorney_password),
        role="attorney",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Seeded attorney account: %s", user.email)
    return user
