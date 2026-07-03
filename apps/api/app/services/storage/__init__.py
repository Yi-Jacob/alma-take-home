from functools import lru_cache

from app.core.config import get_settings
from app.services.storage.local import LocalStorageService


@lru_cache
def get_storage() -> LocalStorageService:
    settings = get_settings()
    # Only "local" is implemented today; the factory is where an S3 backend would plug in.
    return LocalStorageService(
        upload_dir=settings.upload_dir,
        public_api_url=settings.public_api_url,
    )
