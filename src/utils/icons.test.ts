import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getSportIconSrc } from './icons';

const SPORTS = ['Fútbol', 'Baloncesto', 'Tenis', 'eSports', 'Béisbol', 'NFL', 'MMA', 'Ciclismo', 'F1', 'MotoGP', 'Boxeo', 'Caballos', 'Otros'];

describe('iconos de deporte', () => {
  it('cada deporte tiene su icono y el archivo existe', () => {
    for (const sport of SPORTS) {
      expect(existsSync(join('public', getSportIconSrc(sport))), sport).toBe(true);
    }
  });

  it('un deporte desconocido usa el icono de "Otros"', () => {
    expect(getSportIconSrc('Curling')).toBe(getSportIconSrc('Otros'));
  });
});
