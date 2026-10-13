/* Comportamiento compartido con el portfolio: scroll suave (Lenis) y cursor propio. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Scroll suave, igual que el home ── */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis();
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72 });
      });
    });
  }

  /* ── Estado de la nav al scrollear, igual que el home ── */
  var nav = document.querySelector('nav');
  if (nav) {
    var onScroll = function () {
      nav.style.background = window.scrollY > 60
        ? 'rgba(10,10,10,0.97)'
        : 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Cursor propio (solo mouse), idéntico al del home ── */
  var cursor = document.getElementById('cursor');
  var ring = document.getElementById('cursorRing');
  if (!cursor || !ring || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', function (e) {
    document.documentElement.classList.add('has-mouse');
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  });
  (function animateRing() {
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
  })();
  document.querySelectorAll('a, button, summary, input').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      cursor.style.width = '6px'; cursor.style.height = '6px';
      ring.style.width = '52px'; ring.style.height = '52px';
    });
    el.addEventListener('mouseleave', function () {
      cursor.style.width = ''; cursor.style.height = '';
      ring.style.width = ''; ring.style.height = '';
    });
  });
})();
