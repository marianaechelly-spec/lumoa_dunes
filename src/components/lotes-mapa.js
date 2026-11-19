/* Lotes no satélite (seção Localização).
   Desenha os 32 lotes e o perímetro dos KML georreferenciados (L.lotesGeo, gerado por
   tools/kml-para-geojson.mjs) sobre imagem de satélite. O Leaflet só é baixado quando o
   visitante abre a vista, então não pesa no carregamento da página. */
(function (L) {
  const { $, h, toast, copyText } = L.ui;
  const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  // Imagem Esri: nesta região só há foto real até o zoom 17; acima disso é ampliada.
  const TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const NATIVE_Z = 17;
  const LABEL_Z = 19; // números dos lotes aparecem a partir deste zoom

  const fmtArea = (m2) => m2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtM = (m) => m.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const HASH = /^#lote-?(\d{1,2})$/i; // link direto: #lote-07

  // Distância em metros entre dois pontos [lng, lat] (aproximação local, precisa para poucos metros)
  const R = 6371008.8, rad = Math.PI / 180;
  const dist = (a, b) => {
    const x = (b[0] - a[0]) * rad * Math.cos(((a[1] + b[1]) / 2) * rad), y = (b[1] - a[1]) * rad;
    return Math.hypot(x, y) * R;
  };
  // Frente × profundidade: lados do polígono do lote (4 vértices)
  const dims = (ring) => {
    const s = [dist(ring[0], ring[1]), dist(ring[1], ring[2])].sort((a, b) => a - b);
    return { frente: s[0], fundo: s[1] };
  };

  function loadLeaflet() {
    if (window.L && window.L.map && window.L.version) return Promise.resolve(window.L);
    if (loadLeaflet.p) return loadLeaflet.p;
    loadLeaflet.p = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = LEAFLET + 'leaflet.min.css';
      document.head.append(css);
      const s = document.createElement('script');
      s.src = LEAFLET + 'leaflet.min.js';
      s.onload = () => resolve(window.L);
      s.onerror = () => { loadLeaflet.p = null; s.remove(); reject(new Error('Leaflet indisponível')); };
      document.head.append(s);
    });
    return loadLeaflet.p;
  }

  L.lotMap = {
    init() {
      this.fig = $('#map');
      this.btn = $('#mapSat');
      this.box = $('#lotMap');
      if (!this.fig || !this.btn || !this.box) return;
      const geo = L.lotesGeo;
      if (!geo || !geo.geojson || !geo.geojson.features.length) { this.btn.hidden = true; return; }
      this.btn.hidden = false;
      this.btn.addEventListener('click', () => this.toggle());
      // Luma não abre balões automáticos enquanto o satélite está aberto e na tela
      this.visible = false;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.syncQuiet(); }, { threshold: 0.25 }).observe(this.fig);
      }
      // Link direto para um lote (#lote-07): abre o satélite já com o lote destacado
      this.fromHash();
      addEventListener('hashchange', () => this.fromHash());
    },

    fromHash() {
      const m = location.hash.match(HASH);
      if (!m) return;
      const n = Number(m[1]);
      if (!L.lotesGeo.geojson.features.some((f) => f.properties.numero === n)) return;
      L.ui.scrollToId('localizacao');
      this.toggle(true).then(() => { if (this.map) this.select(n); });
    },

    lotUrl(n) {
      return location.href.replace(/#.*$/, '') + '#lote-' + String(n).padStart(2, '0');
    },

    syncQuiet() {
      if (L.luna && L.luna.setQuiet) L.luna.setQuiet(this.fig.classList.contains('is-sat') && (this.visible || HASH.test(location.hash)));
    },

    async toggle(force) {
      const on = typeof force === 'boolean' ? force : !this.fig.classList.contains('is-sat');
      if (on && !this.map) {
        this.btn.disabled = true;
        this.btn.lastChild.textContent = 'Carregando…';
        try { await this.build(); }
        catch (e) {
          console.error('[Lumoa] mapa de lotes', e);
          toast('Não foi possível carregar o satélite agora. Verifique a conexão e tente de novo.', 'err');
          this.btn.disabled = false; this.setLabel(false);
          return;
        }
        this.btn.disabled = false;
      }
      this.fig.classList.toggle('is-sat', on);
      this.box.hidden = !on;
      this.btn.setAttribute('aria-pressed', String(on));
      this.setLabel(on);
      this.syncQuiet();
      if (on) { this.map.invalidateSize(); if (!this.fitted) { this.fit(); this.fitted = true; } }
      else this.close();
    },

    setLabel(on) {
      this.btn.lastChild.textContent = on ? 'Ver a região' : 'Ver os lotes no satélite';
    },

    async build() {
      const Lf = await loadLeaflet();
      const feats = L.lotesGeo.geojson.features;
      this.box.hidden = false; // Leaflet precisa medir o contêiner visível
      const map = this.map = Lf.map(this.box, {
        zoomSnap: 1, zoomDelta: 1, maxZoom: 20, minZoom: 14, scrollWheelZoom: false, attributionControl: true,
        tap: true, zoomControl: true,
      });
      map.attributionControl.setPrefix(false);
      Lf.tileLayer(TILES, {
        maxNativeZoom: NATIVE_Z, maxZoom: 20,
        attribution: 'Imagem de satélite © Esri, Maxar, Earthstar Geographics',
      }).addTo(map);
      // Roda do mouse só amplia depois de clicar no mapa (não prende a rolagem da página)
      map.on('focus click', () => map.scrollWheelZoom.enable());
      map.on('blur mouseout', () => map.scrollWheelZoom.disable());

      const perim = feats.find((f) => f.properties.camada);
      if (perim) {
        this.perim = Lf.geoJSON(perim, { interactive: false, style: { color: '#d6bd92', weight: 2.5, dashArray: '6 5', fill: false } }).addTo(map);
      }

      const base = { color: '#fbf8f2', weight: 1.4, opacity: 0.95, fillColor: '#2aa39c', fillOpacity: 0.22 };
      const hover = { color: '#ffffff', weight: 2.2, fillColor: '#2aa39c', fillOpacity: 0.42 };
      const active = { color: '#b08a52', weight: 3, fillColor: '#b08a52', fillOpacity: 0.45 };
      this.styles = { base, active };
      this.layers = new Map();
      this.lots = Lf.geoJSON({ type: 'FeatureCollection', features: feats.filter((f) => f.properties.numero) }, {
        style: () => base,
        onEachFeature: (f, layer) => {
          const n = f.properties.numero;
          this.layers.set(n, layer);
          layer.bindTooltip(String(n).padStart(2, '0'), { permanent: true, direction: 'center', className: 'lotmap__num', interactive: false });
          layer.on('mouseover', () => { if (this.sel !== n) layer.setStyle(hover); });
          layer.on('mouseout', () => { if (this.sel !== n) layer.setStyle(base); });
          layer.on('click', (e) => { Lf.DomEvent.stopPropagation(e); this.select(n); });
          // Teclado: cada lote vira um item focável
          layer.on('add', () => {
            const el = layer.getElement();
            if (!el) return;
            el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
            el.setAttribute('aria-label', `${f.properties.nome}, ${fmtArea(f.properties.area_m2)} metros quadrados`);
            el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.select(n); } });
          });
        },
      }).addTo(map);
      map.on('click', () => this.close());
      const syncLabels = () => this.box.classList.toggle('show-nums', map.getZoom() >= LABEL_Z - 0.01);
      map.on('zoomend', syncLabels);

      // Painel do lote selecionado
      this.panel = h('div', { class: 'lotmap__panel', hidden: '', role: 'dialog', 'aria-live': 'polite' });
      this.box.append(this.panel);
      Lf.DomEvent.disableClickPropagation(this.panel);
      Lf.DomEvent.disableScrollPropagation(this.panel);

      // Volta ao enquadramento do condomínio
      const reset = h('button', { class: 'tool lotmap__reset', type: 'button', 'aria-label': 'Centralizar o condomínio', title: 'Centralizar o condomínio', html: '<svg><use href="#i-pin"/></svg>' });
      reset.addEventListener('click', (e) => { e.stopPropagation(); this.fit(); });
      this.box.append(reset);
      Lf.DomEvent.disableClickPropagation(reset);
      if (!document.getElementById('i-pin')) reset.textContent = '⌖';

      syncLabels();
    },

    fit() {
      const b = (this.perim || this.lots).getBounds();
      this.map.fitBounds(b, { padding: [16, 16], maxZoom: 19 });
    },

    select(n) {
      const f = L.lotesGeo.geojson.features.find((x) => x.properties.numero === n);
      if (!f) return;
      if (this.sel && this.layers.get(this.sel)) this.layers.get(this.sel).setStyle(this.styles.base);
      this.sel = n;
      const layer = this.layers.get(n);
      layer.setStyle(this.styles.active); layer.bringToFront();
      const num = String(n).padStart(2, '0');
      const d = dims(f.geometry.coordinates[0]);
      if (!HASH.test(location.hash) || Number(location.hash.match(HASH)[1]) !== n) history.replaceState(null, '', '#lote-' + num);
      const share = h('button', { class: 'lotmap__share', type: 'button' }, 'Copiar link deste lote');
      share.addEventListener('click', () => copyText(this.lotUrl(n)));
      const lote = { pos: null, numero: num, ref: `Lote ${num} (planta georreferenciada)`, titulo: `Lote ${num}` };
      const wa = L.leads.hasWhatsapp && L.leads.hasWhatsapp();
      const close = h('button', { class: 'lotmap__close', type: 'button', 'aria-label': 'Fechar', html: '&times;' });
      close.addEventListener('click', () => this.close());
      const consult = h('button', { class: 'btn btn--dark btn--sm', type: 'button' }, 'Consultar este lote');
      consult.addEventListener('click', () => L.contact.consultLot(lote));
      this.panel.replaceChildren(
        close,
        h('p', { class: 'lotmap__eyebrow' }, 'Planta georreferenciada'),
        h('h3', { class: 'lotmap__title' }, `Lote ${num}`),
        h('dl', { class: 'lotmap__facts' },
          h('div', null, h('dt', null, 'Área'), h('dd', null, `${fmtArea(f.properties.area_m2)} m²`)),
          h('div', null, h('dt', null, 'Medidas'), h('dd', null, `${fmtM(d.frente)} × ${fmtM(d.fundo)} m`)),
          h('div', null, h('dt', null, 'Situação'), h('dd', null, 'Sob consulta'))),
        h('div', { class: 'lotmap__actions' },
          consult,
          wa ? h('a', { class: 'btn btn--wa btn--sm', href: L.contact.whatsappUrl({ lote }), target: '_blank', rel: 'noopener', html: '<svg><use href="#i-wa"/></svg>WhatsApp' }) : null),
        share,
        h('p', { class: 'lotmap__note' }, 'Área e medidas calculadas a partir das coordenadas da planta. Os valores oficiais constam na matrícula do lote.'),
      );
      this.panel.hidden = false;
      this.box.classList.add('has-panel');
      // Leva o lote para a área livre do mapa (à esquerda do painel no desktop, acima dele no celular)
      const map = this.map, z = Math.max(map.getZoom(), LABEL_Z);
      const side = this.panel.offsetLeft > 40; // painel lateral (desktop)
      const off = side ? [this.panel.offsetWidth / 2 + 12, 0] : [0, this.panel.offsetHeight / 2 + 12];
      const p = map.project(layer.getBounds().getCenter(), z).add(off);
      map.flyTo(map.unproject(p, z), z, { duration: 0.6 });
    },

    close() {
      if (this.sel && this.layers && this.layers.get(this.sel)) this.layers.get(this.sel).setStyle(this.styles.base);
      this.sel = null;
      if (this.panel) this.panel.hidden = true;
      if (this.box) this.box.classList.remove('has-panel');
      if (HASH.test(location.hash)) history.replaceState(null, '', '#localizacao');
    },
  };
})(window.Lumoa);
