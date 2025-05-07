import Gameboard from './Gameboard.js';

const Player = (type, boardSize = 10, difficulty = 'medium') => {
  const playerType = type;
  const gameboard = Gameboard(boardSize);
  
  // Keep track of computer attack strategy
  let attackMode = 'random'; // 'random', 'hunt', 'destroy'
  let nextPosition = 0;
  let lastHitCoords = null;
  let targetShipHits = [];
  let potentialMoves = [];
  
  // Set difficulty settings
  let hitProbability = 0.5; // Default medium
  switch (difficulty) {
    case 'easy':
      hitProbability = 0.3;
      break;
    case 'medium':
      hitProbability = 0.5;
      break;
    case 'hard':
      hitProbability = 0.7;
      break;
  }
  
  /**
   * Attack the enemy gameboard at the specified coordinates
   * @param {Object} enemyGameboard - The enemy's gameboard to attack
   * @param {Array} coords - The coordinates to attack
   * @returns {Object} - Result of the attack with hit status
   */
  const attack = (enemyGameboard, coords) => {
    const result = enemyGameboard.receiveAttack(coords);
    return { 
      hit: result.hit, 
      sunk: result.sunk, 
      ship: result.ship,
      coords: coords
    };
  };
  
  /**
   * Generate adjacent coordinates to a hit position
   * @param {Array} coords - The hit coordinates
   * @returns {Array} - List of valid adjacent coordinates
   */
  const getAdjacentCoords = (coords) => {
    const [x, y] = coords;
    const adjacent = [
      [x+1, y], [x-1, y], [x, y+1], [x, y-1]
    ];
    
    // Filter out invalid coordinates
    return adjacent.filter(([x, y]) => 
      x >= 0 && x < boardSize && y >= 0 && y < boardSize
    );
  };
  
  /**
   * Computer makes an intelligent attack based on difficulty level
   * @param {Object} enemyGameboard - The enemy's gameboard to attack
   * @returns {Object} - Result of the attack with hit status
   */
  const computerAttack = (enemyGameboard) => {
    let coords;
    
    // If on hard difficulty and we're in destroy mode, be more strategic
    if (attackMode === 'destroy' && difficulty !== 'easy') {
      // Continue attacking the ship we've hit
      if (potentialMoves.length > 0) {
        coords = potentialMoves.pop();
      } else {
        // If we've exhausted our potential moves, go back to random
        attackMode = 'random';
        coords = getRandomCoords(enemyGameboard);
      }
    }
    // If on medium/hard and we've hit a ship, enter hunt mode
    else if (attackMode === 'hunt' && difficulty !== 'easy') {
      coords = potentialMoves.pop();
      if (potentialMoves.length === 0) {
        attackMode = 'random';
      }
    }
    // Otherwise use random attacks
    else {
      coords = getRandomCoords(enemyGameboard);
    }
    
    // Execute the attack
    const result = enemyGameboard.receiveAttack(coords);
    
    // Update attack strategy based on result
    if (result.hit) {
      // If ship was sunk, go back to random mode
      if (result.sunk) {
        attackMode = 'random';
        targetShipHits = [];
        potentialMoves = [];
      }
      // If we hit but didn't sink, update our strategy
      else {
        if (attackMode === 'random' || attackMode === 'hunt') {
          // Start targeting this ship
          attackMode = 'destroy';
          lastHitCoords = coords;
          targetShipHits = [coords];
          
          // Get adjacent cells for potential moves
          potentialMoves = getAdjacentCoords(coords).filter(coordPair => {
            // Check if these coordinates have already been attacked
            return !enemyGameboard.isAttacked(coordPair);
          });
        } else if (attackMode === 'destroy') {
          // Add this hit to our target ship hits
          targetShipHits.push(coords);
          
          // If we have 2+ hits, we can determine the ship's orientation
          if (targetShipHits.length >= 2) {
            // Reset potential moves
            potentialMoves = [];
            
            // Determine if ship is horizontal or vertical
            const isHorizontal = targetShipHits[0][1] === targetShipHits[1][1];
            
            // Add potential moves in the same direction
            targetShipHits.forEach(hit => {
              const newMoves = isHorizontal ? 
                [[hit[0] - 1, hit[1]], [hit[0] + 1, hit[1]]] : 
                [[hit[0], hit[1] - 1], [hit[0], hit[1] + 1]];
                
              newMoves.forEach(move => {
                // Check if valid and not already attacked
                if (move[0] >= 0 && move[0] < boardSize && 
                    move[1] >= 0 && move[1] < boardSize && 
                    !enemyGameboard.isAttacked(move) &&
                    !potentialMoves.some(m => m[0] === move[0] && m[1] === move[1])) {
                  potentialMoves.push(move);
                }
              });
            });
          }
        }
      }
    } 
    // If we missed
    else {
      // If we're in hunt mode and missed, try another direction
      if (attackMode === 'hunt' && potentialMoves.length === 0) {
        attackMode = 'random';
      }
    }
    
    return { 
      hit: result.hit, 
      sunk: result.sunk, 
      ship: result.ship,
      coords: coords
    };
  };
  
  /**
   * Get random coordinates that haven't been attacked yet
   * @param {Object} enemyGameboard - The enemy's gameboard to attack
   * @returns {Array} - Coordinates [x, y]
   */
  const getRandomCoords = (enemyGameboard) => {
    // For hard difficulty, use parity strategy (checkerboard pattern)
    // This increases the chance of finding ships by only attacking 
    // cells with the same parity (like black squares on a chessboard)
    if (difficulty === 'hard') {
      const parityCells = [];
      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          // Use parity (sum of x+y is even) to create a checkerboard pattern
          if ((x + y) % 2 === 0 && !enemyGameboard.isAttacked([x, y])) {
            parityCells.push([x, y]);
          }
        }
      }
      
      // If we have parity cells available, choose one randomly
      if (parityCells.length > 0) {
        return parityCells[Math.floor(Math.random() * parityCells.length)];
      }
    }
    
    // Fallback to simple random attacks if parity strategy isn't applicable
    let x, y;
    do {
      x = Math.floor(Math.random() * boardSize);
      y = Math.floor(Math.random() * boardSize);
    } while (enemyGameboard.isAttacked([x, y]));
    
    return [x, y];
  };
  
  return {
    getType: () => playerType,
    getGameboard: () => gameboard,
    attack,
    computerAttack,
    getDifficulty: () => difficulty
  };
};

export default Player;
