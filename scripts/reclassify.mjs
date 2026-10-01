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

// Kit probes (firebase/netlify/vercel) and page-resource measurements share
// the same shape (curlExit/httpCode/totalSec or httpCode/totalSec).
export function reclassifyProbesDoc(doc) {
  let changed = 0;
  for (const list of [doc && doc.probes, doc && doc.resources]) {
    for (const p of list || []) {
      if (typeof Number(p.totalSec) !== 'number' || Number.isNaN(Number(p.totalSec))) continue;
      const v = classify(p);
      if (p.verdict !== v) { p.verdict = v; changed++; }
    }
  }
  return changed;
}

const KIT_STEMS = ['firebase', 'netlify', 'vercel', 'netlify-resources', 'vercel-resources'];

function reclassifyFile(path, apply, mode = 'services') {
  let doc;
  try { doc = JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
  const changed = mode === 'services' ? reclassifyDoc(doc) : reclassifyProbesDoc(doc);
  if (changed && apply) writeFileSync(path, JSON.stringify(doc, null, 2) + '\n');
  return changed;
}

const ranDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ranDirectly) {
  const apply = process.argv.includes('--apply');
  let total = 0, files = 0;
  const hit = (c) => { if (c) { total += c; files++; } };
  for (const name of readdirSync(RESULTS).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
    const p = join(RESULTS, name, 'probe.json');
    if (existsSync(p)) hit(reclassifyFile(p, apply));
    for (const stem of KIT_STEMS) {
      const kp = join(RESULTS, name, stem + '.json');
      if (existsSync(kp)) hit(reclassifyFile(kp, apply, 'probes'));
    }
  }
  for (const stem of [...KIT_STEMS, 'latest']) {
    const lp = join(RESULTS, stem + '-latest.json');
    if (existsSync(lp)) hit(reclassifyFile(lp, apply, stem === 'latest' ? 'services' : 'probes'));
  }
  console.log(apply
    ? `applied: ${total} verdicts reclassified across ${files} files (thresholds <${REACHABLE_MAX_S}s / <=${BLOCKED_MIN_S}s)`
    : `dry-run: ${total} verdicts would change across ${files} files — rerun with --apply`);
}
