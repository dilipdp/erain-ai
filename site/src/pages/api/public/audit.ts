import type { APIRoute } from "astro";
import {
  createRequestId,
  jsonError,
  safeString,
  storeAuditLead,
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
  const business = toPlainObject(payload.business);

  const contactName = safeString(contact.name, 160);
  const contactPhone = safeString(contact.phone, 60);
  const contactEmail = safeString(contact.email, 320);
  const companyName = safeString(business.company_name, 240);
  const industry = safeString(business.industry, 160);

  if (!contactName || !contactPhone || !contactEmail) {
    return jsonError("contact.name, contact.phone and contact.email are required.");
  }
  if (!companyName || !industry) {
    return jsonError("business.company_name and business.industry are required.");
  }

  const requestId = createRequestId("AR");
  await storeAuditLead(context, requestId, {
    ...payload,
    source: "website_assessment",
  });

  return Response.json(
    {
      request_id: requestId,
      status: "received",
      pdf_path: "/sample-report.pdf",
    },
    { status: 201 },
  );
};

