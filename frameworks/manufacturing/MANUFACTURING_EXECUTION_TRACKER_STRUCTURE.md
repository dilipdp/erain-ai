

# MANUFACTURING EXECUTION TRACKER STRUCTURE
Version: 1.0  
Purpose: Define the operational control system behind the Manufacturing Audit  
Classification: Internal – Governance Critical  

---

# OVERVIEW

This document defines the structure of the Excel / Data Tracker used to control execution after audit findings are identified.

The tracker is NOT a spreadsheet for reporting.
It is the execution engine.

Every leakage identified in the audit must map to:
• A KPI  
• A financial value  
• An owner  
• A timeline  
• A validation checkpoint  

If it is not tracked → it does not improve.

---

# TRACKER ARCHITECTURE (6 CORE SHEETS)

---

## SHEET 1 — KPI_DASHBOARD

Purpose:
Live snapshot of operational health.

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
- OEE
- Scrap %
- Downtime Hours
- Reactive Maintenance %
- Inventory Days
- Throughput per Shift

Rule:
Dashboard must auto-pull from source sheets.
No manual manipulation allowed.

---

## SHEET 2 — LEAKAGE_REGISTER

Purpose:
Master list of all quantified leakages.

Columns:
- Leakage ID
- Category (Downtime / Scrap / Inventory / etc.)
- Description
- Root Cause Layer 1–5
- Annual Financial Impact (₹)
- Recoverable %
- Priority (High / Medium / Low)
- Assigned Owner
- Status
- Target Closure Date

Rule:
Every leakage must have financial quantification.
No qualitative-only entries allowed.

---

## SHEET 3 — ACTION_TRACKER

Purpose:
Control execution discipline.

Columns:
- Action ID
- Linked Leakage ID
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
No leakage without at least 1 action.
No action without an owner.

---

## SHEET 4 — ROOT_CAUSE_LOG

Purpose:
Maintain defensible analysis.

Columns:
- Incident ID
- Date
- Event Type
- Description
- Root Cause Layer 1–5
- Evidence Source
- Preventive Action Defined (Y/N)
- Verified By
- Verification Date

Rule:
Root cause must go minimum 3 layers deep.
Preferably 5.

---

## SHEET 5 — ROI_TRACKER

Purpose:
Prove financial improvement.

Columns:
- Leakage ID
- Baseline Value
- Current Value
- Improvement %
- Monthly Financial Gain (₹)
- Cumulative Gain (₹)
- Validated By Finance (Y/N)
- Validation Date

Rule:
Finance validation required before reporting ROI externally.

---

## SHEET 6 — RISK_REGISTER

Purpose:
Protect delivery.

Columns:
- Risk ID
- Description
- Probability (1–5)
- Impact (1–5)
- Risk Score
- Owner
- Mitigation Plan
- Status
- Escalation Level

Rule:
Any risk score ≥ 16 requires executive visibility.

---

# GOVERNANCE CONNECTION

Weekly:
• KPI Review
• Action Status
• Risk Escalation

Monthly:
• ROI Validation
• Leakage Reduction Review
• LPI Recalculation

Quarterly:
• Maturity Assessment
• Strategy Adjustment

---

# CONTROL PRINCIPLES

1. No hidden formulas.
2. No manual overrides without audit note.
3. Every number must trace back to a source.
4. Financial logic must be reproducible.
5. Owner accountability is non-negotiable.

---

# MATURITY LEVELS

Level 1 — Data exists but unmanaged  
Level 2 — Leakage identified  
Level 3 — Actions tracked  
Level 4 — ROI validated  
Level 5 — Governance institutionalized  

Manufacturing engagement is considered stable only at Level 4+.

---

# INTERNAL VALIDATION CHECK

[ ] All sheets connected logically  
[ ] Financial impact formulas tested  
[ ] No circular references  
[ ] Owner mapping verified  
[ ] Escalation logic tested  

---

This tracker is the backbone of execution.
Without it, audit is storytelling.

With it, audit becomes controlled transformation.

END OF DOCUMENT