// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../../scripts/reclassify.mjs';

const svc = (over) => Object.assign({ httpCode: '200', curlExit: 0, totalSec: 0.2 }, over);

test('time tiers: under 1s reachable, 1-3s degraded, over 3s blocked', () => {
  assert.equal(classify(svc({ totalSec: 0.99 })), 'Reachable');
  assert.equal(classify(svc({ totalSec: 1.0 })), 'Degraded');
  assert.equal(classify(svc({ totalSec: 2.7 })), 'Degraded');
  assert.equal(classify(svc({ totalSec: 3.0 })), 'Degraded');
  assert.equal(classify(svc({ totalSec: 3.01 })), 'Blocked');
  assert.equal(classify(svc({ totalSec: 15 })), 'Blocked');
});

test('connection failures stay blocked regardless of timing', () => {
  assert.equal(classify(svc({ curlExit: 28 })), 'Blocked');
  assert.equal(classify(svc({ httpCode: '000' })), 'Blocked');
  assert.equal(classify(svc({ curlExit: 28, totalSec: 0.1 })), 'Blocked');
});

test('any HTTP status still counts as connected when fast', () => {
  assert.equal(classify(svc({ httpCode: '403', totalSec: 0.8 })), 'Reachable');
  assert.equal(classify(svc({ httpCode: '404', totalSec: 1.2 })), 'Degraded');
});

test('page-resource shape (no curlExit field) classifies by time alone', () => {
  assert.equal(classify({ httpCode: '200', totalSec: 0.9 }), 'Reachable');
  assert.equal(classify({ httpCode: '200', totalSec: 2.2 }), 'Degraded');
  assert.equal(classify({ httpCode: '200', totalSec: 4.5 }), 'Blocked');
  assert.equal(classify({ httpCode: '000', totalSec: 0.5 }), 'Blocked');
});
