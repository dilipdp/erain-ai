

# Phase 4 — Acceptance Criteria (EraIn OS Lock Eligibility)

This document defines the **non-negotiable acceptance criteria**
for Phase 4 — EraIn OS™.

Phase 4 may be considered **complete and eligible for LOCK INTENT**
only when *all* criteria below are satisfied.

EraIn OS is the system of record for the business.
There is no partial acceptance.

---

## Acceptance Criteria

### OS-AC-0401 — Phase Enforcement Proven
- Phase 0 invariants are enforced at runtime
- Phase 1 decisions are the only source of intent
- Phase 2 verified snapshots are the only source of truth
- Phase 3 execution is the only allowed action path
- No bypass paths exist (tested and proven)

---

### OS-AC-0402 — Authority & Policy Enforcement
- All workflows require explicit authority context
- Policies are evaluated before workflow progression
- Policy violations cause refusal (not warnings)
- Authority and policy outcomes are auditable

---

### OS-AC-0403 — Domain Capsule Isolation
- Each business domain operates inside a capsule
- Cross-domain interactions are OS-mediated
- Direct domain-to-domain execution is impossible
- Isolation violations are blocked and logged

---

### OS-AC-0404 — Single Source of Business Truth
- Unified business state graph exists
- State graph is built only from verified snapshots
- Conflicting truths are surfaced, not hidden
- Executives see one canonical business reality

---

### OS-AC-0405 — Executive Control Is Real
- Executives can:
  - Halt workflows
  - Intervene in decisions
  - Override execution (with audit)
- Visibility always includes control
- Control actions are deterministic and auditable

---

### OS-AC-0406 — Workflow Governance Proven
- All workflows are:
  - auditable
  - policy-bound
  - authority-bound
- Ungoverned workflows cannot exist
- Refused workflows leave audit evidence

---

### OS-AC-0407 — Cross-Phase Traceability Complete
- Every workflow action links to:
  - `decision_id` (Phase 1)
  - `snapshot_id` (Phase 2)
  - `execution_plan_id` (Phase 3, if applicable)
- Missing links invalidate the action

---

### OS-AC-0408 — Audit Contract Fully Implemented
- All mandatory OS audit events are emitted
- Events are ordered and hash-linked
- Audit sinks are fail-closed
- Audit replay reconstructs full business history

---

### OS-AC-0409 — Tool Mediation Enforced
- External tools integrate via EraIn OS only
- No external tool is a source of authority or truth
- Write access is always mediated and auditable

---

### OS-AC-0410 — Longevity & Stability Proven
- ADRs exist for all major OS decisions
- Backward compatibility is maintained
- Versioned forks are used for breaking change
- No rewrite-dependent assumptions exist

---

## Exit Conditions

Phase 4 may be declared **COMPLETE** only when:
- All OS-AC-0401 → OS-AC-0410 are satisfied
- No TODOs or placeholders remain
- EraIn OS demonstrably replaces fragmented business tooling
- Governance failures are structurally impossible

---

## Locking Declaration

Once Phase 4 is accepted and lock-intended:
- EraIn OS becomes the immutable business runtime
- Downstream phases MUST comply with OS governance
- Any change requires:
  - New ADR
  - Versioned OS fork
  - Update to `LOCK_MANIFEST.md`

---

**EraIn OS™ is accepted only when the business itself  
can no longer operate outside of truth, policy, and authority.**