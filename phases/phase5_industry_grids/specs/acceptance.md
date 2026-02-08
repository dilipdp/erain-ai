

# Phase 5 — Acceptance Criteria (Industry Intelligence Grids Lock Eligibility)

This document defines the **non-negotiable acceptance criteria**
for Phase 5 — Industry Intelligence Grids™.

Each Industry Grid may be considered **complete and eligible for LOCK INTENT**
only when *all* criteria below are satisfied **for that specific industry**.

Industry Grids are the point where EraIn meets real-world law.
There is no partial acceptance.

---

## Acceptance Criteria

### IG-AC-0501 — Upstream Inheritance Proven
- All Phase 0–4 invariants are inherited and enforced
- No governance, safety, or audit guarantees are weakened
- Attempts to override upstream rules are refused

---

### IG-AC-0502 — Industry Law Explicit & Enforced
- All applicable laws and regulations are:
  - explicitly documented
  - versioned
  - machine-enforceable
- Missing or ambiguous regulations force refusal or escalation

---

### IG-AC-0503 — Industry-Specific Reality Modeling
- Reality Audit includes:
  - technical constraints
  - legal constraints
  - environmental constraints (if applicable)
  - economic feasibility constraints
- Generic reality models are not accepted

---

### IG-AC-0504 — Risk & Failure Models Complete
- Common failure modes are defined
- Catastrophic failure modes are defined
- Regulatory failure scenarios are defined
- Unknown or unmodeled risks force refusal

---

### IG-AC-0505 — Compliance Before Optimization Proven
- Compliance checks always execute before optimization
- No cost, speed, or efficiency logic bypasses compliance
- Violations result in refusal, not warnings

---

### IG-AC-0506 — Human Escalation Enforced
- Legal ambiguity escalates to humans
- Safety risk escalates to humans
- Regulatory interpretation escalates to humans
- Escalation paths are tested and auditable

---

### IG-AC-0507 — Industry Audit Contract Implemented
- All mandatory industry audit events are emitted
- Events include regulation references and rule IDs
- Audit sinks are fail-closed
- Audit replay reconstructs compliance history

---

### IG-AC-0508 — Cross-Industry Isolation Proven
- Industry identifiers are enforced at runtime
- Rules do not leak across industries
- Cross-industry interaction is OS-mediated only

---

### IG-AC-0509 — Versioning & Evolution Controlled
- Industry grid versions are explicit
- All rule changes are ADR-backed
- Backward compatibility is preserved where possible
- Silent rule changes are impossible

---

### IG-AC-0510 — Refusal on Uncertainty Proven
- Missing law → refusal
- Missing constraint → refusal
- Missing risk model → refusal
- Uncertainty is surfaced, not hidden

---

## Exit Conditions

An Industry Grid may be declared **COMPLETE** only when:
- All IG-AC-0501 → IG-AC-0510 are satisfied
- No TODOs or placeholders exist
- Regulators or auditors can independently validate compliance
- Unsafe or illegal actions are structurally impossible

---

## Locking Declaration

Once an Industry Grid is accepted and lock-intended:
- Its rules become immutable
- It may only evolve via versioned grids
- Any change requires:
  - New ADR
  - Compatibility review
  - Update to `LOCK_MANIFEST.md`

---

**Industry Intelligence Grids™ are accepted only when  
EraIn can operate lawfully inside an industry by default — not by exception.**