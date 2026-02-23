#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const THIS_FILE = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(THIS_FILE);
const SITE_ROOT = path.resolve(SCRIPTS_DIR, "..");
const DIST_ENTRY = path.join(SITE_ROOT, "dist", "server", "entry.mjs");

const PORT = Number(process.env.P4_SEO_PORT || 4395);
const HOST = process.env.P4_SEO_HOST || "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const SITE_ORIGIN = "https://erainai.com";
const REPORT_PATH = process.env.P4_SEO_REPORT || "/tmp/erain_seo_trust_gate_report.json";

const coreRoutes = [
  "/",
  "/solutions",
  "/industries",
  "/pricing",
  "/results",
  "/sample-report",
  "/contact",
  "/request-assessment",
  "/client-login",
];

const trustRoutes = ["/legal", "/privacy", "/terms", "/security", "/dpa", "/cookie-policy"];

function pass(msg) {
  process.stdout.write(`PASS: ${msg}\n`);
}

function fail(msg) {
  process.stderr.write(`FAIL: ${msg}\n`);
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

function parseMeta(html, attrName, attrValue) {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrRegex = new RegExp(`${attrName}\\s*=\\s*["']${attrValue}["']`, "i");
    if (!attrRegex.test(tag)) continue;
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (contentMatch) return contentMatch[1];
  }
  return "";
}

function parseCanonical(html) {
  const tags = html.match(/<link\s+[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/rel\s*=\s*["']canonical["']/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (href) return href[1];
  }
  return "";
}

function expectedCanonical(route) {
  if (route === "/") return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${route}`;
}

async function fetchText(route, options = {}) {
  const res = await fetch(`${BASE_URL}${route}`, {
    redirect: "manual",
    ...options,
  });
  const text = await res.text();
  return { res, text };
}

async function run() {
  if (!fs.existsSync(DIST_ENTRY)) {
    throw new Error("dist/server/entry.mjs not found. Run `npm run build` first.");
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    checks: [],
  };
  const failures = [];

  const server = spawn("node", [DIST_ENTRY], {
    cwd: SITE_ROOT,
    env: { ...process.env, PORT: String(PORT), HOST },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverStdErr = "";
  server.stderr.on("data", (chunk) => {
    serverStdErr += chunk.toString();
  });

  const record = (name, ok, details = {}) => {
    report.checks.push({ name, ok, details });
    if (ok) pass(name);
    else {
      fail(name);
      failures.push({ name, details });
    }
  };

  try {
    await waitForServer(`${BASE_URL}/`);
    pass("Server reachable");

    {
      const { res, text } = await fetchText("/robots.txt");
      const lines = text.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
      const hasAllow = lines.includes("Allow: /");
      const hasAdminDisallow = lines.includes("Disallow: /admin/");
      const hasApiDisallow = lines.includes("Disallow: /api/");
      const hasSitemap = lines.some((l) => l === "Sitemap: https://erainai.com/sitemap-index.xml");
      const ok = res.status === 200 && hasAllow && hasAdminDisallow && hasApiDisallow && hasSitemap;
      record("robots.txt policy", ok, {
        status: res.status,
        hasAllow,
        hasAdminDisallow,
        hasApiDisallow,
        hasSitemap,
      });
    }

    {
      const res = await fetch(`${BASE_URL}/sitemap.xml`, { redirect: "manual" });
      const location = res.headers.get("location") || "";
      record("sitemap.xml compatibility redirect", res.status === 308 && location === "/sitemap-index.xml", {
        status: res.status,
        location,
      });
    }

    {
      const { res, text } = await fetchText("/sitemap-index.xml");
      const ok = res.status === 200 && text.includes("<sitemapindex") && text.includes("/sitemap-0.xml");
      record("sitemap-index integrity", ok, { status: res.status });
    }

    {
      const { res, text } = await fetchText("/sitemap-0.xml");
      const expected = [...coreRoutes, ...trustRoutes];
      const missing = expected.filter((route) => !text.includes(`${SITE_ORIGIN}${route === "/" ? "" : route}`));
      const hasAdmin = text.includes("/admin");
      const ok = res.status === 200 && missing.length === 0 && !hasAdmin;
      record("sitemap route coverage", ok, {
        status: res.status,
        missing,
        hasAdmin,
      });
    }

    {
      const { res, text } = await fetchText("/.well-known/security.txt");
      const ok = res.status === 200 && /Contact:\s*mailto:security@erainai\.com/i.test(text);
      record("security.txt presence", ok, { status: res.status });
    }

    {
      const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
      const robotsTag = (res.headers.get("x-robots-tag") || "").toLowerCase();
      const ok = [401, 500].includes(res.status) && robotsTag.includes("noindex");
      record("admin noindex policy", ok, { status: res.status, robotsTag });
    }

    for (const route of [...coreRoutes, ...trustRoutes]) {
      const { res, text } = await fetchText(route);
      const canonical = parseCanonical(text);
      const expected = expectedCanonical(route);
      const robots = parseMeta(text, "name", "robots").replace(/\s+/g, "");
      const description = parseMeta(text, "name", "description");
      const ogTitle = parseMeta(text, "property", "og:title");
      const ogDescription = parseMeta(text, "property", "og:description");
      const ogUrl = parseMeta(text, "property", "og:url");
      const ogImage = parseMeta(text, "property", "og:image");
      const twitterTitle = parseMeta(text, "name", "twitter:title");
      const twitterDescription = parseMeta(text, "name", "twitter:description");
      const twitterImage = parseMeta(text, "name", "twitter:image");
      const xRobotsTag = (res.headers.get("x-robots-tag") || "").toLowerCase();

      const ok =
        res.status === 200 &&
        canonical === expected &&
        robots === "index,follow" &&
        description.length >= 40 &&
        ogTitle.length > 0 &&
        ogDescription.length > 0 &&
        ogUrl === expected &&
        ogImage.startsWith(SITE_ORIGIN) &&
        twitterTitle.length > 0 &&
        twitterDescription.length > 0 &&
        twitterImage.startsWith(SITE_ORIGIN) &&
        xRobotsTag.includes("index");

      record(`meta integrity ${route}`, ok, {
        status: res.status,
        canonical,
        expected,
        robots,
        descriptionLength: description.length,
        ogUrl,
        ogImage,
        twitterImage,
        xRobotsTag,
      });
    }

    {
      const { res, text } = await fetchText("/");
      const trustHrefs = ["/legal", "/privacy", "/terms", "/security", "/dpa", "/cookie-policy"];
      const missing = trustHrefs.filter((href) => !text.includes(`href="${href}"`));
      record("footer trust-link surface", res.status === 200 && missing.length === 0, {
        status: res.status,
        missing,
      });
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

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  process.stdout.write(`Report: ${REPORT_PATH}\n`);

  if (serverStdErr.trim()) {
    process.stdout.write("Server stderr (tail):\n");
    const lines = serverStdErr.trim().split("\n").slice(-20);
    for (const line of lines) process.stdout.write(`${line}\n`);
  }

  if (failures.length > 0) {
    process.exit(1);
  }
  pass("SEO/trust release gate passed");
}

run().catch((err) => {
  fail(err?.stack || String(err));
  process.exit(1);
});
