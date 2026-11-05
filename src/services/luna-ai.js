/* =========================================================================
   Integração de IA da Luna — sem chaves no frontend
   Provedores, nesta ordem:
   1) Artefato Claude: capacidade "sample" do visualizador (sem chave, com
      consentimento do visitante).
   2) config.lunaAiEndpoint: seu servidor (server/luna-proxy.js), que guarda a
      chave da API em variável de ambiente.
   Sem provedor, a Luna segue apenas com o atendimento guiado.
   ========================================================================= */
(function (L) {
  let samplePromise = null;
  let disabled = false;

  function getSample() {
    if (!samplePromise) {
      samplePromise = (async () => {
        try { return window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { return null; }
      })();
    }
    return samplePromise;
  }

  // Conhecimento oficial em texto, enviado junto com as instruções
  function knowledge() {
    const D = L.data;
    const lazer = D.lazer.map((x) => `${x.n}. ${x.nome}: ${x.desc}`).join('\n');
    const casas = D.casas.map((c) => `${c.nome} — ${c.tipo}, ${c.suites} suítes, ${c.area} m². ${c.resumo}\n` +
      c.plantas.map((p) => `  ${p.titulo}: ` + p.ambientes.map(([n, a]) => `${n} ${a}`).join('; ')).join('\n')).join('\n');
    return [
      `Empreendimento: ${D.nome}. Slogan: "${D.slogan}". Localização: ${D.local.cidade} - ${D.local.uf}, bairro ${D.local.bairro}, ${D.local.regiao}.`,
      ...Object.values(D.textos),
      `Números: ${D.numeros.map((n) => `${n.rotulo} ${n.valor} ${n.unidade}`).join('; ')}.`,
      `Espaços numerados na implantação:\n${lazer}`,
      `Casas:\n${casas}`,
      `Destaques: ${D.destaques.map((d) => d.texto).join(', ')}.`,
      `Assinatura do catálogo: ${D.realizacao}.`,
    ].join('\n');
  }

  const SECOES = ['empreendimento', 'condominio', 'implantacao', 'lazer', 'casas', 'localizacao', 'galeria', 'contato'];

  function instructions() {
    return `Você é a Luna, anfitriã virtual oficial do condomínio Lumoa Dunes. Fale em português do Brasil, com tom acolhedor, elegante, profissional e natural.
REGRAS OBRIGATÓRIAS:
- Use SOMENTE as informações oficiais abaixo. Se algo não estiver nelas, diga com gentileza que essa informação não consta no catálogo e ofereça o contato de um consultor.
- NUNCA informe ou estime preços, valores, parcelas, condições de pagamento, descontos, disponibilidade de lotes, prazos de obra ou de entrega, retorno de investimento. Para isso, encaminhe sempre à equipe comercial.
- Não invente distâncias, tempos de deslocamento, endereços, materiais, acabamentos ou equipamentos.
- Responda em no máximo 90 palavras, em 1 a 3 parágrafos curtos, sem listas longas. Pode usar **negrito** com moderação.
- Se for útil levar o visitante a uma parte do site, termine com uma linha separada exatamente assim: SECAO: <id>, onde <id> é um de: ${SECOES.join(', ')}.

INFORMAÇÕES OFICIAIS:
${knowledge()}`;
  }

  // Bloqueio extra: se a resposta trouxer valores, substitui pela regra comercial
  function guard(text) {
    const risky = /(R\$\s?\d)|(\d+[\.,]?\d*\s?(mil|milh|reais))|\b(parcela|parcelas|entrada de|desconto de|financiamento em)\b|\b\d+\s+lotes?\s+(dispon|vendid|restant)/i;
    if (risky.test(text)) return { text: L.lunaKB.COMERCIAL + ' Posso pedir para um consultor falar com você?', secao: 'contato', blocked: true };
    let secao = null;
    const m = text.match(/\n?\s*SECAO:\s*([a-z]+)\s*$/i);
    if (m) { secao = SECOES.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : null; text = text.slice(0, m.index).trim(); }
    return { text, secao };
  }

  function toMessages(history, question) {
    const msgs = [];
    const push = (role, content) => {
      if (!content) return;
      const last = msgs[msgs.length - 1];
      if (last && last.role === role) last.content += '\n' + content; else msgs.push({ role, content });
    };
    push('user', instructions() + '\n\nA conversa com o visitante começa agora.');
    push('assistant', 'Entendido. Vou responder apenas com as informações oficiais do Lumoa Dunes.');
    history.slice(-10).forEach((m) => push(m.role, m.text));
    push('user', question);
    return msgs;
  }

  L.lunaAI = {
    async available() {
      if (disabled) return false;
      if (L.config.lunaAiEndpoint) return true;
      return !!(await getSample());
    },

    /** Pergunta à IA. onText recebe o texto parcial (streaming). Retorna {text, secao} ou null. */
    async ask(history, question, onText) {
      if (disabled) return null;
      const sample = await getSample();
      if (sample) {
        try {
          const r = await sample(toMessages(history, question), {
            modelTier: 'quick', cache: false,
            onText: ({ text }) => { if (onText) onText(guard(text).text); },
          });
          return guard(r.text);
        } catch (e) {
          if (e && (e.code === 'not_granted' || e.code === 'unavailable')) disabled = true;
          console.warn('[Luna] IA indisponível:', e && (e.code || e.message));
        }
      }
      if (L.config.lunaAiEndpoint) {
        try {
          const r = await fetch(L.config.lunaAiEndpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: history.slice(-10), question }),
          });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const j = await r.json();
          return j && j.text ? guard(j.text) : null;
        } catch (e) { console.warn('[Luna] endpoint de IA falhou:', e.message); }
      }
      return null;
    },

    _instructions: instructions, // usado pelo servidor de exemplo
  };
})(window.Lumoa);
