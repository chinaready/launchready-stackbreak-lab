// Stack Break Lab — shared demo behavior.
// Each demo page loads exactly one third-party dependency and reports whether it arrived.
// The status pill is a best-effort human signal; the authoritative evidence is the network
// capture done by Playwright and the curl/dig probe.

(function () {
  var TIMEOUT_MS = 8000;
  var settled = false;

  function $(sel) { return document.querySelector(sel); }

  function fill(name, value) {
    var nodes = document.querySelectorAll('[data-fill="' + name + '"]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = value;
  }

  var Status = {
    set: function (state, note) {
      if (settled && state !== 'failed') return;
      var el = $('#status');
      if (!el) return;
      settled = state === 'loaded' || state === 'failed';
      el.setAttribute('data-state', state);
      var labels = {
        checking: 'Checking reachability...',
        loaded: 'Dependency loaded',
        failed: 'Dependency failed to load'
      };
      el.textContent = (labels[state] || state) + (note ? ' — ' + note : '');
    }
  };
  window.LabStatus = Status;

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.body;
    fill('service', b.getAttribute('data-service') || 'this dependency');
    fill('domain', b.getAttribute('data-domain') || '');
    fill('symptom', b.getAttribute('data-symptom') || '');

    Status.set('checking');

    setTimeout(function () {
      if (!settled) {
        Status.set('failed', 'timed out after ' + (TIMEOUT_MS / 1000) + 's');
      }
    }, TIMEOUT_MS);
  });
})();
