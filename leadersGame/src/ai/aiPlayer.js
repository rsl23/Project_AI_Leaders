// ============================================
// AI PLAYER MODULE
// Handles AI decision making for enemy turn
// Extracted from ArenaVsAi.jsx
// ============================================

import * as SkillManager from "../skill/skillManager";
import * as SkillHandlers from "../skill/skillHandlers";
import * as SkillConstants from "../skill/skillConstants";

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get adjacent positions helper
const getAdjacentPositions = (positionId) => {
  return SkillManager.getAdjacentPositions(
    positionId,
    SkillConstants.BOARD_CONFIG
  );
};

// Get leader moves (adjacent empty positions)
const getLeaderMoves = (leader, placedCards) => {
  const adjacentPositions = getAdjacentPositions(leader.positionId);
  const emptyAdjacent = adjacentPositions.filter(
    (posId) => !placedCards.find((card) => card.positionId === posId)
  );
  return emptyAdjacent;
};

// BFS shortest path distance treating occupied positions as walls (except target)
const getPathDistance = (start, target, placedCards) => {
  const occupied = new Set(placedCards.map((p) => p.positionId));
  const queue = [[start, 0]];
  const seen = new Set([start]);
  while (queue.length > 0) {
    const [pos, dist] = queue.shift();
    if (pos === target) return dist;
    const neighbors =
      SkillManager.getAdjacentPositions(pos, SkillConstants.BOARD_CONFIG) || [];
    for (const n of neighbors) {
      if (seen.has(n)) continue;
      // allow stepping onto target even if occupied (capture), otherwise neighbor must be empty
      if (n !== target && occupied.has(n)) continue;
      seen.add(n);
      queue.push([n, dist + 1]);
    }
  }
  return Infinity;
};

// ============================================
// AI ACTION PHASE
// ============================================
// Evaluation constants
// Algoritma Minimax dengan Alpha-Beta Pruning

// Bobot Nilai Karakter (Material Value)
const VALUE_KING = 1000000;
const VALUE_ASSASSIN = 1200;
const VALUE_ARCHER = 1100;
const VALUE_PROTECTOR = 900;
const VALUE_JAILER = 800;
const VALUE_STANDARD = 500;

// Bobot Kondisi Papan
const BONUS_CAPTURE_THREAT = 5000; // Jika dalam posisi siap menang
const PENALTY_KING_DANGER = -4000; // Jika King terancam

const evaluateState = (cards, aiOwner) => {
  const playerOwner = aiOwner === "enemy" ? "player" : "enemy";
  let score = 0;

  const enemyKing = cards.find((p) => p.owner === aiOwner && p.isKing);
  const playerKing = cards.find((p) => p.owner === playerOwner && p.isKing);

  // 1. Cek Game Over Langsung
  if (!playerKing) return 2000000; // AI Menang Mutlak
  if (!enemyKing) return -2000000; // AI Kalah Mutlak

  cards.forEach((card) => {
    const isAI = card.owner === aiOwner;
    const multiplier = isAI ? 1 : -1;
    let cardValue = VALUE_STANDARD;

    // A. Material Score berdasarkan tipe di PDF
    const type = card.cardData?.type;
    if (type === "Assassin") cardValue = VALUE_ASSASSIN;
    else if (type === "Archer") cardValue = VALUE_ARCHER;
    else if (type === "Protector") cardValue = VALUE_PROTECTOR;
    else if (type === "Geolier") cardValue = VALUE_JAILER;
    else if (card.isKing) cardValue = 10000; // Bobot posisi king

    score += cardValue * multiplier;

    // B. Proximity Score (Mendekati Leader Lawan)
    const targetKing = isAI ? playerKing : enemyKing;
    const dist = SkillManager.getDistance(
      card.positionId,
      targetKing.positionId
    );

    // Memberi reward jika mendekati King musuh
    if (dist > 0) {
      score += (12 - dist) * 15 * multiplier;
    }

    // C. Cek Ancaman Menang (Sesuai Aturan PDF)
    try {
      if (isAI) {
        // Jika AI bisa menangkap King Player di state ini
        if (
          SkillHandlers.checkAssassinCapture(
            playerKing.positionId,
            cards,
            aiOwner,
            SkillConstants.BOARD_CONFIG
          ) ||
          SkillHandlers.checkArcherCapture(
            playerKing.positionId,
            cards,
            aiOwner,
            SkillConstants.BOARD_CONFIG
          ) ||
          SkillHandlers.checkNormalCapture(
            playerKing.positionId,
            cards,
            aiOwner,
            SkillConstants.BOARD_CONFIG
          )
        ) {
          score += BONUS_CAPTURE_THREAT;
        }
      } else {
        // Jika Player bisa menangkap King AI di state ini
        if (
          SkillHandlers.checkAssassinCapture(
            enemyKing.positionId,
            cards,
            playerOwner,
            SkillConstants.BOARD_CONFIG
          ) ||
          SkillHandlers.checkArcherCapture(
            enemyKing.positionId,
            cards,
            playerOwner,
            SkillConstants.BOARD_CONFIG
          ) ||
          SkillHandlers.checkNormalCapture(
            enemyKing.positionId,
            cards,
            playerOwner,
            SkillConstants.BOARD_CONFIG
          )
        ) {
          score -= BONUS_CAPTURE_THREAT;
        }
      }
    } catch (e) {
      /* ignore calculation errors */
    }

    // D. Sinergi Pertahanan (Protector di sebelah King)
    if (type === "Protector") {
      const distToOwnKing = SkillManager.getDistance(
        card.positionId,
        (isAI ? enemyKing : playerKing).positionId
      );
      if (distToOwnKing === 1) score += 300 * multiplier;
    }
  });

  return score;
};

const getSimulatedMoves = (cards, currentTurn) => {
  const moves = [];
  const currentPieces = cards.filter((p) => p.owner === currentTurn);

  currentPieces.forEach((piece) => {
    let validPositions = [];
    const type = piece.cardData.type;

    try {
      // Tambahkan pengecekan skill yang bisa disimulasikan sebagai pergerakan
      if (type === "Cavalier") {
        validPositions = SkillManager.getCavalierValidMoves(
          piece.positionId,
          cards
        );
      } else if (type === "Rodeuse") {
        validPositions = SkillManager.getRodeuseValidMoves(
          piece.positionId,
          cards,
          currentTurn
        );
      } else if (piece.isKing) {
        // Gunakan fungsi getLeaderMoves yang sudah kamu buat
        validPositions = getLeaderMoves(piece, cards);
      } else {
        // Gerakan standar adjacent
        validPositions = SkillManager.getAdjacentPositions(
          piece.positionId
        ).filter((pos) => !cards.find((c) => c.positionId === pos));
      }
    } catch (e) {
      validPositions = [];
    }

    validPositions.forEach((pos) => {
      moves.push({ charType: type, from: piece.positionId, to: pos });
    });
  });
  return moves;
};

// Fungsi pembantu untuk membuat "bayangan" papan baru
const applyMove = (cards, move) => {
  return cards.map((c) =>
    c.positionId === move.from ? { ...c, positionId: move.to } : c
  );
};

const minimax = (cards, depth, alpha, beta, isMaximizing, aiOwner) => {
  // Base case: Kedalaman habis atau ada yang menang
  if (depth === 0) return evaluateState(cards, aiOwner);

  const currentTurn = isMaximizing
    ? aiOwner
    : aiOwner === "enemy"
    ? "player"
    : "enemy";
  const moves = getSimulatedMoves(cards, currentTurn);

  if (moves.length === 0) return evaluateState(cards, aiOwner);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(cards, move);
      const ev = minimax(nextBoard, depth - 1, alpha, beta, false, aiOwner);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break; // Pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(cards, move);
      const ev = minimax(nextBoard, depth - 1, alpha, beta, true, aiOwner);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break; // Pruning
    }
    return minEval;
  }
};

/////////////////////////////////////////////////////////////////////////
// AI ACTION PHASE
/////////////////////////////////////////////////////////////////////////

// action phase lama menggunakan greedy pathfinding
// export const aiActionPhase = ({
//   // State
//   placedCards,
//   characterActions,
//   // Setters
//   setPlacedCards,
//   setCharacterActions,
//   setSelectedCharacter,
//   setValidMovePositions,
//   setCurrentPhase,
//   // Refs
//   aiThinking,
//   setAiBusy,
//   // Callbacks
//   checkSkipRecruitment,
// }) => {
//   // Find enemy characters that haven't acted (include king)
//   const enemies = placedCards.filter(
//     (p) => p.owner === "enemy" && !characterActions[p.cardData.type]
//   );

//   if (enemies.length === 0) {
//     // No enemies to act -> go to recruitment
//     setCurrentPhase("recruitment");
//     checkSkipRecruitment();
//     aiThinking.current = false;
//     setAiBusy(false);
//     return;
//   }

//   // Choose a random available enemy to act (including king) to vary behavior
//   const enemy = enemies[Math.floor(Math.random() * enemies.length)];

//   // Compute valid moves depending on character type
//   let validMoves = [];
//   const occupiedPositions = new Set(placedCards.map((p) => p.positionId));

//   try {
//     switch (enemy.cardData.type) {
//       case "Cavalier":
//         validMoves = SkillManager.getCavalierValidMoves(
//           enemy.positionId,
//           placedCards,
//           SkillConstants.BOARD_CONFIG
//         );
//         break;
//       case "Acrobate":
//         // Acrobate moves like normal (adjacent) during action phase; jump is an active ability
//         validMoves = SkillManager.getAdjacentPositions(
//           enemy.positionId,
//           SkillConstants.BOARD_CONFIG
//         ).filter((pos) => !occupiedPositions.has(pos));
//         break;
//       case "Rodeuse":
//         validMoves = SkillManager.getRodeuseValidMoves(
//           enemy.positionId,
//           placedCards,
//           "enemy",
//           SkillConstants.BOARD_CONFIG
//         );
//         break;
//       default:
//         // Default: adjacent empty positions
//         validMoves = SkillManager.getAdjacentPositions(
//           enemy.positionId,
//           SkillConstants.BOARD_CONFIG
//         ).filter((pos) => !occupiedPositions.has(pos));
//         break;
//     }
//   } catch (err) {
//     validMoves = [];
//   }

//   // If enemy is king, allow leader moves (1-step adjacent)
//   if (enemy.isKing) {
//     try {
//       validMoves = getLeaderMoves(enemy, placedCards);
//     } catch (e) {
//       // fallback to adjacent
//       validMoves = SkillManager.getAdjacentPositions(
//         enemy.positionId,
//         SkillConstants.BOARD_CONFIG
//       ).filter((pos) => !occupiedPositions.has(pos));
//     }
//   }

//   // If no valid moves, mark as acted and continue
//   if (!validMoves || validMoves.length === 0) {
//     setCharacterActions((prev) => ({ ...prev, [enemy.cardData.type]: true }));
//     aiThinking.current = false;
//     setTimeout(() => setAiBusy(false), 200);
//     return;
//   }

//   // Choose move using an epsilon-greedy approach
//   const playerPositions = placedCards
//     .filter((p) => p.owner === "player")
//     .map((p) => p.positionId);

//   const evaluateMove = (move) => {
//     // lower is better
//     let base = 0;
//     if (playerPositions.length === 0) base = 0;
//     else {
//       const dists = playerPositions.map((pp) =>
//         getPathDistance(move, pp, placedCards)
//       );
//       base = Math.min(...dists);
//     }

//     // simulate the placement after move
//     const simulated = placedCards.map((p) =>
//       p.positionId === enemy.positionId ? { ...p, positionId: move } : p
//     );

//     // big bonus if this move enables immediate capture of player's king
//     let kingCaptureBonus = 0;
//     const playerKing = simulated.find((p) => p.owner === "player" && p.isKing);
//     if (playerKing) {
//       try {
//         if (
//           SkillHandlers.checkAssassinCapture &&
//           SkillHandlers.checkAssassinCapture(
//             playerKing.positionId,
//             simulated,
//             "enemy",
//             SkillConstants.BOARD_CONFIG
//           )
//         )
//           kingCaptureBonus = 1000;
//         if (
//           SkillHandlers.checkArcherCapture &&
//           SkillHandlers.checkArcherCapture(
//             playerKing.positionId,
//             simulated,
//             "enemy",
//             SkillConstants.BOARD_CONFIG
//           )
//         )
//           kingCaptureBonus = 1000;
//         if (
//           SkillHandlers.checkNormalCapture &&
//           SkillHandlers.checkNormalCapture(
//             playerKing.positionId,
//             simulated,
//             "enemy",
//             SkillConstants.BOARD_CONFIG
//           )
//         )
//           kingCaptureBonus = 1000;
//       } catch (e) {
//         // ignore
//       }
//     }

//     // vulnerability penalty: how many player pieces adjacent to the moved position
//     const vulnerability = placedCards.filter(
//       (p) =>
//         p.owner === "player" &&
//         SkillManager.isAdjacent(p.positionId, move, SkillConstants.BOARD_CONFIG)
//     ).length;

//     const score = base - kingCaptureBonus + vulnerability * 3; // lower is better
//     return score;
//   };

//   // pick best according to evaluation (lower score preferred)
//   let best = validMoves[0];
//   let bestScore = evaluateMove(best);
//   for (const m of validMoves) {
//     const s = evaluateMove(m);
//     if (s < bestScore) {
//       best = m;
//       bestScore = s;
//     }
//   }

//   // epsilon-greedy: usually pick best, sometimes random to keep variety
//   const pickBestProb = 0.75;
//   const chosenMove =
//     Math.random() < pickBestProb
//       ? best
//       : validMoves[Math.floor(Math.random() * validMoves.length)];

//   // Show selection + highlights first (mimic player UX)
//   setSelectedCharacter(enemy);
//   setValidMovePositions(validMoves);

//   setTimeout(() => {
//     const newPlaced = placedCards.map((p) =>
//       p.positionId === enemy.positionId ? { ...p, positionId: chosenMove } : p
//     );
//     setPlacedCards(newPlaced);
//     setCharacterActions((prev) => ({ ...prev, [enemy.cardData.type]: true }));
//     // clear selection/highlight
//     setSelectedCharacter(null);
//     setValidMovePositions([]);
//     // allow next AI step after short delay
//     aiThinking.current = false;
//     setAiBusy(false);
//   }, 700);
// };

// Ai action phase baru menggunakan Minimax dengan Alpha-Beta Pruning
export const aiActionPhase = (params) => {
  const {
    placedCards,
    characterActions,
    setPlacedCards,
    setCharacterActions,
    setSelectedCharacter,
    setValidMovePositions,
    setCurrentPhase,
    aiThinking,
    setAiBusy,
    checkSkipRecruitment,
  } = params;

  // AI mencari semua langkah yang mungkin untuk semua karakternya yang belum gerak
  const enemiesReady = placedCards.filter(
    (p) => p.owner === "enemy" && !characterActions[p.cardData.type]
  );

  if (enemiesReady.length === 0) {
    // Tidak ada karakter yang bisa bergerak -> pindah ke recruitment phase
    setCurrentPhase("recruitment");
    checkSkipRecruitment();
    aiThinking.current = false;
    setAiBusy(false);
    return;
  }

  // Dapatkan semua langkah yang mungkin untuk karakter yang belum bergerak
  const allPossibleMoves = getSimulatedMoves(placedCards, "enemy").filter(
    (m) => !characterActions[m.charType]
  );

  // Jika tidak ada langkah yang valid
  if (allPossibleMoves.length === 0) {
    // Mark all remaining enemies as acted
    const newActions = { ...characterActions };
    enemiesReady.forEach((e) => {
      newActions[e.cardData.type] = true;
    });
    setCharacterActions(newActions);

    // Pindah ke recruitment phase
    setCurrentPhase("recruitment");
    checkSkipRecruitment();
    aiThinking.current = false;
    setAiBusy(false);
    return;
  }

  let bestMove = null;
  let bestScore = -Infinity;

  // Mencari langkah terbaik menggunakan Minimax dengan Depth 2
  allPossibleMoves.forEach((move) => {
    const simulatedBoard = applyMove(placedCards, move);
    // Depth 2: AI gerak -> Player gerak -> Evaluasi
    const score = minimax(
      simulatedBoard,
      2,
      -Infinity,
      Infinity,
      false,
      "enemy"
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  });

  if (bestMove) {
    // Cari karakter yang akan bergerak untuk visualisasi
    const chosenChar = placedCards.find((c) => c.positionId === bestMove.from);

    // Hitung valid moves untuk highlight
    let validMoves = [];
    try {
      if (chosenChar.cardData.type === "Cavalier") {
        validMoves = SkillManager.getCavalierValidMoves(
          chosenChar.positionId,
          placedCards,
          SkillConstants.BOARD_CONFIG
        );
      } else if (chosenChar.cardData.type === "Rodeuse") {
        validMoves = SkillManager.getRodeuseValidMoves(
          chosenChar.positionId,
          placedCards,
          "enemy",
          SkillConstants.BOARD_CONFIG
        );
      } else {
        validMoves = SkillManager.getAdjacentPositions(
          chosenChar.positionId,
          SkillConstants.BOARD_CONFIG
        ).filter((pos) => !placedCards.find((c) => c.positionId === pos));
      }
    } catch (e) {
      validMoves = [bestMove.to];
    }

    // Show selection + highlights (mimic player UX)
    setSelectedCharacter(chosenChar);
    setValidMovePositions(validMoves);

    setTimeout(() => {
      const newPlaced = placedCards.map((p) =>
        p.positionId === bestMove.from ? { ...p, positionId: bestMove.to } : p
      );
      setPlacedCards(newPlaced);
      setCharacterActions((prev) => ({ ...prev, [bestMove.charType]: true }));

      // Clear selection/highlight
      setSelectedCharacter(null);
      setValidMovePositions([]);

      aiThinking.current = false;
      setAiBusy(false);
    }, 700);
  } else {
    // Fallback: tidak ada move yang ditemukan
    aiThinking.current = false;
    setAiBusy(false);
  }
};

// ============================================
// AI RECRUITMENT PHASE
// ============================================
export const aiRecruitmentPhase = ({
  // State
  placedCards,
  availableCards,
  deck,
  enemyColor,
  turn,
  firstTurn,
  recruitmentCount,
  // Setters
  setPlacedCards,
  setAvailableCards,
  setDeck,
  setRecruitmentCount,
  setRecruitmentPhase,
  // Refs
  aiThinking,
  // Callbacks
  handleEndTurnForAI,
}) => {
  // Enforce max 4 recruited (excluding king/ourson)
  const enemyRecruitedCount = placedCards.filter(
    (p) => p.owner === "enemy" && !p.isKing && !p.isOurson
  ).length;
  const maxRecruited = 4;

  if (enemyRecruitedCount >= maxRecruited) {
    handleEndTurnForAI();
    return;
  }

  if (availableCards.length === 0) {
    handleEndTurnForAI();
    return;
  }

  // Sorting kartu yang tersedia berdasarkan value yang kita buat tadi
  const heroPriority = {
    Assassin: 5,
    Archer: 4,
    Protector: 3,
    Geolier: 2,
    Cavalier: 2,
    Acrobate: 1,
  };

  const sortedAvailable = [...availableCards].sort(
    (a, b) => (heroPriority[b.type] || 0) - (heroPriority[a.type] || 0)
  );

  // AI akan mencoba merekrut hero terbaik yang ada di 3 pilihan
  // ini kodingan pemilihan kartu dengan pintar
  const cardToRecruit = sortedAvailable[0];

  // choose random card
  // ini yang lama masih random
  // const cardToRecruit =
  //   availableCards[Math.floor(Math.random() * availableCards.length)];
  const recruitmentSpaces = SkillConstants.RECRUITMENT_SPACES["enemy"] || [];
  const emptySpaces = recruitmentSpaces.filter(
    (pos) => !placedCards.find((p) => p.positionId === pos)
  );

  if (emptySpaces.length === 0) {
    handleEndTurnForAI();
    return;
  }

  // choose among top candidates near player's pieces (prefer aggressive placement)
  const playerPositions = placedCards
    .filter((p) => p.owner === "player")
    .map((p) => p.positionId);
  const scorePos = (p) => {
    if (playerPositions.length === 0) return 0;
    const dists = playerPositions.map((pp) => SkillManager.getDistance(p, pp));
    return Math.min(...dists);
  };
  const sorted = [...emptySpaces].sort((a, b) => scorePos(a) - scorePos(b));
  const topN = sorted.slice(0, Math.min(2, sorted.length));
  const pos = topN[Math.floor(Math.random() * topN.length)];

  const characterImage = `/Assets/Pions_personnages/${
    enemyColor === "white" ? "Blanc" : "Noir"
  }/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_${
    cardToRecruit.type
  }.png`;

  // If VieilOurs, place both VieilOurs and Ourson immediately
  if (cardToRecruit.type === "VieilOurs") {
    const remainingSpaces = emptySpaces.filter((s) => s !== pos);
    if (remainingSpaces.length > 0) {
      const oursonPos =
        remainingSpaces[Math.floor(Math.random() * remainingSpaces.length)];
      const oursonImage = `/Assets/Pions_personnages/${
        enemyColor === "white" ? "Blanc" : "Noir"
      }/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_Ourson.png`;

      const newPlaced = [
        ...placedCards,
        {
          positionId: pos,
          cardImage: characterImage,
          cardData: cardToRecruit,
          owner: "enemy",
          isKing: false,
        },
        {
          positionId: oursonPos,
          cardImage: oursonImage,
          cardData: { type: "Ourson" },
          owner: "enemy",
          isKing: false,
          isOurson: true,
        },
      ];

      let finalAvailable = availableCards.filter(
        (av) => av.type !== cardToRecruit.type
      );
      let finalDeck = [...deck];
      if (deck.length > 0) {
        finalAvailable = [...finalAvailable, deck[0]];
        finalDeck = deck.slice(1);
      }
      finalAvailable = finalAvailable.sort(() => Math.random() - 0.5);

      setPlacedCards(newPlaced);
      setAvailableCards(finalAvailable);
      setDeck(finalDeck);

      if (turn !== firstTurn && recruitmentCount > 1) {
        setRecruitmentCount((prev) => prev - 1);
        setRecruitmentPhase({
          selectingCard: true,
          selectedRecruitmentCard: null,
          selectingPosition: false,
        });
        aiThinking.current = false;
      } else {
        setTimeout(() => handleEndTurnForAI(), 600);
      }
      return;
    }
  }

  // Normal recruitment
  const newPlaced = [
    ...placedCards,
    {
      positionId: pos,
      cardImage: characterImage,
      cardData: cardToRecruit,
      owner: "enemy",
      isKing: false,
    },
  ];

  let finalAvailable = availableCards.filter(
    (av) => av.type !== cardToRecruit.type
  );
  let finalDeck = [...deck];
  if (deck.length > 0) {
    finalAvailable = [...finalAvailable, deck[0]];
    finalDeck = deck.slice(1);
  }
  finalAvailable = finalAvailable.sort(() => Math.random() - 0.5);

  setPlacedCards(newPlaced);
  setAvailableCards(finalAvailable);
  setDeck(finalDeck);

  if (turn !== firstTurn && recruitmentCount > 1) {
    setRecruitmentCount((prev) => prev - 1);
    setRecruitmentPhase({
      selectingCard: true,
      selectedRecruitmentCard: null,
      selectingPosition: false,
    });
    // allow AI to continue recruitment loop
    aiThinking.current = false;
  } else {
    // End AI turn after recruitment
    setTimeout(() => handleEndTurnForAI(), 600);
  }
};

// ============================================
// MAIN AI TURN RUNNER
// ============================================
export const runAITurn = (params) => {
  const { currentPhase, aiThinking } = params;

  if (currentPhase === "action") {
    aiActionPhase(params);
  } else if (currentPhase === "recruitment") {
    aiRecruitmentPhase(params);
  } else {
    aiThinking.current = false;
  }
};
