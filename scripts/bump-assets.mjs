#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
// Bumps JS asset cache versions on every page (home/dashboard/catalog/trends).
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const TO = process.argv[2] || 'v=20261001b';
const ASSETS = ['home.js', 'dashboard.js', 'catalog.js', 'trends.js'];
let n = 0;
for (const f of ['index.html', ...globSync('stack/*.html'), ...globSync('product/*.html'),
                 ...globSync('trends/*.html'), ...globSync('demos/*.html'), ...globSync('public/results/*.html')]) {
  let src = readFileSync(f, 'utf8');
  const before = src;
  for (const a of ASSETS) {
    src = src.replace(new RegExp(a.replace('.', '\\.') + '\\?v=[0-9a-z]+', 'g'), `${a}?${TO}`);
  }
  if (src !== before) { writeFileSync(f, src); n++; }
}
console.log(`bumped asset versions to ${TO} on ${n} pages`);
