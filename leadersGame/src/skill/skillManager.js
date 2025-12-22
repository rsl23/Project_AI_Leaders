// src/utils/skillManager.js

// Board configuration
export const BOARD_CONFIG = {
  1: 4,
  2: 5,
  3: 6,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
};

// ============================================
// CORE HELPER FUNCTIONS
// ============================================

export const getAdjacentPositions = (
  positionId,
  boardConfig = BOARD_CONFIG
) => {
  const [_, row, col] = positionId.split("-").map(Number);
  const maxCols = boardConfig;
  const adjacent = [];

  // Horizontal neighbors
  if (col > 1) adjacent.push(`hex-${row}-${col - 1}`);
  if (col < maxCols[row]) adjacent.push(`hex-${row}-${col + 1}`);

  // Vertical & diagonal neighbors
  const neighbors = [];

  // Row above (row - 1)
  if (row > 1) {
    const prevRowCols = maxCols[row - 1];
    if (row <= 4) {
      // Rows 1-4: expanding rows
      if (col - 1 >= 1 && col - 1 <= prevRowCols)
        neighbors.push({ r: row - 1, c: col - 1 });
      if (col >= 1 && col <= prevRowCols)
        neighbors.push({ r: row - 1, c: col });
    } else {
      // Rows 5-7: contracting rows
      if (col >= 1 && col <= prevRowCols)
        neighbors.push({ r: row - 1, c: col });
      if (col + 1 >= 1 && col + 1 <= prevRowCols)
        neighbors.push({ r: row - 1, c: col + 1 });
    }
  }

  // Row below (row + 1)
  if (row < 7) {
    const nextRowCols = maxCols[row + 1];
    if (row < 4) {
      // Rows 1-3: expanding rows
      if (col >= 1 && col <= nextRowCols)
        neighbors.push({ r: row + 1, c: col });
      if (col + 1 >= 1 && col + 1 <= nextRowCols)
        neighbors.push({ r: row + 1, c: col + 1 });
    } else {
      // Rows 4-6: contracting rows
      if (col - 1 >= 1 && col - 1 <= nextRowCols)
        neighbors.push({ r: row + 1, c: col - 1 });
      if (col >= 1 && col <= nextRowCols)
        neighbors.push({ r: row + 1, c: col });
    }
  }

  neighbors.forEach(({ r, c }) => {
    adjacent.push(`hex-${r}-${c}`);
  });

  return adjacent;
};

export const getDirection = (fromPos, toPos) => {
  const [_, fromRow, fromCol] = fromPos.split("-").map(Number);
  const [__, toRow, toCol] = toPos.split("-").map(Number);
  return {
    deltaRow: toRow - fromRow,
    deltaCol: toCol - fromCol,
  };
};

export const getNextPositionInDirection = (
  currentPos,
  direction,
  boardConfig = BOARD_CONFIG
) => {
  const [_, row, col] = currentPos.split("-").map(Number);
  const maxCols = boardConfig;

  const newRow = row + direction.deltaRow;
  if (newRow < 1 || newRow > 7) return null;

  let newCol = col + direction.deltaCol;

  // Adjust for hexagonal geometry when crossing row 4
  if (direction.deltaRow !== 0) {
    const fromExpanding = row < 4;
    const toExpanding = newRow < 4;
    const fromRow4 = row === 4;
    const toRow4 = newRow === 4;

    // When moving from row 4 to row 5 (expanding to contracting)
    // or from row 5 to row 4 (contracting to expanding)
    if ((fromRow4 && newRow === 5) || (row === 5 && toRow4)) {
      // Column offset adjustment for hex grid transition
      if (direction.deltaRow > 0 && fromRow4) {
        // Moving down from row 4 to row 5: no adjustment needed
        // Row 4 has 7 cols, row 5 has 6 cols
        // Adjacent pattern already handles this
      } else if (direction.deltaRow < 0 && toRow4) {
        // Moving up from row 5 to row 4: no adjustment needed
      }
    }
  }

  if (newCol < 1 || newCol > (maxCols[newRow] || 0)) return null;
  return `hex-${newRow}-${newCol}`;
};

export const isVisibleInStraightLine = (
  fromPos,
  toPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  if (fromPos === toPos) return false;

  // Try all 6 possible hex directions from start
  const adjacent = getAdjacentPositions(fromPos, boardConfig);

  for (const firstStep of adjacent) {
    const path = walkInDirection(fromPos, firstStep, toPos, boardConfig);

    if (path && path[path.length - 1] === toPos) {
      // Found a straight path! Check for obstacles
      let hasObstacle = false;
      for (let i = 1; i < path.length - 1; i++) {
        const obstacle = placedCards.find(
          (card) => card.positionId === path[i]
        );
        if (obstacle) {
          hasObstacle = true;
          break;
        }
      }

      if (!hasObstacle) {
        return true;
      }
    }
  }

  return false;
};

// Walk in a consistent hexagonal direction from start toward target
const walkInDirection = (start, firstStep, target, boardConfig) => {
  const path = [start, firstStep];
  let current = firstStep;

  // Check if firstStep is already the target
  if (firstStep === target) {
    return path;
  }

  // Determine the direction type from first step
  const [_, r1, c1] = start.split("-").map(Number);
  const [__, r2, c2] = firstStep.split("-").map(Number);
  const initialDr = r2 - r1;
  const initialDc = c2 - c1;

  for (let step = 0; step < 10; step++) {
    // Get adjacent positions
    const adj = getAdjacentPositions(current, boardConfig);

    // Find the next position that continues in the "same" hexagonal direction
    let nextPos = null;

    for (const candidate of adj) {
      const [___, curR, curC] = current.split("-").map(Number);
      const [____, candR, candC] = candidate.split("-").map(Number);
      const dr = candR - curR;
      const dc = candC - curC;

      // Check if this candidate continues in the same direction type
      if (isSameHexDirection(initialDr, initialDc, r1, dr, dc, curR)) {
        nextPos = candidate;
        break;
      }
    }

    if (!nextPos) {
      return null; // Can't continue in this direction
    }

    path.push(nextPos);

    if (nextPos === target) {
      return path;
    }

    current = nextPos;
  }

  return null; // Didn't reach target
};

// Check if two direction vectors represent the same hexagonal direction
// accounting for row expansion/contraction effects
const isSameHexDirection = (dr1, dc1, startRow1, dr2, dc2, startRow2) => {
  // Horizontal directions
  if (dr1 === 0 && dr2 === 0) {
    return Math.sign(dc1) === Math.sign(dc2);
  }

  // Different row directions means different hex direction
  if (Math.sign(dr1) !== Math.sign(dr2)) {
    return false;
  }

  // Must have same deltaRow magnitude
  if (Math.abs(dr1) !== Math.abs(dr2)) {
    return false;
  }

  // Map (dr, dc, startRow) to direction category
  // For hexagonal grid, diagonals can have varying deltaCol due to row expansion/contraction
  // but they're still the same visual direction

  const getDirectionCategory = (dr, dc, row) => {
    if (dr === 0) return dc > 0 ? "EAST" : "WEST";

    if (dr > 0) {
      // Moving down rows
      if (dc > 0) return "SOUTHEAST";
      if (dc < 0) return "SOUTHWEST";
      // dc === 0 can be either SE or SW depending on row transition
      // Treat as both
      return row <= 4 ? "SOUTHWEST" : "SOUTHEAST";
    } else {
      // Moving up rows
      if (dc > 0) return "NORTHEAST";
      if (dc < 0) return "NORTHWEST";
      // dc === 0 can be either NE or NW depending on row transition
      return row <= 4 || row > 4
        ? "NORTHEAST_OR_NORTHWEST"
        : "NORTHEAST_OR_NORTHWEST";
    }
  };

  const cat1 = getDirectionCategory(dr1, dc1, startRow1);
  const cat2 = getDirectionCategory(dr2, dc2, startRow2);

  // Same category means same direction
  if (cat1 === cat2) return true;

  // Special case: moving down with dc=0 can be either SE or SW
  if (dr1 > 0 && dr2 > 0 && dc1 === 0 && dc2 === 0) return true;
  if (dr1 > 0 && dr2 > 0) {
    // Allow SE/SW interchange
    if (
      (cat1 === "SOUTHEAST" || cat1 === "SOUTHWEST") &&
      (cat2 === "SOUTHEAST" || cat2 === "SOUTHWEST")
    ) {
      return true;
    }
  }

  // Moving up: allow NE/NW interchange
  if (dr1 < 0 && dr2 < 0) {
    if (
      (cat1 === "NORTHEAST" ||
        cat1 === "NORTHWEST" ||
        cat1 === "NORTHEAST_OR_NORTHWEST") &&
      (cat2 === "NORTHEAST" ||
        cat2 === "NORTHWEST" ||
        cat2 === "NORTHEAST_OR_NORTHWEST")
    ) {
      return true;
    }
  }

  return false;
};

export const isAdjacent = (pos1, pos2, boardConfig = BOARD_CONFIG) => {
  return getAdjacentPositions(pos1, boardConfig).includes(pos2);
};

export const getDistanceInStraightLine = (pos1, pos2) => {
  const [_, row1, col1] = pos1.split("-").map(Number);
  const [__, row2, col2] = pos2.split("-").map(Number);
  return Math.max(Math.abs(row2 - row1), Math.abs(col2 - col1));
};

// ============================================
// SKILL-SPECIFIC FUNCTIONS
// ============================================

export const getAcrobateJumpPositions = (
  characterPos,
  placedCards,
  boardConfig = BOARD_CONFIG,
  excludePosition = null // Position to exclude (the character we just jumped over)
) => {
  const validJumps = [];
  const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);

  adjacentPositions.forEach((adjPos) => {
    // Skip the position we just jumped from (to prevent jumping back over same character)
    if (adjPos === excludePosition) return;

    const hasCharacter = placedCards.find((card) => card.positionId === adjPos);
    if (hasCharacter) {
      const direction = getDirection(characterPos, adjPos);
      const landingPos = getNextPositionInDirection(
        adjPos,
        direction,
        boardConfig
      );

      if (landingPos) {
        const isOccupied = placedCards.find(
          (card) => card.positionId === landingPos
        );
        if (!isOccupied) {
          validJumps.push(landingPos);
        }
      }
    }
  });

  return validJumps;
};

export const getCavalierValidMoves = (
  characterPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  const validMoves = [];
  // Get all 6 adjacent positions (hexagonal directions)
  const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);

  // For each hexagonal direction, try to move 2 spaces in straight line
  adjacentPositions.forEach((adjPos) => {
    const direction = getDirection(characterPos, adjPos);

    // Get position 1 space away
    const pos1 = adjPos;
    // Get position 2 spaces away (in same direction)
    const pos2 = getNextPositionInDirection(pos1, direction, boardConfig);

    if (pos2) {
      const isPos1Empty = !placedCards.find((c) => c.positionId === pos1);
      const isPos2Empty = !placedCards.find((c) => c.positionId === pos2);
      // Both positions must be empty
      if (isPos1Empty && isPos2Empty) {
        validMoves.push(pos2);
      }
    }
  });

  return validMoves;
};

export const getCogneurPushPositions = (
  cogneurPos,
  enemyPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  // Get direction from Cogneur to Enemy
  const attackDir = getDirection(cogneurPos, enemyPos);

  // Get all 6 adjacent positions around the enemy
  const allAdjacentToEnemy = getAdjacentPositions(enemyPos, boardConfig);

  // Filter to get exactly 3 positions "behind" the enemy
  const pushPositions = allAdjacentToEnemy.filter((pos) => {
    // Cannot push back to where Cogneur is standing
    if (pos === cogneurPos) return false;

    const dirToPos = getDirection(enemyPos, pos);

    // Calculate dot product between attack direction and direction to push position
    const dotProduct =
      attackDir.deltaRow * dirToPos.deltaRow +
      attackDir.deltaCol * dirToPos.deltaCol;

    // Position is "behind" if dot product > 0 (strictly positive angle)
    // This gives us 3 positions: straight back + left-back + right-back
    const isBehind = dotProduct > 0;

    // Also check if position is empty
    const isEmpty = !placedCards.find((c) => c.positionId === pos);

    return isBehind && isEmpty;
  });

  return pushPositions;
};

export const getGardeRoyalTeleportPositions = (
  leaderPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  const adjacentToLeader = getAdjacentPositions(leaderPos, boardConfig);
  return adjacentToLeader.filter(
    (pos) => !placedCards.find((c) => c.positionId === pos)
  );
};

export const getLanceGrappinTargets = (
  characterPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  const allPositions = [];
  for (let row = 1; row <= 7; row++) {
    const maxCols = boardConfig;
    for (let col = 1; col <= maxCols[row]; col++) {
      const pos = `hex-${row}-${col}`;
      if (pos !== characterPos) {
        const hasChar = placedCards.find((c) => c.positionId === pos);
        if (
          hasChar &&
          isVisibleInStraightLine(characterPos, pos, placedCards, boardConfig)
        ) {
          allPositions.push(pos);
        }
      }
    }
  }
  return allPositions;
};

export const getManipulatorTargets = (
  characterPos,
  placedCards,
  turn,
  boardConfig = BOARD_CONFIG
) => {
  const targets = [];
  placedCards.forEach((card) => {
    if (
      card.owner !== turn &&
      !isAdjacent(characterPos, card.positionId, boardConfig)
    ) {
      if (
        isVisibleInStraightLine(
          characterPos,
          card.positionId,
          placedCards,
          boardConfig
        )
      ) {
        targets.push(card.positionId);
      }
    }
  });
  return targets;
};

export const getRodeuseValidMoves = (
  characterPos,
  placedCards,
  turn,
  boardConfig = BOARD_CONFIG
) => {
  const allEnemyPositions = placedCards
    .filter((c) => c.owner !== turn)
    .map((c) => c.positionId);

  const allPositions = [];
  for (let row = 1; row <= 7; row++) {
    const maxCols = boardConfig;
    for (let col = 1; col <= maxCols[row]; col++) {
      const pos = `hex-${row}-${col}`;
      const isOccupied = placedCards.find((c) => c.positionId === pos);
      if (!isOccupied) {
        const isAdjacentToEnemy = allEnemyPositions.some((enemyPos) =>
          isAdjacent(pos, enemyPos, boardConfig)
        );
        if (!isAdjacentToEnemy) {
          allPositions.push(pos);
        }
      }
    }
  }
  return allPositions;
};

export const getTavernierAllies = (
  characterPos,
  placedCards,
  turn,
  boardConfig = BOARD_CONFIG
) => {
  const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);
  return adjacentPositions.filter((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.owner === turn && !char.isKing;
  });
};

export const getIllusionistTargets = (
  characterPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  const targets = [];
  placedCards.forEach((card) => {
    if (
      card.positionId !== characterPos &&
      !isAdjacent(characterPos, card.positionId, boardConfig)
    ) {
      if (
        isVisibleInStraightLine(
          characterPos,
          card.positionId,
          placedCards,
          boardConfig
        )
      ) {
        targets.push(card.positionId);
      }
    }
  });
  return targets;
};

// ============================================
// PASSIVE ABILITY FUNCTIONS
// ============================================

export const checkJailerAdjacent = (
  characterPos,
  placedCards,
  turn,
  boardConfig = BOARD_CONFIG
) => {
  const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);
  return adjacentPositions.some((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.cardData.type === "Geolier" && char.owner !== turn;
  });
};

export const checkProtectorAdjacent = (
  characterPos,
  placedCards,
  turn,
  boardConfig = BOARD_CONFIG
) => {
  const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);
  return adjacentPositions.some((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    return char && char.cardData.type === "Protector" && char.owner === turn;
  });
};

// ============================================
// NEMESIS FUNCTIONS
// ============================================

export const calculateNemesisMovement = (
  nemesisPos,
  opponentLeaderPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  if (!nemesisPos || !opponentLeaderPos)
    return { validPositions: [], canMove: false };

  const direction = getDirection(nemesisPos, opponentLeaderPos);

  // Try to move 2 spaces in direction
  let firstMove = getNextPositionInDirection(
    nemesisPos,
    direction,
    boardConfig
  );
  let secondMove = firstMove
    ? getNextPositionInDirection(firstMove, direction, boardConfig)
    : null;

  // Check if positions are valid and empty
  const validPositions = [];

  if (firstMove && !placedCards.find((c) => c.positionId === firstMove)) {
    validPositions.push(firstMove);
  }

  if (secondMove && !placedCards.find((c) => c.positionId === secondMove)) {
    validPositions.push(secondMove);
  }

  return {
    validPositions,
    canMove: validPositions.length > 0,
  };
};

// ============================================
// HERMIT & CUB FUNCTIONS
// ============================================

export const getHermitCubRecruitmentPositions = (
  placedCards,
  turn,
  boardConfig = BOARD_CONFIG
) => {
  // Recruitment spaces for Hermit & Cub
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

  return recruitmentSpaces.filter(
    (pos) => !placedCards.find((c) => c.positionId === pos)
  );
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getAllEmptyPositions = (boardConfig = BOARD_CONFIG) => {
  const allPositions = [];
  for (let row = 1; row <= 7; row++) {
    const maxCols = boardConfig[row];
    for (let col = 1; col <= maxCols; col++) {
      allPositions.push(`hex-${row}-${col}`);
    }
  }
  return allPositions;
};

export const getPositionCoordinates = (positionId) => {
  const [_, row, col] = positionId.split("-").map(Number);
  return { row, col };
};

export const isValidPosition = (positionId, boardConfig = BOARD_CONFIG) => {
  const { row, col } = getPositionCoordinates(positionId);
  return row >= 1 && row <= 7 && col >= 1 && col <= boardConfig[row];
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  BOARD_CONFIG,

  // Core helper functions
  getAdjacentPositions,
  getDirection,
  getNextPositionInDirection,
  isVisibleInStraightLine,
  isAdjacent,
  getDistanceInStraightLine,

  // Skill-specific functions
  getAcrobateJumpPositions,
  getCavalierValidMoves,
  getCogneurPushPositions,
  getGardeRoyalTeleportPositions,
  getLanceGrappinTargets,
  getManipulatorTargets,
  getRodeuseValidMoves,
  getTavernierAllies,
  getIllusionistTargets,

  // Passive ability functions
  checkJailerAdjacent,
  checkProtectorAdjacent,

  // Special character functions
  calculateNemesisMovement,
  getHermitCubRecruitmentPositions,

  // Utility functions
  getAllEmptyPositions,
  getPositionCoordinates,
  isValidPosition,
};
