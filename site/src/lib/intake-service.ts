import type { APIContext } from "astro";

type JsonRecord = Record<string, unknown>;

type IntakeStatus = "received" | "duplicate";
type LeadStatus = "new" | "contacted" | "pro_offered" | "pro_requested" | "converted";

type LeadEventType =
  | "lead_created"
  | "status_changed"
  | "pro_offer_created"
  | "contact_message_received"
  | "client_access_requested";

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
  attempt_count: number;
  cooldown_seconds: number;
  status: "matched" | "pending" | "cooldown";
}

interface LeadMetaRecord {
  request_id: string;
  status: LeadStatus;
  status_note: string;
  status_updated_at_utc: string;
  pro_offer: JsonRecord | null;
}

interface AuditUpsertResult {
  record: AuditLeadRecord;
  status: IntakeStatus;
}

interface ContactUpsertResult {
  record: ContactRecord;
  status: IntakeStatus;
}

interface ClientAccessAttemptResult {
  record: ClientAccessRecord;
  matched: boolean;
  redirect_url: string | null;
}

interface LeadEventRecord {
  request_id: string;
  event_seq: number;
  event_type: LeadEventType;
  event_payload: JsonRecord;
  actor: string;
  created_at_utc: string;
  prev_event_hash: string;
  event_hash: string;
}

interface AuditIdemMemory {
  request_id: string;
  created_at_ms: number;
}

interface ContactIdemMemory {
  reference_id: string;
  created_at_ms: number;
}

interface IntakeMemoryStore {
  audits: Map<string, AuditLeadRecord>;
  contacts: Map<string, ContactRecord>;
  clientAccess: Map<string, ClientAccessRecord>;
  leadMeta: Map<string, LeadMetaRecord>;
  auditIndex: Set<string>;
  leadEvents: Map<string, LeadEventRecord[]>;
  auditIdempotency: Map<string, AuditIdemMemory>;
  contactIdempotency: Map<string, ContactIdemMemory>;
  accessAttemptsByWindow: Map<string, number[]>;
}

interface KVNamespaceLike {
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  get: (key: string, type?: "text") => Promise<string | null>;
}

interface D1RunResult {
  success?: boolean;
  meta?: JsonRecord;
}

interface D1QueryResult<T = unknown> {
  results?: T[];
}

interface D1PreparedStatementLike {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  first: <T = unknown>(column?: string) => Promise<T | null>;
  all: <T = unknown>() => Promise<D1QueryResult<T>>;
  run: () => Promise<D1RunResult>;
}

interface D1DatabaseLike {
  prepare: (query: string) => D1PreparedStatementLike;
}

const MEMORY_STORE_KEY = "__ERAIN_INTAKE_MEMORY_STORE__";
const AUDIT_INDEX_KEY = "audit:index";
const LEAD_META_PREFIX = "lead-meta:";
const IDEM_WINDOW_MS = 24 * 60 * 60 * 1000;
const ACCESS_WINDOW_SECONDS = 15 * 60;
const ACCESS_MAX_ATTEMPTS = 5;

const allowedLeadStatus: ReadonlySet<LeadStatus> = new Set([
  "new",
  "contacted",
  "pro_offered",
  "pro_requested",
  "converted",
]);

const statusTransitions: Record<LeadStatus, ReadonlySet<LeadStatus>> = {
  new: new Set(["contacted", "pro_offered", "converted"]),
  contacted: new Set(["pro_offered", "pro_requested", "converted"]),
  pro_offered: new Set(["pro_requested", "converted"]),
  pro_requested: new Set(["converted"]),
  converted: new Set(["converted"]),
};

function ensureMemoryStore(): IntakeMemoryStore {
  const globalRef = globalThis as typeof globalThis & {
    [MEMORY_STORE_KEY]?: IntakeMemoryStore;
  };
  if (!globalRef[MEMORY_STORE_KEY]) {
    globalRef[MEMORY_STORE_KEY] = {
      audits: new Map(),
      contacts: new Map(),
      clientAccess: new Map(),
      leadMeta: new Map(),
      auditIndex: new Set(),
      leadEvents: new Map(),
      auditIdempotency: new Map(),
      contactIdempotency: new Map(),
      accessAttemptsByWindow: new Map(),
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

function isD1DatabaseLike(value: unknown): value is D1DatabaseLike {
  return !!value && typeof (value as D1DatabaseLike).prepare === "function";
}

function getD1(context: APIContext): D1DatabaseLike | null {
  const env = getRuntimeEnv(context);
  const candidates = [
    env.ERAIN_D1,
    env.ERAIN_DB,
    env.DB,
    env.D1,
  ];
  for (const candidate of candidates) {
    if (isD1DatabaseLike(candidate)) {
      return candidate;
    }
  }
  return null;
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

function parseInteger(value: unknown): number | null {
  const n = Number(String(value ?? "").trim());
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

function normalizeLeadStatus(value: unknown): LeadStatus {
  const status = safeString(value, 60).toLowerCase();
  if (allowedLeadStatus.has(status as LeadStatus)) {
    return status as LeadStatus;
  }
  return "new";
}

export function getIdempotencyKey(context: APIContext, body: JsonRecord): string {
  const fromHeader = safeString(context.request.headers.get("idempotency-key"), 180);
  const fromBody = safeString(body.idempotency_key, 180);
  const key = fromHeader || fromBody;
  return key.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 180);
}

export function checkStatusTransition(current: LeadStatus, next: LeadStatus): {
  ok: boolean;
  reason: string;
} {
  if (current === next && current === "converted") {
    return { ok: true, reason: "converted idempotent transition" };
  }
  const allowed = statusTransitions[current] ?? new Set<LeadStatus>();
  if (allowed.has(next)) {
    return { ok: true, reason: "allowed" };
  }
  return {
    ok: false,
    reason: `Invalid transition ${current} -> ${next}`,
  };
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

async function loadAuditIndex(context: APIContext): Promise<string[]> {
  const kvIndex = await fetchKvIfAvailable<string[]>(context, AUDIT_INDEX_KEY);
  if (!Array.isArray(kvIndex)) return [];
  return kvIndex
    .map((id) => safeString(id, 80))
    .filter(Boolean);
}

async function persistAuditIndex(context: APIContext, ids: string[]): Promise<void> {
  const normalized = ids
    .map((id) => safeString(id, 80))
    .filter(Boolean);
  await persistKvIfAvailable(context, AUDIT_INDEX_KEY, normalized);
}

function parseJsonPayload(raw: unknown): JsonRecord {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as JsonRecord;
  if (typeof raw !== "string") return {};
  try {
    const parsed = JSON.parse(raw);
    return toPlainObject(parsed);
  } catch {
    return {};
  }
}

async function d1First<T>(stmt: D1PreparedStatementLike): Promise<T | null> {
  try {
    const row = await stmt.first<T>();
    return row ?? null;
  } catch {
    return null;
  }
}

async function d1All<T>(stmt: D1PreparedStatementLike): Promise<T[]> {
  try {
    const result = await stmt.all<T>();
    if (!Array.isArray(result?.results)) return [];
    return result.results;
  } catch {
    return [];
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => [key, canonicalize(val)]);
  return Object.fromEntries(entries);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function appendLeadEvent(
  context: APIContext,
  requestId: string,
  eventType: LeadEventType,
  payload: JsonRecord,
  actor = "system",
): Promise<LeadEventRecord> {
  const d1 = getD1(context);
  const createdAt = getNowIsoUtc();

  if (d1) {
    const prev = await d1First<{ event_seq: number; event_hash: string }>(
      d1
        .prepare(
          "SELECT event_seq, event_hash FROM lead_events WHERE request_id = ? ORDER BY event_seq DESC LIMIT 1",
        )
        .bind(requestId),
    );
    const prevSeq = Number(prev?.event_seq ?? 0) || 0;
    const prevHash = safeString(prev?.event_hash, 128);
    const nextSeq = prevSeq + 1;

    const hashPayload = {
      request_id: requestId,
      event_seq: nextSeq,
      event_type: eventType,
      event_payload: payload,
      actor,
      created_at_utc: createdAt,
      prev_event_hash: prevHash,
    };
    const eventHash = await sha256Hex(canonicalJson(hashPayload));

    await d1
      .prepare(
        `INSERT INTO lead_events (
          request_id,
          event_seq,
          event_type,
          event_payload_json,
          actor,
          created_at_utc,
          prev_event_hash,
          event_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        requestId,
        nextSeq,
        eventType,
        canonicalJson(payload),
        actor,
        createdAt,
        prevHash,
        eventHash,
      )
      .run();

    return {
      request_id: requestId,
      event_seq: nextSeq,
      event_type: eventType,
      event_payload: payload,
      actor,
      created_at_utc: createdAt,
      prev_event_hash: prevHash,
      event_hash: eventHash,
    };
  }

  const memory = ensureMemoryStore();
  const list = memory.leadEvents.get(requestId) ?? [];
  const prev = list[list.length - 1];
  const nextSeq = (prev?.event_seq ?? 0) + 1;
  const prevHash = prev?.event_hash ?? "";
  const hashPayload = {
    request_id: requestId,
    event_seq: nextSeq,
    event_type: eventType,
    event_payload: payload,
    actor,
    created_at_utc: createdAt,
    prev_event_hash: prevHash,
  };
  const eventHash = await sha256Hex(canonicalJson(hashPayload));
  const event: LeadEventRecord = {
    request_id: requestId,
    event_seq: nextSeq,
    event_type: eventType,
    event_payload: payload,
    actor,
    created_at_utc: createdAt,
    prev_event_hash: prevHash,
    event_hash: eventHash,
  };
  list.push(event);
  memory.leadEvents.set(requestId, list);
  return event;
}

export async function verifyLeadEventChain(
  context: APIContext,
  requestId: string,
): Promise<{ valid: boolean; count: number; broken_at_seq: number | null }> {
  const rid = safeString(requestId, 80).toUpperCase();
  if (!rid) return { valid: false, count: 0, broken_at_seq: null };

  const d1 = getD1(context);
  const events: LeadEventRecord[] = [];

  if (d1) {
    const rows = await d1All<{
      request_id: string;
      event_seq: number;
      event_type: LeadEventType;
      event_payload_json: string;
      actor: string;
      created_at_utc: string;
      prev_event_hash: string;
      event_hash: string;
    }>(
      d1
        .prepare(
          `SELECT request_id, event_seq, event_type, event_payload_json, actor, created_at_utc, prev_event_hash, event_hash
           FROM lead_events WHERE request_id = ? ORDER BY event_seq ASC`,
        )
        .bind(rid),
    );

    for (const row of rows) {
      events.push({
        request_id: safeString(row.request_id, 80),
        event_seq: Number(row.event_seq ?? 0),
        event_type: row.event_type,
        event_payload: parseJsonPayload(row.event_payload_json),
        actor: safeString(row.actor, 120),
        created_at_utc: safeString(row.created_at_utc, 80),
        prev_event_hash: safeString(row.prev_event_hash, 128),
        event_hash: safeString(row.event_hash, 128),
      });
    }
  } else {
    events.push(...(ensureMemoryStore().leadEvents.get(rid) ?? []));
  }

  let prevHash = "";
  for (const ev of events) {
    if (safeString(ev.prev_event_hash, 128) !== prevHash) {
      return { valid: false, count: events.length, broken_at_seq: ev.event_seq };
    }
    const hashPayload = {
      request_id: ev.request_id,
      event_seq: ev.event_seq,
      event_type: ev.event_type,
      event_payload: ev.event_payload,
      actor: ev.actor,
      created_at_utc: ev.created_at_utc,
      prev_event_hash: ev.prev_event_hash,
    };
    const expectedHash = await sha256Hex(canonicalJson(hashPayload));
    if (expectedHash !== ev.event_hash) {
      return { valid: false, count: events.length, broken_at_seq: ev.event_seq };
    }
    prevHash = ev.event_hash;
  }

  return { valid: true, count: events.length, broken_at_seq: null };
}

function normalizeAuditLeadRow(row: Record<string, unknown>): AuditLeadRecord {
  return {
    request_id: safeString(row.request_id, 80).toUpperCase(),
    contact_email: lowerEmail(row.contact_email),
    payload: parseJsonPayload(row.payload_json ?? row.payload),
    created_at_utc: safeString(row.created_at_utc, 80) || getNowIsoUtc(),
    source: safeString(row.source, 120) || "website_assessment",
  };
}

function normalizeContactRow(row: Record<string, unknown>): ContactRecord {
  return {
    reference_id: safeString(row.reference_id, 80).toUpperCase(),
    contact_email: lowerEmail(row.contact_email),
    payload: parseJsonPayload(row.payload_json ?? row.payload),
    created_at_utc: safeString(row.created_at_utc, 80) || getNowIsoUtc(),
    source: safeString(row.source, 120) || "website_contact",
  };
}

async function findAuditDuplicateByIdempotency(
  context: APIContext,
  email: string,
  idempotencyKey: string,
): Promise<AuditLeadRecord | null> {
  const normalizedEmail = lowerEmail(email);
  const normalizedKey = safeString(idempotencyKey, 180);
  if (!normalizedEmail || !normalizedKey) return null;

  const d1 = getD1(context);
  const cutoffIso = new Date(Date.now() - IDEM_WINDOW_MS).toISOString();

  if (d1) {
    const row = await d1First<Record<string, unknown>>(
      d1
        .prepare(
          `SELECT request_id, contact_email, payload_json, created_at_utc, source
           FROM audits
           WHERE contact_email = ?
             AND idempotency_key = ?
             AND submitted_at_utc >= ?
           ORDER BY submitted_at_utc DESC
           LIMIT 1`,
        )
        .bind(normalizedEmail, normalizedKey, cutoffIso),
    );
    if (row) {
      return normalizeAuditLeadRow(row);
    }
    return null;
  }

  const memory = ensureMemoryStore();
  const key = `${normalizedEmail}::${normalizedKey}`;
  const existing = memory.auditIdempotency.get(key);
  if (!existing) return null;
  if (Date.now() - existing.created_at_ms > IDEM_WINDOW_MS) {
    memory.auditIdempotency.delete(key);
    return null;
  }
  return memory.audits.get(existing.request_id) ?? null;
}

async function findContactDuplicateByIdempotency(
  context: APIContext,
  email: string,
  idempotencyKey: string,
): Promise<ContactRecord | null> {
  const normalizedEmail = lowerEmail(email);
  const normalizedKey = safeString(idempotencyKey, 180);
  if (!normalizedEmail || !normalizedKey) return null;

  const d1 = getD1(context);
  const cutoffIso = new Date(Date.now() - IDEM_WINDOW_MS).toISOString();

  if (d1) {
    const row = await d1First<Record<string, unknown>>(
      d1
        .prepare(
          `SELECT reference_id, contact_email, payload_json, created_at_utc, source
           FROM contact_messages
           WHERE contact_email = ?
             AND idempotency_key = ?
             AND created_at_utc >= ?
           ORDER BY created_at_utc DESC
           LIMIT 1`,
        )
        .bind(normalizedEmail, normalizedKey, cutoffIso),
    );
    if (row) {
      return normalizeContactRow(row);
    }
    return null;
  }

  const memory = ensureMemoryStore();
  const key = `${normalizedEmail}::${normalizedKey}`;
  const existing = memory.contactIdempotency.get(key);
  if (!existing) return null;
  if (Date.now() - existing.created_at_ms > IDEM_WINDOW_MS) {
    memory.contactIdempotency.delete(key);
    return null;
  }
  return memory.contacts.get(existing.reference_id) ?? null;
}

function extractLeadFields(payload: JsonRecord): {
  contact_name: string;
  contact_phone: string;
  contact_city: string;
  contact_state: string;
  company_name: string;
  industry: string;
  employee_count: number | null;
  annual_revenue_inr: number | null;
} {
  const contact = toPlainObject(payload.contact);
  const business = toPlainObject(payload.business);
  return {
    contact_name: safeString(contact.name, 160),
    contact_phone: safeString(contact.phone, 60),
    contact_city: safeString(contact.city, 120),
    contact_state: safeString(contact.state, 120),
    company_name: safeString(business.company_name, 240),
    industry: safeString(business.industry, 160),
    employee_count: parseInteger(business.employee_count),
    annual_revenue_inr: parseInteger(business.annual_revenue_inr),
  };
}

async function writeLeadFromAudit(
  context: APIContext,
  record: AuditLeadRecord,
  idempotencyKey: string,
): Promise<void> {
  const fields = extractLeadFields(record.payload);
  const now = getNowIsoUtc();
  const d1 = getD1(context);

  if (d1) {
    await d1
      .prepare(
        `INSERT INTO leads (
          request_id,
          contact_email,
          payload_json,
          source,
          status,
          status_note,
          status_updated_at_utc,
          created_at_utc,
          updated_at_utc,
          idempotency_key,
          contact_name,
          contact_phone,
          contact_city,
          contact_state,
          company_name,
          industry,
          employee_count,
          annual_revenue_inr
        ) VALUES (?, ?, ?, ?, 'new', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(request_id) DO UPDATE SET
          contact_email = excluded.contact_email,
          payload_json = excluded.payload_json,
          source = excluded.source,
          updated_at_utc = excluded.updated_at_utc,
          idempotency_key = excluded.idempotency_key,
          contact_name = excluded.contact_name,
          contact_phone = excluded.contact_phone,
          contact_city = excluded.contact_city,
          contact_state = excluded.contact_state,
          company_name = excluded.company_name,
          industry = excluded.industry,
          employee_count = excluded.employee_count,
          annual_revenue_inr = excluded.annual_revenue_inr`,
      )
      .bind(
        record.request_id,
        record.contact_email,
        canonicalJson(record.payload),
        record.source,
        now,
        record.created_at_utc,
        now,
        idempotencyKey,
        fields.contact_name,
        fields.contact_phone,
        fields.contact_city,
        fields.contact_state,
        fields.company_name,
        fields.industry,
        fields.employee_count,
        fields.annual_revenue_inr,
      )
      .run();
    return;
  }

  const memory = ensureMemoryStore();
  memory.leadMeta.set(record.request_id, {
    request_id: record.request_id,
    status: "new",
    status_note: "",
    status_updated_at_utc: record.created_at_utc,
    pro_offer: null,
  });

  await persistKvIfAvailable(context, `${LEAD_META_PREFIX}${record.request_id}`, {
    request_id: record.request_id,
    status: "new",
    status_note: "",
    status_updated_at_utc: record.created_at_utc,
    pro_offer: null,
  });
}

export async function createOrGetAuditLead(
  context: APIContext,
  payload: JsonRecord,
  opts: { idempotencyKey?: string; requestId?: string } = {},
): Promise<AuditUpsertResult> {
  const idempotencyKey = safeString(opts.idempotencyKey, 180);
  const now = getNowIsoUtc();
  const source = safeString(payload.source, 120) || "website_assessment";
  const contact = toPlainObject(payload.contact);
  const contactEmail = lowerEmail(contact.email);

  if (idempotencyKey && contactEmail) {
    const duplicate = await findAuditDuplicateByIdempotency(context, contactEmail, idempotencyKey);
    if (duplicate) {
      return {
        record: duplicate,
        status: "duplicate",
      };
    }
  }

  const requestId = safeString(opts.requestId, 80).toUpperCase() || createRequestId("AR");
  const record: AuditLeadRecord = {
    request_id: requestId,
    contact_email: contactEmail,
    payload,
    created_at_utc: now,
    source,
  };

  const d1 = getD1(context);
  if (d1) {
    await d1
      .prepare(
        `INSERT INTO audits (
          request_id,
          contact_email,
          payload_json,
          source,
          submitted_at_utc,
          created_at_utc,
          idempotency_key,
          pdf_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        requestId,
        contactEmail,
        canonicalJson(payload),
        source,
        now,
        now,
        idempotencyKey,
        "/sample-report.pdf",
      )
      .run();
  } else {
    const memory = ensureMemoryStore();
    memory.audits.set(requestId, record);
    memory.auditIndex.add(requestId);
    await persistKvIfAvailable(context, `audit:${requestId}`, record);
    const existingIndex = await loadAuditIndex(context);
    if (!existingIndex.includes(requestId)) {
      await persistAuditIndex(context, [...existingIndex, requestId]);
    }
    if (idempotencyKey && contactEmail) {
      memory.auditIdempotency.set(`${contactEmail}::${idempotencyKey}`, {
        request_id: requestId,
        created_at_ms: Date.now(),
      });
    }
  }

  await writeLeadFromAudit(context, record, idempotencyKey);
  await appendLeadEvent(
    context,
    requestId,
    "lead_created",
    {
      source,
      status: "new",
      idempotency_key: idempotencyKey,
    },
    "public_api",
  );

  await enqueueWebhook(context, "audit_submission_received", {
    ...record,
    idempotency_key: idempotencyKey,
    request_meta: getRequestMeta(context),
  });

  return {
    record,
    status: "received",
  };
}

export async function storeAuditLead(
  context: APIContext,
  requestId: string,
  payload: JsonRecord,
): Promise<AuditLeadRecord> {
  const result = await createOrGetAuditLead(context, payload, {
    requestId,
  });
  return result.record;
}

export async function createOrGetContactMessage(
  context: APIContext,
  payload: JsonRecord,
  opts: { idempotencyKey?: string; referenceId?: string } = {},
): Promise<ContactUpsertResult> {
  const idempotencyKey = safeString(opts.idempotencyKey, 180);
  const now = getNowIsoUtc();
  const source = safeString(payload.source, 120) || "website_contact";
  const contact = toPlainObject(payload.contact);
  const contactEmail = lowerEmail(contact.email);

  if (idempotencyKey && contactEmail) {
    const duplicate = await findContactDuplicateByIdempotency(context, contactEmail, idempotencyKey);
    if (duplicate) {
      return {
        record: duplicate,
        status: "duplicate",
      };
    }
  }

  const referenceId = safeString(opts.referenceId, 80).toUpperCase() || createRequestId("CT");
  const record: ContactRecord = {
    reference_id: referenceId,
    contact_email: contactEmail,
    payload,
    created_at_utc: now,
    source,
  };

  const d1 = getD1(context);
  if (d1) {
    await d1
      .prepare(
        `INSERT INTO contact_messages (
          reference_id,
          contact_email,
          payload_json,
          source,
          created_at_utc,
          idempotency_key
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(referenceId, contactEmail, canonicalJson(payload), source, now, idempotencyKey)
      .run();
  } else {
    const memory = ensureMemoryStore();
    memory.contacts.set(referenceId, record);
    await persistKvIfAvailable(context, `contact:${referenceId}`, record);
    if (idempotencyKey && contactEmail) {
      memory.contactIdempotency.set(`${contactEmail}::${idempotencyKey}`, {
        reference_id: referenceId,
        created_at_ms: Date.now(),
      });
    }
  }

  await enqueueWebhook(context, "contact_message_received", {
    ...record,
    idempotency_key: idempotencyKey,
    request_meta: getRequestMeta(context),
  });

  return {
    record,
    status: "received",
  };
}

export async function storeContactMessage(
  context: APIContext,
  referenceId: string,
  payload: JsonRecord,
): Promise<ContactRecord> {
  const result = await createOrGetContactMessage(context, payload, { referenceId });
  return result.record;
}

function computeCooldownSeconds(attemptCount: number): number {
  if (attemptCount <= ACCESS_MAX_ATTEMPTS) return 0;
  const over = attemptCount - ACCESS_MAX_ATTEMPTS;
  return Math.min(15 * 60, 60 * over);
}

async function countRecentClientAccessAttempts(
  context: APIContext,
  requestId: string,
  email: string,
): Promise<number> {
  const d1 = getD1(context);
  const windowStartIso = new Date(Date.now() - ACCESS_WINDOW_SECONDS * 1000).toISOString();

  if (d1) {
    const row = await d1First<{ cnt: number }>(
      d1
        .prepare(
          `SELECT COUNT(*) as cnt
           FROM client_access_attempts
           WHERE request_id = ?
             AND contact_email = ?
             AND created_at_utc >= ?`,
        )
        .bind(requestId, email, windowStartIso),
    );
    return Number(row?.cnt ?? 0) || 0;
  }

  const memory = ensureMemoryStore();
  const key = `${requestId}::${email}`;
  const now = Date.now();
  const list = (memory.accessAttemptsByWindow.get(key) ?? []).filter(
    (ts) => now - ts <= ACCESS_WINDOW_SECONDS * 1000,
  );
  memory.accessAttemptsByWindow.set(key, list);
  return list.length;
}

async function pushClientAccessAttemptWindow(
  context: APIContext,
  requestId: string,
  email: string,
): Promise<void> {
  if (getD1(context)) return;
  const memory = ensureMemoryStore();
  const key = `${requestId}::${email}`;
  const list = memory.accessAttemptsByWindow.get(key) ?? [];
  list.push(Date.now());
  memory.accessAttemptsByWindow.set(key, list);
}

export async function registerClientAccessAttempt(
  context: APIContext,
  requestId: string,
  email: string,
  payload: JsonRecord,
  referenceIdInput?: string,
): Promise<ClientAccessAttemptResult> {
  const normalizedRequestId = safeString(requestId, 80).toUpperCase();
  const normalizedEmail = lowerEmail(email);
  const referenceId = safeString(referenceIdInput, 80).toUpperCase() || createRequestId("CL");
  const now = getNowIsoUtc();

  const recentAttempts = await countRecentClientAccessAttempts(
    context,
    normalizedRequestId,
    normalizedEmail,
  );
  const attemptCount = recentAttempts + 1;
  const cooldownSeconds = computeCooldownSeconds(attemptCount);

  const matchedLead = cooldownSeconds === 0
    ? await findAuditLeadByRequestAndEmail(context, normalizedRequestId, normalizedEmail)
    : null;

  const status: ClientAccessRecord["status"] = cooldownSeconds > 0
    ? "cooldown"
    : matchedLead
    ? "matched"
    : "pending";

  const redirectUrl = matchedLead
    ? `/sample-report?request_id=${encodeURIComponent(normalizedRequestId)}`
    : null;

  const record: ClientAccessRecord = {
    reference_id: referenceId,
    request_id: normalizedRequestId,
    contact_email: normalizedEmail,
    payload,
    created_at_utc: now,
    source: safeString(payload.source, 120) || "client_login",
    attempt_count: attemptCount,
    cooldown_seconds: cooldownSeconds,
    status,
  };

  const d1 = getD1(context);
  if (d1) {
    await d1
      .prepare(
        `INSERT INTO client_access_attempts (
          reference_id,
          request_id,
          contact_email,
          payload_json,
          source,
          created_at_utc,
          attempt_count,
          cooldown_seconds,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        referenceId,
        normalizedRequestId,
        normalizedEmail,
        canonicalJson(payload),
        record.source,
        now,
        attemptCount,
        cooldownSeconds,
        status,
      )
      .run();
  } else {
    const memory = ensureMemoryStore();
    memory.clientAccess.set(referenceId, record);
    await persistKvIfAvailable(context, `client-access:${referenceId}`, record);
    await pushClientAccessAttemptWindow(context, normalizedRequestId, normalizedEmail);
  }

  await enqueueWebhook(context, "client_access_requested", {
    ...record,
    matched: !!matchedLead,
    request_meta: getRequestMeta(context),
  });

  return {
    record,
    matched: !!matchedLead,
    redirect_url: redirectUrl,
  };
}

export async function storeClientAccessAttempt(
  context: APIContext,
  referenceId: string,
  requestId: string,
  payload: JsonRecord,
): Promise<ClientAccessRecord> {
  const result = await registerClientAccessAttempt(
    context,
    requestId,
    lowerEmail(payload.email),
    payload,
    referenceId,
  );
  return result.record;
}

export async function findAuditLeadByRequestAndEmail(
  context: APIContext,
  requestId: string,
  email: string,
): Promise<AuditLeadRecord | null> {
  const normalizedRequestId = safeString(requestId, 80).toUpperCase();
  const normalizedEmail = lowerEmail(email);
  if (!normalizedRequestId || !normalizedEmail) return null;

  const d1 = getD1(context);
  if (d1) {
    const row = await d1First<Record<string, unknown>>(
      d1
        .prepare(
          `SELECT COALESCE(a.request_id, l.request_id) as request_id,
                  COALESCE(a.contact_email, l.contact_email) as contact_email,
                  COALESCE(a.payload_json, l.payload_json) as payload_json,
                  COALESCE(a.created_at_utc, l.created_at_utc) as created_at_utc,
                  COALESCE(a.source, l.source) as source
           FROM leads l
           LEFT JOIN audits a ON a.request_id = l.request_id
           WHERE l.request_id = ? AND l.contact_email = ?
           LIMIT 1`,
        )
        .bind(normalizedRequestId, normalizedEmail),
    );
    if (row) {
      return normalizeAuditLeadRow(row);
    }
    return null;
  }

  const memory = ensureMemoryStore();
  const memoryRecord = memory.audits.get(normalizedRequestId);
  if (memoryRecord && lowerEmail(memoryRecord.contact_email) === normalizedEmail) {
    return memoryRecord;
  }

  const kvRecord = await fetchKvIfAvailable<AuditLeadRecord>(context, `audit:${normalizedRequestId}`);
  if (kvRecord && lowerEmail(kvRecord.contact_email) === normalizedEmail) {
    return kvRecord;
  }

  return null;
}

export async function getAuditLeadByRequestId(
  context: APIContext,
  requestId: string,
): Promise<AuditLeadRecord | null> {
  const normalizedRequestId = safeString(requestId, 80).toUpperCase();
  if (!normalizedRequestId) return null;

  const d1 = getD1(context);
  if (d1) {
    const row = await d1First<Record<string, unknown>>(
      d1
        .prepare(
          `SELECT COALESCE(a.request_id, l.request_id) as request_id,
                  COALESCE(a.contact_email, l.contact_email) as contact_email,
                  COALESCE(a.payload_json, l.payload_json) as payload_json,
                  COALESCE(a.created_at_utc, l.created_at_utc) as created_at_utc,
                  COALESCE(a.source, l.source) as source
           FROM leads l
           LEFT JOIN audits a ON a.request_id = l.request_id
           WHERE l.request_id = ?
           LIMIT 1`,
        )
        .bind(normalizedRequestId),
    );
    if (row) {
      return normalizeAuditLeadRow(row);
    }
    return null;
  }

  const memory = ensureMemoryStore();
  const memoryRecord = memory.audits.get(normalizedRequestId);
  if (memoryRecord) {
    return memoryRecord;
  }

  const kvRecord = await fetchKvIfAvailable<AuditLeadRecord>(context, `audit:${normalizedRequestId}`);
  if (kvRecord) {
    memory.audits.set(normalizedRequestId, kvRecord);
    memory.auditIndex.add(normalizedRequestId);
    return kvRecord;
  }

  return null;
}

export async function listAuditLeads(
  context: APIContext,
  limit = 200,
): Promise<AuditLeadRecord[]> {
  const safeLimit = Math.max(1, Math.min(1000, Math.trunc(limit)));
  const d1 = getD1(context);

  if (d1) {
    const rows = await d1All<Record<string, unknown>>(
      d1
        .prepare(
          `SELECT COALESCE(a.request_id, l.request_id) as request_id,
                  COALESCE(a.contact_email, l.contact_email) as contact_email,
                  COALESCE(a.payload_json, l.payload_json) as payload_json,
                  COALESCE(a.created_at_utc, l.created_at_utc) as created_at_utc,
                  COALESCE(a.source, l.source) as source
           FROM leads l
           LEFT JOIN audits a ON a.request_id = l.request_id
           ORDER BY l.created_at_utc DESC
           LIMIT ?`,
        )
        .bind(safeLimit),
    );
    return rows.map((row) => normalizeAuditLeadRow(row));
  }

  const memory = ensureMemoryStore();

  const kvIndex = await loadAuditIndex(context);
  for (const id of kvIndex) {
    if (id) memory.auditIndex.add(id);
  }

  const ids = Array.from(memory.auditIndex.values());
  const records: AuditLeadRecord[] = [];
  for (const id of ids) {
    const record = await getAuditLeadByRequestId(context, id);
    if (record) records.push(record);
  }

  return records
    .sort((a, b) => Date.parse(b.created_at_utc || "") - Date.parse(a.created_at_utc || ""))
    .slice(0, safeLimit);
}

export async function getLeadMeta(
  context: APIContext,
  requestId: string,
): Promise<LeadMetaRecord | null> {
  const normalizedRequestId = safeString(requestId, 80).toUpperCase();
  if (!normalizedRequestId) return null;

  const d1 = getD1(context);
  if (d1) {
    const row = await d1First<Record<string, unknown>>(
      d1
        .prepare(
          `SELECT l.request_id,
                  l.status,
                  l.status_note,
                  l.status_updated_at_utc,
                  po.offer_json
           FROM leads l
           LEFT JOIN pro_offers po
             ON po.request_id = l.request_id AND po.is_active = 1
           WHERE l.request_id = ?
           LIMIT 1`,
        )
        .bind(normalizedRequestId),
    );
    if (!row) return null;
    return {
      request_id: normalizedRequestId,
      status: normalizeLeadStatus(row.status),
      status_note: safeString(row.status_note, 2000),
      status_updated_at_utc: safeString(row.status_updated_at_utc, 80) || getNowIsoUtc(),
      pro_offer: parseJsonPayload(row.offer_json),
    };
  }

  const memory = ensureMemoryStore();
  const inMemory = memory.leadMeta.get(normalizedRequestId);
  if (inMemory) {
    return inMemory;
  }

  const kvMeta = await fetchKvIfAvailable<LeadMetaRecord>(
    context,
    `${LEAD_META_PREFIX}${normalizedRequestId}`,
  );
  if (kvMeta) {
    const normalized: LeadMetaRecord = {
      request_id: normalizedRequestId,
      status: normalizeLeadStatus(kvMeta.status),
      status_note: safeString(kvMeta.status_note, 2000),
      status_updated_at_utc: safeString(kvMeta.status_updated_at_utc, 80) || getNowIsoUtc(),
      pro_offer: toPlainObject(kvMeta.pro_offer),
    };
    memory.leadMeta.set(normalizedRequestId, normalized);
    return normalized;
  }

  return null;
}

export async function upsertLeadMeta(
  context: APIContext,
  requestId: string,
  patch: {
    status?: unknown;
    status_note?: unknown;
    pro_offer?: unknown;
  },
): Promise<LeadMetaRecord | null> {
  const normalizedRequestId = safeString(requestId, 80).toUpperCase();
  if (!normalizedRequestId) return null;

  const now = getNowIsoUtc();
  const existing = (await getLeadMeta(context, normalizedRequestId)) ?? {
    request_id: normalizedRequestId,
    status: "new" as LeadStatus,
    status_note: "",
    status_updated_at_utc: now,
    pro_offer: null,
  };

  const nextStatus = patch.status === undefined
    ? existing.status
    : normalizeLeadStatus(patch.status);

  const next: LeadMetaRecord = {
    request_id: normalizedRequestId,
    status: nextStatus,
    status_note:
      patch.status_note === undefined
        ? existing.status_note
        : safeString(patch.status_note, 2000),
    status_updated_at_utc: now,
    pro_offer:
      patch.pro_offer === undefined
        ? existing.pro_offer
        : toPlainObject(patch.pro_offer),
  };

  const d1 = getD1(context);
  if (d1) {
    await d1
      .prepare(
        `UPDATE leads
         SET status = ?,
             status_note = ?,
             status_updated_at_utc = ?,
             updated_at_utc = ?
         WHERE request_id = ?`,
      )
      .bind(next.status, next.status_note, next.status_updated_at_utc, now, normalizedRequestId)
      .run();

    if (patch.pro_offer !== undefined) {
      await d1
        .prepare("UPDATE pro_offers SET is_active = 0 WHERE request_id = ?")
        .bind(normalizedRequestId)
        .run();
      await d1
        .prepare(
          `INSERT INTO pro_offers (
            offer_id,
            request_id,
            offer_json,
            scope_json,
            status,
            created_at_utc,
            updated_at_utc,
            is_active
          ) VALUES (?, ?, ?, ?, 'issued', ?, ?, 1)`,
        )
        .bind(
          createRequestId("PO"),
          normalizedRequestId,
          canonicalJson(next.pro_offer ?? {}),
          canonicalJson(toPlainObject((next.pro_offer as JsonRecord | null)?.scope)),
          now,
          now,
        )
        .run();
    }
  } else {
    const memory = ensureMemoryStore();
    memory.leadMeta.set(normalizedRequestId, next);
    await persistKvIfAvailable(context, `${LEAD_META_PREFIX}${normalizedRequestId}`, next);
  }

  return next;
}

export async function transitionLeadStatus(
  context: APIContext,
  requestId: string,
  nextStatusInput: unknown,
  noteInput: unknown,
  actor = "admin_api",
): Promise<{
  ok: boolean;
  reason: string;
  lead_meta: LeadMetaRecord | null;
}> {
  const requestIdNormalized = safeString(requestId, 80).toUpperCase();
  const nextStatus = normalizeLeadStatus(nextStatusInput);
  const note = safeString(noteInput, 2000);

  const meta = await getLeadMeta(context, requestIdNormalized);
  if (!meta) {
    return { ok: false, reason: "Lead metadata not found", lead_meta: null };
  }

  const transition = checkStatusTransition(meta.status, nextStatus);
  if (!transition.ok) {
    return {
      ok: false,
      reason: transition.reason,
      lead_meta: meta,
    };
  }

  const updatedMeta = await upsertLeadMeta(context, requestIdNormalized, {
    status: nextStatus,
    status_note: note || meta.status_note,
  });

  await appendLeadEvent(
    context,
    requestIdNormalized,
    "status_changed",
    {
      from_status: meta.status,
      to_status: nextStatus,
      note,
    },
    actor,
  );

  return {
    ok: true,
    reason: "updated",
    lead_meta: updatedMeta,
  };
}

export async function createLeadProOffer(
  context: APIContext,
  requestId: string,
  offer: JsonRecord,
  actor = "admin_api",
): Promise<{ ok: boolean; reason: string; lead_meta: LeadMetaRecord | null }> {
  const requestIdNormalized = safeString(requestId, 80).toUpperCase();
  if (!requestIdNormalized) {
    return { ok: false, reason: "request_id is required", lead_meta: null };
  }

  const transition = await transitionLeadStatus(
    context,
    requestIdNormalized,
    "pro_offered",
    "21-Day Decision Governance Pilot offer issued",
    actor,
  );

  if (!transition.ok || !transition.lead_meta) {
    return transition;
  }

  const now = getNowIsoUtc();
  const d1 = getD1(context);

  if (d1) {
    await d1
      .prepare("UPDATE pro_offers SET is_active = 0 WHERE request_id = ?")
      .bind(requestIdNormalized)
      .run();

    await d1
      .prepare(
        `INSERT INTO pro_offers (
          offer_id,
          request_id,
          offer_json,
          scope_json,
          status,
          created_at_utc,
          updated_at_utc,
          is_active
        ) VALUES (?, ?, ?, ?, 'issued', ?, ?, 1)`,
      )
      .bind(
        createRequestId("PO"),
        requestIdNormalized,
        canonicalJson(offer),
        canonicalJson(toPlainObject(offer.scope)),
        now,
        now,
      )
      .run();
  }

  const meta = await upsertLeadMeta(context, requestIdNormalized, {
    pro_offer: offer,
  });

  await appendLeadEvent(
    context,
    requestIdNormalized,
    "pro_offer_created",
    {
      offer,
    },
    actor,
  );

  return {
    ok: true,
    reason: "offer_created",
    lead_meta: meta,
  };
}

export async function listWeeklyMetrics(
  context: APIContext,
  weekStartIso?: string,
): Promise<Record<string, string | number | null>> {
  const d1 = getD1(context);
  if (!d1) {
    return {};
  }

  const targetWeek = safeString(weekStartIso, 32);
  const week = targetWeek || getMondayUtcIso(new Date());
  const rows = await d1All<{ metric_key: string; metric_value: string }>(
    d1
      .prepare(
        `SELECT metric_key, metric_value
         FROM weekly_metrics
         WHERE week_start_iso = ?`,
      )
      .bind(week),
  );

  const out: Record<string, string | number | null> = {
    week_start_iso: week,
  };
  for (const row of rows) {
    const key = safeString(row.metric_key, 120);
    const raw = safeString(row.metric_value, 240);
    const numeric = Number(raw);
    out[key] = Number.isFinite(numeric) ? numeric : raw;
  }

  return out;
}

function getMondayUtcIso(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function getGateStatusMap(
  context: APIContext,
  gateNames: string[],
): Promise<Record<string, { status: string; checked_at_utc: string; hard_fail: number }>> {
  const d1 = getD1(context);
  const map: Record<string, { status: string; checked_at_utc: string; hard_fail: number }> = {};
  if (!d1 || gateNames.length === 0) {
    return map;
  }

  for (const gateNameRaw of gateNames) {
    const gateName = safeString(gateNameRaw, 80);
    if (!gateName) continue;
    const row = await d1First<{
      status: string;
      checked_at_utc: string;
      hard_fail: number;
    }>(
      d1
        .prepare(
          `SELECT status, checked_at_utc, hard_fail
           FROM release_gates
           WHERE gate_name = ?
           LIMIT 1`,
        )
        .bind(gateName),
    );
    if (!row) continue;
    map[gateName] = {
      status: safeString(row.status, 40) || "unknown",
      checked_at_utc: safeString(row.checked_at_utc, 80),
      hard_fail: Number(row.hard_fail ?? 0) || 0,
    };
  }

  return map;
}

export async function upsertGateStatus(
  context: APIContext,
  gateName: string,
  status: string,
  reportPath: string,
  details: JsonRecord,
  hardFail = false,
): Promise<void> {
  const d1 = getD1(context);
  if (!d1) return;

  const now = getNowIsoUtc();
  await d1
    .prepare(
      `INSERT INTO release_gates (
        gate_name,
        status,
        checked_at_utc,
        report_path,
        details_json,
        hard_fail
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(gate_name) DO UPDATE SET
        status = excluded.status,
        checked_at_utc = excluded.checked_at_utc,
        report_path = excluded.report_path,
        details_json = excluded.details_json,
        hard_fail = excluded.hard_fail`,
    )
    .bind(
      safeString(gateName, 80),
      safeString(status, 40),
      now,
      safeString(reportPath, 400),
      canonicalJson(details),
      hardFail ? 1 : 0,
    )
    .run();
}

export async function upsertWeeklyMetric(
  context: APIContext,
  weekStartIso: string,
  metricKey: string,
  metricValue: string | number,
  source: string,
): Promise<void> {
  const d1 = getD1(context);
  if (!d1) return;

  const now = getNowIsoUtc();
  await d1
    .prepare(
      `INSERT INTO weekly_metrics (
        week_start_iso,
        metric_key,
        metric_value,
        source,
        updated_at_utc
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(week_start_iso, metric_key) DO UPDATE SET
        metric_value = excluded.metric_value,
        source = excluded.source,
        updated_at_utc = excluded.updated_at_utc`,
    )
    .bind(
      safeString(weekStartIso, 32),
      safeString(metricKey, 120),
      String(metricValue),
      safeString(source, 120),
      now,
    )
    .run();
}
