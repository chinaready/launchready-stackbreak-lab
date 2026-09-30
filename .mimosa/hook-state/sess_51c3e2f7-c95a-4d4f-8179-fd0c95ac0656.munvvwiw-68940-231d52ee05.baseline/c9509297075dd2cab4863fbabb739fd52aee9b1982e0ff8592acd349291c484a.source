#!/usr/bin/env bash
# Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
#
# Safe .env loader — supports unquoted values with spaces (e.g. CLOUD_PROVIDER=Alibaba Cloud).
# Usage: source deploy/load-env.sh && load_env_file /path/to/.env

load_env_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    # Trim leading whitespace; skip comments and blank lines.
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local val="${BASH_REMATCH[2]}"
      # Strip optional surrounding quotes.
      if [[ "$val" =~ ^\"(.*)\"$ ]]; then
        val="${BASH_REMATCH[1]}"
      elif [[ "$val" =~ ^\'(.*)\'$ ]]; then
        val="${BASH_REMATCH[1]}"
      fi
      export "${key}=${val}"
    fi
  done < "$f"
}
