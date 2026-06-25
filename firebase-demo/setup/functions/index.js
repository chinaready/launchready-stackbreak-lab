// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Demo Cloud Functions for the field-reports app.
//   helloProbe  — public HTTP endpoint; the frontend path curls it directly.
//   stampReport — callable; the client SDK invokes it to stamp a report.
// Both exist so the China probe can measure real function latency, not just
// host reachability. Requires Blaze billing to deploy.

import { onRequest, onCall } from "firebase-functions/v2/https";

export const helloProbe = onRequest({ cors: true }, (req, res) => {
  res.json({
    ok: true,
    service: "helloProbe",
    receivedAt: new Date().toISOString(),
  });
});

export const stampReport = onCall((request) => {
  const reportId = request.data?.reportId ?? null;
  return {
    ok: true,
    reportId,
    stampedAt: new Date().toISOString(),
    caller: request.auth?.uid ?? "anonymous",
  };
});
