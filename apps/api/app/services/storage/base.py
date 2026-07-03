from typing import Protocol


class StoredFile:
    """A pointer to a persisted file."""

    def __init__(self, key: str, path: str) -> None:
        self.key = key
        self.path = path


class StorageService(Protocol):
    """Abstraction over where resume files live (local disk today, S3 tomorrow)."""

    def save(self, *, content: bytes, filename: str) -> StoredFile:
        """Persist file bytes and return a pointer to the stored object."""
        ...

    def url_for(self, key: str) -> str:
        """Return a URL a browser can use to download the stored object."""
        ...

    def delete(self, key: str) -> None:
        """Remove the stored object; a missing key is not an error."""
        ...
