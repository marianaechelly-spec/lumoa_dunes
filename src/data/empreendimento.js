/* =========================================================================
   LUMOA DUNES — Dados oficiais do empreendimento
   Fonte: BOOK LUMOA CASAS.pdf (catálogo oficial) e peça de divulgação da Luma.
   Este arquivo é a ÚNICA fonte de verdade do site e da Luma.
   Não adicione preços, condições comerciais ou disponibilidade de lotes aqui
   sem que a equipe comercial tenha confirmado oficialmente.
   ========================================================================= */
window.Lumoa = window.Lumoa || {};

(function (L) {
  const IMG = 'assets/img/';

  L.data = {
    nome: 'Lumoa Dunes',
    slogan: 'Onde a exclusividade encontra a natureza',
    assinatura: 'Seu lugar nos Lençóis',
    fechamento: 'Exclusividade, Natureza e Valorização em um só destino',
    legado: 'Muito mais que um lote, um legado.',
    realizacao: 'Fogaça Empreendimentos',

    local: {
      cidade: 'Santo Amaro',
      uf: 'MA',
      cidadeCompleta: 'Santo Amaro do Maranhão',
      bairro: 'Olho D’Água',
      regiao: 'Lençóis Maranhenses',
      parque: 'Parque Nacional dos Lençóis Maranhenses',
      // Distâncias e tempos VERIFICADOS a partir da entrada do condomínio.
      // Preencher só depois de conferir. Ex.: { destino: 'Centro de Santo Amaro', distancia: '2 km', tempo: '5 min de carro' }
      // Vazio = a seção mostra apenas o texto geral de acesso.
      acesso: [],
    },

    // Textos reproduzidos do catálogo oficial
    textos: {
      santoAmaro:
        'A cidade de Santo Amaro é o portal mais autêntico dos Lençóis Maranhenses — dunas imponentes, lagoas cristalinas e um ambiente de rara tranquilidade.',
      localizacao:
        'Localizado no bairro Olho D’Água, o Lumoa Dunes oferece o privilégio de viver a poucos minutos das principais rotas turísticas, sem abrir mão do conforto.',
      localizacaoUnica:
        'Uma localização que une a tranquilidade de Santo Amaro ao acesso às rotas turísticas dos Lençóis Maranhenses.',
      conceito:
        'O Lumoa Dunes nasce projetado para unir sofisticação, natureza e privacidade.',
      // Revisado (melhorias de 16/11/2026): sem alegações que dependam de comprovação
      // ("primeiro da região") nem valorização futura apresentada como certeza.
      primeiro: 'Condomínio fechado com apenas 32 lotes de 200 m², em 10.840 m² de área total.',
      produto:
        'O Lumoa Dunes comercializa lotes de 200 m². Os projetos de casa Dunas e Estrela são opcionais: a forma de contratação e o que está incluído no custo são apresentados pela equipe comercial.',
      mirante:
        'O Mirante Panorâmico, no núcleo de lazer do condomínio, oferece vista elevada para as dunas dos Lençóis Maranhenses.',
      lazer:
        'Cada detalhe da área de lazer foi pensado para transformar momentos em experiências inesquecíveis, com exclusividade e conforto à altura do cenário dos Lençóis Maranhenses.',
      areasComuns:
        'As áreas comuns são um convite para celebrar momentos únicos em família e entre amigos. Um refúgio de exclusividade e conforto, fortalecendo laços e celebrando a arte de viver bem.',
      rooftop:
        'Rooftop, Sala de Contemplação e Mirante Panorâmico — ambientes pensados para elevar seus momentos de lazer e oferecer vistas privilegiadas dos Lençóis Maranhenses.',
      arquitetura:
        'Arquitetura com linhas modernas e integração inteligente aos espaços, em um design contemporâneo que dialoga com a natureza.',
      materiais:
        'Linhas modernas, integração com áreas verdes e materiais que traduzem sofisticação e autenticidade resultam em um ambiente exclusivo, elegante e atemporal.',
    },

    pilares: ['Viver', 'Investir', 'Descansar', 'Conectar', 'Pertencer'],

    // Destaques da peça de divulgação oficial
    destaques: [
      { icone: 'pin', texto: 'Localização privilegiada' },
      { icone: 'leaf', texto: 'Infraestrutura sustentável' },
      { icone: 'umbrella', texto: 'Lazer completo' },
      { icone: 'chart', texto: 'Apenas 32 lotes' },
      { icone: 'heart', texto: 'Qualidade de vida o ano todo' },
    ],

    numeros: [
      { valor: '10.840', unidade: 'm²', rotulo: 'Área total' },
      { valor: '6.400', unidade: 'm²', rotulo: 'Área loteada' },
      { valor: '32', unidade: 'lotes', rotulo: 'Unidades exclusivas' },
      { valor: '200', unidade: 'm²', rotulo: 'Cada lote' },
    ],

    // ---------------------------------------------------------------------
    // LOTES — estoque exibido na maquete.
    // Responsável pela atualização: equipe comercial (definir o nome antes de publicar).
    // Chave = posição do lote na maquete: quadra A, B, C ou D (da esquerda para a
    // direita na planta de implantação) + fileira 1 a 8 (de cima para baixo).
    // Preencha cada lote SOMENTE com dados confirmados:
    //   numero:   número oficial do lote na planta aprovada (ex.: '17')
    //   area:     área confirmada em m² (ex.: '200')
    //   situacao: 'disponivel' | 'reservado' | 'vendido'
    // Exemplo:  A1: { numero: '01', area: '200', situacao: 'disponivel' },
    // Lote ausente daqui = o site mostra a posição na maquete, a área de
    // referência do catálogo (200 m²) e "situação sob consulta".
    // ---------------------------------------------------------------------
    lotes: {},
    situacoesLote: { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido' },

    // Itens numerados exatamente como na planta de implantação do catálogo.
    // pos = posição do marcador na implantação humanizada (implantacao-humanizada.webp), em % x, % y.
    lazer: [
      { n: 1, id: 'portaria', nome: 'Portaria', grupo: 'infra', pos: [74.2, 83.0], img: 'portaria-fachada',
        desc: 'Portaria na entrada do condomínio, com arquitetura em madeira, cobogós e a identidade visual do Lumoa Dunes.' },
      { n: 2, id: 'guarderia', nome: 'Guarderia', grupo: 'infra', pos: [79.5, 74.8], img: 'guarderia',
        desc: 'Área coberta por pergolados para a guarda de veículos, logo após a portaria.' },
      { n: 3, id: 'beach-tennis', nome: 'Quadra de Beach Tennis', grupo: 'lazer', pos: [87.5, 81.5], img: 'beach-tennis-quadra',
        desc: 'Quadra de areia para beach tennis, cercada por palmeiras, dentro do condomínio.' },
      { n: 4, id: 'recarga', nome: 'Estação de recarga', grupo: 'infra', pos: [56.6, 81.0], img: 'rua-recarga',
        desc: 'Estação de recarga prevista na implantação, junto à via de acesso do condomínio.' },
      { n: 5, id: 'petplay', nome: 'Espaço Pet — Petplay', grupo: 'lazer', pos: [47.0, 81.5], img: 'espaco-pet',
        desc: 'Espaço gramado com brinquedos e circuito para os pets se divertirem com segurança.' },
      { n: 6, id: 'area-tecnica', nome: 'Área técnica', grupo: 'infra', pos: [10.5, 75.5], img: null,
        desc: 'Área destinada aos equipamentos técnicos do condomínio.' },
      { n: 7, id: 'playground', nome: 'Playground infantil', grupo: 'lazer', pos: [80.0, 19.5], img: 'playground-kids',
        desc: 'Espaço Kids com brinquedos de madeira sobre piso de areia, cercado de verde.' },
      { n: 8, id: 'redario', nome: 'Redário', grupo: 'lazer', pos: [47.0, 17.5], img: 'redario-redes',
        desc: 'Área de redes à sombra das árvores, para descansar em meio à natureza.' },
      { n: 9, id: 'piscina', nome: 'Piscina com bar molhado', grupo: 'lazer', pos: [24.0, 8.2], img: 'piscina-cascata',
        desc: 'Piscina com bar molhado, prainha e hidromassagem.' },
      { n: 10, id: 'gazebo', nome: 'Gazebo', grupo: 'lazer', pos: [10.2, 4.8], img: 'piscina-gazebo', foco: '30% 50%',
        desc: 'Gazebo integrado ao núcleo de lazer, ao lado da piscina.' },
      { n: 11, id: 'rooftop', nome: 'Rooftop com mirante', grupo: 'lazer', pos: [14.5, 15.0], img: 'rooftop-musica',
        desc: 'Rooftop, Sala de Contemplação e Mirante Panorâmico, com vista privilegiada das dunas.' },
      { n: 12, id: 'churrasqueira', nome: 'Churrasqueira', grupo: 'lazer', pos: [9.2, 12.0], img: 'churrasqueira', foco: '20% 50%',
        desc: 'Churrasqueira no núcleo de lazer, para celebrar em família e entre amigos.' },
      { n: 13, id: 'estacionamento', nome: 'Estacionamento externo privativo', grupo: 'infra', pos: [85.0, 89.0], img: null,
        desc: 'Estacionamento externo e privativo, junto à portaria.' },
    ],

    casas: [
      {
        id: 'dunas',
        nome: 'Casa Dunas',
        tipo: 'Térrea com rooftop',
        pavimentos: 'Térrea + rooftop',
        suites: 2,
        area: '104,94',
        resumo: 'Tudo em um só nível, com rooftop, piscina privativa, deck e duas áreas livres com pergolado junto às suítes.',
        imagens: [
          { src: 'dunas-1', legenda: 'Casa Dunas — fachada' },
          { src: 'dunas-4', legenda: 'Casa Dunas — fachada frontal' },
          { src: 'dunas-2', legenda: 'Casa Dunas — perspectiva lateral' },
          { src: 'dunas-3', legenda: 'Casa Dunas — perspectiva com acesso de veículos' },
        ],
        plantas: [
          {
            titulo: 'Pavimento térreo',
            src: 'planta-terreo',
            ambientes: [
              ['Suíte 01', '10,40 m²'], ['Suíte 02', '10,40 m²'], ['Banho (suíte 01)', '2,94 m²'], ['Banho (suíte 02)', '2,94 m²'],
              ['Jantar', '10 m²'], ['Cozinha', '15 m²'], ['Hall', '6,5 m²'], ['Lavabo', '1,5 m²'],
              ['Lavanderia', '8,80 m²'], ['Piscina', '8,2 m²'], ['Deck', '7,6 m²'], ['Área livre', '10,62 m²'],
              ['Área livre', '10,62 m²'], ['Estacionamento', '30 m²'],
            ],
          },
        ],
      },
      {
        id: 'estrela',
        nome: 'Casa Estrela',
        tipo: 'Dois pavimentos',
        pavimentos: '2 pavimentos',
        suites: 4,
        area: '116,55',
        resumo: 'No térreo, duas suítes, cozinha, jantar, piscina e deck; no pavimento superior, mais duas suítes, sala TV/hall e varanda.',
        imagens: [
          { src: 'estrela-1', legenda: 'Casa Estrela — fachada' },
          { src: 'estrela-4', legenda: 'Casa Estrela — fachada frontal' },
          { src: 'estrela-2', legenda: 'Casa Estrela — perspectiva lateral' },
          { src: 'estrela-3', legenda: 'Casa Estrela — perspectiva com acesso de veículos' },
        ],
        plantas: [
          {
            titulo: 'Pavimento térreo',
            src: 'planta-terreo',
            ambientes: [
              ['Suíte 01', '10,40 m²'], ['Suíte 02', '10,40 m²'], ['Banho (suíte 01)', '2,94 m²'], ['Banho (suíte 02)', '2,94 m²'],
              ['Jantar', '10 m²'], ['Cozinha', '15 m²'], ['Hall', '6,5 m²'], ['Lavabo', '1,5 m²'],
              ['Lavanderia', '8,80 m²'], ['Piscina', '8,2 m²'], ['Deck', '7,6 m²'], ['Área livre', '10,62 m²'],
              ['Área livre', '10,62 m²'], ['Estacionamento', '30 m²'],
            ],
          },
          {
            titulo: 'Pavimento superior',
            src: 'planta-estrela-superior',
            ambientes: [
              ['Suíte 03', '10,40 m²'], ['Suíte 04', '10,40 m²'], ['Banho (suíte 03)', '2,94 m²'], ['Banho (suíte 04)', '2,94 m²'],
              ['Sala TV / Hall', '15,10 m²'], ['Varanda', '9 m²'],
            ],
          },
        ],
      },
    ],

    // Ambientes internos apresentados no catálogo (sem modelo especificado)
    interiores: [
      { src: 'int-estar', legenda: 'Estar e jantar integrados' },
      { src: 'int-cozinha', legenda: 'Cozinha' },
      { src: 'int-jardim', legenda: 'Jardim interno' },
      { src: 'int-sala', legenda: 'Sala' },
      { src: 'int-suite', legenda: 'Suíte' },
    ],

    // Identificação das imagens: a categoria 'dunas' traz imagens da região; as demais
    // são perspectivas ilustrativas. Para foto real do terreno ou da obra, informe
    // tipo: 'foto' e data: 'mm/aaaa' (ex.: { src: 'obra-2026-11', cat: 'aereas', tipo: 'foto', data: '11/2026', legenda: '...' }).
    // Galeria organizada por categoria. forma: 'v' = vertical (ocupa 2 linhas), 'w' = panorâmica (ocupa 2 colunas)
    galeria: [
      // Lençóis Maranhenses
      { src: 'por-do-sol-lencois', cat: 'dunas', forma: 'v', legenda: 'Pôr do sol sobre as dunas e lagoas dos Lençóis' },
      { src: 'dunas-aereo', cat: 'dunas', forma: 'w', legenda: 'Dunas e lagoas dos Lençóis Maranhenses' },
      { src: 'hero-lagoa', cat: 'dunas', forma: 'v', legenda: 'Lagoa e dunas dos Lençóis Maranhenses' },
      { src: 'dunas-lagoas', cat: 'dunas', legenda: 'Lagoas entre as dunas' },
      // Vistas aéreas
      { src: 'aereo-condominio', cat: 'aereas', forma: 'v', legenda: 'Vista aérea do condomínio com as casas e os Lençóis ao fundo' },
      { src: 'aereo-lotes', cat: 'aereas', forma: 'w', legenda: 'Vista aérea dos lotes, vias internas e portaria' },
      { src: 'implantacao-humanizada', cat: 'aereas', forma: 'v', legenda: 'Implantação humanizada — estudo conceitual' },
      { src: 'nucleo-lazer-aereo', cat: 'aereas', forma: 'w', legenda: 'Núcleo de lazer visto do alto: piscinas, deck, gazebo e mirante' },
      // Portaria e vias
      { src: 'portaria-fachada', cat: 'acessos', forma: 'v', legenda: 'Portaria do Lumoa Dunes' },
      { src: 'portaria-entrada', cat: 'acessos', forma: 'v', legenda: 'Chegada pela portaria' },
      { src: 'rua-recarga', cat: 'acessos', forma: 'v', legenda: 'Via interna com estação de recarga' },
      { src: 'casas-via-interna', cat: 'acessos', forma: 'w', legenda: 'Casas ao longo da via interna' },
      // Casas
      { src: 'casa-fachada-01', cat: 'casas', forma: 'w', legenda: 'Fachada das casas' },
      { src: 'casa-aerea-piscina', cat: 'casas', forma: 'w', legenda: 'Casa com varanda, rooftop e piscina privativa' },
      // Fachadas e interiores de cada modelo ficam só na seção Casas (evita repetição).
      // Piscina
      { src: 'piscina-cascata', cat: 'piscina', legenda: 'Piscina com cascata junto ao mirante' },
      { src: 'piscina-gazebo', cat: 'piscina', forma: 'w', legenda: 'Piscina, gazebo e bar molhado' },
      // Rooftop e mirante
      { src: 'nucleo-lazer-panorama', cat: 'rooftop', forma: 'w', legenda: 'Núcleo de lazer com o Mirante Panorâmico' },
      { src: 'nucleo-lazer-torre', cat: 'rooftop', legenda: 'Torre do mirante e área de convivência' },
      { src: 'rooftop-musica', cat: 'rooftop', forma: 'w', legenda: 'Rooftop e sala de contemplação ao entardecer' },
      // Áreas de lazer
      { src: 'churrasqueira', cat: 'lazer', forma: 'w', legenda: 'Churrasqueira do núcleo de lazer' },
      { src: 'area-gourmet', cat: 'lazer', legenda: 'Encontros com amigos sob o pergolado' },
      { src: 'beach-tennis-quadra', cat: 'lazer', forma: 'v', legenda: 'Quadra de Beach Tennis' },
      { src: 'beach-tennis-lounge', cat: 'lazer', legenda: 'Beach Tennis com lounge sob pergolado' },
      { src: 'playground-kids', cat: 'lazer', legenda: 'Espaço Kids — Playground' },
      { src: 'espaco-pet', cat: 'lazer', legenda: 'Espaço Pet — Petplay' },
      { src: 'redario-redes', cat: 'lazer', legenda: 'Redário entre as árvores' },
      { src: 'redario-alameda', cat: 'lazer', forma: 'w', legenda: 'Redário junto à alameda arborizada' },
      { src: 'guarderia', cat: 'lazer', legenda: 'Guarderia' },
    ],

    categoriasGaleria: [
      ['todas', 'Todas'], ['dunas', 'Lençóis Maranhenses'], ['aereas', 'Vistas aéreas'], ['acessos', 'Portaria e vias'],
      ['casas', 'Casas'], ['piscina', 'Piscina'], ['rooftop', 'Rooftop e mirante'], ['lazer', 'Áreas de lazer'],
    ],
  };

  L.img = (name, small) => IMG + name + (small ? '-sm' : '') + '.webp';
  L.findLazer = (id) => L.data.lazer.find((x) => x.id === id || String(x.n) === String(id));
  L.findCasa = (id) => L.data.casas.find((c) => c.id === id);

  // Lote pela posição na maquete (q = 0..3 → A..D, r = 0..7 → 1..8).
  // Junta os dados confirmados de L.data.lotes com a referência do catálogo.
  L.lote = (q, r) => {
    const pos = 'ABCD'[q] + (r + 1);
    const conf = L.data.lotes[pos] || {};
    const situacao = L.data.situacoesLote[conf.situacao] ? conf.situacao : null;
    return {
      pos, q, r,
      numero: conf.numero || null,
      area: conf.area || '200',
      areaConfirmada: !!conf.area,
      situacao,
      situacaoTexto: situacao ? L.data.situacoesLote[situacao] : 'Situação sob consulta',
      // Texto que identifica o lote no atendimento (formulário, WhatsApp e Luma)
      ref: conf.numero ? `Lote ${conf.numero} (posição ${pos} da maquete)` : `Lote na posição ${pos} da maquete`,
      titulo: conf.numero ? `Lote ${conf.numero}` : `Lote ${pos}`,
      posicao: `Quadra ${'ABCD'[q]} · fileira ${r + 1} de 8, contada do fundo do condomínio para a portaria`,
    };
  };

  // Rótulo de identificação de cada imagem (perspectiva, região ou foto datada)
  L.imgTipo = (g) => {
    if (g.tipo === 'foto') return g.data ? `Foto real · ${g.data}` : 'Foto real';
    if (g.cat === 'dunas') return 'Imagem da região';
    return 'Perspectiva ilustrativa';
  };
})(window.Lumoa);
