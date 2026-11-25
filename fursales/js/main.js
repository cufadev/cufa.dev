(() => {
    'use strict';

    const nav = document.getElementById('nav');
    const menu = document.getElementById('menu');
    const burger = document.getElementById('burger');
    const topBtn = document.getElementById('goTopBtn');
    const bar = topBtn.querySelector('.gt-bar');
    const footer = document.getElementById('footer');
    const CIRC = 2 * Math.PI * 21;

    // Menú móvil
    const setMenu = (open) => {
        menu.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1061px)').addEventListener('change', () => setMenu(false));

    // Scroll: sombra del menú, botón "arriba" con progreso y flotantes que suben al llegar al footer
    let ticking = false;
    const onScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        nav.classList.toggle('scrolled', y > 10);
        const show = y > 500;
        topBtn.classList.toggle('visible', show);
        topBtn.tabIndex = show ? 0 : -1;
        bar.style.strokeDashoffset = CIRC * (1 - Math.min(1, max > 0 ? y / max : 0));
        const f = footer.getBoundingClientRect();
        document.documentElement.style.setProperty('--lift', Math.max(0, window.innerHeight - f.top) + 'px');
        ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Reveal al scrollear (escalonado dentro de cada grupo)
    const items = document.querySelectorAll('.reveal');
    const useGsap = !!(window.gsap && window.ScrollTrigger) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const groups = new Map();
    items.forEach((el) => {
        const g = el.parentElement;
        const n = groups.get(g) || 0;
        el.style.setProperty('--d', Math.min(n, 5) * 90 + 'ms');
        groups.set(g, n + 1);
    });
    if (useGsap) {
        document.documentElement.classList.add('gsap-on');
        initGsap();
    } else if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (!en.isIntersecting) return;
                en.target.classList.add('in');
                io.unobserve(en.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach((el) => io.observe(el));
    } else {
        items.forEach((el) => el.classList.add('in'));
    }

    // GSAP + ScrollTrigger + Lenis (scroll fluido, reveals escalonados y parallax por transform)
    function initGsap() {
        gsap.registerPlugin(ScrollTrigger);
        const fine = window.matchMedia('(hover: hover)').matches;

        // Scroll suave solo con mouse; en táctiles se deja el nativo
        if (fine && window.Lenis) {
            const lenis = new Lenis({ lerp: 0.1, anchors: false });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((t) => lenis.raf(t * 1000));
            gsap.ticker.lagSmoothing(0);
            window.__lenis = lenis;
            document.addEventListener('click', (e) => {
                const a = e.target.closest('a[href^="#"]');
                if (!a) return;
                const id = a.getAttribute('href').slice(1);
                const el = id ? document.getElementById(id) : null;
                if (!el) return;
                e.preventDefault();
                lenis.scrollTo(el, { offset: -72, duration: 1.3 });
            });
            topBtn.addEventListener('click', (e) => { e.stopImmediatePropagation(); lenis.scrollTo(0, { duration: 1.4 }); }, true);
        }

        // Reveal escalonado por grupo
        const byParent = new Map();
        items.forEach((el) => { const g = el.parentElement; byParent.set(g, [...(byParent.get(g) || []), el]); });
        byParent.forEach((els) => {
            gsap.set(els, { autoAlpha: 0, y: 40 });
            ScrollTrigger.batch(els, {
                start: 'top 88%', once: true,
                onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, overwrite: true }),
            });
        });

        // Hero: entrada y parallax suave al scrollear
        gsap.from('.hero-copy > *', { autoAlpha: 0, y: 30, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.1 });
        gsap.from('.hero-photo', { autoAlpha: 0, y: 40, scale: 0.97, duration: 1.2, ease: 'power3.out', delay: 0.25 });
        if (fine) {
            gsap.to('.hero-copy', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
            gsap.to('.hero-photo img', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
            // Fotos de las tarjetas: parallax interno
            gsap.utils.toArray('.card-photo').forEach((card) => {
                const img = card.querySelector(':scope > img');
                gsap.fromTo(img, { scale: 1.18, yPercent: -7 }, {
                    yPercent: 7, ease: 'none',
                    scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
                });
            });
        }
        window.addEventListener('load', () => ScrollTrigger.refresh());
    }

    // Las tarjetas de servicio preseleccionan el tipo de seguro en el formulario
    document.querySelectorAll('[data-type]').forEach((a) => {
        a.addEventListener('click', () => {
            const r = document.querySelector(`input[name="tipo"][value="${a.dataset.type}"]`);
            if (r) r.checked = true;
        });
    });

    // Formulario
    const form = document.getElementById('quote-form');
    const status = document.getElementById('form-status');
    const setStatus = (msg, ok) => { status.textContent = msg; status.className = 'form-status ' + (ok ? 'ok' : 'err'); };

    // Campos extra según el tipo: auto/moto -> nuevo o usado; comercio -> rubro
    const exVeh = document.getElementById('extra-vehiculo');
    const exCom = document.getElementById('extra-comercio');
    const rubro = document.getElementById('rubro');
    const info = document.getElementById('info');
    const hints = {
        auto: 'Marca, modelo, año y cobertura que buscás…',
        moto: 'Marca, modelo, año y cobertura que buscás…',
        hogar: 'Tipo de vivienda, ubicación y qué querés cubrir…',
        comercio: 'Dirección, metros cuadrados y qué querés cubrir…',
        vida: 'Edad, y si es para vos o para tu familia…',
    };
    const syncType = () => {
        const t = form.elements.tipo.value;
        const veh = t === 'auto' || t === 'moto';
        exVeh.hidden = !veh; exVeh.disabled = !veh;
        exCom.hidden = t !== 'comercio'; rubro.disabled = t !== 'comercio';
        exVeh.classList.remove('invalid'); exCom.classList.remove('invalid');
        info.placeholder = hints[t] || '';
    };
    form.querySelectorAll('input[name="tipo"]').forEach((r) => r.addEventListener('change', syncType));
    form.addEventListener('reset', () => setTimeout(syncType));
    document.querySelectorAll('[data-type]').forEach((a) => a.addEventListener('click', () => setTimeout(syncType)));
    syncType();

    const rules = {
        nombre: (v) => v.trim().length >= 2 || 'Ingresá tu nombre.',
        tel: (v) => { const d = v.replace(/\D/g, ''); return (d.length >= 8 && d.length <= 13 && !/^(\d)\1+$/.test(d)) || 'Ingresá un teléfono válido, con código de área.'; },
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Ingresá un email válido.',
    };
    const validate = () => {
        let ok = true;
        Object.keys(rules).forEach((name) => {
            const input = form.elements[name];
            const field = input.closest('.field');
            let err = field.querySelector('.err');
            if (!err) { err = document.createElement('span'); err.className = 'err'; field.appendChild(err); }
            const res = rules[name](input.value);
            field.classList.toggle('invalid', res !== true);
            err.textContent = res === true ? '' : res;
            if (res !== true) ok = false;
        });
        if (!exVeh.hidden) {
            const bad = !form.elements.estado.value;
            exVeh.classList.toggle('invalid', bad);
            document.getElementById('estado-err').textContent = bad ? 'Elegí si es nuevo o usado.' : '';
            if (bad) ok = false;
        }
        if (!exCom.hidden) {
            const bad = rubro.value.trim().length < 2;
            exCom.classList.toggle('invalid', bad);
            let err = exCom.querySelector('.err');
            if (!err) { err = document.createElement('span'); err.className = 'err'; exCom.appendChild(err); }
            err.textContent = bad ? 'Contanos el rubro de tu comercio.' : '';
            if (bad) ok = false;
        }
        return ok;
    };
    form.addEventListener('input', (e) => { const x = e.target.closest('.extra'); if (x) x.classList.remove('invalid'); });
    form.addEventListener('input', (e) => { const f = e.target.closest('.field'); if (f) f.classList.remove('invalid'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        status.textContent = '';
        if (!validate()) {
            const first = form.querySelector('.invalid input:not([disabled])');
            if (first) first.focus();
            return;
        }
        if (form.elements.web.value) return; // honeypot
        // Versión de portfolio: no se envía nada
        if (form.dataset.demo !== undefined) {
            setStatus('¡Listo! Esto es una demo: en la versión real, tu consulta le llegaría a Gonzalez Furchi.', true);
            form.reset();
            return;
        }
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        setStatus('Enviando…', true);
        try {
            const res = await fetch('send.php', { method: 'POST', body: new FormData(form) });
            if (!res.ok) throw new Error();
            setStatus('¡Gracias! Recibimos tu consulta y te contactamos pronto.', true);
            form.reset();
        } catch {
            setStatus('No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.', false);
        } finally {
            btn.disabled = false;
        }
    });
})();
