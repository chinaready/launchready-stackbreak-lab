// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Background Function. The "-background" suffix tells Netlify to run this
// asynchronously and answer the HTTP request with 202 Accepted immediately.
// The probe verdicts on that 202 (the request reached the platform).

export default async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  console.log("background task received", body);
  // Return value is ignored for background functions.
};
