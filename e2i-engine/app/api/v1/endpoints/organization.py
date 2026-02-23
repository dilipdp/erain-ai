from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.core.organization import OrganizationCreate, OrganizationOut
from app.services.core.organization_service import OrganizationService

router = APIRouter(prefix="/organizations")


@router.post("", response_model=OrganizationOut)
def create_org(payload: OrganizationCreate, db: Session = Depends(get_db)) -> OrganizationOut:
    return OrganizationService.create(db, payload)


@router.get("", response_model=list[OrganizationOut])
def list_orgs(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)) -> list[OrganizationOut]:
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    return OrganizationService.list(db, limit=limit, offset=offset)