import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.lead import Lead, LeadState
from app.schemas.lead import LeadCreate
from app.services.email import get_email_service
from app.services.email.base import EmailService
from app.services.errors import IllegalStateTransition, InvalidResume, LeadNotFound
from app.services.notifications import build_attorney_email, build_prospect_email
from app.services.storage import get_storage
from app.services.storage.local import LocalStorageService

logger = logging.getLogger("app.leads")


def create_lead(
    db: Session,
    *,
    data: LeadCreate,
    resume_bytes: bytes,
    resume_filename: str,
    content_type: str,
    storage: LocalStorageService | None = None,
    email_service: EmailService | None = None,
) -> Lead:
    """Persist a new lead then attempt to notify the prospect and attorney.

    The lead is committed BEFORE any email is sent, so a delivery failure can never
    lose the lead. On email failure the exception is logged and ``notification_sent_at``
    stays NULL; the lead is still returned successfully.
    """
    settings = get_settings()
    storage = storage or get_storage()
    email_service = email_service or get_email_service()

    if content_type not in settings.allowed_resume_types:
        raise InvalidResume(f"Unsupported resume type: {content_type}")
    if len(resume_bytes) > settings.max_resume_bytes:
        raise InvalidResume("Resume exceeds the maximum allowed size")
    if len(resume_bytes) == 0:
        raise InvalidResume("Resume file is empty")

    stored = storage.save(content=resume_bytes, filename=resume_filename)

    lead = Lead(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        resume_filename=resume_filename,
        resume_key=stored.key,
        state=LeadState.PENDING,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    try:
        resume_url = storage.url_for(lead.resume_key)
        email_service.send(build_prospect_email(lead))
        email_service.send(build_attorney_email(lead, resume_url=resume_url))
    except Exception:
        logger.exception("Failed to send notification emails for lead %s", lead.id)
        return lead

    lead.notification_sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)
    return lead


def list_leads(db: Session) -> list[Lead]:
    stmt = select(Lead).order_by(Lead.created_at.desc(), Lead.id.desc())
    return list(db.scalars(stmt).all())


def get_lead(db: Session, lead_id: int) -> Lead | None:
    return db.get(Lead, lead_id)


def set_state(
    db: Session,
    lead_id: int,
    new_state: LeadState,
    *,
    by_email: str,
) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise LeadNotFound(f"Lead {lead_id} not found")

    legal_transition = lead.state == LeadState.PENDING and new_state == LeadState.REACHED_OUT
    if not legal_transition:
        raise IllegalStateTransition(
            f"Cannot transition lead {lead_id} from {lead.state.value} to {new_state.value}"
        )

    lead.mark_reached_out(by_email)
    db.commit()
    db.refresh(lead)
    return lead
