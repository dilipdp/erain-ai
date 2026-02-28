import type { APIRoute } from "astro";
import { buildLeadView, buildProOffer, requireAdminApiAccess } from "../../../../../lib/admin-api";
import {
  createLeadProOffer,
  getAuditLeadByRequestId,
  getLeadMeta,
  safeString,
} from "../../../../../lib/intake-service";

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

  const created = await createLeadProOffer(context, requestId, offer, "admin_pro_offer_api");
  if (!created.ok || !created.lead_meta) {
    return Response.json({ error: created.reason }, { status: 409 });
  }

  return Response.json(
    {
      ...offer,
      lead: buildLeadView(
        record as unknown as Record<string, unknown>,
        created.lead_meta as unknown as Record<string, unknown> | null,
      ),
    },
    { status: 200 },
  );
};
