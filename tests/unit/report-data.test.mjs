// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportModel, diffVerdicts } from '../../scripts/report-data.mjs';

const svc = (id, name, verdict) => ({ id, name, verdict, tier: 'curated', category: 'auth', vendor: 'google', domain: 'x.com', url: 'https://x.com', httpCode: '200', totalSec: 0.5, dnsResolved: true });

test('diffVerdicts finds newly blocked and recovered by id', () => {
  const prev = [svc('a', 'A', 'Reachable'), svc('b', 'B', 'Blocked'), svc('c', 'C', 'Reachable')];
  const now = [svc('a', 'A', 'Blocked'), svc('b', 'B', 'Reachable'), svc('c', 'C', 'Reachable')];
  const d = diffVerdicts(prev, now);
  assert.deepEqual(d.newlyBlocked.map(s => s.name), ['A']);
  assert.deepEqual(d.recovered.map(s => s.name), ['B']);
});

test('new targets in the current run are not "newly blocked"', () => {
  const d = diffVerdicts([], [svc('n', 'New', 'Blocked')]);
  assert.deepEqual(d.newlyBlocked, []);
});

test('degraded counts as neither newly blocked nor recovered', () => {
  const d = diffVerdicts([svc('a', 'A', 'Blocked')], [svc('a', 'A', 'Degraded')]);
  assert.deepEqual(d.newlyBlocked, []);
  assert.deepEqual(d.recovered, []);
});

test('buildReportModel assembles totals, changes, and verdict ordering', () => {
  const probe = { generatedAt: '2026-09-30T04:57:48Z',
    environment: { cloudProvider: 'Alibaba Cloud', cloudRegion: 'cn-beijing-h', runnerHost: 'launchready.cn', dnsServer: '223.5.5.5' },
    services: [svc('a', 'A', 'Reachable'), svc('b', 'B', 'Blocked'), svc('c', 'C', 'Degraded')] };
  const m = buildReportModel({ probe, browser: null, prev: { services: [svc('b', 'B', 'Reachable')] } });
  assert.equal(m.totals.total, 3);
  assert.equal(m.totals.blocked, 1);
  assert.equal(m.totals.degraded, 1);
  assert.deepEqual(m.changes.newlyBlocked.map(s => s.name), ['B']);
  assert.deepEqual(m.services.map(s => s.verdict), ['Blocked', 'Degraded', 'Reachable']);
});

test('buildReportModel maps browser findings with failed-request counts', () => {
  const probe = { generatedAt: 'x', environment: {}, services: [svc('a', 'A', 'Blocked')] };
  const m = buildReportModel({ probe, browser: [{ name: 'A', verdict: 'Blocked', failedRequests: ['u1', 'u2'] }], prev: null });
  assert.deepEqual(m.browserFindings, [{ name: 'A', verdict: 'Blocked', failedCount: 2 }]);
});
