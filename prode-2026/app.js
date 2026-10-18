/* ============================================================
   Prode Mundial 2026 — bares
   Datos reales: data/mundial-2026.json (fixture) + data/results.json (resultados)
   Ficticio: el bar, los jugadores, los premios y los pronósticos de "Vos"
   ============================================================ */
const DATA_URL = 'data/mundial-2026.json?v=2';
const RESULTS_URL = 'data/results.json?v=2';
const PICKS_KEY = 'prode2026_picks';
const DEMO_KICK_HOUR = 10;                // hora (ART) a la que arranca el "día simulado"
const FRIEND_POINTS = 1;                  // cada amigo que se suma con tu link
const FRIENDS_JOINED = 2;                 // demo: amigos que ya se sumaron
const GAME_MS = 2 * 3600e3;               // un partido se considera terminado 2 h después del inicio

/* Modo embebido: ?embed escala un celular de 390×844 para que entre entero en el iframe */
if (new URLSearchParams(location.search).has('embed')) {
  document.body.classList.add('embed');
  const fit = () => document.documentElement.style.setProperty('--embed-scale', Math.min(innerWidth / 420, innerHeight / 874, 1).toFixed(3));
  fit(); addEventListener('resize', fit);
}

const $ = (id) => document.getElementById(id);
const initials = (n) => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

let D, FILE_RESULTS, DEMO, NOW;
let M = {}, LIST = [];              // partidos resueltos (por id y en orden)
let picks = {};
let user = null;
const USER_KEY = 'prode2026_user';
const userName = () => (user && (user.apodo || user.nombre)) || 'Vos';
const loadUser = () => { try { user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { user = null; } };
const saveUser = () => { try { user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY); } catch (e) {} };
let dayKeys = [], clockKeys = [], clockIdx = 0;

/* ── Fechas: todo se muestra en hora de Argentina (UTC−3) ── */
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const art = (ms) => new Date(ms - 3 * 3600e3);                       // leer con getUTC*
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (ms) => { const d = art(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const dayLabel = (ms) => { const d = art(ms); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
const timeLabel = (ms) => { const d = art(ms); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
const keyToMs = (k, h) => Date.parse(`${k}T${pad(h)}:00:00-03:00`);

/* ── Banderas (SVG 1:1 locales, recortadas en círculo) ── */
const flag = (code, cls = '') => {
  const t = D.teams[code];
  return `<span class="flag ${cls}"><img src="flags/${t.flag}.svg" alt="" loading="lazy" decoding="async"></span>`;
};
const TN = (c) => D.teams[c].name;
const tbdDot = (sz) => `<span class="tbd-dot" ${sz ? `style="width:${sz}px;height:${sz}px"` : ''}></span>`;

/* ── Simulación (solo mientras results.json esté vacío) ── */
const RATING = { ARG:4, FRA:4, ESP:4, BRA:3.8, ENG:3.7, POR:3.6, GER:3.5, NED:3.4, BEL:3, URU:3, COL:3, CRO:3, MAR:3, JPN:2.8, USA:2.6, MEX:2.6, SUI:2.6, SEN:2.6, NOR:2.7, ECU:2.5, KOR:2.4, AUT:2.4, TUR:2.4, SWE:2.3, CIV:2.3, IRN:2.2, AUS:2.1, EGY:2.1, ALG:2.1, CAN:2.1, PAR:2.1, CZE:2.1 };
const rate = (c) => RATING[c] ?? 1.6;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function poisson(l, r) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
function simScore(a, b, seed, ko) {
  const r = rng(seed), d = rate(a) - rate(b);
  const res = { a: poisson(1.25 * Math.exp(0.3 * d), r), b: poisson(1.25 * Math.exp(-0.3 * d), r) };
  if (ko && res.a === res.b) { const aw = r() < 0.5 + 0.06 * d; res.pen = aw ? [5, 3 + (r() < .5 ? 1 : 0)] : [3 + (r() < .5 ? 1 : 0), 5]; }
  return res;
}

/* ── Construcción del estado a partir de datos + "ahora" ── */
function winnerCode(m) {
  if (!m || !m.res) return null;
  const s = winnerSide(m); return s === 'a' ? m.a : m.b;
}
function loserCode(m) {
  if (!m || !m.res) return null;
  const s = winnerSide(m); return s === 'a' ? m.b : m.a;
}
function build() {
  const now = NOW;
  const lastGroup = Math.max(...D.matches.filter(m => m.ph === 'group').map(m => Date.parse(m.kickoff)));
  const groupsDone = lastGroup + GAME_MS <= now;
  M = {}; LIST = [];
  for (const raw of D.matches) {                       // ya viene ordenado por id (eliminatorias dependen de las anteriores)
    const m = { ...raw, t: Date.parse(raw.kickoff) };
    const fr = FILE_RESULTS[m.id];
    if (m.ph === 'group') { /* equipos fijos */ }
    else if (m.ph === 'r32') { m.a = groupsDone ? raw.a : null; m.b = groupsDone ? raw.b : null; }
    else if (m.from) {
      const [x, y] = m.from;
      if (m.ph === '3rd') { m.a = loserCode(M[x]); m.b = loserCode(M[y]); }
      else if (m.ph === 'r16' || m.ph === 'qf' || m.ph === 'sf' || m.ph === 'final') { m.a = winnerCode(M[x]); m.b = winnerCode(M[y]); }
    }
    if (fr && fr.ta && m.t + GAME_MS <= now) { m.a = fr.ta; m.b = fr.tb; }
    // resultado: oficial si existe; si no, simulado (solo en modo demo)
    if (fr && fr.a != null && m.t + GAME_MS <= now) m.res = { a: fr.a, b: fr.b, ...(fr.pen ? { pen: fr.pen } : {}) };
    else if (DEMO && m.a && m.b && m.t + GAME_MS <= now) m.res = simScore(m.a, m.b, m.id * 7919 + 13, m.ph !== 'group');
    m.st = m.res ? 'fin' : (m.a && m.b ? 'next' : 'tbd');
    M[m.id] = m; LIST.push(m);
  }
  dayKeys = [...new Set(LIST.map(m => dayKey(m.t)))].sort();
  clockKeys = [...dayKeys, dayKey(Date.parse(dayKeys[dayKeys.length - 1] + 'T12:00:00-03:00') + 86400e3)];   // + el día después de la final
}

/* Pronósticos de "Vos": de ejemplo, generados con semilla; los cambios se guardan en el navegador */
function seedPicks() {
  const out = {};
  for (const m of LIST) {
    if (!m.a || !m.b) continue;
    if (m.t > NOW + 30 * 3600e3) continue;
    if (m.t > NOW && m.id % 2) continue;               // algunos partidos de hoy quedan sin pronosticar
    const r = rng(m.id * 104729 + 7);
    if (r() < 0.12 && !m.res) continue;
    const ko = m.ph !== 'group';
    if (m.res && r() < 0.22) { const [fa, fb] = m.res.ft || [m.res.a, m.res.b]; out[m.id] = { a: fa, b: fb, ...(ko && fa === fb ? { pen: winnerSide(m) } : {}) }; continue; }   // pleno
    const s = simScore(m.a, m.b, m.id * 31 + 5, false);
    out[m.id] = { a: s.a, b: s.b, ...(ko && s.a === s.b ? { pen: r() < 0.5 + 0.06 * (rate(m.a) - rate(m.b)) ? 'a' : 'b' } : {}) };
  }
  return out;
}
function loadPicks() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(PICKS_KEY) || '{}'); } catch (e) {}
  picks = { ...seedPicks(), ...saved };
}
const savePicks = () => { try { localStorage.setItem(PICKS_KEY, JSON.stringify(picks)); } catch (e) {} };

/* ── Lógica de prode ── */
function winnerSide(m) {
  if (!m.res) return null;
  if (m.res.a !== m.res.b) return m.res.a > m.res.b ? 'a' : 'b';
  return m.res.pen ? (m.res.pen[0] > m.res.pen[1] ? 'a' : 'b') : null;
}
function evalPick(m) {
  const p = picks[m.id];
  if (!p || !m.res) return null;
  const [fa, fb] = m.res.ft || [m.res.a, m.res.b];            // el prode puntúa sobre los 90'
  if (p.a === fa && p.b === fb) return { k: 'exact', pts: 10 };
  if (Math.sign(p.a - p.b) === Math.sign(fa - fb)) return { k: 'win', pts: 5 };
  return { k: 'miss', pts: 0 };
}
function totals() {
  let pts = 0, plenos = 0, played = 0;
  for (const m of LIST) { const r = evalPick(m); if (r) { played++; pts += r.pts; if (r.k === 'exact') plenos++; } }
  return { pts: pts + FRIENDS_JOINED * FRIEND_POINTS, plenos, played };
}
function ranking() {
  const t = totals(), P = t.pts;
  const f = [1.34, 1.22, 1.11, 0.92, 0.86, 0.79, 0.7, 0.62, 0.5];
  const names = ['Dani Demo', 'Ana Prueba', 'Lu Ejemplo', 'Tano Ficticio', 'Cami Muestra', 'Pipi Demo', 'Nico Prueba', 'Rochi Ejemplo', 'Fede Muestra'];
  const base = Math.max(P, 0);
  const others = names.map((n, i) => { const pts = Math.round(base * f[i]); return { n, pts, pl: Math.max(0, Math.round(pts / 14)) }; });
  const me = { n: userName(), pts: P, pl: t.plenos, me: true };
  return [...others, me].sort((x, y) => y.pts - x.pts || (y.me ? 1 : 0) - (x.me ? 1 : 0));
}
const canPick = (m) => m.a && m.b && m.st !== 'fin';
function championAlive() {
  return !LIST.some(m => m.ph !== 'group' && m.res && (m.a === 'ARG' || m.b === 'ARG') && winnerCode(m) !== 'ARG');
}

/* ── Textos ── */
const PHASE_NAME = { group: 'Fase de grupos', r32: '16avos de final', r16: 'Octavos de final', qf: 'Cuartos de final', sf: 'Semifinal', '3rd': 'Tercer puesto', final: 'Final' };
const phaseOf = (m) => m.ph === 'group' ? `Grupo ${m.g} · Fecha ${((m.id - 1) % 6 >> 1) + 1}` : PHASE_NAME[m.ph];
const slotLabel = (s) => !s ? 'Por determinar' : s === '3' ? 'Mejor 3.º' : `${s[0]}.º del grupo ${s[1]}`;
function badgeFor(r) {
  if (!r) return '';
  return r.k === 'exact' ? `<span class="badge exact">Pleno +10</span>`
       : r.k === 'win'   ? `<span class="badge win">Ganador +5</span>`
       :                   `<span class="badge miss">Sin puntos</span>`;
}
function pickText(p, m) {
  if (!p) return '';
  let t = `${p.a}–${p.b}`;
  if (p.pen && p.a === p.b && m.ph !== 'group') t += ` (pasa ${TN(p.pen === 'a' ? m.a : m.b)})`;
  return t;
}
function scoreText(m, side) {
  const s = side === 'a' ? m.res.a : m.res.b;
  return m.res.pen ? `${s}(${side === 'a' ? m.res.pen[0] : m.res.pen[1]})` : s;
}

function refreshHeader() {
  const t = totals(), r = ranking();
  $('myPts').textContent = t.pts;
  $('myRank').textContent = `#${r.findIndex(x => x.me) + 1} en el bar`;
}

/* ── Pantalla: Partidos (Ayer / Hoy / Próximos) ── */
let dayTab = 1;
function daysSplit() {
  const today = dayKey(NOW);
  const before = dayKeys.filter(k => k < today), after = dayKeys.filter(k => k > today);
  return [
    LIST.filter(m => m.t < NOW && dayKey(m.t) === before[before.length - 1] && dayKey(m.t) < today),
    LIST.filter(m => dayKey(m.t) === today),
    LIST.filter(m => after.slice(0, 2).includes(dayKey(m.t))),
  ];
}
function bigMatch(m, i) {
  const p = picks[m.id], r = evalPick(m), w = winnerSide(m);
  const team = (c) => c ? `<div class="m-team">${flag(c)}<span>${TN(c)}</span></div>` : `<div class="m-team">${tbdDot(54)}<span>Por definir</span></div>`;
  let center;
  if (m.st === 'fin') {
    const mid = `<div class="m-mid"><b>${m.res.ft ? 'Fin · prórroga' : 'Fin'}</b>${m.res.pen ? `<small>Penales ${m.res.pen[0]}-${m.res.pen[1]}</small>` : ''}</div>`;
    center = `<div style="display:grid;justify-items:center;gap:4px"><div class="m-score"><span class="${w === 'b' ? 'lose' : ''}">${m.res.a}</span><span class="${w === 'a' ? 'lose' : ''}">${m.res.b}</span></div>${mid}</div>`;
  } else center = `<div class="m-vs">${timeLabel(m.t)}<small>${dayLabel(m.t)}</small></div>`;
  let strip;
  if (m.st === 'fin') strip = p ? `<div class="pick"><span><span class="lbl">Tu pronóstico</span><span class="val">${pickText(p, m)}</span></span>${badgeFor(r)}</div>` : `<div class="pick"><span class="lbl">No pronosticaste este partido</span></div>`;
  else if (canPick(m)) strip = p
    ? `<div class="pick"><span><span class="lbl">Tu pronóstico</span><span class="val">${pickText(p, m)}</span></span><button class="cta" data-pick="${m.id}">Cambiar</button></div>`
    : `<div class="pick"><span class="closes">Cierra al arrancar el partido</span><button class="cta" data-pick="${m.id}">Pronosticar</button></div>`;
  else strip = `<div class="pick"><span class="lbl">Se habilita cuando se definan los equipos</span><span class="badge pend">Pronto</span></div>`;
  return `<article class="match rise" style="--i:${i}">
    <div class="match-phase">${phaseOf(m)}</div>
    <div class="match-row">${team(m.a)}${center}${team(m.b)}</div>${strip}
    ${m.venue ? `<div class="venue">${m.venue}</div>` : ''}
  </article>`;
}
let booked = {};
function featured(list) {
  const c = list.filter(m => m.st === 'next');
  return c.sort((x, y) => (rate(y.a) + rate(y.b)) - (rate(x.a) + rate(x.b)))[0];
}
function renderHoy() {
  const [ayer, hoy, prox] = daysSplit();
  const list = [ayer, hoy, prox][dayTab];
  const fm = dayTab === 1 ? featured(hoy) : null;
  let i = 1;
  const clock = `<div class="clock rise" style="--i:0"><span>${DEMO ? 'Demo · resultados simulados' : 'Repaso del torneo'} · <b>${clockIdx === clockKeys.length - 1 ? 'Tras la final' : dayLabel(NOW)}</b></span>
      <span class="step"><button data-clock="-1" aria-label="Día anterior">‹</button><button data-clock="1" aria-label="Día siguiente">›</button></span></div>`;
  const fin = M[104], cw = winnerCode(fin);
  const champ = cw
    ? `<div class="champ rise" style="--i:${i++}">${flag(cw)}<span>Campeón del mundo: <b>${TN(cw)}</b> · tu elegida, Argentina, quedó ${cw === 'ARG' ? 'campeona' : fin.a === 'ARG' || fin.b === 'ARG' ? 'subcampeona' : 'eliminada'}</span></div>`
    : `<div class="champ rise" style="--i:${i++}">${flag('ARG')}<span>Tu campeón: <b>Argentina</b></span><span class="alive" ${championAlive() ? '' : 'style="color:var(--bad)"'}>${championAlive() ? 'En carrera' : 'Eliminado'}</span></div>`;
  const empty = !list.length ? `<div class="note rise" style="--i:${i++}">${dayTab === 0 ? 'No hubo partidos ayer.' : dayTab === 1 ? 'Hoy no hay partidos.' : 'No hay más partidos programados.'}</div>` : '';
  const barCard = fm ? `<div class="bar-card rise" style="--i:${list.length + 3}">
      <h3>En el bar: ${TN(fm.a)} – ${TN(fm.b)} en pantalla gigante</h3>
      <p>${timeLabel(fm.t)} · Birra tirada 2×1 hasta el entretiempo para quienes tengan el prode abierto.</p>
      <div class="row"><span class="tag">Quedan 14 mesas</span>
      <button class="cta" data-book="${fm.id}" ${booked[fm.id] ? 'disabled' : ''}>${booked[fm.id] ? 'Mesa reservada' : 'Reservar mesa'}</button></div>
    </div>` : '';
  let lastDay = '';
  const cards = list.map(m => {
    const k = dayKey(m.t); let head = '';
    if (dayTab === 2 && k !== lastDay) { lastDay = k; head = `<div class="sec-title rise" style="--i:${i}"><span>${dayLabel(m.t)}</span></div>`; }
    return head + bigMatch(m, i++);
  }).join('');
  $('s-hoy').innerHTML = `
    ${clock}
    <div class="seg rise" style="--i:0" role="tablist" aria-label="Día">
      <div class="seg-thumb" style="transform:translateX(${dayTab * 100}%)"></div>
      ${['Ayer', 'Hoy', 'Próximos'].map((t, k) => `<button role="tab" data-day="${k}" aria-selected="${k === dayTab}">${t}</button>`).join('')}
    </div>
    ${dayTab === 1 || (dayTab === 0 && cw) ? champ : ''}${empty}${cards}${barCard}`;
}

/* ── Pantalla: Cuadro ── */
let bStart = 0; // 0..3 : primera fase visible
const PHASES = ['16avos', 'Octavos', 'Cuartos', 'Semis', 'Final'];
const ORDER = {
  r32: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
  r16: [89, 90, 93, 94, 91, 92, 95, 96],
  qf: [97, 98, 99, 100],
  sf: [101, 102],
};
function bracketCard(m) {
  const w = winnerSide(m), p = picks[m.id], r = evalPick(m);
  const team = (code, side) => {
    if (!code) return `<div class="bc-team tbd">${tbdDot()}<span class="nm">${m.sl ? slotLabel(m.sl[side === 'a' ? 0 : 1]) : 'Por determinar'}</span></div>`;
    const lose = w && w !== side;
    const sc = m.st === 'fin' ? `<span class="sc">${scoreText(m, side)}</span>` : '';
    return `<div class="bc-team ${lose ? 'lose' : ''}">${flag(code)}<span class="nm">${TN(code)}</span>${sc}</div>`;
  };
  let foot = '';
  if (m.st === 'fin') foot = p ? `<div class="bc-pick"><span>Vos<b>${p.a}–${p.b}</b></span>${badgeFor(r)}</div>` : '';
  else if (canPick(m)) foot = p ? `<div class="bc-pick open"><span>Vos<b>${p.a}–${p.b}</b></span><span>Cambiar</span></div>` : `<div class="bc-pick open"><span>Tocá para pronosticar</span><span>→</span></div>`;
  const head = `<div class="bc-head">${m.st === 'fin' ? 'Fin · ' : ''}${dayLabel(m.t)}${m.st === 'fin' ? '' : ' · ' + timeLabel(m.t)}</div>`;
  const inner = `${head}${team(m.a, 'a')}${team(m.b, 'b')}${foot}`;
  return canPick(m) ? `<button class="bc" data-pick="${m.id}">${inner}</button>` : `<div class="bc">${inner}</div>`;
}
function pairHTML(ids, joins = true) {
  return `<div class="pair ${joins ? 'joins' : ''}">${ids.map(id => `<div class="slot">${bracketCard(M[id])}</div>`).join('')}</div>`;
}
const pairs = (arr) => arr.reduce((o, v, i) => (i % 2 ? o[o.length - 1].push(v) : o.push([v]), o), []);
function renderCuadro() {
  const col = (title, ids) => `<div class="col"><h4>${title}</h4><div class="col-body">${pairs(ids).map(p => pairHTML(p)).join('')}</div></div>`;
  const c5 = `<div class="col"><h4>Final</h4><div class="col-body">
      <div class="pair"><div class="slot">${bracketCard(M[104])}</div><div class="slot" style="align-items:flex-end;flex-direction:column;justify-content:center"><div style="width:100%"><div class="note" style="text-align:left;margin:0 0 6px 2px">Tercer puesto</div>${bracketCard(M[103])}</div></div></div>
    </div></div>`;
  $('s-cuadro').innerHTML = `
    <div class="phase-nav rise" style="--i:0" id="phaseNav">
      <div class="win" id="phaseWin"></div>
      ${PHASES.map((t, i) => `<button data-ph="${i}" class="${i === bStart || i === bStart + 1 ? 'in' : ''}">${t}</button>`).join('')}
    </div>
    <div class="bracket-viewport rise" style="--i:1"><div class="bracket-track" id="track">${col('16avos', ORDER.r32)}${col('Octavos', ORDER.r16)}${col('Cuartos', ORDER.qf)}${col('Semifinal', ORDER.sf)}${c5}</div></div>
    <p class="note">Tocá un partido abierto para cargar tu pronóstico.<br>Los cruces se completan solos a medida que se juegan.</p>`;
  moveBracket(false);
}
function moveBracket(animate = true) {
  const track = $('track'), win = $('phaseWin'); if (!track) return;
  if (!animate) { track.style.transition = 'none'; win.style.transition = 'none'; }
  const step = track.children[0].getBoundingClientRect().width + 28;
  track.style.transform = `translateX(${-bStart * step}px)`;
  win.style.transform = `translateX(${bStart * 50}%)`;
  track.style.height = ([16, 8, 4, 2][bStart] * 138 + 28 + (bStart === 3 ? 64 : 0)) + 'px';   // la última vista suma el rótulo del tercer puesto
  document.querySelectorAll('#phaseNav button').forEach((b, i) => b.classList.toggle('in', i === bStart || i === bStart + 1));
  if (!animate) requestAnimationFrame(() => { track.style.transition = ''; win.style.transition = ''; });
}

/* ── Pantalla: Grupos ── */
function standings(g) {
  const rows = D.groups[g].map((c, i) => ({ c, i, pj: 0, gf: 0, gc: 0, pts: 0 }));
  const by = Object.fromEntries(rows.map(r => [r.c, r]));
  for (const m of LIST) {
    if (m.g !== g || !m.res) continue;
    const A = by[m.a], B = by[m.b];
    A.pj++; B.pj++; A.gf += m.res.a; A.gc += m.res.b; B.gf += m.res.b; B.gc += m.res.a;
    if (m.res.a > m.res.b) A.pts += 3; else if (m.res.a < m.res.b) B.pts += 3; else { A.pts++; B.pts++; }
  }
  return rows.sort((x, y) => y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.i - y.i);
}
function renderGrupos() {
  const letters = Object.keys(D.groups);
  $('s-grupos').innerHTML = `
    <div class="chips rise" style="--i:0">${letters.map(l => `<button data-gjump="${l}" aria-label="Ir al grupo ${l}">${l}</button>`).join('')}</div>
    ${letters.map((g, gi) => `
    <article class="group rise" style="--i:${Math.min(gi + 1, 6)}" id="g-${g}">
      <h3>Grupo ${g}</h3>
      <table>
        <thead><tr><th>Equipo</th><th>PJ</th><th>DG</th><th>PTS</th></tr></thead>
        <tbody>${standings(g).map((r, i) => { const dg = r.gf - r.gc; return `
          <tr class="${i === 2 ? 'cut' : ''}"><td class="t"><div class="tc"><span class="pos">${i + 1}</span>${i < 2 ? '<span class="q" title="Clasifica"></span>' : i === 2 ? '<span class="q third" title="Puede clasificar como mejor tercero"></span>' : '<span class="q out"></span>'}${flag(r.c)}${TN(r.c)}</div></td>
          <td class="num">${r.pj}</td><td class="num">${dg > 0 ? '+' + dg : dg}</td><td class="pts">${r.pts}</td></tr>`; }).join('')}
        </tbody>
      </table>
    </article>`).join('')}
    <div class="legend"><span><i class="a"></i>Clasifica</span><span><i class="b"></i>Mejor tercero (pasan 8 de 12)</span></div>
    <p class="note">Los dos primeros de cada grupo y los 8 mejores terceros pasan a 16avos.</p>`;
}

/* ── Pantalla: El bar ── */
const hashCode = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(0, 4); };
function renderBar() {
  const rk = ranking();
  const exacts = LIST.filter(m => evalPick(m)?.k === 'exact').sort((a, b) => b.t - a.t);
  const codes = exacts.slice(0, 4).map((m, i) => {
    const used = i === exacts.slice(0, 4).length - 1 && exacts.length > 3;
    return `<div class="code ${used ? 'used' : ''}"><span><b>ESQ-${hashCode('c' + m.id)}</b><small>Pleno · ${TN(m.a)} ${m.res.a}–${m.res.b} ${TN(m.b)}</small></span><span class="badge ${used ? 'pend' : 'win'}">${used ? 'Usado' : 'Canjear'}</span></div>`;
  }).join('') || `<div class="note" style="margin:0">Todavía no tenés códigos. Un pleno te da uno para canjear en el local.</div>`;
  $('s-bar').innerHTML = `
    <div class="sec-title rise" style="--i:0">Premios del bar <small>Bar La Esquina</small></div>
    <div class="podium">
      <div class="prize rise" style="--i:1"><span class="n">1</span><p>Asado para 4<small>Para el ganador del ranking final</small></p></div>
      <div class="prize rise" style="--i:2"><span class="n">2</span><p>Pizza grande + 2 birras<small>Segundo puesto</small></p></div>
      <div class="prize rise" style="--i:3"><span class="n">3</span><p>Una pinta libre cada viernes<small>Tercer puesto · hasta fin de mes</small></p></div>
    </div>
    <div class="sec-title rise" style="--i:4">Ranking <small>${rk.length} jugadores</small></div>
    <div class="rank rise" style="--i:5">${rk.map((x, i) => `
      <div class="rank-row ${x.me ? 'me' : ''}"><span class="p">${i + 1}</span><span class="av">${x.me ? (x.n === 'Vos' ? 'VOS' : initials(x.n)) : initials(x.n)}</span>
      <span class="nm">${x.n}</span><span class="pl">${x.pl} plenos</span><span class="pt">${x.pts}</span></div>`).join('')}
    </div>
    <div class="sec-title rise" style="--i:6">Tus códigos <small>Canjeables en el local</small></div>
    <div class="codes rise" style="--i:7">${codes}</div>
    <div class="invite rise" style="--i:8">
      <div class="sec-title" style="margin:0">Traé a tu grupo</div>
      <p>Cada amigo que se suma con tu link te da <b>+${FRIEND_POINTS} punto</b>. Ya se sumaron <b>${FRIENDS_JOINED} amigos</b>: +${FRIENDS_JOINED * FRIEND_POINTS} en tu total. Y los días de partido, 3 amigos en la mesa tienen una fuente de papas de regalo.</p>
      <button class="cta" id="invite">Copiar mi link</button>
    </div>`;
}

/* ── Hoja de pronóstico ── */
let edit = null;
function openSheet(id) {
  const m = M[id]; if (!canPick(m)) return;
  const p = picks[id] || { a: 0, b: 0 };
  edit = { id, a: p.a, b: p.b, pen: p.pen || null, ko: m.ph !== 'group' };
  $('sh-sub').textContent = `${phaseOf(m)} · ${dayLabel(m.t)} · ${timeLabel(m.t)}`;
  const st = (side, code) => `<div class="stepper" id="st${side.toUpperCase()}">${flag(code)}<span class="nm">${TN(code)}</span>
    <div class="ctl"><button class="round" data-step="${side}+" aria-label="Sumar gol a ${TN(code)}">+</button>
    <span class="val" id="v${side}" aria-live="polite">${edit[side]}</span>
    <button class="round" data-step="${side}-" aria-label="Restar gol a ${TN(code)}">−</button></div></div>`;
  $('stA').outerHTML = st('a', m.a);
  $('stB').outerHTML = st('b', m.b);
  $('tieOpts').innerHTML = `<button data-pen="a" aria-pressed="${edit.pen === 'a'}">${TN(m.a)}</button><button data-pen="b" aria-pressed="${edit.pen === 'b'}">${TN(m.b)}</button>`;
  syncTie();
  $('scrim').classList.add('on'); $('sheet').classList.add('on');
  setTimeout(() => $('save').focus({ preventScroll: true }), 320);
}
function closeSheet() { $('scrim').classList.remove('on'); $('sheet').classList.remove('on'); edit = null; }
function syncTie() { $('tie').classList.toggle('on', !!edit && edit.ko && edit.a === edit.b); }
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 1800);
}

/* ── Acceso, onboarding y perfil ── */
let authMode = 'login', obStep = 0, authErr = '';
const authBrand = (sub) => `<div class="auth-brand"><div class="bar-badge" aria-hidden="true">LE</div><h2>Prode Mundial 2026</h2><p>${sub}</p></div>`;
function showAuth(view) { $('auth').classList.add('on'); renderAuth(view); }
function hideAuth() { $('auth').classList.remove('on'); }
function renderAuth(view = 'login') {
  const a = $('auth');
  if (view === 'onboarding') {
    const steps = [
      { t: 'Cómo se puntúa', rows: [['+10', 'Resultado exacto', 'Marcador exacto a los 90 minutos'], ['+5', 'Ganador correcto', 'Acertás quién gana o si es empate'], ['0', 'No acertás', 'Ni el marcador ni el ganador']] },
      { t: 'Premios del bar', rows: [['1.º', 'Asado para 4', 'Para el ganador del ranking'], ['2.º', 'Pizza grande + 2 birras', 'Segundo puesto'], ['Plenos', 'Códigos canjeables', 'Cada pleno te da uno para usar en el local']] },
      { t: 'Traé a tu grupo', rows: [['+1', 'Por cada amigo', 'Que se suma con tu link'], ['Mesa', 'Reservá en el bar', 'Mirá los partidos en pantalla gigante'], ['Fuente', 'Papas de regalo', 'Con 3 amigos en la mesa']] },
    ];
    const st = steps[obStep];
    a.innerHTML = `${authBrand('Bar La Esquina · demo')}
      <div class="ob-dots">${steps.map((_, i) => `<i class="${i === obStep ? 'on' : ''}"></i>`).join('')}</div>
      <div class="ob-card"><h3>${st.t}</h3>${st.rows.map(r => `<div class="ob-row"><span class="pts">${r[0]}</span><p>${r[1]}<small>${r[2]}</small></p></div>`).join('')}</div>
      <button class="cta btn-wide" data-ob="next">${obStep === steps.length - 1 ? 'Empezar a jugar' : 'Siguiente'}</button>
      <button class="btn-link" data-ob="skip">Saltar</button>`;
    return;
  }
  const reg = authMode === 'register';
  a.innerHTML = `${authBrand(reg ? 'Creá tu cuenta y jugá el prode del bar.' : 'Pronosticá el Mundial, sumá puntos y ganá premios en el bar.')}
    <div class="tabs2" role="tablist"><button role="tab" data-amode="login" aria-selected="${!reg}">Ingresar</button><button role="tab" data-amode="register" aria-selected="${reg}">Crear cuenta</button></div>
    <form id="authForm" novalidate>
      ${reg ? `<div class="field-row"><div class="field"><label for="f-nombre">Nombre</label><input id="f-nombre" name="nombre" autocomplete="given-name" placeholder="Juan"></div>
        <div class="field"><label for="f-apodo">Apodo</label><input id="f-apodo" name="apodo" placeholder="Cómo te ven en el ranking"></div></div>` : ''}
      <div class="field"><label for="f-email">Correo electrónico</label><input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="vos@ejemplo.com"></div>
      <div class="field"><label for="f-pass">Contraseña</label><input id="f-pass" name="pass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="Mínimo 6 caracteres"></div>
      <p class="form-err" id="authErr" role="alert">${authErr}</p>
      <button class="cta btn-wide" type="submit">${reg ? 'Crear cuenta' : 'Ingresar'}</button>
    </form>
    <div class="or">o</div>
    <button class="btn-ghost" data-alogin="google"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.600-4.100H3.100v2.600A10 10 0 0 0 12 22z"/><path fill="#fbbc05" d="M6.400 14c-.2-.6-.3-1.300-.3-2s.1-1.400.3-2V7.400H3.100a10 10 0 0 0 0 9.200z"/><path fill="#ea4335" d="M12 5.900c1.500 0 2.800.5 3.800 1.500l2.800-2.800A10 10 0 0 0 3.100 7.400L6.400 10C7.200 7.700 9.400 5.900 12 5.900z"/></svg>Continuar con Google</button>
    <button class="btn-link" data-alogin="demo">Probar sin cuenta</button>
    <p class="legal">Demo con datos de ejemplo. No se envía nada a ningún servidor: tu cuenta queda solo en este navegador.</p>`;
}
function startSession(u, isNew) {
  user = { nombre: '', apellido: '', apodo: '', email: '', tel: '', nac: '', ...u };
  saveUser(); obStep = 0; authErr = '';
  if (isNew) renderAuth('onboarding'); else hideAuth();
  refreshHeader(); go('hoy');
}
function submitAuth(form) {
  const f = Object.fromEntries(new FormData(form));
  const email = (f.email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { authErr = 'Ingresá un correo válido.'; }
  else if ((f.pass || '').length < 6) { authErr = 'La contraseña necesita al menos 6 caracteres.'; }
  else if (authMode === 'register' && !(f.nombre || '').trim()) { authErr = 'Contanos tu nombre.'; }
  else {
    authErr = '';
    const base = authMode === 'register' ? { nombre: f.nombre.trim(), apodo: (f.apodo || f.nombre).trim(), email } : { apodo: email.split('@')[0], email };
    return startSession(base, authMode === 'register');
  }
  $('authErr').textContent = authErr;
}
function renderPerfil() {
  const t = totals(), rk = ranking();
  const winners = LIST.filter(m => evalPick(m)?.k === 'win').length;
  const hist = LIST.filter(m => m.res && picks[m.id]).sort((a, b) => b.t - a.t).slice(0, 12);
  const u = user || {};
  const full = [u.nombre, u.apellido].filter(Boolean).join(' ');
  $('s-perfil').innerHTML = `
    <div class="me-head rise" style="--i:0"><div class="me-av">${initials(userName())}</div>
      <div><h2>${userName()}</h2><small>${full ? full + ' · ' : ''}${u.email || 'Jugador de Bar La Esquina'}</small></div></div>
    <div class="stats rise" style="--i:1">
      <div class="stat"><b>${t.plenos}</b><span>Plenos</span></div>
      <div class="stat"><b>${winners}</b><span>Ganadores</span></div>
      <div class="stat"><b>${t.pts}</b><span>Puntos · #${rk.findIndex(x => x.me) + 1}</span></div>
    </div>
    <form class="panel rise" style="--i:2" id="profForm" novalidate>
      <div class="sec-title" style="margin:0 0 12px">Mis datos</div>
      <div class="field-row"><div class="field"><label for="p-nombre">Nombre</label><input id="p-nombre" name="nombre" value="${u.nombre || ''}" autocomplete="given-name" placeholder="Juan"></div>
        <div class="field"><label for="p-apellido">Apellido</label><input id="p-apellido" name="apellido" value="${u.apellido || ''}" autocomplete="family-name" placeholder="García"></div></div>
      <div class="field"><label for="p-apodo">Apodo (se ve en el ranking)</label><input id="p-apodo" name="apodo" value="${u.apodo || ''}" placeholder="Apodo o nombre corto"></div>
      <div class="field"><label for="p-email">Correo electrónico</label><input id="p-email" name="email" type="email" value="${u.email || ''}" autocomplete="email" placeholder="vos@ejemplo.com"></div>
      <div class="field-row"><div class="field"><label for="p-tel">Teléfono</label><input id="p-tel" name="tel" type="tel" value="${u.tel || ''}" autocomplete="tel" inputmode="tel" placeholder="11 5555 0000"></div>
        <div class="field"><label for="p-nac">Fecha de nac.</label><input id="p-nac" name="nac" type="date" value="${u.nac || ''}" autocomplete="bday"></div></div>
      <p class="rules" style="margin:0 0 10px;text-align:left">Tu teléfono sirve para avisarte cuando ganás un premio.</p>
      <button class="cta btn-wide" type="submit">Guardar cambios</button>
    </form>
    <div class="sec-title rise" style="--i:3">Historial <small>${hist.length ? 'Últimos partidos' : ''}</small></div>
    <div class="panel rise" style="--i:4">${hist.length ? hist.map(m => { const r = evalPick(m), p = picks[m.id]; return `<div class="hist-row"><span>${TN(m.a)} ${m.res.a}–${m.res.b} ${TN(m.b)}</span>${badgeFor(r)}<small>Tu pronóstico ${pickText(p, m)} · ${dayLabel(m.t)}</small></div>`; }).join('') : '<p class="note" style="margin:0">Todavía no hay partidos evaluados.</p>'}</div>
    <button class="btn-out rise" style="--i:5" data-logout>Cerrar sesión</button>`;
}

/* ── Navegación y eventos ── */
const SCREENS = { hoy: renderHoy, cuadro: renderCuadro, grupos: renderGrupos, bar: renderBar, perfil: renderPerfil };
const activeTab = () => document.querySelector('.tab[aria-selected="true"]').dataset.tab;
function go(tab) {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  SCREENS[tab]();
  const s = $('s-' + tab); s.scrollTop = 0; s.classList.add('on');
  if (tab === 'cuadro') moveBracket(false);
}
function rerender() {
  const active = activeTab(), s = $('s-' + active), y = s.scrollTop;
  SCREENS[active](); s.querySelectorAll('.rise').forEach(n => n.style.animation = 'none'); s.scrollTop = y;
  if (active === 'cuadro') moveBracket(false);
  refreshHeader();
}
function setClock(i) {
  clockIdx = Math.max(0, Math.min(clockKeys.length - 1, i));
  NOW = keyToMs(clockKeys[clockIdx], DEMO_KICK_HOUR);
  dayTab = 1;
  build(); loadPicks(); rerender();
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.tab) return go(t.dataset.tab);
  if (t.dataset.amode) { authMode = t.dataset.amode; authErr = ''; return renderAuth('login'); }
  if (t.dataset.alogin) return startSession(t.dataset.alogin === 'google' ? { nombre: 'Usuario', apodo: 'Vos', email: 'vos@ejemplo.com' } : { apodo: 'Vos' }, true);
  if (t.dataset.ob) { if (t.dataset.ob === 'next' && obStep < 2) { obStep++; return renderAuth('onboarding'); } hideAuth(); return toast(`¡Listo, ${userName()}! A pronosticar`); }
  if (t.hasAttribute('data-logout')) { user = null; saveUser(); authMode = 'login'; authErr = ''; showAuth('login'); return; }
  if (t.dataset.day) { dayTab = +t.dataset.day; return rerender(); }
  if (t.dataset.clock) return setClock(clockIdx + +t.dataset.clock);
  if (t.dataset.ph) { bStart = Math.min(+t.dataset.ph, 3); return moveBracket(true); }
  if (t.dataset.pick) return openSheet(+t.dataset.pick);
  if (t.dataset.gjump) { const g = $('g-' + t.dataset.gjump); if (g) $('s-grupos').scrollTo({ top: g.offsetTop - 8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
  if (t.dataset.step && edit) {
    const side = t.dataset.step[0], d = t.dataset.step[1] === '+' ? 1 : -1;
    edit[side] = Math.max(0, Math.min(15, edit[side] + d));
    $('v' + side).textContent = edit[side]; syncTie(); return;
  }
  if (t.dataset.pen && edit) {
    edit.pen = t.dataset.pen;
    $('tieOpts').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.pen === edit.pen));
    return;
  }
  if (t.id === 'save' && edit) {
    if (edit.ko && edit.a === edit.b && !edit.pen) { toast('Elegí quién pasa por penales'); return; }
    picks[edit.id] = { a: edit.a, b: edit.b, ...(edit.ko && edit.a === edit.b ? { pen: edit.pen } : {}) };
    try { const saved = JSON.parse(localStorage.getItem(PICKS_KEY) || '{}'); saved[edit.id] = picks[edit.id]; localStorage.setItem(PICKS_KEY, JSON.stringify(saved)); } catch (e) {}
    closeSheet(); rerender(); toast('Pronóstico guardado'); return;
  }
  if (t.dataset.book) { booked[t.dataset.book] = true; rerender(); toast(`Mesa reservada para las ${timeLabel(M[t.dataset.book].t - 30 * 60e3)} (demo)`); return; }
  if (t.id === 'invite') { toast('Link copiado (demo)'); return; }
});
$('scrim').addEventListener('click', closeSheet);
document.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'authForm') return submitAuth(e.target);
  if (e.target.id === 'profForm') {
    const f = Object.fromEntries(new FormData(e.target));
    user = { ...user, ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, String(v).trim()])) };
    if (!user.apodo) user.apodo = user.nombre;
    saveUser(); rerender(); toast('Datos guardados');
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && edit) closeSheet(); });
window.addEventListener('resize', () => moveBracket(false));

/* ── Arranque ── */
(async function boot() {
  try {
    const [d, r] = await Promise.all([fetch(DATA_URL).then(x => x.json()), fetch(RESULTS_URL).then(x => x.json())]);
    D = d; FILE_RESULTS = r.results || {};
  } catch (e) {
    $('s-hoy').innerHTML = '<p class="note">No pude cargar los datos. Abrí esta página desde un servidor (no con doble clic).</p>';
    return;
  }
  DEMO = Object.keys(FILE_RESULTS).length === 0;
  build();
  const q = new URLSearchParams(location.search).get('now');
  const qk = q ? dayKey(Date.parse(q)) : null;
  // demo: arranca el 18/6; con resultados reales: arranca tras la final (torneo completo)
  const EMBED = document.body.classList.contains('embed');   // en la tarjeta de la web abre en una fecha con varios partidos
  clockIdx = qk && clockKeys.includes(qk) ? clockKeys.indexOf(qk) : EMBED ? clockKeys.indexOf('2026-06-24') : DEMO ? Math.max(0, clockKeys.indexOf('2026-06-18')) : clockKeys.length - 1;
  NOW = keyToMs(clockKeys[clockIdx], DEMO_KICK_HOUR);
  loadUser();
  build(); loadPicks();
  dayTab = daysSplit()[1].length ? 1 : 0;
  refreshHeader();
  renderHoy();
  if (!user && !new URLSearchParams(location.search).has('noauth')) showAuth('login');
})();
