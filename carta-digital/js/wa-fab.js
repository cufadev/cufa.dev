/* Botón flotante de WhatsApp: aparece al salir de la portada y se esconde
   cuando ya se ve el bloque de contacto (que tiene su propio botón). */
(() => {
  const fab = document.querySelector('.wa-fab');
  const hero = document.querySelector('.hero');
  const cta = document.querySelector('#contacto');
  if (!fab || !hero || !cta || !('IntersectionObserver' in window)) return;

  const seen = new Set();
  const update = () => fab.classList.toggle('is-visible', seen.size === 0);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
    update();
  });
  io.observe(hero);
  io.observe(cta);
})();
