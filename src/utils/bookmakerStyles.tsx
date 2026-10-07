import React from 'react';
import { resolveBookmakerKey } from './bookmakerIcons';

/**
 * Nombre de cada casa con el estilo de su logotipo: colores oficiales (sacados de sus
 * iconos) y una tipografía de Google Fonts parecida a la suya. Las tipografías originales
 * de los logotipos son propiedad de cada marca, así que se usan alternativas libres.
 * Los colores están pensados para leerse sobre fondo oscuro.
 */

type FontKey = 'montserrat' | 'nunito' | 'poppins' | 'playfair' | 'oswald' | 'slab';

const FONTS: Record<FontKey, string> = {
  montserrat: "'Montserrat', sans-serif",   // sans geométrica y gruesa
  nunito: "'Nunito', sans-serif",           // redondeada
  poppins: "'Poppins', sans-serif",         // geométrica limpia
  playfair: "'Playfair Display', serif",    // con remates, elegante
  oswald: "'Oswald', sans-serif",           // estrecha
  slab: "'Alfa Slab One', serif",           // remates gruesos (estilo periódico)
};

interface Wordmark {
  font: FontKey;
  weight?: number;
  italic?: boolean;
  /** Mayúsculas, minúsculas o tal cual */
  case?: 'upper' | 'lower' | 'none';
  /** Espaciado entre letras (em) */
  tracking?: number;
  /** Trozos del nombre con su color */
  parts: [text: string, color: string][];
  /** Fondo oficial de la marca para las etiquetas de la lista de apuestas */
  bg: string;
}

const WHITE = '#ffffff';
const DARK = '#141414';

const WORDMARKS: Record<string, Wordmark> = {
  '888sport':         { font: 'montserrat', weight: 900, case: 'lower', parts: [['888', '#7ccf2e'], ['sport', WHITE]], bg: '#101010' },
  'admiralbet':       { font: 'montserrat', weight: 800, case: 'upper', parts: [['Admiral', WHITE], ['Bet', '#ffd000']], bg: '#002050' },
  'bet365':           { font: 'montserrat', weight: 800, case: 'lower', parts: [['bet', WHITE], ['365', '#ffe020']], bg: '#127a5b' },
  'bet777':           { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['Bet', WHITE], ['777', '#e02020']], bg: DARK },
  'betfair':          { font: 'nunito', weight: 900, case: 'lower', parts: [['betfair', '#ffb80c']], bg: '#273a47' },
  'betsson':          { font: 'montserrat', weight: 800, case: 'upper', tracking: 0.02, parts: [['Betsson', '#ff6000']], bg: DARK },
  'betway':           { font: 'poppins', weight: 700, case: 'lower', parts: [['betway', WHITE]], bg: '#000000' },
  'bwin':             { font: 'nunito', weight: 900, case: 'lower', parts: [['bw', WHITE], ['i', '#ffd000'], ['n', WHITE]], bg: '#000000' },
  'casinobarcelona':  { font: 'playfair', weight: 700, case: 'none', parts: [['Casino ', WHITE], ['Barcelona', '#ff3040']], bg: '#101020' },
  'casinogranmadrid': { font: 'playfair', weight: 700, italic: true, case: 'none', parts: [['Casino Gran Madrid', '#d8b46a']], bg: '#1a1410' },
  'codere':           { font: 'nunito', weight: 900, case: 'lower', parts: [['codere', '#80c000']], bg: '#304050' },
  'ebingo':           { font: 'nunito', weight: 900, case: 'lower', parts: [['e', '#ffa000'], ['bingo', WHITE]], bg: '#303030' },
  'efbet':            { font: 'montserrat', weight: 900, case: 'lower', parts: [['ef', '#ffe000'], ['bet', WHITE]], bg: '#202020' },
  'enracha':          { font: 'poppins', weight: 700, case: 'lower', parts: [['enracha', '#ff5000']], bg: '#303030' },
  'goldenpark':       { font: 'montserrat', weight: 800, case: 'none', parts: [['Golden', WHITE], ['Park', '#ff0080']], bg: DARK },
  'interwetten':      { font: 'montserrat', weight: 800, case: 'lower', parts: [['interwetten', '#ffd000']], bg: DARK },
  'jokerbet':         { font: 'montserrat', weight: 900, case: 'upper', parts: [['Joker', '#e03020'], ['bet', WHITE]], bg: '#203060' },
  'kirolbet':         { font: 'montserrat', weight: 900, case: 'upper', parts: [['Kirol', WHITE], ['bet', '#ff8200']], bg: DARK },
  'leovegas':         { font: 'poppins', weight: 700, case: 'none', parts: [['LeoVegas', '#ff6040']], bg: DARK },
  'luckia':           { font: 'nunito', weight: 900, case: 'lower', parts: [['l', '#f07040'], ['u', '#f5b301'], ['c', '#7cc242'], ['k', '#60b0e0'], ['i', '#904090'], ['a', '#e04080']], bg: DARK },
  'marathonbet':      { font: 'oswald', weight: 700, case: 'upper', tracking: 0.03, parts: [['Marathon', WHITE], ['bet', '#e02030']], bg: '#0d2d5b' },
  'marcaapuestas':    { font: 'slab', weight: 400, case: 'upper', parts: [['Marca', '#f00000'], [' apuestas', WHITE]], bg: DARK },
  'olybet':           { font: 'montserrat', weight: 800, case: 'none', parts: [['Oly', WHITE], ['Bet', '#ff1a1a']], bg: DARK },
  'paf':              { font: 'nunito', weight: 900, case: 'lower', parts: [['paf', WHITE]], bg: '#003833' },
  'paston':           { font: 'nunito', weight: 900, case: 'lower', parts: [['pastón', '#0090f0']], bg: DARK },
  'pokerstars':       { font: 'montserrat', weight: 800, italic: true, case: 'none', parts: [['Poker', WHITE], ['Stars', '#e04030']], bg: '#000000' },
  'retabet':          { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['Reta', WHITE], ['bet', '#b0f000']], bg: '#001000' },
  'sportium':         { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['Sportium', '#ff1a2a']], bg: DARK },
  'tonybet':          { font: 'poppins', weight: 700, case: 'none', parts: [['Tony', '#ff4000'], ['Bet', '#b26bff']], bg: DARK },
  'versus':           { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['Versus', '#00ffe0']], bg: '#000000' },
  'williamhill':      { font: 'playfair', weight: 700, italic: true, case: 'none', parts: [['William Hill', WHITE]], bg: '#001030' },
  'winamax':          { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['Winamax', '#e01010']], bg: '#000000' },
  '1xbet':            { font: 'montserrat', weight: 900, case: 'upper', parts: [['1x', '#10a0ff'], ['bet', WHITE]], bg: DARK },
  'aupabet':          { font: 'montserrat', weight: 900, case: 'upper', parts: [['Aupa', '#ff1a4a'], ['bet', WHITE]], bg: DARK },
  'betfred':          { font: 'montserrat', weight: 900, italic: true, case: 'none', parts: [['Bet', '#4d6bff'], ['fred', '#f01020']], bg: DARK },
  'betinia':          { font: 'poppins', weight: 700, case: 'lower', parts: [['betinia', '#00f090']], bg: '#000000' },
  'casinogranvia':    { font: 'poppins', weight: 600, case: 'none', parts: [['Casino ', WHITE], ['Gran ', '#1a9c84'], ['Vía', '#f0a030']], bg: DARK },
  'casumo':           { font: 'nunito', weight: 900, case: 'lower', parts: [['casumo', '#8a4dff']], bg: DARK },
  'dafabet':          { font: 'montserrat', weight: 800, case: 'none', parts: [['Dafabet', WHITE]], bg: '#000000' },
  'daznbet':          { font: 'montserrat', weight: 900, case: 'upper', parts: [['Dazn', WHITE], ['bet', '#f0ff00']], bg: '#001010' },
  'juegging':         { font: 'nunito', weight: 900, case: 'lower', parts: [['juegging', '#40b030']], bg: DARK },
  'speedybet':        { font: 'montserrat', weight: 900, italic: true, case: 'lower', parts: [['speedybet', '#00ffa0']], bg: DARK },
  'yaasscasino':      { font: 'nunito', weight: 900, case: 'lower', parts: [['yaass', '#f020e0'], [' casino', WHITE]], bg: '#000000' },
  'yosports':         { font: 'montserrat', weight: 900, case: 'none', parts: [['Yo', WHITE], ['Sports', '#a3e635']], bg: '#202040' },
  'zebet':            { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['ZE', '#e0303c'], ['bet', WHITE]], bg: DARK },
  'zeturf':           { font: 'montserrat', weight: 900, italic: true, case: 'upper', parts: [['ZE', '#ff2a10'], ['turf', WHITE]], bg: DARK },
  'botemania':        { font: 'nunito', weight: 900, case: 'lower', parts: [['botemanía', '#ff8020']], bg: DARK },
  'goldenbull':       { font: 'montserrat', weight: 900, case: 'upper', parts: [['Golden', '#d4af37'], ['Bull', WHITE]], bg: '#102030' },
  'monopolycasino':   { font: 'montserrat', weight: 900, case: 'upper', parts: [['Monopoly ', '#ff2a2a'], ['Casino', '#ffd000']], bg: '#102861' },
  'solcasino':        { font: 'poppins', weight: 700, case: 'none', parts: [['Sol', '#ff4030'], [' Casino', '#ffb020']], bg: DARK },
};

const TEXT_TRANSFORM = { upper: 'uppercase', lower: 'lowercase', none: 'none' } as const;

/** Estilo oficial del nombre de una casa, o null si no es una casa conocida. */
export function getWordmark(name: string): Wordmark | null {
  const key = resolveBookmakerKey(name);
  return key ? WORDMARKS[key] ?? null : null;
}

/**
 * Nombre de la casa con su estilo. Para las casas que añada el usuario se muestra
 * el nombre tal cual, con el estilo del elemento que lo contiene.
 */
export const renderBookmakerName = (name: string) => {
  const wordmark = getWordmark(name);
  if (!wordmark) return <span>{name}</span>;

  return (
    <span
      style={{
        fontFamily: FONTS[wordmark.font],
        fontWeight: wordmark.weight ?? 800,
        fontStyle: wordmark.italic ? 'italic' : 'normal',
        textTransform: TEXT_TRANSFORM[wordmark.case ?? 'none'],
        letterSpacing: `${wordmark.tracking ?? 0}em`,
      }}
    >
      {wordmark.parts.map(([text, color], i) => (
        <span key={i} style={{ color }}>{text}</span>
      ))}
    </span>
  );
};
