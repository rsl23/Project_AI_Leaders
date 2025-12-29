import React, { useEffect, useRef, useState } from "react";
import MuteButton from "./MuteButton";
import CardDeck from "./CardDeck";
import GameInfo from "./GameInfo";
import GameBoard from "./GameBoard";
import { Link, useNavigate } from "react-router-dom";
import { characterInfo } from "../data/characterInfo";

// Import skill modules
import * as SkillManager from "../skill/skillManager";
import * as SkillHandlers from "../skill/skillHandlers";
import * as SkillConstants from "../skill/skillConstants";

const Arena = () => {
  const audioRef = useRef(null);
  const navigate = useNavigate();

  // === GAME OVER STATE ===
  const [gameOver, setGameOver] = useState(null); // { winner: "player" | "enemy", reason: string }

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
  const [validMovePositions, setValidMovePositions] = useState([]); // Track valid positions for selected character
  const [currentPhase, setCurrentPhase] = useState("action"); // "action" | "recruitment"
  const [recruitmentCount, setRecruitmentCount] = useState(1); // Untuk pemain kedua di turn pertama
  const [secondPlayerUsedBonus, setSecondPlayerUsedBonus] = useState(false);

  // === ACTIVE ABILITY STATE ===
  const [abilityMode, setAbilityMode] = useState(null); // Track which ability is being used
  const [abilityData, setAbilityData] = useState({}); // Store additional ability data

  // === RECRUITMENT STATE ===
  const [recruitmentPhase, setRecruitmentPhase] = useState({
    selectingCard: true, // Sedang pilih kartu
    selectedRecruitmentCard: null, // Kartu yang dipilih
    selectingPosition: false, // Sedang pilih posisi
  });
  const [pendingOurson, setPendingOurson] = useState(null); // Track Ourson yang perlu ditempatkan setelah VieilOurs

  const [bonusMoveActive, setBonusMoveActive] = useState(false);

  // === NEMESIS STATE ===
  // nemesisMustMove: { nemesis, validPositions, pendingCards, owner, originalTurn }
  // Ketika Nemesis harus bergerak, ini menyimpan state interrupt
  const [nemesisMustMove, setNemesisMustMove] = useState(null);

  // Fungsi untuk mengakhiri aksi
  const finishCharacterAction = (charType) => {
    setCharacterActions({ ...characterActions, [charType]: true });
    setSelectedCharacter(null);
    setValidMovePositions([]);
    setBonusMoveActive(false); // Reset flag bonus
    checkAutoAdvance();
  };

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

    // LANGSUNG MULAI BATTLE PHASE
    setGamePhase("battle");
    setCurrentPhase("action");
  }, []);

  // Tambahkan di Arena.js, setelah state declarations
  useEffect(() => {
    console.log("🔵 STATE UPDATE:");
    console.log("- validMovePositions:", validMovePositions);
    console.log("- abilityMode:", abilityMode);
    console.log("- nemesisMustMove:", nemesisMustMove);
    console.log("- Array length:", validMovePositions?.length);
  }, [validMovePositions, abilityMode, nemesisMustMove]);

  useEffect(() => {
    if (nemesisMustMove) {
      console.log("🔄 Setting highlights from nemesisMustMove...");
      setValidMovePositions(nemesisMustMove.validPositions);
      setAbilityMode("nemesis_move");
    }
  }, [nemesisMustMove]);

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

  // === AUTO TURN SYSTEM ===
  const handleEndTurn = () => {
    if (gamePhase !== "battle") return;

    const newTurn = turn === "player" ? "enemy" : "player";

    // Cek apakah giliran baru punya Nemesis, jika ya otomatis mark as acted
    const hasNemesis = placedCards.find(
      (p) => p.cardData.type === "Nemesis" && p.owner === newTurn
    );

    const initialActions = hasNemesis ? { Nemesis: true } : {};

    setCurrentPhase("action");
    setCharacterActions(initialActions);
    setActiveAbilityUsed({}); // Reset active ability usage for new action phase
    setAbilityMode(null); // Reset ability mode
    setAbilityData({}); // Reset ability data
    setSelectedCharacter(null);
    setSelectedCard(null);
    setRecruitmentCount(1);
    // Reset recruitment phase
    setRecruitmentPhase({
      selectingCard: true,
      selectedRecruitmentCard: null,
      selectingPosition: false,
    });
    setTurn(newTurn);
  };

  // === MANUAL END ACTION PHASE ===
  const handleEndActionPhase = () => {
    if (gamePhase !== "battle" || currentPhase !== "action") return;

    // Clear selected character
    setSelectedCharacter(null);
    setValidMovePositions([]); // Clear valid positions

    // Langsung ke recruitment phase
    setCurrentPhase("recruitment");
    checkSkipRecruitment();
  };

  // === USE ACTIVE ABILITY ===
  const handleUseActiveAbility = () => {
    if (!selectedCharacter || !selectedCharacter.positionId) {
      alert("Karakter harus berada di papan untuk menggunakan skill!");
      return;
    }

    const characterType = selectedCharacter.cardData.type;
    const isJailed = SkillManager.isAffectedByJailer(
      selectedCharacter.positionId,
      placedCards,
      turn
    );

    if (isJailed) {
      alert(
        "Skill tidak bisa digunakan! Karakter ini terkena efek Jailer (Geolier) lawan."
      );
      return; // Berhenti di sini, skill tidak akan masuk ke mode seleksi
    }

    // Check if already used
    if (activeAbilityUsed[characterType]) {
      return;
    }

    // Check if character has already acted
    if (characterActions[characterType]) {
      return;
    }

    try {
      let result;
      const config = SkillConstants.BOARD_CONFIG;

      switch (characterType) {
        case "Acrobate":
          result = SkillHandlers.handleAcrobateAbility(
            selectedCharacter,
            placedCards,
            config
          );
          break;
        case "Cavalier":
          result = SkillHandlers.handleCavalierAbility(
            selectedCharacter,
            placedCards,
            config
          );
          break;
        case "Cogneur":
          result = SkillHandlers.handleCogneurAbility(
            selectedCharacter,
            placedCards,
            turn,
            config
          );
          break;
        case "GardeRoyal":
          result = SkillHandlers.handleGardeRoyalAbility(
            selectedCharacter,
            placedCards,
            turn,
            config
          );
          break;
        case "LanceGrappin":
          result = SkillHandlers.handleLanceGrappinAbility(
            selectedCharacter,
            placedCards,
            config
          );
          break;
        case "Manipulator":
          result = SkillHandlers.handleManipulatorAbility(
            selectedCharacter,
            placedCards,
            turn,
            config
          );
          break;
        case "Rodeuse":
          result = SkillHandlers.handleRodeuseAbility(
            selectedCharacter,
            placedCards,
            turn,
            config
          );
          break;
        case "Tavernier":
          result = SkillHandlers.handleTavernierAbility(
            selectedCharacter,
            placedCards,
            turn,
            config
          );
          break;
        case "Illusionist":
          result = SkillHandlers.handleIllusionistAbility(
            selectedCharacter,
            placedCards,
            config
          );
          break;
        default:
          // For characters without special active ability logic
          setActiveAbilityUsed({
            ...activeAbilityUsed,
            [characterType]: true,
          });
          setCharacterActions({
            ...characterActions,
            [characterType]: true,
          });
          setSelectedCharacter(null);
          setValidMovePositions([]);
          checkAutoAdvance();
          return;
      }

      setAbilityMode(result.abilityMode);
      setValidMovePositions(result.validMovePositions);
      if (result.abilityData) {
        setAbilityData(result.abilityData);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // Helper function untuk menghitung posisi adjacent dengan skill manager
  const getAdjacentPositions = (positionId) => {
    return SkillManager.getAdjacentPositions(
      positionId,
      SkillConstants.BOARD_CONFIG
    );
  };

  const isAdjacent = (pos1, pos2) => {
    return SkillManager.isAdjacent(pos1, pos2, SkillConstants.BOARD_CONFIG);
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
    // Hitung karakter recruited (exclude King dan Ourson)
    const recruitedCount = placedCards.filter(
      (p) => p.owner === turn && !p.isKing && !p.isOurson
    ).length;

    // Max recruited selalu 4 (VieilOurs + Ourson dihitung 1)
    const maxRecruited = 4;

    console.log("Recruited count:", recruitedCount);
    console.log("Max recruited:", maxRecruited);
    console.log(
      "Turn:",
      turn,
      "FirstTurn:",
      firstTurn,
      "RecruitmentCount:",
      recruitmentCount
    );

    if (recruitedCount >= maxRecruited) {
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
  // Helper function untuk mendapatkan valid moves untuk Leader
  const getLeaderMoves = (leader, placedCards) => {
    // Leader hanya bisa bergerak 1 langkah (adjacent)
    // Gerakan tambahan dihandle oleh bonusMoveActive system
    const adjacentPositions = getAdjacentPositions(leader.positionId);
    const emptyAdjacent = adjacentPositions.filter(
      (posId) => !placedCards.find((card) => card.positionId === posId)
    );

    return emptyAdjacent;
  };

  const handleBattlePositionClick = (position) => {
    if (gamePhase !== "battle") return;

    // Handle Nemesis movement selection (bisa di action atau recruitment phase)
    if (nemesisMustMove) {
      handleNemesisMoveSelection(position);
      return;
    }

    if (currentPhase !== "action") return;

    // Handle ability modes
    if (abilityMode && selectedCharacter) {
      handleAbilityModeClick(position);
      return;
    }

    // 1. Cek jika klik karakter sendiri → select
    const clickedCharacter = placedCards.find(
      (card) => card.positionId === position.id && card.owner === turn
    );

    if (
      clickedCharacter &&
      !selectedCharacter &&
      !characterActions[clickedCharacter.cardData.type]
    ) {
      // NEMESIS: Tidak bisa bergerak di action phase normal
      if (clickedCharacter.cardData.type === "Nemesis") {
        alert(
          "Nemesis tidak bisa melakukan aksi di action phase. Nemesis hanya bergerak otomatis ketika Leader lawan bergerak!"
        );
        return;
      }

      setSelectedCharacter(clickedCharacter);

      // Calculate and set valid move positions
      // Jika King/Leader, gunakan getLeaderMoves yang support Vizir
      // Jika karakter biasa, gunakan adjacent empty positions
      let validMoves;
      if (clickedCharacter.cardData.type === "king") {
        validMoves = getLeaderMoves(clickedCharacter, placedCards);
      } else {
        const adjacentPositions = getAdjacentPositions(
          clickedCharacter.positionId
        );
        validMoves = adjacentPositions.filter(
          (posId) => !placedCards.find((card) => card.positionId === posId)
        );
      }

      setValidMovePositions(validMoves);

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
      console.log("- Valid move positions:", validMovePositions);
      console.log("- Is valid move:", validMovePositions.includes(position.id));

      // Cek apakah target position ada di validMovePositions
      if (validMovePositions.includes(position.id)) {
        // Special handling for Leader/King
        if (selectedCharacter.cardData.type === "king") {
          if (bonusMoveActive) {
            // Jika ini adalah gerakan kedua (bonus), langsung eksekusi dan selesai
            let finalCards = placedCards.map((card) =>
              card.positionId === selectedCharacter.positionId
                ? { ...card, positionId: position.id }
                : card
            );
            // Cek Nemesis movement lagi untuk gerakan kedua
            finalCards = checkNemesisMovement(turn, finalCards);
            setPlacedCards(finalCards);
            finishCharacterAction(selectedCharacter.cardData.type);
            checkWinCondition();
          } else {
            // Jika ini gerakan pertama, jalankan logika pengecekan Vizir
            handleLeaderMove(selectedCharacter, position.id);
          }
        } else {
          // Normal move untuk karakter lain
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
          setValidMovePositions([]);

          checkWinCondition();
          checkAutoAdvance(newPlacedCards, newActions);
        }
      } else {
        alert("Hanya bisa pindah ke posisi yang valid (ditandai ring biru)!");
      }
    }

    // 3. Jika klik karakter yang sama → deselect
    if (selectedCharacter && clickedCharacter === selectedCharacter) {
      setSelectedCharacter(null);
      setValidMovePositions([]);
    }
  };

  // Handle leader move with Vizir bonus
  // const handleLeaderMove = (leader, targetPos) => {
  //   // 1. Cek keberadaan Vizir (Gunakan helper yang sudah ada)
  //   const hasVizir = SkillHandlers.checkVizirEffect(
  //     leader.positionId,
  //     placedCards,
  //     turn
  //   );

  //   // 2. Hitung jarak menggunakan sistem Cube
  //   const distance = SkillManager.getDistance(leader.positionId, targetPos);

  //   // 3. LOGIKA VALIDASI GERAK
  //   let isValidMove = false;

  //   if (distance === 1) {
  //     // Gerak normal (adjacent) selalu boleh jika target kosong
  //     isValidMove = true;
  //   } else if (hasVizir && distance === 2) {
  //     // Efek Vizir: Boleh 2 langkah, TAPI harus lurus dan tidak terhalang
  //     const isStraight = SkillManager.isStraightLine(
  //       leader.positionId,
  //       targetPos
  //     );
  //     const isVisible = SkillManager.isVisibleInStraightLine(
  //       leader.positionId,
  //       targetPos,
  //       placedCards
  //     );

  //     if (isStraight && isVisible) {
  //       isValidMove = true;
  //     } else if (!isStraight) {
  //       alert("Leader hanya bisa bergerak 2 space dalam GARIS LURUS!");
  //       return;
  //     } else if (!isVisible) {
  //       alert("Gerakan terhalang oleh karakter lain!");
  //       return;
  //     }
  //   } else {
  //     alert("Leader hanya bisa bergerak 1 space (atau 2 space dengan Vizir)!");
  //     return;
  //   }

  //   if (isValidMove) {
  //     const newPlacedCards = placedCards.map((card) =>
  //       card.positionId === leader.positionId
  //         ? { ...card, positionId: targetPos }
  //         : card
  //     );

  //     setPlacedCards(newPlacedCards);
  //     const newActions = {
  //       ...characterActions,
  //       [leader.cardData.type]: true,
  //     };

  //     setCharacterActions(newActions);
  //     setSelectedCharacter(null);
  //     setValidMovePositions([]);

  //     // Check for Nemesis movement
  //     checkNemesisMovement(leader, targetPos);

  //     setTimeout(() => checkWinCondition(), 100);
  //     checkAutoAdvance(newPlacedCards, newActions);
  //   }
  // };
  const handleLeaderMove = (leader, targetPos) => {
    // 1. Validasi awal: Gerakan pertama harus berjarak 1 (Adjacent)
    const distance = SkillManager.getDistance(leader.positionId, targetPos);

    if (distance !== 1) {
      alert("Leader hanya bisa bergerak 1 petak per langkah.");
      return;
    }

    // 2. Eksekusi Gerakan Pertama
    let updatedPlacedCards = placedCards.map((card) =>
      card.positionId === leader.positionId
        ? { ...card, positionId: targetPos }
        : card
    );

    // 3. Cek Nemesis movement (Nemesis lawan bergerak ketika Leader kita bergerak)
    updatedPlacedCards = checkNemesisMovement(turn, updatedPlacedCards);

    setPlacedCards(updatedPlacedCards);

    // 3. Cek Efek Vizir untuk Gerakan Tambahan
    const hasVizir = SkillHandlers.checkVizirEffect(
      targetPos,
      updatedPlacedCards,
      turn
    );

    if (hasVizir) {
      // Beri jeda sedikit agar render posisi pertama selesai terlihat oleh pemain
      setTimeout(() => {
        const mauLanjut = window.confirm(
          "Vizir aktif! Apakah Leader ingin bergerak 1 petak lagi?"
        );

        if (mauLanjut) {
          // TAHAP 2: Jika "Ya", jangan akhiri turn dulu.
          // Update selectedCharacter ke posisi baru dan cari petak adjacent lagi.
          const leaderBaru = { ...leader, positionId: targetPos };
          setSelectedCharacter(leaderBaru);

          // Cari petak kosong di sekitar posisi baru
          const adjacentBaru = SkillManager.getAdjacentPositions(
            targetPos
          ).filter(
            (pos) => !updatedPlacedCards.some((c) => c.positionId === pos)
          );

          setValidMovePositions(adjacentBaru);

          // Kita set sebuah flag (state) agar gerakan selanjutnya dianggap sebagai gerakan terakhir
          setBonusMoveActive(true);
        } else {
          // Jika "Tidak", akhiri aksi Leader
          finishCharacterAction(leader.cardData.type);
        }
      }, 100);
    } else {
      // Jika tidak ada Vizir, langsung akhiri aksi
      finishCharacterAction(leader.cardData.type);
    }
  };

  // Check if Nemesis needs to move when opponent Leader moves
  const checkNemesisMovement = (leaderOwner, currentPlacedCards) => {
    // Nemesis milik lawan yang akan bergerak
    const nemesisOwner = leaderOwner === "player" ? "enemy" : "player";

    const nemesis = currentPlacedCards.find(
      (p) => p.cardData.type === "Nemesis" && p.owner === nemesisOwner
    );

    if (!nemesis) return currentPlacedCards;

    // Cari posisi Leader lawan (yang baru saja bergerak)
    const opponentLeader = currentPlacedCards.find(
      (p) => p.isKing && p.owner === leaderOwner
    );

    if (!opponentLeader) return currentPlacedCards;

    console.log("🎯 NEMESIS INTERRUPT TRIGGER:");
    console.log("- Current turn:", leaderOwner);
    console.log("- Nemesis owner:", nemesisOwner);
    console.log("- Nemesis position:", nemesis.positionId);

    // Hitung valid positions untuk Nemesis (semua arah)
    const nemesisMovement = SkillManager.calculateNemesisMovement(
      nemesis.positionId,
      opponentLeader.positionId,
      currentPlacedCards,
      SkillConstants.BOARD_CONFIG
    );

    console.log("- Valid positions:", nemesisMovement.validPositions);
    console.log("- Can move:", nemesisMovement.canMove);

    if (!nemesisMovement.canMove) {
      console.log("Nemesis tidak bisa bergerak!");
      setTimeout(() => {
        alert("⚔️ Nemesis tidak bisa bergerak karena tidak ada posisi valid!");
      }, 100);
      return currentPlacedCards;
    }

    // Pemain memilih posisi dari yang valid
    // validPositions sudah berisi posisi 2 langkah (prioritas) atau 1 langkah jika 2 tidak ada
    const selectablePositions = nemesisMovement.validPositions;

    console.log("📤 Setting Nemesis highlights:");
    console.log("- Positions to highlight:", nemesisMovement.validPositions);
    console.log("- Array:", nemesisMovement.validPositions);
    console.log("- First position:", nemesisMovement.validPositions[0]);
    console.log(
      "- Is array valid?",
      Array.isArray(nemesisMovement.validPositions)
    );

    // Set state untuk INTERRUPT - pemilik Nemesis memilih posisi
    // Turn tidak berubah, ini hanya interrupt sementara
    setNemesisMustMove({
      nemesis,
      validPositions: selectablePositions,
      pendingCards: currentPlacedCards,
      owner: nemesisOwner,
      originalTurn: leaderOwner, // Simpan turn asli untuk referensi
    });
    setValidMovePositions(selectablePositions);

    setTimeout(() => {
      const moveType =
        nemesisMovement.twoSpacePositions.length > 0 ? "2 petak" : "1 petak";
      const ownerName = nemesisOwner === "player" ? "PLAYER" : "ENEMY";
      alert(
        `⚔️ INTERRUPT! ${ownerName}'s Nemesis harus bergerak ${moveType}!\n\n` +
          `Giliran ${ownerName} untuk memilih posisi Nemesis.`
      );
    }, 100);

    return currentPlacedCards; // Return unchanged, akan diupdate setelah pemain memilih
  };

  // Handler ketika pemain memilih posisi untuk Nemesis
  const handleNemesisMoveSelection = (position) => {
    if (!nemesisMustMove) return;

    const { nemesis, validPositions, pendingCards, owner } = nemesisMustMove;

    if (!validPositions.includes(position.id)) {
      alert("Posisi tidak valid! Pilih posisi yang di-highlight.");
      return;
    }

    // Pindahkan Nemesis
    const newPlacedCards = pendingCards.map((card) =>
      card.positionId === nemesis.positionId
        ? { ...card, positionId: position.id }
        : card
    );

    console.log(
      `✅ Nemesis (${owner}) bergerak ke ${position.id} (dipilih pemain)`
    );

    setPlacedCards(newPlacedCards);
    setNemesisMustMove(null);
    setValidMovePositions([]);
    setAbilityMode(null);

    setTimeout(() => {
      if (bonusMoveActive && selectedCharacter?.cardData.type === "king") {
        console.log("⏩ Continuing Vizir bonus move...");
      } else {
        if (selectedCharacter?.cardData.type === "king") {
          finishCharacterAction("king");
        }
      }
      checkWinCondition();
    }, 100);
  };

  // Handle ability mode clicks
  const handleAbilityModeClick = (position) => {
    const config = SkillConstants.BOARD_CONFIG;

    switch (abilityMode) {
      case "acrobate_jump":
        handleAcrobateJumpMode(position, config);
        break;
      case "cavalier_move":
        handleCavalierMoveMode(position);
        break;
      case "cogneur_select_enemy":
        handleCogneurSelectEnemy(position, config);
        break;
      case "cogneur_select_push":
        handleCogneurSelectPush(position);
        break;
      case "garde_teleport":
        handleGardeTeleport(position, config);
        break;
      case "garde_additional_move":
        handleGardeAdditionalMove(position);
        break;
      case "lance_select_target":
        handleLanceSelectTarget(position, config);
        break;
      case "lance_select_option":
        handleLanceSelectOption(position, config);
        break;
      case "manipulator_select_target":
        handleManipulatorSelectTarget(position, config);
        break;
      case "manipulator_select_move":
        handleManipulatorSelectMove(position);
        break;
      case "rodeuse_move":
        handleRodeuseMove(position);
        break;
      case "tavernier_select_ally":
        handleTavernierSelectAlly(position, config);
        break;
      case "tavernier_select_move":
        handleTavernierSelectMove(position);
        break;
      case "illusionist_select_target":
        handleIllusionistSelectTarget(position);
        break;
      default:
        break;
    }
  };

  // Ability mode handlers
  const handleAcrobateJumpMode = (position, config) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi jump yang valid!");
      return;
    }

    const result = SkillHandlers.executeAcrobateJump(
      selectedCharacter,
      position.id,
      placedCards,
      abilityData,
      config
    );

    setPlacedCards(result.newPlacedCards);
    setSelectedCharacter({ ...selectedCharacter, positionId: position.id });
    setAbilityData(result.abilityData);

    if (result.shouldContinue) {
      // Ask if want to jump again
      const jumpAgain = window.confirm(
        `Jump ${result.abilityData.jumpCount}/2 selesai. Lakukan jump lagi?`
      );

      if (jumpAgain) {
        setValidMovePositions(result.nextValidPositions);
        return;
      }
    }

    finishAbility(selectedCharacter.cardData.type);
  };

  const handleCavalierMoveMode = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi 2 space yang valid!");
      return;
    }

    const newPlacedCards = placedCards.map((card) =>
      card.positionId === selectedCharacter.positionId
        ? { ...card, positionId: position.id }
        : card
    );
    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleCogneurSelectEnemy = (position, config) => {
    const enemy = placedCards.find(
      (c) => c.positionId === position.id && c.owner !== turn
    );
    if (!enemy) {
      alert("Pilih musuh adjacent!");
      return;
    }

    const pushPositions = SkillManager.getCogneurPushPositions(
      selectedCharacter.positionId,
      position.id,
      placedCards,
      config
    );

    if (pushPositions.length === 0) {
      alert("Tidak ada ruang untuk push musuh!");
      resetAbilityMode();
      return;
    }

    setAbilityMode("cogneur_select_push");
    setValidMovePositions(pushPositions);
    setAbilityData({ targetEnemy: position.id });
  };

  const handleCogneurSelectPush = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi push yang valid!");
      return;
    }

    const newPlacedCards = SkillHandlers.executeCogneurPush(
      selectedCharacter.positionId,
      abilityData.targetEnemy,
      position.id,
      placedCards,
      SkillConstants.BOARD_CONFIG
    );

    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleGardeTeleport = (position, config) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi adjacent ke Leader!");
      return;
    }

    const result = SkillHandlers.executeGardeRoyalTeleport(
      selectedCharacter,
      position.id,
      placedCards,
      config
    );

    setPlacedCards(result.newPlacedCards);
    setSelectedCharacter({ ...selectedCharacter, positionId: position.id });

    if (result.canMoveAgain) {
      const moveAgain = window.confirm("Ingin bergerak 1 space tambahan?");
      if (moveAgain) {
        setAbilityMode("garde_additional_move");
        setValidMovePositions(result.additionalMovePositions);
        return;
      }
    }

    finishAbility(selectedCharacter.cardData.type);
  };

  const handleGardeAdditionalMove = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi adjacent!");
      return;
    }

    const newPlacedCards = placedCards.map((card) =>
      card.positionId === selectedCharacter.positionId
        ? { ...card, positionId: position.id }
        : card
    );
    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleLanceSelectTarget = (position, config) => {
    // Validate that selected position is in valid targets (must be in straight line)
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih karakter yang valid");
      return;
    }

    const target = placedCards.find((c) => c.positionId === position.id);
    if (!target) {
      alert("Pilih karakter target!");
      return;
    }

    // Langsung tanya opsi setelah select target
    const shouldMoveToTarget = window.confirm(
      "Pilih aksi:\nOK - Pindah dekat target (Lance moves next to enemy)\nCancel - Tarik target jadi adjacent (Pull enemy close)"
    );

    // Execute langsung
    const newPlacedCards = SkillHandlers.executeLanceGrappin(
      selectedCharacter.positionId,
      position.id,
      shouldMoveToTarget,
      placedCards,
      config
    );

    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleLanceSelectOption = (position, config) => {
    // Fungsi ini tidak digunakan lagi karena sudah dihandle di handleLanceSelectTarget
    const shouldMoveToTarget = window.confirm(
      "Pilih aksi:\nOK - Pindah dekat target (Lance moves next to enemy)\nCancel - Tarik target jadi adjacent (Pull enemy close)"
    );

    const newPlacedCards = SkillHandlers.executeLanceGrappin(
      selectedCharacter.positionId,
      abilityData.target,
      shouldMoveToTarget,
      placedCards,
      config
    );

    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleManipulatorSelectTarget = (position, config) => {
    // Validate that selected position is in valid targets (must be in straight line)
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih musuh yang berada dalam 1 garis lurus!");
      return;
    }

    const target = placedCards.find(
      (c) => c.positionId === position.id && c.owner !== turn
    );
    if (!target) {
      alert("Pilih musuh target!");
      return;
    }

    // Calculate possible move directions (1 space)
    const adjacentToTarget = SkillManager.getAdjacentPositions(
      position.id,
      config
    );
    const emptyAdjacent = adjacentToTarget.filter(
      (pos) => !placedCards.find((c) => c.positionId === pos)
    );

    if (emptyAdjacent.length === 0) {
      alert("Tidak ada space kosong adjacent ke target!");
      setAbilityMode(null);
      setValidMovePositions([]);
      return;
    }

    setAbilityMode("manipulator_select_move");
    setValidMovePositions(emptyAdjacent);
    setAbilityData({ target: position.id });
  };

  const handleManipulatorSelectMove = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi adjacent kosong!");
      return;
    }

    // Move target to selected position
    const newPlacedCards = placedCards.map((card) =>
      card.positionId === abilityData.target
        ? { ...card, positionId: position.id }
        : card
    );
    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleRodeuseMove = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi non-adjacent ke musuh!");
      return;
    }

    const newPlacedCards = placedCards.map((card) =>
      card.positionId === selectedCharacter.positionId
        ? { ...card, positionId: position.id }
        : card
    );
    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleTavernierSelectAlly = (position, config) => {
    // Validasi: Pastikan posisi yang diklik ada di validMovePositions (adjacent ke Tavernier)
    if (!validMovePositions.includes(position.id)) {
      console.log("Karakter ini terlalu jauh dari Tavernier!");
      return;
    }

    const ally = placedCards.find(
      (c) => c.positionId === position.id && c.owner === turn
    );
    if (!ally) {
      alert("Pilih sekutu adjacent!");
      return;
    }

    // Calculate possible move positions for ally
    const adjacentToAlly = SkillManager.getAdjacentPositions(
      position.id,
      config
    );
    const emptyAdjacent = adjacentToAlly.filter(
      (pos) =>
        !placedCards.find((c) => c.positionId === pos) &&
        pos !== selectedCharacter.positionId
    );

    if (emptyAdjacent.length === 0) {
      alert("Tidak ada space kosong untuk pindahkan sekutu!");
      setAbilityMode(null);
      setValidMovePositions([]);
      return;
    }

    setAbilityMode("tavernier_select_move");
    setValidMovePositions(emptyAdjacent);
    setAbilityData({ ally: position.id });
  };

  const handleTavernierSelectMove = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("Pilih posisi adjacent kosong!");
      return;
    }

    // Move ally to selected position
    const newPlacedCards = placedCards.map((card) =>
      card.positionId === abilityData.ally
        ? { ...card, positionId: position.id }
        : card
    );
    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  const handleIllusionistSelectTarget = (position) => {
    if (!validMovePositions.includes(position.id)) {
      alert("❌ Pilih karakter yang valid (dengan highlight PURPLE)!");
      return;
    }
    const target = placedCards.find((c) => c.positionId === position.id);
    if (!target) {
      alert("Pilih karakter target!");
      return;
    }

    const newPlacedCards = SkillHandlers.executeIllusionistSwitch(
      selectedCharacter.positionId,
      position.id,
      placedCards
    );

    setPlacedCards(newPlacedCards);
    finishAbility(selectedCharacter.cardData.type);
  };

  // Helper function to finish ability
  const finishAbility = (characterType) => {
    setActiveAbilityUsed({
      ...activeAbilityUsed,
      [characterType]: true,
    });

    setCharacterActions({
      ...characterActions,
      [characterType]: true,
    });

    resetAbilityMode();
    checkWinCondition();
    checkAutoAdvance();
  };

  const resetAbilityMode = () => {
    setAbilityMode(null);
    setValidMovePositions([]);
    setAbilityData({});
    setSelectedCharacter(null);
  };

  const checkAutoAdvance = (
    newPlacedCards = placedCards,
    newActions = characterActions
  ) => {
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
  };

  // Handler untuk menempatkan Ourson setelah VieilOurs
  const handleOursonPlacement = (position) => {
    if (!pendingOurson) return;

    // Cek apakah posisi valid (recruitment space di zona sendiri)
    const recruitmentSpaces =
      SkillConstants.RECRUITMENT_SPACES[
        pendingOurson.owner === "player" ? "player" : "enemy"
      ];

    if (!recruitmentSpaces.includes(position.id)) {
      alert("Ourson hanya bisa ditempatkan di recruitment space zona sendiri!");
      return;
    }

    // Cek apakah posisi kosong
    const isOccupied = placedCards.find((p) => p.positionId === position.id);
    if (isOccupied) {
      alert("Posisi sudah terisi!");
      return;
    }

    // Tempatkan Ourson
    const oursonImage = `/Assets/Pions_personnages/${
      pendingOurson.color === "white" ? "Blanc" : "Noir"
    }/Leaders_BGA_${
      pendingOurson.color === "white" ? "white" : "black"
    }_Ourson.png`;

    const newPlacedCards = [
      ...placedCards,
      {
        positionId: position.id,
        cardImage: oursonImage,
        cardData: { type: "Ourson" }, // Ourson sebagai tipe khusus
        owner: pendingOurson.owner,
        isKing: false,
        isOurson: true, // Flag khusus untuk identifikasi
      },
    ];

    setPlacedCards(newPlacedCards);
    setPendingOurson(null);

    // Reset recruitment phase
    setRecruitmentPhase({
      selectingCard: true,
      selectedRecruitmentCard: null,
      selectingPosition: false,
    });

    // Cek apakah pemain kedua masih punya recruitment tambahan
    if (turn !== firstTurn && recruitmentCount > 1) {
      // Masih ada recruitment tambahan untuk pemain kedua
      setRecruitmentCount((prev) => prev - 1);
    } else {
      // Auto lanjut ke end turn setelah recruitment selesai
      setTimeout(() => {
        handleEndTurn();
      }, 500);
    }
  };

  // Handler untuk pilih posisi di recruitment phase
  const handleRecruitmentPositionSelect = (position) => {
    const { selectedRecruitmentCard } = recruitmentPhase;

    if (!selectedRecruitmentCard) return;

    // Cek apakah posisi valid (recruitment space di zona sendiri)
    const recruitmentSpaces =
      SkillConstants.RECRUITMENT_SPACES[turn === "player" ? "player" : "enemy"];

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

    // Shuffle available cards untuk randomisasi lebih baik
    finalAvailableCards = finalAvailableCards.sort(() => Math.random() - 0.5);

    setPlacedCards(newPlacedCards);
    setAvailableCards(finalAvailableCards);
    setDeck(finalDeck);

    // CEK: Jika karakter yang direkrut adalah VieilOurs
    if (selectedRecruitmentCard.type === "VieilOurs") {
      // Set state untuk menempatkan Ourson
      setPendingOurson({
        owner: turn,
        color: color,
      });
      // Tetap di mode pilih posisi tapi sekarang untuk Ourson
      setRecruitmentPhase({
        selectingCard: false,
        selectedRecruitmentCard: null,
        selectingPosition: true, // Tetap true untuk place Ourson
      });
      return; // Jangan lanjut ke end turn dulu
    }

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

  const checkWinCondition = () => {
    const playerKing = placedCards.find(
      (p) => p.owner === "player" && p.isKing
    );
    const enemyKing = placedCards.find((p) => p.owner === "enemy" && p.isKing);

    console.log("👑 WIN CONDITION CHECK:");
    console.log("- Player King:", playerKing?.positionId);
    console.log("- Enemy King:", enemyKing?.positionId);

    // Check Assassin capture
    const checkAssassin = (king, attackerOwner) => {
      if (!king) return false;
      return SkillHandlers.checkAssassinCapture(
        king.positionId,
        placedCards,
        attackerOwner,
        SkillConstants.BOARD_CONFIG
      );
    };

    // Check Archer capture
    const checkArcher = (king, attackerOwner) => {
      if (!king) return false;
      return SkillHandlers.checkArcherCapture(
        king.positionId,
        placedCards,
        attackerOwner,
        SkillConstants.BOARD_CONFIG
      );
    };

    // Check normal capture
    const checkNormalCapture = (king, attackerOwner) => {
      if (!king) return false;
      return SkillHandlers.checkNormalCapture(
        king.positionId,
        placedCards,
        attackerOwner,
        SkillConstants.BOARD_CONFIG
      );
    };

    // Check surrounded
    const checkSurrounded = (kingPos) => {
      if (!kingPos) return false;
      return SkillHandlers.checkSurrounded(
        kingPos,
        placedCards,
        SkillConstants.BOARD_CONFIG
      );
    };

    // Check Player King (Enemy wins)
    if (playerKing) {
      if (checkAssassin(playerKing, "enemy")) {
        setGameOver({
          winner: "enemy",
          reason: "Leader Player ditangkap oleh Assassin!",
        });
        return;
      }

      if (checkArcher(playerKing, "enemy")) {
        setGameOver({
          winner: "enemy",
          reason: "Leader Player ditangkap dengan bantuan Archer!",
        });
        return;
      }

      if (checkNormalCapture(playerKing, "enemy")) {
        setGameOver({ winner: "enemy", reason: "Leader Player ditangkap!" });
        return;
      }

      if (checkSurrounded(playerKing.positionId)) {
        setGameOver({ winner: "enemy", reason: "Leader Player terkepung!" });
        return;
      }
    }

    // Check Enemy King (Player wins)
    if (enemyKing) {
      if (checkAssassin(enemyKing, "player")) {
        setGameOver({
          winner: "player",
          reason: "Leader Enemy ditangkap oleh Assassin!",
        });
        return;
      }

      if (checkArcher(enemyKing, "player")) {
        setGameOver({
          winner: "player",
          reason: "Leader Enemy ditangkap dengan bantuan Archer!",
        });
        return;
      }

      if (checkNormalCapture(enemyKing, "player")) {
        setGameOver({ winner: "player", reason: "Leader Enemy ditangkap!" });
        return;
      }

      if (checkSurrounded(enemyKing.positionId)) {
        setGameOver({ winner: "player", reason: "Leader Enemy terkepung!" });
        return;
      }
    }
  };

  // Handler untuk kembali ke Menu setelah game over
  const handleBackToMenu = () => {
    navigate("/");
  };

  // === PLACEMENT PHASE HANDLER ===
  const handlePositionClick = (position) => {
    if (gamePhase === "placement") {
      // Existing placement logic
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
        (p) => p.owner === turn && !p.isKing && !p.isOurson // Ourson tidak dihitung
      ).length;

      // Max selalu 4 karakter recruited (VieilOurs + Ourson dihitung 1)
      const maxCharacters = 4;

      if (deployedCount >= maxCharacters) {
        alert(
          `Maksimal ${maxCharacters} character recruited (tidak termasuk king)!`
        );
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

      // Shuffle available cards untuk randomisasi lebih baik
      finalAvailableCards = finalAvailableCards.sort(() => Math.random() - 0.5);

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
        // CEK: Jika sedang menempatkan Ourson
        if (pendingOurson) {
          handleOursonPlacement(position);
        } else {
          // Battle phase - recruitment phase (pilih posisi)
          handleRecruitmentPositionSelect(position);
        }
      }
    }
  };

  return (
    <div className="arena-container" onClick={handleUserInteraction}>
      <audio ref={audioRef} loop>
        <source src="/medieval-kingdom-loop-366815.mp3" type="audio/mpeg" />
      </audio>

      <div className="arena-background"></div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 border-4 border-yellow-500 rounded-2xl p-8 max-w-md text-center shadow-2xl">
            {/* Crown Icon */}
            <div className="text-6xl mb-4">👑</div>

            {/* Winner Announcement */}
            <h1 className="text-4xl font-bold mb-4 text-yellow-400">
              🎉 GAME OVER 🎉
            </h1>

            {/* Winner Color */}
            <h2 className="text-3xl font-bold mb-4">
              {gameOver.winner === "player" ? (
                <span
                  className={
                    playerColor === "white" ? "text-white" : "text-gray-400"
                  }
                >
                  {playerColor === "white" ? "⚪ WHITE" : "⚫ BLACK"} WINS!
                </span>
              ) : (
                <span
                  className={
                    enemyColor === "white" ? "text-white" : "text-gray-400"
                  }
                >
                  {enemyColor === "white" ? "⚪ WHITE" : "⚫ BLACK"} WINS!
                </span>
              )}
            </h2>

            {/* Reason */}
            <p className="text-gray-300 text-lg mb-6">{gameOver.reason}</p>

            {/* Back to Menu Button */}
            <button
              onClick={handleBackToMenu}
              className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold text-xl rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🏠 Kembali ke Menu
            </button>
          </div>
        </div>
      )}

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
          disabled={gamePhase === "battle" && currentPhase === "action"}
        />
      </div>

      <GameBoard
        placedCards={placedCards}
        selectedCard={selectedCard}
        selectedCharacter={selectedCharacter}
        turn={turn}
        gamePhase={gamePhase}
        onPositionClick={handlePositionClick}
        recruitmentPhase={recruitmentPhase}
        activeAbilityUsed={activeAbilityUsed}
        validMovePositions={validMovePositions}
        abilityMode={abilityMode}
      />

      <div className="absolute top-4 translate-x-150 z-20 bg-black/80 px-6 py-3 rounded-lg border-2 border-yellow-400">
        <p className="text-yellow-300 text-lg font-bold">
          {gamePhase === "placement" &&
            `⚔️ Character Placement - ${
              turn === "player" ? "Player" : "Enemy"
            } Turn`}
          {gamePhase === "battle" && nemesisMustMove && (
            <span className="text-red-400">
              ⚔️ NEMESIS INTERRUPT! -{" "}
              {nemesisMustMove.owner === "player" ? "PLAYER" : "ENEMY"} pilih
              posisi Nemesis
            </span>
          )}
          {gamePhase === "battle" &&
            !nemesisMustMove &&
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
            {/* Ability Mode Indicator */}
            {abilityMode && (
              <div className="mb-2 p-2 bg-purple-900/60 border border-purple-400 rounded">
                <p className="text-purple-300 text-sm font-bold">
                  {abilityMode === "acrobate_jump" && "🤸 Acrobate Jump Mode"}
                  {abilityMode === "cavalier_move" &&
                    "♟️ Cavalier 2-Space Move"}
                  {abilityMode === "cogneur_select_enemy" &&
                    "💥 Cogneur - Select Enemy"}
                  {abilityMode === "cogneur_select_push" &&
                    "💥 Cogneur - Select Push Direction"}
                  {abilityMode === "garde_teleport" &&
                    "🛡️ Garde Royal - Teleport"}
                  {abilityMode === "garde_additional_move" &&
                    "🛡️ Garde Royal - Additional Move"}
                  {abilityMode === "lance_select_target" &&
                    "🎣 Lance Grappin - Select Target"}
                  {abilityMode === "lance_select_option" &&
                    "🎣 Lance Grappin - Select Action"}
                  {abilityMode === "manipulator_select_target" &&
                    "🌀 Manipulator - Select Target"}
                  {abilityMode === "manipulator_select_move" &&
                    "🌀 Manipulator - Select Move"}
                  {abilityMode === "rodeuse_move" &&
                    "👣 Rodeuse - Select Position"}
                  {abilityMode === "tavernier_select_ally" &&
                    "🍺 Tavernier - Select Ally"}
                  {abilityMode === "tavernier_select_move" &&
                    "🍺 Tavernier - Select Move"}
                  {abilityMode === "illusionist_select_target" &&
                    "🔮 Illusionist - Select Target"}
                </p>
                <p className="text-purple-200 text-xs">
                  Click posisi yang valid (ditandai dengan ring biru)
                </p>
              </div>
            )}

            {selectedCharacter && !abilityMode && (
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
              !abilityMode &&
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
            {!abilityMode && (
              <button
                onClick={handleEndActionPhase}
                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-lg border-2 border-yellow-400 shadow-lg transition-all duration-300 hover:scale-105"
              >
                End Action Phase
              </button>
            )}
          </div>
        )}

        {gamePhase === "battle" && currentPhase === "recruitment" && (
          <div className="mt-2">
            {recruitmentPhase.selectingPosition ? (
              <p className="text-green-400 text-sm">
                {pendingOurson
                  ? "🐻 Tempatkan Ourson di recruitment space (lingkaran emas)"
                  : `Pilih posisi di recruitment space (lingkaran emas) untuk menempatkan ${recruitmentPhase.selectedRecruitmentCard?.type}`}
              </p>
            ) : (
              <p className="text-blue-400 text-sm">
                {placedCards.filter((p) => p.owner === turn).length >= 5
                  ? "Max characters reached - Auto skipping..."
                  : "Pilih kartu untuk recruit"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="absolute right-8 top-3/5 -translate-y-1/2 z-10">
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
