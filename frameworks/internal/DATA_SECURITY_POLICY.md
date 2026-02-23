# ERAIN AI — DATA SECURITY & CONFIDENTIALITY POLICY

**Version:** 2.0  
**Owner:** Founder  
**Applies to:** All client engagements, audits, internal analysis, contractors, and partners  
**Effective:** Immediately

---

# 0. Governance & Accountability

EraIn operates under a Founder-level data responsibility model.

Security ownership includes:

- Data Controller: Client
- Data Processor: EraIn AI
- Security Owner: Founder
- Engagement Data Lead: Assigned per client

All engagements must document:
- Data scope
- Processing purpose
- Retention timeline
- Named access list

This policy aligns structurally with principles from:
- ISO 27001 (information security management)
- SOC 2 (security, availability, confidentiality)
- GDPR-style data minimization standards

---

# 1. Core Principle

EraIn operates on a simple rule:

> Client data is not an asset. It is a liability entrusted to us.

We collect the minimum required.
We restrict access strictly.
We retain only as long as necessary.
We never reuse across clients.

Trust is non‑negotiable.

---

# 2. Data Classification

All incoming client data must be classified immediately upon receipt.

## Level 1 — Operational (Low Sensitivity)
Examples:
- Production numbers
- Throughput metrics
- Anonymous KPI reports
- Aggregated financial summaries

Handling:
- Stored in structured project folders
- Access limited to engagement team

---

## Level 2 — Sensitive Business Data
Examples:
- Detailed P&L
- Vendor contracts
- Pricing structures
- Customer lists
- Site-level margin reports

Handling:
- Stored in encrypted storage only
- Access strictly limited to named team members
- No email forwarding
- No external sharing without written approval

---

## Level 3 — Highly Confidential / Regulated
Examples:
- Payroll data
- Personal employee information
- Patient records
- Banking details
- Legal disputes

Handling:
- Must not be copied locally unless essential
- Prefer redacted or aggregated form
- Access logged
- Deleted immediately after analysis completion

---

# 3. Data Intake Rules (Before Collection)

We DO NOT collect data unless:

1. Scope is defined
2. Engagement agreement is signed
3. Data request list is documented
4. Client understands exactly why each dataset is required

No exploratory “send everything” requests.

---

# 4. Storage Policy

All client data must:

- Be stored in dedicated client folders
- Never be mixed across clients
- Never be used to train models
- Never be reused for another engagement

Additional safeguards:
- Encryption at rest (AES‑256 or equivalent)
- Encrypted transfer (TLS 1.2+ minimum)
- Access logging enabled
- Daily backup with restricted restore access

Folder structure standard:

frameworks/
  clients/
    CLIENT_NAME/
      01_raw_data/
      02_processed/
      03_analysis/
      04_reports/

---

# 5. Access Control

Access is:

- Role-based
- Need-to-know only
- Revoked immediately after engagement ends

No shared drives without restriction.
No public links.
No third-party tools without approval.

Mandatory controls:
- Multi-factor authentication (MFA) required
- Device encryption required
- Access list reviewed at engagement close
- Temporary credentials for contractors
- Immediate revocation on role change

---

# 6. AI & Model Usage Policy

EraIn guarantees:

- Client data is NOT used to train public models
- Client data is NOT uploaded to unknown tools
- Client data is NOT shared with other clients

If AI tools are used:
- Data must be anonymized
- Sensitive fields removed
- Financial identifiers masked

---

# 7. Data Retention Policy

Standard retention period:

- 90 days after engagement closure

Unless:
- Ongoing OpsMind / Impact AI engagement
- Legal retention required
- Client requests extended storage

After retention period:
- Raw data deleted
- Working files archived or destroyed

Deletion confirmation:
- Written deletion confirmation may be provided upon request
- Secure deletion methods used (not simple file removal)
- Backup purge scheduled within 30 days

---

# 8. Incident Response Protocol

If any breach is suspected:

1. Contain and isolate affected systems immediately  
2. Assess scope and affected data classification level  
3. Notify Founder within 1 hour  
4. Notify client within 24 hours (or earlier if regulated)  
5. Provide written incident report within 72 hours  
6. Implement corrective and preventive controls  

No concealment. Ever.

---

# 9. Contractor & Team Compliance

Any team member must:

- Sign confidentiality agreement
- Follow this policy strictly
- Never copy client data outside approved systems
- Never discuss client details publicly

Violation results in immediate termination of engagement.

---

# 10. Client Transparency

Clients may request:

- Data access logs
- Storage location details
- Deletion confirmation
- Security explanation

We provide full transparency.

---

# 11. Security Practices

Minimum standards:

- Device-level encryption
- Strong passwords + 2FA
- No public WiFi for sensitive data
- Regular backup
- Version control discipline

---

# 12. Non-Negotiables

EraIn will NEVER:

- Sell client data
- Share client benchmarks without consent
- Use one client’s data to advise another
- Store sensitive personal data unnecessarily

---

# 13. Closing Statement

EraIn exists to build trust-driven execution intelligence.

Data security is not compliance theater.
It is structural integrity.

Without trust, execution collapses.

This policy is mandatory for all engagements.

---

# 14. Operational Security Maturity Roadmap

EraIn will progressively implement:

Phase 1 (Immediate)
- Structured folder segregation
- Encryption enforcement
- Access logging
- NDA + Data Request template usage

Phase 2 (Near-term)
- Centralized secure storage vault
- Formal access review process
- Client data processing register
- Engagement-specific risk assessment

Phase 3 (Scale)
- Formal SOC 2 preparation
- Internal security audit cycle
- Documented business continuity plan
- External penetration testing (when scale justifies)

Security maturity will evolve as client scale increases.
Trust compounds through discipline.

---