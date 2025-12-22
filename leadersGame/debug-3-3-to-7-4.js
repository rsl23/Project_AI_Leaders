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

console.log("Path: hex-3-3 → hex-4-4 → hex-5-4 → hex-6-4 → hex-7-4");
console.log("\nDirection changes:");

const path = ["hex-3-3", "hex-4-4", "hex-5-4", "hex-6-4", "hex-7-4"];

for (let i = 0; i < path.length - 1; i++) {
  const [_, r1, c1] = path[i].split("-").map(Number);
  const [__, r2, c2] = path[i + 1].split("-").map(Number);
  const dr = r2 - r1;
  const dc = c2 - c1;

  let dirType;
  if (r1 <= 4) {
    if (dr > 0 && dc > 0) dirType = "SE";
    else if (dr > 0 && dc === 0) dirType = "SW";
    else if (dr > 0 && dc < 0) dirType = "SW-";
  } else {
    if (dr > 0 && dc > 0) dirType = "SE+";
    else if (dr > 0 && dc === 0) dirType = "SE";
    else if (dr > 0 && dc < 0) dirType = "SW";
  }

  console.log(
    `  ${path[i]} (row ${r1}) → ${
      path[i + 1]
    } (row ${r2}): dr=${dr}, dc=${dc} => ${dirType}`
  );
}

console.log("\n" + "=".repeat(60));
console.log("Check SE → SW transition:");
console.log(
  "SE from row 3 and SW from row 4 should be treated as same direction"
);
console.log("  (type1 === 'SE' && type2 === 'SW'): should return true");
