import { defineMiddleware } from "astro:middleware";

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return next();
  }

  // Read credentials from env
  const user = import.meta.env.ADMIN_USER;
  const pass = import.meta.env.ADMIN_PASS;

  if (!user || !pass) {
    return new Response(
      "Admin auth not configured. Set ADMIN_USER and ADMIN_PASS in .env",
      { status: 500 }
    );
  }

  const auth = context.request.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("basic ")) {
    return unauthorized();
  }

  try {
    const b64 = auth.slice(6).trim();
    const decoded = atob(b64);
    const [u, p] = decoded.split(":");

    if (u !== user || p !== pass) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  return next();
});