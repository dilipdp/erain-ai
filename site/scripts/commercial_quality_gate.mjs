#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const OPS_ROOT = path.join(SITE_ROOT, "ops", "no1");
const REPORT_PATH = process.env.P12_COMMERCIAL_REPORT || "/tmp/erain_commercial_quality_report.json";

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((v) => v.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = (values[i] || "").trim();
    }
    return row;
  });
}

function parseNum(v) {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
}

function latestByWeek(rows, field = "week_start_iso") {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => Date.parse(a[field] || "") - Date.parse(b[field] || ""));
  return sorted[sorted.length - 1] || null;
}

function pass(msg) {
  process.stdout.write(`PASS: ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL: ${msg}\n`);
}

function warn(msg) {
  process.stdout.write(`WARN: ${msg}\n`);
}

const thresholds = JSON.parse(
  fs.readFileSync(path.join(OPS_ROOT, "config", "no1-thresholds.json"), "utf8"),
);
const outboundRows = parseCsv(path.join(OPS_ROOT, "trackers", "outbound-weekly.csv"));
const pipelineRows = parseCsv(path.join(OPS_ROOT, "trackers", "pilot-pipeline.csv"));
const referenceRows = parseCsv(path.join(OPS_ROOT, "trackers", "reference-call-weekly.csv"));
const deliveryRows = parseCsv(path.join(OPS_ROOT, "trackers", "delivery-cadence.csv"));

const latestOutbound = latestByWeek(outboundRows);
const latestReference = latestByWeek(referenceRows);

const report = {
  generated_at: new Date().toISOString(),
  gate: "p12",
  status: "pass",
  hard_fail: false,
  latest_week: latestOutbound?.week_start_iso || latestReference?.week_start_iso || null,
  checks: [],
  failures: [],
  warnings: [],
  corrective_actions: [],
  summary: {
    outbound_messages: latestOutbound ? parseNum(latestOutbound.messages_sent) : null,
    reference_close_rate_percent: latestReference ? parseNum(latestReference.close_rate_percent) : null,
    pipeline_rows: pipelineRows.length,
    delivery_rows: deliveryRows.length,
  },
};

function record(name, ok, details, hardFail = false) {
  report.checks.push({ name, ok, details, hard_fail: hardFail });
  if (ok) {
    pass(name);
    return;
  }
  if (hardFail) report.hard_fail = true;
  report.failures.push({ name, details, hard_fail: hardFail });
  fail(name);
}

function recordWarn(name, ok, details) {
  report.checks.push({ name, ok, details, severity: "warning" });
  if (ok) {
    pass(name);
    return;
  }
  report.warnings.push({ name, details });
  warn(name);
}

if (!latestOutbound) {
  record("outbound tracker has latest row", false, { reason: "no rows" }, true);
} else {
  const messagesSent = parseNum(latestOutbound.messages_sent);
  record(
    `messages_sent >= ${thresholds.outbound_messages_weekly_min}`,
    messagesSent >= Number(thresholds.outbound_messages_weekly_min),
    { actual: messagesSent, threshold: thresholds.outbound_messages_weekly_min },
  );
}

if (!latestReference) {
  recordWarn("reference-call tracker has latest row", false, { reason: "no rows" });
} else {
  const closeRate = parseNum(latestReference.close_rate_percent);
  recordWarn(
    `reference close rate >= ${thresholds.commercial_reference_call_close_percent_min}`,
    closeRate >= Number(thresholds.commercial_reference_call_close_percent_min),
    { actual: closeRate, threshold: thresholds.commercial_reference_call_close_percent_min },
  );
}

const signedOrOpenRows = pipelineRows.filter((row) => {
  const s = String(row.status || "").toLowerCase();
  return s === "signed" || s === "in_review" || s === "proposal";
});

const maxDiscount = signedOrOpenRows.reduce((acc, row) => {
  const val = parseNum(row.discount_percent);
  if (!Number.isFinite(val)) return acc;
  return Math.max(acc, val);
}, 0);

record(
  `discount percent <= ${thresholds.commercial_discount_percent_max}`,
  maxDiscount <= Number(thresholds.commercial_discount_percent_max),
  { actual: maxDiscount, threshold: thresholds.commercial_discount_percent_max },
  true,
);

const unapprovedScopeExceptions = signedOrOpenRows.filter((row) => {
  const requested = String(row.scope_exception_requested || "").toLowerCase() === "yes";
  const approved = String(row.scope_exception_approved || "").toLowerCase() === "yes";
  return requested && !approved;
}).length;

record(
  `unapproved scope exceptions <= ${thresholds.commercial_scope_exception_unapproved_max}`,
  unapprovedScopeExceptions <= Number(thresholds.commercial_scope_exception_unapproved_max),
  { actual: unapprovedScopeExceptions, threshold: thresholds.commercial_scope_exception_unapproved_max },
  true,
);

recordWarn("delivery cadence tracker has active rows", deliveryRows.length > 0, {
  rows: deliveryRows.length,
});

if (report.failures.length > 0) {
  report.corrective_actions.push("Fix commercial policy violations (discount/scope) before release.");
}
if (report.warnings.length > 0) {
  report.corrective_actions.push("Raise outbound + reference-close efficiency to target.");
}

report.status = report.failures.length ? "fail" : report.warnings.length ? "attention" : "pass";
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
process.stdout.write(`Report: ${REPORT_PATH}\n`);

if (report.failures.length > 0) {
  process.exit(1);
}
