# ERAIN AI — DATA INTAKE PROTOCOL  
Version: 2.0  
Status: Constitutional / Mandatory  
Owner: EraIn Core Governance  
Applies To: All engagements (Free Audit → Enterprise)

---

# 0. Constitutional Position

This protocol is a trust firewall.

No client data — structured or unstructured — may be collected unless this protocol is followed in sequence.

Violation of this protocol:
- Damages credibility
- Increases legal risk
- Weakens executive trust
- Invalidates audit integrity

This is mandatory. No shortcuts.

---
# 0.1 Pre-Intake Risk Assessment (Mandatory Before Gate 0)

Before any strategic discussion, EraIn internally evaluates:

- Regulatory exposure risk
- Data sensitivity exposure
- Political / governance risk
- Conflict-of-interest risk
- Litigation risk
- Reputation risk

If engagement risk score exceeds acceptable threshold:
- Engagement is declined
- Or scope is restricted

EraIn does not accept engagements that:
- Involve illegal operations
- Request unethical data use
- Create regulatory violation exposure
- Require bypassing controls

# 1. Purpose

This document defines:

- What data EraIn collects
- What we explicitly refuse to collect
- The exact sequencing of requests
- Security boundaries
- Data-to-impact mapping discipline
- Red‑flag conditions
- Internal readiness requirements before intake

EraIn collects only what maps to measurable impact.

---

# 2. Core Principles

1. Minimal necessary data.
2. Structured extracts > system access.
3. No raw dumps without purpose.
4. Every dataset must map to a KPI.
5. Trust > speed.
6. Executive clarity before technical depth.
7. Never build insight on unverified data.

---

# 3. Engagement Gate Model (No Data Before This)

## Gate 0 — Strategic Alignment

Required before any file request:

- Business model clarity
- Revenue model clarity
- Operating scale (sites, plants, teams)
- Primary pain areas (hypothesis-level)
- Leadership sponsor identified
- NDA status confirmed

If leadership sponsor is unclear → stop.

---

## Gate 1 — Scope Freeze

Must be documented:

- Problem statement (1–2 sentences)
- Target impact window (30 / 60 / 90 days)
- Success metric definition
- Expected executive output format
- Approved dataset list (initial layer only)

Only after scope freeze → data request allowed.

---

# 4. Layered Intake Architecture

Data is collected in layers.  
Never request all layers at once.

---

## Layer 1 — Financial Baseline (Mandatory First)

Purpose: Establish leak direction and impact range.

Requested (high-level only):

- 6–12 month revenue summary
- Cost breakdown (major categories only)
- Monthly P&L summary
- Existing KPI sheet (if any)

Not requested at this stage:

- Bank login access
- Full accounting system access
- Payroll files
- Customer-level PII

Objective:
Detect margin pressure, volatility, anomaly clusters.

---

## Layer 2 — Operational Signals (Selective)

Only request what maps to frozen scope.

### Manufacturing
- Production volume by period
- Downtime logs (categorized)
- Scrap / rework %
- Maintenance records (summary)

### Logistics
- Shipment volume
- SLA breach %
- Fuel / route cost summary
- Vehicle utilization %

### Solar / EPC
- Planned vs actual schedule
- Cost overrun summary
- Vendor payment cycle
- Commissioning lead time

### Services
- Utilization %
- Delivery timeline variance
- Billing cycle time
- Project overrun %

Never request raw ERP export without defined question.

---

## Layer 3 — Ownership & Decision Mapping

Requested:

- Org structure (functional)
- Role-to-KPI ownership mapping
- Approval flow summary
- Escalation protocol

Purpose:
Identify decision fog, owner gaps, approval friction.

---

# 5. Explicit Prohibited Data

EraIn does NOT collect:

- Employee salary-level data (unless directly tied to scope)
- Raw HR personnel files
- Unmasked personal customer PII
- Admin credentials
- Full ERP access on Day 1
- Production passwords
- System write access

We operate on extracts and structured exports.

---

# 6. Data Classification Levels

All incoming data must be labeled:

Level 1 — Aggregated (Low sensitivity)
Level 2 — Operational (Moderate sensitivity)
Level 3 — Financial Detail (High sensitivity)
Level 4 — Confidential / Regulated

Level 3–4 require:

- Encrypted storage
- Restricted access (named team members only)
- No external transmission without sponsor approval

# 6.1 Regulatory Guardrails (Industry-Specific)

Additional constraints apply:

Healthcare:
- No patient PII without masking
- No PHI modeling without compliance review

Finance:
- No transaction-level modeling without sponsor sign-off
- No regulatory filings altered

Public Sector:
- No data outside legally approved boundaries
- No advisory beyond constitutional framework

Manufacturing (Defense / Critical Infra):
- No system topology modeling without approval

---

# 7. Storage & Access Standards

- Structured client directory (no ad‑hoc desktop storage)
- Access restricted to engagement core
- No third‑party forwarding
- Encrypted at rest (if Level 3+)
- Raw files deleted after structured modeling (if contract allows)
- Version control for derived models

# 7.1 Data Retention & Deletion Policy

Default Retention:

- Raw client data: retained only during active engagement
- Structured models: retained only if contractually approved
- Derived artifacts: retained for continuity only with sponsor approval

Upon engagement closure:

- Raw data deleted within 30 days
- Access revoked immediately
- Written confirmation provided upon request

EraIn does not build permanent shadow archives.

---

# 8. Data Quality Validation Protocol

Upon receipt:

Step 1 — Completeness check  
Step 2 — Period consistency check  
Step 3 — Outlier detection  
Step 4 — Reconciliation to financial baseline  
Step 5 — Confidence score assigned

If data confidence < acceptable threshold:
- Flag immediately
- Do not generate executive claims
- Recommend structural correction first

We never build insight on broken data.

# 8.1 Client Data Maturity Scoring

Upon validation, client receives a Data Maturity Score:

Level A — Structured, reconciled, decision-ready  
Level B — Structured but inconsistent  
Level C — Fragmented, manual, risk-prone  
Level D — Non-structured, high error probability  

If Level C/D:
- EraIn may recommend foundational stabilization before execution modeling.

---

# 9. Data-to-Impact Mapping Rule (Mandatory)

Every requested dataset must answer:

1. What decision will this inform?
2. What KPI does it influence?
3. What financial impact range does it affect?
4. Who owns the outcome?

If it answers none → do not request.

---

# 10. Executive Framing Before Collection

Before data intake, client must hear:

"We request only what is necessary.  
We do not need system access.  
We will not disrupt operations.  
We quantify before recommending change.  
You retain full data control."

Trust is reinforced before data transfer.

---

# 11. Red Flag Conditions (Pause Engagement)

Pause immediately if:

- Client insists on unrestricted system access
- Leadership sponsor is disengaged
- No financial baseline exists
- Scope constantly shifts
- Data appears manipulated
- Internal misalignment between stakeholders

Delay is better than damaged credibility.

---

# 12. Internal Readiness Check (EraIn Side)

Before requesting any dataset:

[ ] Scope freeze documented  
[ ] KPI impact hypothesis defined  
[ ] Financial baseline logic prepared  
[ ] Data template prepared (so client doesn’t guess format)  
[ ] Storage structure created  
[ ] Access boundary defined internally  

If these are not ready → do not request data.

---

# 13. Intake Operational Checklist

[ ] NDA signed (if required)  
[ ] Sponsor identified  
[ ] Scope freeze documented  
[ ] Layer 1 list approved  
[ ] Data format clarified  
[ ] Access boundaries defined  
[ ] Executive framing message sent  

---

# 14. Engagement Integrity Clause

EraIn does not:

- Collect data for exploration without hypothesis
- Use client data outside scope
- Share learnings across clients
- Build vanity dashboards without measurable outcome

Every byte collected must support execution and impact.

---

# 15. Outcome Standard

Proper intake ensures:

- Clean modeling
- Faster insight
- Stronger executive credibility
- Lower friction
- Repeatable engagement structure
- Scalable industry-agnostic deployment

This protocol applies to:

Manufacturing  
Logistics  
Solar / EPC  
Services  
Retail  
Healthcare  
Public Sector  
Any real-world execution environment

No exceptions.

---

# 16. Secure Transfer Standards (Mandatory)

Accepted transfer methods:

Level 1–2:
- Password-protected ZIP (separate password channel)
- Encrypted cloud link (time-limited access)

Level 3–4:
- End-to-end encrypted file transfer platform
- Access expiry within 7 days
- Download tracking enabled
- No email attachments

Prohibited transfer methods:
- WhatsApp document sharing
- Personal Gmail forwarding
- Public cloud folders without expiry
- Unencrypted FTP

All Level 3–4 transfers must include:
- Named sender
- Named EraIn recipient
- Data classification label in subject line

Example subject:
[Level 3 – Financial Detail] – March P&L Extract – Client X

---

# 17. AI Usage Disclosure & Boundary

EraIn may use structured modeling and analytical automation tools under strict boundary conditions:

- No client raw data is used to train public AI models
- No cross-client data blending
- No identifiable data leaves secure engagement storage
- Sensitive data is anonymized before modeling where possible

If AI-assisted analysis is used:
- Executive sponsor is informed
- Scope remains within defined engagement boundary

EraIn does not expose client data to open training environments.

---

# 18. Data Processing Agreement (DPA) Readiness

For Level 3–4 engagements:

EraIn must be ready to provide:

- Data Processing Addendum (DPA)
- Access log summary
- Storage architecture overview
- Retention timeline declaration
- Deletion certification process

If client requires additional clauses:
- Legal review required before data transfer
- No informal commitments

Governance > speed.

---

# 19. Intake Template Discipline

EraIn must provide structured templates before requesting data.

Templates include:

- Financial Baseline Extract Template
- Operational KPI Extract Template
- Ownership Mapping Template
- Incident / Downtime Log Template
- SLA Breach Summary Template

Clients should never guess format.

Poor formatting increases error probability and damages modeling accuracy.

If client cannot extract structured data:
- EraIn provides assisted extraction guidance
- Or schedules controlled working session

---

# 20. EraIn Intake Excellence Standard

The intake phase must signal:

Precision  
Calm governance  
Minimal disruption  
High competence  
Zero chaos  

Client reaction should be:

"They know exactly what they are doing."

If intake feels rushed, vague, or overly technical — protocol has failed.

Intake is the first demonstration of execution discipline.

It must feel premium, controlled, and outcome-driven.

---


---

# 21. Structured Intake Timeline (Operational Clock)

Intake must follow controlled sequencing:

Day -3 to 0  → Internal Readiness Check (EraIn side)  
Day 0        → Gate 0 + Gate 1 confirmation  
Day 1        → Layer 1 request sent  
Day 2–4      → Financial baseline review  
Day 5        → Scope refinement (if required)  
Day 6–10     → Layer 2 selective request  
Day 11–14    → Reality + Leakage mapping

No engagement should remain in Intake mode beyond 14 days without executive review.

If data delays exceed 7 working days → sponsor escalation required.

Intake must feel structured, not open‑ended.

---

# 22. Mandatory Data → KPI → Impact Trace Matrix

Before requesting any dataset, this matrix must exist internally:

| Dataset | Linked KPI | Leakage Category | Expected Impact | Owner | Decision Influenced |
|----------|------------|-----------------|----------------|-------|--------------------|

If this table cannot be filled → dataset request is invalid.

This prevents curiosity-driven data collection.

All datasets must map to:

• A KPI (from Universal KPI Library)  
• A leakage category (from AOS)  
• A financial impact band  
• A named owner

If mapping fails → do not request data.

---

# 23. Executive Sponsor Confirmation Block

Before Level 2 or higher data is transferred, sponsor must confirm:

[ ] Scope is frozen  
[ ] Dataset list reviewed  
[ ] Financial impact focus confirmed  
[ ] Access boundaries acknowledged  
[ ] Data classification level understood  

Written confirmation (email acceptable) required.

---

# 24. Intake Operating Lock

This Data Intake Protocol supersedes informal requests.

If urgency pressure conflicts with governance:
Governance wins.

If commercial pressure conflicts with discipline:
Discipline wins.

If sponsor requests shortcuts:
Escalate before proceeding.

Trust is built in Intake.

If Intake fails, the engagement foundation weakens.

---

STATUS: DATA INTAKE PROTOCOL — v2.1 (Constitutional Lock Reinforced)