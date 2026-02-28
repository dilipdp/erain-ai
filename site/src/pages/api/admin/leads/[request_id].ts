import type { APIRoute } from "astro";
import { requireAdminApiAccess, buildLeadView } from "../../../../lib/admin-api";
import { getAuditLeadByRequestId, getLeadMeta, safeString } from "../../../../lib/intake-service";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const denied = requireAdminApiAccess(context);
  if (denied) return denied;

  const requestId = safeString(context.params.request_id, 80).toUpperCase();
  if (!requestId) {
    return Response.json({ error: "request_id is required" }, { status: 400 });
  }

  const record = await getAuditLeadByRequestId(context, requestId);
  if (!record) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const meta = await getLeadMeta(context, requestId);
  return Response.json(buildLeadView(record as unknown as Record<string, unknown>, meta as unknown as Record<string, unknown> | null), {
    status: 200,
  });
};
