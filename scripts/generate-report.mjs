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

function browserSection(model, copy) {
  if (!model.browserFindings.length) return '';
  const rows = model.browserFindings.map(f => `<tr>
      <td>${escapeHtml(f.name)}</td><td>${chip(f.verdict)}</td>
      <td class="num">${f.failedCount}</td></tr>`).join('\n');
  return `<section class="page-break">
    <h2>${escapeHtml(copy.sections.browserHeading)}</h2>
    <table><thead><tr><th>Dependency</th><th>Browser verdict</th><th class="num">${escapeHtml(copy.labels.failedRequests)}</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </section>`;
}

function shotsSection(date, model, copy) {
  const shotDir = join(RESULTS, date, 'screenshots');
  if (!existsSync(shotDir)) return '';
  const blockedIds = new Set(model.services.filter(s => s.verdict === 'Blocked').map(s => s.id));
  const figs = readdirSync(shotDir).filter(f => f.endsWith('.png') && blockedIds.has(f.replace(/\.png$/, '')))
    .map(f => `<figure><img src="${'file://' + join(shotDir, f)}" alt="" /><figcaption>${escapeHtml(f.replace(/\.png$/, ''))} — as recorded by the Beijing browser run</figcaption></figure>`)
    .join('\n');
  if (!figs) return '';
  return `<section class="page-break">
    <h2>${escapeHtml(copy.sections.shotsHeading)}</h2>
    <div class="shots">${figs}</div>
  </section>`;
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

  let html = readFileSync(join(ROOT, 'scripts', 'report-template.html'), 'utf8');
  const day = (probe.generatedAt || date).slice(0, 10);
  const meta = `${copy_label('runDate')} <strong>${escapeHtml(day)}</strong> · ${copy_label('node')} <strong>${escapeHtml((probe.environment || {}).cloudProvider || 'unknown')} ${escapeHtml((probe.environment || {}).cloudRegion || '')} / ${escapeHtml((probe.environment || {}).runnerHost || '')}</strong> · ${copy_label('dns')} <strong>${escapeHtml((probe.environment || {}).dnsServer || '—')}</strong>`;
  function copy_label(k) { return escapeHtml(COPY.labels[k]); }

  html = html
    .replace('__TITLE__', `Stack Break Weekly — ${day}`)
    .replace('__LOGO__', 'file://' + join(ROOT, 'public/assets/brand/logo-horizontal.svg'))
    .replace('__EYEBROW__', escapeHtml(COPY.cover.eyebrow))
    .replace('__TITLE_BEFORE_PERIOD__', escapeHtml(COPY.cover.titleBeforePeriod))
    .replace('__SUBTITLE__', escapeHtml(COPY.cover.subtitle))
    .replace('__RUN_META__', meta)
    .replace('__BLOCKED__', String(model.totals.blocked))
    .replace('__DEGRADED__', String(model.totals.degraded))
    .replace('__REACHABLE__', String(model.totals.reachable))
    .replace('__COVER_FOOT__', escapeHtml(`${COPY.cover.site} · ${COPY.cover.operatedBy}`))
    .replace('__SUMMARY_HEADING__', escapeHtml(COPY.sections.summaryHeading))
    .replace('__SUMMARY_LINES__', summaryLines(model, COPY))
    .replace('__SERVICES_HEADING__', escapeHtml(COPY.sections.servicesHeading))
    .replace('__SERVICE_HEAD__', ['service', 'category', 'vendor', 'domain', 'http', 'total', 'dnsCol'].map(k => `<th${k === 'total' || k === 'http' ? ' class="num"' : ''}>${escapeHtml(COPY.labels[k])}</th>`).join('') + '<th></th>')
    .replace('__SERVICE_ROWS__', serviceRows(model))
    .replace('__BROWSER_SECTION__', browserSection(model, COPY))
    .replace('__SHOTS_SECTION__', shotsSection(date, model, COPY))
    .replace('__CN_HEADING__', escapeHtml(COPY.sections.cnHeading))
    .replace('__CN_BODY__', cnBody(model, COPY))
    .replace('__CN_DISCLAIMER__', escapeHtml(COPY.cn.disclaimer))
    .replace('__FOOT__', escapeHtml(COPY.disclaimer));
  return html;
}

export async function generateReport(date) {
  if (!existsSync(join(RESULTS, date, 'probe.json'))) {
    throw new Error(`no probe.json for ${date} under results/`);
  }
  const html = renderHtml(date);
  const tmpHtml = join(tmpdir(), `stackbreak-report-${date}.html`);
  writeFileSync(tmpHtml, html);
  const outPath = join(RESULTS, date, 'report.pdf');
  mkdirSync(dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('file://' + tmpHtml, { waitUntil: 'load' });
    await page.pdf({ path: outPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
  return outPath;
}

const ranDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (ranDirectly) {
  const i = process.argv.indexOf('--date');
  const date = i > -1 ? process.argv[i + 1] : listRunDates().at(-1);
  if (!date) { console.error('error: no dated evidence runs found under results/'); process.exit(1); }
  generateReport(date)
    .then(p => {
      const kb = Math.round(readFileSync(p).length / 1024);
      console.log(`OK: ${p} (${kb} KB)`);
    })
    .catch(err => { console.error(`error: ${err.message}`); process.exit(1); });
}
