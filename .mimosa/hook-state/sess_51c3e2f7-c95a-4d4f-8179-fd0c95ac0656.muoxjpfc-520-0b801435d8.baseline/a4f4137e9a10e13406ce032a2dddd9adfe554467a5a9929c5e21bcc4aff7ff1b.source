#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Frontend-path probes: what the user's browser in mainland China calls directly
# on the deployed Vercel site. Pure curl against the live *.vercel.app URL.
# Meaningful only when run from mainland China.
#
# Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

set -uo pipefail

SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"
MAX_TIME="${MAX_TIME:-30}"
UA="vercel-china-probe/1.0 (+https://chinaready.co)"

: "${VERCEL_SITE_URL:?set VERCEL_SITE_URL to your deployed site, e.g. https://stackbreak-vercel.vercel.app}"
SITE="${VERCEL_SITE_URL%/}"

verdict_for() { # exit code total -> verdict
  local e="$1" c="$2" t="$3"
  if [ "$e" -ne 0 ] || [ "$c" = "000" ]; then echo "Blocked"
  elif awk "BEGIN{exit !($t > $SLOW_THRESHOLD)}"; then echo "Degraded"
  else echo "Reachable"; fi
}

emit() { # id name product path endpoint code total exit verdict
  [ -n "${OUT_NDJSON:-}" ] || return 0
  printf '{"id":"%s","name":"%s","product":"%s","path":"%s","endpoint":"%s","httpCode":"%s","totalSec":%s,"curlExit":%s,"verdict":"%s"}\n' \
    "$1" "$2" "$3" "$4" "$5" "$6" "${7:-0}" "${8:-0}" "$9" >> "$OUT_NDJSON"
}

probe() { # id name product url [extra curl args...]
  local id="$1" name="$2" product="$3" url="$4"; shift 4
  local metrics code total ex verdict
  metrics="$(curl -sS -o /dev/null -A "$UA" \
    --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -w '%{http_code} %{time_total}' "$@" "$url" 2>/dev/null)"
  ex=$?
  code="$(awk '{print $1}' <<<"$metrics")"; total="$(awk '{print $2}' <<<"$metrics")"
  [ -n "$code" ] || code="000"; [ -n "$total" ] || total="0"
  verdict="$(verdict_for "$ex" "$code" "$total")"
  emit "$id" "$name" "$product" "frontend" "$url" "$code" "$total" "$ex" "$verdict"
  printf '  %-30s %-9s code=%-4s total=%ss\n' "$name" "$verdict" "$code" "$total"
}

probe_headers() { # id name product url header_name
  local id="$1" name="$2" product="$3" url="$4" header="$5"
  local metrics code total ex verdict val
  metrics="$(curl -sS -o /dev/null -A "$UA" \
    --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -D - "$url" 2>/dev/null | tr -d '\r')"
  ex=$?
  val="$(grep -i "^${header}:" <<<"$metrics" | tail -1 | cut -d: -f2- | sed 's/^ //')"
  code="$(grep -m1 '^HTTP/' <<<"$metrics" | awk '{print $2}')"
  total="0"
  [ -n "$code" ] || code="000"
  if [ "$ex" -ne 0 ] || [ "$code" = "000" ]; then verdict="Blocked"
  elif [ -z "$val" ]; then verdict="Degraded"
  else verdict="Reachable"; fi
  emit "$id" "$name" "$product" "frontend" "$url" "$code" "$total" "$ex" "$verdict"
  printf '  %-30s %-9s code=%-4s header=%s\n' "$name" "$verdict" "$code" "${val:-<missing>}"
}

echo "Frontend path (browser in mainland China) -> $SITE"
echo "-------------------------------------------------"

probe "cdn" "Static hosting (CDN)" "Hosting / CDN" "$SITE/"

probe "redirect" "Redirect rule (301)" "Redirects & rewrites" "$SITE/old-report"

probe "rewrite" "Rewrite to function (200)" "Redirects & rewrites" "$SITE/probe-hello"

probe "fn-hello" "Function helloProbe" "Functions" "$SITE/api/hello"

probe "fn-blob" "Function + Blob stamp" "Blob" \
  "$SITE/api/stamp-report" \
  -X POST -H "Content-Type: application/json" -d '{"text":"frontend probe"}'

probe "fn-kv" "Function + KV ping" "KV" "$SITE/api/kv-ping"

probe "edge-banner" "Edge Middleware banner" "Edge Middleware" "$SITE/banner"

probe "cron" "Cron endpoint" "Cron Jobs" "$SITE/api/cron-ping"

probe_headers "headers" "Custom response header" "Headers" "$SITE/" "X-Stackbreak-Probe"

echo
