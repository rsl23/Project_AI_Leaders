import React from "react";

const CharacterTooltip = ({ info, visible }) => {
  if (!visible || !info) return null;

  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-black/95 border-2 border-[#d4af37] rounded-lg p-4 shadow-2xl z-50 pointer-events-none">
      {/* Character Name */}
      <h3
        className="text-[#d4af37] text-lg font-bold mb-2 text-center border-b border-[#d4af37]/50 pb-2"
        style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
      >
        {info.name}
      </h3>

      {/* Description */}
      <div className="mb-3">
        <p className="text-white text-xs leading-relaxed">{info.description}</p>
      </div>

      {/* Triangle pointer - Left side */}
      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#d4af37]"></div>
    </div>
  );
};

export default CharacterTooltip;
