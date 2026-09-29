/* colour theme: Auto (follow the system) -> Dark -> Light */
(function () {
  var KEY = 'upsc.iss.theme';
  var ORDER = ['auto', 'dark', 'light'];
  var ICON = { auto: '◐', dark: '☾', light: '☀' };
  var NAME = { auto: 'Auto', dark: 'Dark', light: 'Light' };
  var btn = document.getElementById('themeBtn');
  var mode = 'auto';
  try { mode = localStorage.getItem(KEY) || 'auto'; } catch (e) {}
  if (ORDER.indexOf(mode) < 0) mode = 'auto';
  function apply() {
    var root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    if (!btn) return;
    btn.innerHTML = '<span aria-hidden="true">' + ICON[mode] + '</span><span class="tlabel"> ' + NAME[mode] + '</span>';
    btn.title = 'Colour theme: ' + NAME[mode] + ' (click to change)';
    btn.setAttribute('aria-label', 'Colour theme: ' + NAME[mode]);
  }
  apply();
  if (btn) btn.addEventListener('click', function () {
    mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    apply();
  });
})();
