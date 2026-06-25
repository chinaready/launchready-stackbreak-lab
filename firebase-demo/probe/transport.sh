#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. All rights reserved.
#
# Transport-reachability probes for Firebase products we do not provision.
# Proves only whether the host answers from mainland China — enough to verdict
# products whose failure mode is "the endpoint is unreachable".
#
# Emits one JSON object per probe to $OUT_NDJSON (if set) and a table to stdout.

set -uo pipefail

SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"
CONNECT_TIMEOUT="${CONNECT_TIMEOUT:-10}"
MAX_TIME="${MAX_TIME:-20}"
UA="firebase-china-probe/1.0 (+https://chinaready.co)"

verdict_for() { local e="$1" c="$2" t="$3"
  if [ "$e" -ne 0 ] || [ "$c" = "000" ]; then echo "Blocked"
  elif awk "BEGIN{exit !($t > $SLOW_THRESHOLD)}"; then echo "Degraded"
  else echo "Reachable"; fi
}

emit() {
  [ -n "${OUT_NDJSON:-}" ] || return 0
  printf '{"id":"%s","name":"%s","product":"%s","path":"%s","endpoint":"%s","httpCode":"%s","totalSec":%s,"curlExit":%s,"verdict":"%s"}\n' \
    "$1" "$2" "$3" "$4" "$5" "$6" "${7:-0}" "${8:-0}" "$9" >> "$OUT_NDJSON"
}

host_probe() { # id name product url
  local id="$1" name="$2" product="$3" url="$4"
  local metrics code total ex verdict
  metrics="$(curl -sS -o /dev/null -A "$UA" \
    --connect-timeout "$CONNECT_TIMEOUT" --max-time "$MAX_TIME" \
    -w '%{http_code} %{time_total}' "$url" 2>/dev/null)"
  ex=$?
  code="$(awk '{print $1}' <<<"$metrics")"; total="$(awk '{print $2}' <<<"$metrics")"
  [ -n "$code" ] || code="000"; [ -n "$total" ] || total="0"
  verdict="$(verdict_for "$ex" "$code" "$total")"
  emit "$id" "$name" "$product" "transport" "$url" "$code" "$total" "$ex" "$verdict"
  printf '  %-30s %-9s code=%-4s total=%ss\n' "$name" "$verdict" "$code" "$total"
}

tcp_probe() { # id name product host port
  local id="$1" name="$2" product="$3" host="$4" port="$5"
  local start end total ex verdict
  start="$(date +%s.%N)"
  nc -z -w "$CONNECT_TIMEOUT" "$host" "$port" >/dev/null 2>&1
  ex=$?
  end="$(date +%s.%N)"
  total="$(awk "BEGIN{printf \"%.6f\", $end-$start}")"
  if [ "$ex" -eq 0 ]; then verdict="Reachable"; else verdict="Blocked"; fi
  emit "$id" "$name" "$product" "transport" "${host}:${port}" "tcp" "$total" "$ex" "$verdict"
  printf '  %-30s %-9s %-9s total=%ss\n' "$name" "$verdict" "tcp" "$total"
}

echo "Transport reachability (non-provisioned products)"
echo "-------------------------------------------------"

host_probe "vision"       "Cloud Vision API"      "Firebase ML / Vision"   "https://vision.googleapis.com/"
host_probe "ai-logic"     "Gemini / AI Logic"     "Firebase AI Logic"      "https://generativelanguage.googleapis.com/"
host_probe "analytics"    "Firebase Analytics"    "Google Analytics"       "https://app-measurement.com/"
host_probe "crashlytics"  "Crashlytics settings"  "Crashlytics"            "https://firebase-settings.crashlytics.com/"
host_probe "perf"         "Performance logging"   "Performance Monitoring" "https://firebaselogging.googleapis.com/"
host_probe "remoteconfig" "Remote Config fetch"   "Remote Config"          "https://firebaseremoteconfig.googleapis.com/"
host_probe "installations" "Installations / FCM token" "Cloud Messaging (FCM)" "https://firebaseinstallations.googleapis.com/"
host_probe "fcm-host"     "FCM send host"         "Cloud Messaging (FCM)"  "https://fcm.googleapis.com/"
host_probe "recaptcha"    "reCAPTCHA loader"      "App Check"              "https://www.google.com/recaptcha/api.js"
host_probe "appdist"      "App Distribution"      "App Distribution"       "https://appdistribution.firebase.google.com/"

# FCM device channel — the path mainland Android cannot use (no Google framework).
tcp_probe "fcm-mtalk" "FCM device channel" "Cloud Messaging (FCM)" "mtalk.google.com" "5228"

# Hosting (project web.app) and RTDB, if configured.
if [ -n "${FIREBASE_PROJECT_ID:-}" ]; then
  host_probe "hosting" "Firebase Hosting" "Hosting" "https://${FIREBASE_PROJECT_ID}.web.app/"
fi
if [ -n "${FIREBASE_DB_URL:-}" ]; then
  host_probe "rtdb" "Realtime Database" "Realtime Database" "${FIREBASE_DB_URL%/}/.json"
fi

echo
