# EraIn Site Launch Readiness

Date: 2026-02-23

## Automated Checks

Run:

```bash
bash /Users/dilipbr/Projects/erain-ai/site/scripts/launch_qa_checklist.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p0_hardening_checks.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p1_launch_quality_gate.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p2_device_browser_matrix_gate.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p3_analytics_consent_gate.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p4_seo_trust_release_gate.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p5_release_candidate.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p6_production_smoke_gate.sh --url https://your-domain
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p6_launch_guardrail.sh --url https://your-domain --skip-step5
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p7_no1_operating_system.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p8_no1_command_center.sh
bash /Users/dilipbr/Projects/erain-ai/site/scripts/p9_global_standard_gate.sh --url https://your-domain
```

Current status:

- Build: pass
- Analytics event mapping: pass
- CTA tracking labels: pass
- Legacy hero references: pass
- Sample report artifact: pass
- Security headers + trust routes: pass
- Lighthouse thresholds: pass
- Axe blocking violations (critical): pass
- Device/browser matrix (Chromium, Firefox, WebKit + mobile profiles): pass
- Analytics consent integrity (no pre-consent tracking, post-consent event flow): pass
- SEO/trust release integrity (robots, sitemap, canonical/OG/Twitter, trust crawl): pass
- Release certification manifest + safety/release tags: pass
- Production smoke gate (live URL route + security header + PDF checks): pass
- Launch GO/NO-GO guardrail command: pass
- No.1 operating system execution gate: configured (run weekly)
- No.1 command-center brief generation: configured (run weekly)
- Global-standard combined gate (launch + command-center): configured

## Quality Gate Config

The Lighthouse + axe gate supports environment overrides:

- `LH_MIN_PERFORMANCE` (default `0.55`)
- `LH_MIN_ACCESSIBILITY` (default `0.90`)
- `LH_MIN_BEST_PRACTICES` (default `0.85`)
- `LH_MIN_SEO` (default `0.90`)
- `AXE_FAIL_LEVELS` (default `critical`)

## Intake Routing (Live)

Public forms now use this routing model:

- If `PUBLIC_API_BASE_URL` is set to a reachable backend, forms post there.
- If `PUBLIC_API_BASE_URL` is missing (or loopback on a non-loopback host), forms fall back to same-origin endpoints under `/api/public`.

Built-in fallback endpoints:

- `POST /api/public/contact`
- `POST /api/public/audit`
- `POST /api/public/client/access/request`

Optional delivery integrations for fallback endpoints:

- `INTAKE_WEBHOOK_URL` (recommended): forwards each submission event to your CRM/automation endpoint.
- `INTAKE_WEBHOOK_TOKEN` (optional): bearer token for webhook auth.
- `ERAIN_INTAKE_KV` (optional Cloudflare KV binding): persists intake records for lookup continuity across instances.

Device/browser matrix gate artifacts:

- JSON report: `/tmp/erain_device_browser_matrix_report.json`
- Screenshots: `/tmp/erain_device_matrix_shots`

Analytics consent gate artifact:

- JSON report: `/tmp/erain_analytics_consent_gate_report.json`

SEO/trust release gate artifact:

- JSON report: `/tmp/erain_seo_trust_gate_report.json`

Release certification artifacts:

- JSON manifest: `/tmp/erain_release_manifest.json`
- SHA-256 signature: `/tmp/erain_release_manifest.sha256`

Production launch guardrail artifacts:

- JSON smoke report: `/tmp/erain_production_smoke_report.json`
- JSON guardrail decision report: `/tmp/erain_launch_guardrail_report.json`

No.1 operating-system artifact:

- JSON operating report: `/tmp/erain_no1_operating_report.json`
- JSON command-center report: `/tmp/erain_no1_command_center_report.json`
- Weekly executive brief: `/tmp/erain_no1_weekly_brief.md`
- JSON global-standard decision report: `/tmp/erain_global_standard_gate_report.json`

Rollback safety automation:

- Plan mode: `bash /Users/dilipbr/Projects/erain-ai/site/scripts/p5_rollback_to_tag.sh --tag <tag>`
- Safe detach rollback: `bash /Users/dilipbr/Projects/erain-ai/site/scripts/p5_rollback_to_tag.sh --tag <tag> --mode detach --confirm`
- Branch reset rollback (destructive): `bash /Users/dilipbr/Projects/erain-ai/site/scripts/p5_rollback_to_tag.sh --tag <tag> --mode reset-branch --branch main --confirm --allow-destructive [--push]`

## Manual Checks (pre-launch)

1. Desktop visual review:
   - `/`
   - `/results`
   - `/solutions`
   - `/pricing`
   - `/industries`
   - `/sample-report`
   - `/legal`
   - `/contact`
   - `/client-login`
2. Mobile visual review:
   - iPhone width (390px) and Android width (412px)
   - verify quick CTA rail behavior + no content overlap
3. Funnel smoke flow:
   - submit request assessment form
   - submit contact form
   - submit client login form
4. Analytics console validation:
   - `site_cta_click`
   - `assessment_submitted`
   - `contact_submitted`
   - `client_login_submitted`

5. Route consistency:
   - top navigation includes `/results`
   - sample PDF still downloads from `/sample-report.pdf`

## Final practical 10+ note

The site is implementation-ready at a very high level. To lock a true market-defining 10+, replace anonymized proof with approved named client evidence and quantified public case references.
