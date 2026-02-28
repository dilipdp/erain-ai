#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const OPS_ROOT = path.join(SITE_ROOT, "ops", "no1");
const REPORT_PATH = process.env.P7_NO1_REPORT || "/tmp/erain_no1_operating_report.json";

const requiredFiles = [
  "README.md",
  "icp/segment.md",
  "playbooks/response-sla.md",
  "playbooks/delivery-sop.md",
  "playbooks/offer-packaging.md",
  "playbooks/expansion-30-60-90.md",
  "trust-pack/checklist.md",
  "hiring/bottleneck-plan.md",
  "benchmarks/library.csv",
  "trackers/lead-response.csv",
  "trackers/revenue-weekly.csv",
  "trackers/customer-expansion.csv",
  "trackers/case-studies.csv",
  "trackers/scoreboard-weekly.csv",
  "config/no1-thresholds.json",
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
  const sorted = [...rows].sort((a, b) => {
    const ta = Date.parse(a[weekField] || "");
    const tb = Date.parse(b[weekField] || "");
    return ta - tb;
  });
  return sorted[sorted.length - 1];
}

function run() {
  const report = {
    generated_at: new Date().toISOString(),
    ops_root: OPS_ROOT,
    checks: [],
    warnings: [],
    summary: {
      pass_count: 0,
      fail_count: 0,
      warning_count: 0,
      status: "pass",
    },
  };

  const failures = [];
  const warnings = [];
  const record = (name, ok, details = {}) => {
    report.checks.push({ name, ok, details });
    if (ok) {
      pass(name);
      report.summary.pass_count += 1;
      return;
    }
    fail(name);
    report.summary.fail_count += 1;
    failures.push({ name, details });
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
    warnings.push({ name, details });
    report.warnings.push({ name, details });
  };

  for (const relativePath of requiredFiles) {
    const absPath = path.join(OPS_ROOT, relativePath);
    const exists = fs.existsSync(absPath);
    const size = exists ? fs.statSync(absPath).size : 0;
    record(`asset exists: ${relativePath}`, exists && size > 0, {
      path: absPath,
      exists,
      size_bytes: size,
    });
  }

  const thresholdsPath = path.join(OPS_ROOT, "config", "no1-thresholds.json");
  let thresholds = null;
  try {
    thresholds = JSON.parse(fs.readFileSync(thresholdsPath, "utf8"));
    record("threshold config parse", true, { thresholds });
  } catch (error) {
    thresholds = null;
    record("threshold config parse", false, {
      path: thresholdsPath,
      error: String(error?.message || error),
    });
  }

  const leadRows = parseCsv(path.join(OPS_ROOT, "trackers", "lead-response.csv"));
  const revenueRows = parseCsv(path.join(OPS_ROOT, "trackers", "revenue-weekly.csv"));
  const expansionRows = parseCsv(path.join(OPS_ROOT, "trackers", "customer-expansion.csv"));
  const caseRows = parseCsv(path.join(OPS_ROOT, "trackers", "case-studies.csv"));
  const scoreRows = parseCsv(path.join(OPS_ROOT, "trackers", "scoreboard-weekly.csv"));
  const benchmarkRows = parseCsv(path.join(OPS_ROOT, "benchmarks", "library.csv"));

  record("lead response tracker has data", leadRows.length > 0, { rows: leadRows.length });
  record("revenue tracker has data", revenueRows.length > 0, { rows: revenueRows.length });
  record("expansion tracker has data", expansionRows.length > 0, { rows: expansionRows.length });
  record("case study tracker has data", caseRows.length > 0, { rows: caseRows.length });
  record("scoreboard tracker has data", scoreRows.length > 0, { rows: scoreRows.length });
  record("benchmark library has data", benchmarkRows.length >= 3, { rows: benchmarkRows.length });

  const latestLead = latestByWeek(leadRows);
  if (latestLead) {
    const responseMinutes = parseNumber(latestLead.response_minutes);
    record("latest lead response under 60 minutes", Number.isFinite(responseMinutes) && responseMinutes <= 60, {
      week_start_iso: latestLead.week_start_iso,
      response_minutes: responseMinutes,
      lead_id: latestLead.lead_id,
    });
  }

  if (thresholds) {
    const latestScore = latestByWeek(scoreRows);
    if (latestScore) {
      const checks = [
        {
          key: "lead_response_sla_percent",
          op: ">=",
          value: parseNumber(latestScore.lead_response_sla_percent),
          threshold: thresholds.lead_response_sla_percent_min,
          ok: parseNumber(latestScore.lead_response_sla_percent) >= thresholds.lead_response_sla_percent_min,
        },
        {
          key: "request_conversion_percent",
          op: ">=",
          value: parseNumber(latestScore.request_conversion_percent),
          threshold: thresholds.request_conversion_percent_min,
          ok: parseNumber(latestScore.request_conversion_percent) >= thresholds.request_conversion_percent_min,
        },
        {
          key: "pro_conversion_percent",
          op: ">=",
          value: parseNumber(latestScore.pro_conversion_percent),
          threshold: thresholds.pro_conversion_percent_min,
          ok: parseNumber(latestScore.pro_conversion_percent) >= thresholds.pro_conversion_percent_min,
        },
        {
          key: "delivery_days_median",
          op: "<=",
          value: parseNumber(latestScore.delivery_days_median),
          threshold: thresholds.delivery_days_median_max,
          ok: parseNumber(latestScore.delivery_days_median) <= thresholds.delivery_days_median_max,
        },
        {
          key: "named_case_studies_count",
          op: ">=",
          value: parseNumber(latestScore.named_case_studies_count),
          threshold: thresholds.named_case_studies_count_min,
          ok: parseNumber(latestScore.named_case_studies_count) >= thresholds.named_case_studies_count_min,
        },
        {
          key: "weekly_new_pipeline_inr",
          op: ">=",
          value: parseNumber(latestScore.weekly_new_pipeline_inr),
          threshold: thresholds.weekly_new_pipeline_inr_min,
          ok: parseNumber(latestScore.weekly_new_pipeline_inr) >= thresholds.weekly_new_pipeline_inr_min,
        },
      ];

      for (const c of checks) {
        record(`scoreboard threshold ${c.key} ${c.op} ${c.threshold}`, c.ok, {
          week_start_iso: latestScore.week_start_iso,
          actual: c.value,
          threshold: c.threshold,
        });
      }

      if (Number.isFinite(Number(thresholds.named_case_studies_count_target))) {
        const actualNamed = parseNumber(latestScore.named_case_studies_count);
        recordWarn(
          `scoreboard milestone named_case_studies_count >= ${thresholds.named_case_studies_count_target}`,
          actualNamed >= Number(thresholds.named_case_studies_count_target),
          {
            week_start_iso: latestScore.week_start_iso,
            actual: actualNamed,
            target: Number(thresholds.named_case_studies_count_target),
          },
        );
      }
    }

    const latestRevenue = latestByWeek(revenueRows);
    if (latestRevenue) {
      const pipeline = parseNumber(latestRevenue.new_pipeline_inr);
      record("latest revenue tracker pipeline meets threshold", pipeline >= thresholds.weekly_new_pipeline_inr_min, {
        week_start_iso: latestRevenue.week_start_iso,
        actual_new_pipeline_inr: pipeline,
        threshold: thresholds.weekly_new_pipeline_inr_min,
      });
    }
  }

  const expansionCoverage = new Set(
    expansionRows
      .map((r) => parseNumber(r.review_window_days))
      .filter((v) => Number.isFinite(v))
      .map((v) => (v <= 30 ? 30 : v <= 60 ? 60 : v <= 90 ? 90 : 91)),
  );
  record("expansion tracker includes at least one cadence window (30/60/90)", expansionCoverage.size > 0, {
    windows_seen: Array.from(expansionCoverage.values()).sort((a, b) => a - b),
  });
  recordWarn("expansion tracker has full 30/60/90 coverage", expansionCoverage.has(30) && expansionCoverage.has(60) && expansionCoverage.has(90), {
    windows_seen: Array.from(expansionCoverage.values()).sort((a, b) => a - b),
  });

  const hasImpactCase = caseRows.some((row) => {
    const impact = parseNumber(row.annualized_impact_inr);
    return Number.isFinite(impact) && impact > 0;
  });
  record("case study tracker includes quantified impact", hasImpactCase, {
    rows: caseRows.length,
  });

  const hasNamedCase = caseRows.some((row) => String(row.named_client_approved || "").toLowerCase() === "yes");
  recordWarn("named case study exists (credibility milestone)", hasNamedCase, {
    rows: caseRows.length,
  });

  const benchmarkRecent = benchmarkRows.every((row) => Date.parse(row.last_updated_utc || "") > 0);
  record("benchmark library has timestamped updates", benchmarkRecent, {
    rows: benchmarkRows.length,
  });

  if (failures.length > 0) {
    report.summary.status = "fail";
    report.summary.failures = failures;
  }
  if (warnings.length > 0) {
    report.summary.warnings = warnings;
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  process.stdout.write(`Report: ${REPORT_PATH}\n`);

  if (failures.length > 0) {
    process.exit(1);
  }

  pass("No.1 operating system gate passed");
}

run();
