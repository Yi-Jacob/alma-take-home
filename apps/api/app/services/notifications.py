from app.core.config import get_settings
from app.models.lead import Lead
from app.services.email.base import EmailMessage


def build_prospect_email(lead: Lead) -> EmailMessage:
    """Confirmation email sent to the prospect who submitted the lead."""
    body = (
        f"Hi {lead.first_name},\n\n"
        "Thanks for requesting a case assessment — we've received your details "
        "and an attorney will review your background shortly. We typically reach "
        "out within 2 business days.\n\n"
        "This review is confidential and carries no obligation.\n\n"
        "Best regards,\n"
        "Meridian Immigration Law"
    )
    return EmailMessage(
        to=lead.email,
        subject="We received your assessment request",
        body=body,
    )


def build_attorney_email(lead: Lead, *, resume_url: str) -> EmailMessage:
    """Internal notification email sent to the attorney about a new lead."""
    settings = get_settings()
    body = (
        "A new case assessment request has been submitted.\n\n"
        f"Name: {lead.first_name} {lead.last_name}\n"
        f"Email: {lead.email}\n"
        f"Resume: {resume_url}\n"
    )
    return EmailMessage(
        to=settings.attorney_notify_email,
        subject=f"New assessment request: {lead.first_name} {lead.last_name}",
        body=body,
    )
