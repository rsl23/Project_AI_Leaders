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

function analyzeDirection(path) {
  if (path.length < 2) return;

  console.log(`\nPath: ${path.join(" → ")}`);
  console.log("Direction changes:");

  for (let i = 0; i < path.length - 1; i++) {
    const [_, r1, c1] = path[i].split("-").map(Number);
    const [__, r2, c2] = path[i + 1].split("-").map(Number);
    const dR = r2 - r1;
    const dC = c2 - c1;

    let dirType;
    if (dR === 0) dirType = "horizontal";
    else if (dR > 0 && dC <= 0) dirType = "down-left";
    else if (dR > 0 && dC > 0) dirType = "down-right";
    else if (dR < 0 && dC <= 0) dirType = "up-left";
    else dirType = "up-right";

    console.log(`  ${path[i]} → ${path[i + 1]}: (${dR}, ${dC}) = ${dirType}`);
  }
}

// Test cases
console.log("=".repeat(60));
console.log("ANALYZING PATHS:");
console.log("=".repeat(60));

const cases = [
  { from: "hex-3-3", to: "hex-7-4", desc: "User case 1 (should be straight)" },
  { from: "hex-3-3", to: "hex-6-1", desc: "User case 2 (should be straight)" },
  {
    from: "hex-2-1",
    to: "hex-5-3",
    desc: "User diagonal (should be straight)",
  },
  {
    from: "hex-7-1",
    to: "hex-1-4",
    desc: "User long diagonal (should be straight)",
  },
  {
    from: "hex-1-1",
    to: "hex-3-3",
    desc: "Not straight (greedy might make it look straight)",
  },
];

cases.forEach((test) => {
  console.log("\n" + "=".repeat(60));
  console.log(test.desc);
  console.log(`From ${test.from} to ${test.to}`);
  const path = buildGreedyPath(test.from, test.to);
  analyzeDirection(path);
});
