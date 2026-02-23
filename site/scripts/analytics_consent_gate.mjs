#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

import { chromium } from "playwright";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const DIST_ENTRY = path.join(SITE_ROOT, "dist", "server", "entry.mjs");

const PORT = Number(process.env.P3_ANALYTICS_PORT || 4393);
const HOST = process.env.P3_ANALYTICS_HOST || "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const CONSENT_KEY = "erain_cookie_consent_v1";
const REPORT_PATH = process.env.P3_ANALYTICS_REPORT || "/tmp/erain_analytics_consent_gate_report.json";

function pass(msg) {
  process.stdout.write(`PASS: ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL: ${msg}\n`);
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function waitForServer(url, maxAttempts = 40, gapMs = 250) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status >= 200 && res.status < 500) return;
    } catch (_) {}
    await sleep(gapMs);
  }
  throw new Error(`Server did not become reachable at ${url}`);
}

async function getEvents(page) {
  return page.evaluate(() => {
    const dl = Array.isArray(window.dataLayer) ? window.dataLayer : [];
    return dl
      .map((entry) => (entry && typeof entry.event === "string" ? entry.event : ""))
      .filter(Boolean);
  });
}

async function addPreventedClick(page, selector) {
  return page.evaluate((sel) => {
    const anchor = document.querySelector(sel);
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    anchor.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
      },
      { once: true }
    );
    anchor.click();
    return true;
  }, selector);
}

function includesAny(events, names) {
  return names.some((name) => events.includes(name));
}

async function run() {
  if (!fs.existsSync(DIST_ENTRY)) {
    throw new Error("dist/server/entry.mjs not found. Run `npm run build` first.");
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    consentKey: CONSENT_KEY,
    cases: [],
  };

  const server = spawn("node", [DIST_ENTRY], {
    cwd: SITE_ROOT,
    env: { ...process.env, PORT: String(PORT), HOST },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverStdErr = "";
  server.stderr.on("data", (chunk) => {
    serverStdErr += chunk.toString();
  });

  const failures = [];
  const browser = await chromium.launch({ headless: true });

  try {
    await waitForServer(`${BASE_URL}/`);
    pass("Server reachable");

    {
      const caseResult = { name: "no_consent_no_tracking", ok: true, checks: {}, errors: [] };
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        await page.waitForTimeout(350);

        const bannerVisible = await page.evaluate(() => {
          const banner = document.getElementById("cookieBanner");
          return !!banner && !banner.classList.contains("hidden");
        });
        caseResult.checks.bannerVisible = bannerVisible;
        if (!bannerVisible) {
          caseResult.ok = false;
          caseResult.errors.push("Cookie banner should be visible for unknown consent");
        }

        let events = await getEvents(page);
        caseResult.checks.eventsBeforeClick = events;
        if (includesAny(events, ["site_page_view", "site_cta_click", "site_cookie_consent_granted"])) {
          caseResult.ok = false;
          caseResult.errors.push("Tracking event fired before consent");
        }

        const clicked = await addPreventedClick(page, 'a[data-track="home_hero_start_audit"]');
        caseResult.checks.preventedClickInjected = clicked;
        await page.waitForTimeout(250);
        events = await getEvents(page);
        caseResult.checks.eventsAfterClick = events;
        if (events.includes("site_cta_click")) {
          caseResult.ok = false;
          caseResult.errors.push("CTA event fired without consent");
        }
      } finally {
        await page.close();
        await context.close();
      }
      report.cases.push(caseResult);
      if (!caseResult.ok) failures.push(caseResult);
      else pass(caseResult.name);
    }

    {
      const caseResult = { name: "essential_only_no_tracking", ok: true, checks: {}, errors: [] };
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        await page.click("#cookieEssentialBtn");
        await page.waitForTimeout(250);

        const consentValue = await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
        caseResult.checks.localStorageConsent = consentValue;
        if (consentValue !== "essential") {
          caseResult.ok = false;
          caseResult.errors.push(`Expected consent value "essential", got "${consentValue}"`);
        }

        const clicked = await addPreventedClick(page, 'a[data-track="home_hero_start_audit"]');
        caseResult.checks.preventedClickInjected = clicked;
        await page.waitForTimeout(250);

        const events = await getEvents(page);
        caseResult.checks.events = events;
        if (includesAny(events, ["site_page_view", "site_cta_click", "site_cookie_consent_granted"])) {
          caseResult.ok = false;
          caseResult.errors.push("Tracking events fired under essential-only consent");
        }
      } finally {
        await page.close();
        await context.close();
      }
      report.cases.push(caseResult);
      if (!caseResult.ok) failures.push(caseResult);
      else pass(caseResult.name);
    }

    {
      const caseResult = { name: "accept_analytics_enables_tracking", ok: true, checks: {}, errors: [] };
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
        await page.click("#cookieAcceptBtn");
        await page.waitForTimeout(350);

        const consentValue = await page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
        caseResult.checks.localStorageConsent = consentValue;
        if (consentValue !== "granted") {
          caseResult.ok = false;
          caseResult.errors.push(`Expected consent value "granted", got "${consentValue}"`);
        }

        let events = await getEvents(page);
        caseResult.checks.eventsAfterAccept = events;
        if (!events.includes("site_page_view")) {
          caseResult.ok = false;
          caseResult.errors.push("site_page_view missing after analytics consent");
        }
        if (!events.includes("site_cookie_consent_granted")) {
          caseResult.ok = false;
          caseResult.errors.push("site_cookie_consent_granted missing after accept");
        }

        const clicked = await addPreventedClick(page, 'a[data-track="home_hero_start_audit"]');
        caseResult.checks.preventedClickInjected = clicked;
        await page.waitForTimeout(250);
        events = await getEvents(page);
        caseResult.checks.eventsAfterClick = events;
        if (!events.includes("site_cta_click")) {
          caseResult.ok = false;
          caseResult.errors.push("site_cta_click missing after consented click");
        }
      } finally {
        await page.close();
        await context.close();
      }
      report.cases.push(caseResult);
      if (!caseResult.ok) failures.push(caseResult);
      else pass(caseResult.name);
    }

    {
      const caseResult = { name: "pricing_event_tracks_only_with_granted", ok: true, checks: {}, errors: [] };
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      await context.addInitScript(
        ({ key }) => {
          localStorage.setItem(key, "granted");
        },
        { key: CONSENT_KEY }
      );
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });
        await page.waitForTimeout(250);
        await page.click('[data-currency-btn="USD"]');
        await page.waitForTimeout(150);
        await page.click('[data-currency-btn="INR"]');
        await page.waitForTimeout(250);

        const events = await getEvents(page);
        caseResult.checks.events = events;
        if (!events.includes("pricing_currency_changed")) {
          caseResult.ok = false;
          caseResult.errors.push("pricing_currency_changed missing under granted consent");
        }
      } finally {
        await page.close();
        await context.close();
      }
      report.cases.push(caseResult);
      if (!caseResult.ok) failures.push(caseResult);
      else pass(caseResult.name);
    }

    {
      const caseResult = { name: "pricing_event_blocked_under_essential", ok: true, checks: {}, errors: [] };
      const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      await context.addInitScript(
        ({ key }) => {
          localStorage.setItem(key, "essential");
        },
        { key: CONSENT_KEY }
      );
      const page = await context.newPage();
      try {
        await page.goto(`${BASE_URL}/pricing`, { waitUntil: "networkidle" });
        await page.waitForTimeout(250);
        await page.click('[data-currency-btn="USD"]');
        await page.waitForTimeout(250);

        const events = await getEvents(page);
        caseResult.checks.events = events;
        if (events.includes("pricing_currency_changed") || events.includes("site_page_view")) {
          caseResult.ok = false;
          caseResult.errors.push("Analytics events should not fire under essential consent");
        }
      } finally {
        await page.close();
        await context.close();
      }
      report.cases.push(caseResult);
      if (!caseResult.ok) failures.push(caseResult);
      else pass(caseResult.name);
    }
  } finally {
    await browser.close();
    if (!server.killed) {
      server.kill("SIGTERM");
    }
    await new Promise((resolve) => {
      server.on("close", () => resolve());
      setTimeout(resolve, 1500);
    });
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report: ${REPORT_PATH}`);

  if (serverStdErr.trim()) {
    log("Server stderr (tail):");
    const lines = serverStdErr.trim().split("\n").slice(-20);
    for (const line of lines) log(line);
  }

  if (failures.length > 0) {
    for (const failed of failures) {
      fail(`${failed.name}: ${failed.errors.join(" | ")}`);
    }
    process.exit(1);
  }

  pass("Analytics consent gate passed");
}

run().catch((err) => {
  fail(err?.stack || String(err));
  process.exit(1);
});
