import React, { useEffect, useRef, useState } from "react";
import MuteButton from "./MuteButton";
import CardDeck from "./CardDeck";
import GameInfo from "./GameInfo";
import GameBoard from "./GameBoard";

const Arena = () => {
  const audioRef = useRef(null);

  // === GAME STATE ===
  const [gamePhase, setGamePhase] = useState("placement");
  const [firstTurn, setFirstTurn] = useState(null);
  const [turn, setTurn] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [placedCards, setPlacedCards] = useState([]);
  const [playerColor, setPlayerColor] = useState(null);
  const [enemyColor, setEnemyColor] = useState(null);

  // === DECK STATE ===
  const [availableCards, setAvailableCards] = useState([]);
  const [deck, setDeck] = useState([]);

  // === BATTLE STATE ===
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterActions, setCharacterActions] = useState({});
  const [currentPhase, setCurrentPhase] = useState("action"); // "action" | "recruitment"

  // === INITIALIZE DECK ===
  useEffect(() => {
    const allCards = [
      { type: "Acrobate", image: "/Composants_2D/Cartes/cartes_acrobate.jpg" },
      { type: "Assassin", image: "/Composants_2D/Cartes/cartes_assassin.jpg" },
      { type: "GardeRoyal", image: "/Composants_2D/Cartes/cartes_gardeRoyal.jpg" },
      { type: "Geolier", image: "/Composants_2D/Cartes/cartes_geolier.jpg" },
      { type: "LanceGrappin", image: "/Composants_2D/Cartes/cartes_lanceGrappin.jpg" },
      { type: "VieilOurs", image: "/Composants_2D/Cartes/cartes_oldBear.jpg" },
      { type: "Tavernier", image: "/Composants_2D/Cartes/cartes_tavernier.jpg" },
      { type: "Vizir", image: "/Composants_2D/Cartes/cartes_vizir.jpg" },
    ];

    const shuffledDeck = [...allCards].sort(() => Math.random() - 0.5);
    setAvailableCards(shuffledDeck.slice(0, 3));
    setDeck(shuffledDeck.slice(3));
  }, []);

  // === INITIALIZE GAME ===
  useEffect(() => {
    const randomFirst = Math.random() < 0.5 ? "player" : "enemy";
    setFirstTurn(randomFirst);
    setTurn(randomFirst);

    if (randomFirst === "player") {
      setPlayerColor("white");
      setEnemyColor("black");
    } else {
      setPlayerColor("black");
      setEnemyColor("white");
    }

    const playerKingImage =
      randomFirst === "player"
        ? "/Assets/Pions_personnages/Blanc/Leaders_BGA_white_LeaderRoi.png"
        : "/Assets/Pions_personnages/Noir/Leaders_BGA_black_LeaderRoi.png";

    const enemyKingImage =
      randomFirst === "enemy"
        ? "/Assets/Pions_personnages/Blanc/Leaders_BGA_white_LeaderReine.png"
        : "/Assets/Pions_personnages/Noir/Leaders_BGA_black_LeaderReine.png";

    setPlacedCards([
      {
        positionId: "hex-4-7",
        cardImage: playerKingImage,
        cardData: {
          type: "king",
          name: randomFirst === "player" ? "Roi" : "Roi",
        },
        owner: "player",
        isKing: true,
      },
      {
        positionId: "hex-4-1",
        cardImage: enemyKingImage,
        cardData: {
          type: "king",
          name: randomFirst === "enemy" ? "Reine" : "Reine",
        },
        owner: "enemy",
        isKing: true,
      },
    ]);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch((err) => {
        console.log("Auto-play prevented by browser:", err);
      });
    }
  }, []);

  const handleUserInteraction = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch((err) => {
        console.log("Play failed:", err);
      });
    }
  };

  // === GAME HANDLERS ===
  const handleCardSelect = (card) => {
    if (gamePhase === "battle" && currentPhase === "recruitment") {
      handleBattleRecruitment(card);
    } else {
      setSelectedCard(card);
    }
  };

  // === COMPLETE ADJACENCY MAPPING ===
  // === COMPLETE ADJACENCY MAPPING ===
  const getAdjacentPositions = (positionId) => {
    const adjacentMap = {
      // Baris 1 (4 hex)
      'hex-1-1': ['hex-2-1', 'hex-2-2'],
      'hex-1-2': ['hex-2-2', 'hex-2-3'],
      'hex-1-3': ['hex-2-3', 'hex-2-4'],
      'hex-1-4': ['hex-2-4', 'hex-2-5'],

      // Baris 2 (5 hex)
      'hex-2-1': ['hex-1-1', 'hex-2-2', 'hex-3-1', 'hex-3-2'],
      'hex-2-2': ['hex-1-1', 'hex-1-2', 'hex-2-1', 'hex-2-3', 'hex-3-2', 'hex-3-3'],
      'hex-2-3': ['hex-1-2', 'hex-1-3', 'hex-2-2', 'hex-2-4', 'hex-3-3', 'hex-3-4'],
      'hex-2-4': ['hex-1-3', 'hex-1-4', 'hex-2-3', 'hex-2-5', 'hex-3-4', 'hex-3-5'],
      'hex-2-5': ['hex-1-4', 'hex-2-4', 'hex-3-5', 'hex-3-6'],

      // Baris 3 (6 hex)
      'hex-3-1': ['hex-2-1', 'hex-3-2', 'hex-4-1', 'hex-4-2'],
      'hex-3-2': ['hex-2-1', 'hex-2-2', 'hex-3-1', 'hex-3-3', 'hex-4-2', 'hex-4-3'],
      'hex-3-3': ['hex-2-2', 'hex-2-3', 'hex-3-2', 'hex-3-4', 'hex-4-3', 'hex-4-4'],
      'hex-3-4': ['hex-2-3', 'hex-2-4', 'hex-3-3', 'hex-3-5', 'hex-4-4', 'hex-4-5'],
      'hex-3-5': ['hex-2-4', 'hex-2-5', 'hex-3-4', 'hex-3-6', 'hex-4-5', 'hex-4-6'],
      'hex-3-6': ['hex-2-5', 'hex-3-5', 'hex-4-6', 'hex-4-7'],

      // Baris 4 (7 hex) - TENGAH (PERBAIKI INI!)
      'hex-4-1': ['hex-3-1', 'hex-4-2', 'hex-5-1', 'hex-5-2'],
      'hex-4-2': ['hex-3-1', 'hex-3-2', 'hex-4-1', 'hex-4-3', 'hex-5-2', 'hex-5-3'],
      'hex-4-3': ['hex-3-2', 'hex-3-3', 'hex-4-2', 'hex-4-4', 'hex-5-3', 'hex-5-4'],
      'hex-4-4': ['hex-3-3', 'hex-3-4', 'hex-4-3', 'hex-4-5', 'hex-5-4', 'hex-5-5'],
      'hex-4-5': ['hex-3-4', 'hex-3-5', 'hex-4-4', 'hex-4-6', 'hex-5-5', 'hex-5-6'],
      'hex-4-6': ['hex-3-5', 'hex-3-6', 'hex-4-5', 'hex-4-7', 'hex-5-5', 'hex-5-6'],
      'hex-4-7': ['hex-3-6', 'hex-4-6', 'hex-5-6'],

      // Baris 5 (6 hex)
      'hex-5-1': ['hex-4-1', 'hex-5-2', 'hex-6-1', 'hex-6-2'],
      'hex-5-2': ['hex-4-1', 'hex-4-2', 'hex-5-1', 'hex-5-3', 'hex-6-2', 'hex-6-3'],
      'hex-5-3': ['hex-4-2', 'hex-4-3', 'hex-5-2', 'hex-5-4', 'hex-6-3', 'hex-6-4'],
      'hex-5-4': ['hex-4-3', 'hex-4-4', 'hex-5-3', 'hex-5-5', 'hex-6-4', 'hex-6-5'],
      'hex-5-5': ['hex-4-4', 'hex-4-5', 'hex-4-6', 'hex-5-4', 'hex-5-6', 'hex-6-4', 'hex-6-5'],
      'hex-5-6': ['hex-4-5', 'hex-4-6', 'hex-4-7', 'hex-5-5', 'hex-6-5'],

      // Baris 6 (5 hex)
      'hex-6-1': ['hex-5-1', 'hex-6-2', 'hex-7-1', 'hex-7-2'],
      'hex-6-2': ['hex-5-1', 'hex-5-2', 'hex-6-1', 'hex-6-3', 'hex-7-2', 'hex-7-3'],
      'hex-6-3': ['hex-5-2', 'hex-5-3', 'hex-6-2', 'hex-6-4', 'hex-7-3', 'hex-7-4'],
      'hex-6-4': ['hex-5-3', 'hex-5-4', 'hex-6-3', 'hex-6-5', 'hex-7-3', 'hex-7-4'],
      'hex-6-5': ['hex-5-4', 'hex-5-5', 'hex-5-6', 'hex-6-4', 'hex-7-4'],

      // Baris 7 (4 hex)
      'hex-7-1': ['hex-6-1', 'hex-7-2'],
      'hex-7-2': ['hex-6-1', 'hex-6-2', 'hex-7-1', 'hex-7-3'],
      'hex-7-3': ['hex-6-2', 'hex-6-3', 'hex-6-4', 'hex-7-2', 'hex-7-4'],
      'hex-7-4': ['hex-6-3', 'hex-6-4', 'hex-6-5', 'hex-7-3'],
    };

    return adjacentMap[positionId] || [];
  };

  const isAdjacent = (pos1, pos2) => {
    return getAdjacentPositions(pos1).includes(pos2);
  };

  // === BATTLE PHASE - AUTO TURN SYSTEM ===
  const handleBattlePositionClick = (position) => {
    if (gamePhase !== "battle" || currentPhase !== "action") return;

    // 1. Cek jika klik karakter sendiri → select
    const clickedCharacter = placedCards.find(card =>
      card.positionId === position.id && card.owner === turn
    );

    if (clickedCharacter && !selectedCharacter && !characterActions[clickedCharacter.positionId]) {
      setSelectedCharacter(clickedCharacter);
      return;
    }

    // 2. Jika sudah select karakter dan klik empty space → move (jika adjacent)
    if (selectedCharacter && !placedCards.find(card => card.positionId === position.id)) {
      if (isAdjacent(selectedCharacter.positionId, position.id)) {
        // Move karakter ke posisi baru
        const newPlacedCards = placedCards.map(card =>
          card.positionId === selectedCharacter.positionId
            ? { ...card, positionId: position.id }
            : card
        );

        setPlacedCards(newPlacedCards);

        // Tandai karakter sudah melakukan aksi
        setCharacterActions(prev => ({
          ...prev,
          [selectedCharacter.positionId]: true
        }));

        setSelectedCharacter(null);
        checkWinCondition();

        // Auto cek apakah semua karakter sudah aksi
        checkAllCharactersActed();
      } else {
        alert("Hanya bisa pindah ke posisi yang adjacent!");
      }
    }

    // 3. Jika klik karakter yang sama → deselect
    if (selectedCharacter && clickedCharacter === selectedCharacter) {
      setSelectedCharacter(null);
    }
  };

  // Cek apakah semua karakter sudah melakukan aksi
  const checkAllCharactersActed = () => {
    const currentPlayerCharacters = placedCards.filter(card => card.owner === turn && !card.isKing);
    const allCharactersActed = currentPlayerCharacters.every(character =>
      characterActions[character.positionId]
    );

    if (allCharactersActed && currentPlayerCharacters.length > 0) {
      // Auto lanjut ke recruitment phase
      setTimeout(() => {
        setCurrentPhase("recruitment");
        setSelectedCharacter(null);
        checkSkipRecruitment();
      }, 500);
    }
  };

  // Cek apakah perlu skip recruitment
  const checkSkipRecruitment = () => {
    const characterCount = placedCards.filter(p => p.owner === turn).length;
    if (characterCount >= 5) {
      // Auto skip recruitment dan ganti turn
      setTimeout(() => {
        handleEndTurn();
      }, 1000);
    }
  };

  // Handler untuk recruitment di battle phase
  const handleBattleRecruitment = (card) => {
    if (gamePhase !== "battle" || currentPhase !== "recruitment") return;

    const color = turn === "player" ? playerColor : enemyColor;
    const characterImage = `/Assets/Pions_personnages/${color === "white" ? "Blanc" : "Noir"
      }/Leaders_BGA_${color === "white" ? "white" : "black"}_${card.type}.png`;

    // Cari recruitment space yang kosong di zona sendiri
    const recruitmentSpaces = turn === "player"
      ? ['hex-1-4', 'hex-2-5', 'hex-3-6', 'hex-5-6', 'hex-6-5', 'hex-7-4']
      : ['hex-1-1', 'hex-2-1', 'hex-3-1', 'hex-5-1', 'hex-6-1', 'hex-7-1'];

    const availableSpace = recruitmentSpaces.find(space =>
      !placedCards.find(p => p.positionId === space)
    );

    if (availableSpace) {
      const newPlacedCards = [
        ...placedCards,
        {
          positionId: availableSpace,
          cardImage: characterImage,
          cardData: card,
          owner: turn,
          isKing: false,
        },
      ];

      // Update available cards
      const newAvailableCards = availableCards.filter(availCard => availCard.type !== card.type);
      let finalAvailableCards = newAvailableCards;
      let finalDeck = [...deck];

      if (deck.length > 0) {
        const newCard = deck[0];
        finalAvailableCards = [...newAvailableCards, newCard];
        finalDeck = deck.slice(1);
      }

      setPlacedCards(newPlacedCards);
      setAvailableCards(finalAvailableCards);
      setDeck(finalDeck);
      setSelectedCard(null);

      // Auto lanjut ke end turn
      setTimeout(() => {
        handleEndTurn();
      }, 500);
    }
  };

  // Auto ganti turn
  const handleEndTurn = () => {
    if (gamePhase !== "battle") return;

    setCurrentPhase("action");
    setCharacterActions({});
    setSelectedCharacter(null);
    setSelectedCard(null);
    setTurn(turn === "player" ? "enemy" : "player");
  };

  // Skip action phase manual
  const handleSkipActionPhase = () => {
    if (gamePhase !== "battle" || currentPhase !== "action") return;
    setCurrentPhase("recruitment");
    setSelectedCharacter(null);
    checkSkipRecruitment();
  };

  const checkWinCondition = () => {
    const playerKing = placedCards.find(p => p.owner === "player" && p.isKing);
    const enemyKing = placedCards.find(p => p.owner === "enemy" && p.isKing);

    if (playerKing) {
      const enemiesNear = placedCards.filter(p =>
        p.owner === "enemy" && isAdjacent(playerKing.positionId, p.positionId)
      ).length;
      if (enemiesNear >= 2) {
        setTimeout(() => alert("🎉 Enemy wins! Player King captured!"), 100);
      }
    }

    if (enemyKing) {
      const playersNear = placedCards.filter(p =>
        p.owner === "player" && isAdjacent(enemyKing.positionId, p.positionId)
      ).length;
      if (playersNear >= 2) {
        setTimeout(() => alert("🎉 Player wins! Enemy King captured!"), 100);
      }
    }
  };

  const handlePositionClick = (position) => {
    if (gamePhase === "placement") {
      // Existing placement logic (TIDAK DIUBAH)
      if (!selectedCard) {
        alert("Pilih card terlebih dahulu!");
        return;
      }

      if (position.place === "king") {
        alert("Posisi king tidak bisa diisi character lain!");
        return;
      }

      if (position.zone !== turn) {
        alert(`Hanya bisa menempatkan di zona ${turn}!`);
        return;
      }

      const isOccupied = placedCards.find((p) => p.positionId === position.id);
      if (isOccupied) {
        alert("Posisi sudah terisi!");
        return;
      }

      const deployedCount = placedCards.filter(
        (p) => p.owner === turn && !p.isKing
      ).length;

      if (deployedCount >= 4) {
        alert("Maksimal 5 character (termasuk king)!");
        return;
      }

      const color = turn === "player" ? playerColor : enemyColor;
      const colorPrefix = color === "white" ? "white" : "black";
      const characterImage = `/Assets/Pions_personnages/${color === "white" ? "Blanc" : "Noir"
        }/Leaders_BGA_${colorPrefix}_${selectedCard.type}.png`;

      const newPlacedCards = [
        ...placedCards,
        {
          positionId: position.id,
          cardImage: characterImage,
          cardData: selectedCard,
          owner: turn,
          isKing: false,
        },
      ];

      const newAvailableCards = availableCards.filter(card => card.type !== selectedCard.type);

      let finalAvailableCards = newAvailableCards;
      let finalDeck = [...deck];

      if (deck.length > 0) {
        const newCard = deck[0];
        finalAvailableCards = [...newAvailableCards, newCard];
        finalDeck = deck.slice(1);
      }

      setPlacedCards(newPlacedCards);
      setAvailableCards(finalAvailableCards);
      setDeck(finalDeck);
      setSelectedCard(null);
      setTurn(turn === "player" ? "enemy" : "player");

      const playerChars = newPlacedCards.filter(p => p.owner === "player").length;
      const enemyChars = newPlacedCards.filter(p => p.owner === "enemy").length;

      if (playerChars >= 5 && enemyChars >= 5) {
        setTimeout(() => {
          alert("Deployment selesai! Battle dimulai!");
          setGamePhase("battle");
          setCurrentPhase("action");
        }, 500);
      }
    } else if (gamePhase === "battle") {
      // Battle phase - panggil handler baru
      handleBattlePositionClick(position);
    }
  };

  return (
    <div className="arena-container" onClick={handleUserInteraction}>
      <audio ref={audioRef} loop>
        <source src="/medieval-kingdom-loop-366815.mp3" type="audio/mpeg" />
      </audio>

      <div className="arena-background"></div>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <CardDeck
          availableCards={availableCards}
          onCardSelect={handleCardSelect}
          selectedCard={selectedCard}
          deckCount={deck.length}
        />
      </div>

      <GameBoard
        placedCards={placedCards}
        selectedCard={selectedCard}
        selectedCharacter={selectedCharacter}
        turn={turn}
        gamePhase={gamePhase}
        onPositionClick={handlePositionClick}
      />

      <div className="absolute top-4 translate-x-150 z-20 bg-black/80 px-6 py-3 rounded-lg border-2 border-yellow-400">
        <p className="text-yellow-300 text-lg font-bold">
          {gamePhase === "placement" &&
            `⚔️ Character Placement - ${turn === "player" ? "Player" : "Enemy"} Turn`}
          {gamePhase === "battle" &&
            `⚡ Battle Phase - ${turn === "player" ? "Player" : "Enemy"} Turn - ${currentPhase === "action" ? "Action Phase" : "Recruitment Phase"}`}
        </p>
        {firstTurn && (
          <p className="text-white text-sm mt-1">
            Player:{" "}
            {playerColor === "white" ? "⚪ White (Roi)" : "⚫ Black (Roi)"} |
            Enemy:{" "}
            {enemyColor === "white" ? "⚪ White (Reine)" : "⚫ Black (Reine)"}
          </p>
        )}

        {gamePhase === "battle" && currentPhase === "action" && (
          <div className="mt-2">
            <button
              onClick={handleSkipActionPhase}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
            >
              Skip to Recruitment
            </button>
            {selectedCharacter && (
              <p className="text-green-400 text-sm mt-1">
                Selected: {selectedCharacter.cardData.type} - Click adjacent empty space to move
              </p>
            )}
            <p className="text-yellow-400 text-xs mt-1">
              Actions left: {placedCards.filter(card => card.owner === turn && !card.isKing && !characterActions[card.positionId]).length}
            </p>
          </div>
        )}

        {gamePhase === "battle" && currentPhase === "recruitment" && (
          <div className="mt-2">
            <p className="text-blue-400 text-sm">
              {placedCards.filter(p => p.owner === turn).length >= 5 ?
                "Max characters reached - Auto skipping..." :
                "Choose a card to recruit"}
            </p>
          </div>
        )}
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <GameInfo />
      </div>

      <MuteButton audioRef={audioRef} />
    </div>
  );
};

export default Arena;