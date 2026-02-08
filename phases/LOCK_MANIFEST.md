

# EraIn AI — Phase Lock Manifest

This manifest is the **single source of truth** for architectural locks across EraIn AI.
It is enforceable, auditable, and forward-compatible.

---

## Lock Governance Rules

A phase is considered **LOCKED** only when:
- Its `LOCKED.md` explicitly states `Locked: YES`
- A `Lock Date` is present
- A `Locked By` authority is named

Any breaking change after a phase is locked **must**:
- Introduce a new ADR
- Create a versioned phase fork (example: `phase3_execution_engine_v2/`)
- Update this manifest with justification

Silent violations are treated as **critical system faults**.

---

## Phase Lock Status Table

| Phase | Folder | Locked | Lock Date | Locked By | Notes |
|------:|--------|--------|-----------|-----------|-------|
| 0 | phase0_foundation | YES | 2026-02-08 | Dilip (Founder) | Constitutional layer |
| 1 | phase1_trust_fabric | NO | - | - | |
| 2 | phase2_reality_audit | NO | - | - | |
| 3 | phase3_execution_engine | NO | - | - | |
| 4 | phase4_erain_os | NO | - | - | |
| 5 | phase5_industry_grids | NO | - | - | |
| 6 | phase6_autonomous_loops | NO | - | - | |
| 7 | phase7_global_sovereign | NO | - | - | |
| 8 | phase8_longevity | NO | - | - | |

---

## Enforcement & Compliance

- Downstream phases must reference upstream locked phases explicitly
- CI/CD must block merges that violate locked invariants
- Architectural Review is mandatory for any change touching locked phases
- All locks are immutable once declared

---

## Audit Notes

- This file must be reviewed during every major release
- Any discrepancy between a phase folder and this manifest is a release blocker
- Historical locks must never be deleted; only appended or versioned

---

**EraIn AI operates on locked truth, not mutable opinion.**