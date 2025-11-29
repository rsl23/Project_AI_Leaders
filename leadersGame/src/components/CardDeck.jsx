import React from "react";

const CardDeck = ({ availableCards = [], onCardSelect, selectedCard, deckCount = 0, disabled = false }) => {
  const cardTypeMap = {
    acrobate: "Acrobate",
    assassin: "Assassin",
    gardeRoyal: "GardeRoyal",
    geolier: "Geolier",
    lanceGrappin: "LanceGrappin",
    oldBear: "VieilOurs",
    tavernier: "Tavernier",
    vizir: "Vizir",
  };

  return (
    <div className={`flex gap-5 items-center ${disabled ? 'opacity-50' : ''}`}>
      {/* Deck Stack (Tumpukan Kartu) - KIRI */}
      <div className="relative w-32 h-48">
        <div className="absolute bottom-2 -left-2 w-full h-full bg-gradient-to-br from-[#2c1810] to-[#1a0f08] border-4 border-[#8b4513] rounded-xl shadow-lg opacity-60 z-10"></div>
        <div className="absolute bottom-1 -left-1 w-full h-full bg-gradient-to-br from-[#2c1810] to-[#1a0f08] border-4 border-[#8b4513] rounded-xl shadow-lg opacity-80 z-20"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-[#2c1810] to-[#1a0f08] border-4 border-[#8b4513] rounded-xl shadow-2xl flex items-center justify-center z-30">
          <div
            className="text-5xl font-bold text-[#d4af37]"
            style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
          >
            {deckCount}
          </div>
        </div>
      </div>

      {/* Drawn Cards (3 Kartu yang Keluar) - KANAN */}
      <div className="flex flex-col gap-4 items-center">
        {availableCards.map((card, index) => {
          const rawType = card.image.split("/").pop().split("_")[1].split(".")[0];
          const characterType = cardTypeMap[rawType] || rawType;

          return (
            <div
              key={index}
              onClick={() => {
                if (!disabled) {
                  onCardSelect?.({
                    image: card.image,
                    type: characterType,
                  });
                }
              }}
              className={`w-32 h-60 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_12px_24px_rgba(212,175,55,0.4)] cursor-pointer animate-slideIn
                ${selectedCard?.image === card.image
                  ? "ring-4 ring-yellow-400 scale-105"
                  : ""
                }
                ${disabled ? 'cursor-not-allowed hover:transform-none hover:shadow-2xl' : ''}
              `}
              style={{
                animationDelay: `${index * 0.2}s`,
                animationFillMode: "both",
              }}
            >
              <img
                src={card.image}
                alt={`Card ${characterType}`}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardDeck;