(() => {
    'use strict';

    // Fade-in de página
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));

    // Navbar sombra + botón "arriba" con anillo de progreso (un listener pasivo, throttled con rAF)
    const navbar = document.querySelector('.navbar');
    const topBtn = document.getElementById('goTopBtn');
    const bar = topBtn.querySelector('.gt-bar');
    const CIRC = 2 * Math.PI * 21;
    let ticking = false;
    const onScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const show = y > 400;
        navbar.classList.toggle('navbar-scrolled', y > 60);
        topBtn.classList.toggle('visible', show);
        topBtn.tabIndex = show ? 0 : -1;
        // sube el botón cuando entra el footer para no taparlo
        const f = document.getElementById('footer').getBoundingClientRect();
        topBtn.style.setProperty('--lift', Math.max(0, window.innerHeight - f.top) + 'px');
        bar.style.strokeDashoffset = CIRC * (1 - Math.min(1, max > 0 ? y / max : 0));
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener('click', () => {
        if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        document.getElementById('top').focus({ preventScroll: true });
    });

    // Cierra el menú móvil al elegir una sección
    const menu = document.getElementById('navbarNav');
    menu.addEventListener('click', (e) => {
        if (e.target.closest('.nav-link') && menu.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
    });

    // Animaciones al hacer scroll: GSAP + ScrollTrigger (fallback: IntersectionObserver)
    const els = document.querySelectorAll('[data-animate]');
    const revealAll = () => els.forEach((el) => el.classList.add('animate-visible'));

    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();

        // Scroll fluido (Lenis) solo en desktop con mouse y sin "reducir movimiento"
        mm.add('(prefers-reduced-motion: no-preference) and (hover: hover)', () => {
            if (!window.Lenis) return;
            const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: false });
            lenis.on('scroll', ScrollTrigger.update);
            const tick = (t) => lenis.raf(t * 1000);
            gsap.ticker.add(tick);
            gsap.ticker.lagSmoothing(0);

            const goTo = (target) => lenis.scrollTo(target, { offset: target === 0 ? 0 : -64, duration: 1.3 });
            const onClick = (e) => {
                const a = e.target.closest('a[href^="#"]');
                if (!a) return;
                const id = a.getAttribute('href').slice(1);
                const el = id ? document.getElementById(id) : null;
                if (!el) return;
                e.preventDefault();
                goTo(id === 'top' ? 0 : el);
            };
            document.addEventListener('click', onClick);
            window.__lenis = lenis;

            return () => {
                document.removeEventListener('click', onClick);
                gsap.ticker.remove(tick);
                lenis.destroy();
                window.__lenis = null;
            };
        });

        mm.add('(prefers-reduced-motion: reduce)', () => {
            revealAll();
        });

        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const wide = window.matchMedia('(min-width: 768px)').matches;

            // Reveal de cada bloque; en celular los laterales entran desde abajo
            els.forEach((el) => {
                const type = el.dataset.animate;
                const from = { autoAlpha: 0 };
                if (type === 'fade-left' && wide) from.x = -60;
                else if (type === 'fade-right' && wide) from.x = 60;
                else from.y = type === 'fade-up' ? 50 : 35;
                gsap.fromTo(el, from, {
                    autoAlpha: 1, x: 0, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                });
            });

            // Hero: el contenido sube y se desvanece mientras scrolleás
            gsap.to('.hero-inner', {
                yPercent: -18, opacity: 0.15, ease: 'none',
                scrollTrigger: { trigger: '.home', start: 'top top', end: 'bottom top', scrub: true },
            });

            // Parallax por transform (barato, sin repintar): solo con mouse
            if (window.matchMedia('(hover: hover)').matches) {
                gsap.fromTo('.home-bg', { yPercent: -6 }, {
                    yPercent: 8, ease: 'none',
                    scrollTrigger: { trigger: '.home', start: 'top top', end: 'bottom top', scrub: true },
                });
                gsap.fromTo('.banner-bg', { yPercent: -12 }, {
                    yPercent: 12, ease: 'none',
                    scrollTrigger: { trigger: '.banner', start: 'top bottom', end: 'bottom top', scrub: true },
                });
            }

            // Las imágenes lazy cambian el alto de la página: recalcular posiciones
            window.addEventListener('load', () => ScrollTrigger.refresh());
        });
    } else if ('IntersectionObserver' in window) {
        document.documentElement.classList.add('no-gsap');
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('animate-visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        els.forEach((el) => io.observe(el));
    } else {
        revealAll();
    }

    // Formulario (sin jQuery ni SweetAlert)
    const form = document.getElementById('formulario');
    const status = document.getElementById('form-status');
    const setStatus = (msg, ok) => {
        status.textContent = msg;
        status.className = 'form-status ' + (ok ? 'ok' : 'err');
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        if (form.dataset.demo !== undefined) {
            setStatus('Demo: el formulario está desactivado en esta versión de portfolio.', true);
            form.reset();
            return;
        }
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        setStatus('Enviando…', true);
        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' },
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                setStatus('¡Gracias! Recibimos tu consulta y te respondemos en menos de 24 hs.', true);
                form.reset();
            } else {
                setStatus(data.error || 'No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.', false);
            }
        } catch {
            setStatus('No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.', false);
        } finally {
            btn.disabled = false;
        }
    });
})();
