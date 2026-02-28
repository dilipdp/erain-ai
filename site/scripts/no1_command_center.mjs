#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const OPS_ROOT = path.join(SITE_ROOT, "ops", "no1");

function usage() {
  process.stdout.write(`Usage: node scripts/no1_command_center.mjs [options]\n\n`);
  process.stdout.write(`Options:\n`);
  process.stdout.write(`  --report <path>       JSON report output (default: /tmp/erain_no1_command_center_report.json)\n`);
  process.stdout.write(`  --brief <path>        Markdown brief output (default: /tmp/erain_no1_weekly_brief.md)\n`);
  process.stdout.write(`  --gate-report <path>  Input from p7 gate (default: /tmp/erain_no1_operating_report.json)\n`);
  process.stdout.write(`  --max-age-days <n>    Max tracker file age (default: 8)\n`);
  process.stdout.write(`  --help                Show help\n`);
}

const args = process.argv.slice(2);
let reportPath = process.env.P8_NO1_COMMAND_CENTER_REPORT || "/tmp/erain_no1_command_center_report.json";
let briefPath = process.env.P8_NO1_WEEKLY_BRIEF || "/tmp/erain_no1_weekly_brief.md";
let gateReportPath = process.env.P7_NO1_REPORT || "/tmp/erain_no1_operating_report.json";
let maxAgeDays = Number(process.env.P8_NO1_MAX_AGE_DAYS || 8);

for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a === "--report") {
    reportPath = args[++i];
    continue;
  }
  if (a === "--brief") {
    briefPath = args[++i];
    continue;
  }
  if (a === "--gate-report") {
    gateReportPath = args[++i];
    continue;
  }
  if (a === "--max-age-days") {
    maxAgeDays = Number(args[++i]);
    continue;
  }
  if (a === "--help" || a === "-h") {
    usage();
    process.exit(0);
  }
  process.stderr.write(`Unknown option: ${a}\n`);
  usage();
  process.exit(1);
}

if (!Number.isFinite(maxAgeDays) || maxAgeDays < 1) {
  process.stderr.write(`Invalid --max-age-days value: ${String(maxAgeDays)}\n`);
  process.exit(1);
}

const requiredTrackers = [
  "trackers/lead-response.csv",
  "trackers/revenue-weekly.csv",
  "trackers/customer-expansion.csv",
  "trackers/case-studies.csv",
  "trackers/scoreboard-weekly.csv",
  "trackers/outbound-weekly.csv",
  "trackers/pilot-pipeline.csv",
  "trackers/delivery-cadence.csv",
  "trackers/proof-publishing.csv",
  "trackers/model_reliability_weekly.csv",
  "trackers/reference-call-weekly.csv",
];

function pass(msg) {
  process.stdout.write(`PASS: ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL: ${msg}\n`);
}

function warn(msg) {
  process.stdout.write(`WARN: ${msg}\n`);
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((v) => v.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(",");
    const row = {};
    for (let h = 0; h < headers.length; h += 1) {
      row[headers[h]] = (values[h] || "").trim();
    }
    rows.push(row);
  }
  return rows;
}

function parseNumber(value) {
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : NaN;
}

function latestByWeek(rows, weekField = "week_start_iso") {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => Date.parse(a[weekField] || "") - Date.parse(b[weekField] || ""));
  return sorted[sorted.length - 1];
}

function dayDiff(fromMs, toMs) {
  return (toMs - fromMs) / (1000 * 60 * 60 * 24);
}

function safeReadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

const now = new Date();
const nowMs = now.getTime();
const thresholdsPath = path.join(OPS_ROOT, "config", "no1-thresholds.json");
const thresholds = safeReadJson(thresholdsPath) || {};

const report = {
  generated_at: now.toISOString(),
  ops_root: OPS_ROOT,
  inputs: {
    gate_report_path: gateReportPath,
    max_age_days: maxAgeDays,
  },
  freshness: [],
  metrics: {},
  failures: [],
  warnings: [],
  next_actions: [],
  summary: {
    status: "pass",
    fail_count: 0,
    warning_count: 0,
  },
};

function addFailure(name, details = {}) {
  report.failures.push({ name, details });
  fail(name);
}

function addWarning(name, details = {}) {
  report.warnings.push({ name, details });
  warn(name);
}

for (const rel of requiredTrackers) {
  const abs = path.join(OPS_ROOT, rel);
  if (!fs.existsSync(abs)) {
    addFailure(`missing tracker file: ${rel}`, { path: abs });
    report.freshness.push({ file: rel, status: "missing" });
    continue;
  }
  const stat = fs.statSync(abs);
  const ageDays = dayDiff(stat.mtimeMs, nowMs);
  const stale = ageDays > maxAgeDays;
  report.freshness.push({
    file: rel,
    mtime_utc: new Date(stat.mtimeMs).toISOString(),
    age_days: Number(ageDays.toFixed(2)),
    status: stale ? "stale" : "fresh",
  });
  if (stale) {
    addFailure(`stale tracker: ${rel}`, {
      age_days: Number(ageDays.toFixed(2)),
      max_age_days: maxAgeDays,
    });
  } else {
    pass(`fresh tracker: ${rel}`);
  }
}

const leadRows = fs.existsSync(path.join(OPS_ROOT, "trackers/lead-response.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/lead-response.csv"))
  : [];
const revenueRows = fs.existsSync(path.join(OPS_ROOT, "trackers/revenue-weekly.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/revenue-weekly.csv"))
  : [];
const expansionRows = fs.existsSync(path.join(OPS_ROOT, "trackers/customer-expansion.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/customer-expansion.csv"))
  : [];
const caseRows = fs.existsSync(path.join(OPS_ROOT, "trackers/case-studies.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/case-studies.csv"))
  : [];
const scoreRows = fs.existsSync(path.join(OPS_ROOT, "trackers/scoreboard-weekly.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/scoreboard-weekly.csv"))
  : [];
const outboundRows = fs.existsSync(path.join(OPS_ROOT, "trackers/outbound-weekly.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/outbound-weekly.csv"))
  : [];
const pipelineRows = fs.existsSync(path.join(OPS_ROOT, "trackers/pilot-pipeline.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/pilot-pipeline.csv"))
  : [];
const deliveryRows = fs.existsSync(path.join(OPS_ROOT, "trackers/delivery-cadence.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/delivery-cadence.csv"))
  : [];
const proofRows = fs.existsSync(path.join(OPS_ROOT, "trackers/proof-publishing.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/proof-publishing.csv"))
  : [];
const reliabilityRows = fs.existsSync(path.join(OPS_ROOT, "trackers/model_reliability_weekly.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/model_reliability_weekly.csv"))
  : [];
const referenceRows = fs.existsSync(path.join(OPS_ROOT, "trackers/reference-call-weekly.csv"))
  ? parseCsv(path.join(OPS_ROOT, "trackers/reference-call-weekly.csv"))
  : [];

if (leadRows.length === 0) addFailure("lead-response tracker has no rows");
if (revenueRows.length === 0) addFailure("revenue-weekly tracker has no rows");
if (expansionRows.length === 0) addFailure("customer-expansion tracker has no rows");
if (caseRows.length === 0) addFailure("case-studies tracker has no rows");
if (scoreRows.length === 0) addFailure("scoreboard-weekly tracker has no rows");
if (outboundRows.length === 0) addFailure("outbound-weekly tracker has no rows");
if (pipelineRows.length === 0) addFailure("pilot-pipeline tracker has no rows");
if (deliveryRows.length === 0) addFailure("delivery-cadence tracker has no rows");
if (proofRows.length === 0) addFailure("proof-publishing tracker has no rows");
if (reliabilityRows.length === 0) addFailure("model-reliability tracker has no rows");
if (referenceRows.length === 0) addFailure("reference-call tracker has no rows");

const latestScore = latestByWeek(scoreRows);
const latestRevenue = latestByWeek(revenueRows);
const latestOutbound = latestByWeek(outboundRows);
const latestDelivery = latestByWeek(deliveryRows);
const latestReference = latestByWeek(referenceRows);
const latestReliability = latestByWeek(reliabilityRows);

const leadLatestWeek = latestScore?.week_start_iso || null;
const leadInWeek = leadRows.filter((r) => (r.week_start_iso || "") === leadLatestWeek);
const leadSlaComputed = leadInWeek.length
  ? (leadInWeek.filter((r) => parseNumber(r.response_minutes) <= 60).length / leadInWeek.length) * 100
  : NaN;

report.metrics.latest_week = leadLatestWeek;
report.metrics.scoreboard = latestScore || null;
report.metrics.revenue = latestRevenue || null;
report.metrics.lead_sla_computed_percent = Number.isFinite(leadSlaComputed)
  ? Number(leadSlaComputed.toFixed(2))
  : null;
report.metrics.outbound = latestOutbound || null;
report.metrics.delivery = latestDelivery || null;
report.metrics.reference = latestReference || null;
report.metrics.reliability = latestReliability || null;

if (latestScore) {
  const metricChecks = [
    {
      key: "lead_response_sla_percent",
      actual: parseNumber(latestScore.lead_response_sla_percent),
      threshold: Number(thresholds.lead_response_sla_percent_min),
      op: ">=",
      ok: parseNumber(latestScore.lead_response_sla_percent) >= Number(thresholds.lead_response_sla_percent_min),
    },
    {
      key: "request_conversion_percent",
      actual: parseNumber(latestScore.request_conversion_percent),
      threshold: Number(thresholds.request_conversion_percent_min),
      op: ">=",
      ok: parseNumber(latestScore.request_conversion_percent) >= Number(thresholds.request_conversion_percent_min),
    },
    {
      key: "pro_conversion_percent",
      actual: parseNumber(latestScore.pro_conversion_percent),
      threshold: Number(thresholds.pro_conversion_percent_min),
      op: ">=",
      ok: parseNumber(latestScore.pro_conversion_percent) >= Number(thresholds.pro_conversion_percent_min),
    },
    {
      key: "delivery_days_median",
      actual: parseNumber(latestScore.delivery_days_median),
      threshold: Number(thresholds.delivery_days_median_max),
      op: "<=",
      ok: parseNumber(latestScore.delivery_days_median) <= Number(thresholds.delivery_days_median_max),
    },
    {
      key: "weekly_new_pipeline_inr",
      actual: parseNumber(latestScore.weekly_new_pipeline_inr),
      threshold: Number(thresholds.weekly_new_pipeline_inr_min),
      op: ">=",
      ok: parseNumber(latestScore.weekly_new_pipeline_inr) >= Number(thresholds.weekly_new_pipeline_inr_min),
    },
  ];

  report.metrics.threshold_checks = metricChecks;
  for (const check of metricChecks) {
    if (check.ok) {
      pass(`threshold ${check.key} ${check.op} ${check.threshold}`);
    } else {
      addFailure(`threshold breach: ${check.key} ${check.op} ${check.threshold}`, {
        actual: check.actual,
        threshold: check.threshold,
      });
    }
  }

  const targetNamed = Number(thresholds.named_case_studies_count_target || 1);
  const actualNamed = parseNumber(latestScore.named_case_studies_count);
  if (!(actualNamed >= targetNamed)) {
    addWarning(`credibility gap: named case studies < ${targetNamed}`, {
      actual: actualNamed,
      target: targetNamed,
    });
  } else {
    pass(`named case studies target met (${actualNamed})`);
  }

  if (Number.isFinite(leadSlaComputed)) {
    const reportedLeadSla = parseNumber(latestScore.lead_response_sla_percent);
    const drift = Math.abs(reportedLeadSla - leadSlaComputed);
    if (drift > 5) {
      addWarning("scoreboard drift: lead SLA differs from lead-response tracker", {
        computed: Number(leadSlaComputed.toFixed(2)),
        reported: reportedLeadSla,
        drift,
      });
    }
  }
}

if (latestRevenue) {
  const pipeline = parseNumber(latestRevenue.new_pipeline_inr);
  if (!(pipeline >= Number(thresholds.weekly_new_pipeline_inr_min))) {
    addFailure("pipeline below threshold in revenue tracker", {
      actual: pipeline,
      threshold: Number(thresholds.weekly_new_pipeline_inr_min),
    });
  }
}

if (latestOutbound) {
  const sent = parseNumber(latestOutbound.messages_sent);
  if (!(sent >= Number(thresholds.outbound_messages_weekly_min || 125))) {
    addWarning("outbound volume below weekly floor", {
      actual: sent,
      threshold: Number(thresholds.outbound_messages_weekly_min || 125),
    });
  }
}

if (latestDelivery) {
  const ttv = parseNumber(latestDelivery.time_to_value_days);
  if (!(ttv <= Number(thresholds.p50_time_to_value_days_max || 18))) {
    addWarning("time-to-value above compressed target", {
      actual: ttv,
      threshold: Number(thresholds.p50_time_to_value_days_max || 18),
    });
  }
}

if (latestReference) {
  const closeRate = parseNumber(latestReference.close_rate_percent);
  if (!(closeRate >= Number(thresholds.commercial_reference_call_close_percent_min || 35))) {
    addWarning("reference close rate below target", {
      actual: closeRate,
      threshold: Number(thresholds.commercial_reference_call_close_percent_min || 35),
    });
  }
}

const expansionWindows = new Set(
  expansionRows
    .map((r) => parseNumber(r.review_window_days))
    .filter((n) => Number.isFinite(n))
    .map((n) => (n <= 30 ? 30 : n <= 60 ? 60 : n <= 90 ? 90 : 91)),
);
const hasFullWindows = expansionWindows.has(30) && expansionWindows.has(60) && expansionWindows.has(90);
if (!hasFullWindows) {
  addWarning("expansion cadence incomplete: 30/60/90 windows not all present", {
    windows_seen: Array.from(expansionWindows.values()).sort((a, b) => a - b),
  });
} else {
  pass("expansion cadence includes 30/60/90 windows");
}

const hasNamedCase = caseRows.some((r) => String(r.named_client_approved || "").toLowerCase() === "yes");
if (!hasNamedCase) {
  addWarning("no named published case study yet", {
    total_cases: caseRows.length,
  });
}

const gateReport = safeReadJson(gateReportPath);
if (!gateReport) {
  addWarning("p7 gate report not found or unreadable", {
    gate_report_path: gateReportPath,
  });
} else {
  report.metrics.p7_gate_summary = gateReport.summary || null;
  if ((gateReport.summary || {}).status === "fail") {
    addFailure("p7 operating gate status is fail", {
      gate_report_path: gateReportPath,
    });
  }
}

function addAction(priority, owner, action, dueDays, reason) {
  const due = new Date(nowMs + dueDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  report.next_actions.push({ priority, owner, action, due_date: due, reason });
}

for (const f of report.failures) {
  if (f.name.startsWith("stale tracker:")) {
    addAction("P0", "ops_owner", "Update stale tracker and commit latest weekly row", 1, f.name);
  }
  if (f.name.startsWith("threshold breach:")) {
    addAction("P0", "founder", "Run threshold recovery plan and assign owner-level correction", 2, f.name);
  }
}

for (const w of report.warnings) {
  if (String(w.name).includes("named case")) {
    addAction("P1", "founder", "Convert one anonymized case into named publishable evidence", 7, w.name);
  }
  if (String(w.name).includes("expansion cadence")) {
    addAction("P1", "delivery_lead", "Populate missing 60/90-day expansion checkpoints", 3, w.name);
  }
}

report.summary.fail_count = report.failures.length;
report.summary.warning_count = report.warnings.length;
report.summary.status = report.failures.length > 0 ? "fail" : report.warnings.length > 0 ? "attention" : "pass";

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const lines = [];
lines.push(`# EraIn Weekly Command Brief (${now.toISOString().slice(0, 10)})`);
lines.push("");
lines.push(`Status: **${report.summary.status.toUpperCase()}**`);
lines.push("");

if (latestScore) {
  lines.push("## Scoreboard Snapshot");
  lines.push(`- Week: ${latestScore.week_start_iso || "n/a"}`);
  lines.push(`- Lead response SLA: ${latestScore.lead_response_sla_percent || "n/a"}% (computed: ${report.metrics.lead_sla_computed_percent ?? "n/a"}%)`);
  lines.push(`- Request conversion: ${latestScore.request_conversion_percent || "n/a"}%`);
  lines.push(`- Pro conversion: ${latestScore.pro_conversion_percent || "n/a"}%`);
  lines.push(`- Delivery median: ${latestScore.delivery_days_median || "n/a"} days`);
  lines.push(`- Named case studies: ${latestScore.named_case_studies_count || "n/a"}`);
  lines.push(`- New pipeline: INR ${latestScore.weekly_new_pipeline_inr || "n/a"}`);
  if (latestOutbound) {
    lines.push(`- Outbound messages: ${latestOutbound.messages_sent || "n/a"}`);
  }
  if (latestDelivery) {
    lines.push(`- Time-to-value (days): ${latestDelivery.time_to_value_days || "n/a"}`);
  }
  if (latestReference) {
    lines.push(`- Reference-call close rate: ${latestReference.close_rate_percent || "n/a"}%`);
  }
  if (latestReliability) {
    lines.push(`- Availability: ${latestReliability.availability_percent || "n/a"}%`);
  }
  lines.push("");
}

lines.push("## Failures");
if (report.failures.length === 0) {
  lines.push("- None");
} else {
  for (const f of report.failures) {
    lines.push(`- ${f.name}`);
  }
}
lines.push("");

lines.push("## Warnings");
if (report.warnings.length === 0) {
  lines.push("- None");
} else {
  for (const w of report.warnings) {
    lines.push(`- ${w.name}`);
  }
}
lines.push("");

lines.push("## Next 7 Days");
if (report.next_actions.length === 0) {
  lines.push("- Keep weekly tracker updates and maintain threshold discipline.");
} else {
  for (const item of report.next_actions) {
    lines.push(`- [${item.priority}] ${item.action} (owner: ${item.owner}, due: ${item.due_date})`);
  }
}
lines.push("");
lines.push(`Artifacts: ${reportPath}`);

fs.writeFileSync(briefPath, `${lines.join("\n")}\n`);
process.stdout.write(`Report: ${reportPath}\n`);
process.stdout.write(`Brief: ${briefPath}\n`);

if (report.failures.length > 0) {
  process.exit(1);
}
pass("No.1 command center brief generated");
