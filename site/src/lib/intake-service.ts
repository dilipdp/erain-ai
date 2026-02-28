import type { APIContext } from "astro";

type JsonRecord = Record<string, unknown>;

interface AuditLeadRecord {
  request_id: string;
  contact_email: string;
  payload: JsonRecord;
  created_at_utc: string;
  source: string;
}

interface ContactRecord {
  reference_id: string;
  contact_email: string;
  payload: JsonRecord;
  created_at_utc: string;
  source: string;
}

interface ClientAccessRecord {
  reference_id: string;
  request_id: string;
  contact_email: string;
  payload: JsonRecord;
  created_at_utc: string;
  source: string;
}

interface IntakeMemoryStore {
  audits: Map<string, AuditLeadRecord>;
  contacts: Map<string, ContactRecord>;
  clientAccess: Map<string, ClientAccessRecord>;
}

interface KVNamespaceLike {
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  get: (key: string, type?: "text") => Promise<string | null>;
}

const MEMORY_STORE_KEY = "__ERAIN_INTAKE_MEMORY_STORE__";

function ensureMemoryStore(): IntakeMemoryStore {
  const globalRef = globalThis as typeof globalThis & {
    [MEMORY_STORE_KEY]?: IntakeMemoryStore;
  };
  if (!globalRef[MEMORY_STORE_KEY]) {
    globalRef[MEMORY_STORE_KEY] = {
      audits: new Map(),
      contacts: new Map(),
      clientAccess: new Map(),
    };
  }
  return globalRef[MEMORY_STORE_KEY]!;
}

function getRuntimeEnv(context: APIContext): Record<string, unknown> {
  const runtime = (context.locals as Record<string, unknown>)?.runtime as
    | { env?: Record<string, unknown> }
    | undefined;
  return runtime?.env ?? {};
}

function getKv(context: APIContext): KVNamespaceLike | null {
  const env = getRuntimeEnv(context);
  const kv = env.ERAIN_INTAKE_KV as KVNamespaceLike | undefined;
  if (!kv || typeof kv.put !== "function" || typeof kv.get !== "function") {
    return null;
  }
  return kv;
}

function getNowIsoUtc(): string {
  return new Date().toISOString();
}

function formatUtcDateStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function randomToken(length = 8): string {
  const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return raw.slice(0, length);
}

export function createRequestId(prefix: string): string {
  const now = new Date();
  return `${prefix}-${formatUtcDateStamp(now)}-${randomToken(8)}`;
}

export function toPlainObject(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

export function safeString(value: unknown, max = 2000): string {
  return String(value ?? "").trim().slice(0, max);
}

export function lowerEmail(value: unknown): string {
  return safeString(value, 320).toLowerCase();
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

async function persistKvIfAvailable(
  context: APIContext,
  key: string,
  value: unknown,
): Promise<void> {
  const kv = getKv(context);
  if (!kv) return;
  await kv.put(key, JSON.stringify(value), { expirationTtl: 60 * 60 * 24 * 30 });
}

async function fetchKvIfAvailable<T>(
  context: APIContext,
  key: string,
): Promise<T | null> {
  const kv = getKv(context);
  if (!kv) return null;
  const raw = await kv.get(key, "text");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function sendWebhook(context: APIContext, eventType: string, payload: JsonRecord): Promise<void> {
  const env = getRuntimeEnv(context);
  const webhookUrl = safeString(env.INTAKE_WEBHOOK_URL, 2000);
  if (!webhookUrl) return;

  const webhookToken = safeString(env.INTAKE_WEBHOOK_TOKEN, 2000);
  const body = {
    event_type: eventType,
    sent_at_utc: getNowIsoUtc(),
    payload,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (webhookToken) {
    headers.Authorization = `Bearer ${webhookToken}`;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("intake_webhook_error", error);
  }
}

async function enqueueWebhook(context: APIContext, eventType: string, payload: JsonRecord): Promise<void> {
  const runtime = (context.locals as Record<string, unknown>)?.runtime as
    | { ctx?: { waitUntil?: (promise: Promise<void>) => void } }
    | undefined;
  const promise = sendWebhook(context, eventType, payload);
  if (runtime?.ctx?.waitUntil) {
    runtime.ctx.waitUntil(promise);
    return;
  }
  await promise;
}

function getRequestMeta(context: APIContext): JsonRecord {
  const headers = context.request.headers;
  return {
    ip:
      headers.get("cf-connecting-ip") ??
      headers.get("x-forwarded-for") ??
      headers.get("x-real-ip") ??
      "",
    user_agent: headers.get("user-agent") ?? "",
  };
}

export async function storeAuditLead(
  context: APIContext,
  requestId: string,
  payload: JsonRecord,
): Promise<AuditLeadRecord> {
  const now = getNowIsoUtc();
  const contact = toPlainObject(payload.contact);
  const record: AuditLeadRecord = {
    request_id: requestId,
    contact_email: lowerEmail(contact.email),
    payload,
    created_at_utc: now,
    source: safeString(payload.source, 120) || "website_audit",
  };

  const memory = ensureMemoryStore();
  memory.audits.set(requestId, record);
  await persistKvIfAvailable(context, `audit:${requestId}`, record);
  await enqueueWebhook(context, "audit_submission_received", {
    ...record,
    request_meta: getRequestMeta(context),
  });
  return record;
}

export async function storeContactMessage(
  context: APIContext,
  referenceId: string,
  payload: JsonRecord,
): Promise<ContactRecord> {
  const now = getNowIsoUtc();
  const contact = toPlainObject(payload.contact);
  const record: ContactRecord = {
    reference_id: referenceId,
    contact_email: lowerEmail(contact.email),
    payload,
    created_at_utc: now,
    source: safeString(payload.source, 120) || "website_contact",
  };

  const memory = ensureMemoryStore();
  memory.contacts.set(referenceId, record);
  await persistKvIfAvailable(context, `contact:${referenceId}`, record);
  await enqueueWebhook(context, "contact_message_received", {
    ...record,
    request_meta: getRequestMeta(context),
  });
  return record;
}

export async function storeClientAccessAttempt(
  context: APIContext,
  referenceId: string,
  requestId: string,
  payload: JsonRecord,
): Promise<ClientAccessRecord> {
  const now = getNowIsoUtc();
  const record: ClientAccessRecord = {
    reference_id: referenceId,
    request_id: requestId,
    contact_email: lowerEmail(payload.email),
    payload,
    created_at_utc: now,
    source: safeString(payload.source, 120) || "client_login",
  };

  const memory = ensureMemoryStore();
  memory.clientAccess.set(referenceId, record);
  await persistKvIfAvailable(context, `client-access:${referenceId}`, record);
  await enqueueWebhook(context, "client_access_requested", {
    ...record,
    request_meta: getRequestMeta(context),
  });
  return record;
}

export async function findAuditLeadByRequestAndEmail(
  context: APIContext,
  requestId: string,
  email: string,
): Promise<AuditLeadRecord | null> {
  const normalizedRequestId = safeString(requestId, 80);
  const normalizedEmail = lowerEmail(email);
  if (!normalizedRequestId || !normalizedEmail) return null;

  const memory = ensureMemoryStore();
  const memoryRecord = memory.audits.get(normalizedRequestId);
  if (memoryRecord && memoryRecord.contact_email === normalizedEmail) {
    return memoryRecord;
  }

  const kvRecord = await fetchKvIfAvailable<AuditLeadRecord>(context, `audit:${normalizedRequestId}`);
  if (kvRecord && lowerEmail(kvRecord.contact_email) === normalizedEmail) {
    return kvRecord;
  }

  return null;
}

