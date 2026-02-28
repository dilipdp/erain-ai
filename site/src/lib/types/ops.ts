export type LeadStatus = "new" | "contacted" | "pro_offered" | "pro_requested" | "converted";

export interface LeadRecord {
  request_id: string;
  contact_email: string;
  contact_name: string;
  contact_phone: string;
  company_name: string;
  industry: string;
  source: string;
  status: LeadStatus;
  status_note: string;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface LeadEvent {
  request_id: string;
  event_seq: number;
  event_type: string;
  event_payload: Record<string, unknown>;
  actor: string;
  created_at_utc: string;
  prev_event_hash: string;
  event_hash: string;
}

export interface PilotOffer {
  offer_id: string;
  request_id: string;
  title: string;
  delivery_window_days: number;
  fee_band_inr_min: number;
  fee_band_inr_max: number;
  fee_band_usd_min: number;
  fee_band_usd_max: number;
  scope: string[];
  status: "issued" | "accepted" | "declined";
  created_at_utc: string;
  updated_at_utc: string;
}

export interface WeeklyMetric {
  week_start_iso: string;
  metric_key: string;
  metric_value: string;
  source: string;
  updated_at_utc: string;
}

export interface CaseStudyRecord {
  case_id: string;
  request_id: string | null;
  client_label: string;
  industry: string;
  status: "draft" | "legal_review" | "approved_named" | "approved_anonymized" | "published";
  is_named: boolean;
  published_at_utc: string | null;
  annualized_impact_inr: number;
}

export interface ControlTowerDecision {
  generated_at_utc: string;
  week_start_iso: string;
  decision: "go" | "go_with_actions" | "no_go";
  gates: Array<{
    gate: string;
    status: "pass" | "fail" | "attention" | "unknown";
    hard_fail: boolean;
    checked_at_utc: string;
  }>;
  metrics: {
    paying_logos: number;
    booked_revenue_usd: number;
    booked_revenue_inr: number;
    case_studies_named: number;
    case_studies_published: number;
    p50_time_to_value_days: number;
    reference_call_close_rate_percent: number;
    p0_incidents: number;
  };
  top_corrective_actions: string[];
}
