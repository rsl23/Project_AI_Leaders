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

function testCogneurPush(cogneurPos, enemyPos) {
  console.log("\n" + "=".repeat(60));
  console.log(`Cogneur at: ${cogneurPos}, Enemy at: ${enemyPos}`);

  const attackDir = getDirection(cogneurPos, enemyPos);
  console.log(
    `Attack direction: deltaRow=${attackDir.deltaRow}, deltaCol=${attackDir.deltaCol}`
  );

  const allAdjacentToEnemy = getAdjacentPositions(enemyPos);
  console.log(`\nAll adjacent positions to enemy:`);

  const pushPositions = [];
  allAdjacentToEnemy.forEach((pos, i) => {
    const dirToPos = getDirection(enemyPos, pos);
    const dotProduct =
      attackDir.deltaRow * dirToPos.deltaRow +
      attackDir.deltaCol * dirToPos.deltaCol;
    const isBehind = dotProduct >= 0;
    console.log(
      `  ${pos}: dir=(${dirToPos.deltaRow},${dirToPos.deltaCol}) dot=${dotProduct} behind=${isBehind}`
    );
    if (isBehind) pushPositions.push(pos);
  });

  console.log(`\nValid push positions: ${pushPositions.length}`);
  pushPositions.forEach((p) => console.log(`  - ${p}`));
}

// Test different attack directions
testCogneurPush("hex-4-3", "hex-4-4"); // horizontal right
testCogneurPush("hex-3-3", "hex-4-4"); // diagonal down-right
testCogneurPush("hex-3-4", "hex-4-4"); // vertical down
testCogneurPush("hex-4-5", "hex-4-4"); // horizontal left
testCogneurPush("hex-5-4", "hex-4-4"); // vertical up
