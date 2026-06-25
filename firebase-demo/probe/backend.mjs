// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Backend-path probes: what the app's server in mainland China does via the
// Admin SDK (service-account auth). Measures real authenticated operations, not
// just host reachability. Meaningful only when run from mainland China.
//
// Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";
import { getRemoteConfig } from "firebase-admin/remote-config";
import { readFileSync, appendFileSync } from "node:fs";

const SLOW = Number(process.env.SLOW_THRESHOLD ?? 5);
const MAX_MS = Number(process.env.MAX_TIME ?? 30) * 1000;
const OUT = process.env.OUT_NDJSON || "";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("error: set GOOGLE_APPLICATION_CREDENTIALS to the service account JSON path");
  process.exit(1);
}
const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

function emit(o) {
  if (OUT) appendFileSync(OUT, JSON.stringify(o) + "\n");
  console.log(
    `  ${o.name.padEnd(30)} ${o.verdict.padEnd(9)} ${o.httpCode.padEnd(8)} total=${o.totalSec}s`
  );
}

// A Google service error (reached the API) vs a transport error (could not).
function isServiceError(err) {
  const code = String(err?.code ?? "");
  return code.includes("/") || Boolean(err?.errorInfo);
}

async function timed(id, name, product, endpoint, fn) {
  const start = performance.now();
  let verdict, httpCode = "ok";
  try {
    await Promise.race([
      fn(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("probe-timeout")), MAX_MS)),
    ]);
    const total = (performance.now() - start) / 1000;
    verdict = total > SLOW ? "Degraded" : "Reachable";
    emit({ id, name, product, path: "backend", endpoint, httpCode, totalSec: Number(total.toFixed(6)), curlExit: 0, verdict });
    return;
  } catch (err) {
    const total = (performance.now() - start) / 1000;
    if (err.message === "probe-timeout") {
      verdict = "Blocked"; httpCode = "timeout";
    } else if (isServiceError(err)) {
      // Reached the API; it answered with an app-level error.
      verdict = total > SLOW ? "Degraded" : "Reachable";
      httpCode = String(err.code ?? "error");
    } else {
      verdict = "Blocked"; httpCode = String(err.code ?? "neterr");
    }
    emit({ id, name, product, path: "backend", endpoint, httpCode, totalSec: Number(total.toFixed(6)), curlExit: 1, verdict });
  }
}

console.log("Backend path (server in mainland China, Admin SDK)");
console.log("--------------------------------------------------");

const db = getFirestore();

// Firestore: server write + read-back.
await timed("firestore-write", "Firestore write+read", "Cloud Firestore",
  "firestore.googleapis.com", async () => {
    const ref = db.collection("probes").doc(`run-${Date.now()}`);
    await ref.set({ ts: FieldValue.serverTimestamp(), source: "backend-probe" });
    await ref.get();
  });

// Storage: object metadata via Admin SDK.
if (process.env.FIREBASE_STORAGE_BUCKET) {
  await timed("storage-metadata", "Storage metadata", "Cloud Storage",
    "storage.googleapis.com", async () => {
      await getStorage().bucket().file("probes/field-report-sample.jpg").getMetadata();
    });
}

// Auth admin: look up the demo user.
await timed("auth-admin", "Auth admin lookup", "Authentication",
  "identitytoolkit.googleapis.com", async () => {
    if (process.env.DEMO_USER_EMAIL) {
      await getAuth().getUserByEmail(process.env.DEMO_USER_EMAIL);
    } else {
      await getAuth().listUsers(1);
    }
  });

// FCM v1 send (dry run). Any token reaches FCM; an invalid one returns a real
// API error, which still proves backend -> FCM reachability.
await timed("fcm-send", "FCM v1 send (dry-run)", "Cloud Messaging (FCM)",
  "fcm.googleapis.com", async () => {
    const token = process.env.FCM_TEST_TOKEN || "INVALID_TOKEN_FOR_REACHABILITY_PROBE";
    await getMessaging().send({ token, data: { probe: "1" } }, true);
  });

// Remote Config: fetch the active template.
await timed("remoteconfig-template", "Remote Config template", "Remote Config",
  "firebaseremoteconfig.googleapis.com", async () => {
    await getRemoteConfig().getTemplate();
  });

console.log("");
process.exit(0);
