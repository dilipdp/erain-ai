from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps.auth import AuditRequestContext, get_audit_request_context
from app.db.deps import get_db
from app.schemas.core.snapshot import SnapshotCreate, SnapshotOut
from app.services.core.snapshot_service import SnapshotService

router = APIRouter(prefix="/snapshots")


@router.post("", response_model=SnapshotOut)
def create_snapshot(
    payload: SnapshotCreate,
    ctx: AuditRequestContext = Depends(get_audit_request_context),
    db: Session = Depends(get_db),
) -> SnapshotOut:
    return SnapshotService.create(
        db,
        payload,
        actor_id=ctx.actor_id,
        correlation_id=ctx.correlation_id,
        causation_id=ctx.causation_id,
    )


@router.get("", response_model=list[SnapshotOut])
def list_snapshots(
    organization_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[SnapshotOut]:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    return SnapshotService.list(db, organization_id=organization_id, limit=limit, offset=offset)
