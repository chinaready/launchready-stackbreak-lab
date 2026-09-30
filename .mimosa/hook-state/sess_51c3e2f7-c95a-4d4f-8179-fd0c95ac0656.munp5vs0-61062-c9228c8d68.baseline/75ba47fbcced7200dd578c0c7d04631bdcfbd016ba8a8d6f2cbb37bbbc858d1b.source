// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Renders the Netlify page-resource latency snapshot (results/netlify-resources-latest.json)
// into the page. Shared by the dedicated Netlify results page and the full results
// viewer so the two never drift.
//
// Expected DOM (any subset; missing nodes are skipped):
//   #netlify-latency        optional wrapper, unhidden once a snapshot renders
//   #netlify-edge           optional <dl> for the edge region + provenance
//   #netlify-latency-root   required container the table is appended to
(function () {
  function el(tag, text, className) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (className) n.className = className;
    return n;
  }

  function fmtDate(iso) {
    try { return new Date(iso).toISOString().replace('T', ' ').replace('.000Z', ' UTC'); }
    catch (e) { return iso || 'unknown'; }
  }

  function fmtBytes(b) {
    var n = Number(b) || 0;
    if (n >= 1048576) return (n / 1048576).toFixed(2) + ' MB';
    if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
    return n + ' B';
  }

  var KIND_LABELS = { endpoint: 'Endpoint', 'image-cdn': 'Image CDN', raw: 'Raw asset' };
  var VERDICT_ORDER = ['Blocked', 'Degraded', 'Reachable'];

  function verdictCell(verdict) {
    var td = el('td');
    td.appendChild(el('span', verdict, 'verdict ' + verdict));
    return td;
  }

  // Seconds value + log-scaled, verdict-colored latency bar.
  function latencyCell(totalSec, maxSec, verdict) {
    var td = el('td'); td.className = 'lat';
    var n = Number(totalSec) || 0;
    td.appendChild(el('span', (n.toFixed(3).replace(/\.?0+$/, '') || '0'), 'lat__val'));
    var pct = n > 0 && maxSec > 0
      ? Math.max(4, Math.min(100, Math.round(Math.log(1 + n) / Math.log(1 + maxSec) * 100)))
      : 0;
    var track = el('span', null, 'lat__track');
    var fill = el('span', null, 'lat__fill ' + verdict);
    fill.style.width = pct + '%';
    track.appendChild(fill); td.appendChild(track);
    return td;
  }

  function summaryBand(items) {
    var counts = {};
    items.forEach(function (p) { counts[p.verdict] = (counts[p.verdict] || 0) + 1; });
    var band = el('div', null, 'verdict-summary');
    band.setAttribute('role', 'group');
    band.setAttribute('aria-label', 'Verdict totals');
    VERDICT_ORDER.forEach(function (v) {
      if (!counts[v]) return;
      var item = el('div', null, 'vs-item');
      item.appendChild(el('span', String(counts[v]), 'vs-count'));
      item.appendChild(el('span', v, 'verdict ' + v));
      band.appendChild(item);
    });
    return band;
  }

  function renderEdge(data, dl) {
    var edge = data.edge || {};
    var env = data.environment || {};
    var geo = edge.geo || {};
    var loc = [geo.city, geo.country && (geo.country.code || geo.country.name)].filter(Boolean).join(', ');
    [
      ['Edge serverRegion', edge.serverRegion || 'unknown'],
      ['Edge geo', loc || 'unknown'],
      ['Measured from', (env.cloudProvider || 'unknown') + ' / ' + (env.cloudRegion || 'unknown')],
      ['Generated', fmtDate(data.generatedAt)]
    ].forEach(function (r) {
      dl.appendChild(el('dt', r[0]));
      dl.appendChild(el('dd', r[1]));
    });
  }

  function renderTable(data, root) {
    var resources = data.resources || [];
    var totalBytes = resources.reduce(function (m, r) { return m + (Number(r.bytes) || 0); }, 0);
    var maxSec = resources.reduce(function (m, r) { return Math.max(m, Number(r.totalSec) || 0); }, 0);

    root.appendChild(summaryBand(resources));
    root.appendChild(el('p', 'Total measured payload: ' + fmtBytes(totalBytes) + ' across ' + resources.length + ' resources.', 'feat'));

    var table = el('table'); table.className = 'results';
    var thead = el('thead'); var htr = el('tr');
    ['Resource', 'Type', 'HTTP', 'Size', 'TTFB (s)', 'Total (s)', 'Mbps', 'Verdict'].forEach(function (h) {
      htr.appendChild(el('th', h));
    });
    thead.appendChild(htr); table.appendChild(thead);

    var tbody = el('tbody');
    resources.forEach(function (r) {
      var tr = el('tr');
      tr.appendChild(el('td', r.name));
      tr.appendChild(el('td', KIND_LABELS[r.kind] || r.kind));
      tr.appendChild(el('td', r.httpCode));
      tr.appendChild(el('td', fmtBytes(r.bytes)));
      tr.appendChild(el('td', (Number(r.ttfbSec) || 0).toFixed(3)));
      tr.appendChild(latencyCell(r.totalSec, maxSec, r.verdict));
      tr.appendChild(el('td', (Number(r.throughputMbps) || 0).toFixed(2)));
      tr.appendChild(verdictCell(r.verdict));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    root.appendChild(table);
  }

  function load() {
    var root = document.getElementById('netlify-latency-root');
    if (!root) return;
    var edgeEl = document.getElementById('netlify-edge');
    var section = document.getElementById('netlify-latency');

    fetch('/results/netlify-resources-latest.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        if (!(data.resources || []).length) {
          if (root.dataset.required === 'true') {
            root.appendChild(el('p', 'No Netlify latency snapshot available yet.'));
          }
          return;
        }
        if (edgeEl) renderEdge(data, edgeEl);
        renderTable(data, root);
        if (section) section.hidden = false;
      })
      .catch(function () {
        if (root.dataset.required === 'true') {
          root.appendChild(el('p', 'Could not load results/netlify-resources-latest.json.'));
        }
      });
  }

  if (document.readyState !== 'loading') load();
  else document.addEventListener('DOMContentLoaded', load);
})();
