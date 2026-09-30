// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Edge Function (Deno runtime, runs at the CDN edge). Served at /banner via the
// [[edge_functions]] route in netlify.toml. Parallels the Firebase demo's
// Remote-Config "china_banner": a value computed at the edge per request.

export default async (request, context) => {
  return new Response(
    JSON.stringify({
      ok: true,
      product: "Edge Functions",
      banner: "china_banner_on",
      country: context?.geo?.country?.code ?? null,
      city: context?.geo?.city ?? null,
      ts: new Date().toISOString(),
    }),
    { headers: { "content-type": "application/json" } }
  );
};
