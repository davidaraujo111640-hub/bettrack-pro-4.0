// Iconos oficiales de las casas de apuestas (public/bookmakers/), descargados de sus webs
// oficiales o del servicio de iconos de Google. size = resolución real en píxeles;
// bg = color de relleno alrededor del icono (para los oscuros o los pequeños que dejan hueco);
// display = tamaño máximo en pantalla, para que los iconos pequeños no se vean borrosos.
export const OFFICIAL_ICONS: Record<string, { src: string; size: number; bg?: string; display?: number }> = {
  '888sport': { src: '/bookmakers/888sport.png', size: 256 },
  'admiralbet': { src: '/bookmakers/admiralbet.png', size: 180 },
  'bet365': { src: '/bookmakers/bet365.png', size: 192 },
  'bet777': { src: '/bookmakers/bet777.ico', size: 16, display: 24 },
  'betfair': { src: '/bookmakers/betfair.png', size: 16, bg: '#273a47' }, // mismo fondo que el icono
  'betsson': { src: '/bookmakers/betsson.png', size: 180 },
  'betway': { src: '/bookmakers/betway.png', size: 180 },
  'bwin': { src: '/bookmakers/bwin.png', size: 180 },
  'casinobarcelona': { src: '/bookmakers/casinobarcelona.png', size: 256 },
  'casinogranmadrid': { src: '/bookmakers/casinogranmadrid.png', size: 194, bg: '#ffffff' },
  'codere': { src: '/bookmakers/codere.png', size: 512 },
  'ebingo': { src: '/bookmakers/ebingo.png', size: 192 },
  'efbet': { src: '/bookmakers/efbet.png', size: 256 },
  'enracha': { src: '/bookmakers/enracha.png', size: 180 },
  'goldenpark': { src: '/bookmakers/goldenpark.png', size: 192 },
  'interwetten': { src: '/bookmakers/interwetten.png', size: 152 },
  'jokerbet': { src: '/bookmakers/jokerbet.png', size: 512 },
  'kirolbet': { src: '/bookmakers/kirolbet.ico', size: 16, bg: '#ff8200' }, // mismo fondo que el icono
  'leovegas': { src: '/bookmakers/leovegas.png', size: 1024 },
  'luckia': { src: '/bookmakers/luckia.png', size: 48, display: 40 },
  'marathonbet': { src: '/bookmakers/marathonbet.png', size: 152 },
  'marcaapuestas': { src: '/bookmakers/marcaapuestas.png', size: 32, display: 32, bg: '#ffffff' }, // mismo fondo que el icono
  'olybet': { src: '/bookmakers/olybet.png', size: 32, display: 32 },
  'paf': { src: '/bookmakers/paf.png', size: 32, display: 32, bg: '#003833' }, // mismo fondo que el icono
  'paston': { src: '/bookmakers/paston.ico', size: 256, display: 32 }, // su versión de 256 px es una ampliación pixelada
  'pokerstars': { src: '/bookmakers/pokerstars.png', size: 180 },
  'retabet': { src: '/bookmakers/retabet.png', size: 180 },
  'sportium': { src: '/bookmakers/sportium.png', size: 144 },
  'tonybet': { src: '/bookmakers/tonybet.png', size: 256 },
  'versus': { src: '/bookmakers/versus.png', size: 228 },
  'williamhill': { src: '/bookmakers/williamhill.png', size: 192 },
  'winamax': { src: '/bookmakers/winamax.png', size: 180 },
  '1xbet': { src: '/bookmakers/1xbet.png', size: 256 },
  'aupabet': { src: '/bookmakers/aupabet.ico', size: 256 },
  'betfred': { src: '/bookmakers/betfred.jpg', size: 256 },
  'betinia': { src: '/bookmakers/betinia.png', size: 192 },
  'casinogranvia': { src: '/bookmakers/casinogranvia.png', size: 180, bg: '#ffffff' }, // logotipo transparente con verde oscuro
  'casumo': { src: '/bookmakers/casumo.png', size: 180 },
  'dafabet': { src: '/bookmakers/dafabet.ico', size: 256 },
  'daznbet': { src: '/bookmakers/daznbet.png', size: 180 },
  'juegging': { src: '/bookmakers/juegging.png', size: 144 },
  'speedybet': { src: '/bookmakers/speedybet.ico', size: 48, display: 40 },
  'yaasscasino': { src: '/bookmakers/yaasscasino.png', size: 294 },
  'yosports': { src: '/bookmakers/yosports.png', size: 180 },
  'zebet': { src: '/bookmakers/zebet.png', size: 128 },
  'zeturf': { src: '/bookmakers/zeturf.png', size: 256 },
  'botemania': { src: '/bookmakers/botemania.png', size: 192, bg: '#ffffff' }, // las estrellas son huecos: en blanco, como el logotipo
  'goldenbull': { src: '/bookmakers/goldenbull.ico', size: 32, display: 32, bg: '#122430' }, // mismo fondo que el icono
  'monopolycasino': { src: '/bookmakers/monopolycasino.png', size: 192 },
  'solcasino': { src: '/bookmakers/solcasino.png', size: 48, display: 40 },
};
