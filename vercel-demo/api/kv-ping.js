// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Functions + KV: sets and reads back a china-probe key, proving the KV data
// path works from a mainland request. GET or POST.

import { kv } from "@vercel/kv";

const KEY = "china-probe";

export default async function handler(req, res) {
  const value = {
    probe: "kv-ping",
    method: req.method,
    ts: new Date().toISOString(),
  };

  await kv.set(KEY, value);
  const readBack = await kv.get(KEY);

  res.setHeader("content-type", "application/json");
  res.status(200).json({ ok: true, product: "KV", value: readBack });
}
