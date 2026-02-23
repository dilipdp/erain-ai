

# ERAIN — MASTER FORMULA REGISTRY (MFR)

Version: v1.0 (Global Financial Logic Lock)
Owner: Founder
Linked Systems:
- KPI_LIBRARY v2.1
- UNIVERSAL_ROI_ENGINE v2.0
- CLIENT_COMMAND_TRACKER v2.2
- EXECUTION_HEALTH_MODEL v2.0

Status: LOCKED — Financial Calculation Authority

---

# 0. PURPOSE

No financial number in EraIn may exist without a registered Formula_ID.

If a number does not reference:
• Formula_ID
• Variable Definitions
• Unit Standard
• Assumption Source
• Sensitivity Range

It is invalid.

This document prevents Excel improvisation.

---

# 1. REGISTRY STRUCTURE

Each formula must include:

• Formula_ID
• Formula Name
• Business Domain
• Formula Expression
• Variable Definitions
• Unit Output
• Sensitivity Variables
• Assumption Source
• Linked KPI_ID (if applicable)
• Leakage Category
• Attribution Eligibility
• Version
• Last Reviewed Date

---

# 2. CORE UNIVERSAL FORMULAS

---

## F-001 — Revenue Growth Rate

Formula_ID: F-001
Expression:
(Current Snapshot Revenue − Previous Snapshot Revenue) / Previous Snapshot Revenue

Output Unit: %
Linked KPI: Revenue Growth Rate
Leakage Category: Revenue Leakage
Attribution Eligibility: Level 2+

---

## F-002 — Gross Margin Impact

Formula_ID: F-002
Expression:
(Target Margin − Actual Margin) × Revenue

Output Unit: ₹ / $
Linked KPI: Gross Margin %
Leakage Category: Cost + Revenue Leakage
Attribution Eligibility: Level 3+

---

## F-003 — Downtime Financial Loss

Formula_ID: F-003
Expression:
Downtime Hours × Output per Hour × Contribution Margin

Output Unit: ₹ / $
Linked KPI: Downtime %
Leakage Category: Time + Cost Leakage
Attribution Eligibility: Level 3+

Sensitivity Variables:
• Demand stability
• Capacity utilization

---

## F-004 — Scrap Loss

Formula_ID: F-004
Expression:
Scrap Units × Cost per Unit

Output Unit: ₹ / $
Linked KPI: Scrap %
Leakage Category: Quality Leakage
Attribution Eligibility: Level 3+

---

## F-005 — Capacity Unlock Value

Formula_ID: F-005
Expression:
Cycle Time Reduction × Volume × Contribution Margin

Output Unit: ₹ / $
Linked KPI: Cycle Time
Leakage Category: Time Leakage
Attribution Eligibility: Level 3+

---

## F-006 — Working Capital Benefit

Formula_ID: F-006
Expression:
Working Capital Reduction × Cost of Capital

Output Unit: ₹ / $
Linked KPI: Cash Conversion Cycle
Leakage Category: Cash Leakage
Attribution Eligibility: Level 3+

---

## F-007 — Risk Reduction Value

Formula_ID: F-007
Expression:
(Old Probability − New Probability) × Financial Exposure

Output Unit: ₹ / $
Linked KPI: Control Failure Rate
Leakage Category: Risk Leakage
Attribution Eligibility: Level 3+

---

## F-008 — Revenue Recovery (Churn)

Formula_ID: F-008
Expression:
Churn Reduction × Avg Revenue per Client × Gross Margin %

Output Unit: ₹ / $
Linked KPI: Churn %
Leakage Category: Revenue Leakage
Attribution Eligibility: Level 3+

---

## F-009 — Missed Billing Recovery

Formula_ID: F-009
Expression:
Unbilled Units × Billing Rate × Gross Margin %

Output Unit: ₹ / $
Linked KPI: Revenue Leakage %
Leakage Category: Revenue Leakage
Attribution Eligibility: Level 3+

---

## F-010 — ROI %

Formula_ID: F-010
Expression:
(Recovered Value − EraIn Fee) / EraIn Fee × 100

Output Unit: %
Linked KPI: ROI %
Leakage Category: Portfolio Impact
Attribution Eligibility: Level 3+

---

## F-011 — Payback Period

Formula_ID: F-011
Expression:
EraIn Fee / Monthly Recovered Value

Output Unit: Months
Linked KPI: Payback Period
Leakage Category: Portfolio Impact
Attribution Eligibility: Level 3+

---

# 3. FORMULA CONTROL RULES

1. No editing of formula logic without version increment.
2. Any formula modification requires:
   • Variable audit
   • Sensitivity re-evaluation
   • Founder approval
3. Industry-specific formulas must reference parent universal formula where applicable.
4. All ROI decks must show Formula_ID under each quantified line.

---

# 4. INDUSTRY EXTENSION RULE

Manufacturing, Solar, Logistics, Services packs may:

• Add new Formula_IDs (F-100+ range)
• Must reference universal formula when derivative
• Must define sensitivity model
• Must define attribution eligibility

Example:
F-101 — OEE Loss Impact (Derived from F-003)

---

# 5. VERSION GOVERNANCE

Version Format:
Major.Minor

v1.0 → Foundational Registry
v1.1 → Variable refinement
v2.0 → Structural expansion

No silent edits allowed.

---

# 6. AUDIT TRAIL REQUIREMENT

Every ROI model must log:

• Formula_ID
• Input snapshot
• Variable values
• Output value
• Attribution Level
• Evidence_ID
• Calculation date

Stored in ROI Attribution Ledger.

---

# 7. ABSOLUTE LOCK

If Formula_ID not referenced → ROI claim invalid.

If assumptions undocumented → downgrade Attribution.

If sensitivity ignored → downgrade confidence score.

Financial integrity is non-negotiable.

---

STATUS:
MASTER FORMULA REGISTRY v1.0 — LOCKED
Global Financial Logic Authority Established

Truth → Formula → Impact → Attribution → Proof