/* Lazer: trilho horizontal com os espaços fotografados no catálogo
   + lista da infraestrutura (todos os 13 itens numerados da implantação) */
(function (L) {
  const { $, h, scrollToId } = L.ui;
  const RAIL = ['piscina', 'rooftop', 'beach-tennis', 'playground', 'petplay', 'redario', 'guarderia', 'portaria'];
  const LIST = ['gazebo', 'churrasqueira', 'recarga', 'area-tecnica', 'estacionamento'];

  L.amenities = {
    init() {
      const rail = $('#lazerRail');
      if (!rail) return;
      RAIL.forEach((id, i) => {
        const it = L.findLazer(id);
        const card = h('article', { class: 'slide', id: 'lazer-' + id },
          h('div', { class: 'slide__img' }, h('img', { src: L.img(it.img), alt: it.nome, loading: 'lazy' }), h('span', { class: 'slide__n' }, String(it.n).padStart(2, '0'))),
          h('div', { class: 'slide__body' }, h('h3', null, it.nome), h('p', null, it.desc),
            h('div', { class: 'slide__links' },
              h('button', { type: 'button', onclick: (e) => { e.stopPropagation(); L.plan.select(id); scrollToId('implantacao'); } }, 'Ver na maquete'),
              h('button', { type: 'button', onclick: (e) => { e.stopPropagation(); L.luna.ask('amenity:' + id); } }, 'Perguntar à Luna'))));
        card.querySelector('.slide__img').addEventListener('click', () => L.lightbox.open(RAIL.map((k) => { const x = L.findLazer(k); return { src: x.img, legenda: x.nome }; }), i));
        rail.append(card);
      });
      const step = () => (rail.querySelector('.slide')?.getBoundingClientRect().width || 400) + 20;
      $('#lazerPrev').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
      $('#lazerNext').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
      // arrastar com o mouse no desktop
      let down = null;
      rail.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') down = { x: e.clientX, s: rail.scrollLeft, moved: false }; });
      addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 5) down.moved = true; rail.scrollLeft = down.s - dx; });
      addEventListener('pointerup', () => { if (down && down.moved) { rail.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true }); } down = null; });

      const ul = $('#infraList');
      LIST.forEach((id) => {
        const it = L.findLazer(id);
        ul.append(h('li', null, h('b', null, String(it.n).padStart(2, '0')), h('strong', null, it.nome), h('p', null, it.desc),
          h('button', { type: 'button', onclick: () => { L.plan.select(id); scrollToId('implantacao'); } }, 'Ver na maquete →')));
      });
    },
  };
})(window.Lumoa);
