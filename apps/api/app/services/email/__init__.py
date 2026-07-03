from functools import lru_cache

from app.core.config import get_settings
from app.services.email.base import EmailService
from app.services.email.console import ConsoleEmailService
from app.services.email.smtp import SmtpEmailService


@lru_cache
def get_email_service() -> EmailService:
    settings = get_settings()
    if settings.email_backend == "console":
        return ConsoleEmailService(from_address=settings.email_from)
    return SmtpEmailService(
        host=settings.smtp_host,
        port=settings.smtp_port,
        from_address=settings.email_from,
        username=settings.smtp_username,
        password=settings.smtp_password,
        use_tls=settings.smtp_use_tls,
    )
