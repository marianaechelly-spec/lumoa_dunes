/* Utilitários de interface compartilhados */
(function (L) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function scrollToId(id) {
    const target = typeof id === 'string' ? document.getElementById(id.replace('#', '')) : id;
    if (!target) return;
    const header = $('#header');
    const offset = (header ? header.offsetHeight : 0) + 8;
    const y = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function toast(text, kind = 'ok', ms = 3600) {
    const stack = $('#toasts');
    if (!stack) return;
    const t = h('div', { class: 'toast is-' + kind }, text);
    stack.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copiado.'); return true; }
    catch (e) { toast('Não foi possível copiar automaticamente. Selecione o texto e copie.', 'err'); return false; }
  }

  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('lumoa:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lumoa:' + k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } },
  };

  const isMobile = () => matchMedia('(max-width: 640px)').matches;

  // Efeito de luz que acompanha o cursor nos botões
  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
    b.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  }, { passive: true });

  L.ui = { $, $$, h, icon, esc, scrollToId, toast, copyText, store, isMobile };
})(window.Lumoa);
