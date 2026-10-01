// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { appendRun, buildTimeline } from '../../scripts/update-timeline.mjs';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (services) => ({ generatedAt: 'x', services });

test('appendRun adds a dated point per target and is idempotent', () => {
  let tl = { generatedAt: '', targets: {} };
  tl = appendRun(tl, '2026-09-28', run([{ id: 'a', verdict: 'Reachable', totalSec: 0.2 }]));
  tl = appendRun(tl, '2026-09-28', run([{ id: 'a', verdict: 'Blocked', totalSec: 15 }]));
  assert.equal(tl.targets.a.length, 1);
  assert.deepEqual(tl.targets.a[0], { d: '2026-09-28', v: 'Reachable', t: 0.2 });
});

test('appendRun keeps targets ordered and tolerates odd verdicts', () => {
  let tl = { generatedAt: '', targets: {} };
  tl = appendRun(tl, '2026-09-28', run([{ id: 'a', verdict: 'Blocked', totalSec: 9 }]));
  tl = appendRun(tl, '2026-09-30', run([{ id: 'a', verdict: 'Weird', totalSec: 1 }, { id: 'b', verdict: 'Reachable' }]));
  assert.deepEqual(Object.keys(tl.targets), ['a', 'b']);
  assert.deepEqual(tl.targets.a[1], { d: '2026-09-30', v: 'Weird', t: 1 });
  assert.equal(tl.targets.b[0].t, undefined);
});

test('buildTimeline reconstructs sorted history from dated dirs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sbtl-'));
  for (const [d, verdict] of [['2026-09-21', 'Reachable'], ['2026-09-30', 'Blocked'], ['2026-09-28', 'Degraded']]) {
    mkdirSync(join(dir, d));
    writeFileSync(join(dir, d, 'probe.json'), JSON.stringify(run([{ id: 'a', verdict, totalSec: 1 }])));
  }
  mkdirSync(join(dir, 'not-a-date'));
  const tl = buildTimeline(dir);
  assert.deepEqual(tl.targets.a.map(p => p.d), ['2026-09-21', '2026-09-28', '2026-09-30']);
});
