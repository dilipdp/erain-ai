

# Phase 1 — Acceptance Criteria (Trust Fabric Lock)

This document defines the **objective, non-negotiable acceptance criteria** for Phase 1 — Trust Fabric Engine™.
Phase 1 may be considered complete and eligible for lock **only when all criteria below are satisfied**.

Anything less is a partial system and must not be locked.

---

## Acceptance Criteria

### AC-101 — Phase 0 Compliance Proven
- Phase 0 is LOCKED and COMPLETE
- Phase 1 README explicitly references Phase 0 invariants
- CI checks exist that validate:
  - Intelligence–execution separation
  - Mandatory auditability
  - Human intent supremacy

---

### AC-102 — Provenance Coverage Is Total
- Every non-trivial decision emits a provenance record
- Provenance is created **before** output emission
- No code path allows decision output without provenance

---

### AC-103 — Provenance Is Inspectable
- Provenance records are:
  - Human-readable (summaries)
  - Machine-verifiable (structured form)
- Reviewers can trace:
  - Output → reasoning → inputs → evidence

---

### AC-104 — Evidence Anchoring Enforced
- Non-trivial decisions reference evidence sources
- Evidence metadata includes:
  - Source identity
  - Timestamp
  - Integrity metadata
- Missing evidence forces refusal or downgrade

---

### AC-105 — Refusal Is Enforced by Default
- Refusal occurs when:
  - Confidence is below threshold
  - Evidence coverage is insufficient
  - Conflicts remain unresolved
- Refusal emits:
  - Provenance
  - Audit events
  - Explicit refusal reason

---

### AC-106 — Audit Contract Fully Implemented
- All mandatory audit event types are emitted where applicable
- All required audit fields are present
- Audit events are:
  - Append-only
  - Hash-linked
  - Tamper-evident

Missing audit data is treated as a **hard failure**.

---

### AC-107 — Determinism Verified
- Provenance IDs and audit IDs are deterministic
- Identical inputs produce identical identifiers
- Version changes produce predictably different identifiers

---

### AC-108 — No Execution Leakage
- Phase 1 contains no execution code
- No state-changing side effects exist
- No execution dependencies are imported

---

### AC-109 — Failure Modes Tested
- Tests exist for:
  - Missing provenance
  - Missing evidence
  - Low confidence
  - Audit sink failure
- All failures degrade safely and visibly

---

## Exit Conditions

Phase 1 may be declared **COMPLETE** only when:
- All AC-101 through AC-109 are satisfied
- No TODOs or placeholders exist
- Downstream phases explicitly depend on Trust Fabric outputs

---

## Locking Declaration

Once Phase 1 is accepted and locked:
- Trust Fabric guarantees become immutable
- All downstream phases MUST comply with these guarantees
- Any change requires:
  - New ADR
  - Backward compatibility
  - Update to `LOCK_MANIFEST.md`

---

**Trust Fabric is the proof spine of EraIn AI.**
Without it, nothing else is allowed to execute.