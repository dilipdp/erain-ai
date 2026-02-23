from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.core.audit_event import AuditEventCreate, AuditEventOut
from app.services.core.audit_event_service import AuditEventService

router = APIRouter(prefix="/events")


@router.post("", response_model=AuditEventOut)
def create_event(payload: AuditEventCreate, db: Session = Depends(get_db)) -> AuditEventOut:
    return AuditEventService.create(db, payload)


@router.get("", response_model=list[AuditEventOut])
def list_events(
    organization_id: UUID | None = None,
    event_type: str | None = None,
    correlation_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[AuditEventOut]:
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    return AuditEventService.list(
        db,
        organization_id=organization_id,
        event_type=event_type,
        correlation_id=correlation_id,
        limit=limit,
        offset=offset,
    )
