import hashlib
import json
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
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
    def _validate_references(
        db: Session,
        *,
        organization_id: UUID,
        event_type: str,
        decision_id: UUID | None,
        snapshot_id: UUID | None,
    ) -> None:
        org = db.get(Organization, organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="organization not found")

        if not is_event_type_allowed(event_type):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "unknown event_type",
                    "code": "system.security.invalid_event_rejected",
                    "event_type": event_type,
                },
            )

        if requires_decision_and_snapshot(event_type) and (decision_id is None or snapshot_id is None):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "missing decision lineage",
                    "code": "system.security.decision_lineage_missing",
                    "event_type": event_type,
                },
            )

        if requires_snapshot(event_type) and snapshot_id is None:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "missing snapshot_id",
                    "code": "system.security.decision_lineage_missing",
                    "event_type": event_type,
                },
            )

        if snapshot_id is not None:
            snapshot = db.get(DatasetSnapshot, snapshot_id)
            if snapshot is None or snapshot.organization_id != organization_id:
                raise HTTPException(status_code=400, detail="invalid snapshot_id for organization")

        if decision_id is not None:
            decision = db.get(DecisionRecord, decision_id)
            if decision is None or decision.organization_id != organization_id:
                raise HTTPException(status_code=400, detail="invalid decision_id for organization")

    @staticmethod
    def create_record(
        db: Session,
        *,
        organization_id: UUID,
        event_type: str,
        actor_id: str,
        correlation_id: str,
        causation_id: str | None = None,
        decision_id: UUID | None = None,
        snapshot_id: UUID | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        payload: dict | None = None,
        notes: str | None = None,
        commit: bool = True,
    ) -> AuditEvent:
        normalized_event_type = event_type.strip()
        normalized_actor_id = actor_id.strip()
        normalized_correlation_id = correlation_id.strip()
        normalized_causation_id = causation_id.strip() if causation_id else None
        normalized_entity_type = entity_type.strip() if entity_type else None
        normalized_entity_id = entity_id.strip() if entity_id else None
        normalized_notes = notes.strip() if notes else None
        normalized_payload = payload or {}

        if not normalized_actor_id:
            raise HTTPException(status_code=400, detail="invalid actor_id")
        if len(normalized_correlation_id) < 4:
            raise HTTPException(status_code=400, detail="invalid correlation_id")

        AuditEventService._validate_references(
            db,
            organization_id=organization_id,
            event_type=normalized_event_type,
            decision_id=decision_id,
            snapshot_id=snapshot_id,
        )

        hash_input = {
            "organization_id": str(organization_id),
            "event_type": normalized_event_type,
            "actor_id": normalized_actor_id,
            "correlation_id": normalized_correlation_id,
            "causation_id": normalized_causation_id,
            "decision_id": (str(decision_id) if decision_id else None),
            "snapshot_id": (str(snapshot_id) if snapshot_id else None),
            "entity_type": normalized_entity_type,
            "entity_id": normalized_entity_id,
            "payload": normalized_payload,
        }
        event_hash = _canonical_event_hash(hash_input)

        event = AuditEvent(
            organization_id=organization_id,
            event_type=normalized_event_type,
            actor_id=normalized_actor_id,
            correlation_id=normalized_correlation_id,
            causation_id=normalized_causation_id,
            decision_id=decision_id,
            snapshot_id=snapshot_id,
            entity_type=normalized_entity_type,
            entity_id=normalized_entity_id,
            payload=normalized_payload,
            event_hash=event_hash,
            notes=normalized_notes,
        )
        db.add(event)
        if commit:
            try:
                db.commit()
            except IntegrityError as exc:
                db.rollback()
                raise HTTPException(status_code=409, detail="duplicate or invalid audit event") from exc
            db.refresh(event)
        return event

    @staticmethod
    def create(db: Session, payload: AuditEventCreate) -> AuditEvent:
        return AuditEventService.create_record(
            db,
            organization_id=payload.organization_id,
            event_type=payload.event_type,
            actor_id=payload.actor_id,
            correlation_id=payload.correlation_id,
            causation_id=payload.causation_id,
            decision_id=payload.decision_id,
            snapshot_id=payload.snapshot_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            payload=payload.payload,
            notes=payload.notes,
            commit=True,
        )

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
