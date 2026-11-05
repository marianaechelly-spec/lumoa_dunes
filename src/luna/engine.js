/* =========================================================================
   LUNA — Motor de conversa
   - Reconhece a intenção do visitante (palavras-chave + contexto da conversa)
   - Conduz o fluxo de coleta de interesse com consentimento (LGPD)
   - Recorre à IA (quando disponível) só para perguntas fora do roteiro
   ========================================================================= */
(function (L) {
  const KB = () => L.lunaKB;

  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, ' ').replace(/[^a-z0-9$,\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Palavras genéricas valem menos na pontuação
  const WEAK = new Set(['onde', 'fica', 'conhecer', 'sobre', 'casa', 'perto', 'longe', 'cidade', 'pessoa', 'sala', 'pronto', 'pagar', 'descansar', 'esporte', 'entrada', 'vaga', 'contato', 'atendimento', 'familia', 'criancas', 'projeto', 'tamanho', 'metros', '200']);

  function score(text) {
    const t = ' ' + norm(text) + ' ';
    const out = [];
    for (const [id, it] of Object.entries(KB().intents)) {
      if (!it.kw || !it.kw.length) continue;
      let s = 0;
      for (const k of it.kw) {
        const nk = norm(k);
        if (!nk) continue;
        if (t.includes(' ' + nk + ' ')) s += nk.includes(' ') ? 3 : (WEAK.has(nk) ? 0.5 : 1.5);
      }
      if (s > 0 && it.priority) s += it.priority >= 10 ? 5 : it.priority / 5;
      if (s > 0) out.push({ id, s });
    }
    return out.sort((a, b) => b.s - a.s);
  }

  const engine = {
    ctx: { topic: null, house: null, expect: null, flow: null, history: [] },

    detect(text) {
      const ranked = score(text);
      const nt = ' ' + norm(text) + ' ';
      const ctx = this.ctx;
      let id = ranked[0] ? ranked[0].id : null;

      // Casa mencionada na mensagem atualiza o contexto
      if (/\bestrela\b/.test(nt)) ctx.house = 'estrela';
      else if (/casa dunas|modelo dunas|\bterrea\b/.test(nt)) ctx.house = 'dunas';

      // Resposta à pergunta "de qual casa?"
      if (ctx.expect === 'house-for-plan' && (id === 'casa-dunas' || id === 'casa-estrela' || /\bdunas\b/.test(nt))) {
        ctx.house = id === 'casa-estrela' ? 'estrela' : (id === 'casa-dunas' || /\bdunas\b/.test(nt) ? 'dunas' : ctx.house);
        ctx.expect = null;
        return 'plantas';
      }
      // "quantas suítes?" / "qual a área?" com uma casa em foco
      if (ctx.house && (/\bsuites?\b|\barea\b|\bmetragem\b|\bm2\b|quantos quartos/.test(nt)) && (!id || ['plantas', 'casas', 'lotes'].includes(id))) {
        if (!/\blotes?\b|terreno/.test(nt)) return 'casa-' + ctx.house;
      }
      // "e a outra?" alterna entre os dois modelos de casa
      if (ctx.house && /\b(a outra|outra casa|outro modelo|o outro|segunda opcao)\b/.test(nt)) return ctx.house === 'dunas' ? 'casa-estrela' : 'casa-dunas';
      // Pedido de "mais detalhes" retoma o tópico atual
      if (!id && ctx.topic && /\b(mais|detalhes?|continua|continue|e ai|e entao)\b/.test(nt)) return ctx.topic;
      // "e a planta?", "e as fotos?" usam o contexto
      if (id === 'plantas' && !ctx.house && ctx.topic && ctx.topic.startsWith('casa-')) ctx.house = ctx.topic.slice(5);
      // Respostas curtas de concordância depois de uma oferta da Luna
      if (!id && ctx.offer && /^(sim|claro|quero|pode|pode ser|ok|beleza|bora|isso|aceito|com certeza|por favor)\b/.test(norm(text))) return ctx.offer;
      return id;
    },

    respond(id) {
      const it = KB().intents[id] || KB().intents.fallback;
      const turn = it.r(this.ctx) || {};
      this.ctx.topic = id;
      this.ctx.expect = turn.expect || null;
      this.ctx.offer = (turn.actions || []).some((a) => a.act === 'lead') ? 'lead' : null;
      if (id.startsWith('casa-')) this.ctx.house = id.slice(5);
      return turn;
    },

    /* --------------------- Fluxo de coleta de interesse --------------------- */
    startLead(interesse) {
      this.ctx.flow = { step: 'consent', data: { interesse: interesse || this.guessInterest() } };
      return {
        say: ['Perfeito! Para um consultor entrar em contato, vou pedir seu **nome**, **telefone** e, se quiser, seu **e-mail**.',
          'Seus dados serão usados apenas para o atendimento sobre o Lumoa Dunes, conforme a LGPD. Você autoriza?'],
        actions: [{ label: 'Sim, autorizo', act: 'flow', value: 'sim', primary: true }, { label: 'Agora não', act: 'flow', value: 'nao' }],
      };
    },

    guessInterest() {
      const t = this.ctx.topic || '';
      if (t === 'casa-dunas') return 'Casa Dunas';
      if (t === 'casa-estrela') return 'Casa Estrela';
      if (t === 'lotes' || t === 'disponibilidade') return 'Lotes';
      if (t === 'visita') return 'Agendar uma visita';
      return '';
    },

    flowInput(raw) {
      const f = this.ctx.flow;
      const text = String(raw || '').trim();
      const n = norm(text);
      if (/^(cancelar|cancela|parar|sair|deixa pra la|agora nao|nao quero)$/.test(n) || (f.step === 'consent' && /^(nao|n)\b/.test(n))) {
        this.ctx.flow = null;
        return { say: ['Tudo bem! Seus dados não foram registrados. Posso continuar apresentando o Lumoa Dunes para você.'], quick: ['casas', 'lazer', 'localizacao', 'menu'] };
      }
      switch (f.step) {
        case 'consent':
          if (/^(sim|s|autorizo|claro|pode|ok|aceito|quero|concordo)\b/.test(n)) { f.data.consentimento = true; f.step = 'nome'; return { say: ['Obrigada! Qual é o seu **nome completo**?'], input: { placeholder: 'Seu nome completo', autocomplete: 'name' } }; }
          return { say: ['Só preciso da sua autorização para seguir. Você autoriza o uso dos seus dados para o contato?'], actions: [{ label: 'Sim, autorizo', act: 'flow', value: 'sim', primary: true }, { label: 'Agora não', act: 'flow', value: 'nao' }] };
        case 'nome':
          if (text.length < 3 || !/[a-zà-ú]{2,}/i.test(text) || /\d/.test(text) || text.length > 80) return { say: ['Pode me dizer seu nome completo? Por exemplo: Maria Souza.'], input: { placeholder: 'Seu nome completo' } };
          f.data.nome = text.replace(/\s+/g, ' ').replace(/(^|\s)\S/g, (c) => c.toUpperCase());
          f.step = 'telefone';
          return { say: [`Prazer, **${f.data.nome.split(' ')[0]}**! Qual é o seu **telefone ou WhatsApp** com DDD?`], input: { placeholder: '(98) 90000-0000', type: 'tel', autocomplete: 'tel' } };
        case 'telefone': {
          const d = text.replace(/\D/g, '');
          if (d.length < 10 || d.length > 13) return { say: ['Esse número parece incompleto. Informe com DDD, por exemplo (98) 90000-0000.'], input: { placeholder: '(98) 90000-0000', type: 'tel' } };
          f.data.telefone = L.leads.formatPhone(d.length > 11 ? d.slice(-11) : d);
          f.step = 'email';
          return { say: ['Anotado! Se quiser, informe também seu **e-mail**. Ou toque em pular.'], actions: [{ label: 'Pular', act: 'flow', value: '__skip' }], input: { placeholder: 'voce@email.com', type: 'email', autocomplete: 'email' } };
        }
        case 'email':
          if (text !== '__skip') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text)) return { say: ['Esse e-mail não parece válido. Confira o formato, por exemplo voce@email.com, ou toque em pular.'], actions: [{ label: 'Pular', act: 'flow', value: '__skip' }], input: { placeholder: 'voce@email.com', type: 'email' } };
            f.data.email = text;
          }
          if (!f.data.interesse) {
            f.step = 'interesse';
            return { say: ['E qual é o seu principal interesse?'], actions: ['Lotes', 'Casa Dunas', 'Casa Estrela', 'Agendar uma visita', 'Conhecer o empreendimento'].map((v) => ({ label: v, act: 'flow', value: v })) };
          }
          return this.confirm();
        case 'interesse':
          f.data.interesse = text.slice(0, 60);
          return this.confirm();
        case 'confirm':
          if (/^(confirmar|confirmo|sim|enviar|pode enviar|ok|isso)\b/.test(n)) return { submit: true };
          if (/corrig|editar|errado|mudar/.test(n)) { f.step = 'nome'; return { say: ['Sem problemas, vamos corrigir. Qual é o seu nome completo?'], input: { placeholder: 'Seu nome completo' } }; }
          return { say: ['Posso enviar seus dados para a equipe comercial?'], actions: [{ label: 'Confirmar e enviar', act: 'flow', value: 'confirmar', primary: true }, { label: 'Corrigir', act: 'flow', value: 'corrigir' }] };
      }
      return null;
    },

    confirm() {
      const d = this.ctx.flow.data;
      this.ctx.flow.step = 'confirm';
      const row = (k, v) => (v ? `<div><dt>${k}</dt><dd>${L.ui.esc(v)}</dd></div>` : '');
      return {
        say: ['Confira seus dados:', `<dl class="summary">${row('Nome', d.nome)}${row('Telefone', d.telefone)}${row('E-mail', d.email)}${row('Interesse', d.interesse)}</dl>`],
        actions: [{ label: 'Confirmar e enviar', act: 'flow', value: 'confirmar', primary: true }, { label: 'Corrigir', act: 'flow', value: 'corrigir' }],
      };
    },

    async submitLead() {
      const d = this.ctx.flow.data;
      const temas = [...new Set(this.ctx.history.filter((m) => m.topic).map((m) => m.topic))].slice(-6).join(', ');
      const res = await L.leads.submit({ ...d, origem: 'luna', mensagem: temas ? `Assuntos na conversa com a Luna: ${temas}` : '' });
      const first = d.nome.split(' ')[0];
      this.ctx.flow = null;
      if (res.ok && res.channel !== 'whatsapp') {
        L.bus.dispatchEvent(new CustomEvent('lead', { detail: d }));
        return { say: [`Pronto, **${first}**! Seus dados foram enviados para a nossa equipe comercial, e um consultor vai entrar em contato pelo telefone ${d.telefone}.`, 'Enquanto isso, quer continuar conhecendo o Lumoa Dunes?'], quick: ['casas', 'lazer', 'galeria'] };
      }
      if (res.channel === 'whatsapp') {
        return { say: [`Quase lá, **${first}**! Toque no botão abaixo para enviar sua mensagem pronta para o WhatsApp oficial da equipe comercial.`], actions: [{ label: 'Abrir WhatsApp', act: 'link', href: res.url, primary: true }], quick: ['casas', 'lazer'] };
      }
      return {
        say: ['Não consegui enviar seus dados agora. Eles ficaram salvos neste aparelho.', 'Você pode copiar a mensagem e tentar novamente pelo formulário de contato em alguns instantes.'],
        actions: [{ label: 'Copiar meus dados', act: 'copy', text: res.text }, { label: 'Ir para o contato', act: 'goto', to: 'contato' }],
      };
    },
  };

  engine.norm = norm;
  engine.score = score;
  L.lunaEngine = engine;
})(window.Lumoa);
