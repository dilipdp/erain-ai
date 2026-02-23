# E2I Engine (Launch Scope)

This service now ships the v1 launch priorities:
- AI auditability (append-only event trail)
- Decision governance (role-gated approvals + lineage)
- ROI attribution (decision-linked value tracking + summary)

## Run

```bash
cd /Users/dilipbr/Projects/erain-ai
source e2i-engine/.venv/bin/activate
uvicorn app.main:app --app-dir e2i-engine --reload
```

Database migrations run automatically on startup (`alembic upgrade head`).

## Write Request Headers

For all POST endpoints below, include:
- `X-Actor-Id`: user/system identity
- `X-Correlation-Id`: engagement/run trace id
- `X-Causation-Id`: optional parent event or request id

For decision approval, also include:
- `X-Actor-Role`: one of `FOUNDER|ENGAGEMENT_LEAD|OPS_LEAD|DOMAIN_LEAD|CLIENT_CXO`

## Launch Workflow (Client Delivery)

1. Create organization  
`POST /api/v1/organizations`

2. Create immutable data snapshot  
`POST /api/v1/snapshots`
- Automatically emits `data.dataset.snapshot.created`

3. Log decision against snapshot  
`POST /api/v1/decisions`
- Automatically emits:
  - `governance.decision.logged`
  - `governance.approval.requested`

4. Approve/reject decision (role gated)  
`POST /api/v1/decisions/{decision_id}/approve`
- Automatically emits:
  - `governance.approval.granted` or
  - `governance.approval.denied`

5. Create ROI attribution for approved decision  
`POST /api/v1/roi/attributions`
- Automatically emits `roi.attribution.calculated`

6. Track value summary  
`GET /api/v1/roi/attributions/summary?organization_id={org_id}`
- Optional filter: `decision_id=...`

## Manual Event API (Optional)

`POST /api/v1/events` is still available for explicit external events.  
The system validates event types against `frameworks/core/EVENT_TYPES_CATALOG.md`.

## Operational Guarantees

- Audit events are immutable and append-only (ORM + PostgreSQL trigger protection).
- Event type and lineage constraints are validated before persistence.
- Snapshot/decision/ROI writes and their audit events commit atomically.
- ROI records require an `APPROVED` decision.
