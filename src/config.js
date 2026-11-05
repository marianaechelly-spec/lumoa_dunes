/* =========================================================================
   CONFIGURAÇÃO DO SITE — preencha antes de publicar no domínio oficial.
   Nada aqui é secreto: NUNCA coloque chaves de API neste arquivo.
   ========================================================================= */
window.Lumoa = window.Lumoa || {};

window.Lumoa.config = {
  // Número oficial do WhatsApp comercial, só dígitos com DDI e DDD.
  // Ex.: '5598999999999'. Vazio = botões de WhatsApp ficam ocultos e o
  // atendimento segue pelo formulário e pela Luna.
  whatsapp: '',

  // Endpoint que recebe os interessados (POST JSON). Ex.: '/api/leads'
  // (ver server/leads-endpoint.js) ou um serviço de formulários.
  leadEndpoint: '',

  // Endpoint seguro da IA da Luna (ver server/luna-proxy.js).
  // A chave da API fica SOMENTE no servidor, em variável de ambiente.
  lunaAiEndpoint: '',

  // Coordenadas confirmadas do empreendimento. Enquanto estiver null,
  // o mapa mostra a região do catálogo e o link abre a cidade.
  coordenadas: null, // ex.: { lat: -2.5, lng: -43.2 }

  // E-mail comercial oficial (opcional). Exibido como texto selecionável.
  email: '',
};
