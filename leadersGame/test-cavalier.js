const BOARD_CONFIG = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 6, 6: 5, 7: 4 };

function getAdjacentPositions(positionId) {
  const [_, row, col] = positionId.split("-").map(Number);
  const maxCols = BOARD_CONFIG;
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
}

function getDirection(fromPos, toPos) {
  const [_, fromRow, fromCol] = fromPos.split("-").map(Number);
  const [__, toRow, toCol] = toPos.split("-").map(Number);
  return {
    deltaRow: toRow - fromRow,
    deltaCol: toCol - fromCol,
  };
}

function getNextPositionInDirection(currentPos, direction) {
  const [_, row, col] = currentPos.split("-").map(Number);
  const maxCols = BOARD_CONFIG;

  const newRow = row + direction.deltaRow;
  if (newRow < 1 || newRow > 7) return null;

  let newCol = col + direction.deltaCol;

  if (newCol < 1 || newCol > (maxCols[newRow] || 0)) return null;
  return `hex-${newRow}-${newCol}`;
}

// Test Cavalier from hex-4-4
const charPos = "hex-4-4";
console.log("Testing Cavalier at:", charPos);
console.log("=".repeat(50));

const adjacentPositions = getAdjacentPositions(charPos);
console.log("\n1. Adjacent positions (6 directions):");
adjacentPositions.forEach((adj, i) => {
  console.log(`   ${i + 1}. ${adj}`);
});

console.log("\n2. Testing 2-space moves in each direction:");
const validMoves = [];
adjacentPositions.forEach((adjPos) => {
  const direction = getDirection(charPos, adjPos);
  const pos1 = adjPos;
  const pos2 = getNextPositionInDirection(pos1, direction);

  console.log(`   Direction to ${adjPos}:`);
  console.log(
    `      - Direction: deltaRow=${direction.deltaRow}, deltaCol=${direction.deltaCol}`
  );
  console.log(`      - Pos1 (1 space): ${pos1}`);
  console.log(`      - Pos2 (2 spaces): ${pos2}`);

  if (pos2) {
    validMoves.push(pos2);
  }
});

console.log("\n3. Final valid 2-space moves:");
validMoves.forEach((move, i) => {
  console.log(`   ${i + 1}. ${move}`);
});
console.log(`\nTotal valid moves: ${validMoves.length} (expected: 6)`);
