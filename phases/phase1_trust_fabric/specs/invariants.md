

# Phase 1 — Trust Fabric Invariants (Provability Guarantees)

These invariants define the non-negotiable guarantees of the Trust Fabric Engine™.
They are constrained by Phase 0 constitutional invariants and apply to every Trust Fabric component.

If any invariant below is violated, Trust Fabric is considered **invalid**, and downstream phases must not proceed.

---

## TF-INV-0101 — Provenance Is Mandatory

**Rule**  
Every non-trivial decision output MUST generate a provenance record.

**Non-trivial includes**
- Any recommendation that could influence action
- Any classification, scoring, or risk assessment
- Any output used as an input to execution planning

**Validation**
- Unit tests must fail if a decision is emitted without provenance
- Interfaces must require provenance emission by contract

---

## TF-INV-0102 — Provenance Must Be Inspectable

**Rule**  
Provenance MUST be:
- Human-readable (summary)
- Machine-verifiable (structured)
- Navigable end-to-end

**Validation**
- Each record has a deterministic ID
- Each record supports trace traversal from output → inputs

---

## TF-INV-0103 — Evidence Anchoring Required

**Rule**  
Non-trivial decisions MUST reference evidence sources with:
- Source identity
- Timestamp
- Integrity metadata (hash or checksum where applicable)

**Validation**
- Missing evidence references triggers refusal or downgrade
- Audit logs include evidence links

---

## TF-INV-0104 — Refusal Is a First-Class Success State

**Rule**  
The system MUST refuse when:
- Evidence coverage is insufficient
- Confidence is below threshold
- Input conflict is unresolved

Refusal MUST be explicit and auditable.

**Validation**
- Refusal paths are tested
- Refusal emits provenance and audit events

---

## TF-INV-0105 — No Execution in Trust Fabric

**Rule**  
Trust Fabric MUST NOT perform any state-changing execution.

**Rationale**  
Trust Fabric proves decisions; it does not act.

**Validation**
- No execution dependencies imported
- No side-effecting calls exist in this phase

---

## TF-INV-0106 — Audit Events Are Immutable & Complete

**Rule**  
All Trust Fabric outputs MUST generate structured audit events that are:
- Append-only
- Tamper-evident
- Complete enough for external audit

**Validation**
- Missing audit sinks must fail closed
- Event schema validation is mandatory

---

## TF-INV-0107 — Determinism of Identifiers

**Rule**  
Provenance and audit record IDs MUST be deterministic given the same inputs and version.

**Validation**
- Same inputs produce the same IDs in tests
- Version changes produce new IDs predictably

---

## TF-INV-0108 — No Post-hoc Justification

**Rule**  
The system MUST NOT fabricate reasoning after output is produced.

All provenance must be captured during decision formation.

**Validation**
- Provenance capture occurs before output emission
- Logs contain timestamps and ordering checks

---

## TF-INV-0109 — Phase 0 Compliance Is Enforced

**Rule**  
Trust Fabric MUST enforce:
- Separation of intelligence and execution (INV-0001)
- Mandatory auditability (INV-0002)
- Human intent supremacy (INV-0005)

**Validation**
- Compliance checks exist in CI
- ADRs must reference Phase 0 invariants explicitly

---

## Enforcement Summary

- All invariants are mandatory and enforceable
- Violations block downstream phases
- No exceptions, no bypasses, no silent degradation

---

**Trust Fabric converts intelligence into accountable truth.**