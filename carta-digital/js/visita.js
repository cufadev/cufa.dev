/* Si el link trae ?l=<local> (lo mandamos en la propuesta), avisa una sola vez por sesión. */
(function () {
  var l = new URLSearchParams(location.search).get('l');
  if (!l || !/^[a-z0-9-]{2,40}$/.test(l)) return;
  try {
    if (sessionStorage.getItem('visita:' + l)) return;
    sessionStorage.setItem('visita:' + l, '1');
  } catch (e) { /* sin sessionStorage: avisa igual */ }
  fetch('/api/visita?l=' + encodeURIComponent(l), { method: 'POST', keepalive: true }).catch(function () {});
})();
