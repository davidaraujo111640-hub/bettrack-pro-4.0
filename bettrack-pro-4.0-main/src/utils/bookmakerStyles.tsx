
import React from 'react';

export const renderBookmakerName = (name: string) => {
  const lowerName = name.toLowerCase().trim();

  if (lowerName.includes('admiralbet')) {
    return (
      <>
        <span>ADMIRAL</span>
        <span style={{ color: '#ffc600' }}>BET</span>
      </>
    );
  }

  if (lowerName.includes('bet365')) {
    return (
      <>
        <span>BET</span>
        <span style={{ color: '#ffc600' }}>365</span>
      </>
    );
  }

  if (lowerName.includes('bwin')) {
    return (
      <span className="lowercase text-[13px] font-black">
        bw<span style={{ color: '#facc15' }}>i</span>n
      </span>
    );
  }

  if (lowerName.includes('interwetten')) {
    return (
      <div className="border border-black px-1 py-0.5 flex flex-col items-center leading-[0.8] lowercase">
        <span className="text-[9px]">inter</span>
        <span className="text-[9px]">wetten</span>
      </div>
    );
  }

  if (lowerName.includes('kirolbet')) {
    return (
      <div className="flex items-center">
        <span style={{ color: '#000000' }}>KIROL</span>
        <span className="bg-[#ff6600] text-white px-0.5 ml-0.5 rounded-sm">BET</span>
      </div>
    );
  }

  if (lowerName.includes('leovegas')) {
    return (
      <span style={{ 
        color: '#ffffff',
        textShadow: '1px 1px 0 #5d4037, -1px -1px 0 #5d4037, 1px -1px 0 #5d4037, -1px 1px 0 #5d4037'
      }}>
        LEOVEGAS
      </span>
    );
  }

  if (lowerName.includes('retabet')) {
    return (
      <>
        <span>RETA</span>
        <span style={{ color: '#a3e635' }}>BET</span>
      </>
    );
  }

  if (lowerName.includes('888sport')) {
    return <span style={{ color: '#ff6600' }}>888SPORT</span>;
  }

  if (lowerName.includes('codere')) {
    return <span style={{ color: '#008444' }} className="font-black text-[12px]">CODERE</span>;
  }

  if (lowerName.includes('winamax')) {
    return <span style={{ color: '#e2001a' }}>WINAMAX</span>;
  }

  if (lowerName.includes('betway')) {
    return <span className="font-bold">BETWAY</span>;
  }

  if (lowerName.includes('versus')) {
    return <span style={{ color: '#40e0d0' }}>VERSUS</span>;
  }

  if (lowerName.includes('luckia')) {
    return (
      <div className="flex items-center gap-1">
        <div className="relative w-3 h-3 flex items-center justify-center">
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#ff6600] translate-y-[-2px]"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#ffcc00] translate-x-[2px]"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#00cc00] translate-y-[2px]"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#0099ff] translate-x-[-2px]"></div>
        </div>
        <span>LUCKIA</span>
      </div>
    );
  }

  if (lowerName.includes('pokerstars')) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 relative">
          <div className="absolute inset-0 bg-red-600 rotate-45 rounded-sm"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">★</div>
        </div>
        <span>POKERSTARS</span>
      </div>
    );
  }

  return <span>{name}</span>;
};
