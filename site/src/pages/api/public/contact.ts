import type { APIRoute } from "astro";
import {
  createRequestId,
  jsonError,
  safeString,
  storeContactMessage,
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

  const referenceId = createRequestId("CT");
  await storeContactMessage(context, referenceId, {
    ...payload,
    source: "website_contact",
  });

  return Response.json(
    {
      reference_id: referenceId,
      status: "received",
    },
    { status: 201 },
  );
};

