// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Seed the `reports` collection with a few field-report documents so the
// frontend and backend probes read real data. Idempotent: fixed doc IDs.
//
// Usage (from firebase-demo/): node setup/seed-firestore.mjs
// Requires GOOGLE_APPLICATION_CREDENTIALS pointing at the service account JSON.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("error: set GOOGLE_APPLICATION_CREDENTIALS to the service account JSON path");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const reports = [
  { id: "report-001", title: "Bridge inspection — Haidian", body: "Cracking on north pier; photo attached.", authorUid: "seed-demo-user" },
  { id: "report-002", title: "Signage fault — Chaoyang", body: "Exit sign unlit at 22:00.", authorUid: "seed-demo-user" },
  { id: "report-003", title: "Flood marker — Tongzhou", body: "Water 0.3m above marker after rain.", authorUid: "seed-demo-user" },
];

const batch = db.batch();
for (const r of reports) {
  const ref = db.collection("reports").doc(r.id);
  batch.set(ref, {
    title: r.title,
    body: r.body,
    authorUid: r.authorUid,
    createdAt: FieldValue.serverTimestamp(),
    seeded: true,
  });
}
await batch.commit();

console.log(`Seeded ${reports.length} report(s) into 'reports'.`);
process.exit(0);
