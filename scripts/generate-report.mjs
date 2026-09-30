#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Weekly PDF report generator. Deterministic per date:
//   node scripts/generate-report.mjs [--date YYYY-MM-DD]
// Reads results/<date>/probe.json (+ browser.json + screenshots), diffs against
// the previous archived run, renders scripts/report-template.html with the
// Chinaready copy module, and prints A4 PDF via Playwright chromium.
// Zero network access: template + logo + screenshots load from the repo only.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { chromium } from '@playwright/test';
import { buildReportModel } from './report-data.mjs';
import { COPY, fillCnTemplate } from './report-copy.mjs';
import { buildWeeklyDocx } from './report-document.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = join(ROOT, 'results');

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function listRunDates() {
  return readdirSync(RESULTS).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && existsSync(join(RESULTS, d, 'probe.json'))).sort();
}

export function previousRunBefore(date) {
  const dates = listRunDates().filter(d => d < date);
  return dates.length ? dates[dates.length - 1] : null;
}

function chip(v) { return `<span class="chip ${escapeHtml(v)}">${escapeHtml(v)}</span>`; }

function serviceRows(model) {
  return model.services.map(s => `<tr>
      <td>${escapeHtml(s.name)}${s.tier === 'community' ? ' <span class="tier-badge">community</span>' : ''}</td>
      <td>${escapeHtml(s.category)}</td><td>${escapeHtml(s.vendor || '—')}</td>
      <td>${escapeHtml(s.domain)}</td><td class="num">${escapeHtml(String(s.httpCode))}</td>
      <td class="num">${Number(s.totalSec).toFixed(3)}</td>
      <td class="num">${s.dnsResolved ? 'yes' : 'no'}</td><td>${chip(s.verdict)}</td>
    </tr>`).join('\n');
}

function summaryLines(model, copy) {
  const c = model.changes;
  const lines = [];
  if (c.newlyBlocked.length) lines.push(`<p><span class="list-blocked">Newly blocked:</span> ${c.newlyBlocked.map(s => escapeHtml(s.name)).join(', ')}</p>`);
  if (c.recovered.length) lines.push(`<p><span class="list-recovered">Recovered:</span> ${c.recovered.map(s => escapeHtml(s.name)).join(', ')}</p>`);
  if (!lines.length) lines.push(`<p>${escapeHtml(copy.labels.noChanges)}</p>`);
  lines.push(`<p style="margin-top:6mm;color:var(--muted);font-size:9.5pt">${escapeHtml(copy.disclaimer)}</p>`);
  return lines.join('\n');
}

function browserSection(model, copy, n) {
  if (!model.browserFindings.length) return '';
  const rows = model.browserFindings.map(f => `<tr>
      <td>${escapeHtml(f.name)}</td><td>${chip(f.verdict)}</td>
      <td class="num">${f.failedCount}</td></tr>`).join('\n');
  return `<h2 class="chap" id="browser"><span class="n">${n}</span>${escapeHtml(copy.sections.browserHeading)}</h2>
    <table><thead><tr><th>Dependency</th><th>Browser verdict</th><th class="num">${escapeHtml(copy.labels.failedRequests)}</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function shotsSection(date, model, copy, n) {
  const shotDir = join(RESULTS, date, 'screenshots');
  if (!existsSync(shotDir)) return '';
  const blockedIds = new Set(model.services.filter(s => s.verdict === 'Blocked').map(s => s.id));
  const figs = readdirSync(shotDir).filter(f => f.endsWith('.png') && blockedIds.has(f.replace(/\.png$/, '')))
    .map(f => `<figure><img src="${'file://' + join(shotDir, f)}" alt="" /><figcaption>${escapeHtml(f.replace(/\.png$/, ''))} — as recorded by the Beijing browser run</figcaption></figure>`)
    .join('\n');
  if (!figs) return '';
  return `<h2 class="chap" id="shots"><span class="n">${n}</span>${escapeHtml(copy.sections.shotsHeading)}</h2>
    <div class="shots">${figs}</div>`;
}

function cnBody(model, copy) {
  const cn = fillCnTemplate(model, copy);
  return ['lede', 'totals', 'changes', 'environment', 'readMore'].map(k => `<p>${escapeHtml(cn[k])}</p>`).join('\n');
}

export function renderHtml(date) {
  const probe = JSON.parse(readFileSync(join(RESULTS, date, 'probe.json'), 'utf8'));
  const browserPath = join(RESULTS, date, 'browser.json');
  const browserDoc = existsSync(browserPath) ? JSON.parse(readFileSync(browserPath, 'utf8')) : null;
  const browser = Array.isArray(browserDoc) ? browserDoc : (browserDoc && browserDoc.browser) || [];
  const prevDate = previousRunBefore(date);
  const prev = prevDate ? JSON.parse(readFileSync(join(RESULTS, prevDate, 'probe.json'), 'utf8')) : null;
  const model = buildReportModel({ probe, browser, prev });

  const day = (probe.generatedAt || date).slice(0, 10);
  const env = probe.environment || {};

  // Chapter numbering: fixed 01/02, then optional browser/shots, CN summary last.
  const hasBrowser = model.browserFindings.length > 0;
  const hasShots = (() => {
    const shotDir = join(RESULTS, date, 'screenshots');
    if (!existsSync(shotDir)) return false;
    const blockedIds = new Set(model.services.filter(s => s.verdict === 'Blocked').map(s => s.id));
    return readdirSync(shotDir).some(f => f.endsWith('.png') && blockedIds.has(f.replace(/\.png$/, '')));
  })();
  const nBrowser = '03';
  const nShots = hasBrowser ? '04' : '03';
  const nCn = String(3 + (hasBrowser ? 1 : 0) + (hasShots ? 1 : 0)).padStart(2, '0');

  const toc = [
    { n: '01', href: '#summary', t: COPY.sections.summaryHeading, d: 'Changes against the previous archived run' },
    { n: '02', href: '#verdicts', t: COPY.sections.servicesHeading, d: `All ${model.totals.total} dependencies, blocked first` },
  ];
  if (hasBrowser) toc.push({ n: nBrowser, href: '#browser', t: COPY.sections.browserHeading, d: 'What a real browser saw' });
  if (hasShots) toc.push({ n: nShots, href: '#shots', t: COPY.sections.shotsHeading, d: 'Screenshots of blocked demos' });
  toc.push({ n: nCn, href: '#cn', t: COPY.sections.cnHeading, d: 'Chinese summary' });
  const tocEntries = toc.map(e => `<li><a href="${e.href}"><span class="toc__n">${e.n}</span><span class="toc__t">${escapeHtml(e.t)}</span><span class="toc__d">${escapeHtml(e.d)}</span></a></li>`).join('\n');

  let html = readFileSync(join(ROOT, 'scripts', 'report-template.html'), 'utf8');
  html = html
    .replace('__TITLE__', `Stack Break Weekly — ${day}`)
    .replace('__LOGO__', 'file://' + join(ROOT, 'public/assets/brand/logo-horizontal-white.svg'))
    .replace('__EYEBROW__', escapeHtml(COPY.cover.eyebrow))
    .replace('__TITLE_BEFORE_PERIOD__', escapeHtml(COPY.cover.titleBeforePeriod))
    .replace('__SUBTITLE__', escapeHtml(COPY.cover.subtitle))
    .replace('__RUN_DATE__', escapeHtml(day))
    .replace('__NODE__', escapeHtml(`${env.cloudProvider || 'unknown'} ${env.cloudRegion || ''} · ${env.runnerHost || ''}`.trim()))
    .replace('__TARGETS__', escapeHtml(`${model.totals.total} — ${model.totals.blocked} blocked / ${model.totals.degraded} degraded / ${model.totals.reachable} reachable`))
    .replace('__SITE__', escapeHtml(COPY.cover.site))
    .replace('__TOC_ENTRIES__', tocEntries)
    .replace('__SUMMARY_HEADING__', escapeHtml(COPY.sections.summaryHeading))
    .replace('__SUMMARY_LINES__', summaryLines(model, COPY))
    .replace('__DISCLAIMER__', escapeHtml(COPY.disclaimer))
    .replace('__SERVICES_HEADING__', escapeHtml(COPY.sections.servicesHeading))
    .replace('__SERVICE_HEAD__', ['service', 'category', 'vendor', 'domain', 'http', 'total', 'dnsCol'].map(k => `<th${k === 'total' || k === 'http' ? ' class="num"' : ''}>${escapeHtml(COPY.labels[k])}</th>`).join('') + '<th></th>')
    .replace('__SERVICE_ROWS__', serviceRows(model))
    .replace('__BROWSER_SECTION__', browserSection(model, COPY, nBrowser))
    .replace('__SHOTS_SECTION__', shotsSection(date, model, COPY, nShots))
    .replace('__CN_NUM__', nCn)
    .replace('__CN_HEADING__', escapeHtml(COPY.sections.cnHeading))
    .replace('__CN_BODY__', cnBody(model, COPY))
    .replace('__CN_DISCLAIMER__', escapeHtml(COPY.cn.disclaimer));
  return html;
}

export async function generateReport(date) {
  if (!existsSync(join(RESULTS, date, 'probe.json'))) {
    throw new Error(`no probe.json for ${date} under results/`);
  }
  const html = renderHtml(date);
  const tmpHtml = join(tmpdir(), `stackbreak-report-${date}.html`);
  writeFileSync(tmpHtml, html);

  const model = (() => {
    const probe = JSON.parse(readFileSync(join(RESULTS, date, 'probe.json'), 'utf8'));
    const browserPath = join(RESULTS, date, 'browser.json');
    const browserDoc = existsSync(browserPath) ? JSON.parse(readFileSync(browserPath, 'utf8')) : null;
    const browser = Array.isArray(browserDoc) ? browserDoc : (browserDoc && browserDoc.browser) || [];
    const prevDate = previousRunBefore(date);
    const prev = prevDate ? JSON.parse(readFileSync(join(RESULTS, prevDate, 'probe.json'), 'utf8')) : null;
    return buildReportModel({ probe, browser, prev });
  })();

  // DS-standard DOCX via the vendored Chinaready toolchain.
  const brandDir = join(ROOT, 'public/assets/brand');
  const docxBuffer = await buildWeeklyDocx({ model, copy: COPY, date, brandDir });
  const docxPath = join(RESULTS, date, 'report.docx');
  writeFileSync(docxPath, docxBuffer);

  const outPath = join(RESULTS, date, 'report.pdf');
  mkdirSync(dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('file://' + tmpHtml, { waitUntil: 'load' });
    const day = date;
    const muted = 'color:#5A6B85;font-size:7pt;font-family:Inter,Arial,sans-serif;';
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: '18mm', bottom: '16mm', left: '14mm', right: '14mm' },
      headerTemplate: `<div style="${muted}width:100%;padding:0 14mm;display:flex;justify-content:space-between;">
        <span>Stack Break Weekly — ${escapeHtml(day)}</span><span>${escapeHtml(COPY.cover.site)}</span></div>`,
      footerTemplate: `<div style="${muted}width:100%;padding:0 14mm;display:flex;justify-content:space-between;">
        <span>Chinaready · Stack Break Lab — single-node snapshot, not a compliance conclusion</span>
        <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
  } finally {
    await browser.close();
  }
  return { pdfPath: outPath, docxPath };
}

const ranDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ranDirectly) {
  const i = process.argv.indexOf('--date');
  const date = i > -1 ? process.argv[i + 1] : listRunDates().at(-1);
  if (!date) { console.error('error: no dated evidence runs found under results/'); process.exit(1); }
  generateReport(date)
    .then(({ pdfPath, docxPath }) => {
      const kb = (f) => Math.round(readFileSync(f).length / 1024);
      console.log(`OK: ${pdfPath} (${kb(pdfPath)} KB) · ${docxPath} (${kb(docxPath)} KB)`);
    })
    .catch(err => { console.error(`error: ${err.message}`); process.exit(1); });
}
