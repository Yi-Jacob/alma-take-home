from app.core.config import get_settings
from app.models.lead import Lead
from app.services.email.base import EmailMessage


def build_prospect_email(lead: Lead) -> EmailMessage:
    """Confirmation email sent to the prospect who submitted the lead."""
    body = (
        f"Hi {lead.first_name},\n\n"
        "Thanks for your application — we've received it and our team will review "
        "your details shortly. Someone will be in touch soon.\n\n"
        "Best regards,\n"
        "The Legal Team"
    )
    return EmailMessage(
        to=lead.email,
        subject="We received your application",
        body=body,
    )


def build_attorney_email(lead: Lead, *, resume_url: str) -> EmailMessage:
    """Internal notification email sent to the attorney about a new lead."""
    settings = get_settings()
    body = (
        "A new lead has been submitted.\n\n"
        f"Name: {lead.first_name} {lead.last_name}\n"
        f"Email: {lead.email}\n"
        f"Resume: {resume_url}\n"
    )
    return EmailMessage(
        to=settings.attorney_notify_email,
        subject=f"New lead submitted: {lead.first_name} {lead.last_name}",
        body=body,
    )
