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

function buildGreedyPath(start, end) {
  const [_, endRow, endCol] = end.split("-").map(Number);
  const path = [start];
  let current = start;

  for (let step = 0; step < 10; step++) {
    if (current === end) return path;

    const adjacent = getAdjacentPositions(current);
    let bestNext = null;
    let bestDist = Infinity;

    adjacent.forEach((pos) => {
      const [__, posRow, posCol] = pos.split("-").map(Number);
      const dist = Math.abs(endRow - posRow) + Math.abs(endCol - posCol);
      if (dist < bestDist) {
        bestDist = dist;
        bestNext = pos;
      }
    });

    if (!bestNext || path.includes(bestNext)) break;

    current = bestNext;
    path.push(current);
  }

  return path;
}

function getHexDirection(r1, c1, r2, c2) {
  const dr = r2 - r1;
  const dc = c2 - c1;

  if (dr === 0 && dc > 0) return "E";
  if (dr === 0 && dc < 0) return "W";

  console.log(
    `  Checking (${r1},${c1}) → (${r2},${c2}): dr=${dr}, dc=${dc}, r1=${r1}`
  );

  if (r1 <= 4) {
    if (dr > 0 && dc > 0) return "SE";
    if (dr > 0 && dc === 0) return "SW";
    if (dr < 0 && dc === 0) return "NW";
    if (dr < 0 && dc > 0) return "NE";
  } else {
    if (dr > 0 && dc === 0) return "SE";
    if (dr > 0 && dc < 0) return "SW";
    if (dr < 0 && dc < 0) return "NW";
    if (dr < 0 && dc === 0) return "NE";
  }

  return "UNKNOWN";
}

function testPath(from, to, desc) {
  console.log("\n" + "=".repeat(60));
  console.log(desc);
  console.log(`From ${from} to ${to}`);

  const path = buildGreedyPath(from, to);
  console.log(`Path: ${path.join(" → ")}`);

  console.log("\nDirection analysis:");
  for (let i = 0; i < path.length - 1; i++) {
    const [_, r1, c1] = path[i].split("-").map(Number);
    const [__, r2, c2] = path[i + 1].split("-").map(Number);
    const dir = getHexDirection(r1, c1, r2, c2);
    console.log(`  Step ${i}: ${path[i]} → ${path[i + 1]} = ${dir}`);
  }
}

testPath("hex-3-3", "hex-7-4", "User case 1 (should work)");
testPath("hex-2-1", "hex-5-3", "User case should work but transitions");
testPath("hex-7-1", "hex-1-4", "Long diagonal");
