/* Herói: apresentação de imagens em sequência com transição lenta */
(function (L) {
  const { $, $$ } = L.ui;
  const DUR = 7000;

  L.hero = {
    i: 0,
    init() {
      this.slides = $$('#heroSlides .hero__slide');
      this.dots = $$('#heroDots button');
      if (!this.slides.length) return;
      this.dots.forEach((d) => { d.style.setProperty('--dur', DUR + 'ms'); d.addEventListener('click', () => this.go(+d.dataset.slide, true)); });
      const hero = $('#inicio');
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.arm(); else clearTimeout(this.t); }).observe(hero);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const begin = () => this.arm();
      if (document.documentElement.classList.contains('boot')) L.bus.addEventListener('ready', begin, { once: true }); else begin();
    },
    arm() { clearTimeout(this.t); this.t = setTimeout(() => this.go(this.i + 1), DUR); },
    go(n, user) {
      this.i = (n + this.slides.length) % this.slides.length;
      this.slides.forEach((s, k) => s.classList.toggle('is-on', k === this.i));
      this.dots.forEach((d, k) => { d.classList.remove('is-on'); void d.offsetWidth; d.classList.toggle('is-on', k === this.i); });
      if (this.visible !== false) this.arm();
    },
  };
})(window.Lumoa);
