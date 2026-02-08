

# Phase 0 — Acceptance Criteria (Constitutional Lock)

This document defines the **non-negotiable acceptance criteria** for Phase 0 of EraIn AI.
Phase 0 is considered **complete and valid** only if *all* criteria below are satisfied.

Failure to meet any criterion means **Phase 0 is NOT complete**, regardless of implementation progress elsewhere.

---

## Acceptance Criteria

### AC-001 — Constitutional Lock Declared
- `phases/phase0_foundation/LOCKED.md` exists
- Lock status is `Locked: YES`
- Lock date and locking authority are present
- Lock language explicitly forbids future violations

---

### AC-002 — Global Manifest Alignment
- `phases/LOCK_MANIFEST.md` exists
- Phase 0 is marked as `LOCKED: YES`
- Lock date and authority match `LOCKED.md`
- Manifest defines fork + ADR rules for post-lock changes

---

### AC-003 — Foundational Invariants Defined
- `specs/invariants.md` exists
- All invariants are uniquely identified (INV-0001+)
- Each invariant includes:
  - Rule
  - Rationale
  - Prevention scope
  - Validation mechanism
- Invariants are explicitly marked immutable

---

### AC-004 — Foundational Threat Model Defined
- `specs/threat_model.md` exists
- Threat actors include:
  - Humans
  - Economic forces
  - Regulatory shifts
  - AI/systemic drift
  - Unknown futures
- Each major threat maps to one or more invariants
- Mitigations reference invariant enforcement

---

### AC-005 — Enforcement Is Explicit
- CI/CD failure conditions are stated for invariant violations
- No “soft enforcement” or “best effort” language exists
- No exception or bypass paths are allowed

---

### AC-006 — Longevity Considered Explicitly
- Longevity (100+ years) is referenced explicitly
- Architectural permanence is prioritized over models or vendors
- Backward compatibility is stated as default behavior

---

### AC-007 — Reviewability & Auditability
- All Phase 0 documents are human-readable
- Language is precise and non-ambiguous
- External auditors can understand Phase 0 intent without additional context

---

## Exit Conditions

Phase 0 may be declared **COMPLETE** only when:
- All acceptance criteria AC-001 through AC-007 are satisfied
- No open TODOs or placeholders exist
- Phase 0 is referenced as a dependency by Phase 1

---

## Irreversibility Clause

Once Phase 0 is accepted:
- It becomes the **constitutional foundation** of EraIn AI
- It may not be modified, weakened, or reinterpreted
- Any change requires a versioned architectural fork

---

**Phase 0 acceptance is a one-time event.**
Once accepted, it defines the permanent boundaries of EraIn AI.