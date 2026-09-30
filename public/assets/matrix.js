// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Matrix overview: rows = SaaS vendors, columns = stack categories + whole-stack kits.
// Renders from the registries + latest evidence; degrades to a visible fallback notice.
(function () {
  var CATEGORY_LABELS = { fonts: 'Fonts & icons', auth: 'Auth & identity',
    analytics: 'Analytics & tags', embeds: 'Maps, media, embeds', payments: 'Payments' };
  var CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

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

  function chip(href, item, verdict, community) {
    var a = el('a', null, 'mx-chip verdict ' + (verdict || 'Reachable'));
    if (community) a.classList.add('mx-chip--community');
    a.setAttribute('data-sid', item.id);
    a.href = href;
    a.appendChild(el('span', item.name, 'mx-chip__name'));
    a.appendChild(el('span', verdict ? verdict : '—', 'mx-chip__v'));
    return a;
  }

  function render(registry, community, latest, platformProbes) {
    var table = document.getElementById('mx-table');
    if (!table) return;
    var byId = {};
    ((latest && latest.services) || []).forEach(function (s) { byId[s.id] = s; });

    var services = ((registry && registry.services) || []).concat((community && community.services) || []);
    var platforms = (registry && registry.platforms) || [];
    var vendors = (registry && registry.meta && registry.meta.vendors) || {};

    var rows = {};
    services.forEach(function (s) {
      var r = rows[s.vendor] = rows[s.vendor] || {};
      (r[s.category] = r[s.category] || []).push({
        svc: s, verdict: byId[s.id] && byId[s.id].verdict,
        href: s.tier === 'community' ? '/public/results/' : (s.demoPath || '/public/results/')
      });
    });

    var thead = table.tHead;
    thead.appendChild(el('tr'));
    thead.rows[0].appendChild(el('th', 'SaaS', 'mx-th mx-th--first'));
    CATEGORY_ORDER.forEach(function (c) { thead.rows[0].appendChild(el('th', CATEGORY_LABELS[c], 'mx-th')); });
    thead.rows[0].appendChild(el('th', 'Whole-stack kits', 'mx-th'));

    var tbody = table.tBodies[0];
    var rowKeys = Object.keys(rows).concat(
      platforms.map(function (p) { return p.vendor; }).filter(function (v) { return !rows[v]; })
    ).filter(function (v, i, arr) { return arr.indexOf(v) === i; });

    rowKeys.forEach(function (v) {
      if (!vendors[v]) return;
      var cells = rows[v] || {}; // platform-only vendors have no service cells
      var tr = el('tr');
      tr.setAttribute('data-vendor', v);
      tr.appendChild(el('th', vendors[v].name, 'mx-rowhead'));
      CATEGORY_ORDER.forEach(function (c) {
        var td = el('td');
        td.setAttribute('data-cat', c);
        (cells[c] || []).forEach(function (e) {
          td.appendChild(chip(e.href, e.svc, e.verdict, e.svc.tier === 'community'));
        });
        if (!td.firstChild) td.appendChild(el('span', '—', 'mx-none'));
        tr.appendChild(td);
      });
      var tdw = el('td');
      tdw.setAttribute('data-cat', 'whole');
      platforms.filter(function (p) { return p.vendor === v; }).forEach(function (p) {
        var probes = platformProbes[p.id] || [];
        var blocked = probes.filter(function (x) { return x.verdict === 'Blocked'; }).length;
        var verdict = probes.length === 0 ? null
          : (blocked === probes.length ? 'Blocked' : (blocked > 0 ? 'Degraded' : 'Reachable'));
        tdw.appendChild(chip(p.resultsPath, p, verdict, false));
      });
      if (!tdw.firstChild) tdw.appendChild(el('span', '—', 'mx-none'));
      tr.appendChild(tdw);
      tbody.appendChild(tr);
    });
  }

  function boot() {
    var notice = document.getElementById('mx-noscript');
    if (notice) notice.hidden = true;
    Promise.all([
      fetchJson('/probe/targets.json'),
      fetchJson('/probe/targets-community.json'),
      fetchJson('/results/latest.json'),
      fetchJson('/results/firebase-latest.json'),
      fetchJson('/results/netlify-latest.json'),
      fetchJson('/results/vercel-latest.json')
    ]).then(function (r) {
      render(r[0], r[1], r[2], {
        firebase: (r[3] && r[3].probes) || [],
        netlify: (r[4] && r[4].probes) || [],
        vercel: (r[5] && r[5].probes) || []
      });
    });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
