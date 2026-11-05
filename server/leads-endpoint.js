/* =========================================================================
   Endpoint de interessados (exemplo para Vercel / Node 18+)
   Recebe o POST do formulário e da Luna e encaminha para onde a equipe
   trabalha. Aqui: um webhook configurável (CRM, planilha, e-mail via Zapier/Make).
   Defina LEADS_WEBHOOK_URL nas variáveis de ambiente.
   No site: config.leadEndpoint = '/api/leads'.
   ========================================================================= */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const b = req.body || {};
  const lead = {
    nome: String(b.nome || '').slice(0, 120).trim(),
    telefone: String(b.telefone || '').replace(/[^\d()+\s-]/g, '').slice(0, 30),
    email: String(b.email || '').slice(0, 160).trim(),
    interesse: String(b.interesse || '').slice(0, 80),
    mensagem: String(b.mensagem || '').slice(0, 1200),
    origem: b.origem === 'luna' ? 'luna' : 'formulario',
    consentimento: b.consentimento === true,
    recebidoEm: new Date().toISOString(),
  };
  if (!lead.nome || lead.telefone.replace(/\D/g, '').length < 10 || !lead.consentimento) {
    return res.status(400).json({ error: 'dados_invalidos' });
  }
  const hook = process.env.LEADS_WEBHOOK_URL;
  if (!hook) return res.status(503).json({ error: 'destino_nao_configurado' });
  const r = await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(lead) });
  if (!r.ok) return res.status(502).json({ error: 'falha_no_destino' });
  return res.status(200).json({ ok: true });
};
