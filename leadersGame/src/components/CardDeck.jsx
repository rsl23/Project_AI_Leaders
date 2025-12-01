import React from "react";

const CardDeck = ({ availableCards = [], onCardSelect, selectedCard, deckCount = 0, disabled = false }) => {
  const cardTypeMap = {
    acrobate: "Acrobate",
    archer: "Archer",
    assassin: "Assassin",
    cavalier: "Cavalier",
    cogneur: "Cogneur",
    gardeRoyal: "GardeRoyal",
    geolier: "Geolier",
    illusionist: "Illusionist",
    lanceGrappin: "LanceGrappin",
    manipulator: "Manipulator",
    nemesis: "Nemesis",
    oldBear: "VieilOurs",
    protector: "Protector",
    rodeuse: "Rodeuse",
    tavernier: "Tavernier",
    vizir: "Vizir"
  };
  // ...

  return (
    <div className={`flex gap-5 items-center ${disabled ? 'opacity-50' : ''}`}>
      <div className="w-32 h-60 rounded-xl overflow-hidden shadow-2xl">
        <img
          src="bg-card.jpg"
          alt="Deck Background"
          className="w-full h-full object-cover rounded-xl"
        />
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