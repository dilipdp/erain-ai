from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.core.decision_record import DecisionRecord
from app.models.core.organization import Organization
from app.models.core.roi_attribution import ROIAttribution
from app.models.core.snapshot import DatasetSnapshot
from app.schemas.core.roi_attribution import ROIAttributionCreate


class ROIService:
    @staticmethod
    def create(db: Session, payload: ROIAttributionCreate) -> ROIAttribution:
        org = db.get(Organization, payload.organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="organization not found")

        decision = db.get(DecisionRecord, payload.decision_id)
        if decision is None or decision.organization_id != payload.organization_id:
            raise HTTPException(status_code=400, detail="invalid decision_id for organization")
        if decision.status != "APPROVED":
            raise HTTPException(status_code=409, detail="decision must be approved before ROI attribution")

        snapshot = db.get(DatasetSnapshot, payload.snapshot_id)
        if snapshot is None or snapshot.organization_id != payload.organization_id:
            raise HTTPException(status_code=400, detail="invalid snapshot_id for organization")

        raw_impact_value = (payload.baseline_value - payload.current_value) * payload.volume
        confidence_adjusted_impact_value = raw_impact_value * payload.confidence_score

        record = ROIAttribution(
            organization_id=payload.organization_id,
            decision_id=payload.decision_id,
            snapshot_id=payload.snapshot_id,
            category=payload.category,
            attribution_level=payload.attribution_level,
            status=payload.status,
            currency=payload.currency.upper(),
            baseline_value=payload.baseline_value,
            current_value=payload.current_value,
            volume=payload.volume,
            period_days=payload.period_days,
            confidence_score=payload.confidence_score,
            raw_impact_value=raw_impact_value,
            confidence_adjusted_impact_value=confidence_adjusted_impact_value,
            assumptions=(payload.assumptions.strip() if payload.assumptions else None),
        )

        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def list(
        db: Session,
        organization_id: UUID | None = None,
        decision_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ROIAttribution]:
        q = db.query(ROIAttribution).order_by(ROIAttribution.created_at.desc())
        if organization_id:
            q = q.filter(ROIAttribution.organization_id == organization_id)
        if decision_id:
            q = q.filter(ROIAttribution.decision_id == decision_id)
        q = q.limit(limit).offset(offset)
        return list(q.all())
