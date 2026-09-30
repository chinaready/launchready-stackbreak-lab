// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Stack Break Lab — homepage dashboard. Renders the run meta + per-category
// traffic-light strip from /results/latest.json and the run-reports table from
// /results/history.json. Degrades silently if either fetch fails.
(function () {
  var CATEGORY_LABELS = { fonts: 'Fonts & icons', auth: 'Auth & identity',
    analytics: 'Analytics & tags', embeds: 'Maps, media, embeds', payments: 'Payments' };
  var NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  function el(tag, text, className) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (className) n.className = className;
    return n;
  }
  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function fmtDate(iso) {
    try { return new Date(iso).toISOString().slice(0, 10); } catch (e) { return iso; }
  }

  function renderBoard(latest) {
    var meta = document.getElementById('board-meta');
    var cats = document.getElementById('board-cats');
    if (!latest || !latest.services) return;

    if (meta) {
      var env = latest.environment || {};
      meta.textContent = 'Snapshot ' + fmtDate(latest.generatedAt) + ' · ' +
        (env.cloudProvider || 'unknown') + ' ' + (env.cloudRegion || '') + ' · ' +
        (env.runnerHost || '') + ' — refreshed every Monday 06:00 Beijing time';
    }

    if (!cats) return;
    var byCat = {};
    latest.services.forEach(function (s) {
      var c = byCat[s.category] = byCat[s.category] || { total: 0, blocked: 0, reachable: 0 };
      c.total += 1;
      if (s.verdict === 'Blocked') c.blocked += 1;
      else c.reachable += 1;
    });
    Object.keys(CATEGORY_LABELS).forEach(function (key) {
      var c = byCat[key];
      if (!c) return;
      var state = c.blocked === 0 ? 'is-green' : (c.blocked === c.total ? 'is-red' : 'is-amber');
      var li = el('li', null, 'board-cats__item ' + state);
      li.appendChild(el('span', null, 'board-cats__dot'));
      li.appendChild(el('span', CATEGORY_LABELS[key], 'board-cats__name'));
      li.appendChild(el('span', (c.total - c.blocked) + ' / ' + c.total + ' reachable', 'board-cats__ratio'));
      li.appendChild(el('span', c.blocked + ' blocked', 'board-cats__blocked'));
      cats.appendChild(li);
    });
  }

  function renderReports(history) {
    var tbody = document.querySelector('#reports-table tbody');
    if (!tbody || !history || !history.runs) return;
    var cutoff = Date.now() - NINETY_DAYS_MS;
    history.runs.forEach(function (r) {
      var t = Date.parse(r.date + 'T00:00:00Z');
      if (!isNaN(t) && t < cutoff) return;
      var tr = document.createElement('tr');
      tr.appendChild(el('td', r.date));
      tr.appendChild(el('td', String(r.total)));
      tr.appendChild(el('td', String(r.blocked)));
      tr.appendChild(el('td', String(r.degraded)));
      tr.appendChild(el('td', String(r.reachable)));
      var open = el('td');
      var a = el('a', 'snapshot');
      a.href = '/results/' + r.date + '/probe.md';
      open.appendChild(a);
      tr.appendChild(open);
      tbody.appendChild(tr);
    });
  }

  function boot() {
    fetchJson('/results/latest.json').then(renderBoard);
    fetchJson('/results/history.json').then(renderReports);
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
