import type { APIRoute } from "astro";
import { requireAdminApiAccess, buildLeadView } from "../../../../../lib/admin-api";
import {
  getAuditLeadByRequestId,
  getLeadMeta,
  safeString,
  toPlainObject,
  upsertLeadMeta,
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

  const meta = await upsertLeadMeta(context, requestId, {
    status,
    status_note: note,
  });

  return Response.json(
    {
      ok: true,
      lead: buildLeadView(record as unknown as Record<string, unknown>, meta as unknown as Record<string, unknown> | null),
    },
    { status: 200 },
  );
};

export const POST = PATCH;
