# Control Matrix (Launch)

| Control Domain | Control | Owner | Evidence | Cadence |
| --- | --- | --- | --- | --- |
| Access | Admin/API token enforcement | Platform owner | Middleware + auth checks | Continuous |
| Data | Intake persistence in D1 (source of truth) | Platform owner | D1 schema + migration | Continuous |
| Change | Release gates p7-p13 | Founder + platform owner | Gate reports in /tmp and release_gates table | Weekly |
| Incident | P0 escalation with NO-GO lock | Reliability owner | p11 + control tower report | Weekly |
| Commercial | Discount cap and scope lock checks | Revenue owner | p12 report + pipeline tracker | Weekly |
