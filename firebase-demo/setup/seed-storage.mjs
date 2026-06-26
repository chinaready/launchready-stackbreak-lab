// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Upload a small public sample object so the Storage frontend probe can fetch
// real bytes over the download path. Writes probes/field-report-sample.jpg.
//
// Usage (from firebase-demo/): node setup/seed-storage.mjs
// Requires GOOGLE_APPLICATION_CREDENTIALS and FIREBASE_STORAGE_BUCKET.

import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "node:fs";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
if (!credPath || !bucketName) {
  console.error("error: set GOOGLE_APPLICATION_CREDENTIALS and FIREBASE_STORAGE_BUCKET");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));
initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName });
const bucket = getStorage().bucket();

// A 1x1 JPEG (base64) stands in for a field-report photo — small, real bytes.
const jpegBase64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

const objectPath = "probes/field-report-sample.jpg";
await bucket.file(objectPath).save(Buffer.from(jpegBase64, "base64"), {
  contentType: "image/jpeg",
  resumable: false,
  metadata: { cacheControl: "public, max-age=300" },
});
await bucket.file(objectPath).makePublic();

console.log(`Uploaded ${objectPath} to ${bucketName} (public).`);
process.exit(0);
