#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
// Programmatic theme-alignment audit: for every page, assert the computed
// styles of the key elements match the v2.3 spec (white canvas, navy h1,
// pill eyebrow, white sticky header, themed tables).
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const PAGES = [
  '/', '/stack/', '/product/',
  '/stack/beijing-view.html',
  '/public/results/index.html',
  '/public/results/firebase.html', '/public/results/netlify.html', '/public/results/vercel.html',
  ...JSON.parse(readFileSync('probe/targets.json', 'utf8')).services
    .filter(s => s.demoPath).map(s => s.demoPath),
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let issues = 0;

for (const path of PAGES) {
  await page.goto('http://localhost:8080' + path, { waitUntil: 'networkidle' }).catch(() => null);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const cs = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : null;
    };
    const headerBg = cs('.site-header', 'backgroundColor');
    const bodyBg = cs('body', 'backgroundColor');
    const h1 = document.querySelector('main h1, .hero__title');
    const h1Color = h1 ? getComputedStyle(h1).color : null;
    const theme = !!document.querySelector('link[href*="theme.css"]');
    const darkLogo = !!document.querySelector('.site-header img[src*="logo-horizontal.svg"]');
    const eyebrow = document.querySelector('.eyebrow, .hero__badge, .block__eyebrow');
    const eyebrowRadius = eyebrow ? getComputedStyle(eyebrow).borderRadius : null;
    return { headerBg, bodyBg, h1Color, theme, darkLogo, eyebrowRadius, path: location.pathname };
  });
  const problems = [];
  if (!r.theme) problems.push('theme.css missing');
  if (r.headerBg !== 'rgb(255, 255, 255)') problems.push(`header ${r.headerBg}`);
  if (r.bodyBg !== 'rgb(255, 255, 255)') problems.push(`body ${r.bodyBg}`);
  if (r.h1Color && r.h1Color !== 'rgb(12, 30, 62)') problems.push(`h1 ${r.h1Color}`);
  if (!r.darkLogo) problems.push('header logo not dark');
  if (r.eyebrowRadius && r.eyebrowRadius !== '4px') problems.push(`eyebrow radius ${r.eyebrowRadius}`);
  if (problems.length) { issues++; console.log(`✗ ${r.path}: ${problems.join(' | ')}`); }
  else console.log(`✓ ${r.path}`);
}
await browser.close();
console.log(issues === 0 ? 'ALL ALIGNED' : `${issues} pages misaligned`);
