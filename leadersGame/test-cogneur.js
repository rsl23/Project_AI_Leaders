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

// Test Cogneur push
const cogneurPos = "hex-4-3";
const enemyPos = "hex-4-4";
console.log("Testing Cogneur push:");
console.log(`Cogneur at: ${cogneurPos}`);
console.log(`Enemy at: ${enemyPos}`);
console.log("=".repeat(50));

const attackDir = getDirection(cogneurPos, enemyPos);
console.log(
  `\nAttack direction: deltaRow=${attackDir.deltaRow}, deltaCol=${attackDir.deltaCol}`
);

const allAdjacentToEnemy = getAdjacentPositions(enemyPos);
console.log(`\nAll 6 adjacent positions to enemy:`);
allAdjacentToEnemy.forEach((pos, i) => {
  const dirToPos = getDirection(enemyPos, pos);
  const dotProduct =
    attackDir.deltaRow * dirToPos.deltaRow +
    attackDir.deltaCol * dirToPos.deltaCol;
  const isBehind = dotProduct > 0;
  console.log(
    `${i + 1}. ${pos}: deltaRow=${dirToPos.deltaRow}, deltaCol=${
      dirToPos.deltaCol
    }, dot=${dotProduct}, behind=${isBehind}`
  );
});

const pushPositions = allAdjacentToEnemy.filter((pos) => {
  const dirToPos = getDirection(enemyPos, pos);
  const dotProduct =
    attackDir.deltaRow * dirToPos.deltaRow +
    attackDir.deltaCol * dirToPos.deltaCol;
  return dotProduct >= 0;
});

console.log(`\nValid push positions (${pushPositions.length}):`);
pushPositions.forEach((pos, i) => console.log(`${i + 1}. ${pos}`));
console.log(`\nExpected: 3 positions (straight back + left-back + right-back)`);
