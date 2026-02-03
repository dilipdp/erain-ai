from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional


class Opportunity(BaseModel):
    title: str = Field(..., example="Reduce unplanned downtime")
    area: str = Field(..., example="Maintenance")
    description: str = Field(..., example="Identify root causes and implement preventive actions")
    estimated_annual_impact_inr: Optional[float] = Field(None, example=1800000)
    confidence: float = Field(..., ge=0.0, le=1.0, example=0.7)
    quick_win_days: int = Field(..., ge=1, le=30, example=14)


class RoadmapItem(BaseModel):
    horizon: str = Field(..., example="30 days")
    actions: List[str] = Field(default_factory=list)


class AuditSummary(BaseModel):
    overall_health_score: int = Field(..., ge=0, le=100, example=72)
    key_findings: List[str] = Field(default_factory=list)
    top_risks: List[str] = Field(default_factory=list)


class AuditResponse(BaseModel):
    request_id: str = Field(..., example="AR-20260201-0001")
    generated_at_utc: str = Field(..., example="2026-02-01T07:00:00Z")
    summary: AuditSummary
    top_opportunities: List[Opportunity] = Field(default_factory=list)
    roadmap_30_60_90: List[RoadmapItem] = Field(default_factory=list)
    pdf_path: Optional[str] = Field(None, example="reports/AR-20260201-0001.pdf")
