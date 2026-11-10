/* Galeria com filtros + lightbox com ampliação, arraste e teclado */
(function (L) {
  const { $, $$, h } = L.ui;
  // Mosaico pelo formato da foto: vertical ocupa 2 linhas, panorâmica ocupa 2 colunas
  const SHAPE = { v: 'h2', w: 'w2' };

  L.gallery = {
    cat: 'todas',
    init() {
      this.grid = $('#gallery');
      const f = $('#galleryFilters');
      if (!this.grid) return;
      L.data.categoriasGaleria.forEach(([k, label]) => {
        const b = h('button', { class: 'chip' + (k === 'todas' ? ' is-on' : ''), type: 'button', 'data-cat': k, 'aria-pressed': String(k === 'todas') }, label);
        b.addEventListener('click', () => this.filter(k));
        f.append(b);
      });
      this.render();
    },
    filter(k) {
      this.cat = k;
      $$('#galleryFilters .chip').forEach((b) => { const on = b.dataset.cat === k; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      this.render();
    },
    render() {
      const items = L.data.galeria.filter((g) => this.cat === 'todas' || g.cat === this.cat);
      this.grid.replaceChildren(...items.map((g, i) => {
        const shape = SHAPE[g.forma] || '';
        const b = h('button', { class: 'g-item ' + shape, type: 'button', 'aria-label': 'Ampliar: ' + g.legenda, style: `animation-delay:${Math.min(i, 10) * 0.04}s` },
          h('img', { src: L.img(g.src, !shape.includes('w2')), alt: g.legenda, loading: 'lazy' }), h('span', null, g.legenda));
        b.addEventListener('click', () => L.lightbox.open(items, i));
        return b;
      }));
      $('#galleryCount').textContent = `${items.length} ${items.length === 1 ? 'imagem' : 'imagens'} · perspectivas ilustrativas`;
    },
  };

  L.lightbox = {
    items: [], i: 0, zoom: false, pan: { x: 0, y: 0 },
    init() {
      this.el = $('#lightbox'); this.img = $('#lbImg'); this.cap = $('#lbCap'); this.count = $('#lbCount');
      $('#lbClose').addEventListener('click', () => this.close());
      $('#lbPrev').addEventListener('click', () => this.go(-1));
      $('#lbNext').addEventListener('click', () => this.go(1));
      $('#lbZoom').addEventListener('click', () => this.toggleZoom());
      this.img.addEventListener('click', (e) => { if (!this.dragged) this.toggleZoom(); });
      this.el.addEventListener('click', (e) => { if (e.target === this.el || e.target.id === 'lbStage') this.close(); });
      document.addEventListener('keydown', (e) => {
        if (!this.el.classList.contains('is-open')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowRight') this.go(1);
        if (e.key === 'ArrowLeft') this.go(-1);
      });
      // Arraste (pan) quando ampliado e swipe quando normal
      let start = null;
      const stage = $('#lbStage');
      stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; start = { x: e.clientX, y: e.clientY, px: this.pan.x, py: this.pan.y }; this.dragged = false; });
      window.addEventListener('pointermove', (e) => {
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) this.dragged = true;
        if (this.zoom) { this.pan.x = start.px + dx; this.pan.y = start.py + dy; this.apply(); }
      });
      window.addEventListener('pointerup', (e) => {
        if (!start) return;
        const dx = e.clientX - start.x;
        if (!this.zoom && Math.abs(dx) > 50) this.go(dx < 0 ? 1 : -1);
        start = null;
        setTimeout(() => { this.dragged = false; }, 0);
      });
    },
    open(items, i = 0) {
      this.items = items; this.i = i; this.last = document.activeElement;
      this.el.classList.add('is-open'); this.el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      const multi = items.length > 1;
      $('#lbPrev').hidden = !multi; $('#lbNext').hidden = !multi;
      this.show();
      $('#lbClose').focus();
    },
    close() {
      this.el.classList.remove('is-open'); this.el.setAttribute('aria-hidden', 'true');
      if (!document.body.classList.contains('menu-open') && !L.luna?.isFullscreen()) document.body.classList.remove('no-scroll');
      this.setZoom(false);
      if (this.last && this.last.focus) this.last.focus();
    },
    go(d) { if (this.items.length < 2) return; this.i = (this.i + d + this.items.length) % this.items.length; this.show(); },
    show() {
      const it = this.items[this.i];
      this.setZoom(false);
      this.img.classList.add('swap');
      const next = new Image();
      next.onload = next.onerror = () => { this.img.src = next.src; this.img.alt = it.legenda; this.img.classList.remove('swap'); };
      next.src = L.img(it.src);
      this.cap.textContent = it.legenda;
      this.count.textContent = this.items.length > 1 ? `${String(this.i + 1).padStart(2, '0')} / ${String(this.items.length).padStart(2, '0')}` : '';
    },
    toggleZoom() { this.setZoom(!this.zoom); },
    setZoom(on) {
      this.zoom = on; this.pan = { x: 0, y: 0 };
      this.img.classList.toggle('zoomed', on);
      $('#lbZoom').innerHTML = `<svg><use href="#i-${on ? 'minus' : 'plus'}"/></svg>`;
      $('#lbZoom').setAttribute('aria-label', on ? 'Reduzir' : 'Ampliar');
      this.apply();
    },
    apply() { this.img.style.transform = this.zoom ? `translate(${this.pan.x}px, ${this.pan.y}px) scale(2.2)` : ''; },
  };
})(window.Lumoa);
