from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.core.organization import Organization
from app.models.core.snapshot import DatasetSnapshot
from app.schemas.core.snapshot import SnapshotCreate
from app.services.core.audit_event_service import AuditEventService


class SnapshotService:
    @staticmethod
    def create(
        db: Session,
        payload: SnapshotCreate,
        *,
        actor_id: str,
        correlation_id: str,
        causation_id: str | None = None,
    ) -> DatasetSnapshot:
        org = db.get(Organization, payload.organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="organization not found")

        snapshot_kwargs = {
            "organization_id": payload.organization_id,
            "source_system": (payload.source_system.strip() if payload.source_system else None),
            "scope_summary": (payload.scope_summary.strip() if payload.scope_summary else None),
            "hash_sha256": payload.hash_sha256.lower(),
            "data_reliability_score": payload.data_reliability_score,
        }
        if payload.captured_at is not None:
            snapshot_kwargs["captured_at"] = payload.captured_at

        snapshot = DatasetSnapshot(
            **snapshot_kwargs,
        )
        db.add(snapshot)
        db.flush()

        AuditEventService.create_record(
            db,
            organization_id=payload.organization_id,
            event_type="data.dataset.snapshot.created",
            actor_id=actor_id,
            correlation_id=correlation_id,
            causation_id=causation_id,
            snapshot_id=snapshot.id,
            entity_type="dataset_snapshot",
            entity_id=str(snapshot.id),
            payload={
                "source_system": snapshot.source_system,
                "scope_summary": snapshot.scope_summary,
                "hash_sha256": snapshot.hash_sha256,
                "data_reliability_score": snapshot.data_reliability_score,
                "captured_at": snapshot.captured_at.isoformat() if snapshot.captured_at else None,
            },
            commit=False,
        )

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="snapshot already exists or is invalid") from exc
        db.refresh(snapshot)
        return snapshot

    @staticmethod
    def list(
        db: Session,
        organization_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[DatasetSnapshot]:
        q = db.query(DatasetSnapshot).order_by(DatasetSnapshot.created_at.desc())
        if organization_id:
            q = q.filter(DatasetSnapshot.organization_id == organization_id)
        q = q.limit(limit).offset(offset)
        return list(q.all())
