/* =========================================================================
   LUMA — apresentadora virtual
   - Aparece em cena (figura recortada da peça oficial), fala com o visitante
     em balão e, se o visitante ativar, com voz (síntese de fala pt-BR).
   - Acompanha a navegação com falas curtas por seção.
   - Ao conversar, abre um palco: a Luma à esquerda, a fala dela em destaque,
     opções e campo para perguntar. O histórico fica disponível sob demanda.
   ========================================================================= */
(function (L) {
  const { $, $$, h, esc, scrollToId, isMobile, store, toast, copyText } = L.ui;
  const E = () => L.lunaEngine;
  const FIG = 'assets/img/luma-corpo.webp';
  const WELCOME = 'Olá! Seja muito bem-vindo ao Lumoa Dunes! Eu sou a Luma e vou apresentar a você um lugar onde a exclusividade encontra a natureza. Posso ajudar você a conhecer nosso empreendimento?';
  const START = ['sobre', 'lotes', 'casas', 'lazer', 'localizacao', 'consultor'];
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const strip = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const md = (s, trusted) => (trusted ? s : esc(s)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Falas da Luma ao chegar em cada seção (uma vez por visita)
  const CUES = {
    empreendimento: { text: 'São apenas **32 lotes de 200 m²**, em uma área total de 10.840 m², no bairro Olho D’Água.', opts: [['Ver a maquete 3D', 'goto:implantacao'], ['Me conte mais', 'intent:sobre']] },
    implantacao: { text: 'Esta é a **maquete 3D** do condomínio. Arraste para girar e toque nos números para conhecer cada espaço.', opts: [['Mostrar o rooftop', 'plan:rooftop'], ['Mostrar a piscina', 'plan:piscina']] },
    lazer: { text: 'A piscina tem **bar molhado, prainha e hidromassagem**. E o rooftop tem mirante com vista para as dunas.', opts: [['Quero saber mais', 'intent:lazer']] },
    casas: { text: 'São dois projetos: a **Casa Dunas**, térrea com rooftop, e a **Casa Estrela**, com 4 suítes. Quer que eu compare?', opts: [['Comparar as casas', 'intent:comparar']] },
    localizacao: { text: 'Santo Amaro é o portal mais autêntico dos **Lençóis Maranhenses**, com dunas imponentes e lagoas cristalinas.', opts: [['Onde fica exatamente?', 'intent:localizacao']] },
    contato: { text: 'Se preferir, eu mesma registro seu contato para um **consultor** falar com você.', opts: [['Registrar meu contato', 'lead']] },
  };

  /* ------------------------------ Voz ------------------------------ */
  const voice = {
    on: false, v: null,
    supported: () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    pick() {
      if (!this.supported()) return null;
      const all = speechSynthesis.getVoices().filter((v) => /^pt(-|_)?BR/i.test(v.lang) || /portugu.s.*brasil/i.test(v.name));
      const fem = all.find((v) => /luciana|francisca|maria|vit[oó]ria|female|feminina|google portugu/i.test(v.name));
      return fem || all[0] || speechSynthesis.getVoices().find((v) => /^pt/i.test(v.lang)) || null;
    },
    speak(text, onEnd) {
      if (!this.on || !this.supported()) { if (onEnd) onEnd(); return; }
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(strip(text).replace(/m²/g, ' metros quadrados'));
        u.lang = 'pt-BR'; u.rate = 1.02; u.pitch = 1.08;
        this.v = this.v || this.pick(); if (this.v) u.voice = this.v;
        u.onend = u.onerror = () => onEnd && onEnd();
        speechSynthesis.speak(u);
      } catch (e) { if (onEnd) onEnd(); }
    },
    stop() { try { if (this.supported()) speechSynthesis.cancel(); } catch (e) { /* sem voz */ } },
  };
  if (voice.supported()) try { speechSynthesis.onvoiceschanged = () => { voice.v = voice.pick(); }; } catch (e) { /* */ }

  const luna = {
    open_: false, busy: false, queue: Promise.resolve(), seen: new Set(), talking: 0,

    init() {
      voice.on = !!store.get('voz', false) && voice.supported();
      this.buildPresenter();
      this.buildStage();
      document.addEventListener('click', (e) => {
        const o = e.target.closest('[data-luna-open]');
        if (o) { e.preventDefault(); this.open(); return; }
        const q = e.target.closest('[data-luna-intent]');
        if (q) { e.preventDefault(); this.ask(q.dataset.lunaIntent); }
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.open_ && !$('#lightbox').classList.contains('is-open')) this.minimize(); });
      const hero = $('#inicio');
      if (hero) new IntersectionObserver(([en]) => { const on = en.intersectionRatio > 0.55; this.pres.classList.toggle('is-hero', on && !isMobile()); this.pres.classList.toggle('on-hero', on); }, { threshold: [0, 0.55, 1] }).observe(hero);
      L.bus.addEventListener('section', (e) => this.cue(e.detail));
      // No rodapé a Luma sai de cena para não cobrir os textos legais
      const foot = document.querySelector('.footer');
      if (foot) new IntersectionObserver(([en]) => { this.pres.classList.toggle('at-end', en.isIntersecting); if (en.isIntersecting) this.hush(); }, { threshold: 0.25 }).observe(foot);
      // Se a pessoa continua rolando, o balão sai da frente do conteúdo
      addEventListener('scroll', () => {
        if (this.pres.classList.contains('speech-open') && !this.pres.matches(':hover') && Math.abs(scrollY - this.sayY) > innerHeight * 0.45) this.hush();
      }, { passive: true });
      const start = () => { this.fig.classList.add('arrive'); setTimeout(() => isMobile() ? this.say('Olá! Eu sou a **Luma**, sua assistente no Lumoa Dunes. Posso apresentar o empreendimento para você?', [['Sim, apresentar', 'intent:sobre']], 8000) : this.say(WELCOME, [['Sim, quero conhecer', 'intent:sobre'], ['Tenho uma pergunta', 'open']], 14000), isMobile() ? 1800 : 900); };
      if (document.documentElement.classList.contains('boot')) L.bus.addEventListener('ready', start, { once: true }); else setTimeout(start, 400);
    },

    isFullscreen() { return this.open_; },

    /* ---------------------- Apresentadora em cena ---------------------- */
    buildPresenter() {
      this.fig = h('button', { class: 'presenter__figure', type: 'button', 'aria-label': 'Conversar com a Luma', html: `<img src="${FIG}" alt="Luma, assistente virtual do Lumoa Dunes">` });
      this.fig.addEventListener('click', () => this.open());
      this.sText = h('p', { class: 'speech__text' });
      this.sActs = h('div', { class: 'speech__actions' });
      this.soundBtns = [];
      const sound = this.soundButton();
      const speech = h('div', { class: 'presenter__speech', role: 'status', 'aria-live': 'polite' },
        h('div', { class: 'speech__who' }, h('strong', null, 'Luma'), h('span', { class: 'wave', 'aria-hidden': 'true', html: '<i></i><i></i><i></i><i></i>' }),
          h('div', { class: 'speech__tools' }, sound,
            h('button', { type: 'button', 'aria-label': 'Ocultar fala', title: 'Ocultar', html: '<svg><use href="#i-close"/></svg>', onclick: () => this.hush() }))),
        this.sText, this.sActs);
      this.pres = h('div', { class: 'presenter is-hero', id: 'presenter' }, speech, this.fig);
      document.body.append(this.pres);
    },

    soundButton(withLabel) {
      const b = h('button', { type: 'button', class: voice.on ? 'is-on' : '', 'aria-pressed': String(voice.on), title: 'Ouvir a voz da Luma' });
      const paint = () => { b.innerHTML = `<svg><use href="#i-${voice.on ? 'sound' : 'mute'}"/></svg>` + (withLabel ? `<span>${voice.on ? 'Voz ligada' : 'Ouvir a Luma'}</span>` : ''); b.classList.toggle('is-on', voice.on); b.setAttribute('aria-pressed', String(voice.on)); b.setAttribute('aria-label', voice.on ? 'Desligar a voz da Luma' : 'Ligar a voz da Luma'); };
      paint();
      if (!voice.supported()) b.hidden = true;
      b.addEventListener('click', () => {
        voice.on = !voice.on; store.set('voz', voice.on);
        this.soundBtns.forEach((p) => p());
        if (voice.on) voice.speak(this.lastSpoken || WELCOME, () => this.talk(false)), this.talk(true); else { voice.stop(); this.talk(false); }
      });
      this.soundBtns.push(paint);
      return b;
    },

    talk(on) {
      this.talking = Math.max(0, this.talking + (on ? 1 : -1));
      if (!on) this.talking = 0;
      const t = this.talking > 0;
      this.pres.classList.toggle('is-talking', t);
      this.stage.classList.toggle('is-talking', t);
    },

    /** Fala no balão, com digitação e voz */
    async say(text, opts = [], ttl = 10000) {
      if (this.open_) return;
      clearTimeout(this.hideT);
      this.sayY = scrollY;
      this.pres.classList.add('speech-open');
      this.sActs.replaceChildren();
      this.lastSpoken = text;
      this.talk(true);
      voice.speak(text, () => this.talk(false));
      await this.type(this.sText, md(text));
      if (!voice.on) this.talk(false);
      opts.forEach(([label, act], i) => {
        const b = h('button', { type: 'button', class: 'opt' + (i === 0 ? ' primary' : '') }, label);
        b.addEventListener('click', () => this.run(act));
        this.sActs.append(b);
      });
      this.hideT = setTimeout(() => this.hush(), ttl);
    },
    hush() { clearTimeout(this.hideT); this.pres.classList.remove('speech-open'); voice.stop(); this.talk(false); },

    cue(section) {
      const c = CUES[section];
      // No celular o balão ocuparia a tela toda: a Luma só fala quando a pessoa toca nela
      if (!c || isMobile() || this.seen.has(section) || this.open_ || document.body.classList.contains('no-scroll')) return;
      this.seen.add(section);
      clearTimeout(this.cueT);
      this.cueT = setTimeout(() => this.say(c.text, c.opts, isMobile() ? 6500 : 9000), 1200);
    },

    run(act) {
      const [k, v] = act.split(':');
      this.hush();
      if (k === 'open') return this.open();
      if (k === 'intent') return this.ask(v);
      if (k === 'lead') return this.ask('lead');
      if (k === 'goto') return scrollToId(v);
      if (k === 'plan') { L.plan.select(v); return scrollToId('implantacao'); }
    },

    /** Digita HTML simples (texto + <strong>) caractere a caractere */
    type(el, html) {
      return new Promise((res) => {
        if (reduce()) { el.innerHTML = html; return res(); }
        const tmp = h('div', { html }); const text = tmp.textContent;
        let i = 0; const caret = '<span class="caret"></span>';
        const tick = () => {
          i = Math.min(text.length, i + 2);
          // reconstrói mantendo o negrito: corta o HTML na posição i de texto visível
          el.innerHTML = cutHtml(html, i) + (i < text.length ? caret : '');
          if (i < text.length) this.typeT = setTimeout(tick, 16); else res();
        };
        clearTimeout(this.typeT); tick();
      });
    },

    /* ----------------------------- Palco ----------------------------- */
    buildStage() {
      this.you = h('p', { class: 'lstage__you' });
      this.speech = h('div', { class: 'lstage__speech', 'aria-live': 'polite' });
      this.media = h('div', { class: 'lstage__media' });
      this.opts = h('div', { class: 'lstage__opts', role: 'group', 'aria-label': 'Opções' });
      this.hist = h('div', { class: 'lstage__history', hidden: true });
      this.input = h('textarea', { id: 'lunaInput', rows: '1', placeholder: 'Pergunte algo para a Luma…', 'aria-label': 'Pergunta para a Luma', maxlength: '600' });
      const send = h('button', { class: 'lstage__send', type: 'submit', 'aria-label': 'Enviar', html: '<svg><use href="#i-send"/></svg>' });
      const form = h('form', { class: 'lstage__form' }, this.input, send);
      form.addEventListener('submit', (e) => { e.preventDefault(); this.submitInput(); });
      this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.submitInput(); } });
      this.histBtn = h('button', { type: 'button', html: '<svg><use href="#i-chat"/></svg><span>Conversa</span>', 'aria-pressed': 'false', onclick: () => this.toggleHistory() });
      const bar = h('div', { class: 'lstage__bar' },
        h('span', { class: 'wave', 'aria-hidden': 'true', html: '<i></i><i></i><i></i><i></i>' }),
        this.soundButton(true), this.histBtn,
        h('button', { type: 'button', 'aria-label': 'Minimizar', title: 'Minimizar', html: '<svg><use href="#i-minus"/></svg>', onclick: () => this.minimize() }),
        h('button', { type: 'button', 'aria-label': 'Encerrar conversa', title: 'Encerrar conversa', html: '<svg><use href="#i-close"/></svg>', onclick: () => this.close() }));
      this.stage = h('section', { class: 'lstage', id: 'lunaStage', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Conversa com a Luma', 'aria-hidden': 'true' },
        h('div', { class: 'lstage__box' },
          h('div', { class: 'lstage__set' }, h('img', { src: FIG, alt: '' }), h('div', { class: 'lstage__tag' }, h('strong', null, 'Luma'), h('span', null, 'Assistente virtual · online'))),
          h('div', { class: 'lstage__main' }, bar, this.you, h('div', { class: 'lstage__scroll' }, this.speech, this.media), this.opts, form,
            h('p', { class: 'lstage__legal' }, 'A Luma responde com base no catálogo oficial. Valores, condições e disponibilidade: equipe comercial.'), this.hist)));
      this.stage.addEventListener('click', (e) => { if (e.target === this.stage) this.minimize(); });
      document.body.append(this.stage);
    },

    open(opts = {}) {
      this.hush();
      if (!this.open_) {
        this.open_ = true;
        this.stage.classList.add('is-open'); this.stage.setAttribute('aria-hidden', 'false');
        this.pres.classList.add('is-hidden');
        document.body.classList.add('no-scroll');
      }
      if (!this.started) {
        this.started = true;
        if (!opts.skipWelcome) this.enqueue(() => this.play({ say: [WELCOME], quick: START }));
      }
      if (!isMobile()) setTimeout(() => this.input.focus({ preventScroll: true }), 400);
    },
    minimize() {
      if (!this.open_) return;
      this.open_ = false; voice.stop(); this.talk(false);
      this.stage.classList.remove('is-open'); this.stage.setAttribute('aria-hidden', 'true');
      this.pres.classList.remove('is-hidden');
      if (!document.body.classList.contains('menu-open')) document.body.classList.remove('no-scroll');
    },
    close() {
      this.minimize();
      this.started = false; this.log = [];
      this.speech.replaceChildren(); this.media.replaceChildren(); this.opts.replaceChildren(); this.you.textContent = '';
      E().ctx = { topic: null, house: null, expect: null, flow: null, history: [] };
      toast('Conversa encerrada. A Luma continua aqui quando você precisar.');
    },

    toggleHistory() {
      const show = this.hist.hidden;
      this.hist.hidden = !show; this.histBtn.classList.toggle('is-on', show); this.histBtn.setAttribute('aria-pressed', String(show));
      if (show) {
        const rows = (this.log || []).map((m) => h('p', { class: m.u ? 'u' : '' }, h('b', null, m.u ? 'Você' : 'Luma'), m.t));
        this.hist.replaceChildren(...(rows.length ? rows : [h('p', null, 'A conversa ainda não começou.')]));
        this.hist.scrollTop = this.hist.scrollHeight;
      }
    },
    remember(u, t) { (this.log = this.log || []).push({ u, t: strip(t) }); },

    /** Abre o palco e trata uma intenção como escolha do visitante */
    ask(intent) {
      const wasStarted = this.started;
      this.open({ skipWelcome: true });
      this.started = true;
      const KB = L.lunaKB;
      const label = intent === 'lead' ? 'Quero falar com um consultor' : (KB.labels[intent] || (intent.startsWith('amenity:') && L.findLazer(intent.slice(8))?.nome) || intent);
      this.userSays(label, intent);
      this.enqueue(() => this.play(intent === 'lead' ? E().startLead() : E().respond(intent)));
      return wasStarted;
    },

    submitInput() {
      const text = this.input.value.trim();
      if (!text) return;
      this.input.value = '';
      this.send(text);
    },

    send(text, display) {
      const f0 = E().ctx.flow;
      this.userSays(display || (f0 && f0.step === 'telefone' ? L.leads.formatPhone(text) : text));
      this.enqueue(async () => {
        const flow = E().ctx.flow;
        if (flow) {
          if (/\?$/.test(text) && flow.step !== 'confirm') {
            const id = E().detect(text);
            if (id) { const t = E().respond(id); E().ctx.flow = flow; t.say = (t.say || []).concat(['Quando quiser, seguimos com o seu cadastro.']); return this.play(t); }
          }
          const turn = E().flowInput(text);
          if (turn && turn.submit) { this.thinking(true); const t = await E().submitLead(); this.thinking(false); return this.play(t); }
          return this.play(turn);
        }
        const id = E().detect(text);
        if (id === 'lead') return this.play(E().startLead());
        if (id) return this.play(E().respond(id));
        if (await L.lunaAI.available()) return this.aiAnswer(text);
        return this.play(E().respond('fallback'));
      });
    },

    userSays(text, topic) {
      this.you.innerHTML = `<b>Você</b>${esc(text)}`;
      this.opts.replaceChildren();
      this.remember(true, text);
      if (!E().ctx.flow) E().ctx.history.push({ role: 'user', text, topic: topic && topic !== 'lead' ? topic : null });
    },

    enqueue(fn) {
      this.queue = this.queue.then(async () => { this.busy = true; try { await fn(); } catch (e) { console.error(e); } this.busy = false; });
      return this.queue;
    },

    thinking(on) {
      if (on) { this.speech.innerHTML = '<p><span class="caret"></span></p>'; this.talk(true); } else this.talk(false);
    },

    /** Reproduz a resposta da Luma no palco: fala em destaque, imagens e opções */
    async play(turn) {
      if (!turn) return;
      this.speech.replaceChildren(); this.media.replaceChildren(); this.opts.replaceChildren();
      const lines = turn.say || [];
      const spoken = lines.map(strip).join(' ');
      this.talk(true);
      voice.speak(spoken, () => this.talk(false));
      for (const s of lines) {
        const p = h('p');
        this.speech.append(p);
        if (/<(ul|dl|p)[\s>]/.test(s)) { p.replaceWith(h('div', { html: s })); }
        else await this.type(p, md(s, true));
        E().ctx.history.push({ role: 'assistant', text: strip(s), topic: E().ctx.topic });
        this.remember(false, s);
        await new Promise((r) => setTimeout(r, reduce() ? 0 : 160));
      }
      if (!voice.on) this.talk(false);
      const cards = [...(turn.cards || []), ...(turn.cardsRow || [])];
      cards.forEach((c, i) => this.media.append(this.card(c, i)));
      this.renderOptions(turn.actions || [], turn.quick || (E().ctx.flow ? [] : ['menu', 'consultor']));
      this.input.placeholder = (turn.input && turn.input.placeholder) || 'Pergunte algo para a Luma…';
      this.input.setAttribute('inputmode', turn.input && turn.input.type === 'tel' ? 'tel' : turn.input && turn.input.type === 'email' ? 'email' : 'text');
      if (turn.input && !isMobile()) this.input.focus({ preventScroll: true });
    },

    async aiAnswer(text) {
      this.speech.replaceChildren(); this.media.replaceChildren();
      this.thinking(true);
      const p = h('p');
      const res = await L.lunaAI.ask(E().ctx.history, text, (partial) => { if (!p.isConnected) this.speech.replaceChildren(p); p.innerHTML = md(partial); });
      this.thinking(false);
      if (!res) return this.play(E().respond('fallback'));
      this.speech.replaceChildren(h('p', { html: md(res.text).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') }));
      voice.speak(res.text, () => this.talk(false)); if (voice.on) this.talk(true);
      E().ctx.history.push({ role: 'assistant', text: res.text, topic: 'ia' });
      this.remember(false, res.text);
      E().ctx.topic = null;
      const acts = [];
      if (res.secao) acts.push({ label: 'Ver no site', act: 'goto', to: res.secao });
      if (res.blocked || res.secao === 'contato') acts.push({ label: 'Falar com um consultor', act: 'lead', primary: true });
      this.renderOptions(acts, ['sobre', 'casas', 'lazer', 'consultor']);
    },

    card(c, i) {
      const big = ['implantacao', 'planta-terreo', 'planta-estrela-superior'].includes(c.img);
      const img = c.img ? h('img', { src: L.img(c.img, !big), alt: '' }) : null;
      const media = h('div', { class: 'lcard__img' }, img || (c.plan ? L.zoomPlan(c.plan) : null));
      const b = h('button', { type: 'button', class: 'lcard', style: `--i:${i}`, 'aria-label': c.title },
        media, h('span', { class: 'lcard__b' }, h('strong', null, c.title), c.text ? h('span', null, c.text) : null,
          c.spec ? h('span', null, c.spec.map(([v, u]) => `${v} ${u}`).join(' · ')) : null));
      b.addEventListener('click', () => {
        if (c.act) return this.doAction(c.act);
        if (c.img) L.lightbox.open(c.gallery || [{ src: c.img, legenda: c.title }], 0);
      });
      return b;
    },

    renderOptions(actions, quick) {
      const KB = L.lunaKB;
      actions.forEach((a) => {
        let el;
        if (a.act === 'link' || a.act === 'whatsapp') {
          const href = a.act === 'whatsapp' ? L.leads.whatsappUrl('Olá! Vim pelo site e gostaria de saber mais sobre o Lumoa Dunes.') : a.href;
          if (!href) return;
          el = h('a', { href, target: '_blank', rel: 'noopener', class: 'opt' + (a.primary ? ' primary' : ''), html: (a.act === 'whatsapp' ? '<svg><use href="#i-wa"/></svg>' : '') + esc(a.label) });
        } else {
          el = h('button', { type: 'button', class: 'opt' + (a.primary ? ' primary' : '') }, a.label);
          el.addEventListener('click', () => {
            if (a.act === 'flow') { if (!E().ctx.flow) return; this.send(a.value, a.label); return; }
            this.doAction(a);
          });
        }
        this.opts.append(el);
      });
      quick.filter((id) => KB.labels[id]).forEach((id) => {
        const b = h('button', { type: 'button', class: 'opt' }, KB.labels[id]);
        b.addEventListener('click', () => this.ask(id));
        this.opts.append(b);
      });
    },

    doAction(a) {
      const leave = (fn) => { this.minimize(); setTimeout(fn, 250); };
      switch (a.act) {
        case 'goto': return leave(() => scrollToId(a.to));
        case 'plan': return leave(() => { L.plan.select(a.id); scrollToId('implantacao'); });
        case 'house': return leave(() => { L.houses.show(a.id, { tab: a.tab || 'fachadas' }); scrollToId('casas'); });
        case 'gallery': return leave(() => { L.gallery.filter(a.cat); scrollToId('galeria'); });
        case 'lead': this.userSays('Quero falar com um consultor', 'lead'); return this.enqueue(() => this.play(E().startLead(a.interesse)));
        case 'intent': return this.ask(a.id);
        case 'copy': return copyText(a.text);
      }
    },
  };

  // Corta um HTML simples após n caracteres visíveis, preservando as tags abertas
  function cutHtml(html, n) {
    let out = '', count = 0, open = [];
    const re = /(<[^>]+>)|([^<]+)/g; let m;
    while ((m = re.exec(html)) && count < n) {
      if (m[1]) { out += m[1]; const t = m[1].match(/^<\/?(\w+)/); if (t) { if (m[1][1] === '/') open.pop(); else if (!/\/>$/.test(m[1])) open.push(t[1]); } }
      else { const take = m[2].slice(0, n - count); out += take; count += take.length; }
    }
    return out + open.reverse().map((t) => `</${t}>`).join('');
  }

  L.luna = luna;
})(window.Lumoa);
