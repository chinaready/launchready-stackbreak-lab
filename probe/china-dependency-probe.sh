#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Stack Break Lab — network probe.
# Runs DNS + HTTP checks against every target in targets.json and writes a verdict per service.
# Verdicts are only meaningful when run from mainland China. Run from anywhere to see the format.
#
# Output:
#   results/<YYYY-MM-DD>/probe.json    full structured run
#   results/<YYYY-MM-DD>/probe.md      human-readable table
#   results/latest.json                { generatedAt, environment, services } (browser[] merged later)
#
# Dependencies: bash, curl, dig (bind / dnsutils), jq.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGETS="$SCRIPT_DIR/targets.json"

# Slow threshold (seconds): connected but slower than this is "Degraded".
SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"
MAX_TIME="${MAX_TIME:-15}"
DNS_SERVER="${DNS_SERVER:-223.5.5.5}" # AliDNS by default; meaningful from China.

# Environment metadata (provenance), overridable via .env / CI.
CLOUD_PROVIDER="${CLOUD_PROVIDER:-unknown}"
CLOUD_REGION="${CLOUD_REGION:-unknown}"
RUNNER_HOST="${RUNNER_HOST:-unknown}"

for bin in curl dig jq; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "error: required tool '$bin' not found in PATH" >&2
    exit 1
  fi
done

DATE="$(date +%F)"
GENERATED_AT="$(date -u +%FT%TZ)"
OUT_DIR="$ROOT_DIR/results/$DATE"
mkdir -p "$OUT_DIR"

echo "Stack Break Lab probe — $GENERATED_AT"
echo "Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
echo "DNS server: $DNS_SERVER, slow threshold: ${SLOW_THRESHOLD}s"
echo

services_json="[]"

while IFS= read -r row; do
  id="$(echo "$row" | jq -r '.id')"
  name="$(echo "$row" | jq -r '.name')"
  category="$(echo "$row" | jq -r '.category')"
  domain="$(echo "$row" | jq -r '.domain')"
  url="$(echo "$row" | jq -r '.url')"
  demo="$(echo "$row" | jq -r '.demoPath')"
  symptom="$(echo "$row" | jq -r '.symptom // ""')"

  # DNS resolution.
  dns_answer="$(dig +short +time=5 +tries=1 "@$DNS_SERVER" "$domain" 2>/dev/null | head -n1 || true)"
  if [ -n "$dns_answer" ]; then dns_resolved="true"; else dns_resolved="false"; fi

  # HTTP probe. curl exit code 0 = transfer ok (any HTTP status counts as connected).
  set +e
  metrics="$(curl -sS -o /dev/null \
    -A "stackbreak-probe/1.0 (+https://stackbreak.launchready.cn)" \
    --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -w '%{http_code} %{time_connect} %{time_appconnect} %{time_total}' \
    "$url" 2>/dev/null)"
  curl_exit=$?
  set -e

  http_code="000"; connect_s="0"; ssl_s="0"; total_s="0"
  if [ -n "$metrics" ]; then
    http_code="$(echo "$metrics" | awk '{print $1}')"
    connect_s="$(echo "$metrics" | awk '{print $2}')"
    ssl_s="$(echo "$metrics" | awk '{print $3}')"
    total_s="$(echo "$metrics" | awk '{print $4}')"
  fi

  # Verdict.
  if [ "$curl_exit" -ne 0 ] || [ "$http_code" = "000" ]; then
    verdict="Blocked"
  elif awk "BEGIN{exit !($total_s > $SLOW_THRESHOLD)}"; then
    verdict="Degraded"
  else
    verdict="Reachable"
  fi

  printf '  %-22s %-10s code=%-4s total=%ss dns=%s\n' "$name" "$verdict" "$http_code" "$total_s" "$dns_resolved"

  service_obj="$(jq -n \
    --arg id "$id" --arg name "$name" --arg category "$category" --arg domain "$domain" \
    --arg url "$url" --arg demoPath "$demo" --arg symptom "$symptom" \
    --arg httpCode "$http_code" --argjson connectSec "${connect_s:-0}" --argjson sslSec "${ssl_s:-0}" \
    --argjson totalSec "${total_s:-0}" --argjson curlExit "$curl_exit" \
    --argjson dnsResolved "$dns_resolved" --arg verdict "$verdict" \
    '{id:$id,name:$name,category:$category,domain:$domain,url:$url,demoPath:$demoPath,symptom:$symptom,
      httpCode:$httpCode,connectSec:$connectSec,sslSec:$sslSec,totalSec:$totalSec,
      curlExit:$curlExit,dnsResolved:$dnsResolved,verdict:$verdict}')"

  services_json="$(jq -c --argjson o "$service_obj" '. + [$o]' <<<"$services_json")"
done < <(jq -c '.services[]' "$TARGETS")

# Assemble run document.
run_doc="$(jq -n \
  --arg generatedAt "$GENERATED_AT" \
  --arg cloudProvider "$CLOUD_PROVIDER" --arg cloudRegion "$CLOUD_REGION" --arg runnerHost "$RUNNER_HOST" \
  --arg dnsServer "$DNS_SERVER" \
  --argjson services "$services_json" \
  '{generatedAt:$generatedAt,
    environment:{cloudProvider:$cloudProvider,cloudRegion:$cloudRegion,runnerHost:$runnerHost,dnsServer:$dnsServer},
    services:$services}')"

echo "$run_doc" > "$OUT_DIR/probe.json"

# Markdown table.
{
  echo "# Mainland China dependency probe — $DATE"
  echo
  echo "- Generated: $GENERATED_AT"
  echo "- Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
  echo "- DNS: $DNS_SERVER"
  echo
  echo "| Service | Category | Verdict | HTTP | Total (s) | DNS |"
  echo "|---|---|---|---|---|---|"
  echo "$services_json" | jq -r '.[] | "| \(.name) | \(.category) | \(.verdict) | \(.httpCode) | \(.totalSec) | \(if .dnsResolved then "yes" else "no" end) |"'
} > "$OUT_DIR/probe.md"

# Update latest.json: keep any existing browser[] block, replace probe-owned fields.
LATEST="$ROOT_DIR/results/latest.json"
if [ -f "$LATEST" ]; then
  existing_browser="$(jq -c '.browser // []' "$LATEST" 2>/dev/null || echo '[]')"
else
  existing_browser="[]"
fi
jq -n --argjson run "$run_doc" --argjson browser "$existing_browser" \
  '$run + {browser:$browser}' > "$LATEST"

echo
echo "Wrote:"
echo "  $OUT_DIR/probe.json"
echo "  $OUT_DIR/probe.md"
echo "  $LATEST"
