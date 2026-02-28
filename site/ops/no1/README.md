# EraIn No.1 Operating System

This directory is the execution pack for the 12 priorities required to build a category-defining company.

Run the weekly gate:

```bash
cd /Users/dilipbr/Projects/erain-ai/site
npm run ops:no1:gate:full
npm run ops:no1:command-center:full
```

Output:

- Console summary by priority
- JSON report: `/tmp/erain_no1_operating_report.json`
- Command-center report: `/tmp/erain_no1_command_center_report.json`
- Weekly brief: `/tmp/erain_no1_weekly_brief.md`

Core assets are split into:

- `icp/` beachhead market definition
- `playbooks/` response, delivery, offer, expansion operating playbooks
- `trust-pack/` enterprise assurance checklist
- `benchmarks/` benchmark moat library
- `hiring/` bottleneck-first hiring plan
- `trackers/` weekly execution trackers and scoreboards
- `config/` threshold definitions used by the gate
