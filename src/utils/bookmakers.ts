
export interface BookmakerBrand {
  logo: string;
  color: string;
  textColor: string;
  logoFilter?: string;
}

export const getBookmakerBrand = (name: string): BookmakerBrand => {
  const lowerName = name.toLowerCase().trim();
  
  const brands: Record<string, { logo: string; color: string; textColor: string; logoFilter?: string }> = {
    'bet365': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Bet365_Logo.svg/512px-Bet365_Logo.svg.png',
      color: '#127a5b',
      textColor: '#ffffff'
    },
    'betfair': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Betfair_logo.svg/512px-Betfair_logo.svg.png',
      color: '#ffb80c',
      textColor: '#000000'
    },
    'winamax': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Winamax_logo.svg/512px-Winamax_logo.svg.png',
      color: '#000000',
      textColor: '#e2001a'
    },
    'sportium': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sportium_logo.svg/512px-Sportium_logo.svg.png',
      color: '#dc2626',
      textColor: '#ffffff'
    },
    'bwin': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Bwin_logo.svg/512px-Bwin_logo.svg.png',
      color: '#000000',
      textColor: '#ffffff',
      logoFilter: 'brightness(0) invert(1)'
    },
    'codere': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Codere_logo.svg/512px-Codere_logo.svg.png',
      color: '#1a1a1a',
      textColor: '#008444'
    },
    'luckia': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Luckia_logo.svg/512px-Luckia_logo.svg.png',
      color: '#ff6600',
      textColor: '#ffffff'
    },
    'pokerstars': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/PokerStars_logo.svg/512px-PokerStars_logo.svg.png',
      color: '#000000',
      textColor: '#ffffff',
      logoFilter: 'invert(1) brightness(2)'
    },
    '888sport': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/888sport_logo.svg/512px-888sport_logo.svg.png',
      color: '#000000',
      textColor: '#ff6600'
    },
    'william hill': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/William_Hill_logo.svg/512px-William_Hill_logo.svg.png',
      color: '#001e38',
      textColor: '#ffffff'
    },
    'marca apuestas': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Marca_logo.svg/512px-Marca_logo.svg.png',
      color: '#e2001a',
      textColor: '#ffffff'
    },
    'betway': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Betway_logo.svg/512px-Betway_logo.svg.png',
      color: '#000000',
      textColor: '#ffffff',
      logoFilter: 'invert(1) brightness(2)'
    },
    'admiralbet': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Admiral_Logo.svg/512px-Admiral_Logo.svg.png',
      color: '#003876',
      textColor: '#ffffff'
    },
    'betsson': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Betsson_logo.svg/512px-Betsson_logo.svg.png',
      color: '#ff6600',
      textColor: '#ffffff'
    },
    'goldenpark': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/GoldenPark_logo.svg/512px-GoldenPark_logo.svg.png',
      color: '#ff00ff',
      textColor: '#ffffff'
    },
    'interwetten': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Interwetten_logo.svg/512px-Interwetten_logo.svg.png',
      color: '#ffff00',
      textColor: '#000000'
    },
    'kirolbet': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kirolbet_logo.svg/512px-Kirolbet_logo.svg.png',
      color: '#ffffff',
      textColor: '#000000'
    },
    'leovegas': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/LeoVegas_logo.svg/512px-LeoVegas_logo.svg.png',
      color: '#ff6600',
      textColor: '#ffffff'
    },
    'paston': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Paston_logo.svg/512px-Paston_logo.svg.png',
      color: '#ffffff',
      textColor: '#00bfff'
    },
    'versus': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Versus_logo.svg/512px-Versus_logo.svg.png',
      color: '#000000',
      textColor: '#40e0d0',
      logoFilter: 'invert(1) brightness(2)'
    },
    'retabet': {
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Retabet_logo.svg/512px-Retabet_logo.svg.png',
      color: '#000000',
      textColor: '#ffffff',
      logoFilter: 'invert(1) brightness(2)'
    }
  };

  if (brands[lowerName]) return brands[lowerName];

  // Fallback to Google Favicon (more reliable than Clearbit)
  const domain = `${lowerName.replace(/\s+/g, '')}.es`;
  return {
    logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    color: '#18181b',
    textColor: '#ffffff'
  };
};

export const getBookmakerIcon = (name: string): string => {
  return getBookmakerBrand(name).logo;
};

export const getFallbackIcon = (name: string): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111&color=fff&bold=true`;
};
