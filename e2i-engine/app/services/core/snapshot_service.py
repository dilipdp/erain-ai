from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.core.organization import Organization
from app.models.core.snapshot import DatasetSnapshot
from app.schemas.core.snapshot import SnapshotCreate


class SnapshotService:
    @staticmethod
    def create(db: Session, payload: SnapshotCreate) -> DatasetSnapshot:
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
        db.commit()
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
