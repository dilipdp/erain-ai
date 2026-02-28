#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const REPO_ROOT = path.resolve(SITE_ROOT, "..");
const OPS_ROOT = path.join(SITE_ROOT, "ops", "no1");
const REPORT_PATH = process.env.P10_NICHE_REPORT || "/tmp/erain_niche_leadership_report.json";

function pass(msg) {
  process.stdout.write(`PASS: ${msg}\n`);
}

function warn(msg) {
  process.stdout.write(`WARN: ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL: ${msg}\n`);
}

function readCsv(filePath) {
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

function addAction(report, priority, owner, action, reason) {
  report.next_actions.push({ priority, owner, action, reason });
}

function main() {
  const report = {
    generated_at: new Date().toISOString(),
    checks: [],
    failures: [],
    warnings: [],
    next_actions: [],
    summary: {
      status: "pass",
      pass_count: 0,
      fail_count: 0,
      warning_count: 0,
    },
  };

  const requiredFiles = [
    path.join(REPO_ROOT, "docs", "roadmap", "niche-leadership-plan.md"),
    path.join(OPS_ROOT, "playbooks", "category-leadership-sprint.md"),
    path.join(OPS_ROOT, "trackers", "niche-leadership-weekly.csv"),
    path.join(OPS_ROOT, "config", "no1-thresholds.json"),
  ];

  const record = (name, ok, details = {}) => {
    report.checks.push({ name, ok, details });
    if (ok) {
      pass(name);
      report.summary.pass_count += 1;
      return;
    }
    fail(name);
    report.summary.fail_count += 1;
    report.failures.push({ name, details });
  };

  const recordWarn = (name, ok, details = {}) => {
    report.checks.push({ name, ok, details, severity: "warning" });
    if (ok) {
      pass(name);
      report.summary.pass_count += 1;
      return;
    }
    warn(name);
    report.summary.warning_count += 1;
    report.warnings.push({ name, details });
  };

  for (const filePath of requiredFiles) {
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    record(`asset exists: ${path.relative(REPO_ROOT, filePath)}`, exists && size > 0, {
      path: filePath,
      exists,
      size_bytes: size,
    });
  }

  const thresholdsPath = path.join(OPS_ROOT, "config", "no1-thresholds.json");
  let thresholds = {};
  try {
    thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
    record("threshold config parse", true);
  } catch (error) {
    record("threshold config parse", false, { error: String(error?.message || error) });
  }

  const trackerPath = path.join(OPS_ROOT, "trackers", "niche-leadership-weekly.csv");
  let rows = [];
  try {
    rows = readCsv(trackerPath);
    record("niche leadership tracker has rows", rows.length > 0, { rows: rows.length });
  } catch (error) {
    record("niche leadership tracker has rows", false, { error: String(error?.message || error) });
  }

  const latest = latestByWeek(rows);
  if (latest) {
    const checks = [
      {
        key: "named_case_studies_public",
        op: ">=",
        actual: parseNum(latest.named_case_studies_public),
        threshold: Number(thresholds.niche_named_case_studies_public_min ?? 1),
      },
      {
        key: "p50_time_to_value_days",
        op: "<=",
        actual: parseNum(latest.p50_time_to_value_days),
        threshold: Number(thresholds.niche_p50_time_to_value_days_max ?? 21),
      },
      {
        key: "reference_call_to_close_percent",
        op: ">=",
        actual: parseNum(latest.reference_call_to_close_percent),
        threshold: Number(thresholds.niche_reference_call_to_close_percent_min ?? 35),
      },
      {
        key: "expansion_rate_percent",
        op: ">=",
        actual: parseNum(latest.expansion_rate_percent),
        threshold: Number(thresholds.niche_expansion_rate_percent_min ?? 40),
      },
      {
        key: "platform_availability_percent",
        op: ">=",
        actual: parseNum(latest.platform_availability_percent),
        threshold: Number(thresholds.niche_platform_availability_percent_min ?? 99.5),
      },
      {
        key: "p0_incidents",
        op: "<=",
        actual: parseNum(latest.p0_incidents),
        threshold: Number(thresholds.niche_p0_incidents_max ?? 0),
      },
    ];

    report.latest = latest;

    for (const c of checks) {
      const ok = c.op === ">=" ? c.actual >= c.threshold : c.actual <= c.threshold;
      if (c.key === "p0_incidents") {
        record(`niche threshold ${c.key} ${c.op} ${c.threshold}`, ok, {
          week_start_iso: latest.week_start_iso,
          actual: c.actual,
          threshold: c.threshold,
        });
      } else {
        recordWarn(`niche threshold ${c.key} ${c.op} ${c.threshold}`, ok, {
          week_start_iso: latest.week_start_iso,
          actual: c.actual,
          threshold: c.threshold,
        });
      }

      if (!ok) {
        if (c.key === "named_case_studies_public") {
          addAction(report, "P1", "founder", "Increase named public proof inventory", `${c.key} below threshold`);
        }
        if (c.key === "p50_time_to_value_days") {
          addAction(report, "P1", "delivery_lead", "Reduce time-to-value through delivery compression", `${c.key} above threshold`);
        }
        if (c.key === "reference_call_to_close_percent") {
          addAction(report, "P1", "revenue_ops", "Improve reference desk conversion quality", `${c.key} below threshold`);
        }
        if (c.key === "expansion_rate_percent") {
          addAction(report, "P1", "delivery_lead", "Increase 30/60/90 expansion conversion", `${c.key} below threshold`);
        }
        if (c.key === "platform_availability_percent") {
          addAction(report, "P0", "reliability_engineer", "Raise service availability and remove downtime causes", `${c.key} below threshold`);
        }
        if (c.key === "p0_incidents") {
          addAction(report, "P0", "reliability_engineer", "Eliminate P0 recurrence with guardrail and runbook updates", `${c.key} above threshold`);
        }
      }
    }
  }

  report.summary.status = report.summary.fail_count > 0
    ? "fail"
    : report.summary.warning_count > 0
    ? "attention"
    : "pass";

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  process.stdout.write(`Report: ${REPORT_PATH}\n`);

  if (report.summary.fail_count > 0) {
    process.exit(1);
  }

  pass("Niche leadership gate completed");
}

main();
