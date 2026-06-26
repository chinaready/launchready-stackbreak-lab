// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Beijing View — renders the recorded Beijing snapshot (results/latest.json) so every
// visitor, anywhere, sees what a browser in Beijing sees. Cards are built purely from
// recorded data; nothing here depends on the visitor reaching the third-party hosts.
(function () {
  var CATEGORY_LABELS = {
    fonts: 'Fonts and icons', auth: 'Auth and identity',
    analytics: 'Analytics and tags', embeds: 'Maps, media, embeds'
  };
  var CATEGORY_ORDER = ['fonts', 'auth', 'analytics', 'embeds'];
  var VERDICT_ORDER = ['Blocked', 'Degraded', 'Reachable'];

  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text != null) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function verdictChip(v) { return el('span', v, 'verdict ' + v); }

  function fmtTime(iso) {
    try { return new Date(iso).toISOString().replace('T', ' ').replace(/\..*/, ' UTC'); }
    catch (e) { return iso || 'unknown'; }
  }
  function fmtSec(n) { n = Number(n) || 0; return (n.toFixed(2).replace(/\.?0+$/, '') || '0'); }

  function renderHeartbeat(data) {
    var env = data.environment || {};
    var services = data.services || [];
    var counts = { Blocked: 0, Degraded: 0, Reachable: 0 };
    services.forEach(function (s) { counts[s.verdict] = (counts[s.verdict] || 0) + 1; });

    var strip = document.getElementById('bv-heartbeat');
    if (!strip) return;
    clear(strip);

    var node = el('span', null, 'bv-hb__node');
    node.appendChild(el('span', null, 'live-dot'));
    node.appendChild(document.createTextNode(
      ' Beijing node (' + (env.cloudRegion || 'unknown') + ') · as of ' + fmtTime(data.generatedAt)));
    strip.appendChild(node);

    var right = el('span', null, 'bv-hb__counts');
    VERDICT_ORDER.forEach(function (v) {
      if (!counts[v]) return;
      var item = el('span', null, 'bv-hb__count');
      item.appendChild(el('span', String(counts[v]), 'bv-hb__num'));
      item.appendChild(verdictChip(v));
      right.appendChild(item);
    });
    strip.appendChild(right);
  }

  function renderCard(s, b) {
    var card = el('article', null, 'bv-card ' + s.verdict);

    var shot = el('div', null, 'bv-card__shot');
    if (b && b.screenshotPath) {
      var img = el('img');
      img.src = b.screenshotPath;
      img.alt = 'What Beijing sees: ' + s.name;
      img.loading = 'lazy';
      shot.appendChild(img);
    } else {
      shot.appendChild(el('div', 'screenshot pending', 'bv-card__shot-missing'));
    }
    card.appendChild(shot);

    var ev = el('div', null, 'bv-card__evidence');
    var head = el('div', null, 'bv-card__head');
    head.appendChild(el('h3', s.name));
    head.appendChild(verdictChip(s.verdict));
    ev.appendChild(head);
    ev.appendChild(el('p', s.domain, 'bv-card__host'));

    var dl = el('dl', null, 'bv-card__metrics');
    function row(k, v) { dl.appendChild(el('dt', k)); dl.appendChild(el('dd', v)); }
    row('HTTP', s.httpCode || '—');
    row('Total', fmtSec(s.totalSec) + 's' + (Number(s.curlExit) === 28 ? ' (timeout)' : ''));
    row('Requests arrived', s.verdict === 'Blocked' ? '0' : 'ok');
    row('DNS', s.dnsResolved ? 'resolved' : 'no');
    ev.appendChild(dl);

    if (s.symptom) ev.appendChild(el('p', s.symptom, 'bv-card__symptom'));
    var btn = el('button', 'Compare with my browser', 'bv-card__compare');
    btn.type = 'button';
    btn.addEventListener('click', function () { toggleCompare(card, s, btn); });
    ev.appendChild(btn);
    card.appendChild(ev);
    return card;
  }

  // Loads the third-party resource live in the visitor's browser. Returns the node it
  // injects into document.head (the <link> or <script>) so the caller can remove it on
  // toggle-off; returns null for the iframe path since that lives inside `box`.
  function loadLive(s, box) {
    var done = false, TIMEOUT = 8000, timer = null;
    function settle(ok) {
      if (done) return; done = true;
      if (timer) { clearTimeout(timer); timer = null; }
      clear(box);
      box.appendChild(el('span', ok ? '\u2713 loaded in YOUR browser' : '\u2717 failed in YOUR browser',
        ok ? 'bv-live-ok' : 'bv-live-fail'));
    }
    clear(box);
    box.appendChild(el('span', 'loading\u2026', 'bv-live-pending'));

    var injected = null;
    var isFrame = s.category === 'embeds';
    var isStyle = s.category === 'fonts' || /\.css(\?|$)/.test(s.url || '');
    if (isFrame) {
      var ifr = document.createElement('iframe');
      ifr.src = s.url; ifr.title = 'live ' + s.name;
      ifr.style.cssText = 'width:100%;height:120px;border:0;background:#000';
      ifr.onload = function () { settle(true); };
      ifr.onerror = function () { settle(false); };
      clear(box); box.appendChild(ifr);
    } else if (isStyle) {
      var link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = s.url;
      link.onload = function () { settle(true); };
      link.onerror = function () { settle(false); };
      document.head.appendChild(link);
      injected = link;
    } else {
      var sc = document.createElement('script');
      sc.src = s.url; sc.async = true;
      sc.onload = function () { settle(true); };
      sc.onerror = function () { settle(false); };
      document.head.appendChild(sc);
      injected = sc;
    }
    timer = setTimeout(function () { settle(false); }, TIMEOUT);
    return injected;
  }

  function toggleCompare(card, s, btn) {
    var open = card.querySelector('.bv-card__live');
    if (open) {
      if (open._injected && open._injected.parentNode) open._injected.parentNode.removeChild(open._injected);
      open._injected = null;
      open.parentNode.removeChild(open);
      btn.textContent = 'Compare with my browser';
      return;
    }
    btn.textContent = 'Hide my-browser comparison';
    var live = el('div', null, 'bv-card__live');
    live.appendChild(el('p', 'Your browser, loading ' + s.domain + ' live:', 'bv-card__live-label'));
    var box = el('div', null, 'bv-card__live-box');
    live.appendChild(box);
    card.appendChild(live);
    live._injected = loadLive(s, box);
  }

  function render(data) {
    renderHeartbeat(data);
    var services = data.services || [];
    var browserById = {};
    (data.browser || []).forEach(function (b) { browserById[b.id] = b; });

    var byCat = {};
    services.forEach(function (s) { (byCat[s.category] = byCat[s.category] || []).push(s); });

    var root = document.getElementById('bv-gallery');
    if (!root) return;
    clear(root);

    CATEGORY_ORDER.forEach(function (cat) {
      var list = byCat[cat];
      if (!list || !list.length) return;
      var section = el('section', null, 'bv-cat');
      var h = el('h2', CATEGORY_LABELS[cat] || cat, 'bv-cat__label');
      h.appendChild(el('small', ' ' + list.length + (list.length > 1 ? ' dependencies' : ' dependency')));
      section.appendChild(h);
      var grid = el('div', null, 'bv-grid');
      list.forEach(function (s) { grid.appendChild(renderCard(s, browserById[s.id])); });
      section.appendChild(grid);
      root.appendChild(section);
    });
  }

  function fail(msg) {
    var root = document.getElementById('bv-gallery');
    if (root) { clear(root); root.appendChild(el('p', 'Could not load the Beijing snapshot: ' + msg)); }
  }

  function boot() {
    fetch('/results/latest.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(render)
      .catch(function (e) { fail(e.message); });
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
