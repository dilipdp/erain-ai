

# Phase 6 — Acceptance Criteria (Autonomous Control Loops Lock Eligibility)

This document defines the **non-negotiable acceptance criteria**
for Phase 6 — Autonomous Control Loops™.

Phase 6 may be considered **complete and eligible for LOCK INTENT**
only when *all* criteria below are satisfied.

Autonomy is the most dangerous capability in EraIn.
There is no partial acceptance.

---

## Acceptance Criteria

### AL-AC-0601 — Upstream Governance Enforcement Proven
- All Phase 0–5 invariants are enforced at runtime
- Autonomous loops cannot bypass trust, reality, execution, OS, or industry layers
- Any bypass attempt is refused and audited

---

### AL-AC-0602 — Authority-Bound Autonomy Proven
- Every loop runs under explicit, time-bounded authority
- Authority expiry halts loops automatically
- Over-broad or missing authority causes refusal

---

### AL-AC-0603 — No Goal Mutation Proven
- Autonomous loops cannot create, modify, or reinterpret goals
- Goals and success metrics are immutable inputs
- Any mutation attempt causes hard failure

---

### AL-AC-0604 — Verified Reality Dependency Proven
- All autonomous actions reference fresh, verified snapshots
- Stale or missing snapshots halt execution
- Industry-specific constraints are enforced

---

### AL-AC-0605 — Bounded Action Space Proven
- Each loop has an explicit action allowlist
- Safe ranges are enforced
- Out-of-bounds actions are refused and audited

---

### AL-AC-0606 — Drift Detection & Handling Proven
- Behavior, data, policy, and industry drift are detected
- Drift triggers pause or escalation
- Silent degradation is impossible

---

### AL-AC-0607 — Human Supremacy Proven
- Humans can pause, stop, or override loops at any time
- Interrupts are immediate and unconditional
- Overrides are auditable and reviewable

---

### AL-AC-0608 — Confidence Threshold Enforcement Proven
- Confidence scores are evaluated continuously
- Threshold breaches pause execution
- Continuation under uncertainty is forbidden

---

### AL-AC-0609 — Autonomous Audit Contract Implemented
- All mandatory autonomous audit events are emitted
- Events are ordered, hash-linked, and tamper-evident
- Audit replay reconstructs full autonomous behavior

---

### AL-AC-0610 — Revocability Proven
- Autonomy can be revoked per loop
- Autonomy can be revoked system-wide
- Revocation halts execution immediately

---

## Exit Conditions

Phase 6 may be declared **COMPLETE** only when:
- All AL-AC-0601 → AL-AC-0610 are satisfied
- No TODOs or placeholders exist
- Continuous autonomy can run safely for extended periods
- Humans retain absolute control at all times

---

## Locking Declaration

Once Phase 6 is accepted and lock-intended:
- Autonomous behavior becomes constitutionally governed
- New autonomy requires versioned loops
- Any change requires:
  - New ADR
  - Compatibility review
  - Update to `LOCK_MANIFEST.md`

---

**Autonomous Control Loops™ are accepted only when  
EraIn can operate continuously without ever becoming unsafe, opaque, or uncontrollable.**