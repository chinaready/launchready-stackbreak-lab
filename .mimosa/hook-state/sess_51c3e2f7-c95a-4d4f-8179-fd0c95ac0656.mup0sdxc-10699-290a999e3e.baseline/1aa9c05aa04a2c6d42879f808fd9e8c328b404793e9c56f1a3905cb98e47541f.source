// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Plain Serverless Function. Reachable at /api/hello and via the /probe-hello
// rewrite. Returns the edge region so a successful call shows which PoP served
// mainland China.

export default function handler(_req, res) {
  res.setHeader("content-type", "application/json");
  res.status(200).json({
    ok: true,
    product: "Functions",
    region: process.env.VERCEL_REGION ?? null,
    ts: new Date().toISOString(),
  });
}
