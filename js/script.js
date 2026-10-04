/* ── LOADER ── */
const loader = document.getElementById('loader');
const loaderPct = document.getElementById('loaderPct');
let pct = 0;

function tickLoader() {
  const r = Math.random();
  let delta, delay;

  if (r < 0.07) {
    // retroceso brusco
    delta = -(Math.floor(Math.random() * 6) + 2);
    delay = Math.floor(Math.random() * 150) + 80;
  } else if (r < 0.22) {
    // congelado
    delta = 0;
    delay = Math.floor(Math.random() * 700) + 350;
  } else if (r < 0.38) {
    // salto rápido
    delta = Math.floor(Math.random() * 9) + 6;
    delay = Math.floor(Math.random() * 50) + 20;
  } else {
    // avance lento normal
    delta = Math.floor(Math.random() * 3) + 1;
    delay = Math.floor(Math.random() * 220) + 100;
  }

  pct = Math.max(0, Math.min(99, pct + delta));
  loaderPct.textContent = String(pct).padStart(3, '0');
  setTimeout(tickLoader, delay);
}

const MIN_LOADER_MS = 2500;
const loaderStart = Date.now();

window.addEventListener('load', () => {
  const elapsed = Date.now() - loaderStart;
  const wait = Math.max(0, MIN_LOADER_MS - elapsed);
  setTimeout(() => {
    pct = 100;
    loaderPct.textContent = '100';
    setTimeout(() => {
      loader.classList.add('hidden');
      document.querySelector('.hero-content').classList.add('hero-loaded');
    }, 400);
  }, wait);
});

tickLoader();

/* ── PARTICLES ── */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.size = Math.random() * 1.2 + 0.2;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.4 + 0.05;
    this.life = Math.random();
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life += 0.003;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    const pulse = Math.sin(this.life * Math.PI * 2) * 0.5 + 0.5;
    ctx.globalAlpha = this.opacity * pulse;
    ctx.fillStyle = Math.random() > 0.95 ? '#ff4d00' : '#f0ede8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < 80; i++) particles.push(new Particle());

function animParticles() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animParticles);
}
animParticles();

/* ── CURSOR ── */
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '6px'; cursor.style.height = '6px';
    ring.style.width = '52px'; ring.style.height = '52px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '10px'; cursor.style.height = '10px';
    ring.style.width = '36px'; ring.style.height = '36px';
  });
});

/* ── MAGNETIC BUTTONS ── */
document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* ── CLOCK ── */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}
updateClock();
setInterval(updateClock, 1000);

/* ── WEATHER (Open-Meteo + geolocalización por IP) ── */
function updateWeather() {
  const el = document.getElementById('weather');
  if (!el) return;

  const CACHE_KEY = 'cufa_weather_cache';
  const CACHE_MS = 30 * 60 * 1000;
  const FALLBACK = { lat: -34.6, lon: -58.38, city: 'Buenos Aires' };

  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  if (cached && Date.now() - cached.ts < CACHE_MS) {
    el.textContent = cached.text;
    return;
  }

  const fetchWeather = ({ lat, lon, city }) => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`)
      .then(res => res.json())
      .then(data => {
        const temp = Math.round(data.current.temperature_2m);
        const text = `${temp}°C · ${city}`;
        el.textContent = text;
        localStorage.setItem(CACHE_KEY, JSON.stringify({ text, ts: Date.now() }));
      })
      .catch(() => {
        el.textContent = '--°C';
      });
  };

  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(loc => {
      if (loc.latitude && loc.longitude) {
        fetchWeather({ lat: loc.latitude, lon: loc.longitude, city: loc.city || FALLBACK.city });
      } else {
        fetchWeather(FALLBACK);
      }
    })
    .catch(() => fetchWeather(FALLBACK));
}
updateWeather();

/* ── SCROLL REVEAL + COUNTERS ── */
const reveals = document.querySelectorAll('.reveal, .reveal-grid');
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => io.observe(el));

/* ── COUNTER ANIMATION ── */
function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target) + (el.dataset.suffix || '');
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target, parseInt(e.target.dataset.target));
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

/* ── AÑO DINÁMICO ── */
const currentYear = new Date().getFullYear();
document.querySelectorAll('#footer-year, #contact-year').forEach(el => {
  el.textContent = currentYear;
});

/* ── LANGUAGE TOGGLE ── */
const translations = {
  es: {
    'nav.casos': 'Casos',
    'nav.galeria': 'Galería',
    'nav.menu': 'Menú',
    'nav.stack': 'Stack',
    'nav.cta': 'Hablemos →',
    'hero.eyebrow': 'Creador Digital',
    'hero.tagline': 'Desarrollo web · Automatización<br>Producción visual · SaaS escalable<br>Buenos Aires, Argentina',
    'hero.hora': 'Hora',
    'hero.clima': 'Clima',
    'hero.estado.label': 'Estado',
    'hero.estado.value': 'Disponible para proyectos',
    'hero.btn.proyectos': 'Ver Proyectos ↓',
    'hero.scroll': 'Scroll down',
    'propuesta.label': 'Propuesta de valor',
    'propuesta.titulo': 'Dev que<br><span>entiende</span><br>el visual.',
    'propuesta.desc': 'Empecé con BBS cuando nadie sabía qué era internet.<br>Después vino la foto, el código, la IA.<br>No busco la solución más elegante <span style="color:var(--orange)">—</span> busco la que funciona.<br>Tengo proyectos en la cabeza que todavía no construí.<br>Ideas que esperan el momento y el cliente correcto.',
    'propuesta.01.title': 'Frontend de alto impacto',
    'propuesta.01.desc': 'React, Vite, animaciones fluidas. Interfaces que convierten y que los usuarios disfrutan usar.',
    'propuesta.02.title': 'SaaS & sistemas complejos',
    'propuesta.02.desc': 'Plataformas multitenant, paneles admin, integraciones API. Arquitecturas que escalan.',
    'propuesta.03.title': 'Automatización inteligente',
    'propuesta.03.desc': 'Flujos con IA, integraciones con n8n, Zapier, APIs. Procesos que corren solos.',
    'propuesta.04.title': 'Criterio visual de productor',
    'propuesta.04.desc': 'Años de fotografía aplicados al producto digital. Sé lo que se ve bien y por qué.',
    'casos.label': 'Casos de estudio',
    'casos.titulo': 'Ecosistemas<br><span>completos.</span>',
    'casos.desc': 'No vendo servicios sueltos — armo el ecosistema digital completo para cada cliente. Web, identidad, fotografía y automatización bajo una sola visión.',
    'caso.001.industry': 'Cervecería',
    'caso.002.industry': 'Estudios profesionales',
    'caso.003.industry': 'Gastronomía',
    'caso.003.loading': 'Captura próximamente',
    'caso.004.industry': 'SaaS / Deportes',
    'caso.004.loading': 'Captura próximamente',
    'caso.005.industry': 'Startups',
    'caso.005.loading': 'Captura próximamente',
    'caso.006.industry': 'Entretenimiento',
    'caso.007.industry': 'Gastronomía',
    'caso.008.industry': 'SaaS / Construcción',
    'caso.009.industry': 'Producto personal',
    'caso.010.industry': 'Gastronomía',
    'caso.011.industry': 'Gastronomía',
    'caso.012.industry': 'Gastronomía',
    'caso.en-desarrollo': 'En desarrollo',
    'caso.013.industry': 'Hardware + SaaS',
    'caso.producto-propio': 'Producto propio',
    'caso.013.eco': '<li>Lockers que se alquilan, cobran y abren solos, sin personal</li><li>Pago con Mercado Pago y acceso con QR o código</li><li>Aviso por WhatsApp cuando el pedido está listo para retirar</li><li>Kiosco táctil en el equipo + panel de administración web</li><li>Tres modelos: alquiler por hora, uso corporativo y retiro de pedidos</li><li>Hardware, firmware y software propios, funcionando en producción</li>',
    'caso.013.problema': '<span class="caso-bloque-label">El problema</span>Una red de lockers en la calle corriendo un sistema de 2014: sistema operativo y framework sin soporte ni parches de seguridad, una sola base de datos compartida por todos los equipos y acceso remoto por una VPN vieja.',
    'caso.013.update': '<span class="caso-bloque-label">La actualización</span><div class="caso-antes-ahora"><span>Ubuntu 12.04 + PHP (Yii 1)</span><b>→</b><span>Debian 12 + Node.js</span><span>CouchDB compartido</span><b>→</b><span>PostgreSQL por equipo</span><span>VPN Hamachi</span><b>→</b><span>Tailscale</span><span>Instalación a mano</span><b>→</b><span>Instalador automático</span></div>',
    'caso.013.minuta': '<span class="caso-bloque-label">Minuta</span>Primero estabilicé lo que estaba en producción. Después reescribí todo desde cero sobre una base moderna: cobro online, avisos por WhatsApp, panel nuevo y un instalador para sumar equipos en minutos. Hoy la misma plataforma corre tres modelos de negocio distintos.',
    'caso.finalizado': 'Finalizado',
    'caso.001.eco': '<li>Cervecería artesanal sin presencia digital ni sistema de ventas</li><li>Web + identidad + QR en punto de venta para pedidos sin cola</li><li>Sistema de alquiler de choperas integrado para eventos</li>',
    'caso.002.eco': '<li>Plataforma SaaS con gestión de casos</li><li>Panel administrativo completo</li><li>Sesión de fotos para la web</li>',
    'caso.003.eco': '<li>Web presence para restaurante</li><li>Menú digital y punto de contacto</li><li>Identidad digital y comunicación de marca</li>',
    'caso.004.eco': '<li>Plataforma SaaS de pronósticos para el mundial</li><li>Gestión de ligas privadas y grupos</li><li>Ranking en tiempo real y sistema de puntos</li><li>Integración de pagos y suscripciones</li>',
    'caso.005.eco': '<li>Landing de conversión + plataforma</li><li>Integración de pagos Stripe</li><li>Dashboard de métricas</li>',
    'caso.006.eco': '<li>Web para sala de arcade y entretenimiento</li><li>Catálogo de máquinas y reservas online</li><li>Blog de cultura gamer y novedades</li><li>Identidad digital y producción visual</li>',
    'caso.007.eco': '<li>Web completa con menú y e-commerce</li><li>Sistema de pedidos online</li><li>Sesión fotográfica de productos y espacio</li><li>Identidad digital y redes sociales</li>',
    'caso.008.eco': '<li>App de cotización de materiales para construcción en seco</li><li>Cálculo automático por tipo y dimensión de obra</li><li>Deploy en Vercel con actualizaciones en tiempo real</li>',
    'caso.009.eco': '<li>Anotador digital para Truco, Chinchón, Escoba y Generala</li><li>Diseño brutalista — tipografía pesada, grillas rotas, sin ornamentos</li><li>Producto propio, open source</li>',
    'caso.010.eco': '<li>Landing pre-lanzamiento con countdown activo</li><li>Sistema de pedidos online</li><li>Captación de emails y lista de espera</li><li>Identidad visual para panadería artesanal BA</li>',
    'caso.011.eco': '<li>Web institucional para pizzería/pastas de Chivilcoy</li><li>Base del proyecto, en desarrollo</li>',
    'caso.012.eco': '<li>Landing para chef profesional</li><li>Identidad visual aplicada del manual de marca</li>',
    'caso.link': 'Ver proyecto',
    'soluciones.label': 'Soluciones',
    'soluciones.titulo': 'Productos<br><span>listos.</span>',
    'soluciones.desc': 'No solo proyectos a medida — también tengo soluciones construidas con demanda real, listas para adaptar y desplegar en semanas para tu negocio.',
    'solucion.01.badge': 'El diferenciador',
    'solucion.01.nombre': 'WhatsApp + Telegram <span class="text-orange">AI</span> Agent',
    'solucion.01.bajada': 'Un empleado que nunca duerme. Atiende el WhatsApp y el Telegram de tu negocio 24/7: responde consultas, agenda reservas y te avisa cuando te necesita.',
    'solucion.01.eco': '<li>Responde precios, horarios y consultas al instante, con tu tono</li><li>Agenda reservas solo, directo a tu panel</li><li>Deriva a humano cuando la charla lo pide</li><li>Vos aprobás los mensajes sensibles antes de que salgan</li><li>Aprende de tu carta, tus servicios y tus reglas</li><li>Atiende 30 chats a la vez un sábado a la noche</li>',
    'solucion.01.chat1': 'Hola! Tienen mesa para 4 hoy a las 21?',
    'solucion.01.chat2': 'Sí! Mesa para 4 disponible a las 21:00. ¿La confirmo a tu nombre?',
    'solucion.01.chat3': 'Dale, Juan',
    'solucion.01.chat4': 'Listo Juan, reserva confirmada para hoy 21:00 🍻<span class="chat-check">✓✓</span>',
    'solucion.01.casos.label': 'Dónde labura',
    'solucion.01.caso1.rubro': 'Restaurante / bar',
    'solucion.01.caso1.escena': 'Sábado 22h, la cocina explota y entran 15 chats: "¿hay mesa?", "¿hasta qué hora?". El agente responde y agenda mientras vos laburás.',
    'solucion.01.caso2.rubro': 'Barbería / estética',
    'solucion.01.caso2.escena': '"¿Tenés turno mañana?" a las 23:45. El cliente reserva a esa hora… o reserva con otro.',
    'solucion.01.caso3.rubro': 'Alojamiento / cabañas',
    'solucion.01.caso3.escena': 'Disponibilidad, precios y cómo llegar, 40 veces por fin de semana. Siempre las mismas tres preguntas, siempre respondidas.',
    'solucion.01.casos.cierre': 'Cada chat sin responder es un cliente que le compró a otro.',
    'solucion.02.nombre': 'Sistema de reservas',
    'solucion.02.bajada': 'Página de reservas propia, link compartible',
    'solucion.02.eco': '<li>Confirmación automática al cliente</li><li>Recordatorios para bajar ausencias</li><li>Horarios, cupos y días bloqueados configurables</li>',
    'solucion.03.nombre': 'Menú digital',
    'solucion.03.bajada1': 'Tu carta en el celular del cliente. Sin app, sin descarga. QR → listo.',
    'solucion.03.bajada2': 'Carta con fotos, categorías y precios',
    'solucion.03.eco': '<li>Actualizás precios al instante, sin reimprimir nada</li><li>QR para mesas, mostrador o Instagram</li><li>Marcás platos agotados con un toque</li>',
    'solucion.04.nombre': 'Panel de administración',
    'solucion.04.bajada': 'El centro de todo. Menú, reservas y agente se manejan desde un solo lugar — tu celular.',
    'solucion.04.eco': '<li>Cambiás un precio y se actualiza en la carta al instante</li><li>Turnos, reservas y consultas del día en una sola vista</li><li>Cada solución que sumás cae al mismo panel, sin apps nuevas</li><li>Métricas simples: qué se vende, cuándo, cuánto</li>',
    'solucion.05.nombre': 'Mesa inteligente',
    'solucion.05.bajada': 'Un toque del celular y el cliente está adentro: carta, reservas y reseñas. Sticker NFC o stand impreso en 3D, con tu marca.',
    'solucion.05.eco': '<li>Sin app: apoya el celular y listo</li><li>Un solo punto que lleva a carta, reservas y reseñas en Google</li><li>Stand 3D o sticker, diseñado con tu identidad</li><li>Cambiás el destino cuando quieras, sin reimprimir</li>',
    'solucion.06.nombre': 'Tarjeta de fidelización digital',
    'solucion.06.bajada': 'El cliente escanea un QR y la tarjeta se guarda sola en su Apple Wallet o Google Wallet. Sin apps, sin fricción.',
    'solucion.06.eco': '<li>Alta con QR: nombre, contacto y consentimiento explícito</li><li>Pase nativo en el Wallet del celular, sin instalar nada</li><li>Panel para el negocio: ve clientes y manda campañas</li><li>Solo le escribís a quien dio su consentimiento</li>',
    'solucion.demo.btn': 'Ir a la demo →',
    'solucion.estado.disponible': 'Disponible',
    'solucion.estado.desarrollo': 'En desarrollo',
    'solucion.estado.incluido': 'Incluido',
    'galeria.label': 'Ojo visual',
    'galeria.titulo': 'Foto<br><span>grafía</span>',
    'galeria.desc': 'La misma sensibilidad que aplico a la fotografía callejera, gastronómica y documental la traigo al producto digital. El ojo que distingue una buena composición también distingue una buena interfaz.',
    'galeria.btn': 'Ver galería completa',
    'stack.label': 'Stack técnico',
    'contacto.label': 'Siguiente paso',
    'contacto.label.footer': 'Contacto',
    'contacto.titulo': 'Hable<br><span>mos.</span>',
    'contacto.meta-location': 'Buenos Aires, Argentina · Trabajo remoto global · <span id="contact-year">' + new Date().getFullYear() + '</span>',
    'footer.copy': '© <span id="footer-year">' + new Date().getFullYear() + '</span> CUFA · Hecho con 🧉 en Buenos Aires · <span style="font-family:var(--mono);opacity:0.4;font-size:10px;">v2.1.6</span>',
  },
  en: {
    'nav.casos': 'Cases',
    'nav.galeria': 'Gallery',
    'nav.menu': 'Menu',
    'nav.stack': 'Stack',
    'nav.cta': "Let's talk →",
    'hero.eyebrow': 'Digital Creator',
    'hero.tagline': 'Web development · Automation<br>Visual production · Scalable SaaS<br>Buenos Aires, Argentina',
    'hero.hora': 'Time',
    'hero.clima': 'Weather',
    'hero.estado.label': 'Status',
    'hero.estado.value': 'Available for projects',
    'hero.btn.proyectos': 'View Projects ↓',
    'hero.scroll': 'Scroll down',
    'propuesta.label': 'Value proposition',
    'propuesta.titulo': 'Dev that<br><span>gets</span><br>the visual.',
    'propuesta.desc': "I don't just build what you ask — I design digital solutions that work and look good. The combination of visual judgment, technical skill, and automation is what separates an average project from a memorable one.",
    'propuesta.01.title': 'High-impact Frontend',
    'propuesta.01.desc': 'React, Vite, smooth animations. Interfaces that convert and that users enjoy using.',
    'propuesta.02.title': 'SaaS & complex systems',
    'propuesta.02.desc': 'Multitenant platforms, admin panels, API integrations. Architectures that scale.',
    'propuesta.03.title': 'Smart automation',
    'propuesta.03.desc': 'AI-powered workflows, integrations with n8n, Zapier, APIs. Processes that run themselves.',
    'propuesta.04.title': "Producer's visual eye",
    'propuesta.04.desc': 'Years of photography applied to digital products. I know what looks good and why.',
    'casos.label': 'Case studies',
    'casos.titulo': 'Complete<br><span>ecosystems.</span>',
    'casos.desc': "I don't sell isolated services — I build the complete digital ecosystem for each client. Web, identity, photography, and automation under a single vision.",
    'caso.001.industry': 'Brewery',
    'caso.002.industry': 'Professional Offices',
    'caso.003.industry': 'Gastronomy',
    'caso.003.loading': 'Screenshot coming soon',
    'caso.004.industry': 'SaaS / Sports',
    'caso.004.loading': 'Screenshot coming soon',
    'caso.005.industry': 'Startups',
    'caso.005.loading': 'Screenshot coming soon',
    'caso.006.industry': 'Entertainment',
    'caso.007.industry': 'Gastronomy',
    'caso.008.industry': 'SaaS / Construction',
    'caso.009.industry': 'Personal Product',
    'caso.010.industry': 'Gastronomy',
    'caso.011.industry': 'Gastronomy',
    'caso.012.industry': 'Gastronomy',
    'caso.en-desarrollo': 'In development',
    'caso.013.industry': 'Hardware + SaaS',
    'caso.producto-propio': 'Own product',
    'caso.013.eco': '<li>Lockers that rent, charge and open on their own, no staff needed</li><li>Mercado Pago payments and access by QR or code</li><li>WhatsApp alert when an order is ready for pickup</li><li>Touch kiosk on the unit + web admin panel</li><li>Three models: hourly rental, corporate use and order pickup</li><li>In-house hardware, firmware and software, running in production</li>',
    'caso.013.problema': '<span class="caso-bloque-label">The problem</span>A network of street lockers running 2014 software: an OS and framework with no support or security patches, one database shared by every unit, and remote access through an old VPN.',
    'caso.013.update': '<span class="caso-bloque-label">The upgrade</span><div class="caso-antes-ahora"><span>Ubuntu 12.04 + PHP (Yii 1)</span><b>→</b><span>Debian 12 + Node.js</span><span>Shared CouchDB</span><b>→</b><span>PostgreSQL per unit</span><span>Hamachi VPN</span><b>→</b><span>Tailscale</span><span>Manual setup</span><b>→</b><span>Automatic installer</span></div>',
    'caso.013.minuta': '<span class="caso-bloque-label">Summary</span>First I stabilized what was running in production. Then I rewrote everything from scratch on a modern stack: online payments, WhatsApp alerts, a new admin panel and an installer to add units in minutes. Today the same platform runs three different business models.',
    'caso.finalizado': 'Finished',
    'caso.001.eco': '<li>Craft brewery with no digital presence or sales system</li><li>Web + identity + QR at point of sale for queue-free orders</li><li>Integrated beer tap rental system for events</li>',
    'caso.002.eco': '<li>SaaS platform with case management</li><li>Complete admin panel</li><li>Photo session for the website</li>',
    'caso.003.eco': '<li>Web presence for restaurant</li><li>Digital menu and contact point</li><li>Digital identity and brand communication</li>',
    'caso.004.eco': '<li>SaaS platform for World Cup predictions</li><li>Private leagues and groups management</li><li>Real-time rankings and scoring system</li><li>Payment and subscription integration</li>',
    'caso.005.eco': '<li>Conversion landing + platform</li><li>Stripe payment integration</li><li>Metrics dashboard</li>',
    'caso.006.eco': '<li>Website for arcade and entertainment venue</li><li>Machine catalog and online reservations</li><li>Gamer culture blog and news</li><li>Digital identity and visual production</li>',
    'caso.007.eco': '<li>Full website with menu and e-commerce</li><li>Online ordering system</li><li>Product and space photo session</li><li>Digital identity and social media</li>',
    'caso.008.eco': '<li>Materials quoting app for dry construction</li><li>Automatic calculation by project type and dimensions</li><li>Vercel deploy with real-time updates</li>',
    'caso.009.eco': '<li>Digital scorekeeper for Truco, Chinchón, Escoba and Generala</li><li>Brutalist design — heavy typography, broken grids, no ornaments</li><li>Own product, open source</li>',
    'caso.010.eco': '<li>Pre-launch landing with active countdown</li><li>Online ordering system</li><li>Email capture and waitlist</li><li>Visual identity for BA artisan bakery</li>',
    'caso.011.eco': '<li>Institutional website for a pizzeria/pasta place in Chivilcoy</li><li>Project base, in development</li>',
    'caso.012.eco': '<li>Landing page for a professional chef</li><li>Visual identity applied from the brand manual</li>',
    'caso.link': 'View project',
    'soluciones.label': 'Solutions',
    'soluciones.titulo': 'Ready-made<br><span>products.</span>',
    'soluciones.desc': "Not just custom projects — I also have solutions built on real demand, ready to adapt and deploy in weeks for your business.",
    'solucion.01.badge': 'The differentiator',
    'solucion.01.nombre': 'WhatsApp + Telegram <span class="text-orange">AI</span> Agent',
    'solucion.01.bajada': 'An employee that never sleeps. Handles your business WhatsApp and Telegram 24/7: answers questions, books reservations and pings you when it needs you.',
    'solucion.01.eco': '<li>Answers prices, hours and questions instantly, in your tone</li><li>Books reservations on its own, straight to your panel</li><li>Hands off to a human when the chat calls for it</li><li>You approve sensitive messages before they go out</li><li>Learns your menu, your services and your rules</li><li>Handles 30 chats at once on a busy Saturday night</li>',
    'solucion.01.chat1': 'Hi! Do you have a table for 4 today at 9pm?',
    'solucion.01.chat2': 'Yes! Table for 4 available at 9:00 PM. Should I book it under your name?',
    'solucion.01.chat3': 'Sure, John',
    'solucion.01.chat4': "Done John, reservation confirmed for today 9:00 PM 🍻<span class=\"chat-check\">✓✓</span>",
    'solucion.01.casos.label': 'Where it works',
    'solucion.01.caso1.rubro': 'Restaurant / bar',
    'solucion.01.caso1.escena': 'Saturday 10pm, the kitchen is slammed and 15 chats come in: "any tables?", "how late are you open?". The agent replies and books while you work.',
    'solucion.01.caso2.rubro': 'Barbershop / salon',
    'solucion.01.caso2.escena': '"Got anything tomorrow?" at 11:45pm. They book right then… or they book somewhere else.',
    'solucion.01.caso3.rubro': 'Lodging / cabins',
    'solucion.01.caso3.escena': 'Availability, prices and directions, 40 times a weekend. Same three questions, always answered.',
    'solucion.01.casos.cierre': 'Every unanswered chat is a customer who bought from someone else.',
    'solucion.02.nombre': 'Reservation system',
    'solucion.02.bajada': 'Your own booking page, shareable link',
    'solucion.02.eco': '<li>Automatic confirmation to the customer</li><li>Reminders to cut down no-shows</li><li>Configurable hours, capacity and blocked days</li>',
    'solucion.03.nombre': 'Digital menu',
    'solucion.03.bajada1': "Your menu on your customer's phone. No app, no download. QR → done.",
    'solucion.03.bajada2': 'Menu with photos, categories and prices',
    'solucion.03.eco': '<li>Update prices instantly, no reprinting</li><li>QR for tables, counter or Instagram</li><li>Mark dishes as sold out with a tap</li>',
    'solucion.04.nombre': 'Admin panel',
    'solucion.04.bajada': 'The center of it all. Menu, bookings and agent, managed from one place — your phone.',
    'solucion.04.eco': "<li>Change a price and the menu updates instantly</li><li>Today's bookings, appointments and inquiries in one view</li><li>Every solution you add lands in the same panel, no new apps</li><li>Simple metrics: what sells, when, how much</li>",
    'solucion.05.nombre': 'Smart table',
    'solucion.05.bajada': "One tap and your customer is in: menu, bookings and reviews. NFC sticker or 3D-printed stand, with your brand.",
    'solucion.05.eco': "<li>No app: tap the phone and you're in</li><li>One touchpoint for menu, bookings and Google reviews</li><li>3D stand or sticker, designed with your identity</li><li>Change the destination anytime, no reprinting</li>",
    'solucion.06.nombre': 'Digital loyalty card',
    'solucion.06.bajada': 'The customer scans a QR and the card saves itself to their Apple Wallet or Google Wallet. No apps, no friction.',
    'solucion.06.eco': '<li>Sign-up via QR: name, contact and explicit consent</li><li>Native pass in the phone\'s Wallet, nothing to install</li><li>Dashboard for the business: see customers, send campaigns</li><li>Only message people who gave consent</li>',
    'solucion.demo.btn': 'Go to demo →',
    'solucion.estado.disponible': 'Available',
    'solucion.estado.desarrollo': 'In progress',
    'solucion.estado.incluido': 'Included',
    'galeria.label': 'Visual eye',
    'galeria.titulo': 'Photo<br><span>graphy</span>',
    'galeria.desc': 'The same sensibility I apply to street, gastronomic, and documentary photography I bring to the digital product. The eye that distinguishes a good composition also distinguishes a good interface.',
    'galeria.btn': 'View full gallery',
    'stack.label': 'Technical stack',
    'contacto.label': 'Next step',
    'contacto.label.footer': 'Contact',
    'contacto.titulo': "Let's<br><span>talk.</span>",
    'contacto.meta-location': 'Buenos Aires, Argentina · Remote work worldwide · <span id="contact-year">' + new Date().getFullYear() + '</span>',
    'footer.copy': '© <span id="footer-year">' + new Date().getFullYear() + '</span> CUFA · Made with 🧉 in Buenos Aires · <span style="font-family:var(--mono);opacity:0.4;font-size:10px;">v2.1.6</span>',
  }
};

let currentLang = 'es';

function applyLang(lang) {
  const els = document.querySelectorAll('[data-i18n]');
  const langLabel = document.getElementById('lang-label');

  els.forEach(el => el.classList.add('lang-out'));
  langLabel.style.opacity = '0';

  setTimeout(() => {
    els.forEach(el => {
      const val = translations[lang][el.dataset.i18n];
      if (val !== undefined) el.innerHTML = val;
    });

    const galBtn = document.querySelector('.btn-galeria');
    if (galBtn) galBtn.setAttribute('data-after', lang === 'es' ? 'Ver galería →' : 'View gallery →');

    document.querySelectorAll('.solucion-demo-btn').forEach(btn => {
      btn.setAttribute('data-after', translations[lang]['solucion.demo.btn']);
    });

    langLabel.textContent = lang === 'es' ? 'EN' : 'ES';
    document.documentElement.lang = lang;
    currentLang = lang;

    els.forEach(el => el.classList.remove('lang-out'));
    langLabel.style.opacity = '1';
  }, 350);
}

document.getElementById('lang-toggle').addEventListener('click', () => {
  applyLang(currentLang === 'es' ? 'en' : 'es');
});

/* ── NAV scroll state ── */
const nav = document.querySelector('nav');
const heroScrollEl = document.querySelector('.hero-scroll');
const heroSection = document.querySelector('.hero');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 60
    ? 'rgba(10,10,10,0.97)'
    : 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)';
  if (heroScrollEl && heroSection) {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    heroScrollEl.style.opacity = heroBottom < 100 ? '0' : '1';
    heroScrollEl.style.pointerEvents = heroBottom < 100 ? 'none' : 'auto';
  }
});

/* ── GALERIA BTN GLITCH ── */
const galBtn = document.querySelector('.btn-galeria');
if (galBtn) {
  galBtn.addEventListener('mouseenter', () => {
    galBtn.classList.remove('emptying');
    galBtn.classList.add('filling');
  });
  galBtn.addEventListener('mouseleave', () => {
    galBtn.classList.remove('filling');
    galBtn.classList.add('emptying');
  });
  galBtn.addEventListener('animationend', e => {
    if (e.animationName === 'glitch-empty') {
      galBtn.classList.remove('emptying');
    }
  });
}

/* ── CHAT MOCKUP LOOP ── */
const chatMockup = document.querySelector('.chat-mockup');
if (chatMockup) {
  const playChat = () => {
    chatMockup.classList.remove('playing');
    void chatMockup.offsetWidth; // reflow, forces animations to restart
    chatMockup.classList.add('playing');
  };

  const chatObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        playChat();
        setInterval(playChat, 7000);
        chatObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  chatObserver.observe(chatMockup);
}

/* ── SOLUCION DEMO BTN GLITCH ── */
document.querySelectorAll('.solucion-card--link').forEach(card => {
  const demoBtn = card.querySelector('.solucion-demo-btn');
  if (!demoBtn) return;

  card.addEventListener('mouseenter', () => {
    demoBtn.classList.remove('emptying');
    demoBtn.classList.add('filling');
  });
  card.addEventListener('mouseleave', () => {
    demoBtn.classList.remove('filling');
    demoBtn.classList.add('emptying');
  });
  demoBtn.addEventListener('animationend', e => {
    if (e.animationName === 'glitch-empty') {
      demoBtn.classList.remove('emptying');
    }
  });
});

/* ── CASO VIDEO hover play/pause ── */
document.querySelectorAll('.caso-card').forEach(card => {
  const video = card.querySelector('video');
  if (!video) return;

  card.addEventListener('mouseenter', () => video.play().catch(() => {}));
  card.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;
  });
});
