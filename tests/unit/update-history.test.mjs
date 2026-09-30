// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { summarizeRun } from '../../scripts/update-history.mjs';

const run = (verdicts) => ({ services: verdicts.map((v, i) => ({ id: 's' + i, verdict: v })) });

test('summarizeRun counts verdicts and stamps the date', () => {
  const s = summarizeRun('2026-09-28', run(['Blocked', 'Reachable', 'Blocked', 'Degraded', 'Reachable']));
  assert.deepEqual(s, { date: '2026-09-28', total: 5, blocked: 2, degraded: 1, reachable: 2, pdf: false });
});

test('summarizeRun tolerates an empty run', () => {
  assert.deepEqual(summarizeRun('2026-09-29', { services: [] }),
    { date: '2026-09-29', total: 0, blocked: 0, degraded: 0, reachable: 0, pdf: false });
});

test('summarizeRun flags pdf when report.pdf exists for the run', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sbh-'));
  mkdirSync(join(dir, '2026-09-30'));
  writeFileSync(join(dir, '2026-09-30', 'report.pdf'), '%PDF-1.4 stub');
  const s = summarizeRun('2026-09-30', run(['Reachable']), dir);
  assert.equal(s.pdf, true);
});
