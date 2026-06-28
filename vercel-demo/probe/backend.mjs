// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Backend-path probes: what the app's server in mainland China does against the
// Vercel control plane (api.vercel.com) with a personal access token, Storage
// REST endpoints, plus a server-to-site call. Uses built-in fetch (Node 18+).
// Meaningful only when run from mainland China.
//
// Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

import { appendFileSync } from "node:fs";
import { blobCredentials, kvCredentials } from "../lib/storage-env.mjs";

const SLOW = Number(process.env.SLOW_THRESHOLD ?? 5);
const MAX_MS = Number(process.env.MAX_TIME ?? 30) * 1000;
const OUT = process.env.OUT_NDJSON || "";

const TOKEN = process.env.VERCEL_TOKEN || "";
const ORG_ID = process.env.VERCEL_ORG_ID || "";
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || "";
const SITE_URL = (process.env.VERCEL_SITE_URL || "").replace(/\/+$/, "");
const { url: KV_URL, token: KV_TOKEN } = kvCredentials();
const { token: BLOB_TOKEN } = blobCredentials();
const API = "https://api.vercel.com";

function emit(o) {
  if (OUT) appendFileSync(OUT, JSON.stringify(o) + "\n");
  console.log(
    `  ${o.name.padEnd(30)} ${o.verdict.padEnd(9)} ${String(o.httpCode).padEnd(8)} total=${o.totalSec}s`
  );
}

async function probe(id, name, product, endpoint, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MAX_MS);
  const start = performance.now();
  try {
    const res = await fetch(endpoint, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": "vercel-china-probe/1.0 (+https://chinaready.co)",
        ...(init.headers || {}),
      },
    });
    await res.text().catch(() => {});
    const total = (performance.now() - start) / 1000;
    const verdict = total > SLOW ? "Degraded" : "Reachable";
    emit({
      id,
      name,
      product,
      path: "backend",
      endpoint,
      httpCode: String(res.status),
      totalSec: Number(total.toFixed(6)),
      curlExit: 0,
      verdict,
    });
  } catch (err) {
    const total = (performance.now() - start) / 1000;
    const aborted = err?.name === "AbortError";
    const httpCode = aborted ? "timeout" : "neterr";
    emit({
      id,
      name,
      product,
      path: "backend",
      endpoint,
      httpCode,
      totalSec: Number(total.toFixed(6)),
      curlExit: 1,
      verdict: "Blocked",
    });
  } finally {
    clearTimeout(timer);
  }
}

const authHeaders = TOKEN ? { authorization: `Bearer ${TOKEN}` } : {};
const teamQuery = ORG_ID ? `?teamId=${encodeURIComponent(ORG_ID)}` : "";

console.log("Backend path (server in mainland China, Vercel API + Storage)");
console.log("-------------------------------------------------------------");

await probe("api-user", "API current user", "Vercel API", `${API}/v2/user`, {
  headers: authHeaders,
});

if (PROJECT_ID) {
  await probe(
    "api-project",
    "API project lookup",
    "Vercel API",
    `${API}/v9/projects/${PROJECT_ID}${teamQuery}`,
    { headers: authHeaders }
  );

  await probe(
    "api-deploys",
    "API deployments list",
    "Deploys",
    `${API}/v6/deployments?projectId=${encodeURIComponent(PROJECT_ID)}&limit=1${ORG_ID ? `&teamId=${encodeURIComponent(ORG_ID)}` : ""}`,
    { headers: authHeaders }
  );
} else {
  console.log("  (VERCEL_PROJECT_ID unset — skipping project/deployments API probes)");
}

if (KV_URL && KV_TOKEN) {
  await probe(
    "kv-rest",
    "KV REST get",
    "KV",
    `${KV_URL}/get/china-probe`,
    { headers: { authorization: `Bearer ${KV_TOKEN}` } }
  );
} else {
  console.log("  (KV storage env unset — skipping KV REST probe)");
}

if (BLOB_TOKEN) {
  await probe(
    "blob-rest",
    "Blob REST list",
    "Blob",
    "https://blob.vercel-storage.com?prefix=field-reports%2F&limit=1",
    { headers: { authorization: `Bearer ${BLOB_TOKEN}` } }
  );
} else {
  console.log("  (BLOB_READ_WRITE_TOKEN / pub_READ_WRITE_TOKEN unset — skipping Blob REST probe)");
}

if (SITE_URL) {
  await probe(
    "server-invoke",
    "Server -> Function invoke",
    "Functions",
    `${SITE_URL}/api/hello`
  );
}

console.log("");
process.exit(0);
