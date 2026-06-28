// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Edge Middleware for /banner and /__where. Parallels Netlify edge functions:
// banner returns a per-request edge value; __where echoes the Vercel edge region.

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === "/banner") {
    return Response.json(
      {
        ok: true,
        product: "Edge Middleware",
        banner: "china_banner_on",
        serverRegion: process.env.VERCEL_REGION ?? null,
        ts: new Date().toISOString(),
      },
      { headers: { "content-type": "application/json" } }
    );
  }

  if (url.pathname === "/__where") {
    const vercelId = request.headers.get("x-vercel-id") ?? "";
    const serverRegion =
      vercelId.split("::")[0] || process.env.VERCEL_REGION || "unknown";

    return Response.json(
      {
        serverRegion,
        vercelId: vercelId || null,
        geo: request.geo ?? null,
        url: request.url,
        time: new Date().toISOString(),
      },
      {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      }
    );
  }
}

export const config = {
  matcher: ["/banner", "/__where"],
};
