#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

import { chromium, firefox, webkit } from "playwright";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const DIST_ENTRY = path.join(SITE_ROOT, "dist", "server", "entry.mjs");

const PORT = Number(process.env.P2_MATRIX_PORT || 4391);
const HOST = process.env.P2_MATRIX_HOST || "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

const SCREENSHOT_DIR = process.env.P2_MATRIX_SHOTS || "/tmp/erain_device_matrix_shots";
const REPORT_PATH = process.env.P2_MATRIX_REPORT || "/tmp/erain_device_browser_matrix_report.json";

const routes = (process.env.P2_MATRIX_ROUTES
  ? process.env.P2_MATRIX_ROUTES.split(",").map((v) => v.trim()).filter(Boolean)
  : ["/", "/pricing", "/results", "/contact", "/request-assessment"]
).map((r) => (r.startsWith("/") ? r : `/${r}`));

const profiles = [
  {
    id: "chromium-desktop",
    engine: "chromium",
    context: { viewport: { width: 1440, height: 900 } },
  },
  {
    id: "firefox-desktop",
    engine: "firefox",
    context: { viewport: { width: 1440, height: 900 } },
  },
  {
    id: "webkit-desktop",
    engine: "webkit",
    context: { viewport: { width: 1440, height: 900 } },
  },
  {
    id: "chromium-mobile",
    engine: "chromium",
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
  {
    id: "webkit-mobile",
    engine: "webkit",
    context: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
];

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

function browserTypeFor(engine) {
  switch (engine) {
    case "chromium":
      return chromium;
    case "firefox":
      return firefox;
    case "webkit":
      return webkit;
    default:
      throw new Error(`Unknown engine: ${engine}`);
  }
}

function routeToSlug(route) {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/[^\w-]/g, "_");
}

async function run() {
  if (!fs.existsSync(DIST_ENTRY)) {
    throw new Error("dist/server/entry.mjs not found. Run `npm run build` first.");
  }

  fs.rmSync(SCREENSHOT_DIR, { recursive: true, force: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes,
    profiles: profiles.map((p) => p.id),
    artifacts: {
      screenshotDir: SCREENSHOT_DIR,
      reportPath: REPORT_PATH,
    },
    checks: {},
  };

  const failures = [];
  const warnings = [];
  const server = spawn("node", [DIST_ENTRY], {
    cwd: SITE_ROOT,
    env: { ...process.env, PORT: String(PORT), HOST },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverStdErr = "";
  server.stderr.on("data", (chunk) => {
    serverStdErr += chunk.toString();
  });

  try {
    await waitForServer(`${BASE_URL}/`);
    pass("Server reachable");

    for (const profile of profiles) {
      const type = browserTypeFor(profile.engine);
      const browser = await type.launch({ headless: true });
      const context = await browser.newContext(profile.context);

      try {
        for (const route of routes) {
          const key = `${profile.id}:${route}`;
          const entry = {
            profile: profile.id,
            engine: profile.engine,
            route,
            ok: true,
            checks: {},
            errors: [],
            warnings: [],
            screenshot: "",
          };
          report.checks[key] = entry;

          const page = await context.newPage();
          const pageErrors = [];
          const consoleErrors = [];

          page.on("pageerror", (err) => {
            pageErrors.push(String(err?.message || err));
          });
          page.on("console", (msg) => {
            if (msg.type() === "error") {
              consoleErrors.push(msg.text());
            }
          });

          try {
            const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 45_000 });
            const status = response?.status() ?? 0;
            entry.checks.status = status;
            if (status < 200 || status >= 400) {
              entry.ok = false;
              entry.errors.push(`HTTP status ${status}`);
            }

            await page.waitForTimeout(700);

            const layout = await page.evaluate(() => {
              const doc = document.documentElement;
              const body = document.body;
              const contentWidth = Math.max(doc?.scrollWidth || 0, body?.scrollWidth || 0);
              const viewportWidth = window.innerWidth;
              const horizontalOverflow = Math.max(0, contentWidth - viewportWidth);

              const interactives = Array.from(
                document.querySelectorAll("a,button,input,select,textarea,[role='button'],[tabindex]")
              );
              const clippedInteractive = [];
              for (const el of interactives) {
                const style = window.getComputedStyle(el);
                if (
                  style.display === "none" ||
                  style.visibility === "hidden" ||
                  Number(style.opacity) === 0 ||
                  (el instanceof HTMLInputElement && el.type === "hidden")
                ) {
                  continue;
                }
                const rect = el.getBoundingClientRect();
                if (rect.width <= 0 || rect.height <= 0) continue;
                if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
                if (rect.left < -6 || rect.right > window.innerWidth + 6) {
                  clippedInteractive.push({
                    tag: el.tagName.toLowerCase(),
                    id: el.id || "",
                    cls: (el.className || "").toString().slice(0, 80),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    vw: window.innerWidth,
                  });
                }
              }

              const fixedBottom = [];
              for (const el of Array.from(document.querySelectorAll("body *"))) {
                const style = window.getComputedStyle(el);
                if (style.position !== "fixed") continue;
                if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width < 120 || rect.height < 32) continue;
                if (rect.bottom < window.innerHeight - 180) continue;
                fixedBottom.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id || "",
                  cls: (el.className || "").toString().slice(0, 80),
                  top: Math.round(rect.top),
                  bottom: Math.round(rect.bottom),
                });
              }

              return {
                viewport: { width: viewportWidth, height: window.innerHeight },
                contentWidth,
                horizontalOverflow,
                clippedInteractive,
                fixedBottom,
              };
            });

            entry.checks.layout = layout;

            if (layout.horizontalOverflow > 2) {
              entry.ok = false;
              entry.errors.push(`Horizontal overflow ${layout.horizontalOverflow}px`);
            }

            if (layout.clippedInteractive.length > 0) {
              entry.ok = false;
              entry.errors.push(
                `Clipped interactive elements: ${layout.clippedInteractive
                  .map((v) => `${v.tag}${v.id ? `#${v.id}` : ""}`)
                  .join(", ")}`
              );
            }

            if (layout.fixedBottom.length > 1) {
              entry.ok = false;
              entry.errors.push(`Overlapping fixed-bottom surfaces: ${layout.fixedBottom.length}`);
            }

            if (pageErrors.length > 0) {
              entry.ok = false;
              entry.errors.push(`Page errors: ${pageErrors.length}`);
            }
            if (consoleErrors.length > 0) {
              entry.ok = false;
              entry.errors.push(`Console errors: ${consoleErrors.length}`);
            }

            if (pageErrors.length > 0) {
              entry.warnings.push(...pageErrors.slice(0, 4));
            }
            if (consoleErrors.length > 0) {
              entry.warnings.push(...consoleErrors.slice(0, 4));
            }

            const screenshotPath = path.join(
              SCREENSHOT_DIR,
              `${profile.id}-${routeToSlug(route)}.png`
            );
            await page.screenshot({
              path: screenshotPath,
              fullPage: true,
            });
            entry.screenshot = screenshotPath;

            if (!entry.ok) {
              failures.push({ profile: profile.id, route, errors: entry.errors, warnings: entry.warnings });
              fail(`${profile.id} ${route} -> ${entry.errors.join(" | ")}`);
            } else {
              pass(`${profile.id} ${route}`);
            }
          } catch (err) {
            entry.ok = false;
            const message = String(err?.message || err);
            entry.errors.push(message);
            failures.push({ profile: profile.id, route, errors: [message] });
            fail(`${profile.id} ${route} -> ${message}`);
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
        await browser.close();
      }
    }
  } finally {
    if (!server.killed) {
      server.kill("SIGTERM");
    }
    await new Promise((resolve) => {
      server.on("close", () => resolve());
      setTimeout(resolve, 1500);
    });
  }

  report.summary = {
    totalChecks: profiles.length * routes.length,
    failures: failures.length,
    warnings: warnings.length,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report: ${REPORT_PATH}`);
  log(`Screenshots: ${SCREENSHOT_DIR}`);

  if (serverStdErr.trim()) {
    log("Server stderr (tail):");
    const lines = serverStdErr.trim().split("\n").slice(-30);
    for (const line of lines) log(line);
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  fail(err?.stack || String(err));
  process.exit(1);
});
