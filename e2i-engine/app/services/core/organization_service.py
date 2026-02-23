from sqlalchemy.orm import Session

from app.models.core.organization import Organization
from app.schemas.core.organization import OrganizationCreate


class OrganizationService:
    @staticmethod
    def create(db: Session, payload: OrganizationCreate) -> Organization:
        org = Organization(
            name=payload.name.strip(),
            legal_name=(payload.legal_name.strip() if payload.legal_name else None),
            domain=(payload.domain.strip().lower() if payload.domain else None),
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        return org

    @staticmethod
    def list(db: Session, limit: int = 50, offset: int = 0) -> list[Organization]:
        q = db.query(Organization).order_by(Organization.created_at.desc()).limit(limit).offset(offset)
        return list(q.all())