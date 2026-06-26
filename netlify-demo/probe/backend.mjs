// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Backend-path probes: what the app's server in mainland China does against the
// Netlify control plane (api.netlify.com) with a personal access token, plus a
// server-to-site call. Uses built-in fetch (Node 18+). An HTTP answer of any
// status means the host was reachable; only a transport failure is "Blocked".
// Meaningful only when run from mainland China.
//
// Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

import { appendFileSync } from "node:fs";

const SLOW = Number(process.env.SLOW_THRESHOLD ?? 5);
const MAX_MS = Number(process.env.MAX_TIME ?? 30) * 1000;
const OUT = process.env.OUT_NDJSON || "";

const TOKEN = process.env.NETLIFY_AUTH_TOKEN || "";
const SITE_ID = process.env.NETLIFY_SITE_ID || "";
const SITE_URL = (process.env.NETLIFY_SITE_URL || "").replace(/\/+$/, "");
const API = "https://api.netlify.com/api/v1";

function emit(o) {
  if (OUT) appendFileSync(OUT, JSON.stringify(o) + "\n");
  console.log(
    `  ${o.name.padEnd(30)} ${o.verdict.padEnd(9)} ${String(o.httpCode).padEnd(8)} total=${o.totalSec}s`
  );
}

// One timed HTTP probe. Reaching the host (any status) verdicts Reachable/Degraded;
// a thrown fetch (DNS, TLS, reset, timeout) verdicts Blocked.
async function probe(id, name, product, endpoint, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MAX_MS);
  const start = performance.now();
  try {
    const res = await fetch(endpoint, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": "netlify-china-probe/1.0 (+https://chinaready.co)",
        ...(init.headers || {}),
      },
    });
    // Drain the body so the connection completes and timing is honest.
    await res.text().catch(() => {});
    const total = (performance.now() - start) / 1000;
    const verdict = total > SLOW ? "Degraded" : "Reachable";
    emit({ id, name, product, path: "backend", endpoint, httpCode: String(res.status), totalSec: Number(total.toFixed(6)), curlExit: 0, verdict });
  } catch (err) {
    const total = (performance.now() - start) / 1000;
    const aborted = err?.name === "AbortError";
    const httpCode = aborted ? "timeout" : "neterr";
    emit({ id, name, product, path: "backend", endpoint, httpCode, totalSec: Number(total.toFixed(6)), curlExit: 1, verdict: "Blocked" });
  } finally {
    clearTimeout(timer);
  }
}

const authHeaders = TOKEN ? { authorization: `Bearer ${TOKEN}` } : {};

console.log("Backend path (server in mainland China, Netlify API)");
console.log("----------------------------------------------------");

// Control plane: account lookup (proves the API host + auth path is reachable).
await probe("api-user", "API current user", "Netlify API",
  `${API}/user`, { headers: authHeaders });

if (SITE_ID) {
  // Site metadata.
  await probe("api-site", "API site lookup", "Netlify API",
    `${API}/sites/${SITE_ID}`, { headers: authHeaders });

  // Deploys list (the build/deploy control path).
  await probe("api-deploys", "API deploys list", "Deploys",
    `${API}/sites/${SITE_ID}/deploys?per_page=1`, { headers: authHeaders });

  // Forms: server-side read of form definitions.
  await probe("api-forms", "API forms list", "Forms",
    `${API}/sites/${SITE_ID}/forms`, { headers: authHeaders });
} else {
  console.log("  (NETLIFY_SITE_ID unset — skipping site/deploys/forms API probes)");
}

// Server-to-site: the mainland server invoking the deployed function directly.
if (SITE_URL) {
  await probe("server-invoke", "Server -> Function invoke", "Functions",
    `${SITE_URL}/.netlify/functions/hello`);
}

console.log("");
process.exit(0);
