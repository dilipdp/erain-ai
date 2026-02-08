

# PHASE 0 LOCK — FOUNDATION (CONSTITUTIONAL ROOT)

## Status
- Locked: YES
- Lock Date: 2026-02-08
- Locked By: Dilip (Founder)

---

## What This Lock Means

Phase 0 is the **constitutional root** of EraIn.

Once locked:

- All human-rights, safety, and refusal-first invariants are **immutable**
- No higher phase may weaken, bypass, or reinterpret Phase 0 guarantees
- Any action violating Phase 0 MUST be refused or halted
- All future evolution is constrained by this foundation

Phase 0 defines **what EraIn is allowed to be**.

---

## Scope of Phase 0 Authority

Phase 0 governs:

- Human-rights invariants
- Safety-first and refusal-first behavior
- Authority boundaries and expiry
- Constitutional audit guarantees
- Hard-stop semantics on violation

Every other phase inherits these rules.

---

## Preconditions (Satisfied)

- [x] `README.md` finalized
- [x] `specs/invariants.md` defined and enforced
- [x] `specs/threat_model.md` completed
- [x] `specs/audit_contract.md` implemented (root audit)
- [x] `specs/acceptance.md` satisfied
- [x] Cross-phase inheritance rules defined

---

## Invariants That Are Immutable

The following are permanently non-negotiable:

- INV-0001 — Human dignity and rights supremacy
- INV-0002 — Refusal-first safety
- INV-0003 — No action without authority
- INV-0004 — Audit-before-action
- INV-0005 — No silent execution
- INV-0006 — Human interruptibility
- INV-0007 — No goal creation or mutation
- INV-0008 — Safety over capability
- INV-0009 — Halt on constitutional violation

---

## Allowed Changes After Lock

- Clarifying documentation
- Additive safety checks
- New ADRs that **strengthen** protections
- Versioned constitutional evolution (never in-place)

---

## Forbidden Changes After Lock

- Weakening or removing any INV-000x invariant
- Allowing execution without audit
- Introducing non-interruptible behavior
- Allowing goal mutation or self-direction
- Silent behavior changes

---

## Enforcement

- CI/CD MUST block any violation of Phase 0 invariants
- Runtime MUST refuse or halt on violation
- Any exception requires:
  - New ADR
  - Versioned constitutional fork
  - Update to `LOCK_MANIFEST.md`

---

## Notes

Phase 0 is the line between
**intelligence** and **danger**.

This lock ensures EraIn can never
become unsafe, unaccountable, or inhuman — no matter how it evolves.