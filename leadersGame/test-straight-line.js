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

function isVisibleInStraightLine(fromPos, toPos) {
  if (fromPos === toPos) return false;

  const adjacent = getAdjacentPositions(fromPos);

  for (const firstStep of adjacent) {
    const path = walkInDirection(fromPos, firstStep, toPos);

    if (path && path[path.length - 1] === toPos) {
      return true;
    }
  }

  return false;
}

function walkInDirection(start, firstStep, target) {
  const path = [start, firstStep];
  let current = firstStep;

  if (firstStep === target) {
    return path;
  }

  const [_, r1, c1] = start.split("-").map(Number);
  const [__, r2, c2] = firstStep.split("-").map(Number);
  const initialDr = r2 - r1;
  const initialDc = c2 - c1;

  for (let step = 0; step < 10; step++) {
    const adj = getAdjacentPositions(current);
    let nextPos = null;

    for (const candidate of adj) {
      const [___, curR, curC] = current.split("-").map(Number);
      const [____, candR, candC] = candidate.split("-").map(Number);
      const dr = candR - curR;
      const dc = candC - curC;

      if (isSameHexDirection(initialDr, initialDc, r1, dr, dc, curR)) {
        nextPos = candidate;
        break;
      }
    }

    if (!nextPos) {
      return null;
    }

    path.push(nextPos);

    if (nextPos === target) {
      return path;
    }

    current = nextPos;
  }

  return null;
}

function isSameHexDirection(dr1, dc1, startRow1, dr2, dc2, startRow2) {
  if (dr1 === 0 && dr2 === 0) {
    return Math.sign(dc1) === Math.sign(dc2);
  }

  if (Math.sign(dr1) !== Math.sign(dr2)) {
    return false;
  }

  if (Math.abs(dr1) !== Math.abs(dr2)) {
    return false;
  }

  const getDirectionCategory = (dr, dc, row) => {
    if (dr === 0) return dc > 0 ? "EAST" : "WEST";

    if (dr > 0) {
      if (dc > 0) return "SOUTHEAST";
      if (dc < 0) return "SOUTHWEST";
      return row <= 4 ? "SOUTHWEST" : "SOUTHEAST";
    } else {
      if (dc > 0) return "NORTHEAST";
      if (dc < 0) return "NORTHWEST";
      return "NORTHEAST_OR_NORTHWEST";
    }
  };

  const cat1 = getDirectionCategory(dr1, dc1, startRow1);
  const cat2 = getDirectionCategory(dr2, dc2, startRow2);

  if (cat1 === cat2) return true;

  if (dr1 > 0 && dr2 > 0 && dc1 === 0 && dc2 === 0) return true;
  if (dr1 > 0 && dr2 > 0) {
    if (
      (cat1 === "SOUTHEAST" || cat1 === "SOUTHWEST") &&
      (cat2 === "SOUTHEAST" || cat2 === "SOUTHWEST")
    ) {
      return true;
    }
  }

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
}

// Test cases from user
console.log("Testing straight line detection:");
console.log("=".repeat(60));

const testCases = [
  // Horizontal
  {
    from: "hex-1-1",
    to: "hex-1-2",
    expected: true,
    desc: "Horizontal 1-1 to 1-2",
  },
  {
    from: "hex-1-1",
    to: "hex-1-4",
    expected: true,
    desc: "Horizontal 1-1 to 1-4",
  },

  // Vertical-ish
  {
    from: "hex-1-1",
    to: "hex-2-1",
    expected: true,
    desc: "Vertical 1-1 to 2-1",
  },
  {
    from: "hex-1-1",
    to: "hex-4-1",
    expected: true,
    desc: "Vertical 1-1 to 4-1",
  },

  // Diagonal 1
  {
    from: "hex-2-1",
    to: "hex-3-2",
    expected: true,
    desc: "Diagonal 2-1 to 3-2",
  },
  {
    from: "hex-2-1",
    to: "hex-5-3",
    expected: true,
    desc: "Diagonal 2-1,3-2,4-3,5-3",
  },

  // Diagonal 2
  {
    from: "hex-7-1",
    to: "hex-6-2",
    expected: true,
    desc: "Diagonal 7-1 to 6-2",
  },
  {
    from: "hex-7-1",
    to: "hex-1-4",
    expected: true,
    desc: "Diagonal 7-1,6-2,5-3,4-4,3-4,2-4,1-4",
  },

  // User's diagonal cases
  {
    from: "hex-3-3",
    to: "hex-7-4",
    expected: true,
    desc: "Diagonal 3-3 to 7-4 (user case)",
  },
  {
    from: "hex-3-3",
    to: "hex-6-1",
    expected: true,
    desc: "Diagonal 3-3 to 6-1 (user case)",
  },

  // Not straight
  {
    from: "hex-1-1",
    to: "hex-3-3",
    expected: false,
    desc: "Not straight 1-1 to 3-3",
  },
  {
    from: "hex-1-1",
    to: "hex-2-3",
    expected: false,
    desc: "Not straight 1-1 to 2-3",
  },
];

testCases.forEach((test, i) => {
  const result = isVisibleInStraightLine(test.from, test.to);
  const status = result === test.expected ? "✓ PASS" : "✗ FAIL";
  console.log(`${i + 1}. ${status} - ${test.desc}`);
  console.log(`   From: ${test.from}, To: ${test.to}`);
  console.log(`   Expected: ${test.expected}, Got: ${result}`);
  if (result !== test.expected) {
    const dir = getDirection(test.from, test.to);
    console.log(`   Direction: (${dir.deltaRow}, ${dir.deltaCol})`);
  }
  console.log();
});
