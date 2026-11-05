/* Inicialização do site Lumoa Dunes */
(function (L) {
  L.bus = new EventTarget();
  document.documentElement.classList.add('boot'); // animações de entrada aguardam a abertura

  function start() {
    const steps = [
      ['luna', () => L.luna.init()],
      ['lightbox', () => L.lightbox.init()],
      ['maquete', () => L.maquete.init()],
      ['amenities', () => L.amenities.init()],
      ['houses', () => L.houses.init()],
      ['gallery', () => L.gallery.init()],
      ['contact', () => L.contact.init()],
      ['location', () => L.location.init()],
      ['layout', () => L.layout.init()],
      ['hero', () => L.hero.init()],
      ['team', () => L.teamPanel.init()],
    ];
    for (const [name, fn] of steps) {
      try { fn(); } catch (e) { console.error('[Lumoa] falha ao iniciar ' + name, e); }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.Lumoa);
