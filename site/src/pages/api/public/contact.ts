import type { APIRoute } from "astro";
import {
  createOrGetContactMessage,
  getIdempotencyKey,
  jsonError,
  safeString,
  toPlainObject,
} from "../../../lib/intake-service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  let payloadRaw: unknown;
  try {
    payloadRaw = await context.request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const payload = toPlainObject(payloadRaw);
  const contact = toPlainObject(payload.contact);
  const contactName = safeString(contact.name, 160);
  const contactEmail = safeString(contact.email, 320);
  const message = safeString(payload.message, 5000);

  if (!contactName || !contactEmail || !message) {
    return jsonError("contact.name, contact.email and message are required.");
  }

  const idempotencyKey = getIdempotencyKey(context, payload);
  const result = await createOrGetContactMessage(context, {
    ...payload,
    source: "website_contact",
  }, {
    idempotencyKey,
  });

  return Response.json(
    {
      reference_id: result.record.reference_id,
      status: result.status,
      next_step_eta_minutes: 60,
    },
    { status: result.status === "duplicate" ? 200 : 201 },
  );
};
