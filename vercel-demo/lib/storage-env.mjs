// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Resolves Vercel Storage credentials from standard or legacy env names.
// Prefer BLOB_* / UPSTASH_*; pub_* and KV_* are accepted for local .env aliases.

export function blobCredentials() {
  return {
    token:
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.pub_READ_WRITE_TOKEN ||
      "",
    storeId:
      process.env.BLOB_STORE_ID || process.env.pub_STORE_ID || "",
  };
}

export function kvCredentials() {
  return {
    url: (
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_REST_API_URL ||
      ""
    ).replace(/\/+$/, ""),
    token:
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      "",
  };
}
