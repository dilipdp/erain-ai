-- EraIn 10-week acceleration baseline schema (D1 / SQLite)

CREATE TABLE IF NOT EXISTS leads (
  request_id TEXT PRIMARY KEY,
  contact_email TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website_assessment',
  status TEXT NOT NULL DEFAULT 'new',
  status_note TEXT NOT NULL DEFAULT '',
  status_updated_at_utc TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  idempotency_key TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_city TEXT NOT NULL DEFAULT '',
  contact_state TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  employee_count INTEGER,
  annual_revenue_inr INTEGER
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at_utc DESC);
CREATE INDEX IF NOT EXISTS idx_leads_contact_email ON leads(contact_email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

CREATE TABLE IF NOT EXISTS audits (
  request_id TEXT PRIMARY KEY,
  contact_email TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website_assessment',
  submitted_at_utc TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  idempotency_key TEXT NOT NULL DEFAULT '',
  pdf_path TEXT NOT NULL DEFAULT '/sample-report.pdf',
  FOREIGN KEY (request_id) REFERENCES leads(request_id)
);

CREATE INDEX IF NOT EXISTS idx_audits_email_key_time ON audits(contact_email, idempotency_key, submitted_at_utc DESC);

CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  event_seq INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_payload_json TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at_utc TEXT NOT NULL,
  prev_event_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  FOREIGN KEY (request_id) REFERENCES leads(request_id),
  UNIQUE(request_id, event_seq),
  UNIQUE(request_id, event_hash)
);

CREATE INDEX IF NOT EXISTS idx_lead_events_request_seq ON lead_events(request_id, event_seq DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  reference_id TEXT PRIMARY KEY,
  contact_email TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website_contact',
  created_at_utc TEXT NOT NULL,
  idempotency_key TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email_key_time ON contact_messages(contact_email, idempotency_key, created_at_utc DESC);

CREATE TABLE IF NOT EXISTS client_access_attempts (
  reference_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'client_login',
  created_at_utc TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  cooldown_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  FOREIGN KEY (request_id) REFERENCES leads(request_id)
);

CREATE INDEX IF NOT EXISTS idx_client_access_guard ON client_access_attempts(request_id, contact_email, created_at_utc DESC);

CREATE TABLE IF NOT EXISTS pro_offers (
  offer_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  offer_json TEXT NOT NULL,
  scope_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (request_id) REFERENCES leads(request_id)
);

CREATE INDEX IF NOT EXISTS idx_pro_offers_request_active ON pro_offers(request_id, is_active, updated_at_utc DESC);

CREATE TABLE IF NOT EXISTS case_studies (
  case_id TEXT PRIMARY KEY,
  request_id TEXT,
  client_label TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_named INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  proof_payload_json TEXT NOT NULL DEFAULT '{}',
  annualized_impact_inr INTEGER NOT NULL DEFAULT 0,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  published_at_utc TEXT,
  FOREIGN KEY (request_id) REFERENCES leads(request_id)
);

CREATE INDEX IF NOT EXISTS idx_case_studies_status ON case_studies(status, updated_at_utc DESC);

CREATE TABLE IF NOT EXISTS weekly_metrics (
  week_start_iso TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  source TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY (week_start_iso, metric_key)
);

CREATE TABLE IF NOT EXISTS release_gates (
  gate_name TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  checked_at_utc TEXT NOT NULL,
  report_path TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  hard_fail INTEGER NOT NULL DEFAULT 0
);
