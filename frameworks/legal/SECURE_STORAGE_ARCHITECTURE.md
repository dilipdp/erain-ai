

# SECURE STORAGE ARCHITECTURE — EraIn AI
Version: 1.0 (Client Data Lock)
Owner: Founder / Delivery Lead
Classification: Internal — Governance Critical
Last Updated: 2026-02-20

---

## 0) Non‑Negotiable Rules

1. **No client data** is collected until this document is implemented.
2. **Least privilege** always: access is role-based + time-bounded.
3. **Single source of truth**: one canonical storage location per client.
4. **No copies** on laptops, WhatsApp, personal drives, or email attachments.
5. **Everything is auditable**: access, changes, exports, deletions.

---

## 1) Objectives

This architecture ensures:
- Confidentiality (who can see what)
- Integrity (no silent edits)
- Availability (reliable retrieval)
- Auditability (who did what, when)
- Client trust (enterprise-grade handling)

---

## 2) Storage Model (Simple, Premium, Defensible)

### 2.1 Canonical Storage Location

**Primary (recommended):** Google Workspace Drive (or equivalent enterprise drive) under a dedicated EraIn Workspace account.

- Top-level folder: `EraIn-Clients/`
- Each client has a single root folder: `EraIn-Clients/<CLIENT_CODE>/`
- **No shared personal accounts** (must be org-owned).

**Fallback (if client mandates):** Client-provided VDR / SharePoint / SFTP.
- EraIn still maintains the **same folder schema** in the client system.

### 2.2 Local Storage Policy

- **Default:** No local storage.
- **Exception:** Temporary download allowed **only** for transformation work and must be deleted within **24 hours**.
- Any exception must be logged in the Audit Log (see Section 8).

---

## 3) Folder Structure (Canonical)

Inside each client root: `EraIn-Clients/<CLIENT_CODE>/`

```
00_ADMIN/
  NDA/
  SOW/
  CONTACTS/
  MEETING_NOTES/

01_INTAKE/
  01_RAW_DROP/
  02_REQUEST_LISTS/
  03_INTAKE_LOG/

02_NORMALIZED/
  01_MASTER_TABLES/
  02_CLEANED_EXPORTS/
  03_MAPPING_DICTIONARY/

03_ANALYSIS/
  01_FINDINGS/
  02_ROOT_CAUSE_MAPS/
  03_LEAKAGE_MODELS/
  04_ROI_ATTRIBUTION/

04_OUTPUTS/
  01_EXEC_SUMMARY_PDF/
  02_AUDIT_DECK/
  03_30_60_90_ROADMAP/
  04_ACTION_TRACKER/

05_GOVERNANCE/
  01_DECISION_LOG/
  02_RISK_REGISTER/
  03_ACTION_OWNERS/
  04_WEEKLY_REVIEWS/

06_ARCHIVE/
  01_SUPERSEDED/
  02_EXPORTS_SENT/
  03_FINAL_SEALED/
```

**Golden rule:** Raw data stays in `01_INTAKE/01_RAW_DROP/` and is never edited.

---

## 4) Naming Convention

### 4.1 Client Code

Format: `ERAIN-<INDUSTRY>-<SHORTNAME>-<YYMM>`

Examples:
- `ERAIN-MFG-ACME-2602`
- `ERAIN-LOGI-FASTLANE-2602`

### 4.2 File Naming

Format:

`<CLIENT_CODE>__<CATEGORY>__<DESC>__v<MAJOR>.<MINOR>__<YYYY-MM-DD>.<ext>`

Examples:
- `ERAIN-MFG-ACME-2602__RAW__TallyExport__v1.0__2026-02-20.xlsx`
- `ERAIN-MFG-ACME-2602__NORM__KPI_Master__v1.1__2026-02-23.csv`
- `ERAIN-MFG-ACME-2602__OUT__ExecSummary__v1.0__2026-02-28.pdf`

### 4.3 “SEALED” Outputs

Final deliverables must include `SEALED`:

`...__SEALED__YYYY-MM-DD.pdf`

---

## 5) Access Control (RBAC)

Roles:
- **Founder (FDR):** Full access, can approve exports/deletions.
- **Delivery Lead (DL):** Read/write across client, cannot delete final sealed outputs.
- **Analyst (AN):** Read raw, write normalized + analysis, no export outside.
- **Reviewer (RV):** Read outputs + analysis, no raw access by default.

Default permissions:
- `00_ADMIN/` — FDR, DL
- `01_INTAKE/` — FDR, DL, AN (RV only by explicit approval)
- `02_NORMALIZED/` — FDR, DL, AN
- `03_ANALYSIS/` — FDR, DL, AN, RV
- `04_OUTPUTS/` — FDR, DL, RV
- `05_GOVERNANCE/` — FDR, DL, RV
- `06_ARCHIVE/` — FDR, DL

**Time-bounded access:** Analysts get access only for the active audit window.

---

## 6) Encryption & Device Standards

- Storage provider must support **encryption at rest** and **TLS in transit**.
- Founder + Delivery Lead accounts must have:
  - MFA enabled
  - Strong password manager
  - Recovery methods documented
- Devices accessing client data must:
  - Full-disk encryption enabled
  - Screen lock ≤ 2 minutes
  - No untrusted browser extensions

---

## 7) Data In/Out Rules

### 7.1 Intake Rules

- Client uploads only to `01_INTAKE/01_RAW_DROP/`.
- EraIn never asks for data via WhatsApp or email attachments.
- Each intake batch must have a **Request List** file in `01_INTAKE/02_REQUEST_LISTS/`.

### 7.2 Export Rules

- Any export outside the client folder requires:
  1) Founder approval
  2) Audit log entry
  3) Watermarking if applicable

Allowed export paths:
- Client-approved email (PDF only)
- Client-approved VDR link

Not allowed:
- Personal email
- Public links
- Untracked sharing

---

## 8) Audit Logging (Minimum)

Maintain an audit log per client:

`05_GOVERNANCE/01_DECISION_LOG/<CLIENT_CODE>__AUDIT_LOG.md`

Log every:
- Access granted / revoked
- Intake batch received
- Data normalization event
- Output generated / sealed
- Export sent
- Deletion / retention action

Audit Log Entry Template:

```
Date: YYYY-MM-DD
Actor: <Name/Role>
Action: <Granted Access / Received Batch / Generated Output / Exported PDF / Deleted Local Copy>
Scope: <Folder/File>
Reason: <Why>
Approval: <Founder name or N/A>
```

---

## 9) Retention & Deletion

Default retention:
- Raw intake: **12 months** (unless client contract says otherwise)
- Normalized/analysis: **24 months**
- Sealed outputs: **36 months**

Deletion protocol:
1. Confirm retention period and client request.
2. Export sealed output to client.
3. Remove EraIn access.
4. Delete client folder (or archive) per agreement.
5. Record in audit log.

---

## 10) Implementation Checklist (Founder Gate)

[ ] Workspace account created (org-owned)
[ ] MFA enabled for Founder + Delivery Lead
[ ] `EraIn-Clients/` root created
[ ] Folder template created and tested
[ ] RBAC groups created (FDR, DL, AN, RV)
[ ] Sharing disabled by default (no public links)
[ ] Audit Log template placed in `05_GOVERNANCE/`
[ ] Local storage exception rule communicated to team

**When all checked → EraIn is allowed to request client documents.**

---

## 11) Founder Sign-Off

I confirm EraIn secure storage is implemented and enforced.

Signature: ____________________
Date: ____________________

---

END