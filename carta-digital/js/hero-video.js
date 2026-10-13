/* El video de la portada no se reproduce solo si la persona pidió menos movimiento:
   queda el primer cuadro (poster) y la página se entiende igual. */
(() => {
  const video = document.querySelector('.iphone video');
  if (!video) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => {
    if (!reduce.matches) return;
    video.removeAttribute('autoplay');
    video.loop = false;
    video.pause();
    video.currentTime = 0;
  };
  apply();
  if (reduce.addEventListener) reduce.addEventListener('change', apply);
})();
