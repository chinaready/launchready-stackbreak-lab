#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Rebuilds results/history.json — one summary row per dated evidence run.
// Idempotent full rescan of results/<YYYY-MM-DD>/probe.json; cheap (~30 dirs).
// The homepage reports list reads this file; M3 swaps row links to PDFs.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function summarizeRun(date, probeDoc, resultsDir) {
  const services = (probeDoc && probeDoc.services) || [];
  const counts = { blocked: 0, degraded: 0, reachable: 0 };
  for (const s of services) {
    if (s.verdict === 'Blocked') counts.blocked += 1;
    else if (s.verdict === 'Degraded') counts.degraded += 1;
    else if (s.verdict === 'Reachable') counts.reachable += 1;
  }
  const pdf = resultsDir ? existsSync(join(resultsDir, date, 'report.pdf')) : false;
  return { date, total: services.length, ...counts, pdf };
}

export function buildHistory(resultsDir) {
  const runs = [];
  for (const name of readdirSync(resultsDir)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
    const probe = join(resultsDir, name, 'probe.json');
    if (!existsSync(probe)) continue;
    try {
      runs.push(summarizeRun(name, JSON.parse(readFileSync(probe, 'utf8')), resultsDir));
    } catch {
      // Skip unreadable snapshots rather than failing the whole rebuild.
    }
  }
  runs.sort((a, b) => (a.date < b.date ? 1 : -1));
  return { generatedAt: new Date().toISOString(), runs };
}

const ranDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ranDirectly) {
  const history = buildHistory(join(ROOT, 'results'));
  writeFileSync(join(ROOT, 'results', 'history.json'), JSON.stringify(history, null, 2) + '\n');
  console.log(`OK: history.json rebuilt — ${history.runs.length} runs (${history.runs[0]?.date ?? '—'} … ${history.runs[history.runs.length - 1]?.date ?? '—'})`);
}
