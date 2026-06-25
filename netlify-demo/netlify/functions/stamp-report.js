// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Functions + Blobs: writes a report record into a Netlify Blobs store and reads
// it back, proving the Blobs data path works from a mainland request. Reachable
// at /.netlify/functions/stamp-report (POST JSON { text }).

import { getStore } from "@netlify/blobs";

export default async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const store = getStore("field-reports");
  const id = `report-${Date.now()}`;
  const record = {
    id,
    text: typeof body.text === "string" ? body.text : "probe report",
    reporter: typeof body.reporter === "string" ? body.reporter : "probe",
    stampedAt: new Date().toISOString(),
  };

  await store.setJSON(id, record);
  const readBack = await store.get(id, { type: "json" });

  return new Response(
    JSON.stringify({ ok: true, product: "Blobs", record: readBack }),
    { headers: { "content-type": "application/json" } }
  );
};
