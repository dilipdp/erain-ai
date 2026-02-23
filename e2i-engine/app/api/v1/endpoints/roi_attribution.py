from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps.auth import AuditRequestContext, get_audit_request_context
from app.db.deps import get_db
from app.schemas.core.roi_attribution import ROIAttributionCreate, ROIAttributionOut, ROISummaryOut
from app.services.core.roi_service import ROIService

router = APIRouter(prefix="/roi/attributions")


@router.post("", response_model=ROIAttributionOut)
def create_roi_attribution(
    payload: ROIAttributionCreate,
    ctx: AuditRequestContext = Depends(get_audit_request_context),
    db: Session = Depends(get_db),
) -> ROIAttributionOut:
    return ROIService.create(
        db,
        payload,
        actor_id=ctx.actor_id,
        correlation_id=ctx.correlation_id,
        causation_id=ctx.causation_id,
    )


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


@router.get("/summary", response_model=ROISummaryOut)
def roi_summary(
    organization_id: UUID,
    decision_id: UUID | None = None,
    db: Session = Depends(get_db),
) -> ROISummaryOut:
    return ROIService.summary(
        db,
        organization_id=organization_id,
        decision_id=decision_id,
    )
