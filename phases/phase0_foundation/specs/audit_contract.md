# Phase 0 — Foundation Audit Contract (Constitutional Proof Layer)

This document defines the **root audit contract** for EraIn.
It is the highest-order audit layer from which all other phase audit contracts inherit.

If Phase 0 audit guarantees are violated,
**EraIn MUST refuse to act or halt entirely**.

---

## Purpose

The Foundation audit contract ensures that:

- Human-rights invariants are provable
- Safety refusals are visible and auditable
- Authority boundaries are enforced
- No action occurs without constitutional traceability
- Higher-phase audits inherit a common proof base

This audit layer is **non-optional** and **always-on**.

---

## Audit Principles (Non-Negotiable)

- Audit is **write-before-action**
- Audit is **append-only**
- Audit is **tamper-evident**
- Audit is **human-reviewable**
- Audit failure is a **hard refusal or halt**
- No phase may weaken Phase 0 audit guarantees

---

## Mandatory Audit Event Types

All EraIn operations MUST emit Phase 0 audit events,
either directly or via inherited higher-phase events.

### 1. `CONSTITUTION_REFERENCED`
Emitted when an action references constitutional invariants.

### 2. `HUMAN_RIGHTS_CHECK_PERFORMED`
Emitted before any potentially impactful action.

### 3. `SAFETY_REFUSAL_TRIGGERED`
Emitted when an action is refused due to safety or rights violation.

### 4. `AUTHORITY_CONTEXT_EVALUATED`
Emitted when authority scope and expiry are evaluated.

### 5. `SYSTEM_HALTED`
Emitted when EraIn halts due to constitutional violation.

---

## Mandatory Audit Event Fields

Every Phase 0 audit event MUST include:

| Field | Description |
|------|------------|
| `event_id` | Deterministic unique identifier |
| `event_type` | One of the Phase 0 event types |
| `timestamp_utc` | ISO-8601 UTC timestamp |
| `phase` | Must be `phase0_foundation` |
| `constitution_version` | Active constitution version |
| `invariant_refs` | Referenced invariants (INV-000x) |
| `authority_context` | Acting authority and scope |
| `human_actor` | Human requester or approver (if any) |
| `decision_id` | Phase 1 decision reference (if applicable) |
| `snapshot_id` | Phase 2 reality snapshot (if applicable) |
| `outcome` | allowed / refused / halted |
| `previous_event_hash` | Hash of previous audit event |
| `event_hash` | Hash of this event |

Missing any required field is a **constitutional violation**.

---

## Cross-Phase Inheritance Rules

- All higher-phase audit contracts MUST:
  - include Phase 0 fields
  - reference Phase 0 invariants
  - preserve audit chain continuity
- No phase may suppress or bypass Phase 0 audit events

Phase 0 audit is the root of all traceability.

---

## Human Rights & Safety Proof

- Human-rights checks MUST be explicit
- Refusals MUST be audited with justification
- Silent safety behavior is forbidden

---

## Failure Handling

- Missing audit sink → hard halt
- Corrupted audit chain → hard halt
- Unverifiable constitutional reference → refusal

There is no degraded mode for constitutional audit failure.

---

## Retention & Permanence

- Phase 0 audit logs MUST be retained permanently
- Logs MUST survive system, vendor, and model changes
- Historical replay MUST always be possible

---

## Locking & Evolution Rules

- This contract is lockable with Phase 0
- Fields may be added, never removed
- All changes require ADRs
- All higher-phase contracts inherit this baseline

---

**Phase 0 audit guarantees ensure EraIn  
never acts without constitutional proof.**
