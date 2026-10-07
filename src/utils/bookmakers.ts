import { getBadgeSpec, getDefaultBookmakerIcon } from './bookmakerIcons';
import { getWordmark } from './bookmakerStyles';

export interface BookmakerBrand {
  logo: string;
  color: string;
  textColor: string;
}

/** Colores de marca e icono de una casa de apuestas. */
export const getBookmakerBrand = (name: string): BookmakerBrand => {
  const spec = getBadgeSpec(name);
  return {
    logo: getDefaultBookmakerIcon(name),
    // Fondo oficial de la marca (o el del distintivo, para las casas añadidas por el usuario)
    color: getWordmark(name)?.bg ?? spec.bg,
    textColor: spec.fg,
  };
};

export const getBookmakerIcon = (name: string): string => getDefaultBookmakerIcon(name);
