/* =========================================================================
   CONFIGURAÇÃO DO SITE — preencha antes de publicar no domínio oficial.
   Nada aqui é secreto: NUNCA coloque chaves de API neste arquivo.
   ========================================================================= */
window.Lumoa = window.Lumoa || {};

window.Lumoa.config = {
  // Número oficial do WhatsApp comercial, só dígitos com DDI e DDD.
  // Ex.: '5598999999999'. Vazio = botões de WhatsApp ficam ocultos e o
  // atendimento segue pelo formulário e pela Luma.
  whatsapp: '',

  // Endpoint que recebe os interessados (POST JSON). Ex.: '/api/leads'
  // (ver server/leads-endpoint.js) ou um serviço de formulários.
  leadEndpoint: '',

  // Endpoint seguro da IA da Luma (ver server/luna-proxy.js).
  // A chave da API fica SOMENTE no servidor, em variável de ambiente.
  lunaAiEndpoint: '',

  // Centro do condomínio: centroide do perímetro (camada LIMITE_LOTEAMENTO) dos
  // KML georreferenciados da pasta kml/ — o mesmo valor que
  // tools/kml-para-geojson.mjs imprime e grava em src/data/lotes.js.
  // O botão "Abrir no Google Maps" da seção Localização usa este ponto.
  // null = o botão pede a localização à equipe.
  coordenadas: { lat: -2.51797678, lng: -43.25319801 },

  // E-mail comercial oficial (opcional). Exibido como texto selecionável.
  email: '',

  // Página oficial da política de privacidade (opcional). Vazio = o link
  // "Política de privacidade" abre o resumo embutido no site (revisar com o jurídico).
  politicaPrivacidadeUrl: '',
};
