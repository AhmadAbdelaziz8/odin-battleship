const Gameboard = () => {
  const gridSize = 10;
  const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  const missedAttacks = [];
  const ships = []; // To keep track of all ships placed on the board

  const placeShip = (ship, coordinates, orientation) => {
    const [x, y] = coordinates;
    const length = ship.getLength();

    // Basic validation (can be expanded)
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
      throw new Error('Ship placement is out of bounds.');
    }

    const cellsToOccupy = [];

    if (orientation === 'horizontal') {
      if (x + length > gridSize) {
        throw new Error('Ship placement (horizontal) is out of bounds.');
      }
      for (let i = 0; i < length; i++) {
        if (grid[y][x + i] !== null) {
          throw new Error('Ship placement overlaps another ship.');
        }
        cellsToOccupy.push({ r: y, c: x + i });
      }
    } else if (orientation === 'vertical') {
      if (y + length > gridSize) {
        throw new Error('Ship placement (vertical) is out of bounds.');
      }
      for (let i = 0; i < length; i++) {
        if (grid[y + i][x] !== null) {
          throw new Error('Ship placement overlaps another ship.');
        }
        cellsToOccupy.push({ r: y + i, c: x });
      }
    } else {
      throw new Error('Invalid ship orientation.');
    }

    // Place the ship
    cellsToOccupy.forEach(cell => {
      grid[cell.r][cell.c] = ship;
    });
    ships.push(ship);
  };

  const receiveAttack = (coordinates) => {
    const [x, y] = coordinates;

    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
      // Considered an invalid attack, could throw error or return specific status
      // For now, let's treat out-of-bounds as a miss that isn't recorded to avoid cluttering missedAttacks
      // Or, alternatively, throw an error if strict coordinate validation is desired.
      // Let's assume valid coordinates for now as per problem statement for core logic.
      return false; // Or throw new Error("Attack out of bounds");
    }

    const targetCell = grid[y][x];

    if (targetCell === null) {
      // Check if this spot was already missed
      if (!missedAttacks.some(miss => miss[0] === x && miss[1] === y)) {
          missedAttacks.push(coordinates);
      }
      return false; // Miss
    } else {
      // It's a ship. The `targetCell` is the ship object itself.
      targetCell.hit();
      return true; // Hit
    }
  };

  const getMissedAttacks = () => {
    return [...missedAttacks]; // Return a copy
  };

  const allShipsSunk = () => {
    if (ships.length === 0) {
      return true; // No ships to sink
    }
    return ships.every(ship => ship.isSunk());
  };

  // Test helper method (as discussed for gameboard.test.js)
  const getShipAt = (coordinates) => {
    const [x,y] = coordinates;
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
        return null; // Out of bounds
    }
    return grid[y][x]; // Will be ship object or null
  };

  return {
    placeShip,
    receiveAttack,
    getMissedAttacks,
    allShipsSunk,
    getShipAt, // Exposing for testing, could be removed/conditional for production
    // Potentially a method to get the grid for rendering, but carefully considered (read-only copy)
  };
};

export default Gameboard;
