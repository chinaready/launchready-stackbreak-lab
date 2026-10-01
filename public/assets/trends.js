// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Trends renderer: one row per dependency — verdict stripe (SVG rects on a
// shared date axis) + latency sparkline (log-scaled polyline). Hand-rolled
// SVG only; degrades to a visible fallback when the JSON is unreachable.

(function () {
  var CATEGORY_LABELS = { fonts: 'Fonts & icons', auth: 'Auth & identity',
    analytics: 'Analytics & tags', embeds: 'Maps, media, embeds', payments: 'Payments' };
  var VERDICT_FILL = { Blocked: '#B42318', Degraded: '#B54708', Reachable: '#067647' };
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
  function svg(node) {
    node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return node;
  }

  function stripe(targetPoints, dates) {
    var byDate = {};
    (targetPoints || []).forEach(function (p) { byDate[p.d] = p; });
    var W = dates.length * 9, H = 18;
    var s = svg(elNS('svg'));
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    s.setAttribute('preserveAspectRatio', 'none');
    s.setAttribute('class', 'tr-stripe');
    dates.forEach(function (d, i) {
      var p = byDate[d];
      if (!p) return;
      var r = elNS('rect');
      r.setAttribute('x', i * 9 + 0.5); r.setAttribute('y', 1);
      r.setAttribute('width', 8); r.setAttribute('height', H - 2);
      r.setAttribute('rx', 2);
      r.setAttribute('fill', VERDICT_FILL[p.v] || '#5A6A80');
      r.setAttribute('class', 'tr-seg v-' + p.v);
      s.appendChild(r);
    });
    return s;
  }

  function sparkline(targetPoints) {
    var pts = (targetPoints || []).filter(function (p) { return typeof p.t === 'number'; });
    var s = svg(elNS('svg'));
    s.setAttribute('viewBox', '0 0 100 28');
    s.setAttribute('preserveAspectRatio', 'none');
    s.setAttribute('class', 'tr-spark');
    if (pts.length < 2) return s;
    var max = Math.log(1 + 16), // fixed 0-16s log domain keeps rows comparable
        step = 100 / (pts.length - 1);
    var path = '';
    pts.forEach(function (p, i) {
      var x = (i * step).toFixed(1);
      var y = (26 - (Math.log(1 + Math.min(p.t, 16)) / max) * 24).toFixed(1);
      path += (i ? 'L' : 'M') + x + ' ' + y + ' ';
    });
    var pl = elNS('polyline');
    pl.setAttribute('points', path.trim().replace(/M|L/g, ' ').trim());
    pl.setAttribute('fill', 'none');
    pl.setAttribute('stroke', '#005BAC');
    pl.setAttribute('stroke-width', '1.5');
    pl.setAttribute('vector-effect', 'non-scaling-stroke');
    s.appendChild(pl);
    return s;
  }

  function elNS(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

  function summary(timeline) {
    var cutoff = new Date(Date.now() - NINETY_DAYS_MS).toISOString().slice(0, 10);
    var newlyBlocked = 0, recovered = 0;
    Object.keys(timeline.targets).forEach(function (id) {
      var pts = timeline.targets[id];
      for (var i = 1; i < pts.length; i++) {
        if (pts[i].d < cutoff) continue;
        if (pts[i - 1].v !== 'Blocked' && pts[i].v === 'Blocked') newlyBlocked++;
        if (pts[i - 1].v === 'Blocked' && pts[i].v === 'Reachable') recovered++;
      }
    });
    var dl = document.getElementById('tr-summary');
    if (!dl) return;
    [['Newly blocked · 90d', newlyBlocked, 'is-blocked'], ['Recovered · 90d', recovered, 'is-recovered'],
     ['Targets watched', Object.keys(timeline.targets).length, ''],
     ['Runs recorded', countDates(timeline), '']].forEach(function (pair) {
      dl.appendChild(el('dt', pair[0]));
      dl.appendChild(el('dd', String(pair[1]), pair[2] || undefined));
    });
  }

  function countDates(timeline) {
    var seen = {};
    Object.keys(timeline.targets).forEach(function (id) {
      timeline.targets[id].forEach(function (p) { seen[p.d] = 1; });
    });
    return Object.keys(seen).length;
  }

  function render(timeline, registry, community) {
    var root = document.getElementById('tr-root');
    if (!root || !timeline || !timeline.targets) return;
    var dates = Object.keys(timeline.targets).length ? countDatesList(timeline).sort() : [];

    var byCategory = {};
    (registry.services || []).concat((community && community.services) || []).forEach(function (s) {
      if (!timeline.targets[s.id]) return;
      (byCategory[s.category] = byCategory[s.category] || []).push({ svc: s, points: timeline.targets[s.id] });
    });

    var n = 0;
    Object.keys(CATEGORY_LABELS).forEach(function (cat, idx) {
      var list = byCategory[cat];
      if (!list || !list.length) return;
      var band = el('section', null, 'tr-cat' + (idx % 2 ? ' tr-cat--alt' : ''));
      band.appendChild(el('h2', CATEGORY_LABELS[cat], 'tr-cat__label'));
      var grid = el('div', null, 'tr-rows');
      list.forEach(function (entry) {
        var row = el('div', null, 'tr-row');
        var name = el('span', null, 'tr-row__name');
        name.appendChild(document.createTextNode(entry.svc.name));
        if (entry.svc.tier === 'community') name.appendChild(el('span', 'community', 'dep-card--badge'));
        row.appendChild(name);
        row.appendChild(stripe(entry.points, dates));
        row.appendChild(sparkline(entry.points));
        row.setAttribute('data-sid', entry.svc.id);
        grid.appendChild(row);
        n++;
      });
      band.appendChild(grid);
      root.appendChild(band);
    });
  }

  function countDatesList(timeline) {
    var seen = {};
    Object.keys(timeline.targets).forEach(function (id) {
      timeline.targets[id].forEach(function (p) { seen[p.d] = 1; });
    });
    return Object.keys(seen);
  }

  function boot() {
    Promise.all([
      fetchJson('/results/timeline.json'),
      fetchJson('/probe/targets.json'),
      fetchJson('/probe/targets-community.json')
    ]).then(function (r) {
      if (!r[0]) return;
      summary(r[0]);
      render(r[0], r[1] || { services: [] }, r[2] || { services: [] });
    });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
