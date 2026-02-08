# PHASE 2 LOCK — REALITY AUDIT (LOCK INTENT)



## Status
- Locked: NO
- Lock Intent: DECLARED
- Target Lock Condition: After Reality Audit implementation + snapshot enforcement + audits
- Declared By: Dilip (Founder)
- Declaration Date: 2026-02-08

---

## What This Lock Will Mean

Once Phase 2 is locked:

- Reality Audit becomes the **only permitted source of operational truth** for EraIn
- All downstream phases MUST:
  - reference verified reality snapshots (`snapshot_id`)
  - refuse on stale, missing, or unverified data
  - maintain tamper-evident truth provenance
- “Inferred reality” or “best-guess truth” is forbidden for execution
- Truth guarantees become immutable contracts for all actions

Phase 2 defines **how EraIn proves what is real**.

---

## Phase Dependencies (Mandatory)

Phase 2 depends on:

- Phase 0 — Foundation **LOCKED**
- Phase 1 — Trust Fabric (decision lineage) — implemented before Phase 2 lock

Phase 2 MUST NEVER weaken Phase 0 guarantees.

---

## Preconditions to Lock

The following MUST be true before Phase 2 can be locked:

- [ ] `README.md` finalized
- [ ] `specs/invariants.md` enforced (RA-INV-0201 → RA-INV-0209)
- [ ] `specs/threat_model.md` implemented and tested
- [ ] `specs/audit_contract.md` fully implemented (fail-closed)
- [ ] `specs/acceptance.md` all RA-AC-0201 → RA-AC-0210 satisfied
- [ ] Snapshot engine implemented (immutable snapshots with `snapshot_id`)
- [ ] Freshness thresholds defined and enforced
- [ ] Source provenance captured and verifiable
- [ ] Conflict detection and resolution policy implemented
- [ ] Refusal behavior proven on missing/invalid snapshot
- [ ] Independent audit review completed

---

## Invariants That Will Become Immutable

Upon lock, the following become non-negotiable:

- RA-INV-0201 — All truth used for action must be snapshot-backed
- RA-INV-0202 — Snapshot freshness required
- RA-INV-0203 — Provenance required for all truth claims
- RA-INV-0204 — Conflict detection required
- RA-INV-0205 — No silent inference for execution-grade truth
- RA-INV-0206 — Tamper-evident snapshot chain
- RA-INV-0207 — Refusal on stale/missing truth
- RA-INV-0208 — Replayable truth reconstruction
- RA-INV-0209 — No truth without audit

(Full definitions live in `specs/invariants.md`.)

---

## Allowed Changes After Lock

- Clarifying documentation
- Additive snapshot fields (never removing required fields)
- Stronger freshness constraints
- New ADRs that **strengthen** truth guarantees
- Versioned Phase 2 evolution

---

## Forbidden Changes After Lock

- Allowing action on unverified reality
- Weakening freshness or provenance requirements
- Removing conflict detection / resolution visibility
- Any “best effort” truth behavior
- Silent changes to snapshot semantics

---

## Enforcement

- CI/CD MUST block changes that weaken Reality Audit guarantees
- Runtime MUST refuse actions missing valid `snapshot_id`
- Any breaking change requires:
  - New ADR
  - Versioned Phase 2 fork (e.g., `phase2_reality_audit_v2/`)
  - Update to `phases/LOCK_MANIFEST.md`

---

## Notes

Phase 2 is where EraIn becomes **grounded in reality**.

Without Reality Audit, execution is guessing.
With Reality Audit, execution becomes lawful, safe, and provable.