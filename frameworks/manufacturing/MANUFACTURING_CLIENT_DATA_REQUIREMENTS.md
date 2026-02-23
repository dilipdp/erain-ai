

# MANUFACTURING CLIENT DATA REQUIREMENTS
Version: 1.0  
Purpose: Define minimum data standards before EraIn initiates manufacturing audit  
Classification: Internal – Data Governance Critical  

---

# CORE RULE

EraIn does not accept unstructured data dumps.

We request:
• Defined datasets  
• Defined time windows  
• Defined formats  
• Defined validation owners  

If data quality is weak → we pause intake.

Garbage in → strategic damage out.

---

# 1 — ENGAGEMENT PRE-CONDITION

Before requesting data:

[ ] NDA executed  
[ ] Data handling policy shared  
[ ] Data storage location defined  
[ ] Data access roles documented  
[ ] Time window confirmed (minimum 6–12 months recommended)  
[ ] Client SPOC assigned  

No data collection before these are complete.

---

# 2 — REQUIRED DATA CATEGORIES (MANDATORY)

---

## A. PRODUCTION DATA

Minimum Required:

• Monthly production volume (12 months)  
• Production plan vs actual  
• OEE history (if available)  
• Shift-wise output data  
• Downtime logs (categorized)  
• Capacity details (installed vs utilized)  

Format:
Excel / CSV preferred  
No scanned PDFs  

Validation Owner:
Plant Head / Production Manager  

---

## B. QUALITY DATA

Required:

• Scrap % monthly  
• Rework % monthly  
• Quality rejection reasons  
• Customer return data  
• Warranty claims (if applicable)  

Minimum period:
6–12 months  

Validation Owner:
Quality Head  

---

## C. MAINTENANCE DATA

Required:

• Preventive vs Reactive ratio  
• Maintenance logs  
• Breakdown history  
• MTBF / MTTR (if available)  
• Maintenance spend (annual)  

Validation Owner:
Maintenance Head  

---

## D. FINANCIAL DATA

Required:

• Revenue (monthly)  
• Contribution margin estimate  
• Variable cost structure  
• Maintenance budget  
• Scrap cost impact  
• Inventory value  
• COGS breakdown  

Important:
Financial data must reconcile with P&L.

Validation Owner:
Finance Controller  

---

## E. INVENTORY DATA

Required:

• Inventory days  
• Raw material stock  
• WIP levels  
• Finished goods stock  
• Slow-moving SKU list  

Validation Owner:
Supply Chain Head  

---

## F. WORKFORCE DATA

Required:

• Shift structure  
• Headcount by function  
• Overtime data  
• Attrition (if relevant)  
• Skill classification (if available)  

Validation Owner:
HR / Operations  

---

# 3 — DATA FORMAT STANDARDS

All files must include:

• Clear column headers  
• Defined units (₹, %, hours, units)  
• Defined time periods  
• No merged cells  
• No embedded macros (unless declared)  

File Naming Convention:

ERAIN_<CLIENTCODE>_<DATA_TYPE>_<YYYYMMDD>.xlsx

Example:
ERAIN_MFG01_PRODUCTION_20260201.xlsx

---

# 4 — DATA QUALITY CHECKLIST (INTERNAL)

Before using client data:

[ ] Time range complete  
[ ] No missing critical months  
[ ] Outliers flagged  
[ ] Negative or impossible values validated  
[ ] Units standardized  
[ ] Duplicate rows removed  
[ ] Reconciliation against summary numbers completed  

If data inconsistency > 10% → request clarification.

---

# 5 — DATA SECURITY PROTOCOL

• Store in secure designated folder  
• Access limited to engagement team  
• No external sharing  
• Version control maintained  
• Log any modifications  

No data copied to personal devices.

---

# 6 — DATA MATURITY SCORING

Level 1 – Fragmented / incomplete  
Level 2 – Basic monthly tracking  
Level 3 – Structured with categories  
Level 4 – KPI-aligned and consistent  
Level 5 – Fully digitized + real-time  

Audit complexity increases as maturity decreases.

Report data maturity separately from performance maturity.

---

# 7 — REFUSAL CRITERIA

EraIn pauses intake if:

• Financial data unavailable  
• Downtime data absent  
• No access to validation owner  
• Refusal to share baseline numbers  
• Data only in scanned formats  
• Numbers do not reconcile to P&L  

Brand protection > onboarding speed.

---

# 8 — CLIENT COMMUNICATION TEMPLATE (SUMMARY)

When requesting data:

“We request structured datasets covering production, quality, maintenance, financials, and inventory for the past 12 months. This ensures we provide quantified and defensible insights rather than assumptions. All data will remain confidential under NDA.”

---

# 9 — INTERNAL DISCIPLINE RULE

If team feels pressured to “estimate” without data:

Stop.

Escalate.

EraIn does not build conclusions on incomplete foundations.

---

This document protects:

• Analytical integrity  
• Financial defensibility  
• Client trust  
• Delivery discipline  

Without structured intake, audit collapses.

With structured intake, execution becomes measurable.

END OF DOCUMENT