# Phase 2 — Reality Audit Audit Contract (Truth Verification)

This document defines the **mandatory audit contract** for Reality Audit AI™.
It specifies what must be logged to prove that EraIn reasoned on **verified reality** and not assumptions.

This contract is binding on Phase 2 and all downstream phases.

---

## Purpose

The audit contract guarantees that:
- Reality verification steps are reproducible
- Contradictions and uncertainty are visible
- Confidence is justified, not implied

If reality cannot be audited, **it must not be trusted**.

---

## Audit Principles (Non‑Negotiable)

- Audit is **complete**, not sampled
- Audit is **write-before-state**
- Audit is **append-only**
- Audit is **tamper-evident**
- Audit failure is a **hard failure**

---

## Mandatory Audit Event Types

Reality Audit MUST emit the following event types where applicable:

### 1. `INPUT_ACCEPTED`
Emitted when Trust-Fabric-verified input is accepted for reality verification.

### 2. `SOURCE_RECONCILED`
Emitted for each source comparison and reconciliation result.

### 3. `CONTRADICTION_DETECTED`
Emitted whenever conflicting assertions are identified.

### 4. `TEMPORAL_CHECK_PERFORMED`
Emitted when freshness, ordering, or staleness checks occur.

### 5. `CONSTRAINT_VALIDATED`
Emitted for each constraint validation (physical, legal, financial, temporal).

### 6. `RCI_COMPUTED`
Emitted when the Reality Confidence Index is finalized.

### 7. `STATE_SNAPSHOT_EMITTED`
Emitted when a Verified State Snapshot is produced.

### 8. `REALITY_REJECTED`
Emitted when reality verification fails and state is rejected.

---

## Mandatory Audit Event Fields

Every audit event MUST include the following fields:

| Field | Description |
|------|------------|
| `event_id` | Deterministic unique identifier |
| `event_type` | One of the mandatory event types |
| `timestamp_utc` | ISO‑8601 UTC timestamp |
| `phase` | Must be `phase2_reality_audit` |
| `component` | Emitting module |
| `input_provenance_ids` | Trust Fabric provenance references |
| `snapshot_id` | Verified State Snapshot ID (if applicable) |
| `constraint_results` | Constraint evaluation outcomes |
| `conflict_refs` | References to contradiction objects |
| `rci_value` | Reality Confidence Index value |
| `system_version` | Reality Audit version |
| `previous_event_hash` | Hash of previous audit event |
| `event_hash` | Hash of this event |

Missing required fields is a **contract violation**.

---

## Verified State Snapshot Requirements

A `STATE_SNAPSHOT_EMITTED` event MUST reference a snapshot containing:
- Inputs used
- Sources consulted
- Conflicts detected
- Constraints evaluated
- RCI value
- Timestamp
- Provenance links

Snapshots are immutable once emitted.

---

## Tamper‑Evidence Strategy

- All audit events MUST be hash‑linked
- Hash continuity MUST be verifiable independently
- Any break invalidates the audit trail

---

## Failure Handling

- Missing audit sink → fail closed
- Missing constraint results → reject state
- Missing RCI → reject state
- Any audit schema violation → halt emission

No fallback or degraded modes are allowed.

---

## Retention & Export

- Reality audit logs MUST be retained permanently
- Snapshots MUST be exportable for audit and replay
- External verifiers MUST be able to recompute hashes

---

## Phase 0 & 1 Compliance

This contract enforces:
- INV‑0002 — Mandatory Auditability
- TF‑INV‑0101 → TF‑INV‑0109 — Trust Fabric guarantees
- RA‑INV‑0209 — Full auditability of reality checks

Violations are constitutional breaches.

---

## Locking & Evolution Rules

- This contract is lockable with Phase 2
- Fields may be added, never removed
- All changes require ADR + backward compatibility

---

**Reality Audit logs prove that EraIn verified the world before reasoning about it.**
