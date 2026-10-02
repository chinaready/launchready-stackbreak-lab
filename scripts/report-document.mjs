#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Weekly report DOCX builder — adapted from the Chinaready standard template
// toolchain (mvp-1/docs/sales/_build/document.mjs), reusing its vendored OOXML
// primitives (scripts/report-ooxml.mjs) verbatim: full-bleed navy cover with
// the white logo, running header (logo + rule) and footer (site + PAGE field),
// navy 23pt headings, surface cards, bordered tables. Data comes from
// scripts/report-data.mjs; copy from scripts/report-copy.mjs.

import { readFile } from 'node:fs/promises';
import { C, makeZip, p, r, imageRun, table, tc, tr } from './report-ooxml.mjs';
import { fillCnTemplate } from './report-copy.mjs';

const A4_WIDTH = 9412;
const COVER_WIDTH = 11906;
const COVER_LOGO_CY_EMU = 432000;
const COVER_LOGO_CX_EMU = COVER_LOGO_CY_EMU * 5;
const HEADER_LOGO_CX_EMU = 1900000;
const HEADER_LOGO_CY_EMU = 420000;
const VERDICT_COLOR = { Blocked: 'B42318', Degraded: 'B54708', Reachable: '067647' };

const ALL_BORDERS = (color = C.border) =>
  `<w:tcBorders><w:top w:val="single" w:sz="4" w:color="${color}"/><w:left w:val="single" w:sz="4" w:color="${color}"/><w:bottom w:val="single" w:sz="4" w:color="${color}"/><w:right w:val="single" w:sz="4" w:color="${color}"/></w:tcBorders>`;

function section({ cover = false, nextPage = false } = {}) {
  return `<w:p><w:pPr><w:sectPr>${nextPage ? '<w:type w:val="nextPage"/>' : ''}${cover ? '<w:titlePg/>' : '<w:headerReference w:type="default" r:id="rId1"/><w:footerReference w:type="default" r:id="rId2"/>'}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${cover ? 0 : 1134}" w:right="${cover ? 0 : 1247}" w:bottom="${cover ? 0 : 1134}" w:left="${cover ? 0 : 1247}" w:header="${cover ? 0 : 567}" w:footer="${cover ? 0 : 567}" w:gutter="0"/></w:sectPr></w:pPr></w:p>`;
}

function heading(text) {
  return p({ keepNext: true, spaceAfter: 180, runs: [{ text, bold: true, color: C.primary, size: 46 }] });
}

function body(text, options = {}) {
  return p({ spaceAfter: 180, runs: [{ text, color: options.color || C.text, size: options.size || 22, italic: options.italic }] });
}

function esc(v) { return String(v); } // ooxml r() already XML-escapes text

function cover(model, copy, date) {
  const day = (model.generatedAt || date).slice(0, 10);
  const env = model.environment || {};
  return [
    table([tr([tc({
      width: COVER_WIDTH,
      shd: C.primary,
      borders: '<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>',
      body: [
        p({ spaceBefore: 600, runs: [] }),
        p({ runs: [imageRun({ relId: 'rId3', cxEmu: COVER_LOGO_CX_EMU, cyEmu: COVER_LOGO_CY_EMU, name: 'Chinaready cover logo' })] }),
        p({ spaceBefore: 1300, runs: [] }),
        p({ runs: [{ text: copy.cover.eyebrow.toUpperCase(), bold: true, caps: true, color: C.onDark3, size: 18, spc: 80 }] }),
        p({ spaceAfter: 240, runs: [
          { text: copy.cover.titleBeforePeriod, bold: true, color: C.onDark, size: 64 },
          { text: '.', bold: true, color: C.blue, size: 64 },
        ] }),
        p({ runs: [{ text: copy.cover.subtitle, color: C.onDark2, size: 26 }] }),
        p({ spaceBefore: 700, runs: [
          { text: 'Run date  ', bold: true, color: C.onDark3, size: 20 },
          { text: day, color: C.onDark, size: 20 },
          { text: '      Node  ', bold: true, color: C.onDark3, size: 20 },
          { text: `${env.cloudProvider || 'unknown'} ${env.cloudRegion || ''}`.trim(), color: C.onDark, size: 20 },
        ] }),
        p({ runs: [
          { text: 'Targets  ', bold: true, color: C.onDark3, size: 20 },
          { text: `${model.totals.total} — ${model.totals.blocked} blocked / ${model.totals.degraded} degraded / ${model.totals.reachable} reachable`, color: C.onDark, size: 20 },
        ] }),
        p({ spaceBefore: 2400, runs: [] }),
        p({ runs: [{ text: copy.cover.site, bold: true, color: C.onDark, size: 20 }] }),
      ],
    })], { cantSplit: false })], { width: COVER_WIDTH, grid: [COVER_WIDTH], borders: false }),
    section({ cover: true, nextPage: true }),
  ].join('');
}

function toc(entries) {
  return [
    heading('Contents'),
    ...entries.map((e) => p({ spaceAfter: 60, runs: [
      { text: `${e.n}   `, bold: true, color: C.blue, size: 24 },
      { text: e.t, bold: true, color: C.text, size: 24 },
      { text: `   — ${e.d}`, color: C.text2, size: 20 },
    ] })),
    section({ nextPage: true }),
  ].join('');
}

function summary(model, copy) {
  const parts = [heading(`01   ${copy.sections.summaryHeading}`)];
  if (model.changes.newlyBlocked.length) {
    parts.push(p({ spaceAfter: 80, runs: [
      { text: 'Newly blocked:  ', bold: true, color: VERDICT_COLOR.Blocked, size: 22 },
      { text: model.changes.newlyBlocked.map(s => s.name).join(', '), color: C.text, size: 22 },
    ] }));
  }
  if (model.changes.recovered.length) {
    parts.push(p({ spaceAfter: 80, runs: [
      { text: 'Recovered:  ', bold: true, color: VERDICT_COLOR.Reachable, size: 22 },
      { text: model.changes.recovered.map(s => s.name).join(', '), color: C.text, size: 22 },
    ] }));
  }
  if (!model.changes.newlyBlocked.length && !model.changes.recovered.length) {
    parts.push(body(copy.labels.noChanges));
  }
  parts.push(body(copy.disclaimer, { color: C.text2, size: 18, italic: true }));
  // Color-code legend mirroring the site's verdict-legend component.
  parts.push(p({ spaceBefore: 120, runs: [
    { text: '\u25CF ', bold: true, color: VERDICT_COLOR.Reachable, size: 18 },
    { text: 'Reachable < 1s      ', bold: true, color: C.text, size: 18 },
    { text: '\u25CF ', bold: true, color: VERDICT_COLOR.Degraded, size: 18 },
    { text: 'Degraded 1\u20133s      ', bold: true, color: C.text, size: 18 },
    { text: '\u25CF ', bold: true, color: VERDICT_COLOR.Blocked, size: 18 },
    { text: 'Blocked > 3s or connection failed', bold: true, color: C.text, size: 18 },
  ] }));
  parts.push(body('Measured as total request time from the Beijing node; any HTTP status counts as connected.', { color: C.text2, size: 17, italic: true }));
  parts.push(section({ nextPage: true }));
  return parts.join('');
}

function verdicts(model, copy) {
  const header = tr([
    ['Dependency', 2500], ['Tier', 900], ['SaaS', 1100], ['Domain', 2300], ['HTTP', 800], ['Total s', 800], ['Verdict', 1012],
  ].map(([label, w]) => tc({
    width: w, shd: C.surface, borders: ALL_BORDERS(),
    body: [p({ runs: [{ text: label.toUpperCase(), bold: true, color: C.primary, size: 17 }] })],
  })), { header: true });
  const rows = model.services.map((s) => tr([
    tc({ width: 2500, borders: ALL_BORDERS(), body: [p({ runs: [{ text: s.name, bold: true, color: C.text, size: 19 }] })] }),
    tc({ width: 900, borders: ALL_BORDERS(), body: [p({ runs: [{ text: s.tier === 'community' ? 'community' : 'curated', color: C.text2, size: 18 }] })] }),
    tc({ width: 1100, borders: ALL_BORDERS(), body: [p({ runs: [{ text: s.vendor || '—', color: C.blue, size: 19 }] })] }),
    tc({ width: 2300, borders: ALL_BORDERS(), body: [p({ runs: [{ text: s.domain, color: C.text, size: 19 }] })] }),
    tc({ width: 800, borders: ALL_BORDERS(), body: [p({ runs: [{ text: String(s.httpCode), color: C.text2, size: 19 }] })] }),
    tc({ width: 800, borders: ALL_BORDERS(), body: [p({ runs: [{ text: Number(s.totalSec).toFixed(3), color: C.text2, size: 19 }] })] }),
    tc({ width: 1012, borders: ALL_BORDERS(), body: [p({ runs: [{ text: s.verdict, bold: true, color: VERDICT_COLOR[s.verdict] || C.text, size: 19 }] })] }),
  ]));
  return [
    heading(`02   ${copy.sections.servicesHeading}`),
    table([header, ...rows], { width: A4_WIDTH, grid: [2500, 900, 1100, 2300, 800, 800, 1012] }),
    section({ nextPage: true }),
  ].join('');
}

function browserChapter(model, copy) {
  if (!model.browserFindings.length) return '';
  const header = tr([
    ['Dependency', 4000], ['Browser verdict', 2412], ['Failed requests', 3000],
  ].map(([label, w]) => tc({
    width: w, shd: C.surface, borders: ALL_BORDERS(),
    body: [p({ runs: [{ text: label.toUpperCase(), bold: true, color: C.primary, size: 17 }] })],
  })), { header: true });
  const rows = model.browserFindings.map((f) => tr([
    tc({ width: 4000, borders: ALL_BORDERS(), body: [p({ runs: [{ text: f.name, bold: true, color: C.text, size: 19 }] })] }),
    tc({ width: 2412, borders: ALL_BORDERS(), body: [p({ runs: [{ text: f.verdict, bold: true, color: VERDICT_COLOR[f.verdict] || C.text, size: 19 }] })] }),
    tc({ width: 3000, borders: ALL_BORDERS(), body: [p({ runs: [{ text: String(f.failedCount), color: C.text2, size: 19 }] })] }),
  ]));
  return [
    heading(`03   ${copy.sections.browserHeading}`),
    table([header, ...rows], { width: A4_WIDTH, grid: [4000, 2412, 3000] }),
    section({ nextPage: true }),
  ].join('');
}

function cnChapter(model, copy, n) {
  const cn = fillCnTemplate(model, copy);
  return [
    heading(`${n}   ${copy.sections.cnHeading}`),
    body(cn.lede),
    body(cn.totals),
    body(cn.changes),
    body(cn.environment),
    body(cn.readMore),
    body(cn.disclaimer, { color: C.text2, size: 18, italic: true }),
    section(),
  ].join('');
}

function documentXml(model, copy, date) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${cover(model, copy, date)}${toc([
    { n: '01', t: copy.sections.summaryHeading, d: 'Changes against the previous archived run' },
    { n: '02', t: copy.sections.servicesHeading, d: `All ${model.totals.total} dependencies, blocked first` },
    ...(model.browserFindings.length ? [{ n: '03', t: copy.sections.browserHeading, d: 'What a real browser saw' }] : []),
    { n: model.browserFindings.length ? '04' : '03', t: copy.sections.cnHeading, d: 'Chinese summary' },
  ])}${summary(model, copy)}${verdicts(model, copy)}${browserChapter(model, copy)}${cnChapter(model, copy, model.browserFindings.length ? '04' : '03')}</w:body></w:document>`;
}

function headerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:color="${C.border}"/></w:pBdr></w:pPr>${imageRun({ relId: 'rId1', cxEmu: HEADER_LOGO_CX_EMU, cyEmu: HEADER_LOGO_CY_EMU, name: 'Chinaready header logo' })}</w:p></w:hdr>`;
}

function footerXml(copy) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9412"/></w:tabs></w:pPr>${r({ text: copy.cover.site, color: C.text2, size: 18 })}<w:r><w:tab/></w:r>${r({ text: 'PAGE ', color: C.text2, size: 18 })}<w:fldSimple w:instr="PAGE"/></w:p></w:ftr>`;
}

export async function buildWeeklyDocx({ model, copy, date, brandDir }) {
  const coverPng = await readFile(`${brandDir}/logo-horizontal-white.png`);
  const headerPng = await readFile(`${brandDir}/logo-horizontal.png`);
  return makeZip({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/document.xml': documentXml(model, copy, date),
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo-cover.png"/></Relationships>`,
    'word/header.xml': headerXml(),
    'word/_rels/header.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo-header.png"/></Relationships>`,
    'word/footer.xml': footerXml(copy),
    'word/media/logo-cover.png': coverPng,
    'word/media/logo-header.png': headerPng,
  });
}
