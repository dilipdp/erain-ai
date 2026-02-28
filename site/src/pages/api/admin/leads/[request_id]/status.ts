import type { APIRoute } from "astro";
import { requireAdminApiAccess, buildLeadView } from "../../../../../lib/admin-api";
import {
  getAuditLeadByRequestId,
  safeString,
  transitionLeadStatus,
  toPlainObject,
} from "../../../../../lib/intake-service";

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
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

  let rawBody: unknown;
  try {
    rawBody = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = toPlainObject(rawBody);
  const status = safeString(body.status, 60);
  const note = safeString(body.note, 2000);

  if (!status) {
    return Response.json({ error: "status is required" }, { status: 400 });
  }

  const transition = await transitionLeadStatus(
    context,
    requestId,
    status,
    note,
    "admin_status_api",
  );
  if (!transition.ok || !transition.lead_meta) {
    return Response.json(
      {
        error: transition.reason,
      },
      { status: 409 },
    );
  }

  return Response.json(
    {
      ok: true,
      lead: buildLeadView(
        record as unknown as Record<string, unknown>,
        transition.lead_meta as unknown as Record<string, unknown> | null,
      ),
    },
    { status: 200 },
  );
};

export const POST = PATCH;
