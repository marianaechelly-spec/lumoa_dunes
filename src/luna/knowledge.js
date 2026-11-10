/* =========================================================================
   LUMA — Base de conhecimento do atendimento guiado
   Todas as respostas usam apenas informações de Lumoa.data (catálogo oficial).
   Regra de ouro: a Luma NUNCA informa preços, condições de pagamento,
   disponibilidade de lotes, prazos de obra ou qualquer dado comercial.
   ========================================================================= */
(function (L) {
  const D = L.data;
  const T = D.textos;

  // Rótulos das respostas rápidas
  const Q = {
    sobre: 'Conhecer o empreendimento', lotes: 'Ver os lotes', casas: 'Conhecer as casas', lazer: 'Ver a área de lazer',
    localizacao: 'Onde fica o Lumoa Dunes?', consultor: 'Quero falar com um consultor', 'casa-dunas': 'Casa Dunas',
    'casa-estrela': 'Casa Estrela', comparar: 'Comparar as casas', plantas: 'Ver as plantas', infraestrutura: 'Infraestrutura',
    mirante: 'Rooftop e mirante', implantacao: 'Ver a maquete 3D', galeria: 'Ver a galeria', precos: 'Valores e condições',
    visita: 'Agendar uma visita', menu: 'Outros assuntos', 'amenity:piscina': 'Piscina', 'amenity:beach-tennis': 'Beach Tennis',
    'amenity:playground': 'Playground', 'amenity:petplay': 'Espaço Pet', 'amenity:redario': 'Redário', interiores: 'Interiores',
  };

  const COMERCIAL =
    'Valores, condições de pagamento e disponibilidade de lotes são informados exclusivamente pela nossa equipe comercial, sempre atualizados. Prefiro não passar nenhuma informação que não seja oficial.';

  const amenityCard = (it) => ({ img: it.img, plan: it.img ? null : it, title: `${it.n}. ${it.nome}`, text: it.desc });

  const I = {};

  I.saudacao = {
    kw: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e ai', 'opa', 'tudo bem'],
    r: () => ({
      say: ['Olá! Que bom ter você por aqui. Eu sou a Luma, a assistente virtual do Lumoa Dunes.', 'Sobre o que você gostaria de conversar?'],
      quick: ['sobre', 'lotes', 'casas', 'lazer', 'localizacao', 'consultor'],
    }),
  };

  I.sobre = {
    kw: ['empreendimento', 'sobre', 'conhecer', 'o que e', 'lumoa', 'conceito', 'projeto', 'apresenta', 'apresentar', 'me conta', 'conte mais', 'historia', 'proposta'],
    r: () => ({
      say: [
        `O **Lumoa Dunes** fica em **Santo Amaro, no Maranhão**, o portal mais autêntico dos Lençóis Maranhenses. ${T.conceito}`,
        `É **${T.primeiro.charAt(0).toLowerCase() + T.primeiro.slice(1)}** São 10.840 m² de área total, com 6.400 m² de área loteada, lazer completo e dois projetos de casas para você escolher.`,
      ],
      cards: [{ img: 'aereo-condominio', title: 'Lumoa Dunes', text: 'Vista aérea do condomínio' }],
      actions: [{ label: 'Ver o empreendimento', act: 'goto', to: 'empreendimento' }],
      quick: ['lotes', 'lazer', 'casas', 'localizacao'],
    }),
  };

  I.localizacao = {
    kw: ['onde', 'fica', 'localiza', 'localizacao', 'endereco', 'santo amaro', 'olho d agua', 'olho dagua', 'bairro', 'mapa', 'regiao', 'lencois', 'chegar', 'como chego', 'distancia', 'perto', 'longe', 'cidade', 'maranhao', 'parque nacional'],
    r: () => ({
      say: [
        `O Lumoa Dunes está em **Santo Amaro — MA**, no **bairro Olho D’Água**. ${T.santoAmaro}`,
        `${T.localizacao} ${T.localizacaoUnica}`,
        'Para o endereço completo e a melhor rota até lá, nossa equipe comercial orienta você pessoalmente.',
      ],
      cards: [{ img: 'dunas-lagoas', title: 'Lençóis Maranhenses', text: 'Dunas e lagoas cristalinas' }],
      actions: [{ label: 'Ver no mapa', act: 'goto', to: 'localizacao' }],
      quick: ['sobre', 'lotes', 'consultor'],
    }),
  };

  I.lotes = {
    kw: ['lote', 'lotes', 'terreno', 'terrenos', 'metragem', 'tamanho', 'm2', 'metros', 'quantos lotes', 'area total', 'area loteada', 'unidades', 'quantas unidades', '200'],
    r: () => ({
      say: [
        'O condomínio tem **apenas 32 lotes**, e **cada lote possui 200 m²**.',
        'A **área total é de 10.840 m²**, com **6.400 m² de área loteada**. Os lotes ficam organizados ao redor da via interna, com o núcleo de lazer e o rooftop com mirante.',
      ],
      cards: [{ img: 'implantacao', title: 'Implantação', text: '32 lotes de 200 m² e 13 espaços numerados' }],
      actions: [{ label: 'Explorar em 3D', act: 'goto', to: 'implantacao' }],
      quick: ['disponibilidade', 'casas', 'lazer', 'consultor'],
    }),
  };
  Q.disponibilidade = 'Há lotes disponíveis?';

  I.implantacao = {
    kw: ['implantacao', 'planta do condominio', 'mapa do condominio', 'layout', 'distribuicao', 'masterplan', 'planta geral'],
    r: () => ({
      say: [
        'Na implantação você vê os 32 lotes e os 13 espaços numerados do condomínio:',
        '<ul>' + D.lazer.map((x) => `<li>${x.n}. ${x.nome}</li>`).join('') + '</ul>',
        'Na maquete 3D do site, é só tocar em cada número para ver o espaço.',
      ],
      actions: [{ label: 'Abrir a maquete 3D', act: 'goto', to: 'implantacao' }],
      quick: ['lazer', 'infraestrutura', 'lotes'],
    }),
  };

  I.lazer = {
    kw: ['lazer', 'area de lazer', 'areas comuns', 'area comum', 'diversao', 'o que tem', 'estrutura de lazer', 'amenidades', 'atracoes', 'familia', 'criancas'],
    r: () => ({
      say: [T.lazer, 'Entre os espaços estão a **piscina com bar molhado, prainha e hidromassagem**, o **rooftop com mirante**, a **quadra de beach tennis**, o **playground**, o **Espaço Pet**, o **redário**, o **gazebo** e a **churrasqueira**.'],
      cardsRow: ['piscina', 'rooftop', 'beach-tennis', 'playground', 'petplay', 'redario'].map((id) => amenityCard(L.findLazer(id))),
      actions: [{ label: 'Ver todos os espaços', act: 'goto', to: 'lazer' }],
      quick: ['mirante', 'amenity:piscina', 'infraestrutura', 'casas'],
    }),
  };

  I.infraestrutura = {
    kw: ['infraestrutura', 'infra', 'seguranca', 'estrutura', 'sustentavel', 'servicos', 'acesso', 'controle de acesso'],
    r: () => ({
      say: [
        'Na infraestrutura do condomínio, o catálogo apresenta:',
        '<ul>' + D.lazer.filter((x) => x.grupo === 'infra').map((x) => `<li><strong>${x.nome}</strong> — ${x.desc}</li>`).join('') + '</ul>',
        'Detalhes técnicos de cada item, como sistemas e equipamentos, são apresentados pela equipe comercial.',
      ],
      actions: [{ label: 'Ver infraestrutura na planta', act: 'plan', id: 'portaria' }],
      quick: ['lazer', 'lotes', 'consultor'],
    }),
  };

  I.mirante = {
    kw: ['mirante', 'rooftop', 'vista', 'contemplacao', 'sala de contemplacao', 'panoramico', 'por do sol', 'terraco'],
    r: () => ({
      say: [T.mirante, T.rooftop],
      cards: [{ img: 'nucleo-lazer-panorama', title: 'Rooftop com mirante', text: 'Nº 11 na implantação' }],
      actions: [{ label: 'Ver na implantação', act: 'plan', id: 'rooftop' }],
      quick: ['lazer', 'amenity:piscina', 'casas'],
    }),
  };

  // Um intent por espaço numerado da implantação
  const AMENITY_KW = {
    portaria: ['portaria', 'entrada', 'porteiro', 'guarita'],
    guarderia: ['guarderia', 'guardar veiculo', 'buggy', 'quadriciclo', 'garagem coletiva', 'utv'],
    'beach-tennis': ['beach tennis', 'beach tenis', 'quadra', 'tenis', 'esporte', 'esportes'],
    recarga: ['recarga', 'carro eletrico', 'carregador', 'eletrico', 'tomada veicular'],
    petplay: ['pet', 'pets', 'petplay', 'cachorro', 'cachorros', 'animal', 'animais', 'cao', 'gato'],
    'area-tecnica': ['area tecnica', 'tecnica', 'casa de maquinas'],
    playground: ['playground', 'parquinho', 'kids', 'infantil', 'brinquedo', 'brinquedos', 'espaco kids'],
    redario: ['redario', 'rede', 'redes', 'descansar'],
    piscina: ['piscina', 'bar molhado', 'hidromassagem', 'prainha', 'nadar'],
    gazebo: ['gazebo'],
    rooftop: [],
    churrasqueira: ['churrasqueira', 'churrasco', 'gourmet'],
    estacionamento: ['estacionamento', 'vaga', 'vagas', 'visitantes', 'estacionar'],
  };
  D.lazer.forEach((it) => {
    if (it.id === 'rooftop') { I['amenity:rooftop'] = I.mirante; return; }
    I['amenity:' + it.id] = {
      kw: AMENITY_KW[it.id] || [],
      r: () => ({
        say: [`**${it.nome}** (nº ${it.n} na implantação): ${it.desc}`],
        cards: [amenityCard(it)],
        actions: [{ label: 'Ver na implantação', act: 'plan', id: it.id }],
        quick: ['lazer', 'casas', 'consultor'],
      }),
    };
  });

  I.casas = {
    kw: ['casa', 'casas', 'modelos', 'modelo', 'projetos', 'projeto arquitetonico', 'construir', 'construcao', 'opcoes de casa', 'arquitetura', 'residencia'],
    r: () => ({
      say: ['O Lumoa Dunes oferece **2 opções de projeto** para você escolher:', T.arquitetura],
      cardsRow: D.casas.map((c) => ({ img: c.imagens[0].src, title: c.nome, text: c.tipo, spec: [[c.suites, 'suítes'], [c.area, 'm²']], act: { act: 'house', id: c.id } })),
      actions: [{ label: 'Ver as casas', act: 'goto', to: 'casas' }],
      quick: ['casa-dunas', 'casa-estrela', 'comparar', 'plantas'],
    }),
  };

  const casaIntent = (id) => ({
    r: (ctx) => {
      const c = L.findCasa(id);
      ctx.house = id;
      const pls = c.plantas.map((p) => p.titulo.toLowerCase()).join(' e ');
      return {
        say: [`A **${c.nome}** é ${id === 'dunas' ? 'uma casa **térrea com rooftop**' : 'uma casa de **dois pavimentos**'}, com **${c.suites} suítes** e **${c.area} m²**.`, c.resumo, `No catálogo você encontra as perspectivas da fachada e a planta do ${pls}.`],
        cards: [{ img: c.imagens[0].src, title: c.nome, text: `${c.tipo} · ${c.suites} suítes · ${c.area} m²`, gallery: c.imagens }],
        actions: [{ label: 'Ver fachadas', act: 'house', id, tab: 'fachadas' }, { label: 'Ver planta baixa', act: 'house', id, tab: 'plantas' }],
        quick: [id === 'dunas' ? 'casa-estrela' : 'casa-dunas', 'comparar', 'plantas', 'precos'],
      };
    },
  });
  I['casa-dunas'] = { kw: ['casa dunas', 'dunas terrea', 'terrea', 'duas suites', '2 suites', '104', '104,94', 'modelo dunas'], ...casaIntent('dunas') };
  I['casa-estrela'] = { kw: ['estrela', 'casa estrela', 'sobrado', 'dois pavimentos', '2 pavimentos', 'quatro suites', '4 suites', '116', '116,55', 'modelo estrela', 'dois andares'], ...casaIntent('estrela') };

  I.comparar = {
    kw: ['comparar', 'comparacao', 'diferenca', 'diferencas', 'qual melhor', 'qual a melhor', 'versus', ' vs ', 'qual escolher', 'qual das duas'],
    r: () => ({
      say: [
        'Veja a diferença entre os dois projetos:',
        '<ul><li><strong>Casa Dunas</strong> — térrea com rooftop, 2 suítes, 104,94 m².</li><li><strong>Casa Estrela</strong> — dois pavimentos, 4 suítes, 116,55 m².</li></ul>',
        'O pavimento térreo das duas tem a mesma planta no catálogo: suítes 01 e 02, jantar, cozinha, hall, lavabo, lavanderia, piscina, deck, duas áreas livres e estacionamento. A Casa Estrela soma o pavimento superior, com as suítes 03 e 04, sala TV/hall e varanda.',
        'A escolha depende do seu estilo de vida: quantas suítes você precisa e se prefere viver tudo em um só nível.',
      ],
      actions: [{ label: 'Abrir comparativo', act: 'goto', to: 'casas' }],
      quick: ['casa-dunas', 'casa-estrela', 'plantas', 'consultor'],
    }),
  };

  I.plantas = {
    kw: ['planta', 'plantas', 'planta baixa', 'ambientes', 'comodos', 'quartos', 'suite', 'suites', 'cozinha', 'sala', 'varanda', 'lavanderia', 'banheiro', 'banheiros', 'metragem dos ambientes', 'layout da casa', 'pavimento', 'superior', 'terreo'],
    r: (ctx) => {
      const id = ctx.house;
      if (!id) return {
        say: ['Claro! De qual casa você quer ver a planta?'],
        quick: ['casa-dunas', 'casa-estrela', 'comparar'],
        expect: 'house-for-plan',
      };
      const c = L.findCasa(id);
      const blocks = c.plantas.map((p) => `<p><strong>${p.titulo}</strong></p><ul>${p.ambientes.map(([n, a]) => `<li>${n}: ${a}</li>`).join('')}</ul>`).join('');
      return {
        say: [`Estes são os ambientes da **${c.nome}**, conforme a planta do catálogo:`, blocks],
        cards: c.plantas.map((p) => ({ img: p.src, title: `${c.nome} — ${p.titulo}`, text: 'Toque para ampliar', zoom: true })),
        actions: [{ label: 'Ver plantas no site', act: 'house', id, tab: 'plantas' }],
        quick: [id === 'dunas' ? 'casa-estrela' : 'casa-dunas', 'comparar', 'consultor'],
      };
    },
  };

  I.interiores = {
    kw: ['interior', 'interiores', 'decoracao', 'por dentro', 'ambientes internos', 'acabamento', 'acabamentos', 'materiais'],
    r: () => ({
      say: [T.materiais, 'O catálogo apresenta perspectivas de estar e jantar integrados, cozinha, jardim interno, sala e suíte. Especificações de acabamento são detalhadas pela equipe comercial.'],
      cardsRow: D.interiores.map((x) => ({ img: x.src, title: x.legenda, text: 'Perspectiva ilustrativa', zoom: true })),
      quick: ['casas', 'plantas', 'consultor'],
    }),
  };

  I.galeria = {
    kw: ['fotos', 'foto', 'imagens', 'imagem', 'galeria', 'ver fotos', 'video', 'videos', 'tour'],
    r: () => ({
      say: ['A galeria reúne as imagens do catálogo oficial: vistas aéreas, dunas e lagoas, fachadas, casas, piscina, rooftop, áreas de lazer e paisagismo.'],
      actions: [{ label: 'Abrir a galeria', act: 'goto', to: 'galeria' }, { label: 'Só dunas e lagoas', act: 'gallery', cat: 'dunas' }],
      quick: ['lazer', 'casas', 'localizacao'],
    }),
  };

  I.valorizacao = {
    kw: ['valorizacao', 'valoriza', 'investir', 'investimento', 'retorno', 'rentabilidade', 'aluguel', 'alugar', 'temporada', 'renda'],
    r: () => ({
      say: [`${T.localizacaoUnica} A arquitetura também foi pensada para valorizar seu investimento, e o Mirante Panorâmico diferencia o empreendimento na região.`, 'Projeções de retorno, rentabilidade ou uso para locação não fazem parte do catálogo. Um consultor pode conversar com você sobre o seu objetivo.'],
      quick: ['consultor', 'mirante', 'lotes'],
    }),
  };

  I.precos = {
    priority: 10,
    kw: ['preco', 'precos', 'valor', 'valores', 'quanto custa', 'custa', 'custo', 'parcela', 'parcelas', 'entrada', 'financiamento', 'financiar', 'pagamento', 'pagar', 'condicoes', 'condicao', 'desconto', 'tabela', 'a vista', 'prestacao', 'reais', 'r$', 'orcamento', 'caro', 'barato'],
    r: () => ({
      say: [COMERCIAL, 'Posso pedir para um consultor entrar em contato com você?'],
      actions: [{ label: 'Sim, quero um consultor', act: 'lead', primary: true }],
      quick: ['lotes', 'casas', 'lazer'],
    }),
  };

  I.disponibilidade = {
    priority: 10,
    kw: ['disponivel', 'disponiveis', 'disponibilidade', 'vendido', 'vendidos', 'restam', 'sobrou', 'sobraram', 'ainda tem', 'tem lote', 'unidades livres', 'esgotado', 'reservar', 'reserva'],
    r: () => ({
      say: ['A disponibilidade de lotes muda com frequência, por isso só a equipe comercial pode confirmar quais unidades estão livres neste momento.', 'Quer que um consultor fale com você?'],
      actions: [{ label: 'Falar com um consultor', act: 'lead', primary: true }],
      quick: ['lotes', 'implantacao', 'casas'],
    }),
  };

  I.prazo = {
    priority: 8,
    kw: ['entrega', 'prazo', 'obra', 'obras', 'quando fica pronto', 'pronto', 'lancamento', 'cronograma', 'previsao', 'construcao comeca', 'andamento'],
    r: () => ({
      say: ['Prazos de obra e de entrega não constam no catálogo que eu tenho. Para não passar uma data errada, a equipe comercial informa o cronograma atualizado.'],
      actions: [{ label: 'Falar com um consultor', act: 'lead', primary: true }],
      quick: ['sobre', 'casas'],
    }),
  };

  I.visita = {
    priority: 6,
    kw: ['visitar', 'visita', 'conhecer pessoalmente', 'agendar', 'agendamento', 'plantao', 'stand', 'decorado', 'ir ate'],
    r: () => ({
      say: ['Que ótimo que você quer conhecer o Lumoa Dunes de perto! As visitas são agendadas com a equipe comercial.', 'Posso registrar seu contato para um consultor combinar a visita com você?'],
      actions: [{ label: 'Sim, quero agendar', act: 'lead', primary: true, interesse: 'Agendar uma visita' }],
      quick: ['localizacao', 'sobre'],
    }),
  };

  I.consultor = {
    priority: 7,
    kw: ['consultor', 'corretor', 'atendente', 'humano', 'pessoa', 'falar com alguem', 'vendedor', 'whatsapp', 'zap', 'telefone', 'contato', 'ligar', 'ligacao', 'equipe comercial', 'comercial', 'atendimento'],
    r: () => {
      const actions = [{ label: 'Deixar meu contato', act: 'lead', primary: true }];
      if (L.leads.hasWhatsapp()) actions.push({ label: 'Chamar no WhatsApp', act: 'whatsapp' });
      actions.push({ label: 'Ir para o formulário', act: 'goto', to: 'contato' });
      return { say: ['Com prazer! Um consultor pode apresentar valores, condições e disponibilidade atualizados.', 'Como você prefere seguir?'], actions };
    },
  };

  I.realizacao = {
    kw: ['construtora', 'incorporadora', 'quem constroi', 'responsavel', 'fogaca', 'empresa', 'quem esta por tras', 'realizacao'],
    r: () => ({
      say: ['O catálogo oficial do Lumoa Dunes traz a assinatura da **Fogaça Empreendimentos**. Informações institucionais e documentação do empreendimento são apresentadas pela equipe comercial.'],
      quick: ['sobre', 'consultor'],
    }),
  };

  I.luna = {
    kw: ['quem e voce', 'quem e vc', 'voce e', 'robo', 'bot', 'inteligencia artificial', 'ia', 'luma', 'luna', 'seu nome', 'assistente'],
    r: () => ({
      say: ['Eu sou a **Luma**, a assistente virtual do Lumoa Dunes. Conheço cada detalhe do catálogo oficial e estou aqui para apresentar o empreendimento, mostrar as casas, os espaços de lazer e conectar você à nossa equipe.', 'Valores e disponibilidade eu deixo com os consultores, para você receber sempre a informação oficial.'],
      quick: ['sobre', 'casas', 'lazer', 'consultor'],
    }),
  };

  I.menu = {
    kw: ['menu', 'ajuda', 'opcoes', 'o que voce faz', 'o que vc faz', 'como funciona', 'inicio', 'voltar', 'outros assuntos', 'outro assunto'],
    r: () => ({ say: ['Posso ajudar com estes assuntos:'], quick: ['sobre', 'lotes', 'casas', 'lazer', 'localizacao', 'infraestrutura', 'galeria', 'consultor'] }),
  };

  I.obrigado = {
    kw: ['obrigado', 'obrigada', 'valeu', 'show', 'otimo', 'perfeito', 'legal', 'maravilha', 'top', 'gostei', 'lindo', 'incrivel', 'massa'],
    r: () => ({ say: ['Eu que agradeço! Fico feliz em apresentar o Lumoa Dunes. Quer conhecer mais algum detalhe?'], quick: ['casas', 'lazer', 'consultor', 'menu'] }),
  };

  I.tchau = {
    kw: ['tchau', 'ate logo', 'ate mais', 'ate breve', 'falou', 'encerrar', 'sair'],
    r: () => ({ say: ['Foi um prazer conversar com você! Quando quiser, é só me chamar aqui no canto da tela. Até breve!'], quick: ['consultor'] }),
  };

  I.fallback = {
    r: () => ({
      say: ['Hum, essa eu não encontrei no catálogo oficial e não quero arriscar uma resposta imprecisa.', 'Posso encaminhar sua pergunta para um consultor, ou você pode escolher um destes assuntos:'],
      actions: [{ label: 'Encaminhar ao consultor', act: 'lead' }],
      quick: ['sobre', 'lotes', 'casas', 'lazer', 'localizacao'],
    }),
  };

  L.lunaKB = { intents: I, labels: Q, COMERCIAL };
})(window.Lumoa);
