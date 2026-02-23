from fastapi import APIRouter

from app.api.v1 import health
from app.api.v1.endpoints import audit_event, decision_record, organization, roi_attribution, snapshot

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, prefix="/health", tags=["system"])
api_v1_router.include_router(organization.router, tags=["core"])
api_v1_router.include_router(snapshot.router, tags=["auditability"])
api_v1_router.include_router(decision_record.router, tags=["governance"])
api_v1_router.include_router(audit_event.router, tags=["auditability"])
api_v1_router.include_router(roi_attribution.router, tags=["roi"])
