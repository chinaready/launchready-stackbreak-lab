// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Functions + Blob: writes a report record into Vercel Blob and reads it back,
// proving the Blob data path works from a mainland request. POST JSON { text }.

import { head, put } from "@vercel/blob";
import { blobCredentials } from "../lib/storage-env.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, storeId } = blobCredentials();
  if (!token) {
    return res.status(500).json({
      ok: false,
      product: "Blob",
      error: "BLOB_READ_WRITE_TOKEN (or pub_READ_WRITE_TOKEN) not set",
    });
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  } catch {
    body = {};
  }

  const id = `report-${Date.now()}`;
  const record = {
    id,
    text: typeof body.text === "string" ? body.text : "probe report",
    reporter: typeof body.reporter === "string" ? body.reporter : "probe",
    stampedAt: new Date().toISOString(),
  };

  const pathname = `field-reports/${id}.json`;
  const putOptions = {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token,
  };
  if (storeId) putOptions.storeId = storeId;

  try {
    const blob = await put(pathname, JSON.stringify(record), putOptions);
    const meta = await head(blob.url, { token });

    res.setHeader("content-type", "application/json");
    res.status(200).json({
      ok: true,
      product: "Blob",
      record,
      blob: { url: blob.url, pathname: blob.pathname, size: meta.size },
    });
  } catch (err) {
    res.setHeader("content-type", "application/json");
    res.status(500).json({
      ok: false,
      product: "Blob",
      error: err?.message || String(err),
    });
  }
}
