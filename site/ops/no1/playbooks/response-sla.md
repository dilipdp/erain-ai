# 1-Hour Lead Response SLA Playbook

Objective:

- Every inbound lead receives first human response within 60 minutes during business hours.

SLA targets:

- P1 enterprise lead: <= 15 minutes
- P2 qualified lead: <= 60 minutes
- P3 low-fit or unclear lead: <= 4 hours

Routing rules:

1. Assign owner immediately in `trackers/lead-response.csv`.
2. Owner sends first response with next-step CTA.
3. If no owner action by SLA-10 minutes, escalate to founder.

First-response template:

- Confirm received context
- State likely fit/non-fit in one line
- Offer one concrete next step (15-min qualification call or data checklist)
- Share exact time window options

Required fields per lead:

- lead_id
- owner
- tier
- submitted_at_utc
- first_response_at_utc
- response_minutes
- status
