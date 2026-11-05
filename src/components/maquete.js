/* =========================================================================
   Maquete 3D interativa do condomínio (CSS 3D, sem bibliotecas)
   Base: planta de implantação oficial. Volumes ilustrativos das casas,
   do núcleo de lazer e da portaria; marcadores dos 13 espaços numerados.
   ========================================================================= */
(function (L) {
  const { $, $$, h, esc } = L.ui;
  const W = 560, H = Math.round(560 * 1369 / 1080); // proporção da planta
  const COLS = [[6.0, 22.7, 'e'], [30.9, 48.8, 'w'], [50.1, 67.7, 'e'], [75.3, 93.2, 'w']];
  const ROW0 = 18.5, ROWH = (74.6 - 18.5) / 8;
  const P = (x, y) => [x / 100 * W, y / 100 * H];

  // Caixa 3D com 5 faces (topo + 4 laterais), cores por face para simular luz
  function box(x, y, w, d, hgt, c, z = 0, cls = '') {
    const b = h('div', { class: 'b3 ' + cls, style: `left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform:translateZ(${z}px)` });
    const f = (k, st, col) => b.append(h('i', { class: 'f ' + k, style: st + `;background:${col}` }));
    f('t', `width:${w}px;height:${d}px;transform:translateZ(${hgt}px)`, c.top);
    f('s', `width:${w}px;height:${hgt}px;top:${d}px;transform-origin:top;transform:rotateX(90deg)`, c.s);
    f('n', `width:${w}px;height:${hgt}px;top:${-hgt}px;transform-origin:bottom;transform:rotateX(-90deg)`, c.n);
    f('e', `width:${hgt}px;height:${d}px;left:${w}px;transform-origin:left;transform:rotateY(-90deg)`, c.e);
    f('w', `width:${hgt}px;height:${d}px;left:${-hgt}px;transform-origin:right;transform:rotateY(90deg)`, c.w);
    return b;
  }
  const WHITE = { top: '#fbf9f4', s: '#e9e3d7', n: '#cfc7b8', e: '#ddd6c8', w: '#c4bcad' };
  const TEAL = { top: '#3fb3a6', s: '#2e9488', n: '#1f6f66', e: '#278278', w: '#1c625b' };
  const WOOD = { top: '#c99a63', s: '#a77a48', n: '#8a6238', e: '#986d3f', w: '#7c5631' };
  const ROOF = { top: '#b5694a', s: '#9a5438', n: '#7d432c', e: '#8a4a31', w: '#713c27' };
  const SAND = { top: '#efe5d3', s: '#d8cbb3', n: '#bfb197', e: '#cbbda4', w: '#b3a58b' };

  const M = {
    st: { rx: 56, rz: -32, s: 1, fx: W / 2, fy: H / 2 },   // estado atual
    tg: { rx: 56, rz: -32, s: 1, fx: W / 2, fy: H / 2 },   // alvo (animação suave)
    base: 1, idle: true, lastInput: 0, current: null, filter: 'todos',

    init() {
      this.view = $('#m3dView'); this.cam = $('#m3dCam'); this.world = $('#m3dWorld');
      if (!this.view) return;
      this.cam.style.width = W + 'px'; this.cam.style.height = H + 'px';
      this.gl = L.maqueteGL && L.maqueteGL.init(this.view, this);
      if (this.gl) { this.cam.hidden = true; this.view.classList.add('is-gl'); Object.assign(this.st, { rx: 58, rz: -32 }); Object.assign(this.tg, { rx: 58, rz: -32 }); }
      else this.build();
      this.list();
      this.controls();
      this.fit();
      addEventListener('resize', () => this.fit());
      this.loop();
      this.select('piscina', { silent: true, fly: false });
      // Visível só quando a seção está na tela (economia de bateria)
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }, { rootMargin: '200px' }).observe(this.view);
      // Entrada cinematográfica: a câmera desce da vista aérea até a maquete
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; io.disconnect();
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        Object.assign(this.st, { rx: 2, rz: this.tg.rz - 110, s: 0.55 });
        this.lastInput = performance.now() - 3000;
      }, { threshold: 0.45 });
      io.observe(this.view);
    },

    build() {
      const w = this.world;
      w.append(h('div', { class: 'm3-ground' }));
      w.append(h('div', { class: 'm3-floor', style: `width:${W}px;height:${H}px` }));
      // Lotes (32) com casas ilustrativas
      let n = 0;
      COLS.forEach(([a, b, face]) => {
        for (let r = 0; r < 8; r++) {
          n++;
          const [x0, y0] = P(a, ROW0 + r * ROWH), [x1, y1] = P(b, ROW0 + (r + 1) * ROWH);
          const lw = x1 - x0, ld = y1 - y0;
          const lot = h('button', { class: 'm3-lot', type: 'button', style: `left:${x0}px;top:${y0}px;width:${lw}px;height:${ld}px`, 'aria-label': 'Lote de 200 m²' });
          lot.addEventListener('click', (e) => { e.stopPropagation(); this.showLot(lot); });
          w.append(lot);
          // casa: corpo branco + volume turquesa (identidade das fachadas do catálogo)
          const hw = lw * 0.58, hd = ld * 0.62;
          const hx = face === 'e' ? x0 + lw * 0.08 : x1 - lw * 0.08 - hw;
          const hy = y0 + (ld - hd) / 2;
          const tall = n % 3 === 0 ? 1 : 0; // alterna volumetria (térrea / dois pavimentos)
          w.append(h('i', { class: 'm3-shadow', style: `left:${hx + 6}px;top:${hy + 5}px;width:${hw}px;height:${hd}px` }));
          w.append(box(hx, hy, hw, hd, tall ? 24 : 14, WHITE, 0, 'house'));
          const tw = hw * 0.34, tx = face === 'e' ? hx + hw * 0.08 : hx + hw - tw - hw * 0.08;
          w.append(box(tx, hy + hd * 0.18, tw, hd * 0.64, 12, TEAL, tall ? 24 : 14, 'house'));
        }
      });
      // Núcleo de lazer (canto superior esquerdo)
      const [tx, ty] = P(4.5, 6.2);
      w.append(h('i', { class: 'm3-shadow', style: `left:${tx + 10}px;top:${ty + 8}px;width:30px;height:34px` }));
      w.append(box(tx, ty, 30, 34, 54, WHITE, 0, 'tower'));
      w.append(box(tx + 4, ty + 4, 22, 26, 16, TEAL, 54, 'tower'));
      const [gx, gy] = P(4.2, 0.6); w.append(box(gx, gy, 22, 20, 12, WOOD, 0));
      const [cx, cy] = P(6.5, 11.6); w.append(box(cx, cy, 40, 30, 14, ROOF, 0));
      // Portaria e guarderia (acesso)
      const [px, py] = P(70.5, 85.2); w.append(box(px, py, 30, 16, 16, WOOD, 0));
      const [qx, qy] = P(76.5, 77.2); w.append(box(qx, qy, 44, 22, 3, WOOD, 13, 'pergola'));
      // Marcadores dos espaços
      this.pins = {};
      L.data.lazer.forEach((it) => {
        const [x, y] = P(it.pos[0], it.pos[1]);
        const tall = it.id === 'rooftop' ? 96 : it.id === 'gazebo' ? 42 : 52;
        const pin = h('div', { class: 'm3-pin', style: `left:${x}px;top:${y}px`, 'data-id': it.id, 'data-group': it.grupo },
          h('div', { class: 'm3-pin__bb', style: `--t:${tall}px` },
            h('button', { type: 'button', class: 'm3-pin__head', 'aria-label': `${it.n}. ${it.nome}` }, String(it.n)),
            h('span', { class: 'm3-pin__name' }, it.nome),
            h('i', { class: 'm3-pin__stem' })));
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
      $$('[data-m3d-filter]').forEach((b) => b.addEventListener('click', () => this.setFilter(b.dataset.m3dFilter)));
      document.addEventListener('click', (e) => {
        const g = e.target.closest('[data-plan-go]');
        if (g) { this.select(g.dataset.planGo); L.ui.scrollToId('implantacao'); }
      });
    },

    setFilter(f) {
      this.filter = f;
      $$('[data-m3d-filter]').forEach((b) => b.classList.toggle('is-on', b.dataset.m3dFilter === f));
      $$('#m3dList li').forEach((li) => li.hidden = !(f === 'todos' || li.dataset.group === f));
      if (this.gl) L.maqueteGL.setFilter(f);
      else Object.values(this.pins).forEach((p) => p.classList.toggle('is-dim', !(f === 'todos' || p.dataset.group === f)));
    },

    controls() {
      const v = this.view, ptr = new Map();
      let last = null, pinch = null;
      const touch = () => { this.lastInput = performance.now(); $('#m3dHint').classList.add('gone'); };
      v.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; ptr.set(e.pointerId, e); last = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; this.dragged = false; v.setPointerCapture(e.pointerId); v.classList.add('grab'); this.stopTour(); });
      v.addEventListener('pointermove', (e) => {
        if (!ptr.has(e.pointerId)) return;
        ptr.set(e.pointerId, e);
        if (ptr.size === 2) {
          const [a, b] = [...ptr.values()];
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          if (pinch) this.tg.s = Math.min(2.8, Math.max(0.7, this.tg.s * d / pinch));
          pinch = d; touch(); return;
        }
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        if (Math.abs(e.clientX - last.x0) + Math.abs(e.clientY - last.y0) > 5) this.dragged = true;
        last = { x: e.clientX, y: e.clientY };
        if (Math.abs(dx) + Math.abs(dy) < 1) return;
        this.tg.rz += dx * 0.35; this.tg.rx = Math.min(74, Math.max(0, this.tg.rx - dy * 0.25));
        this.st.rz = this.tg.rz; this.st.rx = this.tg.rx; touch();
      });
      const up = (e) => { ptr.delete(e.pointerId); pinch = null; if (!ptr.size) v.classList.remove('grab'); };
      v.addEventListener('pointerup', up); v.addEventListener('pointercancel', up);
      v.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && Math.abs(e.deltaY) < 4) return;
        e.preventDefault(); touch();
        this.tg.s = Math.min(2.8, Math.max(0.7, this.tg.s * Math.exp(-e.deltaY * 0.0015)));
      }, { passive: false });
      v.addEventListener('keydown', (e) => {
        const k = { ArrowLeft: () => (this.tg.rz -= 15), ArrowRight: () => (this.tg.rz += 15), ArrowUp: () => (this.tg.rx = Math.max(0, this.tg.rx - 8)), ArrowDown: () => (this.tg.rx = Math.min(74, this.tg.rx + 8)), '+': () => (this.tg.s *= 1.2), '-': () => (this.tg.s /= 1.2) }[e.key];
        if (k) { e.preventDefault(); k(); touch(); }
      });
      $$('[data-m3d]').forEach((b) => b.addEventListener('click', () => {
        touch();
        const a = b.dataset.m3d;
        if (a === 'tour') return this.tourOn ? this.stopTour() : this.tour();
        this.stopTour();
        if (a === 'left') this.tg.rz -= 45;
        if (a === 'right') this.tg.rz += 45;
        if (a === 'in') this.tg.s = Math.min(2.8, this.tg.s * 1.3);
        if (a === 'out') this.tg.s = Math.max(0.7, this.tg.s / 1.3);
        if (a === 'top') Object.assign(this.tg, { rx: 0, rz: 0, s: 1, fx: W / 2, fy: H / 2 });
        if (a === 'reset') Object.assign(this.tg, { rx: 56, rz: -32, s: 1, fx: W / 2, fy: H / 2 });
        if (a === 'plan') L.lightbox.open([{ src: 'implantacao-oficial', legenda: 'Implantação — planta oficial do catálogo' }], 0);
      }));
    },

    fit() {
      const r = this.view.getBoundingClientRect();
      this.base = Math.min(r.width / (W * (r.width < 700 ? 1.5 : 1.32)), r.height / (H * 0.92));
    },

    loop() {
      const step = () => {
        if (this.visible !== false) {
          const st = this.st, tg = this.tg;
          const idle = performance.now() - this.lastInput > 7000;
          if (idle && !matchMedia('(prefers-reduced-motion: reduce)').matches) tg.rz += 0.045;
          for (const k of ['rx', 'rz', 's', 'fx', 'fy']) st[k] += (tg[k] - st[k]) * (this.tourOn ? 0.035 : 0.075);
          if (this.gl) { L.maqueteGL.render(st, performance.now()); requestAnimationFrame(step); return; }
          this.cam.style.setProperty('--rz', st.rz.toFixed(2) + 'deg');
          this.cam.style.setProperty('--rx', st.rx.toFixed(2) + 'deg');
          this.cam.style.transform = `translate(-50%, -50%) scale(${(st.s * this.base).toFixed(4)}) rotateX(${st.rx.toFixed(2)}deg) rotateZ(${st.rz.toFixed(2)}deg) translate(${(W / 2 - st.fx).toFixed(1)}px, ${(H / 2 - st.fy).toFixed(1)}px)`;
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
      if (this.gl) L.maqueteGL.setActive(it.id);
      else Object.values(this.pins).forEach((p) => p.classList.toggle('is-on', p.dataset.id === it.id));
      $$('.m3-lot.is-on', this.world).forEach((l) => l.classList.remove('is-on'));
      $$('#m3dList button').forEach((b) => b.classList.toggle('is-on', b.dataset.id === it.id));
      if (opts.fly !== false) {
        const [x, y] = P(it.pos[0], it.pos[1]);
        Object.assign(this.tg, { fx: x, fy: y, s: this.gl ? 2.6 : 1.9, rx: this.gl ? 62 : 52 });
        if (this.gl && opts.turn) this.tg.rz += opts.turn;
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

    showLot(lot) {
      this.stopTour();
      $$('.m3-lot.is-on', this.world).forEach((l) => l.classList.remove('is-on'));
      if (lot) lot.classList.add('is-on');
      if (this.pins) Object.values(this.pins).forEach((p) => p.classList.remove('is-on'));
      const card = $('#m3dCard');
      card.replaceChildren(h('div', { class: 'm3-card__body' },
        h('span', { class: 'm3-card__k' }, 'Lote residencial'),
        h('h3', null, 'Lote de 200 m²'),
        h('p', null, 'São 32 lotes de 200 m² no condomínio. Disponibilidade e valores são informados pela equipe comercial.'),
        h('div', { class: 'm3-card__links' },
          h('button', { type: 'button', onclick: () => L.luna.ask('disponibilidade') }, 'Consultar disponibilidade'),
          h('button', { type: 'button', onclick: () => L.houses && (L.houses.show('dunas'), L.ui.scrollToId('casas')) }, 'Ver as casas'))));
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
        this.select(it.id, { turn: 40 });
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

    overview() { Object.assign(this.tg, { fx: W / 2, fy: H / 2, s: 1, rx: 56 }); this.lastInput = 0; },
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
