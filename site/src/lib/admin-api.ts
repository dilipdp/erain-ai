import type { APIContext } from "astro";
import { safeString, toPlainObject } from "./intake-service";

function unauthorizedJson(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function parseBasicAuth(authHeader: string): { user: string; pass: string } | null {
  if (!authHeader || !authHeader.toLowerCase().startsWith("basic ")) return null;
  try {
    const decoded = atob(authHeader.slice(6).trim());
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return {
      user: decoded.slice(0, idx),
      pass: decoded.slice(idx + 1),
    };
  } catch {
    return null;
  }
}

export function requireAdminApiAccess(context: APIContext): Response | null {
  const configuredToken = safeString(import.meta.env.ADMIN_API_TOKEN, 240);
  const requestToken = safeString(context.request.headers.get("x-admin-token"), 240);

  if (configuredToken && requestToken === configuredToken) {
    return null;
  }

  const user = safeString(import.meta.env.ADMIN_USER, 120);
  const pass = safeString(import.meta.env.ADMIN_PASS, 120);
  if (user && pass) {
    const creds = parseBasicAuth(context.request.headers.get("authorization") || "");
    if (creds && creds.user === user && creds.pass === pass) {
      return null;
    }
  }

  return unauthorizedJson();
}

function parseNumber(value: unknown): number {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function compactCurrencyInr(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "INR 0";
  const cr = value / 10000000;
  if (cr >= 1) return `INR ${cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.00$/, "")} Cr`;
  const lakhs = value / 100000;
  return `INR ${lakhs.toFixed(lakhs >= 10 ? 0 : 1).replace(/\.0$/, "")} L`;
}

export function buildLeadView(
  auditRecord: Record<string, unknown>,
  leadMeta: Record<string, unknown> | null,
): Record<string, unknown> {
  const payload = toPlainObject(auditRecord.payload);
  const contact = toPlainObject(payload.contact);
  const business = toPlainObject(payload.business);

  return {
    request_id: safeString(auditRecord.request_id, 80),
    contact: {
      name: safeString(contact.name, 160),
      phone: safeString(contact.phone, 60),
      email: safeString(contact.email, 320),
      city: safeString(contact.city, 120),
      state: safeString(contact.state, 120),
    },
    business: {
      company_name: safeString(business.company_name, 240),
      industry: safeString(business.industry, 160),
      employee_count: parseNumber(business.employee_count),
      annual_revenue_inr: parseNumber(business.annual_revenue_inr),
    },
    status: safeString(leadMeta?.status, 60) || "new",
    status_note: safeString(leadMeta?.status_note, 2000),
    status_updated_at_utc: safeString(leadMeta?.status_updated_at_utc, 80) || safeString(auditRecord.created_at_utc, 80),
    pro_offer: toPlainObject(leadMeta?.pro_offer),
    created_at_utc: safeString(auditRecord.created_at_utc, 80),
    pdf_path: "/sample-report.pdf",
  };
}

export function buildAuditView(
  auditRecord: Record<string, unknown>,
  leadMeta: Record<string, unknown> | null,
): Record<string, unknown> {
  const payload = toPlainObject(auditRecord.payload);
  const contact = toPlainObject(payload.contact);
  const business = toPlainObject(payload.business);
  const operations = toPlainObject(payload.operations);

  const company = safeString(business.company_name, 240) || "Client";
  const industry = safeString(business.industry, 160) || "operations";
  const annualRevenueInr = parseNumber(business.annual_revenue_inr);
  const employeeCount = parseNumber(business.employee_count);
  const knownIssues = safeString(operations.known_issues, 2400);
  const majorProcesses = safeString(operations.major_processes, 2400);

  let healthScore = 72;
  if (annualRevenueInr >= 500000000) healthScore += 4;
  if (annualRevenueInr > 0 && annualRevenueInr < 100000000) healthScore -= 5;
  if (employeeCount >= 300) healthScore += 3;
  if (knownIssues.length > 120) healthScore -= 6;
  if (majorProcesses.length > 80) healthScore -= 3;
  if (healthScore < 45) healthScore = 45;
  if (healthScore > 92) healthScore = 92;

  const findings: string[] = [];
  if (knownIssues) {
    findings.push(`Known issue signal: ${knownIssues.slice(0, 120)}${knownIssues.length > 120 ? "..." : ""}`);
  }
  if (majorProcesses) {
    findings.push(`Process scope observed across: ${majorProcesses.slice(0, 110)}${majorProcesses.length > 110 ? "..." : ""}`);
  }
  findings.push(`Likely value-leakage window estimated around ${compactCurrencyInr(Math.max(annualRevenueInr * 0.03, 2500000))}.`);
  findings.push(`Decision governance design recommended for ${industry} owner paths with weekly execution cadence.`);

  const lead = buildLeadView(auditRecord, leadMeta);

  return {
    request_id: lead.request_id,
    generated_at_utc: new Date().toISOString(),
    output: {
      pdf_path: "/sample-report.pdf",
      summary: {
        overall_health_score: healthScore,
        key_findings: findings.slice(0, 4),
      },
      governance: {
        recommended_cadence: "weekly",
        owner_mapping_status: "defined",
      },
      roi_attribution: {
        annualized_value_window_inr: Math.max(Math.round(annualRevenueInr * 0.03), 2500000),
      },
    },
    lead,
    contact: {
      name: safeString(contact.name, 160),
      email: safeString(contact.email, 320),
      phone: safeString(contact.phone, 60),
    },
    business: {
      company_name: company,
      industry,
      employee_count: employeeCount,
      annual_revenue_inr: annualRevenueInr,
    },
  };
}

export function buildProOffer(
  requestId: string,
  leadView: Record<string, unknown>,
): Record<string, unknown> {
  const business = toPlainObject(leadView.business);
  const company = safeString(business.company_name, 240) || "Client";

  return {
    request_id: requestId,
    title: "EraIn Pro Audit",
    price_inr: 75000,
    currency: "INR",
    delivery_window_days: "7-10",
    scope: [
      "Deep leakage quantification",
      "Owner-mapped governance design",
      "30/60/90 execution roadmap",
      "ROI attribution ledger",
    ],
    prepared_for: company,
    prepared_at_utc: new Date().toISOString(),
  };
}

export function buildWhatsappTemplate(leadView: Record<string, unknown>): string {
  const requestId = safeString(leadView.request_id, 80);
  const contact = toPlainObject(leadView.contact);
  const business = toPlainObject(leadView.business);
  const name = safeString(contact.name, 160) || "there";
  const company = safeString(business.company_name, 240) || "your team";

  return [
    `Hi ${name}, this is EraIn AI.`,
    `We reviewed your assessment request (${requestId}) for ${company}.`,
    "We can share a prioritized 30/60/90 execution plan with governance + ROI attribution.",
    "Reply with a suitable 20-minute slot and we will send the agenda.",
  ].join("\n");
}

export function buildEmailTemplate(leadView: Record<string, unknown>): string {
  const requestId = safeString(leadView.request_id, 80);
  const contact = toPlainObject(leadView.contact);
  const business = toPlainObject(leadView.business);
  const name = safeString(contact.name, 160) || "Team";
  const company = safeString(business.company_name, 240) || "your organization";

  return [
    `Subject: EraIn assessment follow-up (${requestId})`,
    "",
    `Hi ${name},`,
    "",
    `Thanks for sharing your context for ${company}.`,
    "Our team can now provide a focused audit-to-execution recommendation with:",
    "- leakage map",
    "- decision governance owners",
    "- ROI attribution path",
    "",
    "If useful, share two 20-minute slots for an executive review call this week.",
    "",
    "Regards,",
    "EraIn AI",
  ].join("\n");
}
