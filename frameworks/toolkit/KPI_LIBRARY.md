# ERAIN — UNIVERSAL KPI LIBRARY
Version: v2.1 (Snapshot + Severity Aligned)
Owner: Founder
Status: LOCKED — Core Measurement Engine
Applies To: All industries (Manufacturing, Services, Logistics, Solar, Retail, EPC, Healthcare, Tech, Public Sector, etc.)
Linked To: Audit Operating System (AOS) + Universal ROI Engine

---

# 0. OPERATING PRINCIPLE

KPIs are not dashboards.
KPIs are control instruments.

If a KPI does not influence:
- money
- risk
- throughput
- customer value
- execution discipline

It does not qualify.

EraIn measures only what drives measurable impact.

Every KPI must be:
• Snapshot-bound
• Financially linked
• Owner-controlled
• Severity-scored

---

# 1. KPI ARCHITECTURE (UNIVERSAL CONTROL MODEL)

All KPIs must map to one of the 9 universal control layers:

1. Revenue & Margin
2. Cost & Leakage
3. Throughput & Capacity
4. Quality & Reliability
5. Execution & Governance
6. Cash & Working Capital
7. Risk & Compliance
8. Customer Value
9. People & Productivity

Every industry extension must inherit this structure.

---

# 2. KPI STRUCTURE TEMPLATE (MANDATORY FORMAT)

Each KPI must contain:

• KPI_ID (Unique identifier)
• Snapshot_ID (Audit snapshot reference)
• KPI Name
• Definition (plain language)
• Formula (must match ROI Engine registry)
• Unit (₹ / $ / % / Days / Count)
• Owner (Role, not department only)
• Review Cadence (Daily / Weekly / Monthly)
• Financial Link (Explicit ₹/$ logic)
• Severity Band (Green / Amber / Red / Critical)
• Risk Score (1–5)
• Action Trigger (Mandatory corrective step)
• Data Source
• Audit Evidence Required (File / Log / System Extract)
• Leakage Category Mapping (from AOS)
• Root Cause Layer Link

No KPI may exist without:
• Snapshot binding
• Owner
• Cadence
• Financial linkage

---

# 3. SNAPSHOT GOVERNANCE STANDARD

All KPI calculations must reference:

Snapshot_ID → Period → Data Lock Date

Rules:

1. No retroactive modification after snapshot lock.
2. All severity scoring tied to snapshot context.
3. KPI trends must compare Snapshot_N vs Snapshot_N-1.
4. Evidence_ID must be stored with KPI record.

This prevents dashboard manipulation and ensures audit defensibility.

---

# 4. CORE UNIVERSAL KPI SET

(Universal definitions retained — formulas aligned to ROI Engine)

---

## 4.1 Revenue & Margin

### Revenue Growth Rate
Formula:
(Current Snapshot Revenue − Previous Snapshot Revenue) / Previous Snapshot Revenue

---

### Gross Margin %
Formula:
(Revenue − Direct Cost) / Revenue

Financial Impact:
(Target Margin − Actual Margin) × Revenue

---

### Revenue Leakage %
Formula:
(Recoverable Revenue Loss / Total Revenue) × 100

Leakage Category:
Revenue Leakage

---

## 4.2 Cost & Leakage

### Cost Variance %
(Actual Cost − Standard Cost) / Standard Cost

---

### Waste / Scrap %
Scrap Quantity / Total Production

---

### Downtime %
Downtime Hours / Total Available Hours

Financial Impact:
Lost Output × Contribution Margin

Leakage Category:
Time + Cost Leakage

---

## 4.3 Throughput & Capacity

### Throughput per Hour
Total Output / Operating Hours

---

### On-Time Delivery %
Orders Delivered On Time / Total Orders

---

### Cycle Time
End Time − Start Time

Capacity Unlock Value:
Cycle Time Reduction × Volume × Contribution Margin

---

## 4.4 Quality & Reliability

### Defect Rate %
Defective Units / Total Units

---

### Repeat Issue Rate
Repeat Incidents / Total Incidents

---

### Root Cause Closure Time
Avg Days to Close Root Cause

Leakage Category:
Quality + Governance

---

## 4.5 Execution & Governance

### Action Completion Rate
Closed Actions / Total Open Actions

---

### Overdue %
Overdue Tasks / Total Tasks

---

### Decision Latency
Time from Issue Identification → Decision Taken

Financial Risk Link:
Delay × Daily Financial Exposure

---

## 4.6 Cash & Working Capital

### DSO
Accounts Receivable / Average Daily Revenue

---

### Inventory Days
Inventory Value / COGS × 365

---

### Cash Conversion Cycle
Inventory Days + DSO − DPO

Cash Impact:
Working Capital Freed = Reduction × Daily Revenue

---

## 4.7 Risk & Compliance

### Control Failure Rate
Control Failures / Total Controls

---

### Audit Findings Count
Critical Audit Observations

---

### CAPA Closure Rate
Closed CAPA / Total CAPA

---

## 4.8 Customer Value

### Churn %
Lost Customers / Total Customers

---

### Complaint Resolution Time
Avg Time to Close Complaint

Retention Value:
Reduced Churn × Avg Customer Value

---

## 4.9 People & Productivity

### Revenue per Employee
Total Revenue / Total Employees

---

### Utilization Rate
Billable Hours / Available Hours

---

### Absenteeism %
Absent Days / Total Workdays

---

# 5. KPI ↔ LEAKAGE TRACEABILITY

Each KPI must map to:

• Time Leakage
• Cost Leakage
• Revenue Leakage
• Quality Leakage
• Decision Leakage
• Ownership Leakage
• System Leakage

Trace Path:
KPI_ID → Leakage Category → Root Cause Layer → Financial Impact

---

# 6. SEVERITY & RISK SCORING MODEL

Severity Bands:

Green → Within threshold
Amber → Deviation emerging
Red → Financially material
Critical → Immediate governance intervention

Risk Score (1–5):

1 = Stable
2 = Minor Deviation
3 = Noticeable Impact
4 = Financially Material
5 = Systemic / Critical Risk

Execution Priority = Financial Impact × Risk Score

---

# 7. KPI MATURITY MODEL

Level 1 — Visibility
Level 2 — Ownership
Level 3 — Financial Linkage
Level 4 — Predictive Trend
Level 5 — Autonomous Trigger (AI escalation logic)

EraIn Target:
All critical KPIs at Level 3 within 45 days.
Top 5 KPIs at Level 4 within 75 days.

---

# 8. CADENCE STANDARD

Daily → Operational KPIs
Weekly → Execution + Throughput
Monthly → Financial + Governance
Quarterly → Strategic KPIs

Cadence discipline is non-negotiable.

---

# 9. INDUSTRY EXTENSIONS

Industry packs must:

• Reference this document
• Extend only where required
• Maintain snapshot binding
• Maintain severity scoring
• Maintain financial linkage discipline

Examples:

Manufacturing → OEE, MTBF, MTTR
Solar → PR %, CUF, Generation Variance
Logistics → Route Cost per KM, SLA Breach Cost
Services → Utilization %, Cost-to-Serve

---

# OPERATING LOCK

No KPI dashboard is delivered without:

• Snapshot_ID binding
• Financial linkage
• Owner mapping
• Severity band assigned
• Leakage mapping
• Evidence reference

If KPI discipline breaks → governance must be fixed before automation.

---

Universal KPI Library — LOCKED v2.1
Snapshot Governance Active.
Severity Control Enforced.