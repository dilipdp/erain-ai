from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.core.roi_attribution import ROIAttributionCreate, ROIAttributionOut
from app.services.core.roi_service import ROIService

router = APIRouter(prefix="/roi/attributions")


@router.post("", response_model=ROIAttributionOut)
def create_roi_attribution(payload: ROIAttributionCreate, db: Session = Depends(get_db)) -> ROIAttributionOut:
    return ROIService.create(db, payload)


@router.get("", response_model=list[ROIAttributionOut])
def list_roi_attributions(
    organization_id: UUID | None = None,
    decision_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[ROIAttributionOut]:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    return ROIService.list(
        db,
        organization_id=organization_id,
        decision_id=decision_id,
        limit=limit,
        offset=offset,
    )
