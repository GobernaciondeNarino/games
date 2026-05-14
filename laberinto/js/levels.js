// Datos del juego: niveles, personajes y biblioteca de pistas.

export const CHARACTERS = {
  nino: {
    name: 'Wawa Wari',
    preview: 'https://guaguas.narino.gov.co/wp-content/uploads/2026/05/ninoIndigena-right.png',
    model: 'https://guaguas.narino.gov.co/wp-app/nino-indigena.glb'
  },
  nina: {
    name: 'Wawa Killa',
    preview: 'https://guaguas.narino.gov.co/wp-content/uploads/2026/05/nina-rights.png',
    model: 'https://guaguas.narino.gov.co/wp-app/nina.glb'
  }
};

export const LEVELS = [
  {
    id: 'galeras',
    name: 'Volcán Galeras',
    subtitle: 'Pasto, La Ciudad Sorpresa',
    theme: 'volcano',
    tip: 'Mira al fondo: Urcunina humea sobre el valle de Atriz.',
    colors: { sky: 0x00a6e7, ground: 0x80ba27, accent: 0xff7043 },
    sky: { top: 0x0077A3, mid: 0x00AEEF, bottom: 0xB3E5FC, hemi: 0.55, dir: 1.05, amb: 0.9 },
    maze: { color: 0x5D4037 },
    questions: [
      {
        question: '¿Cuál es el nombre nativo del Volcán Galeras dado por los pueblos Pastos y Quillacingas?',
        options: ['Yacuanquer', 'Urcunina', 'Putumayo', 'Doña Juana'],
        answer: 1,
        explain: 'Los pueblos Pastos y Quillacingas lo llamaban "Urcunina", que significa "montaña de fuego" en quechua.'
      },
      {
        question: '¿Cuál es la altitud aproximada de la cumbre del Volcán Galeras sobre el nivel del mar?',
        options: ['2.500 m', '3.200 m', '4.276 m', '5.800 m'],
        answer: 2,
        explain: 'La cumbre del Galeras alcanza los 4.276 metros sobre el nivel del mar.'
      },
      {
        question: 'El Volcán Galeras es uno de los más activos de Colombia. ¿En qué cordillera se levanta?',
        options: ['Cordillera Oriental', 'Cordillera Central', 'Cordillera Occidental', 'Sierra Nevada'],
        answer: 1,
        explain: 'El Galeras se ubica en la Cordillera Central andina, junto a la ciudad de San Juan de Pasto.'
      }
    ]
  },
  {
    id: 'cocha',
    name: 'Laguna de La Cocha',
    subtitle: 'El segundo lago más grande de Colombia',
    theme: 'lake',
    tip: 'Las casas de El Encano vestidas de colores rodean el espejo de agua.',
    colors: { sky: 0x00a6e7, ground: 0x77ad25, accent: 0x1d5179 },
    sky: { top: 0x0077A3, mid: 0x00AEEF, bottom: 0xB3E5FC, hemi: 0.55, dir: 1.05, amb: 0.9 },
    maze: { color: 0x77a027 },
    questions: [
      {
        question: '¿Cuál es el santuario insular —el parque nacional más pequeño de Colombia— ubicado en la Laguna de La Cocha?',
        options: ['Isla Gorgona', 'Isla La Corota', 'Isla Malpelo', 'Isla del Encanto'],
        answer: 1,
        explain: 'La Isla La Corota, dentro de La Cocha, es el parque nacional natural más pequeño de Colombia.'
      },
      {
        question: '¿Qué otro nombre recibe la Laguna de La Cocha?',
        options: ['Lago Tota', 'Lago Calima', 'Lago Guamuez', 'Laguna del Otún'],
        answer: 2,
        explain: 'La Laguna de La Cocha también se conoce como Lago Guamuez.'
      },
      {
        question: '¿Qué lugar ocupa La Cocha entre los lagos naturales más grandes de Colombia?',
        options: ['El primero', 'El segundo', 'El tercero', 'El quinto'],
        answer: 1,
        explain: 'La Cocha es el segundo lago natural más grande del país, solo superado por el Lago de Tota.'
      }
    ]
  },
  {
    id: 'lajas',
    name: 'Santuario de Las Lajas',
    subtitle: 'Joya neogótica sobre el cañón',
    theme: 'church',
    tip: 'La basílica se eleva entre las paredes del cañón del Guáitara.',
    colors: { sky: 0x00a6e7, ground: 0x915030, accent: 0xe9c46a },
    sky: { top: 0x123F52, mid: 0xF4A261, bottom: 0xE76F51, hemi: 0.45, dir: 0.95, amb: 0.85 },
    maze: { color: 0x5D4037 },
    questions: [
      {
        question: '¿Sobre qué río se levanta la imponente basílica del Santuario de Las Lajas?',
        options: ['Río Magdalena', 'Río Patía', 'Río Guáitara', 'Río Cauca'],
        answer: 2,
        explain: 'El Santuario se erige sobre un puente que cruza el cañón del río Guáitara, en Ipiales.'
      },
      {
        question: '¿En qué municipio del sur de Nariño se encuentra el Santuario de Las Lajas?',
        options: ['Túquerres', 'Ipiales', 'Pasto', 'Cumbal'],
        answer: 1,
        explain: 'El Santuario está en Ipiales, a pocos kilómetros de la frontera con Ecuador.'
      },
      {
        question: '¿Qué estilo arquitectónico predomina en el Santuario de Las Lajas?',
        options: ['Barroco', 'Neogótico', 'Renacentista', 'Modernista'],
        answer: 1,
        explain: 'La basílica luce un estilo neogótico, con torres altas y arcos apuntados.'
      }
    ]
  },
  {
    id: 'azufral',
    name: 'Laguna Verde del Azufral',
    subtitle: 'Esmeralda en el cráter',
    theme: 'crater',
    tip: 'Las fumarolas suben del agua tibia teñida de turquesa.',
    colors: { sky: 0x87eeff, ground: 0x77ad25, accent: 0x26C6DA },
    sky: { top: 0x0077A3, mid: 0x26C6DA, bottom: 0x87eeff, hemi: 0.5, dir: 1.0, amb: 0.95 },
    maze: { color: 0x9E9E9E },
    questions: [
      {
        question: 'En el municipio de Túquerres se encuentra la Laguna Verde, dentro del cráter del volcán...',
        options: ['Galeras', 'Cumbal', 'Chiles', 'Azufral'],
        answer: 3,
        explain: 'La Laguna Verde reposa en el cráter del volcán Azufral.'
      },
      {
        question: '¿Aproximadamente a cuántos metros sobre el nivel del mar se encuentra la cumbre del Azufral?',
        options: ['2.800 msnm', '4.000 msnm', '5.300 msnm', '1.500 msnm'],
        answer: 1,
        explain: 'El Azufral alcanza unos 4.000 msnm.'
      },
      {
        question: '¿Qué característica especial distingue al agua de la Laguna Verde?',
        options: ['Es totalmente helada', 'Es tibia con vapores en algunos puntos', 'Es salada como el mar', 'Cambia de color cada mes'],
        answer: 1,
        explain: 'El agua de la Laguna Verde es tibia y casi hirviente en ciertos puntos por la actividad volcánica.'
      }
    ]
  },
  {
    id: 'cumbal',
    name: 'Volcán Nevado del Cumbal',
    subtitle: 'El Gigante del Sur — punto más alto de Nariño',
    theme: 'snow_volcano',
    tip: 'Dos cráteres gemelos y la Laguna de La Bolsa a sus pies.',
    colors: { sky: 0x87eeff, ground: 0xE0F0F8, accent: 0xFFC107 },
    sky: { top: 0x0077A3, mid: 0x00AEEF, bottom: 0xFFFFFF, hemi: 0.65, dir: 1.15, amb: 1.05 },
    maze: { color: 0x8E8E8E },
    questions: [
      {
        question: '¿Cuál es la altitud aproximada del Volcán Nevado del Cumbal?',
        options: ['3.500 msnm', '4.276 msnm', '4.764 msnm', '5.500 msnm'],
        answer: 2,
        explain: 'El Cumbal alcanza los 4.764 msnm, la cumbre más alta del departamento.'
      },
      {
        question: 'A los pies del Cumbal reposa una laguna emblemática. ¿Cómo se llama?',
        options: ['Laguna Verde', 'Laguna de La Cocha', 'Laguna de La Bolsa', 'Laguna del Otún'],
        answer: 2,
        explain: 'La Laguna de La Bolsa se formó en una caldera volcánica antigua.'
      },
      {
        question: '¿Qué pueblo indígena considera al Volcán Cumbal parte central de su identidad?',
        options: ['Pastos', 'Wayúu', 'Embera', 'Muisca'],
        answer: 0,
        explain: 'El pueblo Pastos custodia el Cumbal como parte de su cosmovisión.'
      }
    ]
  },
  {
    id: 'carnaval',
    name: 'Carnaval de Negros y Blancos',
    subtitle: 'Patrimonio Cultural Inmaterial UNESCO',
    theme: 'carnival',
    tip: 'Las carrozas monumentales bailan al ritmo de la murga.',
    colors: { sky: 0xff6b9d, ground: 0x6c2d8b, accent: 0xffd400 },
    sky: { top: 0x6A1B9A, mid: 0xE84393, bottom: 0xFFC107, hemi: 0.6, dir: 1.1, amb: 1.0 },
    maze: { color: 0x9C27B0 },
    questions: [
      {
        question: '¿En qué año la UNESCO declaró al Carnaval de Negros y Blancos Patrimonio Cultural Inmaterial?',
        options: ['2001', '2009', '2015', '1995'],
        answer: 1,
        explain: 'El 30 de septiembre de 2009, en Abu Dhabi, fue inscrito en la Lista del PCI.'
      },
      {
        question: '¿Entre qué fechas oficiales se celebra el Carnaval cada año?',
        options: ['1 al 5 de febrero', '28 de diciembre al 7 de enero', '12 al 17 de octubre', '20 al 25 de junio'],
        answer: 1,
        explain: 'Inicia el 28 de diciembre y termina el 7 de enero con el Desfile Magno.'
      },
      {
        question: '¿De qué pueblos indígenas heredó el Carnaval sus rituales originales?',
        options: ['Wayúu y Arhuaco', 'Pastos y Quillacingas', 'Muiscas', 'Embera y Kogui'],
        answer: 1,
        explain: 'Tiene raíces en rituales agrarios de los Pastos y Quillacingas — honra a la Luna (Quilla).'
      }
    ]
  },
  {
    id: 'awa',
    name: 'Selva del Pacífico',
    subtitle: 'Territorio del pueblo Awá',
    theme: 'jungle',
    tip: 'La selva del Chocó biogeográfico cobija al pueblo Awá-Coaiquer.',
    colors: { sky: 0x87eeff, ground: 0x77a027, accent: 0x915030 },
    sky: { top: 0x1F5E6E, mid: 0x77ad25, bottom: 0x87eeff, hemi: 0.7, dir: 0.95, amb: 0.95 },
    maze: { color: 0x5D4037 },
    questions: [
      {
        question: 'El pueblo Awá del piedemonte costero habla una lengua llamada...',
        options: ['Quechua', 'Inga', 'Awá Pit', 'Kamëntsá'],
        answer: 2,
        explain: 'El Awá Pit es la lengua del pueblo Awá-Coaiquer.'
      },
      {
        question: '¿En qué subregión geográfica de Nariño habita el pueblo Awá?',
        options: ['Altiplano andino', 'Piedemonte costero del Pacífico', 'Vertiente amazónica', 'Valle de Atriz'],
        answer: 1,
        explain: 'Los Awá habitan Barbacoas, Ricaurte, Mallama y Tumaco.'
      },
      {
        question: 'Al pueblo Awá también se le conoce con otro nombre tradicional. ¿Cuál es?',
        options: ['Coaiquer (Kwaiker)', 'Pijao', 'Tunebo', 'Yukpa'],
        answer: 0,
        explain: 'El pueblo Awá también es llamado Coaiquer o Kwaiker. "Awá" significa "gente".'
      }
    ]
  },
  {
    id: 'nambi',
    name: 'Reserva Río Ñambí',
    subtitle: 'Santuario de los colibríes — Barbacoas',
    theme: 'cloud_forest',
    tip: 'Más de 30 especies de colibríes danzan en el dosel del bosque nublado.',
    colors: { sky: 0xa5d66a, ground: 0x2E7D32, accent: 0xE84393 },
    sky: { top: 0x1F5E6E, mid: 0x6CC04A, bottom: 0xA5D66A, hemi: 0.8, dir: 0.85, amb: 1.0 },
    maze: { color: 0x5D4037 },
    questions: [
      {
        question: '¿En qué municipio del piedemonte costero se encuentra la Reserva Río Ñambí?',
        options: ['Tumaco', 'Pasto', 'Barbacoas', 'Ipiales'],
        answer: 2,
        explain: 'Está en el corregimiento de Altaquer, municipio de Barbacoas.'
      },
      {
        question: 'La Reserva Río Ñambí es famosa por albergar la mayor diversidad mundial de...',
        options: ['Tucanes', 'Águilas', 'Colibríes', 'Loros'],
        answer: 2,
        explain: 'Más de 30 especies de colibríes registradas — la mayor diversidad del planeta.'
      },
      {
        question: '¿Qué fundación comunitaria administra la Reserva desde 1991?',
        options: ['FELCA — Fundación Los Colibríes de Altaquer', 'Parques Nacionales', 'WWF Colombia', 'Corponariño'],
        answer: 0,
        explain: 'FELCA, fundación comunitaria que nació en un colegio local en 1991.'
      }
    ]
  },
  {
    id: 'tumaco',
    name: 'Tumaco',
    subtitle: 'La Perla del Pacífico',
    theme: 'beach',
    tip: 'El arco natural del Morro recibe a las marolas del Pacífico.',
    colors: { sky: 0x87eeff, ground: 0xecbe66, accent: 0x0077A3 },
    sky: { top: 0x00AEEF, mid: 0x87eeff, bottom: 0xFFC107, hemi: 0.65, dir: 1.15, amb: 1.0 },
    maze: { color: 0x915030 },
    questions: [
      {
        question: '¿Cómo se conoce a Tumaco, el principal puerto del Pacífico nariñense?',
        options: ['La Ciudad Sorpresa', 'La Perla del Pacífico', 'La Capital del Café', 'La Tierra del Sol'],
        answer: 1,
        explain: 'Tumaco es llamada "La Perla del Pacífico".'
      },
      {
        question: '¿Qué famosa formación natural se puede ver en las playas de El Morro?',
        options: ['Una cascada gigante', 'Un arco natural rocoso', 'Un volcán submarino', 'Una cueva de cristal'],
        answer: 1,
        explain: 'Las playas de El Morro son célebres por su arco natural de roca.'
      },
      {
        question: '¿Qué grupo étnico es mayoritario en la población de Tumaco?',
        options: ['Mestizo andino', 'Afrodescendiente', 'Indígena Pasto', 'Inmigrante europeo'],
        answer: 1,
        explain: 'La población de Tumaco es predominantemente afrodescendiente.'
      }
    ]
  },
  {
    id: 'pueblos',
    name: 'Pueblos Ancestrales',
    subtitle: 'Hijos de la luna y del sol',
    theme: 'sacred',
    tip: 'El círculo de monolitos honra a Quilla, la Luna sagrada de los Quillacingas.',
    colors: { sky: 0x2c1f4a, ground: 0x3d2c5a, accent: 0xe8a020 },
    sky: { top: 0x0B2C3D, mid: 0x6A1B9A, bottom: 0xE84393, hemi: 0.4, dir: 0.7, amb: 0.75 },
    maze: { color: 0x6A1B9A },
    questions: [
      {
        question: '¿Cuáles son los dos pueblos indígenas más numerosos del altiplano andino de Nariño?',
        options: ['Wayúu y Arhuaco', 'Embera y Kogi', 'Pastos y Quillacingas', 'Muisca y Tairona'],
        answer: 2,
        explain: 'Los Pastos y los Quillacingas están organizados en 21 resguardos reconocidos.'
      },
      {
        question: 'A los Quillacingas se les conoce simbólicamente como "los hijos de la..."',
        options: ['Tierra', 'Luna', 'Selva', 'Lluvia'],
        answer: 1,
        explain: 'Los Quillacingas se autodenominan "los hijos de la Luna".'
      },
      {
        question: '¿Cuántos resguardos indígenas legalmente reconocidos hay en Nariño?',
        options: ['5', '10', '21', '64'],
        answer: 2,
        explain: 'Hay 21 resguardos indígenas legalmente reconocidos.'
      }
    ]
  }
];

export const HINT_LIBRARY = {
  galeras: [
    'Los pueblos Pastos lo llamaron "Urcunina" — montaña de fuego en quechua',
    'Su cumbre se eleva a 4.276 metros sobre el nivel del mar',
    'Forma parte de la Cordillera Central, junto a Pasto'
  ],
  cocha: [
    'Cobija a "La Corota", el parque nacional más pequeño de Colombia',
    'También es conocida como Lago Guamuez',
    'Solo el Lago de Tota la supera en tamaño en todo el país'
  ],
  lajas: [
    'Su basílica se levanta sobre el cañón del río Guáitara',
    'Está en Ipiales, a pocos km de la frontera con Ecuador',
    'Su arquitectura combina arcos apuntados y torres altas — estilo neogótico'
  ],
  azufral: [
    'Su laguna esmeralda reposa en el cráter de un volcán de Túquerres',
    'La cumbre alcanza unos 4.000 msnm — un volcán activo de baja altura',
    'En partes del agua sube vapor: actividad volcánica permanente'
  ],
  cumbal: [
    'Es el punto más alto del departamento de Nariño',
    'A sus pies reposa la Laguna de La Bolsa, de aguas grises',
    'Es parte del territorio ancestral del pueblo Pastos'
  ],
  carnaval: [
    'En 2009 la UNESCO lo inscribió como Patrimonio Cultural Inmaterial',
    'Va del 28 de diciembre al 7 de enero cada año',
    'Hereda rituales agrarios de los pueblos Pastos y Quillacingas'
  ],
  awa: [
    'Su lengua se llama "Awá Pit" — significa "habla de la gente"',
    'Habitan el piedemonte costero pacífico: Barbacoas, Mallama, Ricaurte',
    'También se les conoce como Coaiquer o Kwaiker'
  ],
  nambi: [
    'Está en Altaquer, corregimiento de Barbacoas',
    'Tiene la comunidad de colibríes más diversa del planeta',
    'Es administrada por FELCA, fundación comunitaria desde 1991'
  ],
  tumaco: [
    'Es llamada "La Perla del Pacífico" por su riqueza natural',
    'Sus playas de El Morro tienen un arco rocoso natural',
    'Su cultura es predominantemente afrodescendiente'
  ],
  pueblos: [
    'Los Pastos y los Quillacingas son los pueblos andinos más numerosos',
    'A los Quillacingas se les llama "los hijos de la Luna"',
    'Hay 21 resguardos indígenas legalmente reconocidos en Nariño'
  ]
};

export const POINTS_PER_HINT = 2;
export const POINTS_PER_CORRECT_ANSWER = 10;
