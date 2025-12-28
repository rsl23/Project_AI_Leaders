import React from "react";

const GameInfo = ({ placedCards, turn, playerColor, enemyColor }) => {
  // Filter karakter untuk masing-masing player (exclude king dan ourson untuk count dan display)
  const playerCards =
    placedCards?.filter(
      (card) => card.owner === "player" && !card.isKing && !card.isOurson
    ) || [];
  const enemyCards =
    placedCards?.filter(
      (card) => card.owner === "enemy" && !card.isKing && !card.isOurson
    ) || [];

  // Max selalu 4 (VieilOurs + Ourson dihitung 1)
  const playerMaxChars = 4;
  const enemyMaxChars = 4;

  // Get king cards
  const playerKing = placedCards?.find(
    (card) => card.owner === "player" && card.isKing
  );
  const enemyKing = placedCards?.find(
    (card) => card.owner === "enemy" && card.isKing
  );

  // Mapping dari type ke card image path
  const getCardImagePath = (type) => {
    const cardMap = {
      Acrobate: "/Composants_2D/Cartes/cartes_acrobate.jpg",
      Archer: "/Composants_2D/Cartes/cartes_archer.jpg",
      Assassin: "/Composants_2D/Cartes/cartes_assassin.jpg",
      Cavalier: "/Composants_2D/Cartes/cartes_cavalier.jpg",
      Cogneur: "/Composants_2D/Cartes/cartes_cogneur.jpg",
      GardeRoyal: "/Composants_2D/Cartes/cartes_gardeRoyal.jpg",
      Geolier: "/Composants_2D/Cartes/cartes_geolier.jpg",
      Illusionist: "/Composants_2D/Cartes/cartes_illusionist.jpg",
      LanceGrappin: "/Composants_2D/Cartes/cartes_lanceGrappin.jpg",
      Manipulator: "/Composants_2D/Cartes/cartes_manipulator.jpg",
      Nemesis: "/Composants_2D/Cartes/cartes_nemesis.jpg",
      VieilOurs: "/Composants_2D/Cartes/cartes_oldBear.jpg",
      Protector: "/Composants_2D/Cartes/cartes_protector.jpg",
      Rodeuse: "/Composants_2D/Cartes/cartes_rodeuse.jpg",
      Tavernier: "/Composants_2D/Cartes/cartes_tavernier.jpg",
      Vizir: "/Composants_2D/Cartes/cartes_vizir.jpg",
    };
    return cardMap[type] || "";
  };

  // Render card deck dengan king di slot pertama + maksimal 4 karakter recruited
  const renderCardDeck = (cards, kingCard, isPlayer) => {
    // Max selalu 4 recruited (VieilOurs + Ourson dihitung 1, dan Ourson tidak tampil)
    const maxRecruitedCards = 4;
    const displayedCards = cards.slice(0, maxRecruitedCards);
    const emptySlots = maxRecruitedCards - displayedCards.length;

    // Tentukan gambar leader card berdasarkan king
    const leaderCardImage =
      kingCard?.cardData.name === "Roi"
        ? "/Composants_2D/Cartes/leaders_Roi.jpg"
        : "/Composants_2D/Cartes/leaders_Reine.jpg";

    return (
      <div className="grid grid-cols-5 gap-1 mt-2">
        {/* King Card - Always first slot, menggunakan gambar dari folder Cartes */}
        <div className="relative w-10 h-14 rounded border-2 border-yellow-400 overflow-hidden shadow-md hover:scale-110 transition-transform ring-2 ring-yellow-300">
          <img
            src={leaderCardImage}
            alt={kingCard?.cardData.name || "Leader"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Recruited Characters - Max 4 atau 5 slots */}
        {displayedCards.map((card, index) => (
          <div
            key={index}
            className="relative w-10 h-14 rounded border-2 border-[#d4af37]/50 overflow-hidden shadow-md hover:scale-110 transition-transform"
          >
            <img
              src={getCardImagePath(card.cardData.type)}
              alt={card.cardData.type}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Empty slots - Fill remaining up to maxRecruitedCards */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-10 h-14 rounded border-2 border-dashed border-[#d4af37]/30 bg-black/30"
          ></div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-black/80 backdrop-blur-md border-2 border-[#d4af37]/50 rounded-xl p-5 min-w-[280px] max-w-[320px] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="mb-5">
        <h3
          className="text-[#d4af37] text-xl font-bold mb-3 text-center tracking-wider"
          style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
        >
          Player {playerColor === "white" ? "⚪" : "⚫"}
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">
              Leader:
            </span>
            <span className="text-white font-bold text-sm">
              {playerColor === "white" ? "Roi" : "Roi"}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">
              Characters:
            </span>
            <span className="text-white font-bold text-sm">
              {playerCards.length}/{playerMaxChars}
            </span>
          </div>
        </div>
        {renderCardDeck(playerCards, playerKing)}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent my-4"></div>

      <div className="mb-5">
        <h3
          className="text-[#d4af37] text-xl font-bold mb-3 text-center tracking-wider"
          style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
        >
          Enemy {enemyColor === "white" ? "⚪" : "⚫"}
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">
              Leader:
            </span>
            <span className="text-white font-bold text-sm">
              {enemyColor === "white" ? "Reine" : "Reine"}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2 bg-[#d4af37]/10 rounded-md border border-[#d4af37]/30">
            <span className="text-[#d4af37] font-semibold text-sm">
              Characters:
            </span>
            <span className="text-white font-bold text-sm">
              {enemyCards.length}/{enemyMaxChars}
            </span>
          </div>
        </div>
        {renderCardDeck(enemyCards, enemyKing)}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent my-4"></div>

      <div>
        <h3
          className="text-[#d4af37] text-xl font-bold mb-3 text-center tracking-wider"
          style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.5)" }}
        >
          Current Turn
        </h3>
        <div className="text-center">
          <div
            className="text-[#d4af37] text-base font-semibold"
            style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)" }}
          >
            {turn === "player"
              ? `Player ${playerColor === "white" ? "⚪" : "⚫"}`
              : `Enemy ${enemyColor === "white" ? "⚪" : "⚫"}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
