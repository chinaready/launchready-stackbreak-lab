// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Scheduled Function. Netlify invokes it on the cron in `config.schedule`; it is
// not meant to be called by end users. The probe only checks that the function
// endpoint is reachable from mainland China (any HTTP answer = the host replied).

export default async () => {
  console.log("scheduled ping", new Date().toISOString());
  return new Response("ok");
};

export const config = {
  schedule: "@hourly",
};
