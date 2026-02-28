#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const OPS_ROOT = path.join(SITE_ROOT, "ops", "no1");
const REPORT_PATH = process.env.P11_RELIABILITY_REPORT || "/tmp/erain_reliability_slo_report.json";

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
const rows = parseCsv(path.join(OPS_ROOT, "trackers", "model_reliability_weekly.csv"));
const latest = latestByWeek(rows);

const report = {
  generated_at: new Date().toISOString(),
  gate: "p11",
  status: "pass",
  hard_fail: false,
  latest_week: latest?.week_start_iso || null,
  checks: [],
  failures: [],
  warnings: [],
  metrics: latest || null,
  corrective_actions: [],
};

function record(name, ok, details, hardFail = false) {
  report.checks.push({ name, ok, details, hard_fail: hardFail });
  if (ok) {
    pass(name);
    return;
  }
  if (hardFail) {
    report.hard_fail = true;
  }
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

if (!latest) {
  record("model reliability tracker has latest row", false, { reason: "no rows" }, true);
} else {
  const availability = parseNum(latest.availability_percent);
  const fallbackSuccess = parseNum(latest.fallback_success_percent);
  const p95Latency = parseNum(latest.p95_latency_ms);
  const p0Incidents = parseNum(latest.p0_incidents);
  const failoverTriggers = parseNum(latest.failover_trigger_count);

  record(
    `availability_percent >= ${thresholds.reliability_availability_percent_min}`,
    availability >= Number(thresholds.reliability_availability_percent_min),
    { actual: availability, threshold: thresholds.reliability_availability_percent_min },
    true,
  );

  record(
    `fallback_success_percent >= ${thresholds.reliability_fallback_success_percent_min}`,
    fallbackSuccess >= Number(thresholds.reliability_fallback_success_percent_min),
    { actual: fallbackSuccess, threshold: thresholds.reliability_fallback_success_percent_min },
    true,
  );

  record(
    `p95_latency_ms <= ${thresholds.reliability_p95_latency_ms_max}`,
    p95Latency <= Number(thresholds.reliability_p95_latency_ms_max),
    { actual: p95Latency, threshold: thresholds.reliability_p95_latency_ms_max },
  );

  record(
    `p0_incidents <= ${thresholds.reliability_p0_incidents_max}`,
    p0Incidents <= Number(thresholds.reliability_p0_incidents_max),
    { actual: p0Incidents, threshold: thresholds.reliability_p0_incidents_max },
    true,
  );

  recordWarn("failover trigger count captured", Number.isFinite(failoverTriggers), {
    actual: failoverTriggers,
  });

  if (report.failures.length) {
    report.corrective_actions.push("Stabilize provider failover and remove error-path latency spikes.");
  }
  if (p0Incidents > 0) {
    report.corrective_actions.push("Run incident postmortem and block release until remediation closes.");
  }
}

report.status = report.failures.length ? "fail" : report.warnings.length ? "attention" : "pass";
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
process.stdout.write(`Report: ${REPORT_PATH}\n`);

if (report.failures.length > 0) {
  process.exit(1);
}
