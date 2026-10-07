// Logotipos oficiales (versión horizontal) de las casas, en public/bookmakers/logos/.
// Sacados de la cabecera de la web oficial de cada casa, salvo los marcados como Wikimedia Commons.
// variant: 'dark' = se ve sobre fondo oscuro; 'light' = necesita fondo claro;
//          'invert' = logotipo negro de un solo color que se muestra en blanco.
// bg = color de marca para el fondo de la etiqueta (en lugar del oscuro por defecto).
// ratio = ancho / alto del logotipo. Los que traían mucho margen transparente se han recortado.
export type LogoVariant = 'dark' | 'light' | 'invert';

export const OFFICIAL_LOGOS: Record<string, { src: string; variant: LogoVariant; ratio: number; bg?: string }> = {
  '1xbet': { src: '/bookmakers/logos/1xbet.png', variant: 'dark', ratio: 3.95, bg: '#195685' }, // Wikimedia Commons; recortado, sobre su azul
  '888sport': { src: '/bookmakers/logos/888sport.svg', variant: 'dark', ratio: 1.71 }, // símbolo de la cabecera de su web
  'aupabet': { src: '/bookmakers/logos/aupabet.png', variant: 'dark', ratio: 3.71 },
  'bet365': { src: '/bookmakers/logos/bet365.svg', variant: 'dark', ratio: 4.52, bg: '#126e51' }, // cabecera de su web, sobre su verde de marca
  'bet777': { src: '/bookmakers/logos/bet777.svg', variant: 'dark', ratio: 5 },
  'betfair': { src: '/bookmakers/logos/betfair.png', variant: 'invert', ratio: 5.79 },
  'betfred': { src: '/bookmakers/logos/betfred.png', variant: 'dark', ratio: 4.62 }, // Wikimedia Commons
  'betinia': { src: '/bookmakers/logos/betinia.svg', variant: 'dark', ratio: 2.62 },
  'betsson': { src: '/bookmakers/logos/betsson.svg', variant: 'dark', ratio: 5.56 },
  'betway': { src: '/bookmakers/logos/betway.svg', variant: 'dark', ratio: 3.54 },
  'botemania': { src: '/bookmakers/logos/botemania.svg', variant: 'dark', ratio: 3.95 }, // sin el eslogan, que no se lee a este tamaño
  'bwin': { src: '/bookmakers/logos/bwin.svg', variant: 'dark', ratio: 3 },
  'casinogranmadrid': { src: '/bookmakers/logos/casinogranmadrid.svg', variant: 'light', ratio: 3.77 },
  'casinogranvia': { src: '/bookmakers/logos/casinogranvia.svg', variant: 'dark', ratio: 3.47 },
  'casumo': { src: '/bookmakers/logos/casumo.svg', variant: 'dark', ratio: 5 },
  'codere': { src: '/bookmakers/logos/codere.svg', variant: 'dark', ratio: 4.22 },
  'daznbet': { src: '/bookmakers/logos/daznbet.svg', variant: 'dark', ratio: 2 },
  'ebingo': { src: '/bookmakers/logos/ebingo.svg', variant: 'dark', ratio: 3.64 },
  'enracha': { src: '/bookmakers/logos/enracha.svg', variant: 'dark', ratio: 2.85 },
  'goldenbull': { src: '/bookmakers/logos/goldenbull.png', variant: 'dark', ratio: 6.47 },
  'goldenpark': { src: '/bookmakers/logos/goldenpark.webp', variant: 'dark', ratio: 6 },
  'interwetten': { src: '/bookmakers/logos/interwetten.svg', variant: 'dark', ratio: 1.79 },
  'jokerbet': { src: '/bookmakers/logos/jokerbet.svg', variant: 'dark', ratio: 7.38 },
  'juegging': { src: '/bookmakers/logos/juegging.png', variant: 'light', ratio: 4.78 },
  'kirolbet': { src: '/bookmakers/logos/kirolbet.png', variant: 'light', ratio: 2.62 },
  'leovegas': { src: '/bookmakers/logos/leovegas.svg', variant: 'dark', ratio: 3.73 },
  'luckia': { src: '/bookmakers/logos/luckia.svg', variant: 'dark', ratio: 4.08 },
  'marathonbet': { src: '/bookmakers/logos/marathonbet.png', variant: 'dark', ratio: 4.06 },
  'marcaapuestas': { src: '/bookmakers/logos/marcaapuestas.svg', variant: 'dark', ratio: 6.46 },
  'olybet': { src: '/bookmakers/logos/olybet.svg', variant: 'dark', ratio: 2.94 },
  'paf': { src: '/bookmakers/logos/paf.svg', variant: 'dark', ratio: 3.11 }, // logotipo moderno de su web
  'paston': { src: '/bookmakers/logos/paston.svg', variant: 'dark', ratio: 2.96 },
  'solcasino': { src: '/bookmakers/logos/solcasino.svg', variant: 'dark', ratio: 2.48 }, // "SOL" de su logotipo, sin la banda "CASINO"
  'speedybet': { src: '/bookmakers/logos/speedybet.svg', variant: 'dark', ratio: 5.09 },
  'sportium': { src: '/bookmakers/logos/sportium.svg', variant: 'dark', ratio: 3.81 },
  'tonybet': { src: '/bookmakers/logos/tonybet.svg', variant: 'dark', ratio: 4.44 },
  'versus': { src: '/bookmakers/logos/versus.svg', variant: 'dark', ratio: 6.85 },
  'williamhill': { src: '/bookmakers/logos/williamhill.svg', variant: 'dark', ratio: 4.87 }, // cabecera de su web
  'winamax': { src: '/bookmakers/logos/winamax.png', variant: 'dark', ratio: 5 },
  'yaasscasino': { src: '/bookmakers/logos/yaasscasino.png', variant: 'dark', ratio: 3.18 },
  'yosports': { src: '/bookmakers/logos/yosports.svg', variant: 'dark', ratio: 4.08 },
  'zebet': { src: '/bookmakers/logos/zebet.png', variant: 'dark', ratio: 3 },
};
