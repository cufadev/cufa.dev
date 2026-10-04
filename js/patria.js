/* ── FECHAS PATRIAS ──
   En cada fecha patria aparece una escarapela al lado del logo, al estilo de
   los doodles. Al tocarla abre el artículo de Wikipedia de esa fecha.
   Se decide por la fecha de Argentina (no la del visitante). Para probar:
   ?patria=25-05 en cualquier página. */
(() => {
  const FECHAS = {
    // fecha: [día, qué se conmemora, artículo de es.wikipedia.org, dibujo (escarapela por defecto)]
    '02-04': ['2 de Abril', 'Malvinas Argentinas', 'Día del Veterano y de los Caídos en la Guerra de Malvinas', 'malvinas'],
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
      width: 26px; height: 40px; transform: translateY(calc(-38% - 5px));
      text-decoration: none; cursor: pointer; outline-offset: 3px;
    }
    .patria-escarapela svg { width: 100%; height: 100%; overflow: visible; display: block; }
    .patria-cinta { transform-origin: 13px 18px; animation: patria-viento 2.6s ease-in-out infinite; }
    .patria-cinta--b { animation-delay: -1.3s; }
    .patria-roseta { transform-origin: 13px 13px; animation: patria-latido 5s ease-in-out infinite; }
    .patria-escarapela--malvinas { width: 48px; height: 33px; transform: translateY(-55%); }
    .patria-ola { animation: patria-ola 3.2s ease-in-out infinite; }
    .patria-ola--b { animation-delay: -1.6s; }
    @keyframes patria-ola {
      0%, 100% { transform: translateX(0); opacity: 0.85; }
      50% { transform: translateX(2px); opacity: 0.45; }
    }
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
      .patria-cinta, .patria-roseta, .patria-ola { animation: none; }
    }`;

  // roseta celeste y blanca + dos cintas que se mueven con el viento
  const escarapela = `
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

  // silueta de las islas (Natural Earth 1:50m, dominio público) + olas
  const malvinas = `
    <svg viewBox="0 0 36 24.5" aria-hidden="true">
      <path fill="#74acdf" stroke="#fff" stroke-width="0.35" stroke-linejoin="round"
        d="M24.3 1.0 L25.8 2.0 L27.8 1.6 L28.6 1.9 L29.0 2.7 L28.8 3.4 L28.1 3.3 L27.6 3.5 L27.7 4.5 L28.1 4.9 L30.1 6.0 L30.5 6.1 L30.4 5.6 L30.1 4.9 L30.0 4.1 L30.3 3.4 L30.8 3.2 L33.1 2.9 L33.7 3.2 L34.8 5.1 L33.7 5.3 L33.3 6.1 L34.2 6.5 L35.0 7.0 L34.6 7.8 L34.5 8.2 L32.8 8.7 L31.4 9.1 L30.7 10.0 L29.5 10.7 L26.0 11.9 L26.4 12.9 L26.4 13.3 L26.3 14.6 L21.4 13.1 L20.8 13.2 L22.1 15.8 L21.1 16.2 L20.2 15.9 L19.3 16.2 L18.7 18.0 L17.4 16.8 L16.2 15.1 L16.2 14.2 L17.3 12.5 L17.0 11.7 L19.6 9.4 L20.1 8.6 L20.9 8.2 L21.8 8.1 L22.1 7.8 L22.1 7.2 L21.7 6.2 L21.8 4.6 L23.9 2.4 L23.6 1.0 L24.3 1.0Z M9.7 4.1 L11.2 4.5 L12.5 3.3 L13.5 2.9 L14.2 3.2 L14.8 3.9 L15.5 3.8 L17.7 3.1 L18.0 3.3 L18.8 2.5 L19.5 2.9 L20.0 3.6 L19.8 4.4 L19.2 4.9 L18.8 5.7 L18.3 6.3 L17.5 6.8 L16.9 7.7 L15.5 9.8 L13.4 12.4 L12.7 12.7 L11.3 12.8 L10.6 12.7 L10.1 12.7 L9.7 14.2 L9.0 15.2 L8.7 15.5 L8.0 15.6 L7.7 15.7 L7.5 16.1 L5.7 16.0 L4.4 15.4 L2.9 13.9 L4.9 12.1 L6.6 12.2 L8.0 10.9 L9.2 10.3 L9.7 9.7 L10.2 9.2 L10.2 8.6 L9.8 8.3 L9.3 8.3 L8.8 8.6 L7.5 9.0 L6.7 8.2 L7.3 8.0 L7.9 8.0 L9.8 7.3 L10.1 7.0 L9.5 6.1 L8.4 5.5 L7.5 4.5 L7.3 4.2 L7.4 3.6 L6.8 2.4 L7.4 2.4 L8.1 3.1 L9.7 4.1Z M2.3 9.4 L3.0 9.7 L3.7 9.6 L3.3 11.3 L3.0 12.1 L2.1 12.0 L1.3 10.9 L1.0 10.3 L1.9 9.9 L2.3 9.4Z M28.4 13.1 L28.5 14.6 L27.7 14.1 L27.4 13.4 L27.8 12.9 L28.2 13.0 L28.4 13.1Z M11.5 3.1 L10.1 3.1 L9.8 2.5 L9.8 1.2 L10.9 1.1 L11.9 1.6 L11.8 2.2 L11.5 3.1Z M15.8 16.7 L15.2 17.0 L15.0 16.9 L14.8 16.3 L14.8 15.5 L14.7 15.1 L15.1 15.3 L15.8 15.9 L15.8 16.7Z"/>
      <g fill="none" stroke="#74acdf" stroke-width="0.8" stroke-linecap="round">
        <path class="patria-ola" d="M4 22 q1.5 -1.2 3 0 t3 0 t3 0"/>
        <path class="patria-ola patria-ola--b" d="M20 23.2 q1.5 -1.2 3 0 t3 0 t3 0"/>
      </g>
    </svg>`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const logo = document.querySelector('.nav-logo');
  if (!logo) return;
  const esc = document.createElement('span');
  const dibujo = fecha[3] || 'escarapela';
  esc.className = 'patria-escarapela patria-escarapela--' + dibujo;
  esc.tabIndex = 0;
  esc.setAttribute('role', 'link');
  esc.setAttribute('aria-label', `${fecha[0]}: ${fecha[1]}. Ver en Wikipedia`);
  esc.innerHTML = (dibujo === 'malvinas' ? malvinas : escarapela) + `<span class="patria-tip"><b>${fecha[0]}</b> · ${fecha[1]}<i>Ver en Wikipedia ↗</i></span>`;
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
