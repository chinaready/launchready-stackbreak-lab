#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// One-shot: injects the verdict legend component above the footer on every
// page. Idempotent (skips pages that already have .verdict-legend).

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const LEGEND = `  <section class="verdict-legend" aria-label="Verdict color code">
    <div class="verdict-legend__wrap">
      <span class="verdict-legend__title">Verdict color code</span>
      <span class="verdict-legend__item"><i class="verdict-legend__dot is-reachable"></i>Reachable &lt; 1s</span>
      <span class="verdict-legend__item"><i class="verdict-legend__dot is-degraded"></i>Degraded 1&ndash;3s</span>
      <span class="verdict-legend__item"><i class="verdict-legend__dot is-blocked"></i>Blocked &gt; 3s or connection failed</span>
      <span class="verdict-legend__note">Measured as total request time from the Beijing node; any HTTP status counts as connected.</span>
    </div>
  </section>
`;

const files = ['index.html', ...globSync('stack/*.html'), ...globSync('product/*.html'),
               ...globSync('trends/*.html'), ...globSync('demos/*.html'), ...globSync('public/results/*.html')];
let n = 0;
for (const f of files) {
  let src = readFileSync(f, 'utf8');
  if (src.includes('verdict-legend')) continue;
  const i = src.indexOf('<footer class="site-footer"');
  if (i === -1) continue;
  src = src.slice(0, i) + LEGEND + src.slice(i);
  writeFileSync(f, src); n++;
}
console.log(`legend injected on ${n} pages`);
