// Copyright (c) 2026 Chinaready. All rights reserved.
//
// Renders the Firebase mainland-China probe snapshot (results/firebase-latest.json)
// into the page. Shared by the main results viewer and the dedicated Firebase
// results page so the two never drift. Each connection path is wrapped in a
// <section id="frontend|backend|transport"> so cards elsewhere can deep-link to it.
//
// Expected DOM (any subset; missing nodes are skipped):
//   #firebase        optional wrapper, unhidden once a snapshot renders
//   #firebase-env    optional <dl> for environment provenance
//   #firebase-root   required container the path sections are appended to
(function () {
  var PATHS = [
    ['frontend', 'Frontend — browser / client SDK'],
    ['backend', 'Backend — Admin SDK on a server'],
    ['transport', 'Transport — raw host reachability']
  ];

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

  function renderEnv(data, dl) {
    var env = data.environment || {};
    [
      ['Generated', fmtDate(data.generatedAt)],
      ['Cloud', (env.cloudProvider || 'unknown') + ' / ' + (env.cloudRegion || 'unknown')],
      ['Host', env.runnerHost || 'unknown']
    ].forEach(function (r) {
      dl.appendChild(el('dt', r[0]));
      dl.appendChild(el('dd', r[1]));
    });
  }

  function renderGroups(data, root) {
    var probes = data.probes || [];
    var byPath = {};
    probes.forEach(function (p) { (byPath[p.path] = byPath[p.path] || []).push(p); });

    PATHS.forEach(function (pair) {
      var list = byPath[pair[0]];
      if (!list || !list.length) return;
      var section = el('section');
      section.id = pair[0];
      section.appendChild(el('h3', pair[1]));

      var table = el('table'); table.className = 'results';
      var thead = el('thead'); var htr = el('tr');
      ['Product', 'Probe', 'HTTP', 'Total (s)', 'Verdict'].forEach(function (h) {
        htr.appendChild(el('th', h));
      });
      thead.appendChild(htr); table.appendChild(thead);

      var tbody = el('tbody');
      list.forEach(function (p) {
        var tr = el('tr');
        tr.appendChild(el('td', p.product));
        tr.appendChild(el('td', p.name));
        tr.appendChild(el('td', p.httpCode));
        tr.appendChild(el('td', String(p.totalSec)));
        tr.appendChild(el('td', p.verdict, 'verdict ' + p.verdict));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      section.appendChild(table);
      root.appendChild(section);
    });
  }

  function load() {
    var root = document.getElementById('firebase-root');
    if (!root) return;
    var envEl = document.getElementById('firebase-env');
    var section = document.getElementById('firebase');

    fetch('/results/firebase-latest.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        if (!(data.probes || []).length) {
          if (root.dataset.required === 'true') {
            root.appendChild(el('p', 'No Firebase snapshot available yet.'));
          }
          return;
        }
        if (envEl) renderEnv(data, envEl);
        renderGroups(data, root);
        if (section) section.hidden = false;
        // If the page was opened with a #frontend/#backend/#transport hash, the
        // target section only exists now — jump to it once rendered.
        if (location.hash && document.getElementById(location.hash.slice(1))) {
          document.getElementById(location.hash.slice(1)).scrollIntoView();
        }
      })
      .catch(function () {
        if (root.dataset.required === 'true') {
          root.appendChild(el('p', 'Could not load results/firebase-latest.json.'));
        }
      });
  }

  if (document.readyState !== 'loading') load();
  else document.addEventListener('DOMContentLoaded', load);
})();
