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

function findPath(start, end) {
  console.log(`Finding path from ${start} to ${end}:`);
  console.log("=".repeat(60));

  let current = start;
  const path = [current];

  for (let step = 0; step < 10; step++) {
    if (current === end) {
      console.log(`\n✓ Reached target in ${step} steps!`);
      console.log(`Path: ${path.join(" → ")}`);
      return path;
    }

    const adjacent = getAdjacentPositions(current);
    console.log(`\nStep ${step}: ${current}`);
    console.log(`  Adjacent positions: ${adjacent.join(", ")}`);

    // Find which adjacent position is closest to end
    const [_, endRow, endCol] = end.split("-").map(Number);
    let bestNext = null;
    let bestDist = Infinity;

    adjacent.forEach((pos) => {
      const [__, posRow, posCol] = pos.split("-").map(Number);
      const dist = Math.abs(endRow - posRow) + Math.abs(endCol - posCol);
      console.log(`  - ${pos}: distance = ${dist}`);
      if (dist < bestDist) {
        bestDist = dist;
        bestNext = pos;
      }
    });

    if (!bestNext) {
      console.log("\n✗ No next position found!");
      break;
    }

    console.log(`  → Choosing: ${bestNext}`);
    current = bestNext;
    path.push(current);
  }

  console.log(`\n✗ Failed to reach target`);
  console.log(`Path: ${path.join(" → ")}`);
  return path;
}

// Test the user's cases
console.log("\n");
findPath("hex-3-3", "hex-7-4");
console.log("\n\n");
findPath("hex-3-3", "hex-6-1");
console.log("\n\n");
findPath("hex-2-1", "hex-5-3");
