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

// Map hex-row-col ke Cube Coordinates (x, y, z)
export const toCube = (positionId) => {
  if (!positionId || typeof positionId !== "string")
    return { x: 0, y: 0, z: 0 };
  const parts = positionId.split("-");
  const col = parseInt(parts[1]);
  const row = parseInt(parts[2]);

  const q = 4 - col;
  let r = col >= 4 ? row - (8 - col) : row - 4;
  const s = -q - r;
  return { x: q, y: r, z: s };
};

// Kebalikan: Cube ke ID string
export const fromCube = (x, y, z) => {
  const col = 4 - x;
  let row;

  if (col >= 4) {
    row = y + (8 - col);
  } else {
    row = y + 4;
  }

  const id = `hex-${col}-${row}`;
  // Pastikan petak tersebut memang ada di dalam konfigurasi board
  return isValidPosition(id) ? id : null;
};

// Jangan lupa fungsi Distance yang simpel
export const getDistance = (pos1, pos2) => {
  const a = toCube(pos1);
  const b = toCube(pos2);
  return Math.max(
    Math.abs(a.x - b.x),
    Math.abs(a.y - b.y),
    Math.abs(a.z - b.z)
  );
};

// Pengecekan GARIS LURUS (Solusi untuk Bug kamu)
export const isStraightLine = (pos1, pos2) => {
  if (!pos1 || !pos2) return false;
  const a = toCube(pos1);
  const b = toCube(pos2);
  // Garis lurus hexagon hanya terjadi jika salah satu sumbu Cube-nya sama
  return a.x === b.x || a.y === b.y || a.z === b.z;
};

// ============================================
// CORE HELPER FUNCTIONS
// ============================================

export const isVisibleInStraightLine = (fromPos, toPos, placedCards) => {
  if (!isStraightLine(fromPos, toPos)) return false;
  if (fromPos === toPos) return false;

  const start = toCube(fromPos);
  const end = toCube(toPos);
  const dist = getDistance(fromPos, toPos);

  // Cek setiap langkah di antara petak start dan target
  for (let i = 1; i < dist; i++) {
    const t = i / dist;
    const x = Math.round(start.x + (end.x - start.x) * t);
    const y = Math.round(start.y + (end.y - start.y) * t);
    const z = Math.round(start.z + (end.z - start.z) * t);

    const midId = fromCube(x, y, z);
    if (midId && placedCards.some((card) => card.positionId === midId)) {
      return false; // Ada rintangan
    }
  }
  return true;
};

// Khusus Archer: Cek apakah tepat 2 petak dan searah
export const isTwoSpacesAwayInStraightLine = (pos1, pos2) => {
  return isStraightLine(pos1, pos2) && getDistance(pos1, pos2) === 2;
};

// Sederhanakan isAdjacent
export const isAdjacent = (pos1, pos2) => {
  return getDistance(pos1, pos2) === 1;
};

// export const getAdjacentPositions = (
//   positionId,
//   boardConfig = BOARD_CONFIG
// ) => {
//   const [_, row, col] = positionId.split("-").map(Number);
//   const maxCols = boardConfig;
//   const adjacent = [];

//   // Horizontal neighbors
//   if (col > 1) adjacent.push(`hex-${row}-${col - 1}`);
//   if (col < maxCols[row]) adjacent.push(`hex-${row}-${col + 1}`);

//   // Vertical & diagonal neighbors
//   const neighbors = [];

//   // Row above (row - 1)
//   if (row > 1) {
//     const prevRowCols = maxCols[row - 1];
//     if (row <= 4) {
//       // Rows 1-4: expanding rows
//       if (col - 1 >= 1 && col - 1 <= prevRowCols)
//         neighbors.push({ r: row - 1, c: col - 1 });
//       if (col >= 1 && col <= prevRowCols)
//         neighbors.push({ r: row - 1, c: col });
//     } else {
//       // Rows 5-7: contracting rows
//       if (col >= 1 && col <= prevRowCols)
//         neighbors.push({ r: row - 1, c: col });
//       if (col + 1 >= 1 && col + 1 <= prevRowCols)
//         neighbors.push({ r: row - 1, c: col + 1 });
//     }
//   }

//   // Row below (row + 1)
//   if (row < 7) {
//     const nextRowCols = maxCols[row + 1];
//     if (row < 4) {
//       // Rows 1-3: expanding rows
//       if (col >= 1 && col <= nextRowCols)
//         neighbors.push({ r: row + 1, c: col });
//       if (col + 1 >= 1 && col + 1 <= nextRowCols)
//         neighbors.push({ r: row + 1, c: col + 1 });
//     } else {
//       // Rows 4-6: contracting rows
//       if (col - 1 >= 1 && col - 1 <= nextRowCols)
//         neighbors.push({ r: row + 1, c: col - 1 });
//       if (col >= 1 && col <= nextRowCols)
//         neighbors.push({ r: row + 1, c: col });
//     }
//   }

//   neighbors.forEach(({ r, c }) => {
//     adjacent.push(`hex-${r}-${c}`);
//   });

//   return adjacent;
// };

export const getAdjacentPositions = (positionId) => {
  const cube = toCube(positionId);
  const directions = [
    { x: +1, y: -1, z: 0 },
    { x: +1, y: 0, z: -1 },
    { x: 0, y: +1, z: -1 },
    { x: -1, y: +1, z: 0 },
    { x: -1, y: 0, z: +1 },
    { x: 0, y: -1, z: +1 },
  ];

  return directions
    .map((d) => fromCube(cube.x + d.x, cube.y + d.y, cube.z + d.z))
    .filter((id) => id !== null); // Hanya ambil yang ada di dalam board
};

export const getDirection = (fromPos, toPos) => {
  const [_, fromRow, fromCol] = fromPos.split("-").map(Number);
  const [__, toRow, toCol] = toPos.split("-").map(Number);
  return {
    deltaRow: toRow - fromRow,
    deltaCol: toCol - fromCol,
  };
};

// export const getNextPositionInDirection = (
//   currentPos,
//   direction,
//   boardConfig = BOARD_CONFIG
// ) => {
//   const [_, row, col] = currentPos.split("-").map(Number);
//   const maxCols = boardConfig;

//   const newRow = row + direction.deltaRow;
//   if (newRow < 1 || newRow > 7) return null;

//   let newCol = col + direction.deltaCol;

//   // Adjust for hexagonal geometry when crossing row 4
//   if (direction.deltaRow !== 0) {
//     const fromExpanding = row < 4;
//     const toExpanding = newRow < 4;
//     const fromRow4 = row === 4;
//     const toRow4 = newRow === 4;

//     // When moving from row 4 to row 5 (expanding to contracting)
//     // or from row 5 to row 4 (contracting to expanding)
//     if ((fromRow4 && newRow === 5) || (row === 5 && toRow4)) {
//       // Column offset adjustment for hex grid transition
//       if (direction.deltaRow > 0 && fromRow4) {
//         // Moving down from row 4 to row 5: no adjustment needed
//         // Row 4 has 7 cols, row 5 has 6 cols
//         // Adjacent pattern already handles this
//       } else if (direction.deltaRow < 0 && toRow4) {
//         // Moving up from row 5 to row 4: no adjustment needed
//       }
//     }
//   }

//   if (newCol < 1 || newCol > (maxCols[newRow] || 0)) return null;
//   return `hex-${newRow}-${newCol}`;
// };

export const getNextPositionInDirection = (
  currentPos,
  targetOrDirection, // Bisa berupa string "hex-1-1" atau object {deltaRow, deltaCol}
  boardConfig = BOARD_CONFIG
) => {
  // Jika yang dikirim adalah objek arah (sistem lama kamu)
  if (typeof targetOrDirection === "object" && targetOrDirection !== null) {
    const [_, r, c] = currentPos.split("-").map(Number);
    const newRow = r + targetOrDirection.deltaRow;
    const newCol = c + targetOrDirection.deltaCol;

    const nextId = `hex-${newRow}-${newCol}`;
    return isValidPosition(nextId, boardConfig) ? nextId : null;
  }

  // Jika yang dikirim adalah string ID target (sistem baru)
  const start = toCube(currentPos);
  const target = toCube(targetOrDirection);
  const dist = getDistance(currentPos, targetOrDirection);

  if (dist === 0) return null;

  const dx = Math.round((target.x - start.x) / dist);
  const dy = Math.round((target.y - start.y) / dist);
  const dz = Math.round((target.z - start.z) / dist);

  return fromCube(start.x + dx, start.y + dy, start.z + dz);
};
// export const isVisibleInStraightLine = (
//   fromPos,
//   toPos,
//   placedCards,
//   boardConfig = BOARD_CONFIG
// ) => {
//   if (fromPos === toPos) return false;

//   // Try all 6 possible hex directions from start
//   const adjacent = getAdjacentPositions(fromPos, boardConfig);

//   for (const firstStep of adjacent) {
//     const path = walkInDirection(fromPos, firstStep, toPos, boardConfig);

//     if (path && path[path.length - 1] === toPos) {
//       // Found a straight path! Check for obstacles
//       let hasObstacle = false;
//       for (let i = 1; i < path.length - 1; i++) {
//         const obstacle = placedCards.find(
//           (card) => card.positionId === path[i]
//         );
//         if (obstacle) {
//           hasObstacle = true;
//           break;
//         }
//       }

//       if (!hasObstacle) {
//         return true;
//       }
//     }
//   }

//   return false;
// };

// export const isVisibleInStraightLine = (fromPos, toPos, placedCards) => {
//   if (!isStraightLine(fromPos, toPos)) return false;

//   const start = toCube(fromPos);
//   const end = toCube(toPos);
//   const dist = getDistance(fromPos, toPos);

//   // Cek setiap petak di antara (tidak termasuk start dan end)
//   for (let i = 1; i < dist; i++) {
//     const t = i / dist;
//     // Interpolasi linear koordinat cube
//     const midX = Math.round(start.x + (end.x - start.x) * t);
//     const midY = Math.round(start.y + (end.y - start.y) * t);
//     const midZ = Math.round(start.z + (end.z - start.z) * t);

//     const midId = fromCube(midX, midY, midZ);
//     if (midId) {
//       const isOccupied = placedCards.some((card) => card.positionId === midId);
//       if (isOccupied) return false; // Ada penghalang
//     }
//   }
//   return true;
// };

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

// export const isAdjacent = (pos1, pos2, boardConfig = BOARD_CONFIG) => {
//   return getAdjacentPositions(pos1, boardConfig).includes(pos2);
// };

export const getDistanceInStraightLine = (pos1, pos2) => {
  const [_, row1, col1] = pos1.split("-").map(Number);
  const [__, row2, col2] = pos2.split("-").map(Number);
  return Math.max(Math.abs(row2 - row1), Math.abs(col2 - col1));
};

// Check if two positions are exactly 2 spaces apart in a straight hexagonal line
// Used for Archer passive ability (does not require visibility)
// export const isTwoSpacesAwayInStraightLine = (
//   pos1,
//   pos2,
//   boardConfig = BOARD_CONFIG
// ) => {
//   if (pos1 === pos2) return false;

//   // Try all 6 directions from pos1
//   const adjacent = getAdjacentPositions(pos1, boardConfig);

//   for (const firstStep of adjacent) {
//     // Get the direction from pos1 to firstStep
//     const [_, r1, c1] = pos1.split("-").map(Number);
//     const [__, r2, c2] = firstStep.split("-").map(Number);
//     const initialDr = r2 - r1;
//     const initialDc = c2 - c1;

//     // Try to take one more step in the same direction
//     const adjacentFromFirst = getAdjacentPositions(firstStep, boardConfig);

//     for (const secondStep of adjacentFromFirst) {
//       if (secondStep === pos2) {
//         // Found pos2 at 2 steps! Verify it's in EXACTLY the same direction
//         const [___, r3, c3] = firstStep.split("-").map(Number);
//         const [____, r4, c4] = secondStep.split("-").map(Number);
//         const secondDr = r4 - r3;
//         const secondDc = c4 - c3;

//         // For EXACTLY 2 steps, we need stricter validation
//         // The direction vectors must be very similar (accounting for hexagonal transitions)

//         // Both steps must have same row direction (or both horizontal)
//         if (initialDr !== secondDr) {
//           continue; // Different row directions = not straight
//         }

//         // For horizontal lines (dr=0), deltaCol must be same sign
//         if (initialDr === 0) {
//           if (Math.sign(initialDc) === Math.sign(secondDc)) {
//             return true;
//           }
//           continue;
//         }

//         // For diagonal/vertical lines, deltaCol can vary slightly due to offset
//         // but should be consistent with the hexagonal geometry
//         // Key: column direction should not reverse
//         if (Math.abs(initialDc - secondDc) <= 1) {
//           // Allow deltaCol to differ by at most 1 (for row transition effects)
//           // But both should be in "same general direction"
//           if (
//             initialDc === 0 ||
//             secondDc === 0 ||
//             Math.sign(initialDc) === Math.sign(secondDc)
//           ) {
//             return true;
//           }
//         }
//       }
//     }
//   }

//   return false;
// };

// ============================================
// SKILL-SPECIFIC FUNCTIONS
// ============================================

export const getAcrobateJumpPositions = (
  characterPos,
  placedCards,
  boardConfig = BOARD_CONFIG,
  excludePosition = null // Petak karakter yang baru saja dilompati (untuk lompatan ke-2)
) => {
  const validJumps = [];
  const startCube = toCube(characterPos);

  // 1. Dapatkan semua posisi tetangga (Adjacent)
  const neighbors = getAdjacentPositions(characterPos, boardConfig);

  neighbors.forEach((adjPos) => {
    // Cari apakah ada karakter di petak tetangga ini
    const charToJumpOver = placedCards.find(
      (card) => card.positionId === adjPos
    );

    // Syarat: Harus ada karakter DAN bukan karakter yang baru saja dilompati
    if (charToJumpOver && adjPos !== excludePosition) {
      const neighborCube = toCube(adjPos);

      // 2. Hitung posisi landing (Lurus melewati karakter tersebut)
      // Rumus: Landing = Neighbor + (Neighbor - Start)
      const landingCube = {
        x: neighborCube.x + (neighborCube.x - startCube.x),
        y: neighborCube.y + (neighborCube.y - startCube.y),
        z: neighborCube.z + (neighborCube.z - startCube.z),
      };

      const landingPosId = fromCube(
        landingCube.x,
        landingCube.y,
        landingCube.z
      );

      // 3. Validasi Landing: Harus ada di board dan kosong
      if (landingPosId) {
        const isOccupied = placedCards.find(
          (card) => card.positionId === landingPosId
        );
        if (!isOccupied) {
          validJumps.push(landingPosId);
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
      //kalau mau bisa loncatin karakter, ganti jadi: if (isPos2Empty) {
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
  const attackerCube = toCube(cogneurPos);
  const targetCube = toCube(enemyPos);

  // Vektor arah dari Cogneur ke Musuh
  const attackDir = {
    x: targetCube.x - attackerCube.x,
    y: targetCube.y - attackerCube.y,
    z: targetCube.z - attackerCube.z,
  };

  // Ambil semua tetangga di sekitar musuh
  const neighborsOfEnemy = getAdjacentPositions(enemyPos, boardConfig);

  // Filter 3 petak yang berada di "belakang" musuh
  const validPushPositions = neighborsOfEnemy.filter((pos) => {
    // 1. Petak tidak boleh posisi Cogneur berdiri sekarang
    if (pos === cogneurPos) return false;

    // 2. Petak harus kosong
    const isOccupied = placedCards.find((c) => c.positionId === pos);
    if (isOccupied) return false;

    // 3. Logika Matematika Dot Product
    const neighborCube = toCube(pos);
    const pushDir = {
      x: neighborCube.x - targetCube.x,
      y: neighborCube.y - targetCube.y,
      z: neighborCube.z - targetCube.z,
    };

    // Dot product > 0 artinya sudut antara arah dorong dan arah serang tajam (searah)
    // Ini akan secara otomatis mengambil 3 petak di belakang musuh
    const dotProduct =
      attackDir.x * pushDir.x +
      attackDir.y * pushDir.y +
      attackDir.z * pushDir.z;

    return dotProduct > 0;
  });

  return validPushPositions;
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
    return char && char.owner === turn;
  });
};

export const getIllusionistTargets = (
  characterPos,
  placedCards,
  boardConfig = BOARD_CONFIG
) => {
  const targets = [];

  placedCards.forEach((card) => {
    const targetPos = card.positionId;

    // Syarat Illusionist:
    // 1. Bukan dirinya sendiri
    // 2. Tidak boleh bersebelahan (Non-adjacent)
    // 3. Harus satu garis lurus (isStraightLine)
    // 4. Tidak ada rintangan di antaranya (Visible)

    if (targetPos !== characterPos) {
      const distance = getDistance(characterPos, targetPos);
      const inLine = isStraightLine(characterPos, targetPos);

      if (distance > 1 && inLine) {
        if (isVisibleInStraightLine(characterPos, targetPos, placedCards)) {
          targets.push(targetPos);
        }
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

// Di skillManager.js
export const isAffectedByJailer = (characterPos, placedCards, currentTurn) => {
  const adjacentPositions = getAdjacentPositions(characterPos);

  return adjacentPositions.some((pos) => {
    const char = placedCards.find((c) => c.positionId === pos);
    // Cek jika ada kartu lawan tipe "Geolier" di sebelah
    return (
      char && char.cardData.type === "Geolier" && char.owner !== currentTurn
    );
  });
};

export const isProtectedFromMovement = (targetPos, placedCards) => {
  const targetChar = placedCards.find((c) => c.positionId === targetPos);
  if (!targetChar) return false;

  const owner = targetChar.owner;

  // 1. Cek jika karakter itu sendiri adalah Protector
  if (targetChar.cardData.type === "Protector") return true;

  // 2. Cek jika ada teman tipe Protector di sebelahnya
  const adjacentPos = getAdjacentPositions(targetPos);
  return adjacentPos.some((pos) => {
    const neighbor = placedCards.find((c) => c.positionId === pos);
    return (
      neighbor &&
      neighbor.cardData.type === "Protector" &&
      neighbor.owner === owner
    ); // Harus teman (owner sama)
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
  if (!nemesisPos || !opponentLeaderPos) {
    return {
      validPositions: [],
      twoSpacePositions: [],
      oneSpacePositions: [],
      canMove: false,
    };
  }

  console.log("🧮 NEMESIS MOVEMENT CALCULATION:");
  console.log("- Start pos (Nemesis):", nemesisPos);
  console.log("- Target pos (Leader):", opponentLeaderPos);

  // Hitung jarak awal antara Nemesis dan Leader
  const originalDistance = getDistance(nemesisPos, opponentLeaderPos);
  console.log("- Original distance:", originalDistance);

  // 1. Cari semua kemungkinan gerakan 2 langkah yang LEBIH DEKAT ke Leader
  const twoStepMoves = getAllTwoStepMovesCloserToTarget(
    nemesisPos,
    opponentLeaderPos,
    placedCards,
    boardConfig
  );

  console.log("- Valid 2-step moves (closer):", twoStepMoves);

  // 2. Jika ada gerakan 2 langkah yang valid
  if (twoStepMoves.length > 0) {
    return {
      validPositions: twoStepMoves,
      twoSpacePositions: twoStepMoves,
      oneSpacePositions: [],
      canMove: true,
    };
  }

  // 3. Jika tidak ada, cari gerakan 1 langkah yang LEBIH DEKAT ke Leader
  const oneStepMoves = getOneStepMovesCloserToTarget(
    nemesisPos,
    opponentLeaderPos,
    placedCards,
    boardConfig
  );

  console.log("- Valid 1-step moves (closer):", oneStepMoves);

  return {
    validPositions: oneStepMoves,
    twoSpacePositions: [],
    oneSpacePositions: oneStepMoves,
    canMove: oneStepMoves.length > 0,
  };
};

// Fungsi helper: Cari semua gerakan 2 langkah yang lebih dekat ke target
const getAllTwoStepMovesCloserToTarget = (
  startPos,
  targetPos,
  placedCards,
  boardConfig
) => {
  const validMoves = [];
  const originalDistance = getDistance(startPos, targetPos);

  // Dapatkan semua posisi adjacent (langkah pertama)
  const firstStepPositions = getAdjacentPositions(startPos, boardConfig);

  for (const firstStep of firstStepPositions) {
    // Cek apakah langkah pertama kosong atau tidak
    const firstStepOccupied = placedCards.find(c => c.positionId === firstStep);

    // Dari firstStep, cari semua posisi adjacent (langkah kedua)
    const secondStepPositions = getAdjacentPositions(firstStep, boardConfig);

    for (const secondStep of secondStepPositions) {
      // Tidak boleh kembali ke posisi awal
      if (secondStep === startPos) continue;

      // Cek apakah langkah kedua kosong
      const secondStepOccupied = placedCards.find(c => c.positionId === secondStep);
      if (secondStepOccupied) continue;

      // Hitung jarak baru ke target
      const newDistance = getDistance(secondStep, targetPos);

      // HARUS lebih dekat ke target (jarak berkurang)
      if (newDistance < originalDistance) {
        validMoves.push(secondStep);
      }
    }
  }

  return [...new Set(validMoves)]; // Hapus duplikat
};

// Fungsi helper: Cari semua gerakan 1 langkah yang lebih dekat ke target
const getOneStepMovesCloserToTarget = (
  startPos,
  targetPos,
  placedCards,
  boardConfig
) => {
  const validMoves = [];
  const originalDistance = getDistance(startPos, targetPos);

  // Dapatkan semua posisi adjacent
  const adjacentPositions = getAdjacentPositions(startPos, boardConfig);

  for (const pos of adjacentPositions) {
    // Cek apakah posisi kosong
    const isOccupied = placedCards.find(c => c.positionId === pos);
    if (isOccupied) continue;

    // Hitung jarak baru ke target
    const newDistance = getDistance(pos, targetPos);

    // HARUS lebih dekat ke target (jarak berkurang)
    if (newDistance < originalDistance) {
      validMoves.push(pos);
    }
  }

  return validMoves;
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
  isTwoSpacesAwayInStraightLine,

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
