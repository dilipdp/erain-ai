from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.core.decision_record import DecisionApproveIn, DecisionCreate, DecisionOut
from app.services.core.decision_service import DecisionService

router = APIRouter(prefix="/decisions")


@router.post("", response_model=DecisionOut)
def create_decision(payload: DecisionCreate, db: Session = Depends(get_db)) -> DecisionOut:
    return DecisionService.create(db, payload)


@router.post("/{decision_id}/approve", response_model=DecisionOut)
def approve_decision(decision_id: UUID, payload: DecisionApproveIn, db: Session = Depends(get_db)) -> DecisionOut:
    return DecisionService.approve(db, decision_id=decision_id, payload=payload)


@router.get("", response_model=list[DecisionOut])
def list_decisions(
    organization_id: UUID | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[DecisionOut]:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    return DecisionService.list(db, organization_id=organization_id, status=status, limit=limit, offset=offset)
