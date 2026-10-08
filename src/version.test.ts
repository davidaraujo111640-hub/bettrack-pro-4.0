import { describe, expect, it } from 'vitest';
import { formatBuildDate, fullVersion, shortVersion } from './version';

describe('version', () => {
  it('formatea la fecha de publicación en español', () => {
    expect(formatBuildDate('2026-10-08T11:30:00.000Z')).toBe('8 oct 2026');
    expect(formatBuildDate('2027-01-01T00:00:00.000Z')).toBe('1 ene 2027');
  });

  it('devuelve vacío si la fecha no es válida', () => {
    expect(formatBuildDate('')).toBe('');
    expect(formatBuildDate('no es una fecha')).toBe('');
  });

  it('muestra la versión corta y la completa', () => {
    expect(shortVersion('1.0.1')).toBe('v1.0.1');
    expect(fullVersion('1.0.1', '2026-10-08T11:30:00.000Z', 'fc361a3')).toBe('v1.0.1 · 8 oct 2026 · fc361a3');
  });

  it('omite la fecha si no se conoce', () => {
    expect(fullVersion('1.0.1', '', 'dev')).toBe('v1.0.1 · dev');
  });
});
