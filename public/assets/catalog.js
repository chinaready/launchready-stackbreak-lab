// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Stack Break Lab — Stack page catalog enhancement. The curated category blocks
// are static HTML (no-JS baseline); this script appends the "Community picks"
// block from the community registry with live verdicts. Degrades silently.
(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function el(tag, text, className) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (className) n.className = className;
    return n;
  }

  function verdictChip(verdict, label, pending) {
    var span = document.createElement('span');
    span.className = 'verdict ' + verdict + (pending ? ' is-pending' : '');
    span.textContent = label || verdict;
    return span;
  }

  function serviceCard(svc, verdict) {
    var a = document.createElement('a');
    a.className = 'dep-card dep-card--community';
    a.setAttribute('data-sid', svc.id);
    a.href = '/public/results/';
    a.appendChild(el('span', svc.name, 'dep-card__name'));
    a.appendChild(el('span', svc.domain, 'dep-card__host'));
    var foot = el('span', null, 'dep-card__foot');
    foot.appendChild(el('span', 'community', 'dep-card--badge'));
    foot.appendChild(verdictChip(verdict || 'Reachable', verdict ? null : 'awaiting run', !verdict));
    a.appendChild(foot);
    return a;
  }

  function render(community, latest) {
    var catPanel = $('#catalog .home-wrap');
    var communitySvcs = (community && community.services) || [];
    if (!catPanel || !communitySvcs.length || $('#community-picks')) return;

    var byId = {};
    ((latest && latest.services) || []).forEach(function (s) { byId[s.id] = s; });

    var picks = el('section', null, 'cat-block reveal in');
    picks.id = 'community-picks';
    var label = el('h3', null, 'cat-block__label');
    label.appendChild(document.createTextNode('Community picks '));
    label.appendChild(el('small', communitySvcs.length + ' network-probe targets', null));
    picks.appendChild(label);
    var grid = el('div', null, 'dep-grid');
    communitySvcs.forEach(function (s) {
      grid.appendChild(serviceCard(s, byId[s.id] && byId[s.id].verdict));
    });
    picks.appendChild(grid);
    catPanel.appendChild(picks);
  }

  function boot() {
    Promise.all([
      fetchJson('/probe/targets-community.json'),
      fetchJson('/results/latest.json')
    ]).then(function (r) { render(r[0], r[1]); });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
