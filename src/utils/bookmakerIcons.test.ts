import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getBadgeSpec, getBookmakerIconDataUri, getDefaultBookmakerIcon, getOfficialIcon, isCustomBookmakerIcon, normalizeBookmakerName } from './bookmakerIcons';

const DEFAULT_BOOKMAKERS = [
  '888sport', 'AdmiralBet', 'Bet365', 'Betfair', 'Betsson', 'Betway', 'Bet777', 'Bwin', 'Casino Barcelona',
  'Casino Gran Madrid', 'Codere', 'Ebingo', 'Efbet', 'Enracha', 'GoldenPark', 'Interwetten', 'Jokerbet',
  'Kirolbet', 'LeoVegas', 'Luckia', 'Marathonbet', 'Marca Apuestas', 'OlyBet', 'Paf', 'Pastón',
  'PokerStars Sports', 'Retabet', 'Sportium', 'TonyBet', 'Versus', 'William Hill', 'Winamax',
  '1xBet', 'Aupabet', 'Betfred', 'Betinia', 'Casino Gran Vía', 'Casumo', 'Dafabet', 'DAZN Bet', 'Juegging', 'Speedybet', 'Yaass Casino', 'YoSports', 'ZEbet', 'ZEturf',
  'Botemanía', 'Golden Bull', 'Monopoly Casino', 'Sol Casino',
];

describe('normalizeBookmakerName', () => {
  it('quita tildes, espacios y mayúsculas', () => {
    expect(normalizeBookmakerName('Pastón')).toBe('paston');
    expect(normalizeBookmakerName('William Hill')).toBe('williamhill');
  });
});

describe('getBadgeSpec', () => {
  it('todas las casas por defecto tienen un icono diseñado (no el genérico)', () => {
    const generic = new Set(['#334155', '#7c3aed', '#0e7490', '#b45309', '#be123c', '#15803d', '#1d4ed8', '#a21caf']);
    for (const name of DEFAULT_BOOKMAKERS) {
      const spec = getBadgeSpec(name);
      expect(generic.has(spec.bg), name).toBe(false);
    }
  });

  it('reconoce variantes del nombre', () => {
    expect(getBadgeSpec('bet365.es')).toEqual(getBadgeSpec('Bet365'));
    expect(getBadgeSpec('BET 365')).toEqual(getBadgeSpec('Bet365'));
    expect(getBadgeSpec('PokerStars')).toEqual(getBadgeSpec('PokerStars Sports'));
  });

  it('las casas nuevas reciben sus iniciales y siempre el mismo color', () => {
    const spec = getBadgeSpec('Mi Casa Nueva');
    expect(spec.label).toBe('MC');
    expect(getBadgeSpec('Mi Casa Nueva')).toEqual(spec);
    expect(getBadgeSpec('Zeta').label).toBe('ZE');
  });
});

describe('isCustomBookmakerIcon', () => {
  it('distingue los iconos generados de las imágenes subidas por el usuario', () => {
    expect(isCustomBookmakerIcon(getBookmakerIconDataUri('Bet365'))).toBe(false);
    expect(isCustomBookmakerIcon('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isCustomBookmakerIcon('data:image/svg+xml;utf8,<svg></svg>')).toBe(true);
  });

  it('los enlaces antiguos a imágenes externas no cuentan como personalizados', () => {
    expect(isCustomBookmakerIcon('https://upload.wikimedia.org/x.png')).toBe(false);
    expect(isCustomBookmakerIcon(undefined)).toBe(false);
  });
});

describe('iconos oficiales', () => {
  it('todas las casas por defecto tienen icono oficial y el archivo existe', () => {
    for (const name of DEFAULT_BOOKMAKERS) {
      const icon = getOfficialIcon(name);
      expect(icon, name).not.toBeNull();
      expect(existsSync(join('public', icon!.src)), icon!.src).toBe(true);
    }
  });

  it('el icono por defecto es el oficial si existe y, si no, el generado', () => {
    expect(getDefaultBookmakerIcon('Bet365')).toBe('/bookmakers/bet365.png');
    expect(getDefaultBookmakerIcon('Mi Casa Nueva').startsWith('data:image/svg+xml')).toBe(true);
  });

  it('los iconos oficiales no cuentan como imagen subida por el usuario', () => {
    expect(isCustomBookmakerIcon('/bookmakers/bet365.png')).toBe(false);
  });
});
