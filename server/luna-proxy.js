/* =========================================================================
   Proxy seguro da IA da Luma (exemplo para Vercel / Netlify / Node 18+)
   A chave fica SOMENTE aqui, na variável de ambiente ANTHROPIC_API_KEY.
   O site chama este endpoint definindo config.lunaAiEndpoint = '/api/luna'.

   Vercel: salve como api/luna.js. Netlify: adapte a assinatura para functions.
   ========================================================================= */
const MODEL = process.env.LUNA_MODEL || 'claude-haiku-4-5';
const MAX_Q = 600;

// Copie aqui o mesmo texto de instruções do frontend (Lumoa.lunaAI._instructions()),
// ou gere-o no build. Mantê-lo no servidor impede que o visitante altere as regras.
const INSTRUCTIONS = process.env.LUNA_INSTRUCTIONS || `Você é a Luma, assistente virtual do Lumoa Dunes (Santo Amaro - MA).
Use somente as informações oficiais do catálogo. Nunca informe preços, condições de pagamento,
disponibilidade de lotes ou prazos: encaminhe à equipe comercial. Responda em até 90 palavras.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'ia_nao_configurada' });

  const { history = [], question = '' } = req.body || {};
  const q = String(question).slice(0, MAX_Q).trim();
  if (!q) return res.status(400).json({ error: 'pergunta_vazia' });

  // Histórico curto, só papéis válidos, alternando usuário/assistente
  const messages = [];
  for (const m of history.slice(-10)) {
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const content = String(m.text || '').slice(0, 1200);
    if (!content) continue;
    if (messages.length && messages[messages.length - 1].role === role) messages[messages.length - 1].content += '\n' + content;
    else messages.push({ role, content });
  }
  if (messages.length && messages[0].role === 'assistant') messages.shift();
  if (messages.length && messages[messages.length - 1].role === 'user') messages[messages.length - 1].content += '\n' + q;
  else messages.push({ role: 'user', content: q });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: INSTRUCTIONS, messages }),
    });
    if (!r.ok) return res.status(502).json({ error: 'ia_falhou' });
    const data = await r.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: 'ia_falhou' });
  }
};
