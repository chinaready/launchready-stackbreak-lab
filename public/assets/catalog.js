// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Stack Break Lab — dual-dimension catalog. "By category" is the static baseline
// (untouched HTML); "By service" is rendered here from the registries. Community
// targets appear under their vendor with a badge and in a Community picks block
// appended to the category panel. Degrades to the static page on any fetch failure.
(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

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
    a.className = 'dep-card' + (svc.tier === 'community' ? ' dep-card--community' : '');
    a.setAttribute('data-sid', svc.id);
    a.href = svc.tier === 'community' ? '/public/results/' : (svc.demoPath || '/public/results/');
    a.appendChild(el('span', svc.name, 'dep-card__name'));
    a.appendChild(el('span', svc.domain, 'dep-card__host'));
    var foot = el('span', null, 'dep-card__foot');
    if (svc.tier === 'community') foot.appendChild(el('span', 'community', 'dep-card--badge'));
    foot.appendChild(verdictChip(verdict || 'Reachable', verdict ? null : 'awaiting run', !verdict));
    a.appendChild(foot);
    return a;
  }

  function platformCard(p, probes) {
    var total = (probes || []).length;
    var blocked = (probes || []).filter(function (x) { return x.verdict === 'Blocked'; }).length;
    var verdict = total === 0 ? null : (blocked === total ? 'Blocked' : (blocked > 0 ? 'Degraded' : 'Reachable'));
    var a = document.createElement('a');
    a.className = 'dep-card dep-card--platform';
    a.setAttribute('data-sid', p.id);
    a.href = p.resultsPath;
    a.appendChild(el('span', p.name, 'dep-card__name'));
    a.appendChild(el('span', 'whole-stack kit', 'dep-card__host'));
    var foot = el('span', null, 'dep-card__foot');
    foot.appendChild(verdictChip(verdict || 'Reachable', total ? blocked + ' / ' + total + ' blocked' : 'awaiting run', !total));
    a.appendChild(foot);
    return a;
  }

  function vendorBlock(vendorKey, vendorMeta, cards) {
    var block = el('section', null, 'cat-block');
    block.setAttribute('data-vendor-block', vendorKey);
    var label = el('h3', null, 'cat-block__label');
    label.appendChild(document.createTextNode(vendorMeta.name + ' '));
    label.appendChild(el('small', cards.length + (cards.length === 1 ? ' target' : ' targets'), null));
    block.appendChild(label);
    var grid = el('div', null, 'dep-grid');
    cards.forEach(function (c) { grid.appendChild(c); });
    block.appendChild(grid);
    return block;
  }

  function render(registry, community, latest, platformProbes) {
    var panel = $('#panel-service');
    var catPanel = $('#panel-category');
    if (!panel) return;

    var byId = {};
    ((latest && latest.services) || []).forEach(function (s) { byId[s.id] = s; });

    var services = ((registry && registry.services) || []).concat((community && community.services) || []);
    var vendors = (registry && registry.meta && registry.meta.vendors) || {};
    var platforms = (registry && registry.platforms) || [];

    var byVendor = {};
    services.forEach(function (s) {
      (byVendor[s.vendor] = byVendor[s.vendor] || []).push(serviceCard(s, byId[s.id] && byId[s.id].verdict));
    });
    platforms.forEach(function (p) {
      (byVendor[p.vendor] = byVendor[p.vendor] || []).push(platformCard(p, platformProbes[p.id]));
    });

    clear(panel);
    Object.keys(byVendor).forEach(function (key) {
      if (!vendors[key]) return; // undeclared vendor: validator's job to catch upstream
      panel.appendChild(vendorBlock(key, vendors[key], byVendor[key]));
    });

    // Community picks block appended to the static category panel.
    var communitySvcs = ((community && community.services) || []);
    if (communitySvcs.length && catPanel && !$('#community-picks')) {
      var picks = el('section', null, 'cat-block');
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
  }

  function initTabs() {
    var buttons = $all('[data-catalog-tab]');
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          var active = b === btn;
          b.setAttribute('aria-selected', active ? 'true' : 'false');
          b.classList.toggle('is-active', active);
          var panel = document.getElementById('panel-' + b.getAttribute('data-catalog-tab'));
          if (panel) panel.hidden = !active;
        });
      });
    });
    var active = $('[data-catalog-tab].is-active') || buttons[0];
    if (active) active.classList.add('is-active');
  }

  function boot() {
    initTabs();
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
