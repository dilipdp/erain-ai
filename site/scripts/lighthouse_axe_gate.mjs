#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const axeScriptPath = require.resolve("axe-core/axe.min.js");

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const DIST_ENTRY = path.join(SITE_ROOT, "dist", "server", "entry.mjs");

const PORT = Number(process.env.P0_GATE_PORT || 4388);
const HOST = process.env.P0_GATE_HOST || "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const CHROME_PATH =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const routes = [
  "/",
  "/pricing",
  "/results",
  "/contact",
  "/request-assessment",
];

const thresholds = {
  performance: Number(process.env.LH_MIN_PERFORMANCE || "0.55"),
  accessibility: Number(process.env.LH_MIN_ACCESSIBILITY || "0.9"),
  "best-practices": Number(process.env.LH_MIN_BEST_PRACTICES || "0.85"),
  seo: Number(process.env.LH_MIN_SEO || "0.9"),
};

const failingAxeLevels = new Set(
  String(process.env.AXE_FAIL_LEVELS || "critical")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
);

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL: ${msg}\n`);
}

function pass(msg) {
  process.stdout.write(`PASS: ${msg}\n`);
}

async function waitForServer(url, maxAttempts = 40, gapMs = 250) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status >= 200 && res.status < 500) {
        return;
      }
    } catch (_) {}
    await sleep(gapMs);
  }
  throw new Error(`Server did not become reachable at ${url}`);
}

async function run() {
  if (!fs.existsSync(DIST_ENTRY)) {
    throw new Error("dist/server/entry.mjs not found. Run `npm run build` first.");
  }
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found at ${CHROME_PATH}. Set CHROME_PATH to your browser binary.`);
  }

  const server = spawn("node", [DIST_ENTRY], {
    cwd: SITE_ROOT,
    env: { ...process.env, PORT: String(PORT), HOST },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverStdErr = "";
  server.stderr.on("data", (chunk) => {
    serverStdErr += chunk.toString();
  });

  let chrome;
  let browser;
  const lhFailures = [];
  const axeFailures = [];
  const axeWarnings = [];
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: {},
    thresholds,
    failingAxeLevels: Array.from(failingAxeLevels),
  };

  try {
    await waitForServer(`${BASE_URL}/`);
    pass("Server reachable");

    chrome = await launch({
      chromePath: CHROME_PATH,
      logLevel: "error",
      chromeFlags: [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-dev-shm-usage",
        "--window-size=1366,900",
      ],
    });
    pass("Chrome launched for Lighthouse");

    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      const result = await lighthouse(url, {
        port: chrome.port,
        logLevel: "error",
        output: "json",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      });
      if (!result?.lhr?.categories) {
        lhFailures.push({ route, reason: "No Lighthouse report generated" });
        continue;
      }

      const scores = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, cat]) => [key, Number(cat.score ?? 0)])
      );
      report.routes[route] = {
        ...(report.routes[route] || {}),
        lighthouse: scores,
      };

      for (const [category, min] of Object.entries(thresholds)) {
        const score = scores[category];
        if (typeof score !== "number") {
          lhFailures.push({ route, category, score: null, min, reason: "Missing category score" });
          continue;
        }
        if (score < min) {
          lhFailures.push({ route, category, score, min });
        }
      }
      pass(`Lighthouse complete: ${route}`);
    }

    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME_PATH,
      args: ["--disable-gpu", "--no-first-run", "--no-default-browser-check"],
    });
    pass("Browser launched for axe");

    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    });

    for (const route of routes) {
      const url = `${BASE_URL}${route}`;
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.addScriptTag({ path: axeScriptPath });
      const axeResult = await page.evaluate(async () => {
        const runResult = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa"],
          },
        });
        return {
          violations: runResult.violations.map((v) => ({
            id: v.id,
            impact: v.impact || "minor",
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.length,
          })),
        };
      });
      await page.close();

      const violations = axeResult.violations || [];
      const hard = violations.filter((v) => failingAxeLevels.has(String(v.impact).toLowerCase()));
      const soft = violations.filter((v) => !failingAxeLevels.has(String(v.impact).toLowerCase()));

      report.routes[route] = {
        ...(report.routes[route] || {}),
        axe: {
          totalViolations: violations.length,
          failures: hard,
          warnings: soft,
        },
      };

      for (const issue of hard) {
        axeFailures.push({ route, ...issue });
      }
      for (const issue of soft) {
        axeWarnings.push({ route, ...issue });
      }
      pass(`axe complete: ${route}`);
    }

    await context.close();
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (chrome) {
      try {
        await Promise.resolve(chrome.kill());
      } catch (_) {}
    }

    if (!server.killed) {
      server.kill("SIGTERM");
    }
    await new Promise((resolve) => {
      server.on("close", () => resolve());
      setTimeout(resolve, 1500);
    });
  }

  const reportPath = path.join("/tmp", "erain_quality_gate_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Report: ${reportPath}`);

  if (lhFailures.length > 0) {
    fail("Lighthouse threshold failures detected:");
    for (const item of lhFailures) {
      const score = item.score == null ? "n/a" : item.score.toFixed(2);
      fail(`  ${item.route} ${item.category || "unknown"} score=${score} min=${item.min ?? "n/a"}`);
    }
  } else {
    pass("All Lighthouse thresholds met");
  }

  if (axeWarnings.length > 0) {
    log("WARN: Non-blocking axe violations found:");
    for (const item of axeWarnings) {
      log(`  ${item.route} [${item.impact}] ${item.id} (${item.nodes} nodes)`);
    }
  }

  if (axeFailures.length > 0) {
    fail("Axe blocking violations detected:");
    for (const item of axeFailures) {
      fail(`  ${item.route} [${item.impact}] ${item.id} (${item.nodes} nodes)`);
      fail(`      ${item.help} -> ${item.helpUrl}`);
    }
  } else {
    pass(`No blocking axe violations (${Array.from(failingAxeLevels).join(", ")})`);
  }

  if (lhFailures.length > 0 || axeFailures.length > 0) {
    if (serverStdErr.trim()) {
      log("Server stderr:");
      log(serverStdErr.trim());
    }
    process.exit(1);
  }

  pass("Quality gate passed");
}

run().catch((err) => {
  fail(err?.stack || String(err));
  process.exit(1);
});
