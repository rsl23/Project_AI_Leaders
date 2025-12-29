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
export const aiActionPhase = ({
  // State
  placedCards,
  characterActions,
  // Setters
  setPlacedCards,
  setCharacterActions,
  setSelectedCharacter,
  setValidMovePositions,
  setCurrentPhase,
  // Refs
  aiThinking,
  setAiBusy,
  // Callbacks
  checkSkipRecruitment,
}) => {
  // Find enemy characters that haven't acted (include king)
  const enemies = placedCards.filter(
    (p) => p.owner === "enemy" && !characterActions[p.cardData.type]
  );

  if (enemies.length === 0) {
    // No enemies to act -> go to recruitment
    setCurrentPhase("recruitment");
    checkSkipRecruitment();
    aiThinking.current = false;
    setAiBusy(false);
    return;
  }

  // Choose a random available enemy to act (including king) to vary behavior
  const enemy = enemies[Math.floor(Math.random() * enemies.length)];

  // Compute valid moves depending on character type
  let validMoves = [];
  const occupiedPositions = new Set(placedCards.map((p) => p.positionId));

  try {
    switch (enemy.cardData.type) {
      case "Cavalier":
        validMoves = SkillManager.getCavalierValidMoves(
          enemy.positionId,
          placedCards,
          SkillConstants.BOARD_CONFIG
        );
        break;
      case "Acrobate":
        // Acrobate moves like normal (adjacent) during action phase; jump is an active ability
        validMoves = SkillManager.getAdjacentPositions(
          enemy.positionId,
          SkillConstants.BOARD_CONFIG
        ).filter((pos) => !occupiedPositions.has(pos));
        break;
      case "Rodeuse":
        validMoves = SkillManager.getRodeuseValidMoves(
          enemy.positionId,
          placedCards,
          "enemy",
          SkillConstants.BOARD_CONFIG
        );
        break;
      default:
        // Default: adjacent empty positions
        validMoves = SkillManager.getAdjacentPositions(
          enemy.positionId,
          SkillConstants.BOARD_CONFIG
        ).filter((pos) => !occupiedPositions.has(pos));
        break;
    }
  } catch (err) {
    validMoves = [];
  }

  // If enemy is king, allow leader moves (1-step adjacent)
  if (enemy.isKing) {
    try {
      validMoves = getLeaderMoves(enemy, placedCards);
    } catch (e) {
      // fallback to adjacent
      validMoves = SkillManager.getAdjacentPositions(
        enemy.positionId,
        SkillConstants.BOARD_CONFIG
      ).filter((pos) => !occupiedPositions.has(pos));
    }
  }

  // If no valid moves, mark as acted and continue
  if (!validMoves || validMoves.length === 0) {
    setCharacterActions((prev) => ({ ...prev, [enemy.cardData.type]: true }));
    aiThinking.current = false;
    setTimeout(() => setAiBusy(false), 200);
    return;
  }

  // Choose move using an epsilon-greedy approach
  const playerPositions = placedCards
    .filter((p) => p.owner === "player")
    .map((p) => p.positionId);

  const evaluateMove = (move) => {
    // lower is better
    let base = 0;
    if (playerPositions.length === 0) base = 0;
    else {
      const dists = playerPositions.map((pp) =>
        getPathDistance(move, pp, placedCards)
      );
      base = Math.min(...dists);
    }

    // simulate the placement after move
    const simulated = placedCards.map((p) =>
      p.positionId === enemy.positionId ? { ...p, positionId: move } : p
    );

    // big bonus if this move enables immediate capture of player's king
    let kingCaptureBonus = 0;
    const playerKing = simulated.find((p) => p.owner === "player" && p.isKing);
    if (playerKing) {
      try {
        if (
          SkillHandlers.checkAssassinCapture &&
          SkillHandlers.checkAssassinCapture(
            playerKing.positionId,
            simulated,
            "enemy",
            SkillConstants.BOARD_CONFIG
          )
        )
          kingCaptureBonus = 1000;
        if (
          SkillHandlers.checkArcherCapture &&
          SkillHandlers.checkArcherCapture(
            playerKing.positionId,
            simulated,
            "enemy",
            SkillConstants.BOARD_CONFIG
          )
        )
          kingCaptureBonus = 1000;
        if (
          SkillHandlers.checkNormalCapture &&
          SkillHandlers.checkNormalCapture(
            playerKing.positionId,
            simulated,
            "enemy",
            SkillConstants.BOARD_CONFIG
          )
        )
          kingCaptureBonus = 1000;
      } catch (e) {
        // ignore
      }
    }

    // vulnerability penalty: how many player pieces adjacent to the moved position
    const vulnerability = placedCards.filter(
      (p) =>
        p.owner === "player" &&
        SkillManager.isAdjacent(p.positionId, move, SkillConstants.BOARD_CONFIG)
    ).length;

    const score = base - kingCaptureBonus + vulnerability * 3; // lower is better
    return score;
  };

  // pick best according to evaluation (lower score preferred)
  let best = validMoves[0];
  let bestScore = evaluateMove(best);
  for (const m of validMoves) {
    const s = evaluateMove(m);
    if (s < bestScore) {
      best = m;
      bestScore = s;
    }
  }

  // epsilon-greedy: usually pick best, sometimes random to keep variety
  const pickBestProb = 0.75;
  const chosenMove =
    Math.random() < pickBestProb
      ? best
      : validMoves[Math.floor(Math.random() * validMoves.length)];

  // Show selection + highlights first (mimic player UX)
  setSelectedCharacter(enemy);
  setValidMovePositions(validMoves);

  setTimeout(() => {
    const newPlaced = placedCards.map((p) =>
      p.positionId === enemy.positionId ? { ...p, positionId: chosenMove } : p
    );
    setPlacedCards(newPlaced);
    setCharacterActions((prev) => ({ ...prev, [enemy.cardData.type]: true }));
    // clear selection/highlight
    setSelectedCharacter(null);
    setValidMovePositions([]);
    // allow next AI step after short delay
    aiThinking.current = false;
    setAiBusy(false);
  }, 700);
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

  // choose random card
  const cardToRecruit =
    availableCards[Math.floor(Math.random() * availableCards.length)];
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
