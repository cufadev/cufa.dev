/* Demo en vivo: la planilla de ejemplo cambia la carta del celular.
   El HTML ya trae todo pintado; sin JS se ve el ejemplo estático. */
(() => {
  const root = document.querySelector('#planilla');
  if (!root) return;

  const rows = [...root.querySelectorAll('tbody tr[data-id]')];
  const items = new Map([...root.querySelectorAll('.menu li[data-id]')].map((li) => [li.dataset.id, li]));
  const status = root.querySelector('#live-status');
  const empty = root.querySelector('.menu__empty');
  const reset = root.querySelector('#live-reset');
  const firstInput = rows[0] && rows[0].querySelector('input');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const money = (digits) => (digits ? '$' + Number(digits).toLocaleString('es-AR') : '');
  const say = (text) => {
    status.textContent = '';
    requestAnimationFrame(() => { status.textContent = text; });
  };
  const flash = (li) => {
    if (reduce.matches) return;
    li.classList.remove('flash');
    void li.offsetWidth;
    li.classList.add('flash');
  };
  const refreshEmpty = () => { empty.hidden = !!root.querySelector('.menu li:not(.is-off)'); };
  const touched = () => {
    if (firstInput) firstInput.classList.remove('hint');
    reset.hidden = false;
  };

  const initial = rows.map((tr) => ({
    tr,
    li: items.get(tr.dataset.id),
    input: tr.querySelector('input'),
    sw: tr.querySelector('[role="switch"]'),
    name: tr.querySelector('.name').textContent.trim(),
    price: tr.querySelector('input').value,
  }));

  function setAvailable(row, on) {
    row.sw.setAttribute('aria-checked', String(on));
    row.sw.textContent = on ? 'SI' : 'NO';
    row.tr.classList.toggle('is-off', !on);
    row.li.classList.toggle('is-off', !on);
    row.li.toggleAttribute('inert', !on);
  }

  initial.forEach((row) => {
    row.input.readOnly = false;

    row.input.addEventListener('input', () => {
      const digits = row.input.value.replace(/\D/g, '').slice(0, 6);
      if (digits !== row.input.value) row.input.value = digits;
      row.li.querySelector('.menu__price').textContent = money(digits);
      flash(row.li);
      touched();
    });

    row.sw.addEventListener('click', () => {
      const on = row.sw.getAttribute('aria-checked') !== 'true';
      setAvailable(row, on);
      refreshEmpty();
      say(row.name + (on ? ' vuelve a aparecer en la carta.' : ' ya no aparece en la carta.'));
      touched();
    });
  });

  reset.addEventListener('click', () => {
    initial.forEach((row) => {
      row.input.value = row.price;
      row.li.querySelector('.menu__price').textContent = money(row.price);
      setAvailable(row, true);
    });
    refreshEmpty();
    reset.hidden = true;
    say('Planilla y carta vueltas al ejemplo original.');
  });

  root.classList.add('is-live');
  if (firstInput && !reduce.matches) firstInput.classList.add('hint');
})();
