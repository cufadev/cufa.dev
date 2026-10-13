/* FAQs: anima el despliegue/contracción de <details> (Web Animations API).
   Sin JS o con movimiento reducido, <details> funciona igual de forma nativa. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 300;
  const EASING = 'cubic-bezier(.23,1,.32,1)';

  document.querySelectorAll('details').forEach((details) => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('p');
    if (!summary || !body) return;

    let anim = null;

    const run = (from, to, onDone) => {
      if (anim) anim.cancel();
      details.style.overflow = 'hidden';
      anim = details.animate(
        { height: [from + 'px', to + 'px'] },
        { duration: DURATION, easing: EASING }
      );
      anim.onfinish = () => {
        anim = null;
        details.style.height = details.style.overflow = '';
        onDone();
      };
      anim.oncancel = () => { anim = null; };
    };

    const open = () => {
      const from = details.offsetHeight;
      details.open = true;
      details.dataset.state = 'open';
      run(from, from + body.offsetHeight + parseFloat(getComputedStyle(body).marginTop), () => {});
    };

    const close = () => {
      const from = details.offsetHeight;
      details.dataset.state = 'closing';
      run(from, from - body.offsetHeight - parseFloat(getComputedStyle(body).marginTop), () => {
        details.open = false;
        delete details.dataset.state;
      });
    };

    summary.addEventListener('click', (e) => {
      if (reduce.matches) return;
      e.preventDefault();
      const isOpen = details.open && details.dataset.state !== 'closing';
      isOpen ? close() : open();
    });
  });
})();
