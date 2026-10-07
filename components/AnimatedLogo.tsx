import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Símbolo de BetTrack (flecha de tendencia al alza) animado: la línea se dibuja
 * subiendo de izquierda a derecha y la punta aparece al final con un pequeño impulso.
 * Se reproduce al abrir la app y cada vez que se entra en Resumen ("/").
 */
const AnimatedLogo: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  // Cada navegación a Resumen tiene su propia key: el SVG se vuelve a montar y la
  // animación empieza de nuevo. En las demás pestañas se queda quieto.
  const onHome = location.pathname === '/';
  const playKey = onHome ? location.key : 'quieto';

  return (
    <svg
      key={playKey}
      viewBox="0 0 24 24"
      className={`bt-logo ${onHome ? '' : 'bt-logo--static'} ${className ?? ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline className="bt-logo-line" points="2 17 8.5 10.5 13.5 15.5 22 7" pathLength={1} />
      <polyline className="bt-logo-head" points="16 7 22 7 22 13" pathLength={1} />
    </svg>
  );
};

export default AnimatedLogo;
