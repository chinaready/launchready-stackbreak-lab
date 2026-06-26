// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Stack Break Lab — landing page behavior. Pulls the real, latest snapshot from
// /results/ so the hero counters, the per-dependency cards, and the status ticker
// reflect live evidence. Everything degrades gracefully if the JSON is missing,
// and all motion respects prefers-reduced-motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  // --- Scroll-reveal -------------------------------------------------------
  function initReveal() {
    var items = $all('.reveal');
    if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  // --- Count-up ------------------------------------------------------------
  function animateCount(el, to) {
    if (!el) return;
    if (reduce || to <= 0) { el.textContent = String(to); return; }
    var dur = 1100, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function verdictChip(verdict, label, pending) {
    var span = document.createElement('span');
    span.className = 'verdict ' + verdict + (pending ? ' is-pending' : '');
    span.textContent = label || verdict;
    return span;
  }

  // --- Live data -----------------------------------------------------------
  function applyServices(data) {
    var services = (data && data.services) || [];
    var counts = { Blocked: 0, Degraded: 0, Reachable: 0 };
    var byId = {};
    services.forEach(function (s) {
      counts[s.verdict] = (counts[s.verdict] || 0) + 1;
      byId[s.id] = s;
    });

    var total = services.length;
    var setNum = function (key, val, accent) {
      var el = document.querySelector('[data-count="' + key + '"]');
      if (!el) return;
      if (accent) el.classList.add('is-accent');
      animateCount(el, val);
    };
    if (total) {
      setNum('total', total);
      setNum('blocked', counts.Blocked, true);
      setNum('reachable', counts.Reachable);
    } else {
      $all('.stat__num').forEach(function (el) { el.textContent = '—'; });
    }

    // Annotate each dependency card with its live verdict.
    $all('.dep-card[data-sid]').forEach(function (card) {
      var foot = $('.dep-card__foot', card);
      if (!foot) return;
      var s = byId[card.getAttribute('data-sid')];
      clear(foot);
      foot.appendChild(s ? verdictChip(s.verdict) : verdictChip('Reachable', 'awaiting run', true));
    });

    return services.map(function (s) { return { name: s.name, verdict: s.verdict }; });
  }

  function applyFirebase(data) {
    var probes = (data && data.probes) || [];
    var byPath = {};
    probes.forEach(function (p) {
      var g = byPath[p.path] = byPath[p.path] || { total: 0, blocked: 0 };
      g.total += 1;
      if (p.verdict === 'Blocked') g.blocked += 1;
    });

    $all('.dep-card[data-fbpath]').forEach(function (card) {
      var foot = $('.dep-card__foot', card);
      var g = byPath[card.getAttribute('data-fbpath')];
      if (!foot || !g) return;
      var verdict = g.blocked === g.total ? 'Blocked' : (g.blocked > 0 ? 'Degraded' : 'Reachable');
      clear(foot);
      foot.appendChild(verdictChip(verdict, g.blocked + ' / ' + g.total + ' blocked'));
    });

    var blocked = probes.filter(function (p) { return p.verdict === 'Blocked'; }).length;
    animateCount(document.querySelector('[data-count="fb-blocked"]'), blocked);
    animateCount(document.querySelector('[data-count="fb-total"]'), probes.length);

    return probes.map(function (p) { return { name: p.product, verdict: p.verdict }; });
  }

  function applyNetlify(data) {
    var probes = (data && data.probes) || [];
    var byPath = {};
    probes.forEach(function (p) {
      var g = byPath[p.path] = byPath[p.path] || { total: 0, blocked: 0 };
      g.total += 1;
      if (p.verdict === 'Blocked') g.blocked += 1;
    });

    $all('.dep-card[data-nlpath]').forEach(function (card) {
      var foot = $('.dep-card__foot', card);
      var g = byPath[card.getAttribute('data-nlpath')];
      if (!foot || !g) return;
      var verdict = g.blocked === g.total ? 'Blocked' : (g.blocked > 0 ? 'Degraded' : 'Reachable');
      clear(foot);
      foot.appendChild(verdictChip(verdict, g.blocked + ' / ' + g.total + ' blocked'));
    });

    var blocked = probes.filter(function (p) { return p.verdict === 'Blocked'; }).length;
    animateCount(document.querySelector('[data-count="nl-blocked"]'), blocked);
    animateCount(document.querySelector('[data-count="nl-total"]'), probes.length);

    return probes.map(function (p) { return { name: p.product, verdict: p.verdict }; });
  }

  function setText(key, value) {
    var el = document.querySelector('[data-count-text="' + key + '"]');
    if (el) el.textContent = value;
  }

  function applyNetlifyLatency(data) {
    var resources = (data && data.resources) || [];
    if (!resources.length) return [];

    var edge = (data && data.edge) || {};
    setText('nlres-region', edge.serverRegion || 'unknown');
    animateCount(document.querySelector('[data-count="nlres-total"]'), resources.length);

    var worst = resources.reduce(function (m, r) { return Math.max(m, Number(r.totalSec) || 0); }, 0);
    setText('nlres-worst', worst.toFixed(2) + 's');

    var byKind = {};
    resources.forEach(function (r) {
      var g = byKind[r.kind] = byKind[r.kind] || { worst: 0, blocked: 0, degraded: 0, total: 0 };
      g.total += 1;
      g.worst = Math.max(g.worst, Number(r.totalSec) || 0);
      if (r.verdict === 'Blocked') g.blocked += 1;
      else if (r.verdict === 'Degraded') g.degraded += 1;
    });

    $all('.dep-card[data-nlrkind]').forEach(function (card) {
      var foot = $('.dep-card__foot', card);
      var g = byKind[card.getAttribute('data-nlrkind')];
      if (!foot || !g) return;
      var verdict = g.blocked === g.total ? 'Blocked' : (g.blocked || g.degraded ? 'Degraded' : 'Reachable');
      clear(foot);
      foot.appendChild(verdictChip(verdict, g.worst.toFixed(2) + 's \u00b7 ' + g.total));
    });

    return resources.map(function (r) { return { name: 'Netlify ' + r.name, verdict: r.verdict }; });
  }

  // --- Status ticker -------------------------------------------------------
  function tickerItem(row) {
    var item = document.createElement('span');
    item.className = 'ticker__item';
    var dot = document.createElement('span');
    dot.className = 'ticker__dot ' + row.verdict;
    item.appendChild(dot);
    item.appendChild(document.createTextNode(row.name + ' \u00b7 ' + row.verdict));
    return item;
  }

  function buildTicker(rows) {
    var track = $('.ticker__track');
    if (!track || !rows.length) {
      var ticker = $('.ticker');
      if (ticker) ticker.hidden = true;
      return;
    }
    var seen = {}, items = [];
    rows.forEach(function (r) {
      if (!r.name || seen[r.name]) return;
      seen[r.name] = 1; items.push(r);
    });
    clear(track);
    // Two copies for a seamless marquee loop.
    [0, 1].forEach(function () {
      items.forEach(function (r) { track.appendChild(tickerItem(r)); });
    });
  }

  // --- Boot ----------------------------------------------------------------
  function boot() {
    initReveal();

    var rows = [];
    var jobs = [];

    jobs.push(fetch('/results/latest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) rows = rows.concat(applyServices(d)); })
      .catch(function () {}));

    jobs.push(fetch('/results/firebase-latest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) rows = rows.concat(applyFirebase(d)); })
      .catch(function () {}));

    jobs.push(fetch('/results/netlify-latest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) rows = rows.concat(applyNetlify(d)); })
      .catch(function () {}));

    jobs.push(fetch('/results/netlify-resources-latest.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) rows = rows.concat(applyNetlifyLatency(d)); })
      .catch(function () {}));

    Promise.all(jobs).then(function () { buildTicker(rows); });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
