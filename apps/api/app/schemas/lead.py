from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.lead import LeadState


class LeadCreate(BaseModel):
    """Form fields for a public lead submission (the resume arrives as a file upload)."""

    first_name: str
    last_name: str
    email: EmailStr

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    resume_filename: str
    resume_url: str
    state: LeadState
    created_at: datetime
    updated_at: datetime
    reached_out_at: datetime | None = None
    reached_out_by: str | None = None
    notification_sent_at: datetime | None = None


class LeadStateUpdate(BaseModel):
    state: LeadState
