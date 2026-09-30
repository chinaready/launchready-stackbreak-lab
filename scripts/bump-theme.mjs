#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
// Bumps the theme.css cache-busting version on every page that links it.
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const from = process.argv[2] || 'v=20261001a';
const to = process.argv[3] || 'v=20261001b';
let n = 0;
for (const f of ['index.html', ...globSync('stack/*.html'), 'product/index.html',
                 ...globSync('demos/*.html'), ...globSync('public/results/*.html')]) {
  const src = readFileSync(f, 'utf8');
  if (src.includes(`theme.css?${from}`)) {
    writeFileSync(f, src.replaceAll(`theme.css?${from}`, `theme.css?${to}`));
    n++;
  }
}
console.log(`bumped theme.css ${from} -> ${to} on ${n} pages`);
