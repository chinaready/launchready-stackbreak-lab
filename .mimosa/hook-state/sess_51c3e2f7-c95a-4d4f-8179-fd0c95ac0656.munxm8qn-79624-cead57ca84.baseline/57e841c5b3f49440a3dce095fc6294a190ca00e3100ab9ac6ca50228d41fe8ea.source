#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Orchestrates the Vercel China probes (frontend + backend + transport) and
# writes a verdict table with environment provenance.
#
# Output:
#   results/<YYYY-MM-DD>/vercel.json
#   results/<YYYY-MM-DD>/vercel.md
#   results/vercel-latest.json

set -uo pipefail

PROBE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$PROBE_DIR/.." && pwd)"
ROOT_DIR="$(cd "$DEMO_DIR/.." && pwd)"

# shellcheck source=../deploy/load-env.sh
source "$ROOT_DIR/deploy/load-env.sh"
for envfile in "$ROOT_DIR/.env" "$DEMO_DIR/.env"; do
  if [ -f "$envfile" ]; then
    load_env_file "$envfile"
    echo "Loaded env: $envfile"
  fi
done

for bin in curl dig jq node; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' not found in PATH" >&2; exit 1; }
done

CLOUD_PROVIDER="${CLOUD_PROVIDER:-unknown}"
CLOUD_REGION="${CLOUD_REGION:-unknown}"
RUNNER_HOST="${RUNNER_HOST:-unknown}"

DATE="$(date +%F)"
GENERATED_AT="$(date -u +%FT%TZ)"
OUT_DIR="$ROOT_DIR/results/$DATE"
mkdir -p "$OUT_DIR"

OUT_NDJSON="$(mktemp)"
export OUT_NDJSON

echo "Vercel China probe — $GENERATED_AT"
echo "Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
echo "Site: ${VERCEL_SITE_URL:-<unset>}"
echo

bash "$PROBE_DIR/frontend.sh"
node "$PROBE_DIR/backend.mjs"
bash "$PROBE_DIR/transport.sh"

probes_json="$(jq -s '.' "$OUT_NDJSON")"
rm -f "$OUT_NDJSON"

run_doc="$(jq -n \
  --arg generatedAt "$GENERATED_AT" \
  --arg cloudProvider "$CLOUD_PROVIDER" --arg cloudRegion "$CLOUD_REGION" --arg runnerHost "$RUNNER_HOST" \
  --arg demoSiteUrl "${VERCEL_SITE_URL:-}" \
  --arg blobRegion "${BLOB_REGION:-unknown}" \
  --arg redisRegion "${REDIS_REGION:-unknown}" \
  --argjson probes "$probes_json" \
  '{generatedAt:$generatedAt,
    environment:{cloudProvider:$cloudProvider,cloudRegion:$cloudRegion,runnerHost:$runnerHost},
    demoSiteUrl:$demoSiteUrl,
    storage:{blobRegion:$blobRegion,redisRegion:$redisRegion},
    probes:$probes}')"

echo "$run_doc" > "$OUT_DIR/vercel.json"
echo "$run_doc" > "$ROOT_DIR/results/vercel-latest.json"

{
  echo "# Vercel mainland China probe — $DATE"
  echo
  echo "- Generated: $GENERATED_AT"
  echo "- Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
  echo "- Site: ${VERCEL_SITE_URL:-<unset>}"
  echo "- Blob region: ${BLOB_REGION:-unknown}"
  echo "- Redis region: ${REDIS_REGION:-unknown}"
  echo
  echo "| Product | Path | Probe | HTTP | Total (s) | Verdict |"
  echo "|---|---|---|---|---|---|"
  echo "$probes_json" | jq -r '.[] | "| \(.product) | \(.path) | \(.name) | \(.httpCode) | \(.totalSec) | \(.verdict) |"'
} > "$OUT_DIR/vercel.md"

echo
echo "Wrote:"
echo "  $OUT_DIR/vercel.json"
echo "  $OUT_DIR/vercel.md"
echo "  $ROOT_DIR/results/vercel-latest.json"

echo
bash "$PROBE_DIR/resources.sh"
