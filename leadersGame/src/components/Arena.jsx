import React, { useEffect, useRef, useState } from "react";
import MuteButton from "./MuteButton";
import CardDeck from "./CardDeck";
import GameInfo from "./GameInfo";
import GameBoard from "./GameBoard";
import { Link } from "react-router-dom";
import { characterInfo } from "../data/characterInfo";

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
  const [activeAbilityUsed, setActiveAbilityUsed] = useState({}); // Track active ability usage
  const [currentPhase, setCurrentPhase] = useState("action"); // "action" | "recruitment"
  const [recruitmentCount, setRecruitmentCount] = useState(1); // Untuk pemain kedua di turn pertama
  const [secondPlayerUsedBonus, setSecondPlayerUsedBonus] = useState(false);

  // === RECRUITMENT STATE ===
  const [recruitmentPhase, setRecruitmentPhase] = useState({
    selectingCard: true, // Sedang pilih kartu
    selectedRecruitmentCard: null, // Kartu yang dipilih
    selectingPosition: false, // Sedang pilih posisi
  });

  // === INITIALIZE DECK ===
  useEffect(() => {
    const allCards = [
      { type: "Acrobate", image: "/Composants_2D/Cartes/cartes_acrobate.jpg" },
      { type: "Archer", image: "/Composants_2D/Cartes/cartes_archer.jpg" },
      { type: "Assassin", image: "/Composants_2D/Cartes/cartes_assassin.jpg" },
      { type: "Cavalier", image: "/Composants_2D/Cartes/cartes_cavalier.jpg" },
      { type: "Cogneur", image: "/Composants_2D/Cartes/cartes_cogneur.jpg" },
      {
        type: "GardeRoyal",
        image: "/Composants_2D/Cartes/cartes_gardeRoyal.jpg",
      },
      { type: "Geolier", image: "/Composants_2D/Cartes/cartes_geolier.jpg" },
      {
        type: "Illusionist",
        image: "/Composants_2D/Cartes/cartes_illusionist.jpg",
      },
      {
        type: "LanceGrappin",
        image: "/Composants_2D/Cartes/cartes_lanceGrappin.jpg",
      },
      {
        type: "Manipulator",
        image: "/Composants_2D/Cartes/cartes_manipulator.jpg",
      },
      { type: "Nemesis", image: "/Composants_2D/Cartes/cartes_nemesis.jpg" },
      { type: "VieilOurs", image: "/Composants_2D/Cartes/cartes_oldBear.jpg" },
      {
        type: "Protector",
        image: "/Composants_2D/Cartes/cartes_protector.jpg",
      },
      { type: "Rodeuse", image: "/Composants_2D/Cartes/cartes_rodeuse.jpg" },
      {
        type: "Tavernier",
        image: "/Composants_2D/Cartes/cartes_tavernier.jpg",
      },
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

    // LANGSUNG MULAI BATTLE PHASE - TAMBAH INI
    setGamePhase("battle");
    setCurrentPhase("action");
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

  // FIXED: When selecting a card during recruitment, remove it immediately from availableCards
  const handleCardSelect = (card) => {
    // DI BATTLE PHASE: Hanya boleh pilih kartu jika di recruitment phase
    if (gamePhase === "battle" && currentPhase === "recruitment") {
      if (recruitmentPhase.selectingCard) {
        // Remove the selected card immediately so it disappears from the deck UI
        setAvailableCards((prev) => prev.filter((c) => c.type !== card.type));

        setRecruitmentPhase({
          selectingCard: false,
          selectedRecruitmentCard: card,
          selectingPosition: true,
        });
        return;
      }
    }

    // DI PLACEMENT PHASE: Boleh pilih kartu
    if (gamePhase === "placement") {
      setSelectedCard(card);
    }
  };

  const getAdjacentPositions = (positionId) => {
    const [_, row, col] = positionId.split("-").map(Number);
    const maxCols = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 6, 6: 5, 7: 4 };
    const adjacent = [];

    // Horizontal
    if (col > 1) adjacent.push(`hex-${row}-${col - 1}`);
    if (col < maxCols[row]) adjacent.push(`hex-${row}-${col + 1}`);

    // Vertical & diagonal
    const neighbors = [
      { r: row - 1, c: col }, // up
      { r: row - 1, c: col - 1 }, // up-left
      { r: row - 1, c: col + 1 }, // up-right
      { r: row + 1, c: col }, // down
      { r: row + 1, c: col - 1 }, // down-left
      { r: row + 1, c: col + 1 }, // down-right
    ];

    neighbors.forEach(({ r, c }) => {
      if (r >= 1 && r <= 7 && c >= 1 && c <= (maxCols[r] || 0)) {
        adjacent.push(`hex-${r}-${c}`);
      }
    });

    return adjacent;
  };

  // TEST FUNCTION OTOMATIS
  useEffect(() => {
    // Auto test beberapa posisi penting saat component mount
    if (gamePhase === "battle") {
      console.log("🧪 AUTO TESTING ADJACENT POSITIONS:");

      // Test hex-6-1 (masalah dari log)
      const test61 = getAdjacentPositions("hex-6-1");
      console.log("hex-6-1 adjacent:", test61);
      console.log("Can move to hex-5-2:", test61.includes("hex-5-2"));

      // Test beberapa posisi lain untuk verifikasi
      const test44 = getAdjacentPositions("hex-4-4");
      console.log("hex-4-4 adjacent:", test44, "count:", test44.length);

      const test11 = getAdjacentPositions("hex-1-1");
      console.log("hex-1-1 adjacent:", test11, "count:", test11.length);
    }
  }, [gamePhase]);

  const isAdjacent = (pos1, pos2) => {
    return getAdjacentPositions(pos1).includes(pos2);
  };

  // === AUTO TURN SYSTEM ===
  const handleEndTurn = () => {
    if (gamePhase !== "battle") return;

    setCurrentPhase("action");
    setCharacterActions({});
    setActiveAbilityUsed({}); // Reset active ability usage for new action phase
    setSelectedCharacter(null);
    setSelectedCard(null);
    setRecruitmentCount(1);
    // Reset recruitment phase
    setRecruitmentPhase({
      selectingCard: true,
      selectedRecruitmentCard: null,
      selectingPosition: false,
    });
    setTurn(turn === "player" ? "enemy" : "player");
  };

  // === MANUAL END ACTION PHASE ===
  const handleEndActionPhase = () => {
    if (gamePhase !== "battle" || currentPhase !== "action") return;

    // Clear selected character
    setSelectedCharacter(null);

    // Langsung ke recruitment phase
    setCurrentPhase("recruitment");
    checkSkipRecruitment();
  };

  // === USE ACTIVE ABILITY ===
  const handleUseActiveAbility = () => {
    if (!selectedCharacter) {
      alert("Pilih karakter terlebih dahulu!");
      return;
    }

    const characterType = selectedCharacter.cardData.type;

    // Check if already used
    if (activeAbilityUsed[characterType]) {
      return;
    }

    // Check if character has already acted
    if (characterActions[characterType]) {
      return;
    }

    // Mark ability as used
    setActiveAbilityUsed({
      ...activeAbilityUsed,
      [characterType]: true,
    });

    // Mark character as having acted (cannot move anymore)
    setCharacterActions({
      ...characterActions,
      [characterType]: true,
    });

    // Deselect character
    setSelectedCharacter(null);

    // TODO: Implement specific active ability logic for each character

    // Check if all characters have acted
    setTimeout(() => {
      const currentPlayerCharacters = placedCards.filter(
        (card) => card.owner === turn
      );
      const newActions = {
        ...characterActions,
        [characterType]: true,
      };
      const allCharactersActed = currentPlayerCharacters.every(
        (character) => newActions[character.cardData.type]
      );

      if (allCharactersActed && currentPlayerCharacters.length > 0) {
        setCurrentPhase("recruitment");
        checkSkipRecruitment();
      }
    }, 200);
  };

  // Cek apakah semua karakter sudah melakukan aksi
  const checkAllCharactersActed = () => {
    const currentPlayerCharacters = placedCards.filter(
      (card) => card.owner === turn
    );
    const allCharactersActed = currentPlayerCharacters.every(
      (character) => characterActions[character.cardData.type]
    );

    console.log("Characters acted:", characterActions);
    console.log("All acted:", allCharactersActed);

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
    const characterCount = placedCards.filter((p) => p.owner === turn).length;

    console.log("Character count:", characterCount);
    console.log(
      "Turn:",
      turn,
      "FirstTurn:",
      firstTurn,
      "RecruitmentCount:",
      recruitmentCount
    );

    if (characterCount >= 5) {
      // Auto skip recruitment dan ganti turn
      setTimeout(() => {
        handleEndTurn();
      }, 1000);
    } else {
      // Set recruitment count khusus untuk pemain kedua di turn pertama
      // HANYA jika pemain kedua BELUM menggunakan bonusnya
      if (
        turn !== firstTurn &&
        !secondPlayerUsedBonus &&
        recruitmentCount === 1
      ) {
        setRecruitmentCount(2); // Pemain kedua bisa rekrut 2x di turn pertama
        setSecondPlayerUsedBonus(true); // Tandai sudah pakai bonus
      }
    }
  };

  // === BATTLE PHASE HANDLERS ===
  const handleBattlePositionClick = (position) => {
    if (gamePhase !== "battle" || currentPhase !== "action") return;

    // 1. Cek jika klik karakter sendiri → select
    const clickedCharacter = placedCards.find(
      (card) => card.positionId === position.id && card.owner === turn
    );

    if (
      clickedCharacter &&
      !selectedCharacter &&
      !characterActions[clickedCharacter.cardData.type]
    ) {
      setSelectedCharacter(clickedCharacter);
      return;
    }

    // 2. Jika sudah select karakter dan klik empty space → move (jika adjacent)
    if (
      selectedCharacter &&
      !placedCards.find((card) => card.positionId === position.id)
    ) {
      // Check if character has already used active ability (cannot move)
      if (activeAbilityUsed[selectedCharacter.cardData.type]) {
        alert(
          "Character ini sudah menggunakan active ability dan tidak bisa move!"
        );
        return;
      }

      const adjacentPositions = getAdjacentPositions(
        selectedCharacter.positionId
      );

      console.log("🔄 DEBUG MOVEMENT:");
      console.log(
        "- Selected character:",
        selectedCharacter.positionId,
        selectedCharacter.cardData.type
      );
      console.log("- Target position:", position.id);
      console.log("- Adjacent positions:", adjacentPositions);
      console.log("- Is adjacent:", adjacentPositions.includes(position.id));

      if (adjacentPositions.includes(position.id)) {
        // Move karakter ke posisi baru
        const newPlacedCards = placedCards.map((card) =>
          card.positionId === selectedCharacter.positionId
            ? { ...card, positionId: position.id }
            : card
        );

        setPlacedCards(newPlacedCards);

        const newActions = {
          ...characterActions,
          [selectedCharacter.cardData.type]: true,
        };

        setCharacterActions(newActions);
        setSelectedCharacter(null);

        setTimeout(() => checkWinCondition(), 100);

        // Auto cek apakah semua karakter sudah bertindak
        setTimeout(() => {
          const currentPlayerCharacters = newPlacedCards.filter(
            (card) => card.owner === turn
          );
          const allCharactersActed = currentPlayerCharacters.every(
            (character) => newActions[character.cardData.type]
          );

          if (allCharactersActed && currentPlayerCharacters.length > 0) {
            setCurrentPhase("recruitment");
            setSelectedCharacter(null);
            checkSkipRecruitment();
          }
        }, 200);
      } else {
        alert("Hanya bisa pindah ke posisi yang adjacent!");
      }
    }

    // 3. Jika klik karakter yang sama → deselect
    if (selectedCharacter && clickedCharacter === selectedCharacter) {
      setSelectedCharacter(null);
    }
  };

  // Handler untuk pilih posisi di recruitment phase
  const handleRecruitmentPositionSelect = (position) => {
    const { selectedRecruitmentCard } = recruitmentPhase;

    if (!selectedRecruitmentCard) return;

    // Cek apakah posisi valid (recruitment space di zona sendiri)
    const recruitmentSpaces =
      turn === "player"
        ? [
            "hex-1-4",
            "hex-2-5",
            "hex-3-6",
            "hex-4-7",
            "hex-5-6",
            "hex-6-5",
            "hex-7-4",
          ]
        : [
            "hex-1-1",
            "hex-2-1",
            "hex-3-1",
            "hex-4-1",
            "hex-5-1",
            "hex-6-1",
            "hex-7-1",
          ];

    if (!recruitmentSpaces.includes(position.id)) {
      alert("Hanya bisa menempatkan di recruitment space zona sendiri!");
      return;
    }

    // Cek apakah posisi kosong
    const isOccupied = placedCards.find((p) => p.positionId === position.id);
    if (isOccupied) {
      alert("Posisi sudah terisi!");
      return;
    }

    // Tempatkan karakter
    const color = turn === "player" ? playerColor : enemyColor;
    const characterImage = `/Assets/Pions_personnages/${
      color === "white" ? "Blanc" : "Noir"
    }/Leaders_BGA_${color === "white" ? "white" : "black"}_${
      selectedRecruitmentCard.type
    }.png`;

    const newPlacedCards = [
      ...placedCards,
      {
        positionId: position.id,
        cardImage: characterImage,
        cardData: selectedRecruitmentCard,
        owner: turn,
        isKing: false,
      },
    ];

    // Update available cards
    // NOTE: we already removed the selected card in handleCardSelect, so availableCards
    // does not contain selectedRecruitmentCard anymore. We still filter just in case.
    const newAvailableCards = availableCards.filter(
      (availCard) => availCard.type !== selectedRecruitmentCard.type
    );
    let finalAvailableCards = newAvailableCards;
    let finalDeck = [...deck];

    if (deck.length > 0) {
      const newCard = deck[0];
      finalAvailableCards = [...finalAvailableCards, newCard];
      finalDeck = deck.slice(1);
    }

    setPlacedCards(newPlacedCards);
    setAvailableCards(finalAvailableCards);
    setDeck(finalDeck);

    // Cek apakah pemain kedua masih punya recruitment tambahan
    if (turn !== firstTurn && recruitmentCount > 1) {
      // Masih ada recruitment tambahan untuk pemain kedua
      setRecruitmentCount((prev) => prev - 1);
      // Reset ke mode pilih kartu untuk recruitment berikutnya
      setRecruitmentPhase({
        selectingCard: true,
        selectedRecruitmentCard: null,
        selectingPosition: false,
      });
    } else {
      // Auto lanjut ke end turn setelah recruitment selesai
      setTimeout(() => {
        handleEndTurn();
      }, 500);
    }
  };

  // Skip action phase manual (dihapus sesuai rules - tidak dipakai)
  // Skip recruitment phase manual (dihapus sesuai rules - tidak dipakai)

  const checkWinCondition = () => {
    const playerKing = placedCards.find(
      (p) => p.owner === "player" && p.isKing
    );
    const enemyKing = placedCards.find((p) => p.owner === "enemy" && p.isKing);

    console.log("👑 WIN CONDITION CHECK:");
    console.log("- Player King:", playerKing?.positionId);
    console.log("- Enemy King:", enemyKing?.positionId);

    if (playerKing) {
      const enemiesNear = placedCards.filter(
        (p) =>
          p.owner === "enemy" && isAdjacent(playerKing.positionId, p.positionId)
      );
      console.log(
        "- Enemies near player king:",
        enemiesNear.map((e) => ({ type: e.cardData.type, pos: e.positionId }))
      );

      if (enemiesNear.length >= 2) {
        setTimeout(() => {
          alert("🎉 Enemy wins! Player King captured!");
        }, 100);
        return;
      }

      // Cek juga surrounded condition
      const allAdjacent = getAdjacentPositions(playerKing.positionId);
      const isSurrounded = allAdjacent.every((pos) =>
        placedCards.find((p) => p.positionId === pos)
      );
      if (isSurrounded) {
        setTimeout(() => {
          alert("🎉 Enemy wins! Player King surrounded!");
        }, 100);
      }
    }

    if (enemyKing) {
      const playersNear = placedCards.filter(
        (p) =>
          p.owner === "player" && isAdjacent(enemyKing.positionId, p.positionId)
      );
      console.log(
        "- Players near enemy king:",
        playersNear.map((p) => ({ type: p.cardData.type, pos: p.positionId }))
      );

      if (playersNear.length >= 2) {
        setTimeout(() => {
          alert("🎉 Player wins! Enemy King captured!");
        }, 100);
        return;
      }

      // Cek juga surrounded condition
      const allAdjacent = getAdjacentPositions(enemyKing.positionId);
      const isSurrounded = allAdjacent.every((pos) =>
        placedCards.find((p) => p.positionId === pos)
      );
      if (isSurrounded) {
        setTimeout(() => {
          alert("🎉 Player wins! Enemy King surrounded!");
        }, 100);
      }
    }
  };

  // === DI JSX - HAPUS TOMBOL SKIP ===
  // NOTE: Komponen GameBoard & CardDeck diasumsikan mengikuti props yang ada.

  // === PLACEMENT PHASE HANDLER (TIDAK DIUBAH) ===
  const handlePositionClick = (position) => {
    if (gamePhase === "placement") {
      // Existing placement logic (TIDAK DIUBAH)
      if (!selectedCard) {
        alert("Pilih card terlebih dahulu!");
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
      const characterImage = `/Assets/Pions_personnages/${
        color === "white" ? "Blanc" : "Noir"
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

      // Remove selected card from available and refill from deck
      const newAvailableCards = availableCards.filter(
        (card) => card.type !== selectedCard.type
      );

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

      const playerChars = newPlacedCards.filter(
        (p) => p.owner === "player"
      ).length;
      const enemyChars = newPlacedCards.filter(
        (p) => p.owner === "enemy"
      ).length;

      if (playerChars >= 5 && enemyChars >= 5) {
        setTimeout(() => {
          alert("Deployment selesai! Battle dimulai!");
          setGamePhase("battle");
          setCurrentPhase("action");
        }, 500);
      }
    } else if (gamePhase === "battle") {
      if (currentPhase === "action") {
        // Battle phase - action phase
        handleBattlePositionClick(position);
      } else if (
        currentPhase === "recruitment" &&
        recruitmentPhase.selectingPosition
      ) {
        // Battle phase - recruitment phase (pilih posisi)
        handleRecruitmentPositionSelect(position);
      }
    }
  };

  return (
    <div className="arena-container" onClick={handleUserInteraction}>
      <audio ref={audioRef} loop>
        <source src="/medieval-kingdom-loop-366815.mp3" type="audio/mpeg" />
      </audio>

      <div className="arena-background"></div>

      {/* Back to Menu Button - Pojok Kiri Atas */}
      <div className="absolute top-4 left-4 z-20">
        <Link to="/" className="kingdom-btn text-center px-6 py-2">
          Back to Menu
        </Link>
      </div>

      <div className="absolute left-30 top-1/2 -translate-y-1/2 z-10">
        <CardDeck
          availableCards={availableCards}
          onCardSelect={handleCardSelect}
          selectedCard={selectedCard}
          deckCount={deck.length}
          disabled={gamePhase === "battle" && currentPhase === "action"} // TAMBAH INI
        />
      </div>

      <GameBoard
        placedCards={placedCards}
        selectedCard={selectedCard}
        selectedCharacter={selectedCharacter}
        turn={turn}
        gamePhase={gamePhase}
        onPositionClick={handlePositionClick}
        recruitmentPhase={recruitmentPhase} // Pass recruitment phase ke GameBoard
        activeAbilityUsed={activeAbilityUsed} // Pass active ability usage state
      />

      <div className="absolute top-4 translate-x-150 z-20 bg-black/80 px-6 py-3 rounded-lg border-2 border-yellow-400">
        <p className="text-yellow-300 text-lg font-bold">
          {gamePhase === "placement" &&
            `⚔️ Character Placement - ${
              turn === "player" ? "Player" : "Enemy"
            } Turn`}
          {gamePhase === "battle" &&
            `⚡ Battle Phase - ${
              (turn === "player" && playerColor === "white") ||
              (turn === "enemy" && enemyColor === "white")
                ? "⚪ White's"
                : "⚫ Black's"
            } Turn - ${
              currentPhase === "action" ? "Action Phase" : "Recruitment Phase"
            }`}
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
            {selectedCharacter && (
              <p className="text-green-400 text-sm mt-1">
                Selected: {selectedCharacter.cardData.type} - Click adjacent
                empty space to move
              </p>
            )}
            <p className="text-yellow-400 text-xs mt-1">
              Actions left:{" "}
              {
                placedCards.filter(
                  (card) =>
                    card.owner === turn && !characterActions[card.cardData.type]
                ).length
              }
            </p>

            {/* Use Active Ability Button - Show only for selected Active characters */}
            {selectedCharacter &&
              characterInfo[selectedCharacter.cardData.type]?.category ===
                "Active" && (
                <button
                  onClick={handleUseActiveAbility}
                  disabled={activeAbilityUsed[selectedCharacter.cardData.type]}
                  className={`mt-2 w-full px-4 py-2 font-bold rounded-lg border-2 shadow-lg transition-all duration-300 ${
                    activeAbilityUsed[selectedCharacter.cardData.type]
                      ? "bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-purple-400 hover:scale-105"
                  }`}
                >
                  {activeAbilityUsed[selectedCharacter.cardData.type]
                    ? "✓ Ability Used"
                    : "⚡ Use Active Ability"}
                </button>
              )}

            {/* End Action Phase Button */}
            <button
              onClick={handleEndActionPhase}
              className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-lg border-2 border-yellow-400 shadow-lg transition-all duration-300 hover:scale-105"
            >
              End Action Phase
            </button>
          </div>
        )}

        {gamePhase === "battle" && currentPhase === "recruitment" && (
          <div className="mt-2">
            {recruitmentPhase.selectingPosition ? (
              <p className="text-green-400 text-sm">
                Pilih posisi di recruitment space (lingkaran emas) untuk
                menempatkan {recruitmentPhase.selectedRecruitmentCard?.type}
              </p>
            ) : (
              <p className="text-blue-400 text-sm">
                {placedCards.filter((p) => p.owner === turn).length >= 5
                  ? "Max characters reached - Auto skipping..."
                  : "Pilih kartu untuk recruit"}
              </p>
            )}
            {/* TOMBOL SKIP DIHAPUS SESUAI CATATAN */}
          </div>
        )}
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <GameInfo
          placedCards={placedCards}
          turn={turn}
          playerColor={playerColor}
          enemyColor={enemyColor}
        />
      </div>

      <MuteButton audioRef={audioRef} />
    </div>
  );
};

export default Arena;
