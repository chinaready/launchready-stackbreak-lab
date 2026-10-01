#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// One-shot migration: dependency detail pages live under /stack/ now.
// 1. Generates redirect stubs at the old /demos/<page>.html paths
//    (canonical + meta-refresh + location.replace, noindex).
// 2. Rewrites internal references across the repo: self URLs in the moved
//    pages, hub links, registry demoPath, tests, sitemap, llms.txt, README.
//    Historical evidence under results/ is intentionally NOT rewritten.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';

const PAGES = ['beijing-view', 'auth0-lock', 'fonts-google', 'fonts-typekit', 'ga4',
  'google-maps', 'google-signin', 'gtm', 'icons-material', 'recaptcha',
  'vimeo-embed', 'youtube-embed'];

// 1) Stubs for the old URLs.
for (const name of PAGES) {
  const stub = `<!doctype html>
<!-- Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0 -->
<!-- Redirect stub: canonical new home is /stack/${name}.html. Superseded by the
     CDN 301 rule once configured (deploy/oss-cdn-checklist.md). -->
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Stack Break Lab — page moved</title>
  <link rel="canonical" href="https://stackbreak.launchready.cn/stack/${name}.html" />
  <meta http-equiv="refresh" content="0; url=/stack/${name}.html" />
  <meta name="robots" content="noindex" />
</head>
<body>
  <p>Stack Break Lab has moved. <a href="/stack/${name}.html">Continue to the new page</a>.</p>
  <script>location.replace('/stack/${name}.html');</script>
</body>
</html>
`;
  writeFileSync(`demos/${name}.html`, stub);
}
console.log(`stubs written: ${PAGES.length}`);

// 2) Reference rewrites.
const rewriteFiles = [
  'index.html', 'llms.txt', 'README.md', 'sitemap.xml', 'probe/targets.json',
  'tests/playwright/beijing-view.spec.ts', 'scripts/audit-theme.mjs',
  'deploy/oss-cdn-checklist.md',
  ...globSync('stack/*.html'), ...globSync('product/*.html'), ...globSync('public/results/*.html'),
  ...globSync('public/assets/*.js'),
];

let total = 0;
for (const f of rewriteFiles) {
  if (!existsSync(f)) continue;
  let src = readFileSync(f, 'utf8');
  const before = src;
  src = src.replaceAll('demos/beijing-view.html', 'stack/beijing-view.html');
  src = src.replaceAll('/demos/beijing-view', '/stack/beijing-view');
  for (const name of PAGES.filter(n => n !== 'beijing-view')) {
    src = src.replaceAll(`demos/${name}.html`, `stack/${name}.html`);
    src = src.replaceAll(`/demos/${name}`, `/stack/${name}`);
  }
  src = src.replaceAll('"demoPath": "/demos/', '"demoPath": "/stack/');
  // stack hub intra-links: ../demos/<x> -> ./<x> (only inside stack/index.html)
  if (f === 'stack/index.html') {
    src = src.replaceAll('href="../stack/', 'href="./')
             .replaceAll('href="../demos/', 'href="./');
  }
  if (src !== before) { writeFileSync(f, src); total++; }
}
console.log(`references rewritten in ${total} files`);
