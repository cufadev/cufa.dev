/* Transición entre páginas: reutiliza la pantalla del preload (fondo oscuro, CUFA. con glitch, barra y contador).
   Al salir se funde hacia esa pantalla; la página nueva arranca tapada por ella y la deja ir al estar lista.
   Va en <head> (bloqueante, mínima) para que no haya parpadeo. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var KEY = 'cufa_trans';
  var DUR = 450;
  var root = document.documentElement;
  var arriving = false;
  try { arriving = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (arriving) root.classList.add('pt-pre');

  var style = document.createElement('style');
  style.textContent =
    'html.pt-pre::before{content:"";position:fixed;inset:0;z-index:20000;background:#0a0a0a}' +
    '#pt{position:fixed;inset:0;z-index:20001;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'gap:2rem;opacity:0;visibility:hidden;pointer-events:none;transition:opacity ' + DUR + 'ms ease,visibility ' + DUR + 'ms ease}' +
    '#pt .pt-logo{font-family:"Bebas Neue",Impact,sans-serif;font-size:6rem;line-height:1;color:#ff4d00;letter-spacing:.05em}' +
    '#pt .pt-bar{width:200px;height:1px;background:rgba(255,255,255,.08);position:relative;overflow:hidden}' +
    '#pt .pt-fill{position:absolute;top:0;left:-100%;width:100%;height:100%;background:#ff4d00;animation:ptbar 2.5s linear forwards}' +
    '@keyframes ptbar{0%{left:-100%}12%{left:-78%}44%{left:-52%}64%{left:-28%}82%{left:-12%}100%{left:0}}' +
    '#pt .pt-pct{font-family:"Space Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.2em;color:#8a8a8a}' +
    '@media(max-width:600px){#pt .pt-logo{font-size:4.5rem}}' +
    '#pt.on{opacity:1;visibility:visible}' +
    '#pt.now{transition:none}' +
    'html.pt-lock,html.pt-lock body{overflow:hidden}';
  document.head.appendChild(style);

  var pt, num, bar, timer;

  function crear() {
    pt = document.createElement('div');
    pt.id = 'pt';
    pt.setAttribute('aria-hidden', 'true');
    pt.innerHTML = '<div class="pt-logo">CUFA.</div>' +
      '<div class="pt-bar"><div class="pt-fill"></div></div>' +
      '<div class="pt-pct">000</div>';
    document.body.appendChild(pt);
    num = pt.querySelector('.pt-pct');
    bar = pt.querySelector('.pt-fill');
    return pt;
  }

  function contar(hasta, ms) {
    clearInterval(timer);
    var ini = parseInt(num.textContent, 10) || 0, t0 = Date.now();
    timer = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms);
      var v = Math.round(ini + (hasta - ini) * k);
      num.textContent = String(v).padStart(3, '0');
      if (k >= 1) clearInterval(timer);
    }, 30);
  }

  function iniciar() {
    crear();
    if (!arriving) return;
    pt.className = 'now on';
    root.classList.add('pt-lock');
    root.classList.remove('pt-pre');
    num.textContent = '068';
    bar.style.animation = 'none';
    bar.style.left = '-28%';
    // un respiro para que la página nueva pinte y se acomode el #ancla
    setTimeout(function () {
      contar(100, 220);
      bar.style.transition = 'left 220ms linear';
      bar.style.left = '0';
      setTimeout(function () {
        pt.className = '';
        root.classList.remove('pt-lock');
      }, 260);
    }, 180);
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);

  // Botón "atrás" (bfcache): la página vuelve sin pantalla encima
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && pt) { pt.className = ''; root.classList.remove('pt-lock', 'pt-pre'); clearInterval(timer); }
  });

  // Salida: interceptar links internos a otras páginas del sitio
  var saliendo = false;
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || saliendo || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    var norm = function (p) { return p.replace(/\/index\.html$/, '/'); };
    if (norm(url.pathname) === norm(location.pathname)) return; // solo cambia el #ancla
    if (/\.(pdf|vcf|zip|png|jpe?g|webp|svg|txt|xml)$/i.test(url.pathname)) return;
    e.preventDefault();
    saliendo = true;
    if (!pt) crear();
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    root.classList.add('pt-lock');
    pt.className = 'on';
    num.textContent = '000';
    contar(68, DUR + 60);
    setTimeout(function () { location.href = url.href; }, DUR + 80);
  });
})();
