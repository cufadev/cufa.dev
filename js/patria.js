/* ── FECHAS PATRIAS ──
   En cada fecha patria aparece una escarapela al lado del logo, al estilo de
   los doodles. Al tocarla abre el artículo de Wikipedia de esa fecha.
   Se decide por la fecha de Argentina (no la del visitante). Para probar:
   ?patria=25-05 en cualquier página. */
(() => {
  const FECHAS = {
    // fecha: [día, qué se conmemora, artículo de es.wikipedia.org]
    '02-04': ['2 de Abril', 'Malvinas Argentinas', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'],
    '18-05': ['18 de Mayo', 'Día de la Escarapela', 'Escarapela de Argentina'],
    '25-05': ['25 de Mayo', 'Revolución de Mayo', 'Revolución de Mayo'],
    '17-06': ['17 de Junio', 'Paso a la Inmortalidad de Güemes', 'Martín Miguel de Güemes'],
    '20-06': ['20 de Junio', 'Día de la Bandera', 'Día de la Bandera (Argentina)'],
    '09-07': ['9 de Julio', 'Día de la Independencia', 'Declaración de independencia de la Argentina'],
    '17-08': ['17 de Agosto', 'Paso a la Inmortalidad de San Martín', 'José de San Martín'],
    '20-11': ['20 de Noviembre', 'Día de la Soberanía Nacional', 'Día de la Soberanía Nacional'],
  };

  const prueba = new URLSearchParams(location.search).get('patria');
  const hoy = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit',
  }).format(new Date()).replace('/', '-');
  const fecha = FECHAS[prueba || hoy];
  if (!fecha) return;

  const css = `
    .nav-logo { position: relative; }
    .patria-escarapela {
      position: absolute; left: calc(100% + 8px); top: 50%;
      width: 26px; height: 40px; transform: translateY(-38%);
      text-decoration: none; cursor: pointer; outline-offset: 3px;
    }
    .patria-escarapela svg { width: 100%; height: 100%; overflow: visible; display: block; }
    .patria-cinta { transform-origin: 13px 18px; animation: patria-viento 2.6s ease-in-out infinite; }
    .patria-cinta--b { animation-delay: -1.3s; }
    .patria-roseta { transform-origin: 13px 13px; animation: patria-latido 5s ease-in-out infinite; }
    @keyframes patria-viento {
      0%, 100% { transform: rotate(-7deg); }
      50% { transform: rotate(7deg); }
    }
    @keyframes patria-latido {
      0%, 90%, 100% { transform: scale(1); }
      95% { transform: scale(1.12); }
    }
    .patria-tip {
      position: absolute; top: calc(100% + 6px); left: -6px;
      white-space: nowrap; padding: 6px 10px;
      font: 10px/1.4 'Space Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase;
      color: #0a0a0a; background: #fff; border-top: 3px solid #74acdf;
      opacity: 0; pointer-events: none; transition: opacity 0.2s;
    }
    .patria-tip b { color: #3d7fbf; font-weight: 700; }
    .patria-tip i { display: block; font-style: normal; color: #888; margin-top: 2px; }
    .nav-logo:hover .patria-tip, .patria-escarapela:focus .patria-tip { opacity: 1; }
    @media (prefers-reduced-motion: reduce) {
      .patria-cinta, .patria-roseta { animation: none; }
    }`;

  // roseta celeste y blanca + dos cintas que se mueven con el viento
  const svg = `
    <svg viewBox="0 0 26 40" aria-hidden="true">
      <g class="patria-cinta">
        <path d="M9 18 L4 39 L8 36 L11 39 L14 19 Z" fill="#74acdf"/>
        <path d="M7.6 24 L5.5 33" stroke="#fff" stroke-width="1.6"/>
      </g>
      <g class="patria-cinta patria-cinta--b">
        <path d="M17 18 L22 39 L18 36 L15 39 L12 19 Z" fill="#74acdf"/>
        <path d="M18.4 24 L20.5 33" stroke="#fff" stroke-width="1.6"/>
      </g>
      <g class="patria-roseta">
        <circle cx="13" cy="13" r="12.5" fill="#74acdf"/>
        <circle cx="13" cy="13" r="8.5" fill="#fff"/>
        <circle cx="13" cy="13" r="4.5" fill="#74acdf"/>
        <circle cx="13" cy="13" r="12.5" fill="none" stroke="#fff" stroke-width="0.6"
          stroke-dasharray="1.2 2.1" opacity="0.7"/>
      </g>
    </svg>`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const logo = document.querySelector('.nav-logo');
  if (!logo) return;
  const esc = document.createElement('span');
  esc.className = 'patria-escarapela';
  esc.tabIndex = 0;
  esc.setAttribute('role', 'link');
  esc.setAttribute('aria-label', `${fecha[0]}: ${fecha[1]}. Ver en Wikipedia`);
  esc.innerHTML = svg + `<span class="patria-tip"><b>${fecha[0]}</b> · ${fecha[1]}<i>Ver en Wikipedia ↗</i></span>`;
  logo.appendChild(esc);

  // está dentro del link del logo: frenar ese clic y abrir Wikipedia aparte
  const wiki = 'https://es.wikipedia.org/wiki/' + encodeURIComponent(fecha[2].replace(/ /g, '_'));
  const abrir = e => {
    e.preventDefault();
    e.stopPropagation();
    window.open(wiki, '_blank', 'noopener');
  };
  esc.addEventListener('click', abrir);
  esc.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') abrir(e); });
})();
