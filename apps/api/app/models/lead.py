import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class LeadState(str, enum.Enum):
    PENDING = "PENDING"
    REACHED_OUT = "REACHED_OUT"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(320), index=True)

    # Original client filename (display only) + the server-generated storage key.
    # The client filename is never used to build a path.
    resume_filename: Mapped[str] = mapped_column(String(512))
    resume_key: Mapped[str] = mapped_column(String(1024))

    state: Mapped[LeadState] = mapped_column(
        Enum(LeadState, name="lead_state"),
        default=LeadState.PENDING,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    reached_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reached_out_by: Mapped[str | None] = mapped_column(String(320), nullable=True)

    # Records when both notification emails were sent. NULL means delivery has not
    # (yet) succeeded — such leads are inspectable and could be re-sent. This is the
    # honest, queue-free way to satisfy "never lose a lead if email fails".
    notification_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def mark_reached_out(self, by_email: str) -> None:
        self.state = LeadState.REACHED_OUT
        self.reached_out_at = datetime.now(timezone.utc)
        self.reached_out_by = by_email
