import type { APIRoute } from "astro";
import { requireAdminApiAccess } from "../../../../lib/admin-api";
import { listWeeklyMetrics, safeString } from "../../../../lib/intake-service";

export const prerender = false;

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const GET: APIRoute = async (context) => {
  const denied = requireAdminApiAccess(context);
  if (denied) return denied;

  const weekStartIso = safeString(context.url.searchParams.get("week_start_iso"), 32);
  const metrics = await listWeeklyMetrics(context, weekStartIso || undefined);

  const bookedRevenueUsd = asNumber(metrics.booked_revenue_usd);
  const bookedRevenueInr = asNumber(metrics.booked_revenue_inr);
  const payingLogos = asNumber(metrics.paying_logos);
  const publishedCaseStudies = asNumber(metrics.case_studies_published);
  const namedCaseStudies = asNumber(metrics.case_studies_named);
  const p50TimeToValueDays = asNumber(metrics.p50_time_to_value_days);
  const referenceCallCloseRate = asNumber(metrics.reference_call_close_rate_percent);
  const p0Incidents = asNumber(metrics.p0_incidents);

  const risk = {
    reliability: (p0Incidents ?? 0) > 0 ? "high" : "low",
    delivery: (p50TimeToValueDays ?? 99) > 18 ? "attention" : "green",
    proof: (namedCaseStudies ?? 0) < 2 ? "attention" : "green",
    commercial: (referenceCallCloseRate ?? 0) < 35 ? "attention" : "green",
  };

  return Response.json(
    {
      week_start_iso: (metrics.week_start_iso ?? weekStartIso) || null,
      metrics,
      summary: {
        paying_logos: payingLogos,
        booked_revenue_usd: bookedRevenueUsd,
        booked_revenue_inr: bookedRevenueInr,
        case_studies_published: publishedCaseStudies,
        case_studies_named: namedCaseStudies,
        p50_time_to_value_days: p50TimeToValueDays,
        reference_call_close_rate_percent: referenceCallCloseRate,
        p0_incidents: p0Incidents,
      },
      risk,
    },
    { status: 200 },
  );
};
