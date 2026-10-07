import React, { useState } from 'react';
import { OFFICIAL_ICONS } from './bookmakerOfficialIcons';

/**
 * Iconos de las casas de apuestas. Se usa el icono oficial de cada casa (guardado en
 * public/bookmakers/) y, si no lo hay, un distintivo con el color de la marca y sus
 * iniciales, dibujado en SVG. Los colores también se usan en las etiquetas de la lista.
 */
export interface BadgeSpec {
  /** Color de fondo */
  bg: string;
  /** Color del texto principal */
  fg: string;
  /** Texto grande (1-5 caracteres) */
  label: string;
  /** Texto pequeño opcional debajo del principal */
  sub?: string;
  /** Color del texto pequeño (por defecto, el del texto principal) */
  subColor?: string;
  /** Franja de color en la parte inferior */
  accent?: string;
}

const BADGES: Record<string, BadgeSpec> = {
  '888sport':         { bg: '#111111', fg: '#ff7a00', label: '888', sub: 'SPORT', subColor: '#ffffff' },
  'admiralbet':       { bg: '#0b2a5b', fg: '#ffffff', label: 'A', sub: 'BET', subColor: '#ffc600' },
  'bet365':           { bg: '#027b5b', fg: '#ffe115', label: '365', sub: 'BET', subColor: '#ffffff' },
  'bet777':           { bg: '#b0001e', fg: '#ffffff', label: '777', sub: 'BET', subColor: '#ffd400' },
  'betfair':          { bg: '#ffb80c', fg: '#111111', label: 'bf' },
  'betsson':          { bg: '#ff6600', fg: '#ffffff', label: 'B' },
  'betway':           { bg: '#111111', fg: '#ffffff', label: 'BW', accent: '#00a826' },
  'bwin':             { bg: '#111111', fg: '#ffffff', label: 'bwin', accent: '#ffcc00' },
  'casinobarcelona':  { bg: '#9e0b2b', fg: '#ffffff', label: 'CB', accent: '#d4af37' },
  'casinogranmadrid': { bg: '#0a2d5c', fg: '#ffffff', label: 'CGM', accent: '#d4af37' },
  'codere':           { bg: '#1b1b1b', fg: '#79c000', label: 'C', sub: 'CODERE', subColor: '#ffffff' },
  'ebingo':           { bg: '#ff7a00', fg: '#ffffff', label: 'e' },
  'efbet':            { bg: '#0b3a82', fg: '#ffd200', label: 'ef' },
  'enracha':          { bg: '#5b1fa6', fg: '#ffffff', label: 'ER', accent: '#ffb000' },
  'goldenpark':       { bg: '#121212', fg: '#d4af37', label: 'GP' },
  'interwetten':      { bg: '#ffe500', fg: '#111111', label: 'iw' },
  'jokerbet':         { bg: '#3a0f5c', fg: '#ffffff', label: 'J', sub: 'BET', subColor: '#7ee000' },
  'kirolbet':         { bg: '#ffffff', fg: '#ff6600', label: 'K', sub: 'BET', subColor: '#111111' },
  'leovegas':         { bg: '#fd5000', fg: '#ffffff', label: 'LV' },
  'luckia':           { bg: '#ffffff', fg: '#ff6a00', label: 'L', accent: '#00a0e3' },
  'marathonbet':      { bg: '#0d2d5b', fg: '#ffffff', label: 'M', accent: '#e30613' },
  'marcaapuestas':    { bg: '#e30613', fg: '#ffffff', label: 'MA' },
  'olybet':           { bg: '#111111', fg: '#ffffff', label: 'OB', accent: '#00c389' },
  'paf':              { bg: '#ffd400', fg: '#111111', label: 'paf' },
  'paston':           { bg: '#009fe3', fg: '#ffffff', label: 'P' },
  'pokerstars':       { bg: '#c8102e', fg: '#ffffff', label: '★', sub: 'STARS', subColor: '#ffffff' },
  'retabet':          { bg: '#111111', fg: '#a3e635', label: 'R' },
  'sportium':         { bg: '#e30613', fg: '#ffffff', label: 'S', accent: '#111111' },
  'tonybet':          { bg: '#111111', fg: '#ffffff', label: 'TB', accent: '#e30613' },
  'versus':           { bg: '#111111', fg: '#40e0d0', label: 'VS' },
  'williamhill':      { bg: '#00143c', fg: '#ffffff', label: 'WH', accent: '#fcd200' },
  'winamax':          { bg: '#d7182a', fg: '#ffffff', label: 'W', sub: 'MAX', subColor: '#111111' },
  '1xbet':            { bg: '#10a0ff', fg: '#ffffff', label: '1X', sub: 'BET' },
  'aupabet':          { bg: '#e00030', fg: '#ffffff', label: 'A', sub: 'BET' },
  'betfred':          { bg: '#0020f0', fg: '#ffffff', label: 'BF', accent: '#f01020' },
  'betinia':          { bg: '#000000', fg: '#00f090', label: 'b' },
  'casinogranvia':    { bg: '#ffffff', fg: '#006050', label: 'GV', accent: '#f0a030' },
  'casumo':           { bg: '#7030ff', fg: '#ffe000', label: 'c' },
  'dafabet':          { bg: '#000000', fg: '#ffffff', label: 'D' },
  'daznbet':          { bg: '#001010', fg: '#f0ff00', label: 'DZ', sub: 'BET', subColor: '#ffffff' },
  'juegging':         { bg: '#40b030', fg: '#ffffff', label: 'J' },
  'speedybet':        { bg: '#111111', fg: '#00ffa0', label: 'S' },
  'yaasscasino':      { bg: '#000000', fg: '#f020e0', label: 'y' },
  'yosports':         { bg: '#202040', fg: '#ffffff', label: 'YS' },
  'zebet':            { bg: '#c02030', fg: '#ffffff', label: 'ZE' },
  'zeturf':           { bg: '#d01000', fg: '#ffffff', label: 'ZE', sub: 'TURF' },
  'botemania':        { bg: '#ff8020', fg: '#ffffff', label: 'B' },
  'goldenbull':       { bg: '#102030', fg: '#d4af37', label: 'GB' },
  'monopolycasino':   { bg: '#102861', fg: '#ffd000', label: '777', sub: 'MONOPOLY', subColor: '#ffffff' },
  'solcasino':        { bg: '#ff3030', fg: '#ffd000', label: 'SOL' },
};

// Otros nombres con los que puede aparecer una casa (por ejemplo, leídos de una captura)
const ALIASES: Record<string, string> = {
  pokerstarssports: 'pokerstars',
  '888': '888sport',
  betfairexchange: 'betfair',
  marca: 'marcaapuestas',
  admiral: 'admiralbet',
};

// Colores para las casas que añada el usuario (se elige uno fijo según el nombre)
const FALLBACK_COLORS = ['#334155', '#7c3aed', '#0e7490', '#b45309', '#be123c', '#15803d', '#1d4ed8', '#a21caf'];

/** "Pastón" → "paston", "William Hill" → "williamhill" */
export const normalizeBookmakerName = (name: string): string =>
  name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? '?').slice(0, 2).toUpperCase();
}

/** Identificador de una casa conocida a partir de su nombre, o null si no es una de la lista. */
export function resolveBookmakerKey(name: string): string | null {
  const key = normalizeBookmakerName(name);
  if (BADGES[key]) return key;
  if (ALIASES[key]) return ALIASES[key];
  // Nombres con extras, como "bet365.es" o "Codere Apuestas"
  return Object.keys(BADGES).find(k => key.startsWith(k) || (key.length >= 4 && k.startsWith(key))) ?? null;
}

/** Icono oficial de la casa (imagen en public/bookmakers/), si existe. */
export function getOfficialIcon(name: string): { src: string; size: number; bg?: string; display?: number } | null {
  const key = resolveBookmakerKey(name);
  return key ? OFFICIAL_ICONS[key] ?? null : null;
}

export function getBadgeSpec(name: string): BadgeSpec {
  const known = resolveBookmakerKey(name);
  if (known) return BADGES[known];

  const key = normalizeBookmakerName(name);

  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { bg: FALLBACK_COLORS[hash % FALLBACK_COLORS.length], fg: '#ffffff', label: initials(name || '?') };
}

// Tamaño del texto según su longitud (en un lienzo de 64x64)
const labelSize = (label: string, hasSub: boolean): number => {
  const len = [...label].length;
  const base = len <= 1 ? 34 : len === 2 ? 28 : len === 3 ? 22 : len === 4 ? 17 : 13;
  return hasSub ? Math.min(base, 26) : base;
};

const FONT = "'Plus Jakarta Sans', 'Arial Black', Arial, sans-serif";

interface BadgeShapes {
  spec: BadgeSpec;
  mainSize: number;
  mainY: number;
  subY: number;
}

function layout(spec: BadgeSpec): BadgeShapes {
  const hasSub = !!spec.sub;
  const mainSize = labelSize(spec.label, hasSub);
  return {
    spec,
    mainSize,
    // Coordenadas de la línea base del texto
    mainY: hasSub ? 36 : 32 + mainSize * 0.36,
    subY: 50,
  };
}

/** Icono como componente React (se usa en la app). */
export const BookmakerBadge: React.FC<{ name: string; className?: string; title?: string }> = ({ name, className, title }) => {
  const { spec, mainSize, mainY, subY } = layout(getBadgeSpec(name));
  const gradientId = `bt-shine-${normalizeBookmakerName(name) || 'x'}`;
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title ?? name}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${gradientId}-clip`}>
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${gradientId}-clip)`}>
        <rect width="64" height="64" fill={spec.bg} />
        {spec.accent && <rect y="57" width="64" height="7" fill={spec.accent} />}
        <rect width="64" height="64" fill={`url(#${gradientId})`} />
      </g>
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="#ffffff" strokeOpacity="0.12" />
      <text x="32" y={mainY} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={mainSize} fill={spec.fg} letterSpacing={-0.5}>
        {spec.label}
      </text>
      {spec.sub && (
        <text x="32" y={subY} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={spec.sub.length > 5 ? 8 : 10} fill={spec.subColor ?? spec.fg} letterSpacing={0.6}>
          {spec.sub}
        </text>
      )}
    </svg>
  );
};

// Marca que identifica los iconos generados por la app (frente a imágenes subidas por el usuario)
const GENERATED_MARKER = 'data-bettrack-badge';

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));

/** El mismo icono como imagen (data URI), para guardarlo en los datos de la casa. */
export function getBookmakerIconDataUri(name: string): string {
  const { spec, mainSize, mainY, subY } = layout(getBadgeSpec(name));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ${GENERATED_MARKER}="1">` +
    `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="c"><rect width="64" height="64" rx="14"/></clipPath></defs>` +
    `<g clip-path="url(#c)"><rect width="64" height="64" fill="${spec.bg}"/>` +
    (spec.accent ? `<rect y="57" width="64" height="7" fill="${spec.accent}"/>` : '') +
    `<rect width="64" height="64" fill="url(#s)"/></g>` +
    `<text x="32" y="${mainY}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="800" font-size="${mainSize}" fill="${spec.fg}">${escapeXml(spec.label)}</text>` +
    (spec.sub ? `<text x="32" y="${subY}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="800" font-size="${spec.sub.length > 5 ? 8 : 10}" fill="${spec.subColor ?? spec.fg}">${escapeXml(spec.sub)}</text>` : '') +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** true si el icono es una imagen subida por el usuario (y no uno generado por la app). */
export function isCustomBookmakerIcon(icon: string | undefined): boolean {
  if (!icon || !icon.startsWith('data:image')) return false;
  try {
    return !decodeURIComponent(icon).includes(GENERATED_MARKER);
  } catch {
    return true;
  }
}

/** Icono por defecto de una casa: el oficial si existe; si no, el distintivo generado. */
export function getDefaultBookmakerIcon(name: string): string {
  return getOfficialIcon(name)?.src ?? getBookmakerIconDataUri(name);
}

/**
 * Icono de una casa listo para mostrar: la imagen subida por el usuario si la hay,
 * el icono oficial, o el distintivo generado (también si el oficial no carga).
 */
export const BookmakerLogo: React.FC<{ name: string; icon?: string; className?: string }> = ({ name, icon, className }) => {
  const [failed, setFailed] = useState(false);
  const official = getOfficialIcon(name);

  if (isCustomBookmakerIcon(icon) && !failed) {
    return <img src={icon} alt={name} className={`object-contain ${className ?? ''}`} onError={() => setFailed(true)} />;
  }
  if (official && !failed) {
    // Los iconos que la casa solo publica en tamaño pequeño no se agrandan más del doble
    // (o del tamaño indicado en display), para que no se vean borrosos
    const maxSize = official.display ?? (official.size < 64 ? official.size * 2 : undefined);
    return (
      <span
        className={`relative block ${className ?? ''}`}
        style={official.bg ? { backgroundColor: official.bg } : undefined}
      >
        {/* Margen del 10% del propio icono cuando lleva relleno de color, para que valga
            igual en el icono grande de Casas que en el pequeño de la lista de apuestas */}
        <span className="absolute flex items-center justify-center" style={{ inset: official.bg ? '10%' : 0 }}>
          <img
            src={official.src}
            alt={name}
            className="w-full h-full object-contain"
            style={maxSize ? { maxWidth: maxSize, maxHeight: maxSize } : undefined}
            onError={() => setFailed(true)}
          />
        </span>
      </span>
    );
  }
  return <BookmakerBadge name={name} className={className} />;
};
