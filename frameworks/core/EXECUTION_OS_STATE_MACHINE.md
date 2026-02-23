

# EXECUTION OS — STATE MACHINE + EVENT FLOW SPEC
Version: 1.1 (Foundational — Lock Candidate)
Owner: EraIn Core
Status: Draft → Lock Candidate (requires Founder sign-off)
Classification: Internal / Governance Critical

---

## Purpose
Define the deterministic control system that powers EraIn delivery across **all industries**.

This document standardizes:
- **State machines** for every core engine artifact
- **Valid/invalid transitions** (guards)
- **Event emission rules**
- **Cross-engine triggers**
- **Failure states + recovery**
- **Rollback logic + audit trails**

If this is not enforced, EraIn becomes inconsistent at scale.

---

## Core Principle
EraIn is an **Execution OS**, not a report generator.

Every artifact must:
1) Move through explicit states
2) Emit auditable events
3) Preserve immutability of history
4) Support safe retries + rollback
5) Prevent silent mutation

---

## Definitions
### Entity
A versioned object in the system (e.g., AuditRequest, DataIntakeBatch, Finding).

### State
A discrete lifecycle position. States are mutually exclusive.

### Transition
A controlled move from one state to another.

### Guard
A rule that must be true for a transition to occur.

### Event
An immutable log record emitted on transition.

### Capsule
A deterministic workflow unit that consumes events, applies rules, and emits new events.

---

## State Machine Conventions (Global)
These conventions apply to every engine and entity.

### State naming
- Use lowercase snake-case tokens: `draft`, `review_needed`, `contract_pending`.
- Terminal states MUST be explicit (e.g., `declined`, `terminated`, `deleted`).

### Versioning rules
- Any artifact in `approved` / `final` / `delivered` is immutable.
- Edits after immutability MUST create a new version and mark the previous version as `superseded`.
- A version bump MUST emit an event and include entity.version in the envelope.

### Idempotency + replay
- Every transition MUST be idempotent.
- Re-processing the same `event_id` MUST NOT create duplicate state changes or duplicated downstream artifacts.
- Capsules MUST treat events as immutable input. If a capsule needs to change behavior, it must change its own version, not mutate prior events.

### Correlation + causation
- `correlation_id` ties the full engagement thread end-to-end.
- `causation_id` references the immediate upstream event that triggered this transition.
- A capsule MUST carry forward `correlation_id` and set `causation_id` to the consumed event.

### Audit immutability requirements
- Every transition MUST emit exactly one primary domain event (plus optional system events).
- The event payload MUST contain enough information to reconstruct the decision later.
- A “delete” MUST be a logged transition (no silent removals). Use `deleted` only when retention policy allows.

### Time + timers
- For SLA-driven transitions, the system MUST emit timer events (e.g., `erain.audit_request.sla_breach`).
- Timers MUST reference the entity + state that breached.

### Tenant isolation
- `tenant_id` is mandatory on every event.
- Capsules MUST reject any event with missing/invalid `tenant_id`.
- Cross-tenant joins are forbidden by design (hard block).

### PII + confidentiality
- Payloads MUST avoid raw sensitive data when possible.
- If PII is required, the payload MUST reference encrypted storage pointers and include classification.

---

## Global Invariants (Must Always Hold)
1. **Immutability:** Any approved/final artifact is immutable; changes require new version.
2. **Append-only audit:** All changes are events; no silent edits.
3. **Idempotency:** Re-processing the same event does not duplicate outcomes.
4. **Tenant boundary:** No cross-client data access by design.
5. **Least privilege:** Only required roles can trigger transitions.
6. **Chain-of-custody:** Every document has source, timestamp, hash, owner.
7. **Deterministic outputs:** Given the same inputs + versions, outputs are reproducible.

---

## System Event Contract (Standard)
All events MUST follow this envelope.

```json
{
  "event_id": "uuid",
  "event_type": "string",
  "occurred_at": "ISO-8601",
  "actor": {
    "type": "human|system",
    "id": "string",
    "role": "string"
  },
  "tenant_id": "string",
  "entity": {
    "type": "string",
    "id": "string",
    "version": "int"
  },
  "transition": {
    "from": "state",
    "to": "state"
  },
  "correlation_id": "string",
  "causation_id": "string",
  "payload": {},
  "hash": "sha256"
}
```

### Hashing rule
- `hash` is `sha256(canonical_json(event_without_hash))`.
- Canonical JSON means: stable key order, UTF-8, no extra whitespace, normalized timestamps.
- The `hash` field MUST NOT be included in the hash input.

### Required Event Fields
- `event_type` MUST use canonical names from `EVENT_TYPES_CATALOG.md`.
- Legacy `erain.<entity>.<action>` events are allowed only for backward compatibility.
- `correlation_id` ties a whole engagement thread
- `causation_id` ties the specific upstream event that caused this

---

## Engines & Primary Entities
EraIn has 5 core engines. Each engine owns its own entity state machine.

1) **Engagement Engine**
- AuditRequest
- Engagement

2) **Data Intake Engine**
- IntakeChecklist
- DataRequest
- DataIntakeBatch
- DocumentAsset

3) **Analysis Engine**
- BaselineModel
- Finding
- RootCauseMap
- KPIRegister

4) **Plan & Execution Engine**
- ActionPlan (30/60/90)
- ActionItem
- OwnerMap
- Cadence

5) **ROI & Proof Engine**
- BenefitClaim
- EvidencePack
- ROISummary
- ExecutivePack

---

# 1) Engagement Engine — State Machine
## 1.1 AuditRequest
### States
- `draft`
- `submitted`
- `triaged`
- `qualified`
- `declined`
- `paused`
- `converted_to_engagement`

### Transitions
| From | To | Trigger | Guards | Emits |
|---|---|---|---|---|
| draft | submitted | client_submits_form | required_fields_present | `erain.audit_request.submitted` |
| submitted | triaged | founder_or_ops_triage | intake_slot_available | `erain.audit_request.triaged` |
| triaged | qualified | qualification_passed | decision_authority_ok AND cadence_commitment_ok | `erain.audit_request.qualified` |
| triaged | declined | qualification_failed | reason_required | `erain.audit_request.declined` |
| * | paused | pause_requested | reason_required | `erain.audit_request.paused` |
| paused | triaged | resume | previous_state == triaged | `erain.audit_request.resumed` |
| qualified | converted_to_engagement | create_engagement | readiness_gate_passed | `erain.audit_request.converted` |

### Failure / Recovery
- If `submitted` but no triage within SLA → emit `erain.audit_request.sla_breach` (system)
- `paused` can return to the immediately previous state via a `resume` transition (must reference transition.from as `paused` and include payload.previous_state).
  - Emits: `erain.audit_request.resumed`

---

## 1.2 Engagement
### States
- `created`
- `contract_pending`
- `active`
- `blocked`
- `completed`
- `terminated`

### Transitions
| From | To | Trigger | Guards | Emits |
|---|---|---|---|---|
| created | contract_pending | send_nda_msa | legal_templates_ready | `erain.engagement.contract_initiated` |
| contract_pending | active | contract_signed | nda_signed AND storage_ready AND access_policy_ready | `erain.engagement.activated` |
| active | blocked | blocker_detected | blocker_reason_required | `erain.engagement.blocked` |
| blocked | active | blocker_resolved | evidence_of_resolution | `erain.engagement.unblocked` |
| active | completed | close_engagement | executive_pack_delivered | `erain.engagement.completed` |
| active | terminated | terminate | termination_reason_required | `erain.engagement.terminated` |

---

# 2) Data Intake Engine — State Machine
## 2.1 DataRequest
### States
- `draft`
- `issued`
- `partially_received`
- `received`
- `validated`
- `rejected`

### Transitions
| From | To | Trigger | Guards | Emits |
|---|---|---|---|---|
| draft | issued | issue_request | engagement_active | `erain.data_request.issued` |
| issued | partially_received | docs_uploaded | at_least_one_asset | `erain.data_request.partial` |
| partially_received | received | all_docs_received | all_required_assets_present | `erain.data_request.received` |
| received | validated | validate_assets | hash_ok AND naming_ok AND virus_scan_ok | `erain.data_request.validated` |
| received | rejected | validation_failed | rejection_reason_required | `erain.data_request.rejected` |

---

## 2.2 DocumentAsset
### States
- `uploaded`
- `quarantined`
- `validated`
- `indexed`
- `archived`
- `deleted`

### Transition Rules
- Any `uploaded` file enters `quarantined` until scan + hash complete.
- `deleted` is only allowed if retention policy permits and deletion is logged.

- `indexed` requires: metadata complete + tenant boundary verified + optional OCR/index pipeline success.
- `archived` requires: engagement completed OR retention stage reached; archive MUST preserve hash + storage pointer.

### Mandatory Metadata (per asset)
- tenant_id
- engagement_id
- data_request_id
- source_system (ERP/Tally/Excel/etc)
- received_at
- file_hash
- classification (confidential/internal)

---

# 3) Analysis Engine — State Machine
## 3.1 BaselineModel
### States
- `not_started`
- `building`
- `ready`
- `stale`
- `failed`

### Transitions
| From | To | Trigger | Guards | Emits |
|---|---|---|---|---|
| not_started | building | start_baseline | validated_data_available | `erain.baseline.started` |
| building | ready | baseline_built | reproducibility_check_passed | `erain.baseline.ready` |
| ready | stale | data_changed | new_assets_indexed | `erain.baseline.stale` |
| building | failed | build_failed | error_logged | `erain.baseline.failed` |

---

## 3.2 Finding
### States
- `draft`
- `review_needed`
- `approved`
- `rejected`
- `superseded`

### Guards
- `approved` requires: impact_estimate_present + evidence_linked + root_cause_linked
- Any change after approval must create new version and mark old as `superseded`

---

# 4) Plan & Execution Engine — State Machine
## 4.1 ActionPlan (30/60/90)
### States
- `draft`
- `review_needed`
- `approved`
- `in_execution`
- `completed`
- `superseded`

### Rules
- Plan cannot be `approved` unless:
  - top_findings_linked
  - owners_assigned
  - cadence_defined
  - checkpoints_defined

---

## 4.2 ActionItem
### States
- `backlog`
- `assigned`
- `in_progress`
- `blocked`
- `done`
- `verified`
- `rolled_back`

### Verification
- `done` is not success.
- Success is only `verified` when evidence is attached and KPI delta is measured.

---

# 5) ROI & Proof Engine — State Machine
## 5.1 BenefitClaim
### States
- `draft`
- `estimated`
- `measured`
- `proven`
- `disputed`
- `withdrawn`

### Rules
- `estimated` requires model + assumptions
- `measured` requires before/after data
- `proven` requires evidence pack + CFO/owner signoff (or agreed authority)
- `disputed` requires dispute reason and counter-evidence

---

## 5.2 ExecutivePack
### States
- `assembling`
- `review_needed`
- `final`
- `delivered`

### Rules
- `final` is immutable; edits require new version.

---

# Cross-Engine Triggers (Event Flow)
## Primary Flow (Golden Path)
1. `erain.audit_request.submitted` → triage capsule
2. `erain.audit_request.qualified` → engagement creation capsule
3. `erain.engagement.activated` → data intake issuance capsule
4. `erain.data_request.validated` → baseline build capsule
5. `erain.baseline.ready` → finding generation capsule
6. `erain.finding.approved` → action plan draft capsule
7. `erain.action_plan.approved` → execution cadence capsule
8. `erain.action_item.verified` → roi measurement capsule
9. `erain.roi.proven` → executive pack assembly capsule
10. `erain.executive_pack.delivered` → engagement completion capsule

---

# Invalid Transitions (Hard Blocks)
- You cannot issue DataRequests unless Engagement is `active`.
- You cannot approve Findings without evidence + root-cause.
- You cannot mark ActionPlan `approved` without owner + cadence + checkpoints.
- You cannot claim ROI as `proven` without evidence pack.
- You cannot mutate any `final/approved` artifact; only supersede with new version.

---

# Completion Gates (Non-Negotiable)
These gates prevent premature promises and protect trust.

## Gate A — “Client data collection allowed”
Allowed ONLY when:
- Engagement is `active`
- NDA/MSA signed (or documented equivalent)
- Storage + access policy ready
- Data Intake Protocol version locked
- Document naming + hashing rules active

## Gate B — “Baseline model allowed”
Allowed ONLY when:
- DataRequest is `validated`
- Minimum required assets present for the selected industry
- Reproducibility checks enabled (same inputs → same outputs)

## Gate C — “Finding approval allowed”
Allowed ONLY when the Finding has:
- Evidence linked (hash + pointer)
- Root-cause linked (map id + version)
- Impact estimate present (with assumptions)

## Gate D — “Plan approval allowed”
Allowed ONLY when:
- Owners assigned per action
- Cadence + checkpoints defined
- Risk register entry created for top 3 risks

## Gate E — “ROI proven allowed”
Allowed ONLY when:
- Before/after data exists
- Evidence pack assembled
- Sign-off authority captured (CFO/Owner/approved delegate)

---

# Failure States & Rollback
## Standard Failure States
- `failed` (system error)
- `blocked` (human/process blocker)
- `paused` (mutual hold)

## Rollback Policy
Rollback is allowed ONLY when one of the following is true:
- A verified KPI moved negatively beyond the agreed threshold after an action was executed.
- A safety/compliance risk was introduced.
- The action created operational instability (repeat incidents, escalating backlog, SLA collapse).

### Rollback thresholds (default)
- KPI regression > 5% week-over-week for 2 consecutive review cycles, OR
- Any severity-1 incident attributable to the action.

### Rollback requires
- rollback reason (plain language + category)
- rollback owner (named accountable role)
- rollback evidence (links to metrics + incident record)
- rollback plan (what changes, what is restored, expected stabilization window)
- event: `erain.<entity>.rolled_back`

### Post-rollback mandatory steps
- Create a corrective Finding version (superseding the prior) OR mark as `rejected` with rationale.
- Update the Risk Register with learnings.
- Emit an executive note if leadership was impacted.

---

# Observability
Minimum dashboards (internal):
- Engagement state distribution
- Data intake completion SLA
- Findings approval rate + cycle time
- Action item throughput + block reasons
- ROI claims status (estimated → proven)

---

# Compliance & Audit Notes
- This document is **foundational** and must remain stable.
- Any change requires:
  - version bump
  - changelog entry
  - migration note (what transitions changed)

---

# Next Files (Created from this spec)
After this is locked, we implement:
1. `frameworks/core/EVENT_TYPES_CATALOG.md`
2. `frameworks/core/ENTITY_REGISTRY.md`
3. `frameworks/core/CAPSULE_RUNBOOK.md`
4. `frameworks/core/STATE_MACHINE_TEST_CASES.md`

---

## Founder Review Checklist
[ ] States cover all lifecycle needs
[ ] Guards prevent early promises
[ ] Events are sufficient for audit
[ ] Rollback + failure handling is explicit
[ ] Cross-engine triggers match how you deliver


## State Transition Authority

- All state transitions MUST be triggered by events.
- Direct database/state mutation is forbidden.
- Any transition not defined in this document is invalid.
- Any attempt to bypass guards MUST be rejected and logged.

## Role-Based Transition Control

Only the following roles may trigger state changes:

- Founder / Engagement Lead → approve findings, approve plans
- Ops Lead → triage audit requests
- Client Authority → sign-off ROI
- System → SLA timer events

Any unauthorized actor MUST be rejected and logged as:
`erain.security.transition_blocked`

## Executive Artifact Freeze Rule

Once an ExecutivePack reaches `delivered`:

- No downstream artifact may change without creating:
  - New version of the ExecutivePack
  - Linked supersession event
  - Explicit note of impact delta

This protects board-level trust.

END
