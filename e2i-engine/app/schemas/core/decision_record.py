from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


AuthorityTier = Literal["FOUNDER", "ENGAGEMENT_LEAD", "OPS_LEAD", "DOMAIN_LEAD", "CLIENT_CXO"]
DecisionStatus = Literal["PROPOSED", "APPROVED", "REJECTED", "SUPERSEDED"]


class DecisionCreate(BaseModel):
    organization_id: UUID
    snapshot_id: UUID
    title: str = Field(min_length=4, max_length=240)
    reasoning_summary: str = Field(min_length=10)
    evidence_reference: str | None = Field(default=None, max_length=500)
    authority_tier: AuthorityTier


class DecisionApproveIn(BaseModel):
    approved: bool
    approver_id: str = Field(min_length=2, max_length=120)
    approver_role: AuthorityTier
    approval_note: str | None = Field(default=None, max_length=2000)


class DecisionOut(BaseModel):
    id: UUID
    organization_id: UUID
    snapshot_id: UUID
    title: str
    reasoning_summary: str
    evidence_reference: str | None
    authority_tier: AuthorityTier
    status: DecisionStatus
    approved_by: str | None
    approver_role: str | None
    approval_note: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
