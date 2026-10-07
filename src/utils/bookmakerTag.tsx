import React, { useState } from 'react';
import { BookmakerLogo, resolveBookmakerKey } from './bookmakerIcons';
import { OFFICIAL_LOGOS } from './bookmakerLogos';
import { renderBookmakerName } from './bookmakerStyles';
import { getBookmakerBrand } from './bookmakers';

// Fondo de las etiquetas con logotipo (oscuro, como el resto de la app) y el de los logos
// que solo se ven sobre claro
const DARK_TAG = '#0f1622';
const LIGHT_TAG = '#ffffff';

// Tamaño común de todas las etiquetas (móvil / escritorio)
const TAG_SIZE = 'w-[88px] h-6 md:w-[120px] md:h-8';

/** Logotipo oficial completo de una casa, si existe. */
export function getOfficialLogo(name: string) {
  const key = resolveBookmakerKey(name);
  return key ? OFFICIAL_LOGOS[key] ?? null : null;
}

/**
 * Etiqueta de una casa en la lista de apuestas: su logotipo oficial completo sobre una
 * pastilla; si la casa no tiene logotipo (o no carga), su icono y su nombre con su estilo.
 */
export const BookmakerTag: React.FC<{ name: string; icon?: string }> = ({ name, icon }) => {
  const [failed, setFailed] = useState(false);
  const logo = getOfficialLogo(name);

  if (logo && !failed) {
    return (
      // Todas las etiquetas tienen el mismo tamaño; cada logotipo crece hasta llenar el hueco
      // sin deformarse (los alargados se ajustan al ancho y los compactos ganan altura).
      // Los casi cuadrados usan toda la altura, sin relleno vertical.
      <div
        className={`flex items-center justify-center ${TAG_SIZE} px-1.5 md:px-2 ${logo.ratio < 2.2 ? 'py-px' : 'py-0.5 md:py-1'} rounded-md border border-white/10 shrink-0 transition-all hover:scale-105`}
        style={{ backgroundColor: logo.bg ?? (logo.variant === 'light' ? LIGHT_TAG : DARK_TAG) }}
        title={name}
      >
        <img
          src={logo.src}
          alt={name}
          className="w-full h-full object-contain"
          style={{ filter: logo.variant === 'invert' ? 'brightness(0) invert(1)' : undefined }}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const brand = getBookmakerBrand(name);
  return (
    <div
      className={`relative flex items-center justify-center gap-1 md:gap-1.5 px-1 rounded-md shadow-sm border border-white/5 transition-all hover:scale-105 ${TAG_SIZE} shrink-0 overflow-hidden`}
      style={{ backgroundColor: brand.color }}
    >
      <BookmakerLogo name={name} icon={icon} className="w-4 h-4 md:w-6 md:h-6 rounded-[3px] md:rounded overflow-hidden shrink-0" />
      <span className="text-[7px] md:text-[11px] font-black uppercase tracking-tighter whitespace-nowrap" style={{ color: brand.textColor }}>
        {renderBookmakerName(name)}
      </span>
    </div>
  );
};
