

# Phase 0 — Foundational Invariants (Constitutional)

This document defines the **non-negotiable, permanent invariants** of EraIn AI.
These invariants are **constitutional** in nature and apply to *all* phases, modules, and future versions.

Violating any invariant below **invalidates the system** and requires a full architectural fork.

---

## INV-0001 — Intelligence–Execution Separation

**Rule**  
Intelligence (reasoning, planning, evaluation) MUST be strictly separated from execution (state-changing actions).

**Rationale**  
Combining reasoning and execution creates:
- Non-auditable actions
- Irreversible failures
- Hidden side effects

**Prevents**
- Prompt-triggered execution
- Model hallucination causing real-world damage

**Validation**
- No execution path may exist without an explicit execution contract
- Static analysis must confirm execution code is unreachable from reasoning layers

---

## INV-0002 — Mandatory Auditability

**Rule**  
Every state-changing action MUST be:
- Logged
- Attributable
- Replayable (or explainably non-replayable)

**Rationale**  
Trust requires proof, not intent.

**Prevents**
- Silent failures
- Undetectable misuse
- Regulatory non-compliance

**Validation**
- All execution emits immutable audit events
- Missing audit logs are treated as critical faults

---

## INV-0003 — Safe Rollback or Containment

**Rule**  
No action may execute unless one of the following exists:
- A defined rollback path, OR
- A defined containment strategy

**Rationale**  
Irreversible actions without containment are unacceptable in real systems.

**Prevents**
- Cascade failures
- Permanent corruption
- Operational dead-ends

**Validation**
- Execution plans must declare rollback/containment metadata
- CI rejects plans without safety declarations

---

## INV-0004 — Model Replaceability

**Rule**  
No invariant, protocol, or execution guarantee may depend on a specific AI model.

**Rationale**  
Models will change. Architecture must not.

**Prevents**
- Vendor lock-in
- System collapse due to model deprecation

**Validation**
- All model interfaces are abstracted
- Swapping models must not change system guarantees

---

## INV-0005 — Human Intent Supremacy

**Rule**  
Human-defined goals, constraints, and overrides ALWAYS supersede machine optimization.

**Rationale**  
Optimization without intent leads to misalignment.

**Prevents**
- Goal drift
- Instrumental convergence
- Autonomous value mutation

**Validation**
- Explicit human override paths exist
- Autonomous loops are bounded and interruptible

---

## INV-0006 — Longevity as a First-Class Constraint

**Rule**  
All architectural decisions MUST consider a minimum 100-year operational horizon.

**Rationale**  
Short-term optimization creates long-term fragility.

**Prevents**
- Trend-driven architecture
- Ephemeral dependency chains

**Validation**
- ADRs must include longevity impact analysis
- Backward compatibility is mandatory by default

---

## Enforcement Summary

- These invariants apply to **every phase**
- Any violation requires:
  - New ADR
  - Versioned phase fork
  - Update to `LOCK_MANIFEST.md`
- CI/CD MUST fail on invariant violation
- No exception paths are allowed

---

**Phase 0 invariants are immutable.**
They are the foundation on which EraIn AI exists.