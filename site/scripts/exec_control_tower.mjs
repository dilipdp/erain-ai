#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const OPS_ROOT = path.join(SITE_ROOT, "ops", "no1");
const REPORT_PATH = process.env.P13_EXEC_REPORT || "/tmp/erain_exec_control_tower_report.json";

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

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

function gateStatus(report, defaultName) {
  if (!report) return { gate: defaultName, status: "missing", hard_fail: false, corrective_actions: [] };
  const raw = String(report.status || report.summary?.status || report.overall_status || "unknown").toLowerCase();
  const normalized = raw.includes("fail") || raw === "no-go" || raw === "no_go"
    ? "fail"
    : raw.includes("attention") || raw.includes("go_with_actions")
    ? "attention"
    : raw.includes("pass") || raw === "go"
    ? "pass"
    : "unknown";
  const actions = Array.isArray(report.corrective_actions)
    ? report.corrective_actions
    : Array.isArray(report.next_actions)
    ? report.next_actions.map((a) => a.action || a.reason || "action")
    : [];
  return {
    gate: defaultName,
    status: normalized,
    hard_fail: Boolean(report.hard_fail),
    corrective_actions: actions,
  };
}

const p8 = readJson(process.env.P8_NO1_COMMAND_CENTER_REPORT || "/tmp/erain_no1_command_center_report.json");
const p10 = readJson(process.env.P10_NICHE_REPORT || "/tmp/erain_niche_leadership_report.json");
const p11 = readJson(process.env.P11_RELIABILITY_REPORT || "/tmp/erain_reliability_slo_report.json");
const p12 = readJson(process.env.P12_COMMERCIAL_REPORT || "/tmp/erain_commercial_quality_report.json");
const p9 = readJson(process.env.P9_GLOBAL_STANDARD_REPORT || "/tmp/erain_global_standard_gate_report.json");

const revenueRows = parseCsv(path.join(OPS_ROOT, "trackers", "revenue-weekly.csv"));
const proofRows = parseCsv(path.join(OPS_ROOT, "trackers", "proof-publishing.csv"));
const deliveryRows = parseCsv(path.join(OPS_ROOT, "trackers", "delivery-cadence.csv"));
const reliabilityRows = parseCsv(path.join(OPS_ROOT, "trackers", "model_reliability_weekly.csv"));

const latestRevenue = latestByWeek(revenueRows);
const latestProof = latestByWeek(proofRows);
const latestDelivery = latestByWeek(deliveryRows);
const latestReliability = latestByWeek(reliabilityRows);

const gates = [
  gateStatus(p8, "p8"),
  gateStatus(p9, "p9"),
  gateStatus(p10, "p10"),
  gateStatus(p11, "p11"),
  gateStatus(p12, "p12"),
];

const hardFail = gates.some((g) => (g.gate === "p11" || g.gate === "p12") && (g.hard_fail || g.status === "fail"));
const hasFail = gates.some((g) => g.status === "fail" || g.status === "missing");
const hasAttention = gates.some((g) => g.status === "attention" || g.status === "unknown");

let decision = "GO";
if (hardFail || hasFail) {
  decision = "NO-GO";
} else if (hasAttention) {
  decision = "GO-WITH-ACTIONS";
}

const namedProofCount = proofRows.filter((row) => String(row.is_named || "").toLowerCase() === "yes").length;
const publishedProofCount = proofRows.filter((row) => String(row.status || "").toLowerCase() === "published").length;

const report = {
  generated_at: new Date().toISOString(),
  gate: "p13",
  decision,
  week_start_iso: latestRevenue?.week_start_iso || latestProof?.week_start_iso || latestDelivery?.week_start_iso || null,
  summary: {
    logos: parseNum(latestRevenue?.deals_closed || "0"),
    booked_revenue_inr: parseNum(latestRevenue?.booked_revenue_inr || "0"),
    proof_count_named: namedProofCount,
    proof_count_published: publishedProofCount,
    time_to_value_days_p50: parseNum(latestDelivery?.time_to_value_days || "0"),
    reliability_risk: parseNum(latestReliability?.p0_incidents || "0") > 0 ? "high" : "low",
  },
  gates,
  top_corrective_actions: gates
    .flatMap((g) => g.corrective_actions || [])
    .filter(Boolean)
    .slice(0, 6),
};

if (hardFail) {
  report.top_corrective_actions.unshift("Resolve p11/p12 hard fail before release.");
}

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
process.stdout.write(`Report: ${REPORT_PATH}\n`);
process.stdout.write(`Decision: ${decision}\n`);

if (decision === "NO-GO") {
  process.exit(1);
}
