/* ── LOADER ── */
const loader = document.getElementById('loader');
const loaderPct = document.getElementById('loaderPct');
let pct = 0;

function tickLoader() {
  const r = Math.random();
  let delta, delay;
  if (r < 0.07) {
    delta = -(Math.floor(Math.random() * 6) + 2);
    delay = Math.floor(Math.random() * 150) + 80;
  } else if (r < 0.22) {
    delta = 0;
    delay = Math.floor(Math.random() * 700) + 350;
  } else if (r < 0.38) {
    delta = Math.floor(Math.random() * 9) + 6;
    delay = Math.floor(Math.random() * 50) + 20;
  } else {
    delta = Math.floor(Math.random() * 3) + 1;
    delay = Math.floor(Math.random() * 220) + 100;
  }
  pct = Math.max(0, Math.min(99, pct + delta));
  loaderPct.textContent = String(pct).padStart(3, '0');
  setTimeout(tickLoader, delay);
}

const MIN_LOADER_MS = 2000;
const loaderStart = Date.now();

// No esperar a 'load': los iframes de los casos son sitios enteros y lo
// demoran. El script va al final del body, así que el DOM ya está listo.
function finishLoader() {
  const elapsed = Date.now() - loaderStart;
  const wait = Math.max(0, MIN_LOADER_MS - elapsed);
  setTimeout(() => {
    pct = 100;
    loaderPct.textContent = '100';
    setTimeout(() => loader.classList.add('hidden'), 400);
  }, wait);
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(finishLoader);
} else {
  finishLoader();
}

tickLoader();

function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '18px';
      cursor.style.height = '18px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '10px';
      cursor.style.height = '10px';
    });
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.caso-card').forEach((card, i) => {
    card.style.transitionDelay = `${(i % 3) * 70}ms`;
    observer.observe(card);
  });
}

initCursor();
initScrollReveal();

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
