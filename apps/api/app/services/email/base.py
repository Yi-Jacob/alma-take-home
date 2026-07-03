from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class EmailMessage:
    to: str
    subject: str
    body: str


class EmailService(Protocol):
    """Abstraction over how transactional emails are delivered."""

    def send(self, message: EmailMessage) -> None:
        ...
