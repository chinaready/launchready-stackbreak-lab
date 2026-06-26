#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Frontend-path probes: what the user's browser in mainland China calls directly
# on the deployed Netlify site. Pure curl against the live *.netlify.app URL.
# Meaningful only when run from mainland China.
#
# Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

set -uo pipefail

SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"
MAX_TIME="${MAX_TIME:-30}"
UA="netlify-china-probe/1.0 (+https://chinaready.co)"

: "${NETLIFY_SITE_URL:?set NETLIFY_SITE_URL to your deployed site, e.g. https://stackbreak-netlify.netlify.app}"
SITE="${NETLIFY_SITE_URL%/}"

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

echo "Frontend path (browser in mainland China) -> $SITE"
echo "-------------------------------------------------"

# Static hosting / CDN: the site root.
probe "cdn" "Static hosting (CDN)" "Hosting / CDN" "$SITE/"

# Image CDN: transform a site-local image.
probe "image-cdn" "Image CDN transform" "Image CDN" \
  "$SITE/.netlify/images?url=%2Fphoto.png&w=160"

# Redirects: 301 rule (do NOT follow — the 3xx itself proves the engine ran).
probe "redirect" "Redirect rule (301)" "Redirects & rewrites" "$SITE/old-report"

# Rewrites: 200 rewrite to a function.
probe "rewrite" "Rewrite to function (200)" "Redirects & rewrites" "$SITE/api/hello"

# Functions: plain HTTP function.
probe "fn-hello" "Function helloProbe" "Functions" "$SITE/.netlify/functions/hello"

# Functions + Blobs: POST a report; the function writes + reads back a blob.
probe "fn-blobs" "Function + Blobs stamp" "Blobs" \
  "$SITE/.netlify/functions/stamp-report" \
  -X POST -H "Content-Type: application/json" -d '{"text":"frontend probe"}'

# Edge Functions: the /banner route handled at the edge.
probe "edge-banner" "Edge Function banner" "Edge Functions" "$SITE/banner"

# Background Functions: returns 202 Accepted.
probe "fn-background" "Background Function" "Background Functions" \
  "$SITE/.netlify/functions/report-background" \
  -X POST -H "Content-Type: application/json" -d '{"text":"bg probe"}'

# Scheduled Functions: endpoint reachability (invoked by Netlify on a cron).
probe "fn-scheduled" "Scheduled Function" "Scheduled Functions" \
  "$SITE/.netlify/functions/scheduled-ping"

# Forms: a Netlify Form submission (url-encoded, with form-name).
probe "form" "Form submission" "Forms" "$SITE/" \
  -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "form-name=field-report" \
  --data-urlencode "reporter=probe" \
  --data-urlencode "text=frontend probe submission"

# Identity (GoTrue): public settings endpoint (no auth required).
probe "identity" "Identity settings" "Identity" "$SITE/.netlify/identity/settings"

echo
