import uuid
from pathlib import Path

from app.services.storage.base import StoredFile


class LocalStorageService:
    """Stores resume files on the local filesystem under ``upload_dir``.

    The public URL points at the API's ``/api/v1/leads/resumes/{key}`` download route.
    Swapping this for an S3 implementation only requires reimplementing ``save`` and
    ``url_for`` against the same StorageService protocol.
    """

    def __init__(self, *, upload_dir: str, public_api_url: str) -> None:
        self._dir = Path(upload_dir)
        self._dir.mkdir(parents=True, exist_ok=True)
        self._public_api_url = public_api_url.rstrip("/")

    def save(self, *, content: bytes, filename: str) -> StoredFile:
        suffix = Path(filename).suffix
        key = f"{uuid.uuid4().hex}{suffix}"
        destination = self._dir / key
        destination.write_bytes(content)
        return StoredFile(key=key, path=str(destination))

    def url_for(self, key: str) -> str:
        return f"{self._public_api_url}/api/v1/leads/resumes/{key}"

    def path_for(self, key: str) -> Path:
        return self._dir / key
