# SOP: End-to-End Completion (Mandatory)

## Purpose
Create consistent internal operational closure and user-facing clarity after every successful end-to-end implementation.

## Trigger
Run this SOP immediately after:
1. Code implementation is complete.
2. Build passes.
3. Required gates pass.
4. Smoke checks are complete.

## Internal Completion Steps
1. Record scope delivered (what changed, why, and impacted routes/apis).
2. Record validation evidence:
   - build output
   - gate outputs
   - smoke test summary
3. Record rollback safety state:
   - latest safe commit/tag
   - rollback command path
4. Record open risks and next corrective actions.
5. Commit changes with phase-structured commit messages.
6. Update `site/ops/no1/trackers/e2e-completions.csv`.

## User-Facing Documentation Steps
1. Update user tutorial page/content for changed flow.
2. Publish endpoint/UI behavior changes in developer docs if applicable.
3. Add any new page/route to navigation or footer if user-visible.
4. Confirm links are reachable and copy is production-safe.

## Definition of Done
All items below must be `yes`:
- Build green
- Required gates green
- Smoke checks complete
- SOP artifacts updated
- User tutorial updated
- Developer docs updated (if API changed)
- Completion tracker row added

## Accountability
- Owner: Delivery lead for the sprint.
- Reviewer: Engineering + commercial owner.
- Cadence: Every end-to-end completion.
