from app.db.base import Base
from app.db.session import engine

# Import models so SQLAlchemy registers them
from app.models.core.audit_event import AuditEvent  # noqa: F401
from app.models.core.decision_record import DecisionRecord  # noqa: F401
from app.models.core.organization import Organization  # noqa: F401
from app.models.core.roi_attribution import ROIAttribution  # noqa: F401
from app.models.core.snapshot import DatasetSnapshot  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
