

# Phase 2 — Acceptance Criteria (Reality Audit Lock)

This document defines the **objective, non-negotiable acceptance criteria** for Phase 2 — Reality Audit AI™.
Phase 2 may be considered complete and eligible for lock **only when all criteria below are satisfied**.

Anything less means EraIn is still capable of reasoning on unverified or inconsistent reality.

---

## Acceptance Criteria

### RA-AC-0201 — Phase 0 & Phase 1 Compliance Proven
- Phase 0 is LOCKED and COMPLETE
- Phase 1 Trust Fabric is implemented and audit-complete
- Reality Audit accepts only Trust-Fabric-verified inputs
- CI enforces rejection of raw or unaudited inputs

---

### RA-AC-0202 — Multi-Source Reconciliation Implemented
- Independent sources are compared for critical state assertions
- Agreement, conflict, and gaps are explicitly detected
- Single-source states are downgraded with reduced RCI

---

### RA-AC-0203 — Contradiction Handling Is Explicit
- Conflicting assertions are never silently resolved
- Contradictions are represented as first-class objects
- Conflicts propagate into RCI and downstream visibility

---

### RA-AC-0204 — Temporal Consistency Enforced
- Stale, replayed, or regressive data is detected
- Freshness thresholds are configurable and enforced
- Temporal violations downgrade or reject state

---

### RA-AC-0205 — Constraint Validation Is Complete
- Physical constraints are enforced where applicable
- Legal and regulatory constraints are validated
- Financial constraints are checked for feasibility
- Impossible states are rejected, not adjusted

---

### RA-AC-0206 — Reality Confidence Index (RCI) Is Mandatory
- Every Verified State Snapshot includes an RCI value
- RCI computation factors:
  - Source diversity
  - Evidence freshness
  - Constraint satisfaction
  - Conflict severity
- Low RCI forces downgrade or refusal

---

### RA-AC-0207 — Verified State Snapshot Is Canonical
- Verified State Snapshots are immutable
- Downstream phases consume only snapshot IDs
- Raw inputs do not propagate beyond Reality Audit

---

### RA-AC-0208 — Audit Contract Fully Implemented
- All mandatory Reality Audit audit events are emitted
- Audit events are:
  - Append-only
  - Hash-linked
  - Tamper-evident
- Missing audit data causes fail-closed behavior

---

### RA-AC-0209 — No Decision or Execution Leakage
- Reality Audit performs no decision-making
- No optimization or execution logic exists
- Architectural separation is enforced and tested

---

### RA-AC-0210 — Failure Modes Are Tested
- Tests exist for:
  - Conflicting sources
  - Missing or stale evidence
  - Constraint violations
  - Low RCI scenarios
  - Audit sink failures
- All failures are visible, auditable, and safe

---

## Exit Conditions

Phase 2 may be declared **COMPLETE** only when:
- All RA-AC-0201 through RA-AC-0210 are satisfied
- No TODOs or placeholders exist
- Phase 2 outputs are required inputs for Phase 3

---

## Locking Declaration

Once Phase 2 is accepted and locked:
- Reality verification rules become immutable
- All downstream phases MUST reason on Verified State Snapshots
- Any change requires:
  - New ADR
  - Backward compatibility
  - Update to `LOCK_MANIFEST.md`

---

**Reality Audit AI™ ensures EraIn reasons on truth — or not at all.**