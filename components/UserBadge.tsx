import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { User } from '../types';

/**
 * Símbolo del usuario: insignia dorada "PRO" con corona para los usuarios PRO;
 * el escudo de siempre para el resto.
 */
const UserBadge: React.FC<{ plan?: User['plan']; size?: number; className?: string }> = ({ plan, size = 20, className }) => {
  if (plan !== 'PRO') return <ShieldCheck size={size} className={className} />;

  return (
    <svg viewBox="0 0 32 32" width={size * 1.3} height={size * 1.3} className={className} role="img" aria-label="Usuario PRO">
      <defs>
        <linearGradient id="pro-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.55" stopColor="#ffcc00" />
          <stop offset="1" stopColor="#d99a00" />
        </linearGradient>
      </defs>
      {/* Corona */}
      <path d="M9 11.5l2.6-5 4.4 3.6 4.4-3.6 2.6 5z" fill="url(#pro-gold)" stroke="#8a6200" strokeWidth=".6" strokeLinejoin="round" />
      <circle cx="11.6" cy="6.3" r="1.1" fill="#ffe27a" />
      <circle cx="16" cy="5" r="1.1" fill="#ffe27a" />
      <circle cx="20.4" cy="6.3" r="1.1" fill="#ffe27a" />
      {/* Placa PRO */}
      <rect x="3.5" y="12.5" width="25" height="13" rx="4" fill="url(#pro-gold)" stroke="#8a6200" strokeWidth=".6" />
      <text x="16" y="22.4" textAnchor="middle" fontFamily="'Plus Jakarta Sans', 'Arial Black', sans-serif" fontWeight={800} fontSize="9.5" fill="#1a1205" letterSpacing=".4">
        PRO
      </text>
    </svg>
  );
};

export default UserBadge;
