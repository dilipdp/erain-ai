import type { APIRoute } from "astro";
import {
  jsonError,
  lowerEmail,
  registerClientAccessAttempt,
  safeString,
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

  const result = await registerClientAccessAttempt(context, requestId, email, {
    ...payload,
    request_id: requestId,
    email,
    source: "client_login",
  });

  return Response.json(
    {
      status: result.record.status,
      reference_id: result.record.reference_id,
      redirect_url: result.redirect_url,
      attempt_count: result.record.attempt_count,
      cooldown_seconds: result.record.cooldown_seconds,
    },
    { status: 200 },
  );
};
