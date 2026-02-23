

# EraIn AI — Client Data Vault Structure
Version: 1.0
Owner: EraIn Internal
Purpose: Zero-chaos, zero-leakage, audit-ready client data architecture.

---

# 1. Philosophy

We NEVER collect client data without:

1. Defined objective
2. Defined folder structure
3. Defined access control
4. Defined retention policy
5. Defined output mapping

Data without structure destroys trust.
Structure before data. Always.

---

# 2. Master Client Vault Architecture

Root Directory:

/CLIENTS
    /[CLIENT_CODE]_[COMPANY_NAME]
        00_ADMIN
        01_INTAKE
        02_RAW_DATA
        03_STRUCTURED_DATA
        04_ANALYSIS
        05_OUTPUTS
        06_EXECUTION_TRACKING
        07_GOVERNANCE
        08_ARCHIVE

Example:

/CLIENTS
    /ERAIN_MFG01_ACME_STEEL

---

# 3. Folder Definitions

## 00_ADMIN
• NDA
• Engagement Letter
• Scope Document
• Proposal Version
• Billing & Invoices
• Stakeholder List
• Communication Log

Rule:
No data collection without signed NDA + scope.

---

## 01_INTAKE
• Data Request Checklist (PDF)
• Data Received Log
• Data Gaps Register
• Clarification Notes
• Intake Call Recordings (if allowed)

Rule:
Every file logged with:
- Date received
- Source
- Version
- Confidentiality level

---

## 02_RAW_DATA
Unmodified client data.

Subfolders:
    /FINANCE
    /OPERATIONS
    /PROCUREMENT
    /SALES
    /HR
    /PROJECTS
    /MAINTENANCE
    /CUSTOM

Rules:
• Never edit original files.
• Always copy into 03_STRUCTURED before working.
• Maintain checksum log for large datasets.

---

## 03_STRUCTURED_DATA
Cleaned, normalized, analysis-ready files.

Examples:
• Clean_PnL_v1.xlsx
• Normalized_OEE.csv
• Vendor_Spend_Tagged.xlsx
• KPI_Master_Table.xlsx

Every file must include:
- Version
- Prepared by
- Date
- Transformation notes

---

## 04_ANALYSIS
Where thinking happens.

Subfolders:
    /LEAKAGE_ANALYSIS
    /KPI_MODEL
    /ROOT_CAUSE_MAPS
    /IMPACT_ESTIMATION
    /SCENARIO_MODELS

Files:
• Leakage_Map_v1.pptx
• RootCause_Tree_Procurement.drawio
• Impact_Model_v2.xlsx

No final reports stored here.

---

## 05_OUTPUTS
Client-facing deliverables only.

Subfolders:
    /FREE_AUDIT
    /PRO_AUDIT
    /OPS_MIND
    /IMPACT_AI
    /BOARD_PACKS

Standard Output Set:
1. Executive Summary PDF
2. Ranked Leakage Table
3. Root Cause Map
4. 30/60/90 Roadmap
5. KPI Dashboard Snapshot
6. ROI Attribution Sheet

Rule:
Every output must map back to:
• Data source
• Assumption
• Owner
• Evidence

---

## 06_EXECUTION_TRACKING
Where accountability lives.

Files:
• Execution_Tracker.xlsx
• Owner_Assignment_Log.xlsx
• Weekly_Cadence_Notes.md
• Risk_Register.xlsx
• Action_Closure_Log.xlsx

Mandatory Fields:
- Owner
- Deadline
- Expected Impact
- Status
- Evidence of Completion

---

## 07_GOVERNANCE
Trust layer.

• Data Access Log
• Permission Matrix
• Version Control Log
• Audit Trail Summary
• Risk Classification Matrix
• Retention Policy Document

Access Model:
- Level 1: Executive (read-only outputs)
- Level 2: Analyst (structured + analysis)
- Level 3: Core Team (full access)
- Level 4: Admin (vault control)

---

## 08_ARCHIVE
Closed phases only.

Rules:
• No editing.
• Read-only.
• Timestamped.
• Archived after major milestone or engagement close.

---

# 4. Data Classification Model

Every file labeled:

CONFIDENTIALITY:
- C1: Public
- C2: Internal
- C3: Sensitive
- C4: Restricted (financial / HR / legal)

CRITICALITY:
- L: Low impact
- M: Medium impact
- H: High impact
- X: Mission critical

File naming format:

[CLIENTCODE]_[FUNCTION]_[DESCRIPTION]_v[VERSION]_[CONF_LEVEL]

Example:
ERAINMFG01_FIN_PnL_FY23_v1_C4.xlsx

---

# 5. Data Intake Protocol (Before Collection)

Before collecting ANY document:

Checklist:

□ NDA signed
□ Scope defined
□ Data categories identified
□ Secure transfer method defined
□ Storage location created
□ Access permissions configured
□ Retention period defined
□ Exit protocol defined

Approved transfer methods:
• Encrypted Drive Link
• Secure Client Portal
• Password-protected archive (shared separately)
• No WhatsApp documents
• No personal Gmail transfers

---

# 6. Retention Policy

Default:
• Engagement active → live vault
• 12 months post-completion → archive
• 36 months → purge unless extended contract

Sensitive HR / Legal data:
• Minimum retention
• Restricted access
• Mandatory purge on request

---

# 7. Zero-Regret Rule

If:
- Data purpose is unclear → DO NOT COLLECT
- Data mapping to output is unclear → DO NOT COLLECT
- Storage location not ready → DO NOT COLLECT

Trust > speed.

---

# 8. Why This Makes EraIn Elite

Most firms:
Collect → Analyze → Hope for order.

EraIn:
Design → Control → Verify → Execute → Prove.

This structure:
• Protects client trust
• Enables audit readiness
• Prevents chaos
• Makes scaling possible
• Makes ROI provable
• Makes EraIn institutional-grade

---

Status: LOCKED STRUCTURE v1.0
Next Step: Implement secure intake checklist template.