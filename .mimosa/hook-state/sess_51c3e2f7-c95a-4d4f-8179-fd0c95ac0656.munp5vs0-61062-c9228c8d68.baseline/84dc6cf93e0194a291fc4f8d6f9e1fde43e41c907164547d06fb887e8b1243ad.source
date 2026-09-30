// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Cron Jobs target endpoint. Registered in vercel.json crons; frontend probe
// measures reachability only (not whether the schedule fired).

export default function handler(_req, res) {
  res.setHeader("content-type", "application/json");
  res.status(200).json({
    ok: true,
    product: "Cron Jobs",
    ts: new Date().toISOString(),
  });
}
