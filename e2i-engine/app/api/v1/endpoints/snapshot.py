from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.core.snapshot import SnapshotCreate, SnapshotOut
from app.services.core.snapshot_service import SnapshotService

router = APIRouter(prefix="/snapshots")


@router.post("", response_model=SnapshotOut)
def create_snapshot(payload: SnapshotCreate, db: Session = Depends(get_db)) -> SnapshotOut:
    return SnapshotService.create(db, payload)


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
