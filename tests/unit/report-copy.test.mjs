// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { COPY, scanReportCopy, fillCnTemplate } from '../../scripts/report-copy.mjs';

test('report copy passes governance scan (no promises, disclaimers present)', () => {
  const r = scanReportCopy();
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
});

test('governance scan flags guarantee wording', () => {
  const bad = structuredClone(COPY);
  bad.disclaimer = 'We guarantee China access with a 100% uptime SLA.' + bad.disclaimer;
  const r = scanReportCopy(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => e.includes('guarantee')));
});

test('CN summary fills model numbers', () => {
  const cn = fillCnTemplate({
    totals: { total: 13, blocked: 5, degraded: 0, reachable: 8 },
    changes: { newlyBlocked: [{ name: 'x' }], recovered: [] },
    environment: { cloudProvider: 'Alibaba Cloud', cloudRegion: 'cn-beijing-h', runnerHost: 'launchready.cn', dnsServer: '223.5.5.5' },
  });
  assert.ok(cn.totals.includes('13'));
  assert.ok(cn.totals.includes('阻断 5'));
  assert.ok(cn.changes.includes('新被墙 1'));
  assert.ok(cn.changes.includes('恢复 0'));
  assert.ok(cn.environment.includes('cn-beijing-h'));
});
