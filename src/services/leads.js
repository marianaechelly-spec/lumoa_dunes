/* =========================================================================
   Serviço de interessados (leads)
   Ordem de envio:
   1) config.leadEndpoint  → POST JSON para o seu servidor/serviço de formulários
   2) banco do artefato    → quando o site roda como Artefato do Claude (window.claude)
   3) WhatsApp oficial     → abre a conversa com a mensagem pronta (config.whatsapp)
   4) sem canal disponível → guarda neste navegador e informa o visitante
   ========================================================================= */
(function (L) {
  const cfg = () => L.config || {};
  let dbPromise = null;

  const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

  async function capability(name) {
    try { return window.claude && window.claude.use ? await window.claude.use(name) : null; } catch (e) { return null; }
  }
  function getDb() {
    if (!dbPromise) dbPromise = Promise.all([capability('db'), capability('user')]).then(([db, user]) => ({ db, user }));
    return dbPromise;
  }

  function whatsappUrl(text) {
    const n = onlyDigits(cfg().whatsapp);
    if (!n) return null;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }

  function summary(lead) {
    return [
      'Olá! Tenho interesse no Lumoa Dunes.',
      `Nome: ${lead.nome}`,
      `Telefone: ${lead.telefone}`,
      lead.email ? `E-mail: ${lead.email}` : null,
      lead.interesse ? `Interesse: ${lead.interesse}` : null,
      lead.mensagem ? `Mensagem: ${lead.mensagem}` : null,
    ].filter(Boolean).join('\n');
  }

  async function viaEndpoint(lead) {
    const url = cfg().leadEndpoint;
    if (!url) return null;
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
    if (!r.ok) throw new Error('endpoint ' + r.status);
    return { ok: true, channel: 'endpoint' };
  }

  async function viaArtifactDb(lead) {
    const { db, user } = await getDb();
    if (!db || !user) return null;
    const uid = await user.id();
    if (!uid) return null;
    const ref = db.collection('leads').doc(uid);
    let envios = [];
    try { const snap = await ref.get(); if (snap.exists) envios = (snap.data().envios || []).slice(-19); } catch (e) { /* primeira vez */ }
    envios.push(lead);
    await ref.set({ ...lead, envios, atualizadoEm: lead.criadoEm });
    return { ok: true, channel: 'db' };
  }

  L.leads = {
    whatsappUrl,
    summary,
    hasWhatsapp: () => !!onlyDigits(cfg().whatsapp),

    validate(lead, { requireEmail = true } = {}) {
      const errors = {};
      if (!lead.nome || lead.nome.trim().length < 3) errors.nome = 'Informe seu nome completo.';
      const tel = onlyDigits(lead.telefone);
      if (tel.length < 10 || tel.length > 13) errors.telefone = 'Informe um telefone com DDD, por exemplo (98) 90000-0000.';
      if (requireEmail || lead.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(lead.email || '').trim())) errors.email = 'Informe um e-mail válido, por exemplo voce@email.com.';
      }
      if (!lead.consentimento) errors.consentimento = 'Para enviar, autorize o uso dos seus dados para o contato.';
      return errors;
    },

    formatPhone(v) {
      const d = onlyDigits(v).slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    },

    async submit(raw) {
      const lead = {
        nome: String(raw.nome || '').trim(),
        telefone: String(raw.telefone || '').trim(),
        email: String(raw.email || '').trim(),
        interesse: raw.interesse || '',
        mensagem: String(raw.mensagem || '').trim().slice(0, 1200),
        origem: raw.origem || 'formulario',
        consentimento: !!raw.consentimento,
        criadoEm: new Date().toISOString(),
      };
      for (const fn of [viaEndpoint, viaArtifactDb]) {
        try { const r = await fn(lead); if (r) return r; } catch (e) { console.warn('[Lumoa] canal de envio falhou:', e && e.message); }
      }
      const wa = whatsappUrl(summary(lead));
      if (wa) return { ok: true, channel: 'whatsapp', url: wa };
      const pend = L.ui.store.get('leads-pendentes', []);
      pend.push(lead); L.ui.store.set('leads-pendentes', pend.slice(-5));
      return { ok: false, channel: 'none', text: summary(lead) };
    },

    // Painel da equipe (somente editores do artefato)
    async canSeePanel() {
      const { db, user } = await getDb();
      if (!db || !user) return false;
      try { return !!((await user.isOwner()) || (await user.canEdit())); } catch (e) { return false; }
    },
    async listAll() {
      const { db } = await getDb();
      if (!db) return [];
      const snap = await db.collection('leads').orderBy('atualizadoEm', 'desc').limit(200).get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  };
})(window.Lumoa);
