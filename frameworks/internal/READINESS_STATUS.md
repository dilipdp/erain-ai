

# EraIn AI — Readiness Status (Live)

**Purpose:** single source of truth for go‑live readiness across **website, engagement playbooks, delivery artifacts, data intake, and industry packs**.

**Status key:** ✅ GREEN = ready • 🟡 YELLOW = usable w/ gaps • 🔴 RED = not ready (do not collect client documents)

**Last updated:** 2026-02-23

---

## 0) Non‑Negotiables

- **No client documents are collected** unless **Data Intake Protocol = ✅ GREEN** and **Security/Access controls = ✅ GREEN**.
- Every engagement must produce an **Audit Pack** with **traceability** (inputs → findings → decisions → actions → impact).
- Any new industry pack must include: **KPI library + leak taxonomy + audit questionnaire + sample outputs + 30/60/90 plan template**.

---

## 1) Global Gates

| Gate | Owner | Status | What “GREEN” means | Notes / next action |
|---|---|---:|---|---|
| Brand + Positioning | Dilip | 🟡 | Clear ICP + promise + proof artifacts, consistent copy across pages | Tighten “all industries” claim with proof wording |
| Website UX (Premium) | Dilip | 🟡 | No layout regressions, premium spacing, consistent components | Fix any “pills/ribbons moving down” issues |
| Pricing + Packages | Dilip | 🟡 | Free/Pro/OpsMind/Impact offers + deliverables clearly defined | Ensure each tier maps to artifacts |
| Data Intake Protocol | Dilip | 🔴 | Intake checklist, NDA, access model, redaction rules, storage rules | Must be GREEN before collecting documents |
| Security + Access Controls | Dilip | 🔴 | Storage location defined, permissions, audit logs, minimal access | Decide tool stack + SOP |
| Universal Execution Core (Truth→Decision→Execution→Impact) | Dilip | 🟡 | Standard cadence, roles, meeting rhythm, templates | Finalize and link to all packs |
| KPI Library (Universal) | Dilip | 🟡 | Cross‑industry KPI + definitions + formulas + data sources | Expand + map to leak taxonomy |
| Leak Taxonomy (Universal) | Dilip | 🟡 | Categories, symptoms, root causes, evidence checklist | Expand and map to industries |
| Audit Questionnaire (Universal) | Dilip | 🟡 | Intake Qs that work with messy data (Excel/Tally/ERP) | Finalize version v1 |
| Sample Output Packs | Dilip | 🟡 | PDF/deck structure for each industry + example sections | Manufacturing pack required first |
| Delivery SOP + QA | Dilip | 🔴 | Review checklist, red flags, quality gates, sign‑off | Create QA checklist and SLA |
| Client Tracker + Execution Tracker | Dilip | 🟡 | Spreadsheet template with 6 sheets + SOP | Finalize file + add usage notes |

---

## 2) Industry Readiness (Packs)

**Rule:** An industry is **GREEN** only when **Pack v1** exists with: KPI map, leak taxonomy, questionnaire, sample outputs, and 30/60/90 plan template.

| Industry Pack | Status | Must have (v1) | Blocking gaps |
|---|---:|---|---|
| Manufacturing / Industrial | 🟡 | KPI map, OEE/downtime/quality, maintenance, procurement leaks | Sample output pack not complete |
| Services (B2B delivery) | 🔴 | Utilization, SLA, rework loops, cost‑to‑serve | Pack not created |
| Logistics / Supply Chain | 🔴 | OTIF, route cost, penalties, warehouse throughput | Pack not created |
| Solar (EPC/O&M) | 🔴 | Project execution, commissioning, O&M, spares, warranty leakage | Pack not created |
| Retail / Distribution | 🔴 | stock‑outs, margin erosion, replenishment discipline | Pack not created |
| Universal / Cross‑Industry | 🟡 | Execution core + universal toolkit | Data intake/security still RED |

---

## 3) Client Readiness (6 Clients)

**Rule:** A client can move to “Document Collection” only if:
- Data Intake Protocol ✅
- Security + Access Controls ✅
- Engagement Playbook ✅ (for that client type)

| Client | Industry | Size | Stage | Status | Next action |
|---|---|---|---|---:|---|
| C1 | Manufacturing | Small | Discovery | 🟡 | Confirm scope + 2–3 KPIs + pain map |
| C2 | Manufacturing | Larger | Discovery | 🟡 | Prepare manufacturing audit pack v1 + NDA |
| C3 | Services | Small | Discussion | 🔴 | Build services pack v1 before intake |
| C4 | Logistics | Small | Discussion | 🔴 | Build logistics pack v1 before intake |
| C5 | Solar | Small | Discussion | 🔴 | Build solar pack v1 before intake |
| C6 | Solar | Small | Discussion | 🔴 | Build solar pack v1 before intake |

---

## 4) What we finish next (No juggling)

### Stage A — Make “Data Intake” safe (must turn GREEN)
1. Finalize **DATA_INTAKE_PROTOCOL.md** (NDA + permissions + redaction + retention)
2. Decide storage + access:
   - single folder structure
   - who can access
   - audit trail rules
3. Create a **Client Data Vault SOP** (how files are named, stored, shared)

### Stage B — Manufacturing Pack v1 (turn 🟡 → ✅)
1. KPI Map + definitions
2. Leak taxonomy mapping
3. Questionnaire (manufacturing add‑on)
4. **Sample Output Pack** (PDF/Deck skeleton)
5. 30/60/90 Plan template

### Stage C — Services Pack v1
### Stage D — Logistics Pack v1
### Stage E — Solar Pack v1

---

## 5) Link Map

- Universal Execution Core: `frameworks/core/UNIVERSAL_EXECUTION_CORE.md`
- KPI Library: `frameworks/toolkit/KPI_LIBRARY.md`
- Data Intake Protocol: `frameworks/engagement/DATA_INTAKE_PROTOCOL.md`
- Manufacturing Framework: `frameworks/manufacturing/MANUFACTURING_FRAMEWORK.md`
- Execution Tracker Template (xlsx): `frameworks/internal/EXECUTION_TRACKER_TEMPLATE_v1.xlsx`

---

## 6) Update Protocol

- Update this file **at the end of every completed deliverable**.
- Only promote a gate/pack to ✅ when the artifact exists **and** a quick QA pass is done.
- If any page regresses visually, mark **Website UX** back to 🟡/🔴 immediately.
