/* Contato (formulário), localização e painel da equipe */
(function (L) {
  const { $, $$, h, esc, toast, copyText } = L.ui;

  L.contact = {
    init() {
      this.form = $('#leadForm');
      if (!this.form) return;
      const tel = $('#f-tel');
      tel.addEventListener('input', () => { tel.value = L.leads.formatPhone(tel.value); });
      this.form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
      $$('input, textarea', this.form).forEach((el) => el.addEventListener('input', () => el.closest('.field, .consent')?.classList.remove('has-error')));
      $('#f-consent').addEventListener('change', () => $('#consentWrap').classList.remove('has-error'));
      this.direct();
    },

    direct() {
      const box = $('#contactDirect');
      const cfg = L.config;
      const parts = [];
      if (L.leads.hasWhatsapp()) {
        parts.push(h('a', { class: 'btn btn--wa', href: L.leads.whatsappUrl('Olá! Gostaria de saber mais sobre o Lumoa Dunes.'), target: '_blank', rel: 'noopener', html: '<svg><use href="#i-wa"/></svg>Falar no WhatsApp' }));
        const num = cfg.whatsapp.replace(/\D/g, '');
        parts.push(h('span', { class: 'copy-line', style: { color: 'var(--muted)', fontSize: '.9rem' } }, 'WhatsApp oficial: ', h('strong', null, '+' + num)));
      }
      if (cfg.email) parts.push(h('span', { class: 'copy-line', style: { color: 'var(--muted)', fontSize: '.9rem' } }, 'E-mail: ', h('strong', null, cfg.email)));
      parts.push(h('button', { class: 'link', type: 'button', 'data-luna-intent': 'consultor' }, 'Prefere falar com a Luna? Ela registra seu contato.'));
      box.replaceChildren(...parts);
    },

    prefill(interesse, msg) {
      const sel = $('#f-interesse');
      if (sel && interesse) [...sel.options].forEach((o) => { if (o.text === interesse) sel.value = o.text; });
      if (msg) $('#f-msg').value = msg;
      setTimeout(() => $('#f-nome').focus({ preventScroll: true }), 700);
    },

    async submit() {
      const fd = new FormData(this.form);
      const lead = Object.fromEntries(fd.entries());
      lead.consentimento = $('#f-consent').checked;
      const errors = L.leads.validate(lead);
      $$('.field', this.form).forEach((f) => { f.classList.remove('has-error'); const e = f.querySelector('.err'); if (e) e.textContent = ''; });
      $('#consentWrap').classList.toggle('has-error', !!errors.consentimento);
      Object.entries(errors).forEach(([k, msg]) => {
        const input = this.form.querySelector(`[name="${k}"]`);
        const f = input && input.closest('.field');
        if (f) { f.classList.add('has-error'); f.querySelector('.err').textContent = msg; }
      });
      const status = $('#formStatus');
      if (Object.keys(errors).length) {
        status.className = 'form__status err';
        status.textContent = errors.consentimento && Object.keys(errors).length === 1 ? errors.consentimento : 'Revise os campos destacados.';
        const first = this.form.querySelector('.has-error input, .has-error textarea, #f-consent');
        if (first) first.focus();
        return;
      }
      const btn = $('#formSubmit');
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Enviando';
      status.className = 'form__status'; status.textContent = '';
      const res = await L.leads.submit({ ...lead, origem: 'formulario' });
      btn.disabled = false; btn.innerHTML = 'Enviar <svg><use href="#i-send"/></svg>';
      this.result(res, lead);
    },

    result(res, lead) {
      const status = $('#formStatus');
      if (res.ok && res.channel !== 'whatsapp') {
        this.form.replaceChildren(h('div', { class: 'form-success' },
          h('div', { class: 'check', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' }),
          h('h3', null, `Obrigada, ${lead.nome.split(' ')[0]}!`),
          h('p', { style: { color: 'var(--ink-2)' } }, 'Recebemos seus dados. Um consultor do Lumoa Dunes vai entrar em contato pelo telefone informado.'),
          h('button', { class: 'btn btn--line btn--sm', type: 'button', 'data-luna-open': '' }, 'Continuar com a Luna')));
        toast('Contato enviado para a equipe comercial.');
        L.bus.dispatchEvent(new CustomEvent('lead', { detail: lead }));
      } else if (res.channel === 'whatsapp') {
        status.className = 'form__status ok';
        status.replaceChildren('Finalize o envio pelo WhatsApp: ', h('a', { href: res.url, target: '_blank', rel: 'noopener', style: { fontWeight: 600 } }, 'abrir conversa com a equipe'));
      } else {
        status.className = 'form__status err';
        status.replaceChildren('Não conseguimos enviar agora. Seus dados ficaram salvos neste aparelho. ',
          h('button', { type: 'button', class: 'link-arrow', onclick: () => copyText(res.text) }, 'Copiar meus dados'));
      }
    },
  };

  L.location = {
    init() {
      const cfg = L.config;
      const link = $('#mapLink');
      if (link) {
        link.href = cfg.coordenadas
          ? `https://www.google.com/maps/search/?api=1&query=${cfg.coordenadas.lat},${cfg.coordenadas.lng}`
          : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Olho D\'Água, Santo Amaro do Maranhão - MA');
        if (cfg.coordenadas) $('#mapNote').textContent = 'Localização confirmada do Lumoa Dunes.';
        
      }
      const map = $('#map'), z = $('#mapZoom');
      if (z) z.addEventListener('click', () => {
        const on = map.classList.toggle('is-zoom');
        z.setAttribute('aria-pressed', String(on)); z.setAttribute('aria-label', on ? 'Afastar o mapa' : 'Aproximar o mapa');
        z.innerHTML = `<svg><use href="#i-${on ? 'minus' : 'plus'}"/></svg>`;
      });
    },
  };

  L.teamPanel = {
    async init() {
      const btn = $('#teamPanelBtn');
      const ok = await L.leads.canSeePanel();
      if (!ok) return;
      btn.hidden = false;
      const panel = $('#teamPanel');
      const close = () => { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); };
      btn.addEventListener('click', () => this.open());
      $('#teamPanelClose').addEventListener('click', close);
      panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open')) close(); });
    },
    async open() {
      const panel = $('#teamPanel');
      const list = $('#teamPanelList');
      panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
      list.replaceChildren(h('p', { class: 'empty' }, 'Carregando contatos…'));
      try {
        const rows = await L.leads.listAll();
        if (!rows.length) { list.replaceChildren(h('p', { class: 'empty' }, 'Nenhum interessado ainda. Os contatos enviados pelo formulário e pela Luna aparecem aqui.')); return; }
        list.replaceChildren(...rows.map((r) => h('div', { class: 'lead-row' },
          h('strong', null, r.nome || 'Sem nome'),
          h('span', null, [r.telefone, r.email].filter(Boolean).join(' · ')),
          h('small', null, `${r.interesse || 'Interesse não informado'} · via ${r.origem === 'luna' ? 'Luna' : 'formulário'} · ${new Date(r.atualizadoEm).toLocaleString('pt-BR')}`),
          r.mensagem ? h('p', null, r.mensagem) : null)));
      } catch (e) {
        list.replaceChildren(h('p', { class: 'empty' }, 'Não foi possível carregar os contatos agora. Feche e abra o painel para tentar de novo.'));
      }
    },
  };
})(window.Lumoa);
