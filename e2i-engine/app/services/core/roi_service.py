from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.core.decision_record import DecisionRecord
from app.models.core.organization import Organization
from app.models.core.roi_attribution import ROIAttribution
from app.models.core.snapshot import DatasetSnapshot
from app.schemas.core.roi_attribution import ROIAttributionCreate
from app.services.core.audit_event_service import AuditEventService


class ROIService:
    @staticmethod
    def create(
        db: Session,
        payload: ROIAttributionCreate,
        *,
        actor_id: str,
        correlation_id: str,
        causation_id: str | None = None,
    ) -> ROIAttribution:
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
        db.flush()

        AuditEventService.create_record(
            db,
            organization_id=payload.organization_id,
            event_type="roi.attribution.calculated",
            actor_id=actor_id,
            correlation_id=correlation_id,
            causation_id=causation_id,
            decision_id=record.decision_id,
            snapshot_id=record.snapshot_id,
            entity_type="roi_attribution",
            entity_id=str(record.id),
            payload={
                "category": record.category,
                "attribution_level": record.attribution_level,
                "status": record.status,
                "currency": record.currency,
                "period_days": record.period_days,
                "confidence_score": record.confidence_score,
                "raw_impact_value": record.raw_impact_value,
                "confidence_adjusted_impact_value": record.confidence_adjusted_impact_value,
            },
            commit=False,
        )

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="roi attribution could not be recorded") from exc
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

    @staticmethod
    def summary(
        db: Session,
        *,
        organization_id: UUID,
        decision_id: UUID | None = None,
    ) -> dict:
        q = db.query(ROIAttribution).filter(ROIAttribution.organization_id == organization_id)
        if decision_id:
            q = q.filter(ROIAttribution.decision_id == decision_id)

        rows = list(q.all())
        if not rows:
            return {
                "organization_id": organization_id,
                "decision_id": decision_id,
                "total_records": 0,
                "total_raw_impact_value": 0.0,
                "total_confidence_adjusted_impact_value": 0.0,
                "average_confidence_score": None,
                "by_category": [],
                "by_decision": [],
            }

        total_raw = sum(item.raw_impact_value for item in rows)
        total_conf_adj = sum(item.confidence_adjusted_impact_value for item in rows)
        avg_conf = sum(item.confidence_score for item in rows) / len(rows)

        by_category: dict[str, dict] = {}
        by_decision: dict[str, dict] = {}

        for item in rows:
            cat_bucket = by_category.setdefault(
                item.category,
                {
                    "category": item.category,
                    "count": 0,
                    "raw_impact_value": 0.0,
                    "confidence_adjusted_impact_value": 0.0,
                },
            )
            cat_bucket["count"] += 1
            cat_bucket["raw_impact_value"] += item.raw_impact_value
            cat_bucket["confidence_adjusted_impact_value"] += item.confidence_adjusted_impact_value

            decision_key = str(item.decision_id)
            decision_bucket = by_decision.setdefault(
                decision_key,
                {
                    "decision_id": item.decision_id,
                    "count": 0,
                    "raw_impact_value": 0.0,
                    "confidence_adjusted_impact_value": 0.0,
                },
            )
            decision_bucket["count"] += 1
            decision_bucket["raw_impact_value"] += item.raw_impact_value
            decision_bucket["confidence_adjusted_impact_value"] += item.confidence_adjusted_impact_value

        return {
            "organization_id": organization_id,
            "decision_id": decision_id,
            "total_records": len(rows),
            "total_raw_impact_value": total_raw,
            "total_confidence_adjusted_impact_value": total_conf_adj,
            "average_confidence_score": avg_conf,
            "by_category": sorted(by_category.values(), key=lambda item: item["confidence_adjusted_impact_value"], reverse=True),
            "by_decision": sorted(by_decision.values(), key=lambda item: item["confidence_adjusted_impact_value"], reverse=True),
        }
