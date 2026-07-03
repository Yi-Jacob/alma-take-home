import json
import urllib.request

from app.services.email.base import EmailMessage

RESEND_API_URL = "https://api.resend.com/emails"


class ResendEmailService:
    """Email backend that delivers messages through the Resend REST API.

    Uses stdlib urllib so no extra dependency is needed. Errors raise and are
    handled by the caller (create_lead logs them and keeps the lead).
    """

    def __init__(self, *, api_key: str, from_address: str) -> None:
        self._api_key = api_key
        self._from = from_address

    def send(self, message: EmailMessage) -> None:
        payload = json.dumps(
            {
                "from": self._from,
                "to": [message.to],
                "subject": message.subject,
                "text": message.body,
            }
        ).encode()

        request = urllib.request.Request(
            RESEND_API_URL,
            data=payload,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                # Resend (Cloudflare) rejects urllib's default Python-urllib UA with 403.
                "User-Agent": "alma-lead-api/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status >= 300:
                raise RuntimeError(f"Resend API returned {response.status}")
