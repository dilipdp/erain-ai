# ROI Ledger Model™ — Financial Attribution Backbone

## 1. Purpose

The ROI Ledger Model™ is the financial truth layer of EraIn.
It connects:

Leakage → Root Cause → Action → Owner → Timeline → Measured Impact → Sustained Gain.

Without this ledger, improvements feel anecdotal.
With this ledger, impact becomes provable, repeatable, and board-ready.

---

## 2. Core Principle

We do not say “performance improved.”
We record:

• What changed
• Why it changed
• Who owned it
• When it changed
• How much money moved
• Whether it sustained

If it cannot be attributed, it is not counted.

---

## 3. Ledger Architecture

Each impact entry contains:

### A. Baseline Snapshot
- Metric name
- Pre-intervention value
- Measurement window
- Financial translation logic

Example:
- Downtime: 18%
- Revenue per hour: ₹2,40,000
- Baseline loss/month: ₹43,20,000


### B. Intervention Record
- Root cause ID (linked to root-cause register)
- Action ID (linked to execution tracker)
- Owner
- Start date
- Completion date
- Governance checkpoint


### C. Post-Change Measurement
- New metric value
- Measurement window
- Variance vs baseline
- Validation source (ERP / system / signed review)


### D. Financial Attribution
- Direct recovery
- Indirect recovery
- One-time benefit
- Recurring monthly benefit
- Confidence score (High / Medium / Conservative)


### E. Sustainability Validation
- 30-day hold
- 60-day hold
- 90-day hold
- Control mechanism installed? (Yes/No)

Impact is only marked "Banked" after 60–90 day validation.

---

## 4. Impact Categories

Every ROI entry must fall into one of these:

1. Revenue Recovery
2. Cost Elimination
3. Cost Avoidance
4. Working Capital Release
5. Risk Reduction (probability-weighted)
6. Productivity Unlock
7. Throughput Expansion

This prevents inflated claims.

---

## 5. Ledger Math Discipline

### Rule 1 — No Double Counting
If one action improves multiple metrics, attribution must be split or assigned to a primary driver.

### Rule 2 — Conservative First
When uncertainty exists, choose the lower bound.

### Rule 3 — Attribution Window
Impact must be measured within a defined window.

### Rule 4 — Proof Source Required
Every number must reference:
- ERP export
- Finance validation
- Signed CXO confirmation
- System log snapshot

No source → no credit.

---

## 6. ROI Ledger Table Structure

---

### 6A. Master Ledger Schema (Expanded)

| Entry ID | Industry | Function | Leakage ID | Root Cause ID | Action ID | Owner | Baseline Metric | Baseline Value | Target Value | Financial Logic | Start Date | Completion Date | Validation Source | Monthly Impact (₹/$) | One-Time Impact | Risk-Weighted Impact | Sustainability Status | Confidence | Status |

Status values:
- Identified
- Approved
- In Progress
- Validating
- Banked
- Partially Sustained
- Reversed

Sustainability Status:
- 30-Day Hold
- 60-Day Hold
- 90-Day Locked
- Control Installed

---

### 6B. Financial Calculation Formula Standard

Every entry must clearly define:

Financial Impact = (Baseline – Post-Change) × Financial Conversion Factor

Examples:

Manufacturing Downtime:
Impact = (Downtime% Reduction × Available Production Hours × Revenue per Hour)

Inventory Release:
Impact = (Inventory Reduction × Cost of Capital % / 12)

Cost Elimination:
Impact = (Monthly Cost Before – Monthly Cost After)

Risk Reduction:
Impact = (Probability Before – Probability After) × Financial Exposure

All math must be documented in the "Financial Logic" column.

No hidden calculations.

---

## 7. Executive Summary Layer

At leadership level, the ledger rolls up into:

• Total Monthly Recovery
• Total One-Time Gain
• ROI Multiple vs Engagement Cost
• Time-to-Payback
• % Actions Sustained
• Risk-Weighted Impact

This becomes board-ready evidence.

---

### 7A. Board-Level ROI Dashboard Structure

Executive roll-up must show:

1. Total Monthly Recurring Recovery
2. Total One-Time Gains
3. Cumulative Impact Since Engagement Start
4. Engagement Cost vs Banked Impact
5. Payback Period (Months)
6. Risk-Weighted Conservative Impact
7. % Sustained at 90 Days
8. % Actions Completed On Time

Dashboard Rule:
Only "Banked" entries are counted in headline ROI.

---

## 8. Linking Model (System Architecture)

The ROI Ledger links to:

- LEAKAGE_LIBRARY.md
- ROOT_CAUSE_REGISTRY.md
- EXECUTION_DISCIPLINE_MODEL.md
- KPI_LIBRARY.md
- Engagement Tracker

The ledger is not standalone.
It is the financial spine of the execution system.

---

## 9. Industry Adaptation

The structure remains identical across:

- Manufacturing
- Logistics
- Services
- Solar / EPC
- Retail
- Healthcare
- Public Sector

Only the metric definitions change.

The math discipline never changes.

---

## 10. Definition of “Proven ROI” in EraIn

ROI is considered proven when:

1. Metric change is measured
2. Financial translation is validated
3. Owner signs off
4. 60-day sustainability confirmed
5. Finance acknowledges benefit

Only then can it be used in case studies.

---

### 10A. ROI Approval Protocol

Before marking “Banked”:

Step 1 — Metric Change Confirmed (Data Extract Attached)
Step 2 — Financial Translation Validated (Formula Transparent)
Step 3 — Functional Owner Sign-Off
Step 4 — Finance Acknowledgment
Step 5 — 60-Day Sustainability Validation

Only after all five steps → Status = Banked.

---

## 11. Why This Model Exists

Most consulting fails because:

• Improvements are not tied to money
• Actions are not tied to owners
• Benefits are not sustained
• Attribution is unclear

The ROI Ledger prevents all four.

It turns improvement into financial memory.

---

## 12. What This Enables

With a mature ledger, EraIn can:

• Show compounding impact over quarters
• Predict ROI of future interventions
• Build industry benchmarks
• Create AI-driven recovery forecasting
• Prove superiority with data, not marketing

---

## 13. Ledger Governance Rules

1. Ledger Owner: Engagement Lead
2. Finance Validator: Client Finance Head
3. Update Cadence: Weekly during Pro Audit / Monthly in OpsMind
4. Audit Trail: Every entry versioned
5. Reversal Protocol:
   - If metric regresses → Status = Reversed
   - Impact removed from headline ROI
   - Root cause re-opened

The ledger is a living financial system, not a presentation slide.

---

Status: Internal Backbone — Mandatory in every Pro Audit and OpsMind engagement.
