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

function walkInDirection(start, firstStep, target) {
  console.log(`\n  Trying first step: ${start} → ${firstStep}`);

  const path = [start];
  let current = start;

  const [_, r1, c1] = start.split("-").map(Number);
  const [__, r2, c2] = firstStep.split("-").map(Number);
  const initialDr = r2 - r1;
  const initialDc = c2 - c1;

  console.log(`  Initial direction: dr=${initialDr}, dc=${initialDc}`);

  for (let step = 0; step < 10; step++) {
    if (current === target) {
      console.log(`  ✓ Reached target!`);
      return path;
    }

    const adj = getAdjacentPositions(current);
    let nextPos = null;

    for (const candidate of adj) {
      const [___, curR, curC] = current.split("-").map(Number);
      const [____, candR, candC] = candidate.split("-").map(Number);
      const dr = candR - curR;
      const dc = candC - curC;

      if (isSameHexDirection(initialDr, initialDc, r1, dr, dc, curR)) {
        console.log(
          `    Found next: ${current} → ${candidate} (dr=${dr}, dc=${dc})`
        );
        nextPos = candidate;
        break;
      }
    }

    if (!nextPos) {
      console.log(`  ✗ No matching next position`);
      return null;
    }

    current = nextPos;
    path.push(current);
  }

  return null;
}

function testVisibleLine(from, to, desc) {
  console.log("\n" + "=".repeat(60));
  console.log(desc);
  console.log(`Testing: ${from} → ${to}`);

  const adjacent = getAdjacentPositions(from);
  console.log(`Adjacent to start: ${adjacent.join(", ")}`);

  let found = false;
  for (const firstStep of adjacent) {
    const path = walkInDirection(from, firstStep, to);

    if (path && path[path.length - 1] === to) {
      console.log(`\n✓ FOUND PATH: ${path.join(" → ")}`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log(`\n✗ NO PATH FOUND`);
  }
}

testVisibleLine("hex-2-1", "hex-3-2", "Simple diagonal (should work)");
testVisibleLine("hex-3-3", "hex-7-4", "User case (should work)");
