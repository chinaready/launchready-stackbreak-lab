// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildWeeklyDocx } from '../../scripts/report-document.mjs';
import { COPY } from '../../scripts/report-copy.mjs';

const model = {
  generatedAt: '2026-09-30T04:57:48Z',
  environment: { cloudProvider: 'Alibaba Cloud', cloudRegion: 'cn-beijing-h', runnerHost: 'launchready.cn', dnsServer: '223.5.5.5' },
  totals: { total: 2, blocked: 1, degraded: 0, reachable: 1 },
  changes: { newlyBlocked: [], recovered: [] },
  services: [
    { name: 'Google reCAPTCHA', tier: 'curated', category: 'auth', vendor: 'google', domain: 'www.google.com', httpCode: '000', totalSec: 15, verdict: 'Blocked' },
    { name: 'Stripe.js', tier: 'community', category: 'payments', vendor: 'stripe', domain: 'js.stripe.com', httpCode: '200', totalSec: 1.46, verdict: 'Reachable' },
  ],
  browserFindings: [],
};

test('weekly DOCX builds with DS cover, header/footer field, and data rows', async () => {
  const brandDir = join(import.meta.dirname, '..', '..', 'public', 'assets', 'brand');
  const buffer = await buildWeeklyDocx({ model, copy: COPY, date: '2026-09-30', brandDir });
  assert.ok(buffer.length > 10_000, 'docx is non-trivial');
  assert.equal(buffer.subarray(0, 2).toString('latin1'), 'PK', 'zip magic bytes');
  const text = buffer.toString('latin1');
  const utf8 = (s) => Buffer.from(s, 'utf8').toString('latin1');
  // The vendored makeZip stores entries uncompressed, so XML is greppable.
  assert.ok(text.includes('Stack Break Weekly'), 'cover title present');
  assert.ok(text.includes('0C1E3E'), 'DS navy cover shading present');
  assert.ok(text.includes('005BAC'), 'DS blue accent present');
  assert.ok(text.includes('Google reCAPTCHA') && text.includes('Stripe.js'), 'verdict rows present');
  assert.ok(text.includes('PAGE '), 'footer page field present');
  assert.ok(text.includes(utf8('中文摘要')), 'Chinese chapter present');
});
