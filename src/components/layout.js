/* Estrutura geral: loader, cabeçalho, menu, textos do catálogo, revelação e parallax */
(function (L) {
  const { $, $$, h, icon, scrollToId } = L.ui;
  const D = L.data;

  L.layout = {
    init() {
      this.loader();
      this.texts();
      this.header();
      this.reveal();
      this.parallax();
      this.counters();
      const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    },

    loader() {
      const el = $('#loader');
      if (!el) return;
      const done = () => {
        if (el.classList.contains('done')) return;
        el.classList.add('done');
        document.documentElement.classList.remove('boot');
        L.bus.dispatchEvent(new Event('ready'));
      };
      const min = 1500; const t0 = performance.now();
      const later = () => setTimeout(done, Math.max(0, min - (performance.now() - t0)));
      if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });
      setTimeout(done, 2600); // nunca prende o visitante
    },

    texts() {
      $$('[data-text]').forEach((el) => { const t = D.textos[el.dataset.text]; if (t) el.textContent = t; });
      const n = $('#numbers');
      if (n) D.numeros.forEach((x, i) => n.append(h('div', { 'data-reveal': '', style: `--d:${i * 0.12}s` },
        h('dd', { html: `<span data-count="${x.valor}">${x.valor}</span><small>${x.unidade}</small>` }),
        h('dt', null, x.rotulo))));
    },

    header() {
      const header = $('#header');
      const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      // Menu mobile
      const btn = $('#menuBtn');
      const drawer = $('#drawer');
      const setMenu = (open) => {
        document.body.classList.toggle('menu-open', open);
        document.body.classList.toggle('no-scroll', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      };
      btn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
      drawer.addEventListener('click', (e) => { if (e.target.closest('a,button')) setMenu(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

      // Rolagem suave com compensação do cabeçalho
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute('href').slice(1);
        if (!id || !document.getElementById(id)) return;
        e.preventDefault();
        scrollToId(id);
      });

      // Item ativo do menu
      const links = $$('.nav a');
      const map = {};
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = map[en.target.id] || en.target.id;
          links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
          L.bus.dispatchEvent(new CustomEvent('section', { detail: en.target.id }));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main > section[id]').forEach((s) => io.observe(s));
    },

    reveal() {
      if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      document.documentElement.classList.add('js-reveal');
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      this._revealIO = io;
      this.observeReveal(document);
      setTimeout(() => $$('[data-reveal].pre').forEach((el) => el.classList.remove('pre')), 6000);
    },

    observeReveal(root) {
      if (!this._revealIO) return;
      $$('[data-reveal]', root).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) return; // já visível: mantém em repouso
        el.classList.add('pre');
        this._revealIO.observe(el);
      });
    },

    parallax() {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const els = $$('[data-parallax]');
      let ticking = false;
      const run = () => {
        const vh = window.innerHeight;
        els.forEach((el) => {
          const box = el.parentElement.getBoundingClientRect();
          if (box.bottom < 0 || box.top > vh) return;
          const k = parseFloat(el.dataset.parallax) || 0.1;
          const shift = (box.top + box.height / 2 - vh / 2) * -k;
          el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        });
        ticking = false;
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
      run();
    },

    counters() {
      const els = $$('[data-count]');
      if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const fmt = (n, src) => (src.includes('.') ? Math.round(n).toLocaleString('pt-BR') : String(Math.round(n)));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          const src = en.target.dataset.count;
          const end = parseFloat(src.replace(/\./g, '').replace(',', '.'));
          const t0 = performance.now();
          const dur = 1600;
          const step = (t) => {
            const p = Math.min(1, (t - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            en.target.textContent = fmt(end * e, src);
            if (p < 1) requestAnimationFrame(step); else en.target.textContent = src;
          };
          requestAnimationFrame(step);
        });
      }, { threshold: 0.6 });
      els.forEach((el) => io.observe(el));
    },
  };
})(window.Lumoa);
