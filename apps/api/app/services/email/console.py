import logging

from app.services.email.base import EmailMessage

logger = logging.getLogger("app.email")


class ConsoleEmailService:
    """Development email backend that logs messages instead of sending them.

    Lets the whole app run end-to-end with zero credentials — the two notification
    emails appear in the API logs.
    """

    def __init__(self, *, from_address: str) -> None:
        self._from = from_address

    def send(self, message: EmailMessage) -> None:
        logger.info(
            "\n===== EMAIL (console backend) =====\n"
            "From: %s\nTo: %s\nSubject: %s\n\n%s\n"
            "===================================",
            self._from,
            message.to,
            message.subject,
            message.body,
        )
