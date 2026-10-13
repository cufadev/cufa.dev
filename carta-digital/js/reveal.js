/* Reveal al scrollear: fade + 16 px de desplazamiento, escalonado entre hermanos.
   Solo marca lo que está fuera de pantalla al cargar, así no hay parpadeos ni contenido oculto sin JS. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    'section > .tag, section > h2, section > .sub, .pain, .step, .demo, .feat > div, .plan, .maint, .fine, .cta'
  );

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  targets.forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight) return;
    const siblings = [...el.parentElement.children].filter((c) => c.matches('.pain,.step,.demo,.plan,div'));
    const i = Math.max(0, siblings.indexOf(el));
    el.style.setProperty('--d', Math.min(i, 3) * 70 + 'ms');
    el.classList.add('reveal');
    io.observe(el);
  });
})();
