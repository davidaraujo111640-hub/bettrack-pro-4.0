import React from 'react';

export const getSportIcon = (sport: string): React.ReactNode => {
  const containerClass = "flex items-center justify-center w-full h-full transition-transform duration-500 group-hover:scale-110 drop-shadow-md";
  
  switch (sport) {
    case 'Fútbol': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em] drop-shadow-xl">
          <defs>
            <radialGradient id="ballBase" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>
            <radialGradient id="panelGloss" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Main Sphere */}
          <circle cx="12" cy="12" r="10" fill="url(#ballBase)" />
          
          {/* Panel Geometry - 3D Perspective */}
          <g fill="url(#panelGloss)" stroke="#0f172a" strokeWidth="0.1">
            {/* Center Pentagon */}
            <path d="M12 8.5l2.5 1.8-.9 3h-3.2l-.9-3z" />
            {/* Top Panel */}
            <path d="M10 3.5c1-0.5 3-0.5 4 0l1 2.5-3 1.5-3-1.5z" />
            {/* Right Panels */}
            <path d="M17.5 7.5l2 2.5-1.5 3.5-3.5-1.5 0.5-3z" />
            <path d="M16 16.5l2.5-1.5 1-3.5-3.5 1.5-1.5 3z" />
            {/* Left Panels */}
            <path d="M6.5 7.5l-2 2.5 1.5 3.5 3.5-1.5-0.5-3z" />
            <path d="M8 16.5l-2.5-1.5-1-3.5 3.5 1.5 1.5 3z" />
            {/* Bottom Panel */}
            <path d="M10 20.5c1 0.5 3 0.5 4 0l1.5-2.5-3.5-1.5-3.5 1.5z" />
          </g>

          {/* Stitching/Grooves */}
          <g stroke="#94a3b8" strokeWidth="0.15" fill="none" opacity="0.4">
            <path d="M12 8.5V6M14.5 10.3l2.5-1.5M13.6 13.3l1.9 2.2M10.4 13.3l-1.9 2.2M9.5 10.3l-2.5-1.5" />
          </g>

          {/* Surface Shine */}
          <ellipse cx="8" cy="7" rx="4" ry="2.5" fill="#fff" opacity="0.4" transform="rotate(-35 8 7)" filter="url(#softGlow)" />
          <circle cx="16" cy="16" r="1.5" fill="#fff" opacity="0.1" />
        </svg>
      </div>
    );
    case 'Baloncesto': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <radialGradient id="basketGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#basketGradient)" />
          <path d="M12 2v20M2 12h20" stroke="#111" strokeWidth="0.8" opacity="0.6" />
          <path d="M5 5c3 3 3 11 0 14M19 5c-3 3-3 11 0 14" stroke="#111" strokeWidth="0.8" fill="none" opacity="0.6" />
          <circle cx="8" cy="8" r="2" fill="#fff" opacity="0.2" filter="blur(1px)" />
        </svg>
      </div>
    );
    case 'Tenis': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <radialGradient id="tennisGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#eefd6d" />
              <stop offset="60%" stopColor="#d4f01e" />
              <stop offset="100%" stopColor="#a3b817" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#tennisGradient)" />
          <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7M5 12c0 3.866 3.134 7 7 7s7-3.134 7-7" stroke="#fff" strokeWidth="1.2" fill="none" strokeDasharray="1 1" opacity="0.5" />
          <path d="M4.5 9.5c2 0 4 2.5 4 4.5M19.5 9.5c-2 0-4 2.5-4 4.5" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.8" />
          <circle cx="8" cy="8" r="2" fill="#fff" opacity="0.3" filter="blur(1px)" />
        </svg>
      </div>
    );
    case 'eSports': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="gameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <rect x="2" y="6" width="20" height="12" rx="3" fill="url(#gameGradient)" />
          <circle cx="7" cy="12" r="2" fill="#fff" opacity="0.3" />
          <circle cx="17" cy="10" r="1" fill="#fff" />
          <circle cx="17" cy="14" r="1" fill="#fff" />
          <circle cx="15" cy="12" r="1" fill="#fff" />
          <circle cx="19" cy="12" r="1" fill="#fff" />
          <path d="M6 12h2M7 11v2" stroke="#fff" strokeWidth="1" opacity="0.8" />
        </svg>
      </div>
    );
    case 'MMA': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="ufcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#ufcGradient)" />
          <text x="12" y="15" fontFamily="Arial Black, sans-serif" fontSize="8" fill="white" textAnchor="middle" fontWeight="900">UFC</text>
        </svg>
      </div>
    );
    case 'Boxeo': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="koGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          {/* Comic burst background */}
          <path d="M12 2l2 4 5-1-2 5 5 2-5 2 2 5-5-1-2 4-2-4-5 1 2-5-5-2 5-2-2-5 5 1z" fill="url(#koGradient)" />
          {/* K.O.! Text */}
          <text x="12" y="15" fontFamily="Arial Black, sans-serif" fontSize="7" fill="white" textAnchor="middle" fontWeight="900" style={{ filter: 'drop-shadow(1px 1px 0px rgba(0,0,0,0.5))' }}>K.O.!</text>
        </svg>
      </div>
    );
    case 'NFL': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <radialGradient id="nflGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
          </defs>
          <path d="M12 2C7 2 2 7 2 12s5 10 10 10 10-5 10-10S17 2 12 2z" fill="url(#nflGradient)" transform="rotate(-45 12 12) scale(1.2 0.7)" />
          <path d="M12 6v12M9 9h6M9 12h6M9 15h6" stroke="#fff" strokeWidth="1" opacity="0.8" />
          <circle cx="10" cy="10" r="1.5" fill="#fff" opacity="0.1" filter="blur(1px)" />
        </svg>
      </div>
    );
    case 'Béisbol': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <radialGradient id="baseballGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#baseballGradient)" stroke="#e5e7eb" strokeWidth="0.5" />
          <path d="M5 12c0-3.866 3.134-7 7-7M5 12c0 3.866 3.134 7 7 7M19 12c0-3.866-3.134-7-7-7M19 12c0 3.866-3.134 7-7 7" stroke="#ef4444" strokeWidth="1.2" fill="none" strokeDasharray="2 1" opacity="0.6" />
        </svg>
      </div>
    );
    case 'Ciclismo': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <circle cx="5.5" cy="17.5" r="3.5" stroke="#4b5563" strokeWidth="1.5" fill="#f3f4f6" />
          <circle cx="18.5" cy="17.5" r="3.5" stroke="#4b5563" strokeWidth="1.5" fill="#f3f4f6" />
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 17.5l2-4M18.5 17.5l-2-4" stroke="#4b5563" strokeWidth="1" />
        </svg>
      </div>
    );
    case 'F1': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="f1Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          {/* F1 Car Body */}
          <path d="M12 4l-2 4v8l2 4 2-4V8l-2-4z" fill="url(#f1Gradient)" />
          {/* Front Wing */}
          <path d="M7 6h10v2H7z" fill="#1e293b" />
          {/* Rear Wing */}
          <path d="M8 18h8v2H8z" fill="#1e293b" />
          {/* Wheels */}
          <rect x="6" y="7" width="2" height="3" rx="0.5" fill="#111" />
          <rect x="16" y="7" width="2" height="3" rx="0.5" fill="#111" />
          <rect x="5" y="16" width="3" height="4" rx="0.5" fill="#111" />
          <rect x="16" y="16" width="3" height="4" rx="0.5" fill="#111" />
          {/* Cockpit */}
          <circle cx="12" cy="11" r="1.5" fill="#111" />
        </svg>
      </div>
    );
    case 'MotoGP': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="motogpLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
          {/* Stylized MotoGP 'M' / Flag */}
          <path d="M4 6h16v4H4z" fill="#111" />
          <path d="M4 10h16v4H4z" fill="#fff" opacity="0.1" />
          <path d="M4 14h16v4H4z" fill="#111" />
          {/* Checkered pattern overlay */}
          <path d="M4 6h4v4H4zM12 6h4v4h-4zM8 10h4v4H8zM16 10h4v4h-4zM4 14h4v4H4zM12 14h4v4h-4z" fill="#fff" opacity="0.2" />
          {/* Red Accent Stripe (Moved to side to not cross text) */}
          <path d="M2 4v16" stroke="url(#motogpLogoGradient)" strokeWidth="2" strokeLinecap="round" />
          <text x="12" y="14" fontFamily="Arial Black, sans-serif" fontSize="5" fill="white" textAnchor="middle" fontWeight="900" style={{ letterSpacing: '0.5px' }}>MOTO</text>
          <text x="12" y="19" fontFamily="Arial Black, sans-serif" fontSize="5" fill="#ef4444" textAnchor="middle" fontWeight="900" style={{ letterSpacing: '0.5px' }}>GP</text>
        </svg>
      </div>
    );
    case 'Caballos': return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="legGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          {/* First Leg (slightly behind) */}
          <g transform="translate(-3, 0) scale(0.9)">
            <path d="M10 2l1 8-1 6 1 3h4l1-3-1-6 1-8h-6z" fill="url(#legGradient)" opacity="0.6" />
            <path d="M10 19h6v3c0 1-1 1-1 1h-4s-1 0-1-1v-3z" fill="#000" opacity="0.6" />
          </g>
          {/* Second Leg (front) */}
          <g transform="translate(3, 1)">
            <path d="M10 2l1 8-1 6 1 3h4l1-3-1-6 1-8h-6z" fill="url(#legGradient)" />
            <path d="M10 19h6v3c0 1-1 1-1 1h-4s-1 0-1-1v-3z" fill="#1a1a1a" />
            <path d="M10 19c0-1 1-2 3-2s3 1 3 2" fill="url(#legGradient)" opacity="0.7" />
            <path d="M13 3v10" stroke="#fff" strokeWidth="0.5" opacity="0.1" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    );
    default: return (
      <div className={containerClass}>
        <svg viewBox="0 0 24 24" className="w-[1.2em] h-[1.2em]">
          <defs>
            <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <path d="M6 4h12v2l-2 2v4c0 2.2-1.8 4-4 4s-4-1.8-4-4V8L6 6V4z" fill="url(#trophyGradient)" />
          <path d="M10 16v4h-2v2h8v-2h-2v-4" stroke="#d97706" strokeWidth="1" fill="none" />
          <path d="M6 6c-1 0-2 1-2 2s1 2 2 2M18 6c1 0 2 1 2 2s-1 2-2 2" stroke="#fcd34d" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    );
  }
};
