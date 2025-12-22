const BOARD_CONFIG = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 6, 6: 5, 7: 4 };

function getAdjacentPositions(positionId) {
  const [_, row, col] = positionId.split("-").map(Number);
  const maxCols = BOARD_CONFIG;
  const adjacent = [];

  if (col > 1) adjacent.push(`hex-${row}-${col - 1}`);
  if (col < maxCols[row]) adjacent.push(`hex-${row}-${col + 1}`);

  const neighbors = [];

  if (row > 1) {
    const prevRowCols = maxCols[row - 1];
    if (row <= 4) {
      if (col - 1 >= 1 && col - 1 <= prevRowCols)
        neighbors.push({ r: row - 1, c: col - 1 });
      if (col >= 1 && col <= prevRowCols)
        neighbors.push({ r: row - 1, c: col });
    } else {
      if (col >= 1 && col <= prevRowCols)
        neighbors.push({ r: row - 1, c: col });
      if (col + 1 >= 1 && col + 1 <= prevRowCols)
        neighbors.push({ r: row - 1, c: col + 1 });
    }
  }

  if (row < 7) {
    const nextRowCols = maxCols[row + 1];
    if (row < 4) {
      if (col >= 1 && col <= nextRowCols)
        neighbors.push({ r: row + 1, c: col });
      if (col + 1 >= 1 && col + 1 <= nextRowCols)
        neighbors.push({ r: row + 1, c: col + 1 });
    } else {
      if (col - 1 >= 1 && col - 1 <= nextRowCols)
        neighbors.push({ r: row + 1, c: col - 1 });
      if (col >= 1 && col <= nextRowCols)
        neighbors.push({ r: row + 1, c: col });
    }
  }

  neighbors.forEach(({ r, c }) => adjacent.push(`hex-${r}-${c}`));
  return adjacent;
}

function getDirection(fromPos, toPos) {
  const [_, fromRow, fromCol] = fromPos.split("-").map(Number);
  const [__, toRow, toCol] = toPos.split("-").map(Number);
  return { deltaRow: toRow - fromRow, deltaCol: toCol - fromCol };
}

function getNextPositionInDirection(currentPos, direction) {
  const [_, row, col] = currentPos.split("-").map(Number);
  const newRow = row + direction.deltaRow;
  if (newRow < 1 || newRow > 7) return null;
  let newCol = col + direction.deltaCol;
  if (newCol < 1 || newCol > (BOARD_CONFIG[newRow] || 0)) return null;
  return `hex-${newRow}-${newCol}`;
}

function isAdjacent(pos1, pos2) {
  return getAdjacentPositions(pos1).includes(pos2);
}

// Test Lance Grappin
const lancePos = "hex-4-2";
const targetPos = "hex-4-5";
console.log("Testing Lance Grappin:");
console.log(`Lance at: ${lancePos}`);
console.log(`Target at: ${targetPos}`);
console.log("=".repeat(60));

const fullDirection = getDirection(lancePos, targetPos);
console.log(
  `\nFull Direction: deltaRow=${fullDirection.deltaRow}, deltaCol=${fullDirection.deltaCol}`
);

// Normalize direction
const distance = Math.max(
  Math.abs(fullDirection.deltaRow),
  Math.abs(fullDirection.deltaCol)
);
const direction = {
  deltaRow: distance > 0 ? fullDirection.deltaRow / distance : 0,
  deltaCol: distance > 0 ? fullDirection.deltaCol / distance : 0,
};
console.log(
  `Normalized Direction: deltaRow=${direction.deltaRow}, deltaCol=${direction.deltaCol}`
);
console.log(`Distance: ${distance}`);

// Test Option 1: Move Lance to target
console.log("\n--- OPTION 1: Move Lance to adjacent of target ---");
let currentPos = lancePos;
let lastEmptyPos = null;

while (currentPos !== targetPos) {
  const nextPos = getNextPositionInDirection(currentPos, direction);
  console.log(`Current: ${currentPos}, Next: ${nextPos}`);

  if (!nextPos) {
    console.log("  No next position!");
    break;
  }

  if (nextPos !== targetPos) {
    lastEmptyPos = nextPos;
    console.log(`  -> Can land here: ${nextPos}`);
  }

  if (isAdjacent(nextPos, targetPos)) {
    console.log(`  -> Adjacent to target! Landing: ${nextPos}`);
    if (nextPos !== targetPos) {
      lastEmptyPos = nextPos;
    }
    break;
  }

  currentPos = nextPos;
}

console.log(`\nFinal landing position: ${lastEmptyPos}`);

// Test Option 2: Pull target to Lance
console.log("\n--- OPTION 2: Pull target to adjacent of Lance ---");
const adjacentToLance = getAdjacentPositions(lancePos);
console.log(`Adjacent to Lance: ${adjacentToLance.join(", ")}`);

const dragPos = adjacentToLance.find((pos) => {
  const dirToPos = getDirection(lancePos, pos);
  const match =
    dirToPos.deltaRow === direction.deltaRow &&
    dirToPos.deltaCol === direction.deltaCol;
  console.log(
    `  ${pos}: dir=(${dirToPos.deltaRow},${dirToPos.deltaCol}) match=${match}`
  );
  return match;
});

console.log(`\nDrag position: ${dragPos}`);
