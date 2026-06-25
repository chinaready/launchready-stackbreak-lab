// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Plain HTTP Function (Netlify Functions v2). Reachable at
// /.netlify/functions/hello and via the /api/hello rewrite. Returns the edge
// node's geo so a successful call also shows which PoP served mainland China.

export default async (req, context) => {
  return new Response(
    JSON.stringify({
      ok: true,
      product: "Functions",
      country: context?.geo?.country?.code ?? null,
      city: context?.geo?.city ?? null,
      ts: new Date().toISOString(),
    }),
    { headers: { "content-type": "application/json" } }
  );
};
