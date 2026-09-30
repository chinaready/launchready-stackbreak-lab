#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Page-resource latency probe: measures the weight and load latency of the
# demo site's static assets and key dynamic endpoints as a mainland-China browser
# would experience them, plus the Vercel edge region from /__where.
#
# Output:
#   results/<YYYY-MM-DD>/vercel-resources.json
#   results/<YYYY-MM-DD>/vercel-resources.md
#   results/vercel-resources-latest.json

set -uo pipefail

PROBE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$PROBE_DIR/.." && pwd)"
ROOT_DIR="$(cd "$DEMO_DIR/.." && pwd)"

for envfile in "$ROOT_DIR/.env" "$DEMO_DIR/.env"; do
  if [ -f "$envfile" ]; then set -a; . "$envfile"; set +a; echo "Loaded env: $envfile"; break; fi
done

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' not found in PATH" >&2; exit 1; }
done

: "${VERCEL_SITE_URL:?set VERCEL_SITE_URL to your deployed site}"
SITE="${VERCEL_SITE_URL%/}"

SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"
MAX_TIME="${MAX_TIME:-60}"
UA="vercel-china-probe/1.0 (+https://chinaready.co)"

CLOUD_PROVIDER="${CLOUD_PROVIDER:-unknown}"
CLOUD_REGION="${CLOUD_REGION:-unknown}"
RUNNER_HOST="${RUNNER_HOST:-unknown}"

DATE="$(date +%F)"
GENERATED_AT="$(date -u +%FT%TZ)"
OUT_DIR="$ROOT_DIR/results/$DATE"
mkdir -p "$OUT_DIR"
NDJSON="$(mktemp)"

verdict_for() { local e="$1" c="$2" t="$3"
  if [ "$e" -ne 0 ] || [ "$c" = "000" ]; then echo "Blocked"
  elif awk "BEGIN{exit !($t > $SLOW_THRESHOLD)}"; then echo "Degraded"
  else echo "Reachable"; fi
}

res_probe() { # id name kind url [extra curl args...]
  local id="$1" name="$2" kind="$3" url="$4"; shift 4
  local m code ttfb total size speed ex verdict mbps
  m="$(curl -sS -o /dev/null -A "$UA" \
    --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -w '%{http_code} %{time_starttransfer} %{time_total} %{size_download} %{speed_download}' \
    "$@" "$url" 2>/dev/null)"
  ex=$?
  code="$(awk '{print $1}' <<<"$m")"; ttfb="$(awk '{print $2}' <<<"$m")"
  total="$(awk '{print $3}' <<<"$m")"; size="$(awk '{print $4}' <<<"$m")"
  speed="$(awk '{print $5}' <<<"$m")"
  [ -n "$code" ] || code="000"; [ -n "$ttfb" ] || ttfb="0"
  [ -n "$total" ] || total="0"; [ -n "$size" ] || size="0"; [ -n "$speed" ] || speed="0"
  mbps="$(awk "BEGIN{printf \"%.3f\", ($speed*8)/1000000}")"
  verdict="$(verdict_for "$ex" "$code" "$total")"
  printf '{"id":"%s","name":"%s","kind":"%s","url":"%s","httpCode":"%s","bytes":%s,"ttfbSec":%s,"totalSec":%s,"throughputMbps":%s,"verdict":"%s"}\n' \
    "$id" "$name" "$kind" "$url" "$code" "$size" "$ttfb" "$total" "$mbps" "$verdict" >> "$NDJSON"
  printf '  %-26s %-9s %-5s %8s B  ttfb=%-7ss total=%-7ss %s Mbps\n' "$name" "$verdict" "$code" "$size" "$ttfb" "$total" "$mbps"
}

echo "Page-resource latency — $GENERATED_AT"
echo "Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
echo "Site: $SITE"
echo

where_json="$(curl -sS -A "$UA" --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" "$SITE/__where?t=$(date +%s)" 2>/dev/null)"
server_region="$(jq -r '.serverRegion // "unknown"' <<<"$where_json" 2>/dev/null)"
[ -n "$server_region" ] || server_region="unknown"
geo_json="$(jq -c '.geo // {}' <<<"$where_json" 2>/dev/null)"; [ -n "$geo_json" ] || geo_json="{}"
echo "Edge serverRegion: $server_region"
echo

echo "Document + dynamic endpoints"
echo "----------------------------"
res_probe "doc"      "HTML document"          "endpoint" "$SITE/"
res_probe "where"    "Edge region (/__where)" "endpoint" "$SITE/__where?t=$(date +%s)"
res_probe "fn-hello" "Function (hello)"       "endpoint" "$SITE/api/hello"
res_probe "edge"     "Edge Middleware (banner)" "endpoint" "$SITE/banner"
res_probe "fn-kv"    "Function + KV"          "endpoint" "$SITE/api/kv-ping"
echo

echo "Raw static assets (full weight)"
echo "-------------------------------"
res_probe "raw-1mb"    "Raw asset ~1 MB"  "raw" "$SITE/assets/weight-1mb.png"
res_probe "raw-3mb"    "Raw asset ~3 MB"  "raw" "$SITE/assets/weight-3mb.png"
res_probe "raw-6mb"    "Raw asset ~6 MB"  "raw" "$SITE/assets/weight-6mb.png"
res_probe "raw-source" "Raw source 2400"  "raw" "$SITE/assets/scene-2400.png"
echo

resources_json="$(jq -s '.' "$NDJSON")"
rm -f "$NDJSON"

run_doc="$(jq -n \
  --arg generatedAt "$GENERATED_AT" \
  --arg cloudProvider "$CLOUD_PROVIDER" --arg cloudRegion "$CLOUD_REGION" --arg runnerHost "$RUNNER_HOST" \
  --arg demoSiteUrl "$SITE" \
  --arg blobRegion "${BLOB_REGION:-unknown}" \
  --arg redisRegion "${REDIS_REGION:-unknown}" \
  --arg serverRegion "$server_region" --argjson geo "$geo_json" \
  --argjson resources "$resources_json" \
  '{generatedAt:$generatedAt,
    environment:{cloudProvider:$cloudProvider,cloudRegion:$cloudRegion,runnerHost:$runnerHost},
    demoSiteUrl:$demoSiteUrl,
    storage:{blobRegion:$blobRegion,redisRegion:$redisRegion},
    edge:{serverRegion:$serverRegion,geo:$geo},
    resources:$resources}')"

echo "$run_doc" > "$OUT_DIR/vercel-resources.json"
echo "$run_doc" > "$ROOT_DIR/results/vercel-resources-latest.json"

{
  echo "# Vercel page-resource latency — $DATE"
  echo
  echo "- Generated: $GENERATED_AT"
  echo "- Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
  echo "- Site: $SITE"
  echo "- Edge serverRegion: $server_region"
  echo "- Blob region: ${BLOB_REGION:-unknown}"
  echo "- Redis region: ${REDIS_REGION:-unknown}"
  echo
  echo "| Resource | Type | HTTP | Bytes | TTFB (s) | Total (s) | Mbps | Verdict |"
  echo "|---|---|---|---|---|---|---|---|"
  echo "$resources_json" | jq -r '.[] | "| \(.name) | \(.kind) | \(.httpCode) | \(.bytes) | \(.ttfbSec) | \(.totalSec) | \(.throughputMbps) | \(.verdict) |"'
} > "$OUT_DIR/vercel-resources.md"

echo
echo "Wrote:"
echo "  $OUT_DIR/vercel-resources.json"
echo "  $OUT_DIR/vercel-resources.md"
echo "  $ROOT_DIR/results/vercel-resources-latest.json"
