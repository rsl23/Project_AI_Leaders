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

// Konfigurasi AI berdasarkan tingkat kesulitan
const getAiConfig = (difficulty) => {
  switch (difficulty) {
    case "Easy":
      return {
        depth: 1, // Hanya melihat 1 langkah ke depan (rakus/greedy)
        randomness: 0.3, // 30% kemungkinan bergerak acak (blunder)
        recruitmentRandom: true, // Rekrutmen asal-asalan
      };
    case "Medium":
      return {
        depth: 2, // Melihat 2 langkah (cukup pintar)
        randomness: 0.05, // 5% kemungkinan error kecil
        recruitmentRandom: false,
      };
    case "Hard":
    default:
      return {
        depth: 4, // Melihat 4 langkah (sangat kuat/original)
        randomness: 0, // Selalu pilih langkah terbaik
        recruitmentRandom: false,
      };
  }
};

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

const transpositionTable = new Map();

// Fungsi untuk membuat string unik dari kondisi board
const getBoardHash = (cards) => {
  return cards
    .map((c) => `${c.cardData.type}${c.positionId}${c.owner}`)
    .sort()
    .join("|");
};

// ============================================
// AI NEMESIS MOVEMENT
// ============================================
// Ketika Leader lawan bergerak, Nemesis AI harus memilih posisi terbaik

/**
 * AI memilih posisi terbaik untuk Nemesis bergerak
 * @param {Array} validPositions - Posisi-posisi valid untuk Nemesis bergerak
 * @param {Object} nemesis - Karakter Nemesis
 * @param {Array} placedCards - Semua kartu di papan
 * @param {string} nemesisOwner - "player" atau "enemy"
 * @returns {string} - Posisi terbaik untuk Nemesis
 */
export const aiChooseNemesisPosition = (
  validPositions,
  nemesis,
  placedCards,
  nemesisOwner
) => {
  if (!validPositions || validPositions.length === 0) {
    return null;
  }

  if (validPositions.length === 1) {
    return validPositions[0];
  }

  const opponentOwner = nemesisOwner === "enemy" ? "player" : "enemy";
  const opponentKing = placedCards.find(
    (c) => c.owner === opponentOwner && c.isKing
  );

  if (!opponentKing) {
    return validPositions[0];
  }

  console.log("🤖 AI Nemesis: Evaluating positions...");

  let bestPosition = validPositions[0];
  let bestScore = -Infinity;

  validPositions.forEach((pos) => {
    let score = 0;

    // 1. Prioritas utama: Jarak ke King lawan (semakin dekat semakin baik)
    const distToOpponentKing = SkillManager.getDistance(
      pos,
      opponentKing.positionId
    );
    score += (10 - distToOpponentKing) * 200;

    // 2. Bonus jika adjacent dengan King lawan (posisi capture)
    if (distToOpponentKing === 1) {
      score += 500;
    }

    // 3. Cek apakah posisi ini mengancam capture (dengan bantuan ally)
    try {
      const simulatedCards = placedCards.map((c) =>
        c.positionId === nemesis.positionId ? { ...c, positionId: pos } : c
      );

      // Cek normal capture threat
      const adjacentToKing = SkillManager.getAdjacentPositions(
        opponentKing.positionId,
        SkillConstants.BOARD_CONFIG
      );
      const alliesAdjacentToKing = adjacentToKing.filter((adjPos) => {
        const card = simulatedCards.find((c) => c.positionId === adjPos);
        return card && card.owner === nemesisOwner && !card.isKing;
      });

      // Jika Nemesis di posisi ini + ada ally lain adjacent ke King = ancaman capture
      if (adjacentToKing.includes(pos) && alliesAdjacentToKing.length >= 1) {
        score += 800; // Tinggi karena ini posisi capture!
      }
    } catch (e) {
      /* ignore */
    }

    // 4. Hindari posisi yang terlalu terbuka (tidak ada ally nearby)
    const adjacentAllies = getAdjacentPositions(pos).filter((adjPos) => {
      const card = placedCards.find((c) => c.positionId === adjPos);
      return card && card.owner === nemesisOwner;
    });
    score += adjacentAllies.length * 30;

    // 5. Hindari posisi adjacent dengan Geolier musuh (kalau ada ability)
    const adjacentEnemyGeolier = getAdjacentPositions(pos).filter((adjPos) => {
      const card = placedCards.find((c) => c.positionId === adjPos);
      return (
        card &&
        card.owner === opponentOwner &&
        card.cardData?.type === "Geolier"
      );
    });
    score -= adjacentEnemyGeolier.length * 50;

    console.log(
      `  📊 Position ${pos}: Score = ${score} (dist to King: ${distToOpponentKing})`
    );

    if (score > bestScore) {
      bestScore = score;
      bestPosition = pos;
    }
  });

  console.log(
    `🤖 AI Nemesis: Best position = ${bestPosition} (Score: ${bestScore})`
  );

  return bestPosition;
};

// ============================================
// AI ACTION PHASE
// ============================================
// Evaluation constants
// Algoritma Minimax dengan Alpha-Beta Pruning

// Bobot Nilai Karakter (Material Value) - SEMUA KARAKTER dari characterInfo.js
const CHARACTER_VALUES = {
  // === PASSIVE ABILITIES ===
  Assassin: 1200, // Paling berbahaya - bisa capture Leader sendiri
  Archer: 1100, // Bisa bantu capture dari 2 kotak
  Protector: 900, // Melindungi ally dari ability musuh
  Geolier: 850, // Memblokir active ability musuh
  Vizir: 800, // Memberi Leader gerakan ekstra

  // === ACTIVE ABILITIES ===
  Cavalier: 750, // Mobilitas tinggi - 2 kotak lurus
  Rodeuse: 700, // Mobilitas sangat tinggi - ke mana saja non-adjacent musuh
  Acrobate: 720, // Lompatan strategis
  LanceGrappin: 780, // Kontrol posisi - tarik/dorong
  Manipulator: 760, // Kontrol musuh - pindahkan musuh
  GardeRoyal: 700, // Teleport ke Leader + gerakan
  Cogneur: 730, // Push musuh
  Illusionist: 680, // Swap posisi
  Tavernier: 650, // Support - pindahkan ally

  // === SPECIAL ABILITIES ===
  Nemesis: 850, // Reaktif - mengikuti Leader lawan
  VieilOurs: 600, // Hermit - normal value
  Cub: 400, // Tidak bisa bantu capture Leader

  // === LEADER ===
  king: 10000, // Leader sangat berharga
};

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
    const type = card.cardData?.type;

    // A. Material Score - Gunakan nilai dari CHARACTER_VALUES
    let cardValue = CHARACTER_VALUES[type] || 500;
    if (card.isKing) cardValue = CHARACTER_VALUES.king;

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

    // ================================================================
    // BONUS POSISI STRATEGIS - SEMUA KARAKTER dari characterInfo.js
    // ================================================================

    const distToPlayerKing = SkillManager.getDistance(
      card.positionId,
      playerKing.positionId
    );
    const distToEnemyKing = SkillManager.getDistance(
      card.positionId,
      enemyKing.positionId
    );
    const ownKing = isAI ? enemyKing : playerKing;
    const distToOwnKing = SkillManager.getDistance(
      card.positionId,
      ownKing.positionId
    );

    // === PASSIVE ABILITIES ===

    // D. Protector - Bonus jika adjacent dengan King sendiri
    if (type === "Protector") {
      if (distToOwnKing === 1) score += 350 * multiplier;
      // Bonus tambahan jika juga adjacent dengan ally lain
      try {
        const adjacentAllies = SkillManager.getAdjacentPositions(
          card.positionId,
          SkillConstants.BOARD_CONFIG
        ).filter((pos) => {
          const c = cards.find((x) => x.positionId === pos);
          return c && c.owner === card.owner && !c.isKing;
        });
        score += adjacentAllies.length * 50 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // E. Geolier - Bonus jika adjacent dengan musuh (memblokir ability mereka)
    if (type === "Geolier") {
      try {
        const adjacentEnemies = SkillManager.getAdjacentPositions(
          card.positionId,
          SkillConstants.BOARD_CONFIG
        ).filter((pos) => {
          const c = cards.find((x) => x.positionId === pos);
          return c && c.owner !== card.owner;
        });
        // Bonus untuk setiap musuh yang diblokir
        score += adjacentEnemies.length * 180 * multiplier;
        // Bonus ekstra jika memblokir karakter dengan active ability berbahaya
        adjacentEnemies.forEach((pos) => {
          const blocked = cards.find((x) => x.positionId === pos);
          if (
            blocked &&
            ["Assassin", "Cavalier", "LanceGrappin", "Manipulator"].includes(
              blocked.cardData?.type
            )
          ) {
            score += 100 * multiplier;
          }
        });
      } catch (e) {
        /* ignore */
      }
    }

    // F. Vizir - Bonus karena buff Leader
    if (type === "Vizir") {
      score += 300 * multiplier;
      // Bonus ekstra jika Leader masih hidup
      if (ownKing) score += 200 * multiplier;
    }

    // G. Archer - Bonus posisi ideal (2 kotak dari King lawan, garis lurus)
    if (type === "Archer") {
      if (distToPlayerKing === 2 && isAI) {
        try {
          if (
            SkillManager.isStraightLine(card.positionId, playerKing.positionId)
          ) {
            score += 600; // Posisi capture ideal
          }
        } catch (e) {
          /* ignore */
        }
      } else if (distToEnemyKing === 2 && !isAI) {
        try {
          if (
            SkillManager.isStraightLine(card.positionId, enemyKing.positionId)
          ) {
            score -= 600;
          }
        } catch (e) {
          /* ignore */
        }
      }
    }

    // H. Assassin - Bonus jika adjacent dengan King lawan
    if (type === "Assassin") {
      if (isAI && distToPlayerKing === 1) {
        score += 800; // Sangat berbahaya!
      } else if (!isAI && distToEnemyKing === 1) {
        score -= 800;
      }
    }

    // === ACTIVE ABILITIES ===

    // I. Cavalier - Bonus mobilitas dan ancaman
    if (type === "Cavalier") {
      // Bonus jika dalam jarak 2 dari King lawan (bisa langsung menyerang)
      if (isAI && distToPlayerKing <= 2) {
        score += 200;
      } else if (!isAI && distToEnemyKing <= 2) {
        score -= 200;
      }
    }

    // J. Rodeuse - Bonus fleksibilitas posisi
    if (type === "Rodeuse") {
      // Rodeuse lebih berharga di tengah papan (lebih banyak opsi)
      try {
        const validMoves = SkillManager.getRodeuseValidMoves(
          card.positionId,
          cards,
          card.owner,
          SkillConstants.BOARD_CONFIG
        );
        score += validMoves.length * 10 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // K. Acrobate - Bonus jika bisa lompat ke posisi strategis
    if (type === "Acrobate") {
      try {
        const jumpPositions = SkillManager.getAcrobateJumpPositions(
          card.positionId,
          cards,
          SkillConstants.BOARD_CONFIG
        );
        score += jumpPositions.length * 20 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // L. LanceGrappin - Bonus kontrol posisi
    if (type === "LanceGrappin") {
      try {
        const targets = SkillManager.getLanceGrappinTargets(
          card.positionId,
          cards,
          SkillConstants.BOARD_CONFIG
        );
        score += targets.length * 25 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // M. Manipulator - Bonus kontrol musuh
    if (type === "Manipulator") {
      try {
        const targets = SkillManager.getManipulatorTargets(
          card.positionId,
          cards,
          card.owner,
          SkillConstants.BOARD_CONFIG
        );
        score += targets.length * 30 * multiplier;
        // Bonus ekstra jika bisa memindahkan karakter berbahaya
      } catch (e) {
        /* ignore */
      }
    }

    // N. GardeRoyal - Bonus jika dekat dengan King sendiri
    if (type === "GardeRoyal") {
      if (distToOwnKing === 1) {
        score += 250 * multiplier; // Posisi ideal untuk melindungi
      } else if (distToOwnKing <= 3) {
        score += 100 * multiplier;
      }
    }

    // O. Cogneur - Bonus jika adjacent dengan musuh (bisa push)
    if (type === "Cogneur") {
      try {
        const targets = SkillManager.getCogneurTargets(
          card.positionId,
          cards,
          card.owner,
          SkillConstants.BOARD_CONFIG
        );
        score += targets.length * 35 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // P. Illusionist - Bonus fleksibilitas swap
    if (type === "Illusionist") {
      try {
        const targets = SkillManager.getIllusionistTargets(
          card.positionId,
          cards,
          card.owner,
          SkillConstants.BOARD_CONFIG
        );
        score += targets.length * 20 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // Q. Tavernier - Bonus support (bisa pindahkan ally)
    if (type === "Tavernier") {
      try {
        const targets = SkillManager.getTavernierTargets(
          card.positionId,
          cards,
          card.owner,
          SkillConstants.BOARD_CONFIG
        );
        score += targets.length * 15 * multiplier;
      } catch (e) {
        /* ignore */
      }
    }

    // === SPECIAL ABILITIES ===

    // R. Nemesis - Bonus semakin dekat dengan Leader lawan
    if (type === "Nemesis") {
      const targetKingDist = isAI ? distToPlayerKing : distToEnemyKing;
      score += (7 - targetKingDist) * 120 * multiplier;
    }

    // S. VieilOurs (Hermit) - Bonus jika Cub juga masih ada
    if (type === "VieilOurs") {
      const hasCub = cards.some(
        (c) => c.cardData?.type === "Cub" && c.owner === card.owner
      );
      if (hasCub) {
        score += 150 * multiplier; // Sinergi
      }
    }

    // T. Cub - Nilai lebih rendah tapi masih berguna untuk blocking
    if (type === "Cub") {
      // Bonus jika dekat King sendiri (bisa jadi blocker)
      if (distToOwnKing <= 2) {
        score += 50 * multiplier;
      }
    }
  });

  return score;
};

const getSimulatedMoves = (cards, currentTurn) => {
  const moves = [];
  const currentPieces = cards.filter((p) => p.owner === currentTurn);
  const opponentOwner = currentTurn === "enemy" ? "player" : "enemy";

  // Helper: cek apakah karakter adjacent dengan Geolier musuh (blokir active ability)
  const isBlockedByGeolier = (piecePos) => {
    try {
      return SkillHandlers.checkJailerEffect(
        piecePos,
        cards,
        currentTurn,
        SkillConstants.BOARD_CONFIG
      );
    } catch (e) {
      return false;
    }
  };

  // Helper: cek apakah karakter dilindungi Protector (tidak bisa dipindahkan ability musuh)
  const isProtectedByProtector = (piecePos, pieceOwner) => {
    try {
      return SkillHandlers.checkProtectorEffect(
        piecePos,
        cards,
        pieceOwner,
        SkillConstants.BOARD_CONFIG
      );
    } catch (e) {
      return false;
    }
  };

  // Helper: dapatkan gerakan adjacent normal (untuk semua karakter)
  const getNormalMoves = (positionId) => {
    return SkillManager.getAdjacentPositions(
      positionId,
      SkillConstants.BOARD_CONFIG
    ).filter((pos) => !cards.find((c) => c.positionId === pos));
  };

  currentPieces.forEach((piece) => {
    const type = piece.cardData.type;
    const piecePos = piece.positionId;
    const blockedByGeolier = isBlockedByGeolier(piecePos);

    // === SPECIAL: Nemesis tidak bisa bergerak di action phase normal ===
    if (type === "Nemesis") {
      // Nemesis hanya bergerak sebagai reaksi ketika Leader lawan bergerak
      // Tidak ada gerakan normal untuk Nemesis
      return;
    }

    // === 1. GERAKAN NORMAL (Adjacent) - Semua karakter bisa ===
    let normalPositions = [];
    try {
      if (piece.isKing) {
        // Leader: cek efek Vizir untuk gerakan tambahan
        normalPositions = getLeaderMoves(piece, cards);

        // Cek apakah ada Vizir untuk bonus gerakan
        const hasVizir = SkillHandlers.checkVizirEffect(
          piecePos,
          cards,
          currentTurn
        );
        if (hasVizir) {
          // Leader bisa bergerak 2 langkah jika ada Vizir
          const firstStepMoves = normalPositions;
          firstStepMoves.forEach((firstPos) => {
            const secondStepMoves = SkillManager.getAdjacentPositions(
              firstPos,
              SkillConstants.BOARD_CONFIG
            ).filter(
              (pos) =>
                !cards.find((c) => c.positionId === pos) && pos !== piecePos // Tidak boleh kembali ke posisi awal
            );
            secondStepMoves.forEach((secondPos) => {
              // Tambahkan sebagai move terpisah dengan flag vizir
              moves.push({
                charType: type,
                from: piecePos,
                to: secondPos,
                moveType: "vizir_extended",
                intermediate: firstPos,
              });
            });
          });
        }
      } else {
        normalPositions = getNormalMoves(piecePos);
      }
    } catch (e) {
      normalPositions = getNormalMoves(piecePos);
    }

    // Tambahkan semua gerakan normal
    normalPositions.forEach((pos) => {
      moves.push({
        charType: type,
        from: piecePos,
        to: pos,
        moveType: "normal",
      });
    });

    // === 2. GERAKAN ABILITY (Hanya jika tidak diblokir Geolier) ===
    if (!blockedByGeolier) {
      let abilityPositions = [];

      try {
        // === ACTIVE ABILITIES ===
        if (type === "Cavalier") {
          // Moves two spaces in a straight line
          abilityPositions = SkillManager.getCavalierValidMoves(
            piecePos,
            cards,
            SkillConstants.BOARD_CONFIG
          );
        } else if (type === "Rodeuse") {
          // Moves to any space non-adjacent to an enemy
          abilityPositions = SkillManager.getRodeuseValidMoves(
            piecePos,
            cards,
            currentTurn,
            SkillConstants.BOARD_CONFIG
          );
        } else if (type === "Acrobate") {
          // Jump in a straight line past the character next to him
          abilityPositions = SkillManager.getAcrobateJumpPositions(
            piecePos,
            cards,
            SkillConstants.BOARD_CONFIG
          );
        } else if (type === "LanceGrappin") {
          // Moves in a straight line to a visible character, OR drags them
          // Filter target yang tidak dilindungi Protector
          const allTargets = SkillManager.getLanceGrappinTargets(
            piecePos,
            cards,
            SkillConstants.BOARD_CONFIG
          );
          abilityPositions = allTargets.filter((targetPos) => {
            const targetCard = cards.find((c) => c.positionId === targetPos);
            if (!targetCard) return true; // Posisi kosong OK
            // Cek apakah target dilindungi Protector
            return !isProtectedByProtector(targetPos, targetCard.owner);
          });
        } else if (type === "Manipulator") {
          // Moves a non-adjacent enemy visible in a straight line
          // Filter target yang tidak dilindungi Protector
          const allTargets = SkillManager.getManipulatorTargets(
            piecePos,
            cards,
            currentTurn,
            SkillConstants.BOARD_CONFIG
          );
          abilityPositions = allTargets.filter((targetPos) => {
            return !isProtectedByProtector(targetPos, opponentOwner);
          });
        } else if (type === "GardeRoyal") {
          // Moves to a space adjacent to your Leader, then MAY move one space
          abilityPositions = SkillManager.getGardeRoyalTeleportPositions(
            piecePos,
            cards,
            currentTurn,
            SkillConstants.BOARD_CONFIG
          );
        } else if (type === "Cogneur") {
          // Moves to an adjacent enemy's space, pushing them
          // Filter target yang tidak dilindungi Protector
          const allTargets = SkillManager.getCogneurTargets(
            piecePos,
            cards,
            currentTurn,
            SkillConstants.BOARD_CONFIG
          );
          abilityPositions = allTargets.filter((targetPos) => {
            return !isProtectedByProtector(targetPos, opponentOwner);
          });
        } else if (type === "Illusionist") {
          // Switches places with a non-adjacent, visible champion in a straight line
          abilityPositions = SkillManager.getIllusionistTargets(
            piecePos,
            cards,
            currentTurn,
            SkillConstants.BOARD_CONFIG
          );
        } else if (type === "Tavernier") {
          // Moves an adjacent ally one space
          // Filter target ally yang tidak dilindungi Protector musuh
          const allTargets = SkillManager.getTavernierTargets(
            piecePos,
            cards,
            currentTurn,
            SkillConstants.BOARD_CONFIG
          );
          abilityPositions = allTargets;
        }

        // === SPECIAL: VieilOurs (Hermit & Cub) ===
        if (type === "VieilOurs" || type === "Cub") {
          // Hermit dan Cub bisa bergerak normal (sudah ditambahkan di atas)
          // Cub tidak bisa membantu capture Leader (handled di evaluateState)
        }
      } catch (e) {
        // Jika skill function error, abaikan ability moves
        abilityPositions = [];
      }

      // Tambahkan gerakan ability (filter duplikat dengan normal moves)
      abilityPositions.forEach((pos) => {
        // Jangan duplikat jika sudah ada di normal moves
        const isDuplicate = normalPositions.includes(pos);
        if (!isDuplicate) {
          moves.push({
            charType: type,
            from: piecePos,
            to: pos,
            moveType: "ability",
          });
        }
      });
    }
  });

  return moves;
};

// Fungsi pembantu untuk membuat "bayangan" papan baru
const applyMove = (cards, move) => {
  return cards.map((c) =>
    c.positionId === move.from ? { ...c, positionId: move.to } : c
  );
};

// Membantu Alpha-Beta memotong cabang lebih cepat
const getOrderedMoves = (cards, currentTurn, aiOwner) => {
  const moves = getSimulatedMoves(cards, currentTurn);
  const playerOwner = aiOwner === "enemy" ? "player" : "enemy";
  const playerKing = cards.find((p) => p.owner === playerOwner && p.isKing);

  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Prioritas 1: Langkah yang mendekati King lawan
    if (playerKing) {
      scoreA -= SkillManager.getDistance(a.to, playerKing.positionId);
      scoreB -= SkillManager.getDistance(b.to, playerKing.positionId);
    }

    // Prioritas 2: Utamakan unit berbahaya (Assassin/Archer)
    if (a.charType === "Assassin") scoreA += 50;
    if (b.charType === "Assassin") scoreB += 50;

    return scoreB - scoreA;
  });
};

const minimax = (cards, depth, alpha, beta, isMaximizing, aiOwner) => {
  const boardHash = getBoardHash(cards);
  if (transpositionTable.has(boardHash + depth)) {
    return transpositionTable.get(boardHash + depth);
  }

  if (depth === 0) return evaluateState(cards, aiOwner);

  const currentTurn = isMaximizing
    ? aiOwner
    : aiOwner === "enemy"
    ? "player"
    : "enemy";

  // GUNAKAN MOVE ORDERING DI SINI
  const moves = getOrderedMoves(cards, currentTurn, aiOwner);

  if (moves.length === 0) return evaluateState(cards, aiOwner);

  let resultScore;
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(cards, move);
      const ev = minimax(nextBoard, depth - 1, alpha, beta, false, aiOwner);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    resultScore = maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(cards, move);
      const ev = minimax(nextBoard, depth - 1, alpha, beta, true, aiOwner);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    resultScore = minEval;
  }

  transpositionTable.set(boardHash + depth, resultScore);
  return resultScore;
};

/////////////////////////////////////////////////////////////////////////
// AI ACTION PHASE
/////////////////////////////////////////////////////////////////////////

// Helper: Eksekusi ability khusus berdasarkan tipe karakter
const executeAbilityMove = async (
  move,
  placedCards,
  setPlacedCards,
  setSelectedCharacter,
  setValidMovePositions
) => {
  const { charType, from, to, moveType } = move;
  const character = placedCards.find((c) => c.positionId === from);

  if (!character) return placedCards;

  // Jika gerakan normal, langsung pindahkan
  if (moveType === "normal" || moveType === "vizir_extended") {
    return placedCards.map((c) =>
      c.positionId === from ? { ...c, positionId: to } : c
    );
  }

  // === EKSEKUSI ABILITY KHUSUS ===
  let newPlacedCards = [...placedCards];

  try {
    switch (charType) {
      case "Cavalier":
        // Cavalier: pindah 2 kotak lurus (sama dengan normal move)
        newPlacedCards = placedCards.map((c) =>
          c.positionId === from ? { ...c, positionId: to } : c
        );
        break;

      case "Rodeuse":
        // Rodeuse: pindah ke posisi non-adjacent musuh
        newPlacedCards = placedCards.map((c) =>
          c.positionId === from ? { ...c, positionId: to } : c
        );
        break;

      case "Acrobate":
        // Acrobate: lompat melewati karakter adjacent
        newPlacedCards = placedCards.map((c) =>
          c.positionId === from ? { ...c, positionId: to } : c
        );
        break;

      case "LanceGrappin":
        // LanceGrappin: bisa pindah ke target ATAU tarik target ke adjacent
        // Untuk simplisitas, AI akan pindah ke target
        const lanceTarget = placedCards.find((c) => c.positionId === to);
        if (lanceTarget) {
          // Ada karakter di target - tarik mereka ke adjacent dari LanceGrappin
          const adjacentToLance = SkillManager.getAdjacentPositions(
            from,
            SkillConstants.BOARD_CONFIG
          );
          const emptyAdjacent = adjacentToLance.filter(
            (pos) => !placedCards.find((c) => c.positionId === pos)
          );
          if (emptyAdjacent.length > 0) {
            // Tarik target ke posisi kosong terdekat
            const pullTo = emptyAdjacent[0];
            newPlacedCards = placedCards.map((c) => {
              if (c.positionId === to) return { ...c, positionId: pullTo };
              return c;
            });
          }
        } else {
          // Tidak ada karakter - LanceGrappin pindah ke sana
          newPlacedCards = placedCards.map((c) =>
            c.positionId === from ? { ...c, positionId: to } : c
          );
        }
        break;

      case "Manipulator":
        // Manipulator: pindahkan musuh non-adjacent 1 kotak
        const manipTarget = placedCards.find((c) => c.positionId === to);
        if (manipTarget) {
          // Pindahkan target 1 kotak menjauhi Manipulator
          const directionAway = SkillManager.getAdjacentPositions(
            to,
            SkillConstants.BOARD_CONFIG
          );
          const awayFromManip = directionAway.filter(
            (pos) =>
              !placedCards.find((c) => c.positionId === pos) &&
              SkillManager.getDistance(pos, from) >
                SkillManager.getDistance(to, from)
          );
          if (awayFromManip.length > 0) {
            newPlacedCards = placedCards.map((c) => {
              if (c.positionId === to)
                return { ...c, positionId: awayFromManip[0] };
              return c;
            });
          }
        }
        break;

      case "GardeRoyal":
        // GardeRoyal: teleport ke adjacent Leader, lalu bisa gerak 1
        newPlacedCards = placedCards.map((c) =>
          c.positionId === from ? { ...c, positionId: to } : c
        );
        break;

      case "Cogneur":
        // Cogneur: pindah ke posisi musuh, dorong musuh ke sisi berlawanan
        const cogneurTarget = placedCards.find((c) => c.positionId === to);
        if (cogneurTarget) {
          // Hitung arah dorong (berlawanan dari arah datang Cogneur)
          const pushDirection = SkillManager.getAdjacentPositions(
            to,
            SkillConstants.BOARD_CONFIG
          );
          const pushAway = pushDirection.filter(
            (pos) =>
              !placedCards.find((c) => c.positionId === pos) &&
              SkillManager.getDistance(pos, from) >
                SkillManager.getDistance(to, from)
          );
          if (pushAway.length > 0) {
            newPlacedCards = placedCards.map((c) => {
              if (c.positionId === from) return { ...c, positionId: to };
              if (c.positionId === to) return { ...c, positionId: pushAway[0] };
              return c;
            });
          } else {
            // Tidak bisa dorong, Cogneur tetap pindah
            newPlacedCards = placedCards.map((c) =>
              c.positionId === from ? { ...c, positionId: to } : c
            );
          }
        }
        break;

      case "Illusionist":
        // Illusionist: swap posisi dengan karakter lain
        const illusionTarget = placedCards.find((c) => c.positionId === to);
        if (illusionTarget) {
          newPlacedCards = placedCards.map((c) => {
            if (c.positionId === from) return { ...c, positionId: to };
            if (c.positionId === to) return { ...c, positionId: from };
            return c;
          });
        }
        break;

      case "Tavernier":
        // Tavernier: pindahkan ally adjacent 1 kotak
        const tavernierTarget = placedCards.find((c) => c.positionId === to);
        if (tavernierTarget && tavernierTarget.owner === "enemy") {
          // Pindahkan ally ke posisi kosong adjacent
          const allyMoves = SkillManager.getAdjacentPositions(
            to,
            SkillConstants.BOARD_CONFIG
          ).filter((pos) => !placedCards.find((c) => c.positionId === pos));
          if (allyMoves.length > 0) {
            // Pilih posisi yang mendekati King player
            const playerKing = placedCards.find(
              (c) => c.owner === "player" && c.isKing
            );
            let bestAllyMove = allyMoves[0];
            if (playerKing) {
              bestAllyMove = allyMoves.reduce((best, pos) => {
                const distBest = SkillManager.getDistance(
                  best,
                  playerKing.positionId
                );
                const distPos = SkillManager.getDistance(
                  pos,
                  playerKing.positionId
                );
                return distPos < distBest ? pos : best;
              }, allyMoves[0]);
            }
            newPlacedCards = placedCards.map((c) => {
              if (c.positionId === to)
                return { ...c, positionId: bestAllyMove };
              return c;
            });
          }
        }
        break;

      default:
        // Default: gerakan normal
        newPlacedCards = placedCards.map((c) =>
          c.positionId === from ? { ...c, positionId: to } : c
        );
    }
  } catch (e) {
    // Jika error, fallback ke gerakan normal
    console.error("Error executing ability:", e);
    newPlacedCards = placedCards.map((c) =>
      c.positionId === from ? { ...c, positionId: to } : c
    );
  }

  return newPlacedCards;
};

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
    onAILeaderMove, // Callback ketika AI Leader bergerak (untuk trigger Nemesis player)
    difficulty = "Hard", // Default ke Hard (depth 4) agar AI pintar
  } = params;

  // 1. Set state sibuk agar UI tahu AI mulai berpikir
  setAiBusy(true);
  aiThinking.current = true;

  // Dapatkan konfigurasi berdasarkan tingkat kesulitan
  const config = getAiConfig(difficulty);

  // Helper untuk mengeksekusi langkah (baik dari Minimax maupun Random)
  const executeFinalMove = (move, scoreVal = "Random") => {
    if (move) {
      const chosenChar = placedCards.find(
        (c) => c.positionId === move.from
      );
      setSelectedCharacter(chosenChar);

      // Highlight petak tujuan
      setValidMovePositions([move.to]);

      // Log untuk debugging
      console.log(
        `🤖 AI Move (${difficulty}): ${move.charType} from ${move.from} to ${move.to} (${move.moveType}) | Score: ${scoreVal}`
      );

      // Delay visual sebelum karakter benar-benar pindah
      setTimeout(async () => {
        // Eksekusi ability dengan benar
        const newPlaced = await executeAbilityMove(
          move,
          placedCards,
          setPlacedCards,
          setSelectedCharacter,
          setValidMovePositions
        );

        setPlacedCards(newPlaced);
        setCharacterActions((prev) => ({ ...prev, [move.charType]: true }));

        // Jika AI Leader bergerak, trigger Nemesis player
        if (chosenChar && chosenChar.isKing && onAILeaderMove) {
          onAILeaderMove(newPlaced);
        }

        setSelectedCharacter(null);
        setValidMovePositions([]);
        aiThinking.current = false;
        setAiBusy(false);
      }, 800);
    } else {
      // Tidak ada best move, skip
      aiThinking.current = false;
      setAiBusy(false);
    }
  };

  // Gunakan setTimeout 100ms agar browser sempat merender state "AI Thinking..." di layar
  setTimeout(() => {
    transpositionTable.clear();

    const enemiesReady = placedCards.filter(
      (p) => p.owner === "enemy" && !characterActions[p.cardData.type]
    );

    if (enemiesReady.length === 0) {
      setCurrentPhase("recruitment");
      checkSkipRecruitment();
      aiThinking.current = false;
      setAiBusy(false);
      return;
    }

    // 2. Ambil semua langkah (termasuk SKILL jika memungkinkan)
    const allPossibleMoves = getOrderedMoves(
      placedCards,
      "enemy",
      "enemy"
    ).filter((m) => !characterActions[m.charType]);

    if (allPossibleMoves.length === 0) {
      // Tidak ada move tersedia, skip ke recruitment
      setCurrentPhase("recruitment");
      checkSkipRecruitment();
      aiThinking.current = false;
      setAiBusy(false);
      return;
    }

    // === EASY MODE: RANDOM MOVE LOGIC ===
    // Jika difficulty Easy dan kena probabilitas randomness, pilih langkah acak
    if (difficulty === "Easy" && Math.random() < config.randomness) {
      console.log("🎲 AI (Easy): Decided to make a random move!");
      const randomMove = allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
      executeFinalMove(randomMove, "Random (Blunder)");
      return;
    }

    let bestMove = null;
    let bestScore = -Infinity;

    // 3. Perhitungan Minimax
    allPossibleMoves.forEach((move) => {
      const simulatedBoard = applyMove(placedCards, move);
      const score = minimax(
        simulatedBoard,
        config.depth, // Gunakan depth dari config (1, 2, atau 4)
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

    // 4. Eksekusi Langkah Terbaik
    executeFinalMove(bestMove, bestScore);

  }, 500); // Jeda awal 0.5 detik agar pemain merasa AI sedang "melihat papan"
};

// ============================================
// AI RECRUITMENT PHASE - MINIMAX VERSION
// ============================================

// Minimax khusus untuk recruitment (depth lebih rendah untuk performa)
const minimaxRecruitment = (
  cards,
  depth,
  alpha,
  beta,
  isMaximizing,
  aiOwner
) => {
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
      const ev = minimaxRecruitment(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        false,
        aiOwner
      );
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(cards, move);
      const ev = minimaxRecruitment(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        true,
        aiOwner
      );
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// Evaluasi recruitment dengan Minimax
const evaluateRecruitmentOption = (card, position, placedCards, enemyColor) => {
  // Buat karakter baru yang akan direkrut
  const characterImage = `/Assets/Pions_personnages/${
    enemyColor === "white" ? "Blanc" : "Noir"
  }/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_${card.type}.png`;

  const newPiece = {
    positionId: position,
    cardImage: characterImage,
    cardData: card,
    owner: "enemy",
    isKing: false,
  };

  // Simulasikan papan setelah recruitment
  const simulatedBoard = [...placedCards, newPiece];

  // Gunakan Minimax depth 2 untuk evaluasi (cukup cepat)
  // Depth 2 = AI recruit -> Player action -> evaluasi
  const score = minimaxRecruitment(
    simulatedBoard,
    2,
    -Infinity,
    Infinity,
    false, // Setelah AI recruit, giliran player
    "enemy"
  );

  return score;
};

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
  // Params
  difficulty = "Hard", // Default ke Hard agar AI pintar
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

  const recruitmentSpaces = SkillConstants.RECRUITMENT_SPACES["enemy"] || [];
  const emptySpaces = recruitmentSpaces.filter(
    (pos) => !placedCards.find((p) => p.positionId === pos)
  );

  if (emptySpaces.length === 0) {
    handleEndTurnForAI();
    return;
  }

  const config = getAiConfig(difficulty);
  console.log(`🤖 AI Recruitment (${difficulty}): Evaluating options...`);

  // === STRATEGY SELECTION ===
  let bestCard = null;
  let bestPosition = null;

  // Jika Easy Mode, pilih kartu dan posisi secara acak
  if (config.recruitmentRandom) {
    console.log("🎲 AI (Easy): Recruitment is random!");
    bestCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    bestPosition = emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
  } else {
    // === MINIMAX EVALUATION (Medium/Hard) ===
    let bestScore = -Infinity;

    availableCards.forEach((card) => {
      emptySpaces.forEach((position) => {
        const score = evaluateRecruitmentOption(
          card,
          position,
          placedCards,
          enemyColor
        );

        console.log(`  📊 ${card.type} at ${position}: Score = ${score}`);

        if (score > bestScore) {
          bestScore = score;
          bestCard = card;
          bestPosition = position;
        }
      });
    });

    console.log(
      `🤖 AI Recruiting: ${bestCard?.type} at ${bestPosition} (Minimax Score: ${bestScore})`
    );
  }

  // Fallback jika null
  if (!bestCard || !bestPosition) {
    bestCard = availableCards[0];
    bestPosition = emptySpaces[0];
  }

  const characterImage = `/Assets/Pions_personnages/${
    enemyColor === "white" ? "Blanc" : "Noir"
  }/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_${
    bestCard.type
  }.png`;

  // If VieilOurs, place both VieilOurs and Ourson immediately
  if (bestCard.type === "VieilOurs") {
    const remainingSpaces = emptySpaces.filter((s) => s !== bestPosition);
    if (remainingSpaces.length > 0) {
      let bestOursonPos;

      // Logic pemilihan posisi Ourson
      if (config.recruitmentRandom) {
         // Easy: Posisi Ourson random
         bestOursonPos = remainingSpaces[Math.floor(Math.random() * remainingSpaces.length)];
      } else {
         // Medium/Hard: Posisi Ourson optimal dengan Minimax
         let bestOursonScore = -Infinity;
         bestOursonPos = remainingSpaces[0];

         remainingSpaces.forEach((oursonPos) => {
          const oursonImage = `/Assets/Pions_personnages/${
            enemyColor === "white" ? "Blanc" : "Noir"
          }/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_Ourson.png`;

          const simulatedBoard = [
            ...placedCards,
            {
              positionId: bestPosition,
              cardImage: characterImage,
              cardData: bestCard,
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

          const score = evaluateState(simulatedBoard, "enemy");
          if (score > bestOursonScore) {
            bestOursonScore = score;
            bestOursonPos = oursonPos;
          }
        });
      }

      const oursonImage = `/Assets/Pions_personnages/${
        enemyColor === "white" ? "Blanc" : "Noir"
      }/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_Ourson.png`;

      const newPlaced = [
        ...placedCards,
        {
          positionId: bestPosition,
          cardImage: characterImage,
          cardData: bestCard,
          owner: "enemy",
          isKing: false,
        },
        {
          positionId: bestOursonPos,
          cardImage: oursonImage,
          cardData: { type: "Ourson" },
          owner: "enemy",
          isKing: false,
          isOurson: true,
        },
      ];

      let finalAvailable = availableCards.filter(
        (av) => av.type !== bestCard.type
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
      positionId: bestPosition,
      cardImage: characterImage,
      cardData: bestCard,
      owner: "enemy",
      isKing: false,
    },
  ];

  let finalAvailable = availableCards.filter((av) => av.type !== bestCard.type);
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