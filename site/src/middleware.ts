import { defineMiddleware } from "astro:middleware";

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

function securityHeaders(url: URL) {
  const isHttps = url.protocol === "https:";
  const cspParts = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https:",
    "frame-src 'none'",
    "worker-src 'self' blob:",
  ];

  if (isHttps) {
    cspParts.push("upgrade-insecure-requests");
  }

  return {
    "Content-Security-Policy": cspParts.join("; "),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), browsing-topics=()",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    ...(isHttps ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload" } : {}),
  } as const;
}

function withSecurityHeaders(response: Response, url: URL) {
  const headers = new Headers(response.headers);
  const baseline = securityHeaders(url);
  for (const [key, value] of Object.entries(baseline)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (pathname === "/sitemap.xml") {
    const redirected = new Response(null, {
      status: 308,
      headers: {
        Location: "/sitemap-index.xml",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
    return withSecurityHeaders(redirected, context.url);
  }

  const adminPath = pathname.startsWith("/admin");

  if (adminPath) {
    const user = import.meta.env.ADMIN_USER;
    const pass = import.meta.env.ADMIN_PASS;

    if (!user || !pass) {
      const misconfigured = new Response(
        "Admin auth not configured. Set ADMIN_USER and ADMIN_PASS in .env",
        { status: 500 }
      );
      const secured = withSecurityHeaders(misconfigured, context.url);
      secured.headers.set("X-Robots-Tag", "noindex, nofollow");
      secured.headers.set("Cache-Control", "no-store");
      return secured;
    }

    const auth = context.request.headers.get("authorization");
    if (!auth || !auth.toLowerCase().startsWith("basic ")) {
      const denied = withSecurityHeaders(unauthorized(), context.url);
      denied.headers.set("X-Robots-Tag", "noindex, nofollow");
      denied.headers.set("Cache-Control", "no-store");
      return denied;
    }

    try {
      const b64 = auth.slice(6).trim();
      const decoded = atob(b64);
      const [u, p] = decoded.split(":");
      if (u !== user || p !== pass) {
        const denied = withSecurityHeaders(unauthorized(), context.url);
        denied.headers.set("X-Robots-Tag", "noindex, nofollow");
        denied.headers.set("Cache-Control", "no-store");
        return denied;
      }
    } catch {
      const denied = withSecurityHeaders(unauthorized(), context.url);
      denied.headers.set("X-Robots-Tag", "noindex, nofollow");
      denied.headers.set("Cache-Control", "no-store");
      return denied;
    }
  }

  const response = await next();
  const secured = withSecurityHeaders(response, context.url);
  if (adminPath) {
    secured.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (!secured.headers.has("Cache-Control")) {
      secured.headers.set("Cache-Control", "no-store");
    }
  } else {
    if (!secured.headers.has("X-Robots-Tag")) {
      secured.headers.set("X-Robots-Tag", "index, follow");
    }
    if (!secured.headers.has("Cache-Control")) {
      secured.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
    }
  }
  return secured;
});
