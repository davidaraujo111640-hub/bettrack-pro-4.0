import React from 'react';

/**
 * Iconos de deporte: emojis Noto de Google (licencia Apache 2.0) guardados en
 * public/sports/, salvo MMA, que es una guantilla dibujada a mano con el mismo estilo
 * (los emojis no tienen guante de MMA).
 */
const SPORT_ICONS: Record<string, string> = {
  'Fútbol': '/sports/futbol.png',
  'Baloncesto': '/sports/baloncesto.png',
  'Tenis': '/sports/tenis.png',
  'eSports': '/sports/esports.png',
  'Béisbol': '/sports/beisbol.png',
  'NFL': '/sports/nfl.png',
  'MMA': '/sports/mma.svg',
  'Ciclismo': '/sports/ciclismo.png',
  'F1': '/sports/f1.png',
  'MotoGP': '/sports/motogp.png',
  'Boxeo': '/sports/boxeo.png',
  'Caballos': '/sports/caballos.png',
};
const OTHER_ICON = '/sports/otros.png';

export const getSportIconSrc = (sport: string): string => SPORT_ICONS[sport] ?? OTHER_ICON;

/** Icono del deporte, centrado en el recuadro que lo contiene. */
export const getSportIcon = (sport: string): React.ReactNode => (
  <div className="flex items-center justify-center w-full h-full transition-transform duration-300 group-hover:scale-110" title={sport}>
    <img src={getSportIconSrc(sport)} alt={sport} className="w-[68%] h-[68%] object-contain drop-shadow-md" draggable={false} />
  </div>
);
