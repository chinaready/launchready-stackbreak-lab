#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Frontend-path probes: what the user's browser / client SDK in mainland China
# calls directly. Pure curl + Web API key + a real ID token (minted by signing
# in the demo user). Meaningful only when run from mainland China.
#
# Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

set -uo pipefail

SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"
MAX_TIME="${MAX_TIME:-30}"
UA="firebase-china-probe/1.0 (+https://chinaready.co)"

: "${FIREBASE_API_KEY:?set FIREBASE_API_KEY}"
: "${FIREBASE_PROJECT_ID:?set FIREBASE_PROJECT_ID}"

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

echo "Frontend path (browser in mainland China)"
echo "-----------------------------------------"

# --- Auth: anonymous sign-up (client REST) ---
probe "auth-anon" "Auth anonymous sign-up" "Authentication" \
  "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}" \
  -X POST -H "Content-Type: application/json" -d '{"returnSecureToken":true}'

# --- Auth: email/password sign-in (also mints the ID token for later probes) ---
ID_TOKEN=""
REFRESH_TOKEN=""
if [ -n "${DEMO_USER_EMAIL:-}" ] && [ -n "${DEMO_USER_PASSWORD:-}" ]; then
  signin_url="https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}"
  body="$(curl -sS -A "$UA" --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -w '\n%{http_code} %{time_total}' -X POST "$signin_url" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${DEMO_USER_EMAIL}\",\"password\":\"${DEMO_USER_PASSWORD}\",\"returnSecureToken\":true}" 2>/dev/null)"
  ex=$?
  meta="$(printf '%s' "$body" | tail -n1)"
  code="$(awk '{print $1}' <<<"$meta")"; total="$(awk '{print $2}' <<<"$meta")"
  [ -n "$code" ] || code="000"; [ -n "$total" ] || total="0"
  ID_TOKEN="$(printf '%s' "$body" | sed -n 's/.*"idToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
  REFRESH_TOKEN="$(printf '%s' "$body" | sed -n 's/.*"refreshToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
  verdict="$(verdict_for "$ex" "$code" "$total")"
  emit "auth-signin" "Auth email sign-in" "Authentication" "frontend" "$signin_url" "$code" "$total" "$ex" "$verdict"
  printf '  %-30s %-9s code=%-4s total=%ss\n' "Auth email sign-in" "$verdict" "$code" "$total"
fi

# --- Auth: token refresh ---
if [ -n "$REFRESH_TOKEN" ]; then
  probe "auth-refresh" "Auth token refresh" "Authentication" \
    "https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}" \
    -X POST -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}"
fi

# --- Firestore: authenticated read of a seeded doc ---
fs_url="https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/reports/report-001"
if [ -n "$ID_TOKEN" ]; then
  probe "firestore-read" "Firestore read (auth)" "Cloud Firestore" "$fs_url" \
    -H "Authorization: Bearer ${ID_TOKEN}"
else
  probe "firestore-read" "Firestore read (unauth)" "Cloud Firestore" "$fs_url"
fi

# --- Storage: download the sample object ---
if [ -n "${FIREBASE_STORAGE_BUCKET:-}" ]; then
  probe "storage-download" "Storage download" "Cloud Storage" \
    "https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/probes%2Ffield-report-sample.jpg?alt=media"
fi

# --- Cloud Functions: call the public HTTP function ---
if [ -n "${FIREBASE_FUNCTIONS_REGION:-}" ]; then
  probe "functions-http" "Functions helloProbe" "Cloud Functions" \
    "https://${FIREBASE_FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/helloProbe"
fi

echo
