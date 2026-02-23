from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SnapshotCreate(BaseModel):
    organization_id: UUID
    source_system: str | None = Field(default=None, max_length=100)
    scope_summary: str | None = Field(default=None, max_length=500)
    hash_sha256: str = Field(min_length=64, max_length=64, pattern=r"^[0-9a-fA-F]{64}$")
    data_reliability_score: float | None = Field(default=None, ge=0, le=1)
    captured_at: datetime | None = None


class SnapshotOut(BaseModel):
    id: UUID
    organization_id: UUID
    source_system: str | None
    scope_summary: str | None
    hash_sha256: str
    data_reliability_score: float | None
    captured_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
