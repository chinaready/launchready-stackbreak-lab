#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
// One-shot: on pages that END with a dark CTA band (stack, product), move the
// verdict legend from above the footer to above that CTA section.
import { readFileSync, writeFileSync } from 'node:fs';

for (const f of ['stack/index.html', 'product/index.html']) {
  let src = readFileSync(f, 'utf8');
  const start = src.indexOf('<section class="verdict-legend"');
  if (start === -1) { console.log(`skip (no legend): ${f}`); continue; }
  const end = src.indexOf('</section>', start) + '</section>'.length;
  const legend = src.slice(start, end);
  src = src.slice(0, start) + src.slice(end).replace(/^\n+/, '');
  const cta = src.indexOf('<section class="block block--cta"');
  if (cta === -1) { console.log(`skip (no CTA band): ${f}`); continue; }
  src = src.slice(0, cta) + legend + '\n\n  ' + src.slice(cta);
  writeFileSync(f, src);
  console.log(`legend moved above the CTA band: ${f}`);
}
