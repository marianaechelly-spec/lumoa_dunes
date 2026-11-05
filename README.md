# Lumoa Dunes — site oficial

Site institucional do Lumoa Dunes (Santo Amaro – MA, Lençóis Maranhenses) com a anfitriã virtual **Luna**.
Todas as informações vêm do catálogo oficial *BOOK LUMOA CASAS.pdf*. Nada de preço, condição comercial ou
disponibilidade de lotes é exibido ou respondido pela Luna.

## Estrutura

```
src/
  index.html              marcação das seções (Início, Empreendimento, Maquete 3D, Lazer, Mirante, Casas, Localização, Galeria, Contato)
  config.js               WhatsApp oficial, endpoints e coordenadas (preencher antes de publicar)
  data/empreendimento.js  ÚNICA fonte de dados do empreendimento (textos, números, lazer, casas, plantas, galeria)
  styles/                 tokens.css · base.css · sections.css · luna.css · responsive.css
  components/             ui, layout (menu, revelação, parallax), hero (fotos em sequência), maquete-gl (3D WebGL),
                          maquete (controles + versão CSS 3D de reserva), lazer, casas, galeria/lightbox, contato
  services/               leads.js (envio de interessados) · luna-ai.js (IA sem chave no frontend)
  luna/                   knowledge.js (respostas do catálogo) · engine.js (intenções, contexto, cadastro LGPD)
                          widget.js (Luna apresentadora em cena, palco de conversa e voz pt-BR)
  main.js                 inicialização
server/                   exemplos de backend: luna-proxy.js (IA) e leads-endpoint.js (interessados)
assets/img/               imagens extraídas do catálogo, otimizadas em WebP
build.mjs                 junta tudo em dist/site/index.html (sem dependências)
```

## Build

```
node build.mjs
```
Publique a pasta `dist/site/` em qualquer hospedagem estática (Vercel, Netlify, Hostinger etc.).
Nenhuma dependência nova foi adicionada; as fontes vêm do Google Fonts (Marcellus, Jost e Allura).

## Antes de publicar no domínio oficial (`src/config.js`)

| Campo | Para quê |
|---|---|
| `whatsapp` | Número oficial (ex.: `5598999999999`). Ativa os botões de WhatsApp no site e na Luna. |
| `leadEndpoint` | URL que recebe os interessados (ex.: `/api/leads` com `server/leads-endpoint.js`). |
| `lunaAiEndpoint` | URL do proxy de IA (ex.: `/api/luna` com `server/luna-proxy.js` e `ANTHROPIC_API_KEY` no servidor). |
| `coordenadas` | Latitude/longitude confirmadas: o botão do mapa passa a abrir o ponto exato. |
| `email` | E-mail comercial exibido na seção de contato. |

## Como a Luna funciona

1. **Atendimento guiado** (sempre ativo): reconhece a intenção da mensagem, considera o contexto (ex.: "e a planta?" depois de falar da Casa Estrela), responde com textos do catálogo, mostra imagens, leva o visitante à seção certa do site e conduz o cadastro de interesse com consentimento.
2. **IA** (opcional): só é usada para perguntas fora do roteiro. As instruções obrigam a responder apenas com os dados oficiais, e um filtro no frontend bloqueia qualquer resposta com valores ou condições comerciais.
3. **Regras fixas**: nunca informa preços, pagamento, disponibilidade, prazos ou retorno de investimento; sempre encaminha à equipe comercial.

Para incluir novas perguntas frequentes, adicione uma entrada em `src/luna/knowledge.js` (palavras-chave + resposta).
