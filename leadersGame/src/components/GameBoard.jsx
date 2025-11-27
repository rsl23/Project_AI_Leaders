import React, { useRef, useEffect, useState } from "react";

const ORIGINAL_WIDTH = 2126;
const ORIGINAL_HEIGHT = 2455;

const GameBoard = ({
  placedCards,
  selectedCard,
  turn,
  gamePhase,
  onPositionClick,
}) => {
  const boardRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // === POSISI ARENA ASLI DALAM PIXEL (AKURAT BERDASARKAN GAMBAR) ===
  const boardPositions = [
    // BARIS 1 (4)
    { id: "hex-1-1", x: 650, y: 320, zone: "enemy" },
    { id: "hex-1-2", x: 1000, y: 320, zone: "neutral" },
    { id: "hex-1-3", x: 1350, y: 320, zone: "neutral" },
    { id: "hex-1-4", x: 1700, y: 320, zone: "player" },

    // BARIS 2 (5)
    { id: "hex-2-1", x: 475, y: 600, zone: "enemy" },
    { id: "hex-2-2", x: 825, y: 600, zone: "neutral" },
    { id: "hex-2-3", x: 1175, y: 600, zone: "neutral" },
    { id: "hex-2-4", x: 1525, y: 600, zone: "neutral" },
    { id: "hex-2-5", x: 1875, y: 600, zone: "player" },

    // BARIS 3 (6)
    { id: "hex-3-1", x: 300, y: 880, zone: "enemy" },
    { id: "hex-3-2", x: 650, y: 880, zone: "neutral" },
    { id: "hex-3-3", x: 1000, y: 880, zone: "neutral" },
    { id: "hex-3-4", x: 1350, y: 880, zone: "neutral" },
    { id: "hex-3-5", x: 1700, y: 880, zone: "neutral" },
    { id: "hex-3-6", x: 2050, y: 880, zone: "player" },

    // BARIS 4 (7) - TENGAH
    { id: "hex-4-1", x: 125, y: 1160, zone: "enemy", place: "king" },
    { id: "hex-4-2", x: 475, y: 1160, zone: "neutral" },
    { id: "hex-4-3", x: 825, y: 1160, zone: "neutral" },
    { id: "hex-4-4", x: 1175, y: 1160, zone: "neutral" },
    { id: "hex-4-5", x: 1525, y: 1160, zone: "neutral" },
    { id: "hex-4-6", x: 1875, y: 1160, zone: "neutral" },
    { id: "hex-4-7", x: 2225, y: 1160, zone: "player", place: "king" },

    // BARIS 5 (6)
    { id: "hex-5-1", x: 300, y: 1440, zone: "enemy" },
    { id: "hex-5-2", x: 650, y: 1440, zone: "neutral" },
    { id: "hex-5-3", x: 1000, y: 1440, zone: "neutral" },
    { id: "hex-5-4", x: 1350, y: 1440, zone: "neutral" },
    { id: "hex-5-5", x: 1700, y: 1440, zone: "neutral" },
    { id: "hex-5-6", x: 2050, y: 1440, zone: "player" },

    // BARIS 6 (5)
    { id: "hex-6-1", x: 475, y: 1720, zone: "enemy" },
    { id: "hex-6-2", x: 825, y: 1720, zone: "neutral" },
    { id: "hex-6-3", x: 1175, y: 1720, zone: "neutral" },
    { id: "hex-6-4", x: 1525, y: 1720, zone: "neutral" },
    { id: "hex-6-5", x: 1875, y: 1720, zone: "player" },

    // BARIS 7 (4)
    { id: "hex-7-1", x: 650, y: 2000, zone: "enemy" },
    { id: "hex-7-2", x: 1000, y: 2000, zone: "neutral" },
    { id: "hex-7-3", x: 1350, y: 2000, zone: "neutral" },
    { id: "hex-7-4", x: 1700, y: 2000, zone: "player" },
  ];

  // === Hitung scale tiap kali board resize ===
  useEffect(() => {
    const updateScale = () => {
      if (!boardRef.current) return;
      const width = boardRef.current.clientWidth;
      const height = boardRef.current.clientHeight;

      setScale({
        x: width / ORIGINAL_WIDTH,
        y: height / ORIGINAL_HEIGHT,
      });
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="relative inline-block max-w-2xl">
      <img
        ref={boardRef}
        src="/Assets/Leaders_Board.png"
        alt="Leaders Game Board"
        className="w-full h-auto select-none"
        style={{ opacity: 0 }}
      />

      {/* Container untuk Lingkaran dengan Rotate */}
      <div
        className="absolute inset-0"
        style={{
          transform: "translateX(-35px) translateY(-5%) rotate(90deg)",
          transformOrigin: "center center",
        }}
      >
        {boardPositions.map((pos) => {
          const cardAtPosition = placedCards?.find(
            (p) => p.positionId === pos.id
          );

          return (
            <div
              key={pos.id}
              onClick={() => onPositionClick?.(pos)}
              className={`
              absolute w-24 h-24 rounded-full border-4
              flex items-center justify-center transition-all duration-300
              ${
                cardAtPosition
                  ? cardAtPosition.isKing
                    ? "border-yellow-400 bg-yellow-900/60 ring-4 ring-yellow-300"
                    : "border-green-400 bg-green-900/40"
                  : pos.place === "king"
                  ? "border-gray-600 bg-gray-800/40 cursor-not-allowed"
                  : pos.zone === turn && gamePhase === "placement"
                  ? "border-blue-400 bg-blue-500/20 hover:bg-blue-500/40 cursor-pointer"
                  : "border-gray-400 bg-gray-500/10 cursor-not-allowed"
              }
              ${
                selectedCard &&
                !cardAtPosition &&
                pos.place !== "king" &&
                pos.zone === turn &&
                gamePhase === "placement"
                  ? "animate-pulse ring-2 ring-white"
                  : ""
              }
            `}
              style={{
                left: pos.x * scale.x,
                top: pos.y * scale.y,
                transform: "translate(-50%, -50%)",
                zIndex: cardAtPosition?.isKing ? 15 : 10,
              }}
            >
              {/* CARD IMAGE - Counter-rotate agar tidak ikut rotate */}
              {cardAtPosition && (
                <img
                  src={cardAtPosition.cardImage}
                  className={`w-full h-full object-cover rounded-full border-2 ${
                    cardAtPosition.isKing ? "border-yellow-300" : "border-white"
                  }`}
                  style={{ transform: "rotate(-90deg)" }}
                  alt="Character"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
