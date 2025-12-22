function getAdj(posId) {
  const [_, row, col] = posId.split("-").map(Number);
  const bc = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 6, 6: 5, 7: 4 };
  const adj = [];

  // Horizontal
  if (col > 1) adj.push(`hex-${row}-${col - 1}`);
  if (col < bc[row]) adj.push(`hex-${row}-${col + 1}`);

  const neighbors = [];

  // Row above
  if (row > 1) {
    const prevRowCols = bc[row - 1];
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

  // Row below
  if (row < 7) {
    const nextRowCols = bc[row + 1];
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

  neighbors.forEach(({ r, c }) => adj.push(`hex-${r}-${c}`));
  return adj;
}

console.log("Testing hex-4-4 (center of longest row):");
const result = getAdj("hex-4-4");
console.log("Adjacent positions:", result);
console.log("Count:", result.length);
console.log("Expected: 6 positions");
