# EraIn Execution OS — Event Types Catalog
Version: 1.2
Owner: EraIn Core
Status: Active (normative)

This catalog defines the **canonical event types** used across the EraIn Execution OS (UEC/ROI/KPI/Leakage/RootCause/Plan/Delivery). It is designed to be:
- **Deterministic** (same input → same event semantics)
- **Auditable** (every event is traceable)
- **Extensible** (new event types can be added without breaking consumers)

---

## 0) Naming and conventions

### Event type format
`<domain>.<entity>.<action>`

Examples:
- `intake.client.submitted`
- `audit.findings.generated`
- `execution.action.completed`

### Action verbs (preferred)
`created | submitted | validated | accepted | rejected | generated | calculated | scored | mapped | assigned | started | progressed | completed | failed | canceled | escalated | approved | published | archived | exported`

### Versioning
- Event envelope includes `schema_version`.
- Event payload includes `payload_version`.
- When payload changes in a breaking way, increment `payload_version` and keep backward compatibility in consumers for **at least 2 versions**.

### Idempotency and ordering
- Producers SHOULD set `idempotency_key` for any event that can be retried.
- Consumers MUST be idempotent on `(tenant_id, workspace_id, event_type, idempotency_key)` when `idempotency_key` is present.
- Event ordering is **best-effort**; consumers MUST rely on `occurred_at` + `causation_id` + domain state to resolve ordering.

### Canonical hashing & signatures
- If `audit.hash` is present, it MUST be the SHA-256 of the **canonical JSON** of the entire envelope with `audit.signature` set to `null`.
- Canonical JSON rules: UTF-8, sorted keys, no insignificant whitespace, arrays preserved.
- If `audit.signature` is present, it MUST sign the canonical hash (implementation-defined signing scheme).
- Report artifacts MUST include a checksum and SHOULD include a signed hash for client-facing integrity.

---

## 1) Standard event envelope (required)

All events MUST carry the same outer envelope.

```json
{
  "event_id": "evt_...",
  "event_type": "audit.findings.generated",
  "occurred_at": "2026-02-20T00:00:00Z",
  "schema_version": "1.0",
  "tenant_id": "tnt_...",
  "workspace_id": "ws_...",
  "actor": {
    "actor_type": "human|system|agent",
    "actor_id": "usr_...|sys_...|agt_...",
    "display": "optional"
  },
  "correlation_id": "corr_...",
  "causation_id": "evt_...",
  "decision_id": "dec_...",
  "snapshot_id": "snap_...",
  "idempotency_key": "optional",
  "security": {
    "classification": "internal|client|restricted",
    "pii": "none|low|high",
    "retention_days": 365
  },
  "audit": {
    "request_id": "req_...",
    "trace_id": "trc_...",
    "signature": null,
    "hash": "sha256:..."
  },
  "payload": {
    "payload_version": "1.0",
    "data": {
      "entity_ref": { "entity_type": "optional", "entity_id": "optional" },
      "tags": ["optional"]
    }
  }
}
```

**Rules**
- `event_id` MUST be unique.
- `correlation_id` ties a whole engagement run (client → audit → delivery).
- `causation_id` points to the immediate triggering event.
- `tenant_id` and `workspace_id` MUST always be present.
- `decision_id` MUST be present for all `plan.*`, `execution.*`, `roi.*`, `report.*`, `governance.approval.*`, and `audit.findings.*` events.
- `snapshot_id` MUST be present for all data-dependent events (`audit.*`, `kpi.*`, `leakage.*`, `rootcause.*`, `roi.*`, `plan.*`, `execution.*`, `report.*`).
- Producers MUST NOT emit `data.*` events with `security.classification = client`.
- Any client-exported event MUST be `report.*` or an explicitly approved `audit.*` summary event.
- `audit.hash` SHOULD be present for `report.*` events and for `audit.findings.published`.

---

## 2) Domains

- `intake` — client intake, qualification, NDA, access readiness
- `data` — document collection, validation, extraction, normalization
- `audit` — audit run orchestration and findings generation
- `kpi` — KPI calculation, scoring, thresholds, baselines
- `leakage` — leakage detection, classification, quantification
- `rootcause` — causal graphing, 5-why trees, evidence links
- `roi` — ROI engine, attribution logic, scenario impact
- `plan` — 30/60/90 roadmap, initiatives, milestones
- `execution` — actions, owners, cadence, delivery checkpoints
- `governance` — approvals, risk, compliance, decision logs
- `report` — PDF/deck artifacts, exports, share links
- `system` — internal runtime, errors, retries, health
- `erain` — legacy namespace retained for backward compatibility

---

## 3) Event catalog (canonical list)

### 3.1 Intake
- `intake.client.created`
- `intake.client.updated`
- `intake.client.archived`
- `intake.engagement.requested`
- `intake.engagement.qualified`
- `intake.engagement.disqualified`
- `intake.nda.sent`
- `intake.nda.signed`
- `intake.data_scope.defined` (systems + time range + sites)
- `intake.readiness.checked`
- `intake.readiness.failed`
- `intake.readiness.passed`

**Guards**
- `intake.readiness.passed` MUST occur before any `data.collection.started`.

---

### 3.2 Data (collection → extraction → normalization)
- `data.collection.completed`
- `data.collection.started`
- `data.document.archived`
- `data.document.redacted`
- `data.document.requested`
- `data.document.received`
- `data.document.validated`
- `data.document.rejected`
- `data.extraction.started`
- `data.extraction.completed`
- `data.extraction.failed`
- `data.normalization.started`
- `data.normalization.completed`
- `data.normalization.failed`
- `data.dataset.snapshot.created` (immutable snapshot for audit run)
- `data.dataset.snapshot.superseded` (new snapshot supersedes previous snapshot)

**Payload expectations**
- Document events MUST include `doc_id`, `doc_type`, `source_system`, `period_start`, `period_end`.

---

### 3.3 Audit (orchestration)
- `audit.run.created`
- `audit.run.started`
- `audit.run.paused`
- `audit.run.resumed`
- `audit.run.completed`
- `audit.run.failed`
- `audit.findings.generated`
- `audit.findings.validated`
- `audit.findings.published`
- `audit.summary.generated`
- `audit.summary.approved`

**Guards**
- `audit.run.started` requires `data.dataset.snapshot.created`.

---

### 3.4 KPI
- `kpi.library.version.selected` (pins KPI definitions)
- `kpi.baseline.calculated`
- `kpi.metric.calculated`
- `kpi.metric.scored`
- `kpi.threshold.breached`
- `kpi.dashboard.snapshot.created` (internal snapshot, not vanity)

**Payload expectations**
- KPI events MUST include `kpi_id`, `kpi_name`, `value`, `unit`, `period`, `site` (if applicable).

---

### 3.5 Leakage
- `leakage.taxonomy.version.selected`
- `leakage.signal.detected`
- `leakage.classified`
- `leakage.quantified`
- `leakage.rank.generated`
- `leakage.item.validated`

**Notes**
- `leakage.quantified` MUST include **assumptions** and **confidence**.

---

### 3.6 Root Cause
- `rootcause.framework.version.selected`
- `rootcause.hypothesis.created`
- `rootcause.evidence.linked`
- `rootcause.tree.generated`
- `rootcause.tree.validated`
- `rootcause.causal_graph.updated`

---

### 3.7 ROI
- `roi.model.version.selected`
- `roi.attribution.calculated`
- `roi.scenario.simulated`
- `roi.recovery.potential.estimated`
- `roi.payback.estimated`
- `roi.assumptions.updated`

**Payload expectations**
- ROI events MUST include `currency`, `value_low`, `value_mid`, `value_high`, `confidence`, `assumptions[]`.

---

### 3.8 Plan (30/60/90)
- `plan.roadmap.created`
- `plan.initiative.created`
- `plan.initiative.prioritized`
- `plan.initiative.assigned`
- `plan.milestone.created`
- `plan.roadmap.approved`

---

### 3.9 Execution (delivery & cadence)
- `execution.cadence.started`
- `execution.cadence.weekly_review.completed`
- `execution.action.created`
- `execution.action.assigned`
- `execution.action.started`
- `execution.action.blocked`
- `execution.action.unblocked`
- `execution.action.completed`
- `execution.action.verified`
- `execution.escalation.raised`
- `execution.escalation.resolved`

**Guards**
- `execution.action.verified` MUST be emitted before ROI proof is claimed in a report.

---

### 3.10 Governance
- `governance.decision.logged`
- `governance.approval.requested`
- `governance.approval.granted`
- `governance.approval.denied`
- `governance.risk.registered`
- `governance.risk.updated`
- `governance.health.risk_detected`
- `governance.model.updated`
- `governance.override.invoked`
- `governance.control.tested`
- `governance.control.failed`
- `governance.access.granted`
- `governance.access.revoked`

---

### 3.11 Report (artifacts)
- `report.pdf.generated`
- `report.deck.generated`
- `report.executive_summary.generated`
- `report.artifact.published`
- `report.artifact.revoked`
- `report.export.completed`
- `report.checksum.verified`

**Payload expectations**
- Must include `artifact_id`, `artifact_type`, `version`, `checksum`.

---

### 3.12 System (runtime)
- `system.job.started`
- `system.job.completed`
- `system.job.failed`
- `system.retry.scheduled`
- `system.health.degraded`
- `system.health.restored`
- `system.architecture.updated`
- `system.integrity.anomaly_detected`
- `system.integrity.version_mismatch_detected`
- `system.security.invalid_event_rejected`
- `system.security.transition_blocked`
- `system.security.role_violation`
- `system.security.cross_tenant_violation`
- `system.security.auth_failure`
- `system.security.replay_detected`
- `system.security.snapshot_tamper_detected`
- `system.security.audit_log_integrity_failure`
- `system.security.governance_violation`
- `system.security.decision_lineage_missing`

---

### 3.13 Legacy compatibility (deprecated)

These events are retained for backward compatibility with state-machine specs and older workflows.
Use canonical domain events for all new implementation.

- `erain.audit_request.submitted`
- `erain.audit_request.triaged`
- `erain.audit_request.qualified`
- `erain.audit_request.declined`
- `erain.audit_request.paused`
- `erain.audit_request.resumed`
- `erain.audit_request.converted`
- `erain.audit_request.sla_breach`
- `erain.engagement.contract_initiated`
- `erain.engagement.activated`
- `erain.engagement.blocked`
- `erain.engagement.unblocked`
- `erain.engagement.completed`
- `erain.engagement.terminated`
- `erain.data_request.issued`
- `erain.data_request.partial`
- `erain.data_request.received`
- `erain.data_request.validated`
- `erain.data_request.rejected`
- `erain.baseline.started`
- `erain.baseline.ready`
- `erain.baseline.stale`
- `erain.baseline.failed`
- `erain.finding.approved`
- `erain.action_plan.approved`
- `erain.action_item.verified`
- `erain.roi.proven`
- `erain.executive_pack.delivered`
- `erain.security.transition_blocked`
- `erain.<entity>.rolled_back`

---

## 4) Error event standard

Use `*.failed` for domain failures and always include:
- `error_code` (stable enum)
- `message` (human readable)
- `retryable` (boolean)
- `failed_component` (extractor|normalizer|roi_engine|report_gen|etc)

Example `payload.data` for failures:
```json
{
  "error_code": "EXTRACTION_PARSE_ERROR",
  "message": "Failed to parse row format in uploaded ledger.",
  "retryable": true,
  "failed_component": "extractor",
  "doc_id": "doc_...",
  "evidence": {
    "line": 122,
    "field": "amount"
  }
}
```

---

## 5) Security, privacy, and audit requirements

- All events MUST include `security.classification` and `security.pii`.
- Any event containing high PII MUST set `security.retention_days` explicitly.
- If events are exported to clients, export only **report artifacts** and **approved summaries**; never raw `data.*` events.
- Client-facing exports MUST be produced from immutable snapshots (`data.dataset.snapshot.created`) and MUST include:
  - `artifact_id`, `version`, `checksum`
  - (recommended) `audit.hash` + `audit.signature`
- Any event that includes high PII MUST:
  - set `security.pii = high`
  - set an explicit `security.retention_days`
  - avoid embedding raw identifiers where a `doc_id`/token reference is sufficient

---

## 6) Minimal examples

### Example A — Intake → Data
- `intake.engagement.requested`
- `intake.readiness.passed`
- `data.collection.started`
- `data.document.requested`
- `data.document.received`
- `data.document.validated`
- `data.dataset.snapshot.created`

### Example B — Audit → Findings → Report
- `audit.run.created`
- `audit.run.started`
- `kpi.baseline.calculated`
- `leakage.rank.generated`
- `rootcause.tree.generated`
- `roi.recovery.potential.estimated`
- `audit.findings.generated`
- `audit.findings.published`
- `report.pdf.generated`
- `report.artifact.published`

---

## 7) Change log
- v1.0 — Initial catalog with envelope + canonical domains and events.
- v1.1 — Added idempotency rules, canonical hashing/signatures guidance, client-export guards, and extended data/audit/report event types.
- v1.2 — Added decision lineage envelope fields (`decision_id`, `snapshot_id`) and expanded governance/system security events used by runtime enforcement.

## 8) Event Authority Rule (Non-Bypass Clause)

- All domain state changes MUST be caused by an emitted event defined in this catalog.
- Direct database/state mutation without an associated event is forbidden.
- Any state transition without a corresponding event is considered invalid.
- Such violations MUST emit:
  `system.security.event_bypass_detected`

No implicit state.
No silent mutation.
Events are the single source of truth.

## 9) Event Immutability Policy

- Events are immutable once emitted.
- Corrections MUST be handled by emitting compensating events.
- No event may be edited, overwritten, or deleted.
- Redaction must emit:
  `data.document.redacted`
  while preserving audit lineage.

Event log is append-only.

## 10) Event Deprecation Policy

- Deprecated events MUST be marked in this catalog with:
  `DEPRECATED as of vX.X`
- Deprecated events MUST remain supported for at least 2 minor versions.
- Removal requires:
  - Migration guide
  - Explicit replacement event
  - Backward compatibility strategy

No silent removals.

## 11) Client Export Firewall

The following domains MUST NEVER be exported externally:
- data.*
- system.*
- governance.access.*

Client-visible domains:
- report.*
- approved audit.* summaries
- selected roi.* summaries (after validation)

Any violation MUST emit:
`system.security.export_blocked`

## 12) Event Criticality Levels

Each event SHOULD be classified as:

- CRITICAL — affects client outcome or executive reporting
- IMPORTANT — operational but not executive
- INTERNAL — runtime, logs, non-client visible

CRITICAL events MUST:
- include audit.hash
- include correlation_id
- include causation_id
- be retained minimum 5 years (configurable)

Examples of CRITICAL:
- audit.findings.published
- roi.attribution.calculated
- report.artifact.published
- execution.action.verified


## 13) Unknown Event Rule

- Any event type not defined in this catalog is invalid.
- Runtime MUST reject unknown event types.
- Rejection MUST emit:
  `system.security.unknown_event_rejected`

  
