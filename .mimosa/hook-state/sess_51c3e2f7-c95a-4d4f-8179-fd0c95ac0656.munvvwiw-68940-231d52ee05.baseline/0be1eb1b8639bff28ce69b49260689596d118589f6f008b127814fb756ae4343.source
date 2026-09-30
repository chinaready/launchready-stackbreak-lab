// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Diagnostic Edge Function: echoes the Netlify edge runtime region that served
// the request, plus geo/ip/requestId. `serverRegion` (e.g. "aws-sin") is the
// region Netlify ran this edge function in — more reliable than an IP geo lookup
// for telling which PoP/edge a mainland-China request actually landed on.
// Served at /__where with no caching so every hit reflects the live edge.

import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return Response.json(
    {
      requestId: context.requestId,
      serverRegion: context.server?.region,
      geo: context.geo,
      ip: context.ip,
      url: request.url,
      time: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
};

export const config = {
  path: "/__where",
};
