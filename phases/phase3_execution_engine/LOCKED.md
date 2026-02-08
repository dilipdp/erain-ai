

# PHASE 3 LOCK — EXECUTION INTELLIGENCE ENGINE™ (LOCK INTENT)

## Status
- Locked: NO
- Lock Intent: DECLARED
- Target Lock Condition: After full implementation + tests
- Declared By: Dilip (Founder)
- Declaration Date: 2026-02-08

---

## What This Lock Will Mean

Once Phase 3 is locked:

- EraIn is formally allowed to **change the state of the world**
- All execution MUST comply with:
  - Proven decisions (Phase 1)
  - Verified reality (Phase 2)
  - Constitutional safety rules (Phase 0)
- Unsafe, irreversible, or unaudited execution becomes impossible by design
- Human override supremacy becomes immutable

Phase 3 defines **how EraIn is allowed to act — and when it must refuse**.

---

## Phase Dependencies (Mandatory)

Phase 3 may only be locked if:

- Phase 0 — Foundation is **LOCKED**
- Phase 1 — Trust Fabric is **implemented and audit-complete**
- Phase 2 — Reality Audit is **implemented and snapshot-enforced**
- Execution paths consume only:
  - Trust Fabric `decision_id`
  - Reality Audit `snapshot_id`

Any bypass is a constitutional violation.

---

## Preconditions to Lock

The following MUST be true before Phase 3 can be locked:

- [ ] `README.md` finalized and dependency alignment proven
- [ ] `specs/invariants.md` fully enforced in code
- [ ] `specs/threat_model.md` implemented and tested
- [ ] `specs/audit_contract.md` fully implemented (fail-closed)
- [ ] `specs/acceptance.md` all EX-AC-0301 → EX-AC-0310 satisfied
- [ ] Execution planner implemented
- [ ] Pre-execution simulation implemented
- [ ] Rollback engine implemented
- [ ] Containment engine implemented
- [ ] Kill-switch implemented and tested
- [ ] Full audit coverage for all execution paths
- [ ] Human override paths tested
- [ ] Failure-mode test coverage complete

---

## Invariants That Will Become Immutable

Upon lock, the following become non-negotiable:

- EX-INV-0301 — Verified inputs only
- EX-INV-0302 — Safety declaration mandatory
- EX-INV-0303 — Pre-execution simulation required
- EX-INV-0304 — Kill-switch supremacy
- EX-INV-0305 — Deterministic execution
- EX-INV-0306 — Fail-closed on uncertainty
- EX-INV-0307 — Full execution auditability
- EX-INV-0308 — No decision logic in execution
- EX-INV-0309 — Human override always available

---

## Allowed Changes After Lock

- Clarifying documentation
- Additive safety patterns
- New rollback or containment strategies
- New ADRs that **extend**, not weaken, safety guarantees

---

## Forbidden Changes After Lock

- Allowing execution without rollback or containment
- Weakening kill-switch behavior
- Allowing execution on low-confidence reality
- Suppressing execution audit events
- Introducing decision or reality logic into execution

---

## Enforcement

- CI/CD MUST block execution code that violates invariants
- CI/CD MUST enforce snapshot-only and decision-only inputs
- Any violation requires:
  - New ADR
  - Versioned phase fork
  - Update to `LOCK_MANIFEST.md`

---

## Notes

Phase 3 is the **point of no return** for EraIn.

That is why it is lock-intended early,
locked late,
and guarded forever.