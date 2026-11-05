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
    },

    // Textos reproduzidos do catálogo oficial
    textos: {
      santoAmaro:
        'A cidade de Santo Amaro é o portal mais autêntico dos Lençóis Maranhenses — dunas imponentes, lagoas cristalinas e um ambiente de rara tranquilidade.',
      localizacao:
        'Localizado no bairro Olho D’Água, o Lumoa Dunes oferece o privilégio de viver a poucos minutos das principais rotas turísticas, sem abrir mão do conforto.',
      localizacaoUnica:
        'Uma localização única, que une tranquilidade, exclusividade e alto potencial de valorização do investimento.',
      conceito:
        'O Lumoa Dunes nasce projetado para unir sofisticação, natureza e privacidade.',
      primeiro: 'O primeiro condomínio de alto padrão da região, com apenas 32 lotes.',
      mirante:
        'O Mirante Panorâmico é uma exclusividade que oferece uma vista privilegiada das dunas. Um espaço que valoriza o seu investimento, diferencia o empreendimento na região e garante um estilo de vida incomparável.',
      lazer:
        'Cada detalhe da área de lazer foi pensado para transformar momentos em experiências inesquecíveis, com exclusividade e conforto à altura do cenário dos Lençóis Maranhenses.',
      areasComuns:
        'As áreas comuns são um convite para celebrar momentos únicos em família e entre amigos. Um refúgio de exclusividade e conforto, fortalecendo laços e celebrando a arte de viver bem.',
      rooftop:
        'Rooftop, Sala de Contemplação e Mirante Panorâmico — ambientes pensados para elevar seus momentos de lazer e oferecer vistas privilegiadas dos Lençóis Maranhenses.',
      arquitetura:
        'Arquitetura pensada para valorizar seu investimento, com linhas modernas e integração inteligente aos espaços. O Lumoa Dunes se diferencia pelo design contemporâneo que dialoga com a natureza.',
      materiais:
        'Linhas modernas, integração com áreas verdes e materiais que traduzem sofisticação e autenticidade resultam em um ambiente exclusivo, elegante e atemporal.',
    },

    pilares: ['Viver', 'Investir', 'Descansar', 'Conectar', 'Pertencer'],

    // Destaques da peça de divulgação oficial
    destaques: [
      { icone: 'pin', texto: 'Localização privilegiada' },
      { icone: 'leaf', texto: 'Infraestrutura sustentável' },
      { icone: 'umbrella', texto: 'Lazer completo' },
      { icone: 'chart', texto: 'Alto potencial de valorização' },
      { icone: 'heart', texto: 'Qualidade de vida o ano todo' },
    ],

    numeros: [
      { valor: '10.840', unidade: 'm²', rotulo: 'Área total' },
      { valor: '6.400', unidade: 'm²', rotulo: 'Área loteada' },
      { valor: '32', unidade: 'lotes', rotulo: 'Unidades exclusivas' },
      { valor: '200', unidade: 'm²', rotulo: 'Cada lote' },
    ],

    // Itens numerados exatamente como na planta de implantação do catálogo.
    // pos = posição do marcador na imagem da implantação (% x, % y).
    lazer: [
      { n: 1, id: 'portaria', nome: 'Portaria', grupo: 'infra', pos: [73.8, 88.1], img: 'portaria',
        desc: 'Portaria na entrada do condomínio, com arquitetura em madeira, cobogós e a identidade visual do Lumoa Dunes.' },
      { n: 2, id: 'guarderia', nome: 'Guarderia', grupo: 'infra', pos: [80.3, 80.6], img: 'guarderia',
        desc: 'Área coberta por pergolados para a guarda de veículos, logo após a portaria.' },
      { n: 3, id: 'beach-tennis', nome: 'Quadra de Beach Tennis', grupo: 'lazer', pos: [89.5, 80.6], img: 'beach-tennis',
        desc: 'Quadra de areia para beach tennis, cercada por palmeiras, dentro do condomínio.' },
      { n: 4, id: 'recarga', nome: 'Estação de recarga', grupo: 'infra', pos: [56.6, 84.2], img: null,
        desc: 'Estação de recarga prevista na implantação, junto à via de acesso do condomínio.' },
      { n: 5, id: 'petplay', nome: 'Espaço Pet — Petplay', grupo: 'lazer', pos: [17.6, 79.2], img: 'petplay',
        desc: 'Espaço gramado com brinquedos e circuito para os pets se divertirem com segurança.' },
      { n: 6, id: 'area-tecnica', nome: 'Área técnica', grupo: 'infra', pos: [7.1, 77.9], img: null,
        desc: 'Área destinada aos equipamentos técnicos do condomínio.' },
      { n: 7, id: 'playground', nome: 'Playground infantil', grupo: 'lazer', pos: [81.1, 14.0], img: 'playground',
        desc: 'Espaço Kids com brinquedos de madeira sobre piso de areia, cercado de verde.' },
      { n: 8, id: 'redario', nome: 'Redário', grupo: 'lazer', pos: [40.9, 13.9], img: 'redario',
        desc: 'Área de redes à sombra das árvores, para descansar em meio à natureza.' },
      { n: 9, id: 'piscina', nome: 'Piscina com bar molhado', grupo: 'lazer', pos: [19.2, 5.2], img: 'piscina-bar',
        desc: 'Piscina com bar molhado, prainha e hidromassagem.' },
      { n: 10, id: 'gazebo', nome: 'Gazebo', grupo: 'lazer', pos: [7.8, 2.6], img: null,
        desc: 'Gazebo integrado ao núcleo de lazer, ao lado da piscina.' },
      { n: 11, id: 'rooftop', nome: 'Rooftop com mirante', grupo: 'lazer', pos: [7.8, 9.2], img: 'rooftop-mirante',
        desc: 'Rooftop, Sala de Contemplação e Mirante Panorâmico, com vista privilegiada das dunas.' },
      { n: 12, id: 'churrasqueira', nome: 'Churrasqueira', grupo: 'lazer', pos: [12.1, 14.5], img: null,
        desc: 'Churrasqueira no núcleo de lazer, para celebrar em família e entre amigos.' },
      { n: 13, id: 'estacionamento', nome: 'Estacionamento externo privativo', grupo: 'infra', pos: [88.1, 90.0], img: null,
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

    galeria: [
      { src: 'dunas-aereo', cat: 'dunas', legenda: 'Dunas e lagoas dos Lençóis Maranhenses' },
      { src: 'condominio-aereo', cat: 'aereas', legenda: 'Vista aérea do condomínio' },
      { src: 'hero-lagoa', cat: 'dunas', legenda: 'Lagoa e dunas dos Lençóis Maranhenses' },
      { src: 'mirante', cat: 'aereas', legenda: 'Vista aérea com o mirante panorâmico' },
      { src: 'portaria', cat: 'fachadas', legenda: 'Portaria do Lumoa Dunes' },
      { src: 'dunas-lagoas', cat: 'dunas', legenda: 'Lagoas entre as dunas' },
      { src: 'piscina-bar', cat: 'piscina', legenda: 'Piscina com bar molhado, prainha e hidromassagem' },
      { src: 'rooftop-mirante', cat: 'rooftop', legenda: 'Rooftop, sala de contemplação e mirante panorâmico' },
      { src: 'piscina-deck', cat: 'piscina', legenda: 'Deck da piscina' },
      { src: 'lazer-rooftop', cat: 'rooftop', legenda: 'Núcleo de lazer com rooftop' },
      { src: 'casa-fachada', cat: 'fachadas', legenda: 'Fachada das casas' },
      { src: 'dunas-1', cat: 'casas', legenda: 'Casa Dunas' },
      { src: 'estrela-1', cat: 'casas', legenda: 'Casa Estrela' },
      { src: 'int-estar', cat: 'casas', legenda: 'Estar e jantar integrados' },
      { src: 'int-cozinha', cat: 'casas', legenda: 'Cozinha' },
      { src: 'int-suite', cat: 'casas', legenda: 'Suíte' },
      { src: 'int-sala', cat: 'casas', legenda: 'Sala' },
      { src: 'beach-tennis', cat: 'lazer', legenda: 'Quadra de Beach Tennis' },
      { src: 'playground', cat: 'lazer', legenda: 'Espaço Kids — Playground' },
      { src: 'petplay', cat: 'lazer', legenda: 'Espaço Pet — Petplay' },
      { src: 'redario', cat: 'lazer', legenda: 'Redário' },
      { src: 'guarderia', cat: 'lazer', legenda: 'Guarderia' },
      { src: 'rua-interna', cat: 'paisagismo', legenda: 'Via interna arborizada' },
      { src: 'int-jardim', cat: 'paisagismo', legenda: 'Jardim interno' },
      { src: 'familia-piscina', cat: 'piscina', legenda: 'Momentos em família' },
    ],

    categoriasGaleria: [
      ['todas', 'Todas'], ['aereas', 'Aéreas'], ['dunas', 'Dunas e lagoas'], ['fachadas', 'Fachadas'],
      ['casas', 'Casas'], ['piscina', 'Piscina'], ['rooftop', 'Rooftop'], ['lazer', 'Áreas de lazer'], ['paisagismo', 'Paisagismo'],
    ],
  };

  L.img = (name, small) => IMG + name + (small ? '-sm' : '') + '.webp';
  L.findLazer = (id) => L.data.lazer.find((x) => x.id === id || String(x.n) === String(id));
  L.findCasa = (id) => L.data.casas.find((c) => c.id === id);
})(window.Lumoa);
