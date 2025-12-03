import React, { useRef, useEffect, useState } from "react";
import CharacterTooltip from "./CharacterTooltip";
import { characterInfo } from "../data/characterInfo";

const ORIGINAL_WIDTH = 2126;
const ORIGINAL_HEIGHT = 2455;

const GameBoard = ({
  placedCards,
  selectedCard,
  selectedCharacter,
  turn,
  gamePhase,
  onPositionClick,
  recruitmentPhase,
  activeAbilityUsed,
}) => {
  const boardRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [hoveredPosition, setHoveredPosition] = useState(null);

  // === DEFINE SPECIAL POSITIONS ===

  // King's starting positions (tempat awal Raja) - GOLDEN CROWN
  const kingPositions = {
    player: "hex-4-7",
    enemy: "hex-4-1",
  };

  // Recruitment spaces (lingkaran emas untuk recruit) - GOLDEN CIRCLE
  const recruitmentSpaces = {
    player: [
      "hex-1-4",
      "hex-2-5",
      "hex-3-6",
      "hex-4-7",
      "hex-5-6",
      "hex-6-5",
      "hex-7-4",
    ],
    enemy: [
      "hex-1-1",
      "hex-2-1",
      "hex-3-1",
      "hex-4-1",
      "hex-5-1",
      "hex-6-1",
      "hex-7-1",
    ],
  };

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
    { id: "hex-4-1", x: 125, y: 1160, zone: "enemy" },
    { id: "hex-4-2", x: 475, y: 1160, zone: "neutral" },
    { id: "hex-4-3", x: 825, y: 1160, zone: "neutral" },
    { id: "hex-4-4", x: 1175, y: 1160, zone: "neutral" },
    { id: "hex-4-5", x: 1525, y: 1160, zone: "neutral" },
    { id: "hex-4-6", x: 1875, y: 1160, zone: "neutral" },
    { id: "hex-4-7", x: 2225, y: 1160, zone: "player" },

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

  // === Helper functions ===
  const isKingPosition = (positionId) => {
    return (
      kingPositions.player === positionId || kingPositions.enemy === positionId
    );
  };

  const isRecruitmentSpace = (positionId) => {
    return (
      recruitmentSpaces.player.includes(positionId) ||
      recruitmentSpaces.enemy.includes(positionId)
    );
  };

  const getPositionType = (positionId, hasKing) => {
    // Hanya tandai sebagai "king" jika ada king di posisi tersebut saat ini
    if (hasKing) return "king";
    if (isRecruitmentSpace(positionId)) return "recruitment";
    return "normal";
  };

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
          const positionType = getPositionType(pos.id, cardAtPosition?.isKing);
          const isSelectingRecruitmentPosition =
            recruitmentPhase?.selectingPosition;

          return (
            <div
              key={pos.id}
              className="relative"
              onMouseEnter={() => cardAtPosition && setHoveredPosition(pos.id)}
              onMouseLeave={() => setHoveredPosition(null)}
            >
              <div
                onClick={() => onPositionClick?.(pos)}
                className={`
              absolute w-24 h-24 rounded-full border-4
              flex items-center justify-center transition-all duration-300
              ${
                cardAtPosition
                  ? cardAtPosition.isKing
                    ? "border-yellow-400 bg-yellow-900/60 ring-4 ring-yellow-300"
                    : "border-green-400 bg-green-900/40"
                  : positionType === "king"
                  ? "border-yellow-600 bg-yellow-900/40 ring-2 ring-yellow-500"
                  : positionType === "recruitment"
                  ? "border-amber-400 bg-amber-900/40 ring-2 ring-amber-300"
                  : "border-gray-400 bg-gray-500/10"
              }
              ${
                selectedCard &&
                !cardAtPosition &&
                positionType !== "king" &&
                pos.zone === turn &&
                gamePhase === "placement"
                  ? "animate-pulse ring-2 ring-white cursor-pointer"
                  : ""
              }
              ${
                isSelectingRecruitmentPosition &&
                positionType === "recruitment" &&
                pos.zone === turn &&
                !cardAtPosition
                  ? "animate-pulse ring-4 ring-green-400 bg-green-900/40 cursor-pointer"
                  : ""
              }
              ${
                !cardAtPosition &&
                positionType !== "king" &&
                positionType !== "recruitment"
                  ? "cursor-not-allowed"
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
                  <>
                    <img
                      src={cardAtPosition.cardImage}
                      className={`w-full h-full object-cover rounded-full border-2 ${
                        cardAtPosition.isKing
                          ? "border-yellow-300"
                          : "border-white"
                      }`}
                      style={{ transform: "rotate(-90deg)" }}
                      alt="Character"
                    />

                    {/* Active Ability Icon - Show for Active category characters */}
                    {!cardAtPosition.isKing &&
                      characterInfo[cardAtPosition.cardData.type]?.category ===
                        "Active" && (
                        <div
                          className="absolute -bottom-1 -right-1"
                          style={{
                            transform: "rotate(-90deg)",
                            zIndex: 20,
                          }}
                        >
                          <img
                            src="/activeAbility.png"
                            alt="Active Ability"
                            className={`w-11 h-11 ${
                              activeAbilityUsed?.[cardAtPosition.cardData.type]
                                ? "opacity-40 grayscale"
                                : "opacity-100"
                            }`}
                            title="Active Ability Available"
                          />
                        </div>
                      )}
                  </>
                )}

                {/* HIGHLIGHT SELECTED CHARACTER */}
                {selectedCharacter?.positionId === pos.id && (
                  <div
                    className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse"
                    style={{ transform: "rotate(-90deg)" }}
                  ></div>
                )}
              </div>

              {/* Tooltip - Only show if there's a card at this position */}
              {cardAtPosition && (
                <div
                  className="absolute"
                  style={{
                    left: pos.x * scale.x,
                    top: pos.y * scale.y,
                    transform: "translate(-50%, -50%) rotate(-90deg)",
                    zIndex: 100,
                    pointerEvents: "none",
                  }}
                >
                  <CharacterTooltip
                    info={characterInfo[cardAtPosition.cardData.type]}
                    visible={hoveredPosition === pos.id}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
