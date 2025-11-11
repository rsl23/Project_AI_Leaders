import React from "react";

const GameInfo = () => {
  return (
    <div className="bg-black/80 backdrop-blur-md border-2 border-[#d4af37]/50 rounded-xl p-5 min-w-[250px] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="mb-5">
        <h3
          className="text-[#d4af37] text-xl font-bold mb-3 text-center tracking-wider"
          style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
        >
          Player 1
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">
              Leader:
            </span>
            <span className="text-white font-bold text-sm">Active</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">Cards:</span>
            <span className="text-white font-bold text-sm">3</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent my-4"></div>

      <div className="mb-5">
        <h3
          className="text-[#d4af37] text-xl font-bold mb-3 text-center tracking-wider"
          style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
        >
          Player 2
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">
              Leader:
            </span>
            <span className="text-white font-bold text-sm">Active</span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">Cards:</span>
            <span className="text-white font-bold text-sm">3</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent my-4"></div>

      <div>
        <h3
          className="text-[#d4af37] text-xl font-bold mb-3 text-center tracking-wider"
          style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
        >
          Turn
        </h3>
        <div className="text-center">
          <div
            className="text-5xl font-bold text-[#ffd700] mb-2"
            style={{ textShadow: "0 0 15px rgba(255, 215, 0, 0.6)" }}
          >
            1
          </div>
          <div
            className="text-[#d4af37] text-base font-semibold"
            style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)" }}
          >
            Player 1's Turn
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
