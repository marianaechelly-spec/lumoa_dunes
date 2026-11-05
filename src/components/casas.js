/* Casas e projetos: seletor de modelo, galeria de fachadas e plantas */
(function (L) {
  const { $, $$, h, esc, scrollToId } = L.ui;

  L.houses = {
    state: { id: 'dunas', tab: 'fachadas', idx: 0, floor: 0 },

    init() {
      this.picker = $('#modelPicker');
      this.root = $('#house');
      if (!this.root) return;
      L.data.casas.forEach((c) => {
        const b = h('button', { class: 'model', type: 'button', role: 'tab', 'data-id': c.id, 'aria-controls': 'house' },
          h('span', { class: 'model__name' }, c.nome),
          h('span', { class: 'model__type' }, `${c.tipo} · ${c.suites} suítes`),
          h('span', { class: 'model__area', html: `${c.area}<small>m²</small>` }));
        b.addEventListener('click', () => this.show(c.id));
        this.picker.append(b);
      });
      this.show('dunas', { silent: true });
    },

    show(id, opts = {}) {
      const c = L.findCasa(id);
      if (!c) return;
      const sameHouse = this.state.id === id && this.root.childElementCount;
      this.state.id = id;
      if (!sameHouse || opts.tab) { this.state.tab = opts.tab || 'fachadas'; this.state.idx = 0; this.state.floor = opts.floor || 0; }
      if (opts.floor != null) this.state.floor = opts.floor;
      $$('.model', this.picker).forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
      this.render(c);
      if (!opts.silent) L.bus.dispatchEvent(new CustomEvent('house-select', { detail: id }));
    },

    items(c) {
      if (this.state.tab === 'plantas') return c.plantas.map((p) => ({ src: p.src, legenda: `${c.nome} — ${p.titulo}`, plan: true }));
      if (this.state.tab === 'interiores') return L.data.interiores.map((x) => ({ ...x, legenda: x.legenda + ' (perspectiva ilustrativa)' }));
      return c.imagens;
    },

    render(c) {
      const s = this.state;
      const items = this.items(c);
      if (s.tab === 'plantas') s.idx = s.floor;
      const cur = items[s.idx] || items[0];

      const tabs = h('div', { class: 'viewer__tabs', role: 'tablist' },
        ...[['fachadas', 'Fachadas'], ['plantas', c.plantas.length > 1 ? 'Plantas' : 'Planta baixa'], ['interiores', 'Interiores']].map(([k, label]) =>
          h('button', { type: 'button', class: s.tab === k ? 'is-on' : '', role: 'tab', 'aria-selected': String(s.tab === k), onclick: () => { s.tab = k; s.idx = 0; s.floor = 0; this.render(c); } }, label)));

      const img = h('img', { src: L.img(cur.src), alt: cur.legenda, class: cur.plan ? 'is-plan' : '' });
      const stage = h('div', { class: 'stage' }, img,
        h('span', { class: 'stage__cap' }, cur.legenda),
        h('button', { class: 'tool stage__zoom', type: 'button', 'aria-label': 'Ampliar imagem', html: '<svg><use href="#i-expand"/></svg>', onclick: () => L.lightbox.open(items, s.idx) }));
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => L.lightbox.open(items, s.idx));
      if (items.length > 1) {
        stage.append(h('div', { class: 'stage__nav' },
          h('button', { class: 'tool', type: 'button', 'aria-label': 'Anterior', html: '<svg><use href="#i-arrow-l"/></svg>', onclick: () => this.go(c, -1) }),
          h('button', { class: 'tool', type: 'button', 'aria-label': 'Próxima', html: '<svg><use href="#i-arrow"/></svg>', onclick: () => this.go(c, 1) })));
      }
      // Gestos de arrastar no celular
      let x0 = null;
      stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) this.go(c, dx < 0 ? 1 : -1); x0 = null; });

      let lower;
      if (s.tab === 'plantas') {
        lower = c.plantas.length > 1
          ? h('div', { class: 'floor-switch' }, ...c.plantas.map((p, i) => h('button', { class: 'chip' + (i === s.floor ? ' is-on' : ''), type: 'button', onclick: () => { s.floor = i; this.render(c); } }, p.titulo)))
          : h('div', { class: 'floor-switch' }, h('span', { class: 'chip is-on' }, c.plantas[0].titulo));
      } else {
        lower = h('div', { class: 'thumbs' }, ...items.map((it, i) => {
          const b = h('button', { type: 'button', class: i === s.idx ? 'is-on' : '', 'aria-label': it.legenda }, h('img', { src: L.img(it.src, true), alt: '', loading: 'lazy' }));
          b.addEventListener('click', () => { s.idx = i; this.render(c); });
          return b;
        }));
      }
      const viewer = h('div', { class: 'viewer' }, tabs, stage, lower);

      // Ficha técnica
      const planta = c.plantas[s.tab === 'plantas' ? s.floor : 0];
      const rooms = h('dl', { class: 'rooms' }, ...planta.ambientes.map(([n, a]) => h('div', null, h('dt', null, n), h('dd', null, a))));
      const spec = h('aside', { class: 'spec' },
        h('span', { class: 'eyebrow' }, c.tipo),
        h('h3', { class: 'spec__name' }, c.nome),
        h('p', { class: 'spec__summary' }, c.resumo),
        h('div', { class: 'spec__kpis' },
          h('div', null, h('strong', null, String(c.suites)), h('span', null, 'Suítes')),
          h('div', null, h('strong', null, c.area), h('span', null, 'm² de área')),
          h('div', null, h('strong', null, c.id === 'estrela' ? '2' : '1'), h('span', null, c.id === 'estrela' ? 'Pavimentos' : 'Pav. + rooftop'))),
        h('span', { class: 'rooms-title' }, `Ambientes · ${planta.titulo}`),
        rooms,
        h('div', { class: 'spec__actions' },
          h('button', { class: 'btn btn--dark btn--sm', type: 'button', onclick: () => L.luna.ask('casa-' + c.id) }, 'Perguntar à Luna'),
          h('button', { class: 'btn btn--line btn--sm', type: 'button', onclick: () => { L.contact.prefill(c.nome); scrollToId('contato'); } }, 'Tenho interesse')));

      this.root.replaceChildren(viewer, spec);
    },

    go(c, d) {
      const s = this.state;
      const n = this.items(c).length;
      if (s.tab === 'plantas') { s.floor = (s.floor + d + n) % n; }
      else s.idx = (s.idx + d + n) % n;
      this.render(c);
    },
  };
})(window.Lumoa);
