import type { APIRoute } from "astro";
import {
  createRequestId,
  findAuditLeadByRequestAndEmail,
  jsonError,
  lowerEmail,
  safeString,
  storeClientAccessAttempt,
  toPlainObject,
} from "../../../../../lib/intake-service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  let payloadRaw: unknown;
  try {
    payloadRaw = await context.request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const payload = toPlainObject(payloadRaw);
  const requestId = safeString(payload.request_id, 80).toUpperCase();
  const email = lowerEmail(payload.email);

  if (!requestId || !email) {
    return jsonError("request_id and email are required.");
  }

  const referenceId = createRequestId("CL");
  await storeClientAccessAttempt(context, referenceId, requestId, {
    ...payload,
    request_id: requestId,
    email,
    source: "client_login",
  });

  const matchedLead = await findAuditLeadByRequestAndEmail(context, requestId, email);
  if (matchedLead) {
    return Response.json(
      {
        status: "matched",
        reference_id: referenceId,
        redirect_url: `/sample-report?request_id=${encodeURIComponent(requestId)}`,
      },
      { status: 200 },
    );
  }

  return Response.json(
    {
      status: "pending",
      reference_id: referenceId,
      message: "Access request received. If matched, your secure link will be sent shortly.",
    },
    { status: 200 },
  );
};

