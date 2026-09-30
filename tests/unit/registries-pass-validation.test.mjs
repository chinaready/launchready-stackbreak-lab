// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistries, validateRegistries, CATEGORIES } from '../../scripts/validate-targets.mjs';

test('committed registries pass validation', () => {
  const { curated, community } = loadRegistries();
  assert.deepEqual(validateRegistries(curated, community), []);
});

test('registry v2 invariants hold', () => {
  const { curated, community } = loadRegistries();
  assert.ok(curated.services.length >= 11, 'curated services survive the v2 migration');
  for (const s of curated.services) {
    assert.equal(s.tier, 'curated');
    assert.ok(CATEGORIES.includes(s.category));
    assert.ok(curated.meta.vendors[s.vendor], `vendor ${s.vendor} declared`);
  }
  for (const s of community.services) assert.equal(s.tier, 'community');
  for (const p of curated.platforms) assert.match(p.resultsPath, /^\/results\//);
});
