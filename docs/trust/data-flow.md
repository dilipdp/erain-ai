# Data Flow Diagram (Text)

1. Public web forms submit intake payloads to Astro SSR APIs.
2. APIs validate and persist to D1 tables (`leads`, `audits`, `contact_messages`, `client_access_attempts`).
3. Lead status and offers are managed via admin APIs and logged in `lead_events` hash chain.
4. Weekly commercial/reliability metrics are written into `weekly_metrics`.
5. Release gate outputs are stored in `release_gates` and aggregated by control tower.
