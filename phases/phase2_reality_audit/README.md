# Phase 2 — Reality Audit AI™ (Truth Verification Layer)

Phase 2 ensures that **all inputs, assumptions, and world-state representations**
used by EraIn are grounded in **verifiable reality**, not narratives, claims, or single-source assertions.

Nothing in this phase may violate:
- Phase 0 constitutional invariants
- Phase 1 Trust Fabric guarantees

---

## Purpose

Trust Fabric proves *how* a decision was made.  
Reality Audit proves *whether the underlying reality is actually true*.

Phase 2 exists to answer one question rigorously:

> “Is the world really like this right now?”

---

## Mandatory Dependencies

Phase 2 explicitly depends on:

### From Phase 0
- INV-0001 — Intelligence–Execution Separation
- INV-0002 — Mandatory Auditability
- INV-0006 — Longevity as First-Class Constraint

### From Phase 1
- Trust Fabric provenance
- Evidence anchoring
- Audit contracts
- Refusal semantics

Reality Audit MUST NOT accept inputs that bypass Trust Fabric.

---

## Scope

### Included
- Multi-source data reconciliation
- Cross-source contradiction detection
- Temporal consistency checks
- Constraint validation (physical, legal, financial)
- Reality Confidence Index (RCI) computation
- Verified State Snapshot generation

### Explicitly Excluded
- Decision-making
- Optimization
- Execution
- Policy enforcement
- Industry-specific business logic

Reality Audit verifies **state**, not **intent**.

---

## Core Systems

### 1. Multi-Source Reconciliation Engine
- Compares independent data sources
- Detects agreement, conflict, and gaps
- Assigns confidence based on corroboration

### 2. Constraint Validation Engine
Validates state against:
- Physical constraints (physics, capacity, limits)
- Legal constraints (laws, regulations)
- Financial constraints (balances, budgets)
- Temporal constraints (ordering, freshness)

Impossible states are rejected.

---

### 3. Temporal Consistency Analyzer
- Detects stale, out-of-order, or regressive data
- Ensures time-aware reasoning
- Flags reality drift over time

---

### 4. Reality Confidence Index (RCI)
Produces a normalized confidence score for a given state, based on:
- Source diversity
- Evidence freshness
- Constraint satisfaction
- Conflict resolution quality

Low RCI MUST propagate as refusal or downgrade.

---

### 5. Verified State Snapshot
Outputs a canonical, audited snapshot of reality:
- Inputs
- Constraints
- Confidence
- Timestamp
- Provenance links

All downstream phases must reference this snapshot, not raw data.

---

## Failure Modes Addressed

Phase 2 prevents:

- Single-source truth failures
- Stale or replayed reality
- Legally or physically impossible assumptions
- Hidden contradictions
- Overconfident decisions based on weak inputs

If reality cannot be verified, **EraIn must refuse to proceed**.

---

## Folder Structure

- `schemas/`
  - Verified state snapshot schema
  - Constraint result schema
  - RCI output schema

- `specs/`
  - Reconciliation rules
  - Constraint catalogs
  - Temporal consistency rules
  - RCI scoring model

- `adr/`
  - Reality modeling decisions
  - Constraint interpretation trade-offs

---

## Acceptance Criteria (Preview)

Phase 2 may be considered complete only when:
- All inputs are Trust-Fabric-verified
- Contradictions are explicitly detected and handled
- RCI is computed and propagated
- Impossible states are rejected
- Verified State Snapshots are auditable and immutable

Formal criteria are defined in `specs/acceptance.md`.

---

## Locking Intent

Phase 2 will be lockable once:
- Truth verification rules are explicit
- Failure modes are exhaustively enumerated
- RCI semantics are stable
- Phase 0 and Phase 1 compliance is provable

Once locked, Reality Audit rules become non-negotiable for all downstream phases.

---

**Reality Audit AI™ prevents EraIn from reasoning about fiction.**  
Truth is a prerequisite for intelligence.
