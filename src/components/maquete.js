/* =========================================================================
   Maquete interativa do condomínio sobre a implantação humanizada
   Imagem realista vista de cima (implantacao-humanizada.webp) com zoom,
   arrastar, os 32 lotes clicáveis e os 13 espaços numerados.
   ========================================================================= */
(function (L) {
  const { $, $$, h, esc } = L.ui;
  const W = 560, H = Math.round(560 * 1536 / 1024); // proporção da implantação humanizada
  // Quadras A..D (da esquerda para a direita): [x inicial, x final, y inicial, y final] em % da imagem; 8 fileiras cada
  const COLS = [[9.5, 24.0, 20.6, 72.6], [32.5, 48.3, 20.6, 72.6], [48.6, 65.0, 20.6, 72.6], [73.6, 90.0, 22.5, 73.9]];
  const ROWS = 8;
  const P = (x, y) => [x / 100 * W, y / 100 * H];
  const lotRect = (q, r) => { const [a, b, y0, y1] = COLS[q], rh = (y1 - y0) / ROWS; return [a, y0 + r * rh, b, y0 + (r + 1) * rh]; };
  const SMIN = 0.9, SMAX = 3.2;

  const M = {
    st: { s: 1, fx: W / 2, fy: H / 2 },   // estado atual
    tg: { s: 1, fx: W / 2, fy: H / 2 },   // alvo (animação suave)
    base: 1, lastInput: 0, current: null, filter: 'todos',

    init() {
      this.view = $('#m3dView'); this.cam = $('#m3dCam'); this.world = $('#m3dWorld');
      if (!this.view) return;
      this.cam.style.width = W + 'px'; this.cam.style.height = H + 'px';
      this.build();
      this.list();
      this.controls();
      this.fit();
      addEventListener('resize', () => this.fit());
      this.loop();
      this.select('piscina', { silent: true, fly: false });
      // Visível só quando a seção está na tela (economia de bateria)
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '200px' }).observe(this.view);
      // Entrada suave: a imagem aproxima levemente ao aparecer
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io.disconnect();
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.st.s = 0.8;
      }, { threshold: 0.45 });
      io.observe(this.view);
    },

    build() {
      const w = this.world;
      w.append(h('div', { class: 'm3-floor', style: `width:${W}px;height:${H}px` }));
      // Lotes (32), áreas clicáveis sobre a imagem
      COLS.forEach((_, q) => {
        for (let r = 0; r < ROWS; r++) {
          const [a, b, c, d] = lotRect(q, r);
          const [x0, y0] = P(a, b), [x1, y1] = P(c, d);
          const info = L.lote(q, r);
          const lot = h('button', { class: 'm3-lot', type: 'button', 'data-lot': info.pos, style: `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px`, 'aria-label': `${info.titulo}, ${info.area} m², ${info.situacaoTexto}` },
            h('span', { class: 'm3-lot__tag' }, info.numero || info.pos));
          lot.addEventListener('click', (e) => { e.stopPropagation(); if (!this.dragged) this.showLot(q, r); });
          w.append(lot);
        }
      });
      // Marcadores dos espaços
      this.pins = {};
      L.data.lazer.forEach((it) => {
        const [x, y] = P(it.pos[0], it.pos[1]);
        const pin = h('div', { class: 'm3-pin', style: `left:${x}px;top:${y}px`, 'data-id': it.id, 'data-group': it.grupo },
          h('div', { class: 'm3-pin__bb', style: '--t:0px' },
            h('button', { type: 'button', class: 'm3-pin__head', 'aria-label': `${it.n}. ${it.nome}` }, String(it.n)),
            h('span', { class: 'm3-pin__name' }, it.nome)));
        pin.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); this.select(it.id); });
        this.pins[it.id] = pin;
        w.append(pin);
      });
    },

    list() {
      const ol = $('#m3dList');
      L.data.lazer.forEach((it) => {
        const b = h('button', { type: 'button', 'data-id': it.id, html: `<b>${String(it.n).padStart(2, '0')}</b>${esc(it.nome)}` });
        b.addEventListener('click', () => this.select(it.id));
        ol.append(h('li', { 'data-group': it.grupo }, b));
      });
      // Lista dos 32 lotes (acessível por teclado e no celular)
      COLS.forEach((_, q) => {
        for (let r = 0; r < ROWS; r++) {
          const lot = L.lote(q, r);
          const b = h('button', { type: 'button', 'data-lot': lot.pos },
            h('b', null, lot.pos), h('span', { class: 'm3-lotname' }, lot.numero ? `Lote ${lot.numero} · ${lot.area} m²` : `${lot.area} m²`),
            h('span', { class: 'lot-status lot-status--' + (lot.situacao || 'consulta') }, lot.situacao ? lot.situacaoTexto : 'Consultar'));
          b.addEventListener('click', () => this.showLot(q, r, { fly: true }));
          ol.append(h('li', { 'data-group': 'lotes', hidden: '' }, b));
        }
      });
      $$('[data-m3d-filter]').forEach((b) => b.addEventListener('click', () => this.setFilter(b.dataset.m3dFilter)));
      document.addEventListener('click', (e) => {
        const g = e.target.closest('[data-plan-go]');
        if (g) { this.select(g.dataset.planGo); L.ui.scrollToId('implantacao'); }
        if (e.target.closest('[data-lots-go]')) { e.preventDefault(); this.setFilter('lotes'); L.ui.scrollToId('implantacao'); }
      });
    },

    setFilter(f) {
      this.filter = f;
      $$('[data-m3d-filter]').forEach((b) => b.classList.toggle('is-on', b.dataset.m3dFilter === f));
      $$('#m3dList li').forEach((li) => li.hidden = f === 'lotes' ? li.dataset.group !== 'lotes' : !((f === 'todos' && li.dataset.group !== 'lotes') || li.dataset.group === f));
      Object.values(this.pins).forEach((p) => p.classList.toggle('is-dim', f === 'lotes' || !(f === 'todos' || p.dataset.group === f)));
      this.world.classList.toggle('show-lots', f === 'lotes');
    },

    // Mantém o zoom nos limites e o ponto focal dentro da imagem
    clamp() {
      this.tg.s = Math.min(SMAX, Math.max(SMIN, this.tg.s));
      this.tg.fx = Math.min(W, Math.max(0, this.tg.fx));
      this.tg.fy = Math.min(H, Math.max(0, this.tg.fy));
    },

    controls() {
      const v = this.view, ptr = new Map();
      let last = null, pinch = null;
      const touch = () => { this.lastInput = performance.now(); $('#m3dHint').classList.add('gone'); };
      v.addEventListener('pointerdown', (e) => { if (e.target.closest('.m3-pin')) return; ptr.set(e.pointerId, e); last = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; this.dragged = false; v.classList.add('grab'); this.stopTour(); });
      v.addEventListener('pointermove', (e) => {
        if (!ptr.has(e.pointerId)) return;
        ptr.set(e.pointerId, e);
        if (ptr.size === 2) {
          const [a, b] = [...ptr.values()];
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          if (pinch) { this.tg.s *= d / pinch; this.clamp(); }
          pinch = d; this.dragged = true; touch(); return;
        }
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        if (!this.dragged && Math.abs(e.clientX - last.x0) + Math.abs(e.clientY - last.y0) > 6) { this.dragged = true; v.setPointerCapture(e.pointerId); }
        last = { x: e.clientX, y: e.clientY };
        if (!this.dragged) return;
        // Arrastar move a imagem
        const k = this.st.s * this.base;
        this.tg.fx -= dx / k; this.tg.fy -= dy / k; this.clamp();
        this.st.fx = this.tg.fx; this.st.fy = this.tg.fy; touch();
      });
      const up = (e) => { ptr.delete(e.pointerId); pinch = null; if (!ptr.size) v.classList.remove('grab'); };
      v.addEventListener('pointerup', up); v.addEventListener('pointercancel', up);
      v.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && Math.abs(e.deltaY) < 4) return;
        e.preventDefault(); touch();
        this.tg.s *= Math.exp(-e.deltaY * 0.0015); this.clamp();
      }, { passive: false });
      v.addEventListener('keydown', (e) => {
        const d = 40 / this.tg.s;
        const k = { ArrowLeft: () => (this.tg.fx -= d), ArrowRight: () => (this.tg.fx += d), ArrowUp: () => (this.tg.fy -= d), ArrowDown: () => (this.tg.fy += d), '+': () => (this.tg.s *= 1.2), '-': () => (this.tg.s /= 1.2) }[e.key];
        if (k) { e.preventDefault(); k(); this.clamp(); touch(); }
      });
      $$('[data-m3d]').forEach((b) => b.addEventListener('click', () => {
        touch();
        const a = b.dataset.m3d;
        if (a === 'tour') return this.tourOn ? this.stopTour() : this.tour();
        this.stopTour();
        if (a === 'in') this.tg.s *= 1.3;
        if (a === 'out') this.tg.s /= 1.3;
        if (a === 'reset') this.overview();
        if (a === 'full') L.lightbox.open([{ src: 'implantacao-humanizada', legenda: 'Implantação humanizada — estudo conceitual (imagem ilustrativa)' }], 0);
        if (a === 'plan') L.lightbox.open([{ src: 'implantacao-oficial', legenda: 'Implantação — planta oficial do catálogo' }], 0);
        this.clamp();
      }));
    },

    fit() {
      const r = this.view.getBoundingClientRect();
      this.base = Math.min(r.width / (W * (r.width < 700 ? 1.08 : 1.6)), r.height / (H * 1.04));
    },

    loop() {
      const step = () => {
        if (this.visible !== false) {
          const st = this.st, tg = this.tg;
          for (const k of ['s', 'fx', 'fy']) st[k] += (tg[k] - st[k]) * (this.tourOn ? 0.045 : 0.09);
          // --inv mantém marcadores e etiquetas no mesmo tamanho na tela ao aproximar
          this.cam.style.setProperty('--inv', (1 / (st.s * this.base)).toFixed(4));
          this.cam.style.transform = `translate(-50%, -50%) scale(${(st.s * this.base).toFixed(4)}) translate(${(W / 2 - st.fx).toFixed(1)}px, ${(H / 2 - st.fy).toFixed(1)}px)`;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    /** Seleciona um espaço: voa até ele e mostra o cartão */
    select(id, opts = {}) {
      const it = L.findLazer(id);
      if (!it) return;
      this.current = it.id;
      Object.values(this.pins).forEach((p) => p.classList.toggle('is-on', p.dataset.id === it.id));
      $$('.m3-lot.is-on', this.world).forEach((l) => l.classList.remove('is-on'));
      $$('#m3dList button').forEach((b) => b.classList.toggle('is-on', b.dataset.id === it.id));
      if (opts.fly !== false) {
        const [x, y] = P(it.pos[0], it.pos[1]);
        Object.assign(this.tg, { fx: x, fy: y, s: 2.4 });
        this.lastInput = performance.now();
      }
      const card = $('#m3dCard');
      const media = it.img
        ? h('button', { type: 'button', class: 'm3-card__img', 'aria-label': 'Ampliar foto: ' + it.nome, onclick: () => L.lightbox.open([{ src: it.img, legenda: it.nome }], 0) }, h('img', { src: L.img(it.img, true), alt: '' }))
        : h('div', { class: 'm3-card__img m3-card__img--plan' }, L.zoomPlan(it));
      card.replaceChildren(media, h('div', { class: 'm3-card__body' },
        h('span', { class: 'm3-card__k' }, `${String(it.n).padStart(2, '0')} · ${it.grupo === 'lazer' ? 'Lazer' : 'Infraestrutura'}`),
        h('h3', null, it.nome), h('p', null, it.desc),
        h('div', { class: 'm3-card__links' },
          h('button', { type: 'button', onclick: () => this.overview() }, 'Ver todo o condomínio'),
          h('button', { type: 'button', onclick: () => L.luna.ask('amenity:' + it.id) }, 'Perguntar à Luma'))));
      card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
      if (!opts.silent) L.bus.dispatchEvent(new CustomEvent('plan-select', { detail: it.id }));
    },

    /** Mostra o cartão do lote (quadra q = 0..3, fileira r = 0..7) */
    showLot(q, r, opts = {}) {
      this.stopTour();
      const lot = L.lote(q, r);
      this.currentLot = lot.pos;
      $$('.m3-lot', this.world).forEach((l) => l.classList.toggle('is-on', l.dataset.lot === lot.pos));
      Object.values(this.pins).forEach((p) => p.classList.remove('is-on'));
      $$('#m3dList button').forEach((b) => b.classList.toggle('is-on', b.dataset.lot === lot.pos));
      if (opts.fly) {
        const [a, b, c, d] = lotRect(q, r);
        const [x, y] = P((a + c) / 2, (b + d) / 2);
        Object.assign(this.tg, { fx: x, fy: y, s: 2.6 });
        this.lastInput = performance.now();
      }
      const vendido = lot.situacao === 'vendido';
      const card = $('#m3dCard');
      card.replaceChildren(h('div', { class: 'm3-card__body' },
        h('span', { class: 'm3-card__k' }, 'Lote residencial · ' + lot.pos),
        h('h3', null, lot.titulo),
        h('dl', { class: 'm3-lotinfo' },
          h('div', null, h('dt', null, 'Posição'), h('dd', null, lot.posicao)),
          h('div', null, h('dt', null, 'Área'), h('dd', null, `${lot.area} m²${lot.areaConfirmada ? '' : ' (referência do catálogo)'}`)),
          h('div', null, h('dt', null, 'Situação'), h('dd', null, h('span', { class: 'lot-status lot-status--' + (lot.situacao || 'consulta') }, lot.situacaoTexto)))),
        h('div', { class: 'm3-card__actions' },
          vendido
            ? h('button', { class: 'btn btn--dark btn--sm', type: 'button', onclick: () => this.setFilter('lotes') }, 'Ver outros lotes')
            : h('button', { class: 'btn btn--dark btn--sm', type: 'button', onclick: () => L.contact.consultLot(lot) }, 'Consultar este lote'),
          L.leads.hasWhatsapp() && !vendido
            ? h('a', { class: 'btn btn--wa btn--sm', href: L.contact.whatsappUrl({ lote: lot }), target: '_blank', rel: 'noopener', html: '<svg><use href="#i-wa"/></svg>WhatsApp' })
            : null),
        h('div', { class: 'm3-card__links' },
          h('button', { type: 'button', onclick: () => this.overview() }, 'Ver todo o condomínio'),
          h('button', { type: 'button', onclick: () => L.houses && (L.houses.show('dunas'), L.ui.scrollToId('casas')) }, 'Projetos opcionais de casa'))));
      card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
    },

    /* Tour guiado: a câmera percorre os espaços e a Luma apresenta cada um */
    tour() {
      const seq = ['portaria', 'guarderia', 'beach-tennis', 'playground', 'redario', 'piscina', 'rooftop', 'churrasqueira', 'petplay'];
      this.tourOn = true; let i = 0;
      const btn = $('[data-m3d="tour"]'); if (btn) { btn.classList.add('is-on'); btn.lastChild.textContent = 'Parar tour'; }
      const next = () => {
        if (!this.tourOn) return;
        if (i >= seq.length) { this.stopTour(); this.overview(); return; }
        const it = L.findLazer(seq[i++]);
        this.select(it.id);
        if (L.luna && !L.luna.open_) L.luna.say(`**${it.nome}.** ${it.desc}`, [], 4800);
        this.tourT = setTimeout(next, 5200);
      };
      next();
    },
    stopTour() {
      if (!this.tourOn) return;
      this.tourOn = false; clearTimeout(this.tourT);
      const btn = $('[data-m3d="tour"]'); if (btn) { btn.classList.remove('is-on'); btn.lastChild.textContent = 'Tour guiado'; }
    },

    overview() { Object.assign(this.tg, { fx: W / 2, fy: H / 2, s: 1 }); this.lastInput = 0; },
  };

  // Utilitário: recorte ampliado da implantação centrado no espaço
  L.zoomPlan = (item) => {
    const el = h('div', { class: 'zoom-plan', 'data-n': item.n, role: 'img', 'aria-label': `Detalhe da implantação: ${item.nome}` });
    el.style.backgroundPosition = `${item.pos[0]}% ${item.pos[1]}%`;
    el.style.setProperty('--px', item.pos[0] + '%');
    el.style.setProperty('--py', item.pos[1] + '%');
    return el;
  };

  L.maquete = M;
  L.plan = { select: (id) => M.select(id) }; // compatibilidade com as ações da Luma
})(window.Lumoa);
