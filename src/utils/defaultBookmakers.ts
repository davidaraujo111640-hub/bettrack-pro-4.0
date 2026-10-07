import { Bookmaker } from '../../types';
import { getBookmakerIcon } from './bookmakers';
import { isCustomBookmakerIcon } from './bookmakerIcons';

/** Casas que se han retirado de la lista y no deben volver a aparecer */
const REMOVED_BOOKMAKER_IDS = new Set(['wanabet']);

/** Casas con licencia española que trae la app de serie */
export function defaultBookmakers(): Bookmaker[] {
  return [
  { id: '888sport', name: '888sport', icon: getBookmakerIcon('888sport'), enabled: true },
  { id: 'admiralbet', name: 'AdmiralBet', icon: getBookmakerIcon('AdmiralBet'), enabled: true },
  { id: 'bet365', name: 'Bet365', icon: getBookmakerIcon('Bet365'), enabled: true },
  { id: 'betfair', name: 'Betfair', icon: getBookmakerIcon('Betfair'), enabled: true },
  { id: 'betsson', name: 'Betsson', icon: getBookmakerIcon('Betsson'), enabled: true },
  { id: 'betway', name: 'Betway', icon: getBookmakerIcon('Betway'), enabled: true },
  { id: 'bet777', name: 'Bet777', icon: getBookmakerIcon('Bet777'), enabled: true },
  { id: 'bwin', name: 'Bwin', icon: getBookmakerIcon('Bwin'), enabled: true },
  { id: 'casinobarcelona', name: 'Casino Barcelona', icon: getBookmakerIcon('Casino Barcelona'), enabled: true },
  { id: 'casinogranmadrid', name: 'Casino Gran Madrid', icon: getBookmakerIcon('Casino Gran Madrid'), enabled: true },
  { id: 'codere', name: 'Codere', icon: getBookmakerIcon('Codere'), enabled: true },
  { id: 'ebingo', name: 'Ebingo', icon: getBookmakerIcon('Ebingo'), enabled: true },
  { id: 'efbet', name: 'Efbet', icon: getBookmakerIcon('Efbet'), enabled: true },
  { id: 'enracha', name: 'Enracha', icon: getBookmakerIcon('Enracha'), enabled: true },
  { id: 'goldenpark', name: 'GoldenPark', icon: getBookmakerIcon('GoldenPark'), enabled: true },
  { id: 'interwetten', name: 'Interwetten', icon: getBookmakerIcon('Interwetten'), enabled: true },
  { id: 'jokerbet', name: 'Jokerbet', icon: getBookmakerIcon('Jokerbet'), enabled: true },
  { id: 'kirolbet', name: 'Kirolbet', icon: getBookmakerIcon('Kirolbet'), enabled: true },
  { id: 'leovegas', name: 'LeoVegas', icon: getBookmakerIcon('LeoVegas'), enabled: true },
  { id: 'luckia', name: 'Luckia', icon: getBookmakerIcon('Luckia'), enabled: true },
  { id: 'marathonbet', name: 'Marathonbet', icon: getBookmakerIcon('Marathonbet'), enabled: true },
  { id: 'marcaapuestas', name: 'Marca Apuestas', icon: getBookmakerIcon('Marca Apuestas'), enabled: true },
  { id: 'olybet', name: 'OlyBet', icon: getBookmakerIcon('OlyBet'), enabled: true },
  { id: 'paf', name: 'Paf', icon: getBookmakerIcon('Paf'), enabled: true },
  { id: 'paston', name: 'Pastón', icon: getBookmakerIcon('Pastón'), enabled: true },
  { id: 'pokerstars', name: 'PokerStars Sports', icon: getBookmakerIcon('PokerStars Sports'), enabled: true },
  { id: 'retabet', name: 'Retabet', icon: getBookmakerIcon('Retabet'), enabled: true },
  { id: 'sportium', name: 'Sportium', icon: getBookmakerIcon('Sportium'), enabled: true },
  { id: 'tonybet', name: 'TonyBet', icon: getBookmakerIcon('TonyBet'), enabled: true },
  { id: 'versus', name: 'Versus', icon: getBookmakerIcon('Versus'), enabled: true },
  { id: 'williamhill', name: 'William Hill', icon: getBookmakerIcon('William Hill'), enabled: true },
  { id: 'winamax', name: 'Winamax', icon: getBookmakerIcon('Winamax'), enabled: true },
  { id: '1xbet', name: '1xBet', icon: getBookmakerIcon('1xBet'), enabled: true },
  { id: 'aupabet', name: 'Aupabet', icon: getBookmakerIcon('Aupabet'), enabled: true },
  { id: 'betfred', name: 'Betfred', icon: getBookmakerIcon('Betfred'), enabled: true },
  { id: 'betinia', name: 'Betinia', icon: getBookmakerIcon('Betinia'), enabled: true },
  { id: 'casinogranvia', name: 'Casino Gran Vía', icon: getBookmakerIcon('Casino Gran Vía'), enabled: true },
  { id: 'casumo', name: 'Casumo', icon: getBookmakerIcon('Casumo'), enabled: true },
  { id: 'dafabet', name: 'Dafabet', icon: getBookmakerIcon('Dafabet'), enabled: true },
  { id: 'daznbet', name: 'DAZN Bet', icon: getBookmakerIcon('DAZN Bet'), enabled: true },
  { id: 'juegging', name: 'Juegging', icon: getBookmakerIcon('Juegging'), enabled: true },
  { id: 'speedybet', name: 'Speedybet', icon: getBookmakerIcon('Speedybet'), enabled: true },
  { id: 'yaasscasino', name: 'Yaass Casino', icon: getBookmakerIcon('Yaass Casino'), enabled: true },
  { id: 'yosports', name: 'YoSports', icon: getBookmakerIcon('YoSports'), enabled: true },
  { id: 'zebet', name: 'ZEbet', icon: getBookmakerIcon('ZEbet'), enabled: true },
  { id: 'zeturf', name: 'ZEturf', icon: getBookmakerIcon('ZEturf'), enabled: true },
  { id: 'botemania', name: 'Botemanía', icon: getBookmakerIcon('Botemanía'), enabled: true },
  { id: 'goldenbull', name: 'Golden Bull', icon: getBookmakerIcon('Golden Bull'), enabled: true },
  { id: 'monopolycasino', name: 'Monopoly Casino', icon: getBookmakerIcon('Monopoly Casino'), enabled: true },
  { id: 'solcasino', name: 'Sol Casino', icon: getBookmakerIcon('Sol Casino'), enabled: true },
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Limpia una lista guardada (en el navegador o en la nube): quita duplicadas y retiradas,
 * actualiza los iconos oficiales (respetando las imágenes subidas por el usuario) y
 * añade las casas nuevas de la lista por defecto que falten.
 */
export function normalizeBookmakers(savedList: unknown): Bookmaker[] {
  const defaults = defaultBookmakers();
  if (!Array.isArray(savedList)) return defaults;

  const savedIds = new Set(savedList.map((b: Bookmaker) => b?.id));
  const savedNames = new Set(savedList.map((b: Bookmaker) => b?.name?.toLowerCase()));
  const missing = defaults.filter(b => !savedIds.has(b.id) && !savedNames.has(b.name.toLowerCase()));

  const uniqueSaved: Bookmaker[] = [];
  const seenNames = new Set<string>();
  savedList.forEach((b: Bookmaker) => {
    if (!b || REMOVED_BOOKMAKER_IDS.has(b.id)) return;
    if (b.name && !seenNames.has(b.name.toLowerCase())) {
      const icon = isCustomBookmakerIcon(b.icon) ? b.icon : getBookmakerIcon(b.name);
      uniqueSaved.push(icon === b.icon ? b : { ...b, icon });
      seenNames.add(b.name.toLowerCase());
    }
  });

  return [...uniqueSaved, ...missing].sort((a, b) => a.name.localeCompare(b.name));
}
