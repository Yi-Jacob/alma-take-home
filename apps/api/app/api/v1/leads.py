from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.deps import get_current_attorney, get_db
from app.core.config import get_settings
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadRead, LeadStateUpdate
from app.services import leads as lead_service
from app.services.errors import IllegalStateTransition, InvalidResume, LeadNotFound
from app.services.storage import get_storage

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


def to_read(lead: Lead) -> LeadRead:
    """Serialize a Lead ORM object, supplying the resume download URL."""
    resume_url = get_storage().url_for(lead.resume_key)
    return LeadRead(
        id=lead.id,
        first_name=lead.first_name,
        last_name=lead.last_name,
        email=lead.email,
        resume_filename=lead.resume_filename,
        resume_url=resume_url,
        state=lead.state,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        reached_out_at=lead.reached_out_at,
        reached_out_by=lead.reached_out_by,
        notification_sent_at=lead.notification_sent_at,
    )


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> LeadRead:
    try:
        data = LeadCreate(first_name=first_name, last_name=last_name, email=email)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=jsonable_encoder(exc.errors()),
        ) from exc

    # Reject oversized uploads before reading the body into memory (this endpoint is
    # public, so an unbounded read would be a trivial memory-exhaustion vector).
    max_bytes = get_settings().max_resume_bytes
    if resume.size is not None and resume.size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume exceeds the maximum allowed size ({max_bytes // (1024 * 1024)} MB)",
        )

    resume_bytes = await resume.read(max_bytes + 1)
    if len(resume_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume exceeds the maximum allowed size ({max_bytes // (1024 * 1024)} MB)",
        )

    try:
        lead = lead_service.create_lead(
            db,
            data=data,
            resume_bytes=resume_bytes,
            resume_filename=resume.filename or "resume",
            content_type=resume.content_type or "application/octet-stream",
        )
    except InvalidResume as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return to_read(lead)


@router.get("/resumes/{key}")
def download_resume(key: str) -> FileResponse:
    try:
        path = get_storage().path_for(key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        ) from exc
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    return FileResponse(
        path=path,
        filename=key,
        content_disposition_type="attachment",
    )


@router.get("", response_model=list[LeadRead])
def list_leads(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_attorney),
) -> list[LeadRead]:
    return [to_read(lead) for lead in lead_service.list_leads(db)]


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_attorney),
) -> LeadRead:
    lead = lead_service.get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return to_read(lead)


@router.patch("/{lead_id}/state", response_model=LeadRead)
def update_lead_state(
    lead_id: int,
    payload: LeadStateUpdate,
    db: Session = Depends(get_db),
    attorney: User = Depends(get_current_attorney),
) -> LeadRead:
    try:
        lead = lead_service.set_state(
            db,
            lead_id,
            payload.state,
            by_email=attorney.email,
        )
    except LeadNotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except IllegalStateTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return to_read(lead)
