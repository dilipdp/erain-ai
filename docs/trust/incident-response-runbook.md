# Incident Response Runbook

## Severity
- P0: security exposure, data corruption, major production outage
- P1: user-impacting degradation with workaround
- P2: localized defect with minor commercial risk

## P0 Procedure
1. Freeze non-critical deploys.
2. Assign incident commander and scribe.
3. Contain blast radius and protect data integrity.
4. Publish customer-impact statement.
5. Execute rollback only from tagged safe state.
6. Run p11 + p12 + p13 before resuming GO.

## Exit Criteria
- Root cause documented
- Guardrail added to prevent recurrence
- Control tower shows NO hard fail
