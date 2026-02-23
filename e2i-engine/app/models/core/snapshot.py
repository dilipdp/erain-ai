import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DatasetSnapshot(Base):
    __tablename__ = "dataset_snapshots"
    __table_args__ = (UniqueConstraint("organization_id", "hash_sha256", name="uq_snapshot_org_hash"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_system: Mapped[str | None] = mapped_column(String(100), nullable=True)
    scope_summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    data_reliability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
