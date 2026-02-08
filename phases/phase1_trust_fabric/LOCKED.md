

# PHASE 1 LOCK — TRUST FABRIC (NOT YET LOCKED)

## Status
- Locked: NO
- Lock Intent: PENDING
- Target Lock Condition: After Trust Fabric implementation + audit-complete validation

---

## What This Lock Will Mean

Once Phase 1 is locked:

- All decisions MUST be provable as:
  - requested by a valid authority
  - evaluated under explicit policies
  - derived from verifiable evidence
  - traceable end-to-end across phases
- “Black-box decisions” are forbidden
- Any action without Trust Fabric proof MUST be refused
- Trust proofs become immutable contracts for downstream phases

Phase 1 defines **how EraIn proves intent and reasoning**.

---

## Phase Dependencies (Mandatory)

Phase 1 depends on:

- Phase 0 — Foundation (constitutional invariants + audit root) **LOCKED**

Phase 1 MUST NEVER weaken Phase 0 guarantees.

---

## Preconditions to Lock

The following MUST be true before Phase 1 can be locked:

- [ ] `README.md` finalized
- [ ] `specs/invariants.md` enforced (TF-INV-0101 → TF-INV-0109)
- [ ] `specs/threat_model.md` implemented and tested
- [ ] `specs/audit_contract.md` fully implemented (fail-closed)
- [ ] `specs/acceptance.md` all TF-AC-0101 → TF-AC-0110 satisfied
- [ ] Decision lineage engine implemented (decision_id as primary key)
- [ ] Policy evaluation engine implemented (allow/deny + reasons)
- [ ] Evidence binding implemented (what facts were used, from where)
- [ ] Replayability proven (reconstruct decision context post-hoc)
- [ ] Refusal behavior proven on missing proof
- [ ] Independent audit review completed

---

## Invariants That Will Become Immutable

Upon lock, the following become non-negotiable:

- TF-INV-0101 — Every action has a decision_id
- TF-INV-0102 — Authority context required
- TF-INV-0103 — Policy evaluation required
- TF-INV-0104 — Evidence binding required
- TF-INV-0105 — Explanation and provenance required
- TF-INV-0106 — Replayability required
- TF-INV-0107 — Tamper-evident decision chain
- TF-INV-0108 — Refusal on missing proof
- TF-INV-0109 — No silent decision-making

(Full definitions live in `specs/invariants.md`.)

---

## Allowed Changes After Lock

- Clarifying documentation
- Additive proof fields (never removing required fields)
- New ADRs that **strengthen** trust guarantees
- Versioned Trust Fabric evolution

---

## Forbidden Changes After Lock

- Removing evidence binding or policy checks
- Allowing decisions without authority scope
- Weakening replayability requirements
- Any “best effort” trust behavior
- Silent changes to proof semantics

---

## Enforcement

- CI/CD MUST block changes that weaken Trust Fabric proofs
- Runtime MUST refuse actions missing Trust Fabric proof
- Any breaking change requires:
  - New ADR
  - Versioned Phase 1 fork (e.g., `phase1_trust_fabric_v2/`)
  - Update to `phases/LOCK_MANIFEST.md`

---

## Notes

Phase 1 is where EraIn becomes **provable**.

Without Trust Fabric, EraIn is just output.
With Trust Fabric, EraIn becomes auditable, enforceable, and trustworthy.