import Ship from './Ship.js';

const Gameboard = (size = 10) => {
  // Initialize a grid filled with null based on the specified size
  const grid = Array(size).fill().map(() => Array(size).fill(null));
  
  // Keep track of missed attacks
  const missedAttacks = [];
  
  // Keep track of ships on the board
  const ships = [];
  
  // Track attacked coordinates (both hits and misses) for AI
  const attackedCoordinates = [];
  
  /**
   * Place a ship on the board
   * @param {Array} coordinates - The starting coordinates [x, y]
   * @param {number} length - The length of the ship
   * @param {string} orientation - The orientation of the ship ('horizontal' or 'vertical')
   * @param {string} shipType - The type/name of the ship (e.g., 'destroyer')
   * @returns {boolean} - Whether the ship was placed successfully
   */
  const placeShip = (coordinates, length, orientation, shipType = '') => {
    const ship = Ship(length, shipType);
    const [x, y] = coordinates;
    
    // Check if the ship can be placed at the given coordinates
    if (!canPlaceShip(coordinates, length, orientation)) {
      return false;
    }
    
    // Place the ship on the grid
    ships.push(ship);
    
    for (let i = 0; i < length; i++) {
      const posX = orientation === 'horizontal' ? x + i : x;
      const posY = orientation === 'vertical' ? y + i : y;
      
      grid[posY][posX] = { 
        isShip: true, 
        ship, 
        index: i,
        hits: 0,
        isSunk: false,
        type: shipType
      };
    }
    
    return true;
  };
  
  /**
   * Check if a ship can be placed at the given coordinates
   * @param {Array} coordinates - The starting coordinates [x, y]
   * @param {number} length - The length of the ship
   * @param {string} orientation - The orientation of the ship ('horizontal' or 'vertical')
   * @returns {boolean} - Whether the ship can be placed
   */
  const canPlaceShip = (coordinates, length, orientation) => {
    const [x, y] = coordinates;
    
    // Check if the ship extends beyond the board
    if (orientation === 'horizontal' && x + length > size) {
      return false;
    }
    if (orientation === 'vertical' && y + length > size) {
      return false;
    }
    
    // Check if coordinates are out of bounds
    if (x < 0 || y < 0 || x >= size || y >= size) {
      return false;
    }
    
    // Check if there's already a ship in any of the cells or adjacent to them
    for (let i = 0; i < length; i++) {
      const posX = orientation === 'horizontal' ? x + i : x;
      const posY = orientation === 'vertical' ? y + i : y;
      
      // Check the cell itself
      if (grid[posY][posX] !== null) {
        return false;
      }
      
      // Check adjacent cells (including diagonals)
      // This prevents ships from touching each other
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const adjacentX = posX + dx;
          const adjacentY = posY + dy;
          
          // Skip if out of bounds or the cell itself
          if (adjacentX < 0 || adjacentX >= size || adjacentY < 0 || adjacentY >= size || 
              (dx === 0 && dy === 0)) {
            continue;
          }
          
          // If we find a ship in an adjacent cell, only return false if it's not part of the ship we're placing
          if (grid[adjacentY][adjacentX] !== null && grid[adjacentY][adjacentX].isShip) {
            // Check if this adjacent cell is part of the current ship placement
            const isPartOfCurrentShip = (orientation === 'horizontal' && adjacentX >= x && adjacentX < x + length && adjacentY === y) || 
                                       (orientation === 'vertical' && adjacentY >= y && adjacentY < y + length && adjacentX === x);
            
            if (!isPartOfCurrentShip) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  };
  
  /**
   * Check if the specified coordinates have already been attacked
   * @param {Array} coordinates - The coordinates to check [x, y]
   * @returns {boolean} - Whether the coordinates have been attacked
   */
  const isAttacked = (coordinates) => {
    const [x, y] = coordinates;
    return attackedCoordinates.some(([ax, ay]) => ax === x && ay === y);
  };
  
  /**
   * Receive an attack at the specified coordinates
   * @param {Array} coordinates - The coordinates to attack [x, y]
   * @returns {Object} - Result object with hit status, ship info (if hit), and sink status
   */
  const receiveAttack = (coordinates) => {
    const [x, y] = coordinates;
    
    // Check if the coordinates are valid
    if (x < 0 || x >= size || y < 0 || y >= size) {
      return { hit: false, sunk: false, ship: null };
    }
    
    // Check if this position has already been attacked
    if (isAttacked(coordinates)) {
      return { hit: false, sunk: false, ship: null, alreadyAttacked: true };
    }
    
    // Record this attack
    attackedCoordinates.push([x, y]);
    
    const cell = grid[y][x];
    
    // If the cell contains a ship
    if (cell !== null && cell.isShip) {
      cell.hits++;
      cell.ship.hit(cell.index);
      
      // Check if the ship is sunk
      const sunk = cell.ship.isSunk();
      if (sunk) {
        // Mark all cells for this ship as sunk
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const currentCell = grid[j][i];
            if (currentCell !== null && currentCell.isShip && currentCell.ship === cell.ship) {
              currentCell.isSunk = true;
            }
          }
        }
      }
      
      return { 
        hit: true, 
        sunk: sunk, 
        ship: {
          type: cell.type,
          length: cell.ship.getLength()
        }
      };
    } 
    // If the cell is empty, record it as a miss
    else {
      // Check if this coordinate has already been recorded as a miss
      if (!missedAttacks.some(([mx, my]) => mx === x && my === y)) {
        missedAttacks.push([x, y]);
      }
      return { hit: false, sunk: false, ship: null };
    }
  };
  
  /**
   * Check if all ships on the board have been sunk
   * @returns {boolean} - Whether all ships are sunk
   */
  const allShipsSunk = () => {
    return ships.length > 0 && ships.every(ship => ship.isSunk());
  };
  
  /**
   * Reset the board by clearing all ships and attacks
   */
  const reset = () => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        grid[y][x] = null;
      }
    }
    missedAttacks.length = 0;
    ships.length = 0;
    attackedCoordinates.length = 0;
  };
  
  /**
   * Get the size of the board
   * @returns {number} - The size of the board
   */
  const getSize = () => size;
  
  const getShipAt = (coordinates) => {
    const [x,y] = coordinates;
    if (x < 0 || y < 0 || x >= size || y >= size) {
        return null; // Out of bounds
    }
    return grid[y][x]; // Will be ship object or null
  };

  /**
   * Get the grid
   * @returns {Array} - The grid
   */
  const getGrid = () => grid;

  /**
   * Get the missed attacks
   * @returns {Array} - The missed attacks
   */
  const getMissedAttacks = () => missedAttacks;

  return {
    getGrid,
    getMissedAttacks,
    placeShip,
    canPlaceShip,
    receiveAttack,
    isAttacked,
    allShipsSunk,
    reset,
    getSize
  };
};

export default Gameboard;
