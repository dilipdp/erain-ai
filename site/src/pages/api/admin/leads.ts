import type { APIRoute } from "astro";
import { requireAdminApiAccess, buildLeadView } from "../../../lib/admin-api";
import { getLeadMeta, listAuditLeads } from "../../../lib/intake-service";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const denied = requireAdminApiAccess(context);
  if (denied) return denied;

  const records = await listAuditLeads(context, 300);
  const leads: Record<string, unknown>[] = [];

  for (const record of records) {
    const meta = await getLeadMeta(context, record.request_id);
    leads.push(buildLeadView(record as unknown as Record<string, unknown>, meta as unknown as Record<string, unknown> | null));
  }

  return Response.json(leads, { status: 200 });
};
