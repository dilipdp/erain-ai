import hashlib
import json
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.event_catalog import (
    is_event_type_allowed,
    requires_decision_and_snapshot,
    requires_snapshot,
)
from app.models.core.audit_event import AuditEvent
from app.models.core.decision_record import DecisionRecord
from app.models.core.organization import Organization
from app.models.core.snapshot import DatasetSnapshot
from app.schemas.core.audit_event import AuditEventCreate


def _canonical_event_hash(event_payload: dict) -> str:
    canonical = json.dumps(event_payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class AuditEventService:
    @staticmethod
    def create(db: Session, payload: AuditEventCreate) -> AuditEvent:
        org = db.get(Organization, payload.organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="organization not found")

        event_type = payload.event_type.strip()
        if not is_event_type_allowed(event_type):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "unknown event_type",
                    "code": "system.security.invalid_event_rejected",
                    "event_type": event_type,
                },
            )

        if requires_decision_and_snapshot(event_type) and (payload.decision_id is None or payload.snapshot_id is None):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "missing decision lineage",
                    "code": "system.security.decision_lineage_missing",
                    "event_type": event_type,
                },
            )

        if requires_snapshot(event_type) and payload.snapshot_id is None:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "missing snapshot_id",
                    "code": "system.security.decision_lineage_missing",
                    "event_type": event_type,
                },
            )

        if payload.snapshot_id is not None:
            snapshot = db.get(DatasetSnapshot, payload.snapshot_id)
            if snapshot is None or snapshot.organization_id != payload.organization_id:
                raise HTTPException(status_code=400, detail="invalid snapshot_id for organization")

        if payload.decision_id is not None:
            decision = db.get(DecisionRecord, payload.decision_id)
            if decision is None or decision.organization_id != payload.organization_id:
                raise HTTPException(status_code=400, detail="invalid decision_id for organization")

        hash_input = {
            "organization_id": str(payload.organization_id),
            "event_type": event_type,
            "actor_id": payload.actor_id.strip(),
            "correlation_id": payload.correlation_id.strip(),
            "causation_id": payload.causation_id,
            "decision_id": (str(payload.decision_id) if payload.decision_id else None),
            "snapshot_id": (str(payload.snapshot_id) if payload.snapshot_id else None),
            "entity_type": payload.entity_type,
            "entity_id": payload.entity_id,
            "payload": payload.payload,
        }
        event_hash = _canonical_event_hash(hash_input)

        event = AuditEvent(
            organization_id=payload.organization_id,
            event_type=event_type,
            actor_id=payload.actor_id.strip(),
            correlation_id=payload.correlation_id.strip(),
            causation_id=(payload.causation_id.strip() if payload.causation_id else None),
            decision_id=payload.decision_id,
            snapshot_id=payload.snapshot_id,
            entity_type=(payload.entity_type.strip() if payload.entity_type else None),
            entity_id=(payload.entity_id.strip() if payload.entity_id else None),
            payload=payload.payload,
            event_hash=event_hash,
            notes=(payload.notes.strip() if payload.notes else None),
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def list(
        db: Session,
        organization_id: UUID | None = None,
        event_type: str | None = None,
        correlation_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditEvent]:
        q = db.query(AuditEvent).order_by(AuditEvent.created_at.desc())
        if organization_id:
            q = q.filter(AuditEvent.organization_id == organization_id)
        if event_type:
            q = q.filter(AuditEvent.event_type == event_type)
        if correlation_id:
            q = q.filter(AuditEvent.correlation_id == correlation_id)
        q = q.limit(limit).offset(offset)
        return list(q.all())
