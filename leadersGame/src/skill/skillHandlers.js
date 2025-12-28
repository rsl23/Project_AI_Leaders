// src/utils/skillHandlers.js
import * as SkillManager from "./skillManager";

// ============================================
// ABILITY INITIALIZATION HANDLERS
// ============================================

export const handleAcrobateAbility = (character, placedCards, boardConfig) => {
  const jumpPositions = SkillManager.getAcrobateJumpPositions(
    character.positionId,
    placedCards,
    boardConfig
  );

  if (jumpPositions.length === 0) {
    throw new Error(
      "Tidak ada posisi valid untuk melompat! Harus ada karakter adjacent untuk dilompati."
    );
  }

  return {
    abilityMode: "acrobate_jump",
    validMovePositions: jumpPositions,
    abilityData: { jumpCount: 0 },
  };
};

export const handleCavalierAbility = (character, placedCards, boardConfig) => {
  const validMoves = SkillManager.getCavalierValidMoves(
    character.positionId,
    placedCards,
    boardConfig
  );

  if (validMoves.length === 0) {
    throw new Error("Tidak ada posisi valid untuk move 2 space!");
  }

  return {
    abilityMode: "cavalier_move",
    validMovePositions: validMoves,
  };
};

export const handleCogneurAbility = (
  character,
  placedCards,
  turn,
  boardConfig
) => {
  const enemies = SkillManager.getAdjacentPositions(
    character.positionId,
    boardConfig
  ).filter((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    // Syarat: Musuh DAN tidak dilindungi Protector
    return (
      char &&
      char.owner !== turn &&
      !SkillManager.isProtectedFromMovement(pos, placedCards)
    );
  });

  if (enemies.length === 0) {
    throw new Error("Musuh di sekitar dilindungi oleh Protector!");
  }

  return {
    abilityMode: "cogneur_select_enemy",
    validMovePositions: enemies,
  };
};

export const handleGardeRoyalAbility = (
  character,
  placedCards,
  turn,
  boardConfig
) => {
  const leader = placedCards.find((c) => c.owner === turn && c.isKing);
  if (!leader) {
    throw new Error("Leader tidak ditemukan!");
  }

  const teleportPositions = SkillManager.getGardeRoyalTeleportPositions(
    leader.positionId,
    placedCards,
    boardConfig
  );

  if (teleportPositions.length === 0) {
    throw new Error("Tidak ada space kosong adjacent ke Leader!");
  }

  return {
    abilityMode: "garde_teleport",
    validMovePositions: teleportPositions,
  };
};

export const handleLanceGrappinAbility = (
  character,
  placedCards,
  boardConfig
) => {
  const allTargets = SkillManager.getLanceGrappinTargets(
    character.positionId,
    placedCards,
    boardConfig
  );

  // FILTER: Hilangkan target yang dilindungi Protector
  const validTargets = allTargets.filter(
    (targetPos) => !SkillManager.isProtectedFromMovement(targetPos, placedCards)
  );

  if (validTargets.length === 0) {
    throw new Error("Target terhalang atau dilindungi oleh Protector!");
  }

  return {
    abilityMode: "lance_select_target",
    validMovePositions: validTargets,
  };
};

export const handleManipulatorAbility = (
  character,
  placedCards,
  turn,
  boardConfig
) => {
  const targets = SkillManager.getManipulatorTargets(
    character.positionId,
    placedCards,
    turn,
    boardConfig
  );

  const validTargets = targets.filter(
    (targetPos) => !SkillManager.isProtectedFromMovement(targetPos, placedCards)
  );

  if (validTargets.length === 0) {
    throw new Error("Tidak ada musuh non-adjacent yang dapat dipindah!");
  }

  return {
    abilityMode: "manipulator_select_target",
    validMovePositions: validTargets,
  };
};

export const handleRodeuseAbility = (
  character,
  placedCards,
  turn,
  boardConfig
) => {
  const validMoves = SkillManager.getRodeuseValidMoves(
    character.positionId,
    placedCards,
    turn,
    boardConfig
  );

  if (validMoves.length === 0) {
    throw new Error("Tidak ada space yang non-adjacent ke musuh!");
  }

  return {
    abilityMode: "rodeuse_move",
    validMovePositions: validMoves,
  };
};

// Tahap 1: Mencari teman (Ally) yang menempel dengan Tavernier
export const handleTavernierAbility = (
  character,
  placedCards,
  turn,
  boardConfig
) => {
  // Gunakan getAdjacentPositions yang sudah berbasis Cube agar akurat
  const allies = SkillManager.getTavernierAllies(
    character.positionId,
    placedCards,
    turn,
    boardConfig
  );

  if (allies.length === 0) {
    throw new Error("Tidak ada sekutu atau Raja di sekitar Tavernier!");
  }

  return {
    abilityMode: "tavernier_select_ally",
    validMovePositions: allies, // Di sini HANYA berisi [A, B, King] jika mereka nempel Tavernier. C tidak akan ada di sini.
  };
};

// Tahap 2: Setelah pemain klik Ally (A atau B), cari petak kosong di sekitarnya
export const getTavernierMoveOptions = (selectedAllyPos, placedCards) => {
  const adjacentToAlly = SkillManager.getAdjacentPositions(selectedAllyPos);

  // Cari petak kosong di sekitar Ally yang dipilih
  return adjacentToAlly.filter(
    (pos) => !placedCards.some((c) => c.positionId === pos)
  );
};

export const handleIllusionistAbility = (
  character,
  placedCards,
  boardConfig
) => {
  // Panggil fungsi yang sudah kita perbaiki di atas
  const allTargets = SkillManager.getIllusionistTargets(
    character.positionId,
    placedCards,
    boardConfig
  );

  const validTargets = allTargets.filter(
    (targetPos) => !SkillManager.isProtectedFromMovement(targetPos, placedCards)
  );

  if (validTargets.length === 0) {
    throw new Error(
      "Tidak ada karakter valid (non-adjacent & lurus) yang terlihat!"
    );
  }

  return {
    abilityMode: "illusionist_select_target",
    validMovePositions: validTargets,
  };
};
// ============================================
// ABILITY EXECUTION HANDLERS
// ============================================

export const executeAcrobateJump = (
  character,
  targetPos,
  placedCards,
  abilityData,
  boardConfig
) => {
  const startCube = SkillManager.toCube(character.positionId);
  const endCube = SkillManager.toCube(targetPos);

  // Cari petak di tengah (petak yang dilompati)
  // Karena jarak lompat selalu 2, petak tengah adalah rata-rata Start dan End
  const jumpedCube = {
    x: (startCube.x + endCube.x) / 2,
    y: (startCube.y + endCube.y) / 2,
    z: (startCube.z + endCube.z) / 2,
  };
  const jumpedOverPosition = SkillManager.fromCube(
    jumpedCube.x,
    jumpedCube.y,
    jumpedCube.z
  );

  // 1. Pindahkan karakter ke posisi tujuan
  const newPlacedCards = placedCards.map((card) =>
    card.positionId === character.positionId
      ? { ...card, positionId: targetPos }
      : card
  );

  const newJumpCount = (abilityData.jumpCount || 0) + 1;

  // 2. Cek apakah bisa melompat lagi (maksimal 2 kali)
  let nextJumpPositions = [];
  if (newJumpCount < 2) {
    nextJumpPositions = SkillManager.getAcrobateJumpPositions(
      targetPos,
      newPlacedCards,
      boardConfig,
      jumpedOverPosition // Kirim petak yang baru dilompati agar tidak bisa balik arah
    );
  }

  return {
    newPlacedCards,
    abilityData: {
      ...abilityData,
      jumpCount: newJumpCount,
      lastJumpedOver: jumpedOverPosition,
    },
    // Jika masih bisa melompat dan ada posisi tujuan, biarkan mode aktif
    shouldContinue: newJumpCount < 2 && nextJumpPositions.length > 0,
    nextValidPositions: nextJumpPositions,
  };
};

export const executeCogneurPush = (
  cogneurPos,
  enemyPos,
  pushPos, // Ini petak yang dipilih player dari 3 pilihan tadi
  placedCards,
  boardConfig
) => {
  if (SkillManager.isProtectedFromMovement(enemyPos, placedCards)) {
    console.warn("Gagal mendorong: Target dilindungi Protector!");
    return placedCards;
  }

  // 1. Pindahkan musuh ke petak dorong yang dipilih
  let newPlacedCards = placedCards.map((card) =>
    card.positionId === enemyPos ? { ...card, positionId: pushPos } : card
  );

  // 2. Pindahkan Cogneur ke bekas petak musuh
  newPlacedCards = newPlacedCards.map((card) =>
    card.positionId === cogneurPos ? { ...card, positionId: enemyPos } : card
  );

  return newPlacedCards;
};

export const executeGardeRoyalTeleport = (
  character,
  teleportPos,
  placedCards,
  boardConfig
) => {
  // Move character to teleport position
  let newPlacedCards = placedCards.map((card) =>
    card.positionId === character.positionId
      ? { ...card, positionId: teleportPos }
      : card
  );

  // Check for additional move
  const adjacentPositions = SkillManager.getAdjacentPositions(
    teleportPos,
    boardConfig
  );
  const emptyAdjacent = adjacentPositions.filter(
    (pos) => !newPlacedCards.find((c) => c.positionId === pos)
  );

  return {
    newPlacedCards,
    canMoveAgain: emptyAdjacent.length > 0,
    additionalMovePositions: emptyAdjacent,
  };
};

export const executeLanceGrappin = (
  lancePos,
  targetPos,
  shouldMoveToTarget,
  placedCards,
  boardConfig
) => {
  //hasil baru

  if (SkillManager.isProtectedFromMovement(targetPos, placedCards)) {
    console.warn("Gagal mendorong: Target dilindungi Protector!");
    return placedCards;
  }

  let newPlacedCards = [...placedCards];

  if (shouldMoveToTarget) {
    // OPSI 1: Lance pindah ke dekat target
    let currentPos = lancePos;
    let lastEmptyPos = lancePos;

    // Iterasi setiap petak dalam garis lurus sampai sebelum target
    while (currentPos !== targetPos) {
      const nextPos = SkillManager.getNextPositionInDirection(
        currentPos,
        targetPos,
        1
      );

      if (!nextPos || nextPos === targetPos) break;

      const isOccupied = newPlacedCards.find((c) => c.positionId === nextPos);
      if (isOccupied) break; // Berhenti jika ada halangan

      lastEmptyPos = nextPos;
      currentPos = nextPos;
    }

    newPlacedCards = newPlacedCards.map((card) =>
      card.positionId === lancePos
        ? { ...card, positionId: lastEmptyPos }
        : card
    );
  } else {
    // OPSI 2: Tarik target ke dekat Lance
    // Cari posisi adjacent ke Lance yang berada di jalur menuju target
    const dragPos = SkillManager.getAdjacentPositions(lancePos).find((pos) => {
      // Petak harus kosong dan berada di garis lurus yang sama dengan target
      const isEmpty = !newPlacedCards.find((c) => c.positionId === pos);
      return (
        isEmpty &&
        SkillManager.isStraightLine(pos, targetPos) &&
        SkillManager.getDistance(pos, targetPos) <
          SkillManager.getDistance(lancePos, targetPos)
      );
    });

    if (dragPos) {
      newPlacedCards = newPlacedCards.map((card) =>
        card.positionId === targetPos ? { ...card, positionId: dragPos } : card
      );
    }
  }

  return newPlacedCards;
};

export const executeIllusionistSwitch = (
  illusionistPos,
  targetPos,
  placedCards
) => {
  // Cek terakhir sebelum dorong
  if (SkillManager.isProtectedFromMovement(targetPos, placedCards)) {
    console.warn("Gagal mendorong: Target dilindungi Protector!");
    return placedCards;
  }

  const newPlacedCards = placedCards.map((card) => {
    if (card.positionId === illusionistPos) {
      return { ...card, positionId: targetPos };
    }
    if (card.positionId === targetPos) {
      return { ...card, positionId: illusionistPos };
    }
    return card;
  });

  return newPlacedCards;
};

// ============================================
// WIN CONDITION CHECKS
// ============================================

export const checkAssassinCapture = (
  kingPos,
  placedCards,
  attackerOwner,
  boardConfig
) => {
  if (!kingPos) return false;

  const assassinAdjacent = placedCards.find(
    (p) =>
      p.owner === attackerOwner &&
      p.cardData.type === "Assassin" &&
      SkillManager.isAdjacent(p.positionId, kingPos, boardConfig)
  );

  return !!assassinAdjacent;
};

export const checkArcherCapture = (
  kingPos,
  placedCards,
  attackerOwner,
  boardConfig
) => {
  if (!kingPos) return false;

  const archers = placedCards.filter(
    (p) => p.owner === attackerOwner && p.cardData.type === "Archer"
  );

  // Check each Archer
  for (const archer of archers) {
    // Archer does NOT help when adjacent
    if (SkillManager.isAdjacent(archer.positionId, kingPos, boardConfig)) {
      continue;
    }

    // Check if Archer is exactly 2 spaces away in a straight line
    // NOTE: Leader does NOT need to be visible (obstacles allowed)
    if (
      SkillManager.isTwoSpacesAwayInStraightLine(
        archer.positionId,
        kingPos,
        boardConfig
      )
    ) {
      // Archer from 2 spaces can capture the king directly
      return true;
    }
  }

  return false;
};

export const checkNormalCapture = (
  kingPos,
  placedCards,
  attackerOwner,
  boardConfig
) => {
  if (!kingPos) return false;

  const attackersAdjacent = placedCards.filter(
    (p) =>
      p.owner === attackerOwner &&
      SkillManager.isAdjacent(p.positionId, kingPos, boardConfig) &&
      p.cardData.type !== "Archer" // Archer doesn't count when adjacent
  );

  return attackersAdjacent.length >= 2;
};

export const checkSurrounded = (kingPos, placedCards, boardConfig) => {
  if (!kingPos) return false;

  const allAdjacent = SkillManager.getAdjacentPositions(kingPos, boardConfig);
  return allAdjacent.every((pos) =>
    placedCards.find((p) => p.positionId === pos)
  );
};

// ============================================
// PASSIVE ABILITY CHECKS
// ============================================

export const checkJailerEffect = (
  characterPos,
  placedCards,
  turn,
  boardConfig
) => {
  // Check if there's a Jailer adjacent to this character
  const adjacentPositions = SkillManager.getAdjacentPositions(
    characterPos,
    boardConfig
  );
  const adjacentJailers = adjacentPositions.filter((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.cardData.type === "Geolier" && char.owner !== turn;
  });

  return adjacentJailers.length > 0;
};

export const checkProtectorEffect = (
  characterPos,
  placedCards,
  turn,
  boardConfig
) => {
  // Check if character is adjacent to Protector of same owner
  const adjacentPositions = SkillManager.getAdjacentPositions(
    characterPos,
    boardConfig
  );
  const adjacentProtectors = adjacentPositions.filter((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.cardData.type === "Protector" && char.owner === turn;
  });

  return adjacentProtectors.length > 0;
};

export const checkVizirEffect = (leaderPos, placedCards, turn) => {
  // Check if Vizir exists on the board for this player
  const vizir = placedCards.find(
    (p) => p.cardData.type === "Vizir" && p.owner === turn
  );

  return !!vizir;
};

// ============================================
// SPECIAL ABILITIES
// ============================================

export const handleHermitCubRecruitment = () => {
  // Hermit & Cub are recruited together
  return {
    abilityMode: "hermit_cub_recruitment",
    abilityData: { characters: ["VieilOurs", "Cub"], count: 2 },
  };
};

export const handleNemesisMovement = (
  nemesisPos,
  opponentLeaderPos,
  placedCards,
  boardConfig
) => {
  // Nemesis must move 2 spaces towards opponent Leader when Leader moves
  // if (!nemesisPos || !opponentLeaderPos) return null;

  // const direction = SkillManager.getDirection(nemesisPos, opponentLeaderPos);

  // // Try to move 2 spaces in that direction
  // let firstMove = SkillManager.getNextPositionInDirection(
  //   nemesisPos,
  //   direction,
  //   boardConfig
  // );
  // let secondMove = firstMove
  //   ? SkillManager.getNextPositionInDirection(firstMove, direction, boardConfig)
  //   : null;

  // // Check if positions are valid and empty
  // const validPositions = [];

  // if (firstMove && !placedCards.find((c) => c.positionId === firstMove)) {
  //   validPositions.push(firstMove);
  // }

  // if (secondMove && !placedCards.find((c) => c.positionId === secondMove)) {
  //   validPositions.push(secondMove);
  // }

  // return {
  //   validPositions,
  //   canMove: validPositions.length > 0,
  // };

  if (!nemesisPos || !opponentLeaderPos) return null;

  // Coba maju 1 langkah dulu
  let firstMove = SkillManager.getNextPositionInDirection(
    nemesisPos,
    opponentLeaderPos,
    1
  );
  // Coba maju 2 langkah
  let secondMove = SkillManager.getNextPositionInDirection(
    nemesisPos,
    opponentLeaderPos,
    2
  );

  const validPositions = [];
  if (firstMove && !placedCards.find((c) => c.positionId === firstMove)) {
    validPositions.push(firstMove);
  }
  if (secondMove && !placedCards.find((c) => c.positionId === secondMove)) {
    validPositions.push(secondMove);
  }

  return { validPositions, canMove: validPositions.length > 0 };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getCharacterAdjacentEnemies = (
  characterPos,
  placedCards,
  turn,
  boardConfig
) => {
  const adjacentPositions = SkillManager.getAdjacentPositions(
    characterPos,
    boardConfig
  );
  return adjacentPositions.filter((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.owner !== turn;
  });
};

export const getCharacterAdjacentAllies = (
  characterPos,
  placedCards,
  turn,
  boardConfig
) => {
  const adjacentPositions = SkillManager.getAdjacentPositions(
    characterPos,
    boardConfig
  );
  return adjacentPositions.filter((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.owner === turn;
  });
};

export const getAvailableMovePositions = (
  characterPos,
  placedCards,
  boardConfig
) => {
  const adjacentPositions = SkillManager.getAdjacentPositions(
    characterPos,
    boardConfig
  );
  return adjacentPositions.filter(
    (pos) => !placedCards.find((c) => c.positionId === pos)
  );
};

export const isCharacterVisible = (
  fromPos,
  toPos,
  placedCards,
  boardConfig
) => {
  return SkillManager.isVisibleInStraightLine(
    fromPos,
    toPos,
    placedCards,
    boardConfig
  );
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  // Ability Initialization
  handleAcrobateAbility,
  handleCavalierAbility,
  handleCogneurAbility,
  handleGardeRoyalAbility,
  handleLanceGrappinAbility,
  handleManipulatorAbility,
  handleRodeuseAbility,
  handleTavernierAbility,
  handleIllusionistAbility,

  // Ability Execution
  executeAcrobateJump,
  executeCogneurPush,
  executeGardeRoyalTeleport,
  executeLanceGrappin,
  executeIllusionistSwitch,

  // Win Condition Checks
  checkAssassinCapture,
  checkArcherCapture,
  checkNormalCapture,
  checkSurrounded,

  // Passive Ability Checks
  checkJailerEffect,
  checkProtectorEffect,
  checkVizirEffect,

  // Special Abilities
  handleHermitCubRecruitment,
  handleNemesisMovement,

  // Helper Functions
  getCharacterAdjacentEnemies,
  getCharacterAdjacentAllies,
  getAvailableMovePositions,
  isCharacterVisible,
};
