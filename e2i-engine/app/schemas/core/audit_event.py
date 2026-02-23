from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AuditEventCreate(BaseModel):
    organization_id: UUID
    event_type: str = Field(min_length=3, max_length=120)
    actor_id: str = Field(min_length=2, max_length=120)
    correlation_id: str = Field(min_length=4, max_length=120)
    causation_id: str | None = Field(default=None, max_length=120)
    decision_id: UUID | None = None
    snapshot_id: UUID | None = None
    entity_type: str | None = Field(default=None, max_length=60)
    entity_id: str | None = Field(default=None, max_length=120)
    payload: dict = Field(default_factory=dict)
    notes: str | None = Field(default=None, max_length=2000)


class AuditEventOut(BaseModel):
    id: UUID
    organization_id: UUID
    event_type: str
    actor_id: str
    correlation_id: str
    causation_id: str | None
    decision_id: UUID | None
    snapshot_id: UUID | None
    entity_type: str | None
    entity_id: str | None
    payload: dict
    validation_error_code: str | None
    notes: str | None
    event_hash: str
    created_at: datetime

    model_config = {"from_attributes": True}
