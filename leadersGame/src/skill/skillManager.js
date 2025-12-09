// src/utils/skillManager.js

// Board configuration
export const BOARD_CONFIG = {
    1: 4,
    2: 5,
    3: 6,
    4: 7,
    5: 6,
    6: 5,
    7: 4
};

// ============================================
// CORE HELPER FUNCTIONS
// ============================================

export const getAdjacentPositions = (positionId, boardConfig = BOARD_CONFIG) => {
    const [_, row, col] = positionId.split("-").map(Number);
    const maxCols = boardConfig;
    const adjacent = [];

    // Horizontal neighbors
    if (col > 1) adjacent.push(`hex-${row}-${col - 1}`);
    if (col < maxCols[row]) adjacent.push(`hex-${row}-${col + 1}`);

    // Vertical & diagonal neighbors
    const neighbors = [];

    // Row above (row - 1)
    if (row > 1) {
        const prevRowCols = maxCols[row - 1];
        if (row <= 4) {
            // Rows 1-4: expanding rows
            if (col - 1 >= 1 && col - 1 <= prevRowCols)
                neighbors.push({ r: row - 1, c: col - 1 });
            if (col >= 1 && col <= prevRowCols)
                neighbors.push({ r: row - 1, c: col });
        } else {
            // Rows 5-7: contracting rows
            if (col >= 1 && col <= prevRowCols)
                neighbors.push({ r: row - 1, c: col });
            if (col + 1 >= 1 && col + 1 <= prevRowCols)
                neighbors.push({ r: row - 1, c: col + 1 });
        }
    }

    // Row below (row + 1)
    if (row < 7) {
        const nextRowCols = maxCols[row + 1];
        if (row < 4) {
            // Rows 1-3: expanding rows
            if (col >= 1 && col <= nextRowCols)
                neighbors.push({ r: row + 1, c: col });
            if (col + 1 >= 1 && col + 1 <= nextRowCols)
                neighbors.push({ r: row + 1, c: col + 1 });
        } else {
            // Rows 4-6: contracting rows
            if (col - 1 >= 1 && col - 1 <= nextRowCols)
                neighbors.push({ r: row + 1, c: col - 1 });
            if (col >= 1 && col <= nextRowCols)
                neighbors.push({ r: row + 1, c: col });
        }
    }

    neighbors.forEach(({ r, c }) => {
        adjacent.push(`hex-${r}-${c}`);
    });

    return adjacent;
};

export const getDirection = (fromPos, toPos) => {
    const [_, fromRow, fromCol] = fromPos.split("-").map(Number);
    const [__, toRow, toCol] = toPos.split("-").map(Number);
    return {
        deltaRow: toRow - fromRow,
        deltaCol: toCol - fromCol,
    };
};

export const getNextPositionInDirection = (currentPos, direction, boardConfig = BOARD_CONFIG) => {
    const [_, row, col] = currentPos.split("-").map(Number);
    const maxCols = boardConfig;

    const newRow = row + direction.deltaRow;
    if (newRow < 1 || newRow > 7) return null;

    let newCol = col + direction.deltaCol;

    // Adjust for hexagonal geometry
    if (direction.deltaRow !== 0) {
        const fromExpanding = row <= 4;
        const toExpanding = newRow <= 4;
        if (fromExpanding !== toExpanding && (row === 4 || newRow === 4)) {
            // Hexagonal offset adjustment
        }
    }

    if (newCol < 1 || newCol > (maxCols[newRow] || 0)) return null;
    return `hex-${newRow}-${newCol}`;
};

export const isVisibleInStraightLine = (fromPos, toPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const [_, fromRow, fromCol] = fromPos.split("-").map(Number);
    const [__, toRow, toCol] = toPos.split("-").map(Number);

    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;

    // Check if in straight line
    if (deltaRow === 0 && deltaCol === 0) return false;
    if (deltaRow !== 0 && deltaCol !== 0) {
        if (!(Math.abs(deltaRow) === Math.abs(deltaCol))) {
            return false;
        }
    }

    // Check line of sight
    const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
    const stepRow = deltaRow / steps;
    const stepCol = deltaCol / steps;

    for (let i = 1; i < steps; i++) {
        const checkRow = Math.round(fromRow + stepRow * i);
        const checkCol = Math.round(fromCol + stepCol * i);

        const maxCols = boardConfig;
        if (checkRow < 1 || checkRow > 7 || checkCol < 1 || checkCol > (maxCols[checkRow] || 0)) {
            return false;
        }

        const checkPos = `hex-${checkRow}-${checkCol}`;
        const hasCharacter = placedCards.find(card => card.positionId === checkPos);
        if (hasCharacter) return false;
    }

    return true;
};

export const isAdjacent = (pos1, pos2, boardConfig = BOARD_CONFIG) => {
    return getAdjacentPositions(pos1, boardConfig).includes(pos2);
};

export const getDistanceInStraightLine = (pos1, pos2) => {
    const [_, row1, col1] = pos1.split("-").map(Number);
    const [__, row2, col2] = pos2.split("-").map(Number);
    return Math.max(Math.abs(row2 - row1), Math.abs(col2 - col1));
};

// ============================================
// SKILL-SPECIFIC FUNCTIONS
// ============================================

export const getAcrobateJumpPositions = (characterPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const validJumps = [];
    const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);

    adjacentPositions.forEach(adjPos => {
        const hasCharacter = placedCards.find(card => card.positionId === adjPos);
        if (hasCharacter) {
            const direction = getDirection(characterPos, adjPos);
            const landingPos = getNextPositionInDirection(adjPos, direction, boardConfig);

            if (landingPos) {
                const isOccupied = placedCards.find(card => card.positionId === landingPos);
                if (!isOccupied) {
                    validJumps.push(landingPos);
                }
            }
        }
    });

    return validJumps;
};

export const getVizirValidMoves = (characterPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const validMoves = [];
    const directions = [
        { deltaRow: 0, deltaCol: 2 },
        { deltaRow: 0, deltaCol: -2 },
        { deltaRow: 2, deltaCol: 0 },
        { deltaRow: -2, deltaCol: 0 },
        { deltaRow: 1, deltaCol: 1 },
        { deltaRow: 1, deltaCol: -1 },
        { deltaRow: -1, deltaCol: 1 },
        { deltaRow: -1, deltaCol: -1 }
    ];

    directions.forEach(dir => {
        const pos1 = getNextPositionInDirection(characterPos, {
            deltaRow: dir.deltaRow / 2,
            deltaCol: dir.deltaCol / 2
        }, boardConfig);
        const pos2 = getNextPositionInDirection(characterPos, dir, boardConfig);

        if (pos1 && pos2) {
            const isPos1Empty = !placedCards.find(c => c.positionId === pos1);
            const isPos2Empty = !placedCards.find(c => c.positionId === pos2);
            if (isPos1Empty && isPos2Empty) {
                validMoves.push(pos2);
            }
        }
    });

    return validMoves;
};

export const getCogneurPushPositions = (cogneurPos, enemyPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const dir = getDirection(cogneurPos, enemyPos);
    const pushPositions = [
        getNextPositionInDirection(enemyPos, dir, boardConfig),
        getNextPositionInDirection(enemyPos, {
            deltaRow: -dir.deltaCol,
            deltaCol: dir.deltaRow
        }, boardConfig),
        getNextPositionInDirection(enemyPos, {
            deltaRow: dir.deltaCol,
            deltaCol: -dir.deltaRow
        }, boardConfig)
    ].filter(pos => pos && !placedCards.find(c => c.positionId === pos));

    return pushPositions;
};

export const getGardeRoyalTeleportPositions = (leaderPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const adjacentToLeader = getAdjacentPositions(leaderPos, boardConfig);
    return adjacentToLeader.filter(pos => !placedCards.find(c => c.positionId === pos));
};

export const getLanceGrappinTargets = (characterPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const allPositions = [];
    for (let row = 1; row <= 7; row++) {
        const maxCols = boardConfig;
        for (let col = 1; col <= maxCols[row]; col++) {
            const pos = `hex-${row}-${col}`;
            if (pos !== characterPos) {
                const hasChar = placedCards.find(c => c.positionId === pos);
                if (hasChar && isVisibleInStraightLine(characterPos, pos, placedCards, boardConfig)) {
                    allPositions.push(pos);
                }
            }
        }
    }
    return allPositions;
};

export const getManipulatorTargets = (characterPos, placedCards, turn, boardConfig = BOARD_CONFIG) => {
    const targets = [];
    placedCards.forEach(card => {
        if (card.owner !== turn && !isAdjacent(characterPos, card.positionId, boardConfig)) {
            if (isVisibleInStraightLine(characterPos, card.positionId, placedCards, boardConfig)) {
                targets.push(card.positionId);
            }
        }
    });
    return targets;
};

export const getRodeuseValidMoves = (characterPos, placedCards, turn, boardConfig = BOARD_CONFIG) => {
    const allEnemyPositions = placedCards
        .filter(c => c.owner !== turn)
        .map(c => c.positionId);

    const allPositions = [];
    for (let row = 1; row <= 7; row++) {
        const maxCols = boardConfig;
        for (let col = 1; col <= maxCols[row]; col++) {
            const pos = `hex-${row}-${col}`;
            const isOccupied = placedCards.find(c => c.positionId === pos);
            if (!isOccupied) {
                const isAdjacentToEnemy = allEnemyPositions.some(enemyPos =>
                    isAdjacent(pos, enemyPos, boardConfig)
                );
                if (!isAdjacentToEnemy) {
                    allPositions.push(pos);
                }
            }
        }
    }
    return allPositions;
};

export const getTavernierAllies = (characterPos, placedCards, turn, boardConfig = BOARD_CONFIG) => {
    const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);
    return adjacentPositions.filter(pos => {
        const char = placedCards.find(c => c.positionId === pos);
        return char && char.owner === turn && !char.isKing;
    });
};

export const getIllusionistTargets = (characterPos, placedCards, boardConfig = BOARD_CONFIG) => {
    const targets = [];
    placedCards.forEach(card => {
        if (card.positionId !== characterPos &&
            !isAdjacent(characterPos, card.positionId, boardConfig)) {
            if (isVisibleInStraightLine(characterPos, card.positionId, placedCards, boardConfig)) {
                targets.push(card.positionId);
            }
        }
    });
    return targets;
};

// ============================================
// PASSIVE ABILITY FUNCTIONS
// ============================================

export const checkJailerAdjacent = (characterPos, placedCards, turn, boardConfig = BOARD_CONFIG) => {
    const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);
    return adjacentPositions.some(pos => {
        const char = placedCards.find(c => c.positionId === pos);
        return char && char.cardData.type === "Geolier" && char.owner !== turn;
    });
};

export const checkProtectorAdjacent = (characterPos, placedCards, turn, boardConfig = BOARD_CONFIG) => {
    const adjacentPositions = getAdjacentPositions(characterPos, boardConfig);
    return adjacentPositions.some(pos => {
        const char = placedCards.find(c => c.positionId === pos);
        return char && char.cardData.type === "Protector" && char.owner === turn;
    });
};

// ============================================
// NEMESIS FUNCTIONS
// ============================================

export const calculateNemesisMovement = (nemesisPos, opponentLeaderPos, placedCards, boardConfig = BOARD_CONFIG) => {
    if (!nemesisPos || !opponentLeaderPos) return { validPositions: [], canMove: false };

    const direction = getDirection(nemesisPos, opponentLeaderPos);

    // Try to move 2 spaces in direction
    let firstMove = getNextPositionInDirection(nemesisPos, direction, boardConfig);
    let secondMove = firstMove ? getNextPositionInDirection(firstMove, direction, boardConfig) : null;

    // Check if positions are valid and empty
    const validPositions = [];

    if (firstMove && !placedCards.find(c => c.positionId === firstMove)) {
        validPositions.push(firstMove);
    }

    if (secondMove && !placedCards.find(c => c.positionId === secondMove)) {
        validPositions.push(secondMove);
    }

    return {
        validPositions,
        canMove: validPositions.length > 0
    };
};

// ============================================
// HERMIT & CUB FUNCTIONS
// ============================================

export const getHermitCubRecruitmentPositions = (placedCards, turn, boardConfig = BOARD_CONFIG) => {
    // Recruitment spaces for Hermit & Cub
    const recruitmentSpaces = turn === "player"
        ? ["hex-1-4", "hex-2-5", "hex-3-6", "hex-4-7", "hex-5-6", "hex-6-5", "hex-7-4"]
        : ["hex-1-1", "hex-2-1", "hex-3-1", "hex-4-1", "hex-5-1", "hex-6-1", "hex-7-1"];

    return recruitmentSpaces.filter(pos => !placedCards.find(c => c.positionId === pos));
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getAllEmptyPositions = (boardConfig = BOARD_CONFIG) => {
    const allPositions = [];
    for (let row = 1; row <= 7; row++) {
        const maxCols = boardConfig[row];
        for (let col = 1; col <= maxCols; col++) {
            allPositions.push(`hex-${row}-${col}`);
        }
    }
    return allPositions;
};

export const getPositionCoordinates = (positionId) => {
    const [_, row, col] = positionId.split("-").map(Number);
    return { row, col };
};

export const isValidPosition = (positionId, boardConfig = BOARD_CONFIG) => {
    const { row, col } = getPositionCoordinates(positionId);
    return row >= 1 && row <= 7 && col >= 1 && col <= boardConfig[row];
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
    BOARD_CONFIG,

    // Core helper functions
    getAdjacentPositions,
    getDirection,
    getNextPositionInDirection,
    isVisibleInStraightLine,
    isAdjacent,
    getDistanceInStraightLine,

    // Skill-specific functions
    getAcrobateJumpPositions,
    getVizirValidMoves,
    getCogneurPushPositions,
    getGardeRoyalTeleportPositions,
    getLanceGrappinTargets,
    getManipulatorTargets,
    getRodeuseValidMoves,
    getTavernierAllies,
    getIllusionistTargets,

    // Passive ability functions
    checkJailerAdjacent,
    checkProtectorAdjacent,

    // Special character functions
    calculateNemesisMovement,
    getHermitCubRecruitmentPositions,

    // Utility functions
    getAllEmptyPositions,
    getPositionCoordinates,
    isValidPosition
};