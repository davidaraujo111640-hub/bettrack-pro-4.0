import { describe, expect, it } from 'vitest';
import { detectInstallKind } from './installHelp';

const base = { platform: 'Win32', maxTouchPoints: 0, standalone: false };

describe('detectInstallKind', () => {
  it('detecta iPhone', () => {
    expect(detectInstallKind({ ...base, platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1' })).toBe('ios');
  });

  it('detecta iPad moderno, que se hace pasar por Mac pero es táctil', () => {
    expect(detectInstallKind({ ...base, platform: 'MacIntel', maxTouchPoints: 5, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15' })).toBe('ios');
  });

  it('un Mac normal no es iOS', () => {
    expect(detectInstallKind({ ...base, platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15' })).toBe('other');
  });

  it('Android y escritorio son "other" (usan el botón nativo del navegador)', () => {
    expect(detectInstallKind({ ...base, platform: 'Linux armv8l', maxTouchPoints: 5, userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36' })).toBe('other');
  });

  it('si ya está instalada no muestra nada, sea cual sea el sistema', () => {
    expect(detectInstallKind({ ...base, standalone: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe('installed');
  });
});
