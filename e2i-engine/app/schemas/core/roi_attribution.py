from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


ROICategory = Literal[
    "COST_RECOVERY",
    "REVENUE_PROTECTION",
    "THROUGHPUT_IMPROVEMENT",
    "WORKING_CAPITAL_RELEASE",
    "RISK_AVOIDANCE",
]
AttributionLevel = Literal["ESTIMATED", "VERIFIED", "SUSTAINED", "INSTITUTIONALIZED"]


class ROIAttributionCreate(BaseModel):
    organization_id: UUID
    decision_id: UUID
    snapshot_id: UUID
    category: ROICategory
    attribution_level: AttributionLevel = "ESTIMATED"
    status: AttributionLevel = "ESTIMATED"
    currency: str = Field(default="USD", min_length=3, max_length=10)

    baseline_value: float
    current_value: float
    volume: float = Field(gt=0)
    period_days: int = Field(default=30, ge=1, le=3660)
    confidence_score: float = Field(ge=0, le=1)
    assumptions: str | None = Field(default=None, max_length=4000)


class ROIAttributionOut(BaseModel):
    id: UUID
    organization_id: UUID
    decision_id: UUID
    snapshot_id: UUID
    category: ROICategory
    attribution_level: AttributionLevel
    status: AttributionLevel
    currency: str
    baseline_value: float
    current_value: float
    volume: float
    period_days: int
    confidence_score: float
    raw_impact_value: float
    confidence_adjusted_impact_value: float
    assumptions: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
