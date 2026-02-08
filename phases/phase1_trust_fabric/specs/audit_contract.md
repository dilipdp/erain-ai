

# Phase 1 — Trust Fabric Audit Contract (Mandatory)

This document defines the **mandatory audit contract** for the Trust Fabric Engine™.
It specifies **what must be logged**, **how it must be logged**, and **why missing logs are fatal**.

This contract is **binding** on all Phase 1 components and all downstream phases.

---

## Purpose

The audit contract ensures that:
- Every decision is provable
- Every refusal is explainable
- Every downstream execution can be traced to verified truth

If an action or decision cannot be audited, **it must not exist**.

---

## Audit Principles (Non-Negotiable)

- Audit is **default**, not optional
- Audit is **write-before-complete**
- Audit is **append-only**
- Audit is **tamper-evident**
- Audit failure is a **hard failure**

---

## Mandatory Audit Event Types

Every Trust Fabric component MUST emit the following event types where applicable:

### 1. `DECISION_EMITTED`
Emitted when a non-trivial decision is produced.

### 2. `REFUSAL_EMITTED`
Emitted when the system explicitly refuses to decide or proceed.

### 3. `EVIDENCE_LINKED`
Emitted when evidence is attached or updated for a decision.

### 4. `PROVENANCE_RECORDED`
Emitted when a provenance graph node is finalized.

### 5. `CONFIDENCE_EVALUATED`
Emitted when confidence scoring is completed.

---

## Mandatory Audit Event Fields

Every audit event MUST include the following fields:

| Field | Description |
|------|------------|
| `event_id` | Deterministic unique identifier |
| `event_type` | One of the mandatory event types |
| `timestamp_utc` | ISO-8601 UTC timestamp |
| `phase` | Phase identifier (must be `phase1_trust_fabric`) |
| `component` | Emitting component name |
| `decision_id` | Associated decision identifier |
| `provenance_id` | Provenance graph identifier |
| `confidence_score` | Confidence value (if applicable) |
| `refusal_reason` | Reason code (if refusal) |
| `evidence_refs` | List of evidence identifiers |
| `human_context` | Human intent / override context |
| `system_version` | Trust Fabric version |
| `previous_event_hash` | Hash of previous audit event |
| `event_hash` | Hash of this event |

Missing any required field is a **contract violation**.

---

## Tamper-Evidence Strategy

- Audit events MUST be hash-linked (chain of custody)
- Hash algorithm must be cryptographically strong
- Any break in hash continuity invalidates the audit trail

---

## Failure Handling

- If audit sink is unavailable → decision MUST NOT be emitted
- If hash generation fails → system MUST fail closed
- If schema validation fails → event MUST be rejected

There are **no fallback modes**.

---

## Retention & Export

- Audit events MUST be retained for the lifetime of the system
- Export must be possible in machine-readable format
- External auditors must be able to verify hash integrity independently

---

## Phase 0 Compliance

This audit contract enforces:
- INV-0002 — Mandatory Auditability
- INV-0001 — Intelligence–Execution Separation
- INV-0005 — Human Intent Supremacy

Any violation is a **constitutional breach**.

---

## Locking & Evolution Rules

- This contract is lockable with Phase 1
- Changes require:
  - New ADR
  - Backward compatibility
  - Explicit security review
- Fields may be added, never removed

---

**Trust Fabric audit logs are not logs.  
They are proof.**