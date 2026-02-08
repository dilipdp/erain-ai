

# Phase 2 — Reality Audit Invariants (Truth Verification Guarantees)

These invariants define the **non-negotiable guarantees** of Reality Audit AI™.
They ensure that EraIn reasons only on **verified, consistent, and constraint-valid reality**.

All invariants below are constrained by:
- Phase 0 constitutional invariants
- Phase 1 Trust Fabric invariants

If any invariant is violated, Reality Audit is considered **invalid** and downstream phases MUST NOT proceed.

---

## RA-INV-0201 — Trust-Fabric-Gated Inputs Only

**Rule**  
Reality Audit MUST accept inputs only if they are:
- Provenance-verified
- Evidence-anchored
- Audited by Trust Fabric

**Prevents**
- Untraceable or unaudited reality assumptions
- Bypassing Trust Fabric safeguards

**Validation**
- Input interfaces require Trust Fabric provenance IDs
- CI rejects any direct/raw input paths

---

## RA-INV-0202 — Multi-Source Verification Required

**Rule**  
Critical state assertions MUST be corroborated by multiple independent sources,
unless explicitly marked as single-source with downgraded confidence.

**Prevents**
- Single-source truth failures
- Overconfidence from weak evidence

**Validation**
- Reconciliation engine enforces source-count rules
- RCI penalizes low source diversity

---

## RA-INV-0203 — Contradictions Must Be Explicit

**Rule**  
Conflicting inputs MUST NOT be silently resolved.

All contradictions must be:
- Detected
- Explicitly represented
- Reflected in confidence scoring

**Prevents**
- Hidden inconsistency
- Arbitrary resolution

**Validation**
- Conflict objects emitted in verified state
- Tests ensure conflicts propagate to RCI

---

## RA-INV-0204 — Temporal Consistency Is Mandatory

**Rule**  
Reality state MUST be temporally consistent and freshness-aware.

Stale, regressive, or replayed data MUST be flagged or rejected.

**Prevents**
- Acting on outdated reality
- Time-based inconsistencies

**Validation**
- Timestamp ordering checks
- Freshness thresholds enforced in specs

---

## RA-INV-0205 — Constraint-Valid States Only

**Rule**  
Reality Audit MUST reject any state that violates:
- Physical constraints
- Legal constraints
- Financial constraints
- Temporal constraints

Impossible states MUST NOT propagate.

**Prevents**
- Physically impossible plans
- Legally invalid assumptions

**Validation**
- Constraint engine rejects invalid states
- Rejection is auditable and explicit

---

## RA-INV-0206 — Reality Confidence Index (RCI) Is Mandatory

**Rule**  
Every verified state MUST emit a Reality Confidence Index (RCI).

Low RCI MUST:
- Downgrade downstream confidence
- Or force refusal

**Prevents**
- False certainty
- Silent risk propagation

**Validation**
- RCI field is mandatory in state schema
- CI fails if RCI is missing or ignored

---

## RA-INV-0207 — Verified State Snapshot Is Canonical

**Rule**  
Downstream phases MUST consume **Verified State Snapshots**, not raw inputs.

Raw data MUST NOT leak beyond Reality Audit.

**Prevents**
- Inconsistent world models
- Reprocessing of unverified data

**Validation**
- Interfaces accept only snapshot IDs
- Static analysis blocks raw data usage

---

## RA-INV-0208 — No Decisions or Execution in Reality Audit

**Rule**  
Reality Audit MUST NOT:
- Make decisions
- Optimize outcomes
- Execute actions

It verifies **state only**.

**Prevents**
- Role confusion
- Constitutional violations

**Validation**
- No decision/execution dependencies
- Architectural reviews enforce separation

---

## RA-INV-0209 — Full Auditability of Reality Checks

**Rule**  
All reconciliation, contradiction detection, constraint validation, and RCI computation
MUST emit audit events.

**Prevents**
- Invisible truth manipulation
- Non-reproducible state verification

**Validation**
- Audit events exist for each verification step
- Missing events cause fail-closed behavior

---

## Enforcement Summary

- All invariants are mandatory and enforceable
- Violations block downstream phases
- No exceptions, no silent degradation

---

**Reality Audit ensures EraIn never reasons about fiction.**
Truth is enforced, not assumed.