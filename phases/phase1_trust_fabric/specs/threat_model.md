

# Phase 1 — Trust Fabric Threat Model (Provability Layer)

This threat model focuses on **attacks against truth, proof, and trust**.
It is scoped specifically to Phase 1 — Trust Fabric Engine™ and is constrained by Phase 0 constitutional rules.

The goal is simple:
> Ensure EraIn can never *appear* trustworthy while being unprovable.

---

## Assets to Protect

### A1 — Decision Truth
- Correctness of decision outputs
- Integrity of reasoning and assumptions

### A2 — Provenance Integrity
- Completeness of provenance graphs
- Correct ordering of reasoning steps
- Immutability after emission

### A3 — Evidence Authenticity
- Accuracy of referenced evidence
- Integrity of source metadata
- Resistance to spoofed or stale inputs

### A4 — Audit Trail Integrity
- Completeness of audit events
- Hash-chain continuity
- Replay verifiability

---

## Threat Actors

### TA1 — Malicious Insider
Attempts to:
- Suppress audit events
- Modify provenance after the fact
- Bypass refusal logic

### TA2 — External Adversary
Attempts to:
- Inject fake evidence
- Replay or reorder provenance
- Cause false confidence inflation

### TA3 — Systemic / Accidental Faults
Includes:
- Partial system failures
- Race conditions
- Logging sink outages

### TA4 — Optimization Pressure
Includes:
- Performance shortcuts
- “Log later” or “best-effort audit” attempts
- Pressure to suppress refusals

---

## Threat Scenarios & Mitigations

### TF-TS-01 — Provenance Suppression
**Scenario**  
A decision is emitted without full provenance.

**Impact**  
Unprovable output; silent trust erosion.

**Mitigation**
- TF-INV-0101 enforced by contract
- CI tests failing on missing provenance
- Decision interfaces require provenance objects

---

### TF-TS-02 — Post-hoc Provenance Fabrication
**Scenario**  
Reasoning is reconstructed after output emission.

**Impact**  
False appearance of rigor.

**Mitigation**
- TF-INV-0108 (No post-hoc justification)
- Timestamp ordering checks
- Audit events written before completion

---

### TF-TS-03 — Evidence Spoofing or Staleness
**Scenario**  
Fake, stale, or manipulated evidence is linked.

**Impact**  
Decisions grounded in false reality.

**Mitigation**
- TF-INV-0103 (Evidence anchoring)
- Integrity metadata checks
- Evidence decay awareness + refusal

---

### TF-TS-04 — Audit Chain Break
**Scenario**  
Audit events are missing, reordered, or tampered with.

**Impact**  
Audit trail invalidation.

**Mitigation**
- Mandatory hash chaining
- Fail-closed on audit sink failure
- External verification support

---

### TF-TS-05 — Refusal Suppression
**Scenario**  
System forces a decision when it should refuse.

**Impact**  
Unsafe certainty; downstream damage.

**Mitigation**
- TF-INV-0104 (Refusal as success)
- Explicit refusal events
- Tests for low-confidence paths

---

### TF-TS-06 — Execution Leakage
**Scenario**  
State-changing logic appears inside Trust Fabric.

**Impact**  
Constitutional violation; unsafe coupling.

**Mitigation**
- TF-INV-0105 (No execution)
- Dependency scanning
- Architectural reviews

---

## Residual Risk

Trust Fabric assumes:
- Cryptographic primitives remain secure
- Determinism is correctly implemented

Residual risk is addressed via:
- Defense in depth
- Continuous verification
- Human auditability

---

## Review & Evolution Rules

- This threat model is lockable with Phase 1
- New threats may be added, never removed
- All changes require ADRs
- Phase 0 invariants always take precedence

---

**Trust Fabric exists to make lying impossible — not just unlikely.**