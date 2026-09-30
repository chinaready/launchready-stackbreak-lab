#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// One-shot: link theme.css on every page and swap the header logo to the dark
// variant (the refresh uses a white sticky nav). Footer logos stay white.
// Rollback = revert the commit that includes this script's changes.

import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const THEME_LINK = (prefix) => `  <link rel="stylesheet" href="${prefix}assets/theme.css?v=20261001a" />\n`;
const files = [
  ...globSync('demos/*.html'),
  ...globSync('public/results/*.html'),
  'index.html', 'stack/index.html', 'product/index.html',
];

let linked = 0, logos = 0;
for (const f of files) {
  let src = readFileSync(f, 'utf8');
  const depth = f === 'index.html' ? 0 : (f.startsWith('stack/') || f.startsWith('product/') ? 1 : 1);
  const prefix = depth === 0 ? 'public/' : '../public/';

  if (!src.includes('theme.css')) {
    const headClose = src.indexOf('</head>');
    const lastLinkEnd = src.lastIndexOf('<link rel="stylesheet"', headClose);
    if (lastLinkEnd === -1) { console.error(`skip (no stylesheet): ${f}`); continue; }
    const lineEnd = src.indexOf('\n', lastLinkEnd);
    src = src.slice(0, lineEnd + 1) + THEME_LINK(prefix) + src.slice(lineEnd + 1);
    linked++;
  }

  // Header logo only: white -> dark (footer imgs use cr-footer-logo and are inside <footer>)
  const headerEnd = src.indexOf('</header>');
  const header = src.slice(0, headerEnd);
  if (header.includes('logo-horizontal-white.svg')) {
    src = header.replace(/logo-horizontal-white\.svg/g, 'logo-horizontal.svg') + src.slice(headerEnd);
    logos++;
  }
  writeFileSync(f, src);
}
console.log(`theme.css linked on ${linked} pages; dark header logo swapped on ${logos} pages`);
