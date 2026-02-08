

# Phase 3 — Acceptance Criteria (Execution Intelligence Lock)

This document defines the **objective, non-negotiable acceptance criteria**
for Phase 3 — Execution Intelligence Engine™.

Phase 3 may be considered complete and eligible for **lock intent**
only when *all* criteria below are satisfied.

Execution is the most dangerous capability in EraIn.
There are no partial passes.

---

## Acceptance Criteria

### EX-AC-0301 — Phase Dependency Integrity
- Phase 0 is LOCKED and COMPLETE
- Phase 1 Trust Fabric is implemented and audit-complete
- Phase 2 Reality Audit is implemented and snapshot-enforced
- Execution consumes only:
  - Trust Fabric `decision_id`
  - Reality Audit `snapshot_id`

Any execution path without these inputs is rejected.

---

### EX-AC-0302 — Safety Declaration Is Mandatory
- Every execution step declares:
  - rollback strategy **or**
  - containment strategy
- Safety metadata is validated before execution
- Missing safety data causes hard refusal

---

### EX-AC-0303 — Pre-Execution Simulation Enforced
- All execution plans are simulated against verified state
- Simulation success is mandatory before real execution
- Simulation failure blocks execution

---

### EX-AC-0304 — Kill-Switch Supremacy Proven
- Kill-switch can halt execution:
  - immediately
  - deterministically
  - at any step
- Kill-switch activation is auditable
- Kill-switch tests exist and pass

---

### EX-AC-0305 — Deterministic Execution Guaranteed
- Identical inputs produce identical execution order
- Dependency graphs are explicit and validated
- Partial or unordered execution is impossible

---

### EX-AC-0306 — Fail-Closed on Uncertainty
- Execution refuses when:
  - RCI is below threshold
  - Audit sinks are unavailable
  - Safety guarantees are incomplete
- No degraded or “best effort” execution modes exist

---

### EX-AC-0307 — Execution Audit Contract Implemented
- All mandatory execution audit events are emitted
- Events are:
  - ordered
  - hash-linked
  - tamper-evident
- Missing audit data causes immediate halt

---

### EX-AC-0308 — Rollback & Containment Tested
- Rollback paths are tested
- Containment paths are tested
- Partial failures trigger rollback or containment automatically
- Rollback failure escalates to containment

---

### EX-AC-0309 — Human Override Supremacy
- Humans can:
  - pause execution
  - modify plans
  - abort actions
- Human overrides always supersede automation
- Overrides are fully auditable

---

### EX-AC-0310 — No Decision or Reality Logic Leakage
- Execution contains no decision logic
- Execution contains no reality verification logic
- Architectural separation is enforced and tested

---

## Exit Conditions

Phase 3 may be declared **COMPLETE** only when:
- All EX-AC-0301 through EX-AC-0310 are satisfied
- No TODOs or placeholders exist
- Downstream phases treat execution outputs as auditable facts

---

## Locking Declaration

Once Phase 3 is accepted and lock-intended:
- Execution rules become immutable
- All downstream phases MUST comply with execution safety guarantees
- Any change requires:
  - New ADR
  - Versioned phase fork
  - Update to `LOCK_MANIFEST.md`

---

**Execution Intelligence Engine™ gives EraIn the right to act —  
only when safety, proof, and human control are absolute.**