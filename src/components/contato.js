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
      $('#f-interesse').addEventListener('change', () => { if ($('#f-interesse').value !== 'Lotes') this.setLot(null); });
      // Seção que o visitante está vendo: vai junto na mensagem do WhatsApp
      L.bus.addEventListener('section', (e) => { this.section = e.detail; });
      this.globalButtons();
      this.direct();
    },

    /** Mensagem pronta do WhatsApp, com o lote ou a seção de origem */
    whatsappUrl({ lote, secao } = {}) {
      const SECOES = { inicio: 'a página inicial', empreendimento: 'o empreendimento', implantacao: 'os lotes na maquete', localizacao: 'a localização',
        lazer: 'o lazer', galeria: 'a galeria', faq: 'as dúvidas frequentes', contato: 'o contato', casas: 'os projetos de casa' };
      const s = secao || this.section;
      let text = 'Olá! Gostaria de falar com um consultor sobre o Lumoa Dunes.';
      if (lote) text = `Olá! Tenho interesse no ${lote.ref} do Lumoa Dunes. Pode me passar valores, condições e a situação atual desse lote?`;
      else if (s && SECOES[s]) text += ` Estava vendo ${SECOES[s]} no site.`;
      return L.leads.whatsappUrl(text);
    },

    /** Botões espalhados pela página: WhatsApp [data-wa], Agendar visita [data-visit], Política de privacidade [data-privacy] */
    globalButtons() {
      const wa = L.leads.hasWhatsapp();
      $$('[data-wa]').forEach((a) => { a.hidden = !wa; });
      document.addEventListener('click', (e) => {
        const a = e.target.closest('[data-wa]');
        if (a) { a.href = this.whatsappUrl(); return; } // atualiza o contexto no momento do clique
        if (e.target.closest('[data-visit]')) { e.preventDefault(); this.scheduleVisit(); return; }
        if (e.target.closest('[data-privacy]')) { e.preventDefault(); L.privacy.open(); return; }
        if (e.target.closest('[data-lot-clear]')) { this.setLot(null); $('#f-msg').value = ''; }
      });
    },

    scheduleVisit() {
      this.setLot(null);
      this.prefill('Agendar uma visita', 'Gostaria de agendar uma visita ao Lumoa Dunes. Melhor dia e horário para mim: ');
      L.ui.scrollToId('contato');
    },

    /** "Consultar este lote": leva a identificação do lote ao formulário */
    consultLot(lote) {
      this.setLot(lote);
      this.prefill('Lotes', `Tenho interesse no ${lote.ref}. Gostaria de saber valores, condições e a situação atual desse lote.`);
      L.ui.scrollToId('contato');
      L.bus.dispatchEvent(new CustomEvent('lot-consult', { detail: lote.pos }));
    },

    setLot(lote) {
      const inp = $('#f-lote'), tag = $('#loteTag');
      if (!inp) return;
      inp.value = lote ? lote.ref : '';
      tag.hidden = !lote;
      if (lote) tag.querySelector('span').textContent = lote.ref;
    },

    direct() {
      const box = $('#contactDirect');
      const cfg = L.config;
      const parts = [];
      if (L.leads.hasWhatsapp()) {
        parts.push(h('a', { class: 'btn btn--wa', href: this.whatsappUrl({ secao: 'contato' }), 'data-wa': '', target: '_blank', rel: 'noopener', html: '<svg><use href="#i-wa"/></svg>Falar com um consultor no WhatsApp' }));
      }
      parts.push(h('button', { class: 'btn btn--line', type: 'button', 'data-visit': '' }, 'Agendar visita'));
      if (L.leads.hasWhatsapp()) {
        const num = cfg.whatsapp.replace(/\D/g, '');
        parts.push(h('span', { class: 'copy-line', style: { color: 'var(--muted)', fontSize: '.9rem' } }, 'WhatsApp oficial: ', h('strong', null, '+' + num)));
      }
      if (cfg.email) parts.push(h('span', { class: 'copy-line', style: { color: 'var(--muted)', fontSize: '.9rem' } }, 'E-mail: ', h('strong', null, cfg.email)));
      parts.push(h('button', { class: 'link', type: 'button', 'data-luna-intent': 'consultor' }, 'Prefere falar com a Luma? Ela registra seu contato.'));
      box.replaceChildren(...parts);
    },

    prefill(interesse, msg) {
      const sel = $('#f-interesse');
      if (!sel) return; // formulário já enviado
      if (interesse) [...sel.options].forEach((o) => { if (o.text === interesse) sel.value = o.text; });
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
          h('button', { class: 'btn btn--line btn--sm', type: 'button', 'data-luna-open': '' }, 'Continuar com a Luma')));
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
      // Abre o Google Maps no centro do condomínio (config.coordenadas, calculado dos KML).
      // Sem coordenadas, o botão pede a localização à equipe em vez de pesquisar o bairro.
      if (link) {
        if (cfg.coordenadas) {
          link.href = `https://www.google.com/maps/search/?api=1&query=${cfg.coordenadas.lat},${cfg.coordenadas.lng}`;
          link.target = '_blank'; link.rel = 'noopener';
          link.textContent = 'Abrir no Google Maps';
          $('#mapNote').textContent = 'Ponto marcado: centro do condomínio, a partir da planta georreferenciada. As orientações de acesso são enviadas pela equipe comercial.';
        } else {
          link.removeAttribute('target');
          link.href = '#contato';
          link.textContent = 'Pedir a localização exata';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.askLocation();
          });
        }
      }
      // Distâncias e tempos verificados (data.local.acesso)
      const acesso = L.data.local.acesso || [];
      const list = $('#accessList');
      if (list && acesso.length) {
        list.replaceChildren(...acesso.map((a) => h('div', null, h('dt', null, a.destino), h('dd', null, [a.distancia, a.tempo].filter(Boolean).join(' · ')))));
        list.hidden = false;
        $('#accessGeneric').hidden = true;
      }
      const map = $('#map'), z = $('#mapZoom');
      if (z) z.addEventListener('click', () => {
        const on = map.classList.toggle('is-zoom');
        z.setAttribute('aria-pressed', String(on)); z.setAttribute('aria-label', on ? 'Afastar o mapa' : 'Aproximar o mapa');
        z.innerHTML = `<svg><use href="#i-${on ? 'minus' : 'plus'}"/></svg>`;
      });
    },
    askLocation() {
      const wa = L.leads.whatsappUrl('Olá! Pode me enviar a localização exata da entrada do Lumoa Dunes e como chegar?');
      if (wa) { window.open(wa, '_blank', 'noopener'); return; }
      L.contact.setLot(null);
      L.contact.prefill('Conhecer o empreendimento', 'Gostaria de receber a localização exata da entrada e as orientações de acesso.');
      L.ui.scrollToId('contato');
    },
  };

  /* Política de privacidade (diálogo). Se config.politicaPrivacidadeUrl estiver
     preenchido, os links abrem a página oficial no lugar do texto resumido. */
  L.privacy = {
    open() {
      const url = L.config.politicaPrivacidadeUrl;
      if (url) { window.open(url, '_blank', 'noopener'); return; }
      const d = $('#privacy');
      if (!d) return;
      this.last = document.activeElement;
      d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
      $('#privacyClose').focus();
      if (!this.bound) {
        this.bound = true;
        const close = () => this.close();
        $('#privacyClose').addEventListener('click', close);
        d.addEventListener('click', (e) => { if (e.target === d) close(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && d.classList.contains('is-open')) close(); });
      }
    },
    close() {
      const d = $('#privacy');
      d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll');
      if (this.last && this.last.focus) this.last.focus();
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
        if (!rows.length) { list.replaceChildren(h('p', { class: 'empty' }, 'Nenhum interessado ainda. Os contatos enviados pelo formulário e pela Luma aparecem aqui.')); return; }
        list.replaceChildren(...rows.map((r) => h('div', { class: 'lead-row' },
          h('strong', null, r.nome || 'Sem nome'),
          h('span', null, [r.telefone, r.email].filter(Boolean).join(' · ')),
          h('small', null, `${r.interesse || 'Interesse não informado'}${r.lote ? ' · ' + r.lote : ''} · via ${r.origem === 'luna' ? 'Luma' : 'formulário'} · ${new Date(r.atualizadoEm).toLocaleString('pt-BR')}`),
          r.mensagem ? h('p', null, r.mensagem) : null)));
      } catch (e) {
        list.replaceChildren(h('p', { class: 'empty' }, 'Não foi possível carregar os contatos agora. Feche e abra o painel para tentar de novo.'));
      }
    },
  };
})(window.Lumoa);
