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

function analyzePath(from, to, desc) {
  console.log("\n" + "=".repeat(60));
  console.log(desc);

  const [_, endRow, endCol] = to.split("-").map(Number);
  const path = [from];
  let current = from;

  for (let step = 0; step < 10; step++) {
    if (current === to) break;

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

  console.log(`Path: ${path.join(" → ")}`);

  const positions = path.map((pos) => {
    const [_, row, col] = pos.split("-").map(Number);
    return { row, col };
  });

  console.log("\nDelta analysis:");
  for (let i = 0; i < positions.length - 1; i++) {
    const dr = positions[i + 1].row - positions[i].row;
    const dc = positions[i + 1].col - positions[i].col;
    console.log(`  Step ${i}: (${dr}, ${dc})`);
  }

  const firstDeltaRow = positions[1].row - positions[0].row;
  let allSameDeltaRow = true;
  for (let i = 1; i < positions.length - 1; i++) {
    const deltaRow = positions[i + 1].row - positions[i].row;
    if (deltaRow !== firstDeltaRow) {
      allSameDeltaRow = false;
      console.log(
        `\n  ❌ Delta row not consistent at step ${i}: ${deltaRow} !== ${firstDeltaRow}`
      );
      break;
    }
  }

  if (allSameDeltaRow) {
    console.log(`\n  ✓ Delta row consistent: ${firstDeltaRow}`);

    const deltaCols = [];
    for (let i = 0; i < positions.length - 1; i++) {
      deltaCols.push(positions[i + 1].col - positions[i].col);
    }
    console.log(`  Delta cols: [${deltaCols.join(", ")}]`);

    let prevNonZeroColDir = null;
    let zigzag = false;
    for (let i = 0; i < deltaCols.length; i++) {
      const dc = deltaCols[i];
      if (dc !== 0) {
        const currentColDir = Math.sign(dc);
        if (prevNonZeroColDir !== null && currentColDir !== prevNonZeroColDir) {
          zigzag = true;
          console.log(
            `  ❌ Column direction reversed at step ${i}: ${dc} (was ${prevNonZeroColDir}, now ${currentColDir})`
          );
        }
        prevNonZeroColDir = currentColDir;
      }
    }

    if (!zigzag) {
      console.log(`  ✓ No column zigzag`);
    }
  }
}

analyzePath("hex-3-3", "hex-6-1", "hex-3-3 to hex-6-1 (should be straight)");
analyzePath("hex-1-1", "hex-3-3", "hex-1-1 to hex-3-3 (NOT straight)");
