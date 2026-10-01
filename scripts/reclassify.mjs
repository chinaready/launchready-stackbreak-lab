#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Time-based verdict classification (industry three-tier color code):
//   < 1s Reachable · 1–3s Degraded · > 3s Blocked/unavailable
//   (connection failure / HTTP 000 stays Blocked)
// Thresholds mirror the probe script's REACHABLE_MAX_S / BLOCKED_MIN_S.
//
// --apply rewrites the derived verdict field across every archived run and
// latest.json FROM THE STORED RAW METRICS (metrics are never touched), then
// rebuilds history.json and timeline.json. Dry-run by default.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = join(ROOT, 'results');
export const REACHABLE_MAX_S = Number(process.env.REACHABLE_MAX_S || 1);
export const BLOCKED_MIN_S = Number(process.env.BLOCKED_MIN_S || 3);

export function classify(s) {
  if (Number(s.curlExit) !== 0 || s.httpCode === '000' || s.httpCode === undefined) return 'Blocked';
  const t = Number(s.totalSec);
  if (t < REACHABLE_MAX_S) return 'Reachable';
  if (t <= BLOCKED_MIN_S) return 'Degraded';
  return 'Blocked';
}

export function reclassifyDoc(doc) {
  let changed = 0;
  for (const s of (doc && doc.services) || []) {
    const v = classify(s);
    if (s.verdict !== v) { s.verdict = v; changed++; }
  }
  return changed;
}

function reclassifyFile(path, apply) {
  let doc;
  try { doc = JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
  const changed = reclassifyDoc(doc);
  if (changed && apply) writeFileSync(path, JSON.stringify(doc, null, 2) + '\n');
  return changed;
}

const ranDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ranDirectly) {
  const apply = process.argv.includes('--apply');
  let total = 0, files = 0;
  for (const name of readdirSync(RESULTS).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
    const p = join(RESULTS, name, 'probe.json');
    if (!existsSync(p)) continue;
    const c = reclassifyFile(p, apply);
    if (c == null) continue;
    total += c; if (c) files++;
  }
  const latest = join(RESULTS, 'latest.json');
  const c = reclassifyFile(latest, apply);
  if (c) { total += c; files++; }
  console.log(apply
    ? `applied: ${total} verdicts reclassified across ${files} files (thresholds <${REACHABLE_MAX_S}s / <=${BLOCKED_MIN_S}s)`
    : `dry-run: ${total} verdicts would change across ${files} files — rerun with --apply`);
}
