#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Orchestrates the Firebase China probes (frontend + backend + transport) and
# writes a verdict table with environment provenance, mirroring the Stack Break
# Lab results/<date>/ convention.
#
# Output:
#   results/<YYYY-MM-DD>/firebase.json   structured run { generatedAt, environment, probes }
#   results/<YYYY-MM-DD>/firebase.md     human-readable table
#   results/firebase-latest.json         copy of the dated json the live viewer reads
#
# Dependencies: bash, curl, nc, jq, node (+ firebase-admin installed).

set -uo pipefail

PROBE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="$(cd "$PROBE_DIR/.." && pwd)"
ROOT_DIR="$(cd "$DEMO_DIR/.." && pwd)"

# Load env: prefer repo-root .env, fall back to firebase-demo/.env.
for envfile in "$ROOT_DIR/.env" "$DEMO_DIR/.env"; do
  if [ -f "$envfile" ]; then
    set -a; . "$envfile"; set +a
    echo "Loaded env: $envfile"
    break
  fi
done

for bin in curl jq node; do
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

echo "Firebase China probe — $GENERATED_AT"
echo "Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
echo

bash "$PROBE_DIR/frontend.sh"
node "$PROBE_DIR/backend.mjs"
bash "$PROBE_DIR/transport.sh"

probes_json="$(jq -s '.' "$OUT_NDJSON")"
rm -f "$OUT_NDJSON"

run_doc="$(jq -n \
  --arg generatedAt "$GENERATED_AT" \
  --arg cloudProvider "$CLOUD_PROVIDER" --arg cloudRegion "$CLOUD_REGION" --arg runnerHost "$RUNNER_HOST" \
  --argjson probes "$probes_json" \
  '{generatedAt:$generatedAt,
    environment:{cloudProvider:$cloudProvider,cloudRegion:$cloudRegion,runnerHost:$runnerHost},
    probes:$probes}')"

echo "$run_doc" > "$OUT_DIR/firebase.json"

# Stable pointer the live results viewer fetches (parallel to results/latest.json,
# which the curl/dig probe owns). Kept separate so the two probes never clobber
# each other's snapshot.
echo "$run_doc" > "$ROOT_DIR/results/firebase-latest.json"

{
  echo "# Firebase mainland China probe — $DATE"
  echo
  echo "- Generated: $GENERATED_AT"
  echo "- Environment: $CLOUD_PROVIDER / $CLOUD_REGION / $RUNNER_HOST"
  echo
  echo "| Product | Path | Probe | HTTP | Total (s) | Verdict |"
  echo "|---|---|---|---|---|---|"
  echo "$probes_json" | jq -r '.[] | "| \(.product) | \(.path) | \(.name) | \(.httpCode) | \(.totalSec) | \(.verdict) |"'
} > "$OUT_DIR/firebase.md"

echo
echo "Wrote:"
echo "  $OUT_DIR/firebase.json"
echo "  $OUT_DIR/firebase.md"
echo "  $ROOT_DIR/results/firebase-latest.json"
