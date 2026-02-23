from datetime import datetime, UTC
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.core.decision_record import DecisionRecord
from app.models.core.organization import Organization
from app.models.core.snapshot import DatasetSnapshot
from app.schemas.core.decision_record import DecisionApproveIn, DecisionCreate
from app.services.core.audit_event_service import AuditEventService

APPROVAL_MATRIX: dict[str, set[str]] = {
    "FOUNDER": {"FOUNDER"},
    "ENGAGEMENT_LEAD": {"FOUNDER", "ENGAGEMENT_LEAD", "CLIENT_CXO"},
    "OPS_LEAD": {"FOUNDER", "ENGAGEMENT_LEAD", "CLIENT_CXO"},
    "DOMAIN_LEAD": {"FOUNDER", "ENGAGEMENT_LEAD", "CLIENT_CXO"},
    "CLIENT_CXO": {"FOUNDER", "CLIENT_CXO"},
}


class DecisionService:
    @staticmethod
    def create(
        db: Session,
        payload: DecisionCreate,
        *,
        actor_id: str,
        correlation_id: str,
        causation_id: str | None = None,
    ) -> DecisionRecord:
        org = db.get(Organization, payload.organization_id)
        if org is None:
            raise HTTPException(status_code=404, detail="organization not found")

        snapshot = db.get(DatasetSnapshot, payload.snapshot_id)
        if snapshot is None or snapshot.organization_id != payload.organization_id:
            raise HTTPException(status_code=400, detail="invalid snapshot_id for organization")

        decision = DecisionRecord(
            organization_id=payload.organization_id,
            snapshot_id=payload.snapshot_id,
            title=payload.title.strip(),
            reasoning_summary=payload.reasoning_summary.strip(),
            evidence_reference=(payload.evidence_reference.strip() if payload.evidence_reference else None),
            authority_tier=payload.authority_tier,
            status="PROPOSED",
        )
        db.add(decision)
        db.flush()

        logged_event = AuditEventService.create_record(
            db,
            organization_id=payload.organization_id,
            event_type="governance.decision.logged",
            actor_id=actor_id,
            correlation_id=correlation_id,
            causation_id=causation_id,
            decision_id=decision.id,
            snapshot_id=decision.snapshot_id,
            entity_type="decision_record",
            entity_id=str(decision.id),
            payload={
                "authority_tier": decision.authority_tier,
                "status": decision.status,
                "title": decision.title,
            },
            commit=False,
        )
        db.flush()

        AuditEventService.create_record(
            db,
            organization_id=payload.organization_id,
            event_type="governance.approval.requested",
            actor_id=actor_id,
            correlation_id=correlation_id,
            causation_id=str(logged_event.id),
            decision_id=decision.id,
            snapshot_id=decision.snapshot_id,
            entity_type="decision_record",
            entity_id=str(decision.id),
            payload={
                "required_authority_tier": decision.authority_tier,
                "decision_status": decision.status,
            },
            commit=False,
        )

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="decision could not be recorded") from exc
        db.refresh(decision)
        return decision

    @staticmethod
    def approve(
        db: Session,
        decision_id: UUID,
        payload: DecisionApproveIn,
        actor_id: str,
        actor_role: str,
        correlation_id: str,
        causation_id: str | None = None,
    ) -> DecisionRecord:
        decision = db.get(DecisionRecord, decision_id)
        if decision is None:
            raise HTTPException(status_code=404, detail="decision not found")
        if decision.status != "PROPOSED":
            raise HTTPException(status_code=409, detail="decision already finalized")
        if actor_id != payload.approver_id.strip():
            raise HTTPException(status_code=403, detail="actor id does not match approver_id")
        if actor_role != payload.approver_role:
            raise HTTPException(status_code=403, detail="actor role does not match approver_role")

        allowed_roles = APPROVAL_MATRIX.get(decision.authority_tier, {"FOUNDER"})
        if actor_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"{actor_role} is not allowed to approve {decision.authority_tier} decisions",
            )

        decision.status = "APPROVED" if payload.approved else "REJECTED"
        decision.approved_by = payload.approver_id.strip()
        decision.approver_role = payload.approver_role
        decision.approval_note = payload.approval_note.strip() if payload.approval_note else None
        decision.approved_at = datetime.now(UTC)

        db.add(decision)
        AuditEventService.create_record(
            db,
            organization_id=decision.organization_id,
            event_type=(
                "governance.approval.granted"
                if decision.status == "APPROVED"
                else "governance.approval.denied"
            ),
            actor_id=actor_id,
            correlation_id=correlation_id,
            causation_id=causation_id,
            decision_id=decision.id,
            snapshot_id=decision.snapshot_id,
            entity_type="decision_record",
            entity_id=str(decision.id),
            payload={
                "approved": payload.approved,
                "approver_role": payload.approver_role,
                "decision_status": decision.status,
                "approval_note": decision.approval_note,
            },
            commit=False,
        )
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="decision approval could not be recorded") from exc
        db.refresh(decision)
        return decision

    @staticmethod
    def list(
        db: Session,
        organization_id: UUID | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[DecisionRecord]:
        q = db.query(DecisionRecord).order_by(DecisionRecord.created_at.desc())
        if organization_id:
            q = q.filter(DecisionRecord.organization_id == organization_id)
        if status:
            q = q.filter(DecisionRecord.status == status)
        q = q.limit(limit).offset(offset)
        return list(q.all())
