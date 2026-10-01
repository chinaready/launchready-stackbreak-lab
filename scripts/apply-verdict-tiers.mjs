#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// One-shot: converts every kit probe (firebase/netlify/vercel — frontend,
// transport, resources shells + backend.mjs) to the lab's three-tier time
// verdicts, keeping env-tunable thresholds in sync with the main probe and
// scripts/reclassify.mjs.

import { readFileSync, writeFileSync } from 'node:fs';

const OLD_SH = 'SLOW_THRESHOLD="${SLOW_THRESHOLD:-5}"';
const NEW_SH = `# Three-tier time verdicts — keep in sync with scripts/reclassify.mjs.
REACHABLE_MAX_S="${'${REACHABLE_MAX_S:-1}'}"
BLOCKED_MIN_S="${'${BLOCKED_MIN_S:-3}'}"`;

const OLD_BRANCH = 'elif awk "BEGIN{exit !($t > $SLOW_THRESHOLD)}"; then echo "Degraded"';
const NEW_BRANCH = `elif awk "BEGIN{exit !($t > $BLOCKED_MIN_S)}"; then echo "Blocked"
  elif awk "BEGIN{exit !($t >= $REACHABLE_MAX_S)}"; then echo "Degraded"`;

const SH_FILES = [
  'firebase-demo/probe/frontend.sh', 'firebase-demo/probe/transport.sh',
  'netlify-demo/probe/frontend.sh', 'netlify-demo/probe/transport.sh', 'netlify-demo/probe/resources.sh',
  'vercel-demo/probe/frontend.sh', 'vercel-demo/probe/transport.sh', 'vercel-demo/probe/resources.sh',
];

const OLD_MJS = 'const SLOW = Number(process.env.SLOW_THRESHOLD ?? 5);';
const NEW_MJS = `// Three-tier time verdicts — keep in sync with scripts/reclassify.mjs.
const REACHABLE_MAX_S = Number(process.env.REACHABLE_MAX_S ?? 1);
const BLOCKED_MIN_S = Number(process.env.BLOCKED_MIN_S ?? 3);
const timeVerdict = (total) =>
  total < REACHABLE_MAX_S ? "Reachable" : total <= BLOCKED_MIN_S ? "Degraded" : "Blocked";`;
const OLD_MJS_BRANCH = 'total > SLOW ? "Degraded" : "Reachable"';
const NEW_MJS_BRANCH = 'timeVerdict(total)';

let n = 0;
for (const f of SH_FILES) {
  let s = readFileSync(f, 'utf8');
  if (!s.includes(OLD_SH)) { console.log(`skip (no threshold): ${f}`); continue; }
  s = s.replace(OLD_SH, NEW_SH).split(OLD_BRANCH).join(NEW_BRANCH);
  writeFileSync(f, s); n++;
}
for (const f of ['firebase-demo/probe/backend.mjs', 'netlify-demo/probe/backend.mjs', 'vercel-demo/probe/backend.mjs']) {
  let s = readFileSync(f, 'utf8');
  if (!s.includes(OLD_MJS)) { console.log(`skip (no threshold): ${f}`); continue; }
  s = s.replace(OLD_MJS, NEW_MJS).split(OLD_MJS_BRANCH).join(NEW_MJS_BRANCH);
  writeFileSync(f, s); n++;
}
console.log(`converted ${n} kit probe files to three-tier verdicts`);
