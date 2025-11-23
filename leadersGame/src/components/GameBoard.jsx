import React, { useRef, useEffect, useState } from "react";

const ORIGINAL_WIDTH = 2126;
const ORIGINAL_HEIGHT = 2455;

const GameBoard = ({ placedCards, selectedCard, onPositionClick }) => {
  const boardRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  // === POSISI ARENA ASLI DALAM PIXEL (AKURAT BERDASARKAN GAMBAR) ===
  const boardPositions = [
    // BARIS 1 (4)
    { id: "hex-1-1", x: 650, y: 320 },
    { id: "hex-1-2", x: 1000, y: 320 },
    { id: "hex-1-3", x: 1350, y: 320 },
    { id: "hex-1-4", x: 1700, y: 320 },

    // BARIS 2 (5)
    { id: "hex-2-1", x: 475, y: 600 },
    { id: "hex-2-2", x: 825, y: 600 },
    { id: "hex-2-3", x: 1175, y: 600 },
    { id: "hex-2-4", x: 1525, y: 600 },
    { id: "hex-2-5", x: 1875, y: 600 },

    // BARIS 3 (6)
    { id: "hex-3-1", x: 300, y: 880 },
    { id: "hex-3-2", x: 650, y: 880 },
    { id: "hex-3-3", x: 1000, y: 880 },
    { id: "hex-3-4", x: 1350, y: 880 },
    { id: "hex-3-5", x: 1700, y: 880 },
    { id: "hex-3-6", x: 2050, y: 880 },

    // BARIS 4 (7) - TENGAH
    { id: "hex-4-1", x: 125, y: 1160 },
    { id: "hex-4-2", x: 475, y: 1160 },
    { id: "hex-4-3", x: 825, y: 1160 },
    { id: "hex-4-4", x: 1175, y: 1160 },
    { id: "hex-4-5", x: 1525, y: 1160 },
    { id: "hex-4-6", x: 1875, y: 1160 },
    { id: "hex-4-7", x: 2225, y: 1160 },

    // BARIS 5 (6)
    { id: "hex-5-1", x: 300, y: 1440 },
    { id: "hex-5-2", x: 650, y: 1440 },
    { id: "hex-5-3", x: 1000, y: 1440 },
    { id: "hex-5-4", x: 1350, y: 1440 },
    { id: "hex-5-5", x: 1700, y: 1440 },
    { id: "hex-5-6", x: 2050, y: 1440 },

    // BARIS 6 (5)
    { id: "hex-6-1", x: 475, y: 1720 },
    { id: "hex-6-2", x: 825, y: 1720 },
    { id: "hex-6-3", x: 1175, y: 1720 },
    { id: "hex-6-4", x: 1525, y: 1720 },
    { id: "hex-6-5", x: 1875, y: 1720 },

    // BARIS 7 (4)
    { id: "hex-7-1", x: 650, y: 2000 },
    { id: "hex-7-2", x: 1000, y: 2000 },
    { id: "hex-7-3", x: 1350, y: 2000 },
    { id: "hex-7-4", x: 1700, y: 2000 },
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
              flex items-center justify-center transition-all duration-300 bg-amber-100
              ${
                cardAtPosition
                  ? "border-green-400"
                  : "border-yellow-500 hover:bg-yellow-500/40 cursor-pointer"
              }
              ${selectedCard && !cardAtPosition ? "animate-pulse" : ""}
            `}
              style={{
                left: pos.x * scale.x,
                top: pos.y * scale.y,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              {/* CARD IMAGE */}
              {cardAtPosition && (
                <img
                  src={cardAtPosition.cardImage}
                  className="w-full h-full object-cover rounded-full border-2 border-white"
                />
              )}

              {/* titik kecil jika kosong */}
              {/* {!cardAtPosition && (
              <div className="w-4 h-4 rounded-full bg-yellow-300"></div>
            )} */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
