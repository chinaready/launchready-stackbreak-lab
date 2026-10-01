#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Maintains results/timeline.json — per-target verdict/latency history.
// Weekly evidence appends the latest run (idempotent by date); --rebuild
// regenerates the whole file from the dated probe.json archive, which stays
// the source of truth.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = join(ROOT, 'results');

export function appendRun(timeline, date, probeDoc) {
  const targets = timeline.targets || {};
  for (const s of (probeDoc && probeDoc.services) || []) {
    const points = targets[s.id] = targets[s.id] || [];
    if (points.some(p => p.d === date)) continue; // idempotent per date
    const point = { d: date, v: s.verdict };
    if (Number.isFinite(Number(s.totalSec)) && s.totalSec !== undefined) point.t = Number(s.totalSec);
    points.push(point);
  }
  return { generatedAt: new Date().toISOString(), targets };
}

export function listRunDates(resultsDir = RESULTS) {
  return readdirSync(resultsDir).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && existsSync(join(resultsDir, d, 'probe.json'))).sort();
}

export function buildTimeline(resultsDir = RESULTS) {
  let tl = { generatedAt: '', targets: {} };
  for (const date of listRunDates(resultsDir)) {
    try {
      tl = appendRun(tl, date, JSON.parse(readFileSync(join(resultsDir, date, 'probe.json'), 'utf8')));
    } catch { /* skip unreadable snapshot */ }
  }
  return { generatedAt: new Date().toISOString(), targets: tl.targets };
}

const ranDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ranDirectly) {
  const outPath = join(RESULTS, 'timeline.json');
  let tl;
  if (process.argv.includes('--rebuild')) {
    tl = buildTimeline();
  } else {
    tl = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { generatedAt: '', targets: {} };
    const dates = listRunDates();
    const latest = dates.at(-1);
    if (latest) tl = appendRun(tl, latest, JSON.parse(readFileSync(join(RESULTS, latest, 'probe.json'), 'utf8')));
  }
  writeFileSync(outPath, JSON.stringify(tl, null, 2) + '\n');
  const n = Object.keys(tl.targets).length;
  const pts = Object.values(tl.targets).reduce((m, a) => m + a.length, 0);
  console.log(`OK: timeline.json — ${n} targets, ${pts} points`);
}
