import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { OFFICIAL_LOGOS } from './bookmakerLogos';
import { getOfficialLogo } from './bookmakerTag';

describe('logotipos oficiales', () => {
  it('cada logotipo de la lista existe en public/', () => {
    for (const [key, logo] of Object.entries(OFFICIAL_LOGOS)) {
      expect(existsSync(join('public', logo.src)), `${key}: ${logo.src}`).toBe(true);
    }
  });

  it('no quedan archivos sin usar en public/bookmakers/logos', () => {
    const used = new Set(Object.values(OFFICIAL_LOGOS).map(l => l.src.split('/').pop()));
    for (const file of readdirSync(join('public', 'bookmakers', 'logos'))) {
      expect(used.has(file), file).toBe(true);
    }
  });

  it('se encuentran por el nombre de la casa, también con variantes', () => {
    expect(getOfficialLogo('Versus')?.src).toBe('/bookmakers/logos/versus.svg');
    expect(getOfficialLogo('Pastón')?.src).toBe('/bookmakers/logos/paston.svg');
    expect(getOfficialLogo('bet365.es')?.src).toBe('/bookmakers/logos/bet365.svg');
  });

  it('las casas sin logotipo (o desconocidas) devuelven null', () => {
    expect(getOfficialLogo('PokerStars Sports')).toBeNull();
    expect(getOfficialLogo('Mi Casa Nueva')).toBeNull();
  });
});
