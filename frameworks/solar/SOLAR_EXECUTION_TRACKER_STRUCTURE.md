

# SOLAR EXECUTION TRACKER STRUCTURE
Version: 1.0  
Purpose: Define the operational control system behind the Solar Audit  
Classification: Internal – Governance Critical  

---

# OVERVIEW

This tracker converts solar audit findings into controlled execution.

It connects:

SCADA → KPI → Financial Attribution → Action → ROI Validation → Governance

If it is not tracked → it does not improve.

Every identified solar leakage must map to:
• A technical metric  
• A financial value  
• An accountable owner  
• A recovery timeline  
• A validation checkpoint  

---

# TRACKER ARCHITECTURE (6 CORE SHEETS)

---

## SHEET 1 — KPI_DASHBOARD

Purpose:
Live operational and financial health snapshot.

Columns:
- KPI Name
- Current Value
- Target Value
- Gap
- Financial Impact (₹)
- Owner
- Status (Green / Amber / Red)
- Last Updated
- Notes

Mandatory KPIs:
- PR (Weather Normalized)
- CUF
- Specific Yield
- Inverter Availability
- Unplanned Downtime Hours
- Grid Downtime Hours
- Cleaning Compliance %
- Preventive Maintenance %
- Revenue per kWh
- O&M Cost per MW

Rule:
PR must be weather-normalized before gap calculation.

---

## SHEET 2 — LOSS_REGISTER

Purpose:
Master quantified solar leakage list.

Columns:
- Loss ID
- Category (PR / Downtime / Soiling / Grid / Design / Vendor)
- Description
- Root Cause Layer 1–5
- Annual Financial Impact (₹)
- Recoverable %
- Priority (High / Medium / Low)
- Assigned Owner
- Status
- Target Closure Date

Rule:
No loss entry without financial quantification.
No duplicate counting between PR and Downtime.

---

## SHEET 3 — ACTION_TRACKER

Purpose:
Execution discipline control.

Columns:
- Action ID
- Linked Loss ID
- Description
- Owner
- Start Date
- Due Date
- Current Status
- % Completion
- Risk Level
- Escalation Required (Y/N)
- Financial Impact Linked

Rule:
No loss without action.
No action without named owner.

---

## SHEET 4 — ROOT_CAUSE_LOG

Purpose:
Maintain defensible technical analysis.

Columns:
- Incident ID
- Date
- Event Type (Inverter / Transformer / Cleaning / etc.)
- Description
- Root Cause Layer 1–5
- Evidence Source (SCADA / Site Visit / Vendor Report)
- Preventive Action Defined (Y/N)
- Verified By
- Verification Date

Rule:
Root cause must go minimum 3 layers deep.
Prefer 5-layer analysis for repeat failures.

---

## SHEET 5 — ROI_TRACKER

Purpose:
Validate financial recovery.

Columns:
- Loss ID
- Baseline Generation / KPI
- Current Generation / KPI
- Improvement %
- Monthly Financial Gain (₹)
- Cumulative Gain (₹)
- Finance Validated (Y/N)
- Validation Date

Rule:
Weather-normalization mandatory before reporting PR recovery.
Finance validation required before external reporting.

---

## SHEET 6 — RISK_REGISTER

Purpose:
Protect plant performance and engagement delivery.

Columns:
- Risk ID
- Description
- Category (Technical / Financial / Regulatory / Vendor)
- Probability (1–5)
- Impact (1–5)
- Risk Score
- Owner
- Mitigation Plan
- Status
- Escalation Level

Rule:
Risk Score ≥ 16 requires executive review.

---

# GOVERNANCE CONNECTION

Weekly:
• Generation variance review  
• Downtime analysis  
• Action tracker review  

Monthly:
• PR trend validation  
• Financial reconciliation  
• Vendor performance review  

Quarterly:
• Strategic optimization review  
• Equipment benchmarking  
• ROI validation checkpoint  

---

# CONTROL PRINCIPLES

1. Weather normalization before financial calculation.
2. No overlapping PR and downtime double counting.
3. Every number traceable to SCADA or financial ledger.
4. No manual overrides without audit log.
5. Owner accountability enforced.

---

# MATURITY LEVELS

Level 1 — Monitoring only  
Level 2 — KPI tracking  
Level 3 — Root cause discipline  
Level 4 — Financial attribution  
Level 5 — Institutionalized governance  

Solar plant considered stabilized only at Level 4+.

---

# INTERNAL VALIDATION CHECK

[ ] SCADA data validated  
[ ] Irradiance normalization confirmed  
[ ] Financial impact reconciled with tariff  
[ ] No circular financial logic  
[ ] Owner mapping complete  
[ ] Escalation logic tested  

---

This tracker transforms solar audits into measurable financial recovery.

Without it, PR discussions remain theoretical.
With it, recovery becomes controlled and defensible.

END OF DOCUMENT