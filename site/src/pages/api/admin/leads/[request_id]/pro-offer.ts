import type { APIRoute } from "astro";
import { buildLeadView, buildProOffer, requireAdminApiAccess } from "../../../../../lib/admin-api";
import { getAuditLeadByRequestId, getLeadMeta, safeString, upsertLeadMeta } from "../../../../../lib/intake-service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
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

  const currentMeta = await getLeadMeta(context, requestId);
  const leadView = buildLeadView(record as unknown as Record<string, unknown>, currentMeta as unknown as Record<string, unknown> | null);
  const offer = buildProOffer(requestId, leadView);

  const nextMeta = await upsertLeadMeta(context, requestId, {
    status: "pro_offered",
    status_note: "Pro Audit offer issued",
    pro_offer: offer,
  });

  return Response.json(
    {
      ...offer,
      lead: buildLeadView(record as unknown as Record<string, unknown>, nextMeta as unknown as Record<string, unknown> | null),
    },
    { status: 200 },
  );
};
