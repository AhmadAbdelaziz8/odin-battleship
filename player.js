import Gameboard from './gameboard';

const Player = (type) => {
  // Basic properties
  const playerType = type;
  const gameboard = Gameboard();
  
  // For tracking computer attack history
  let nextPosition = 0; // Use a simple incrementing counter for deterministic attacks
  
  // Return the player's type (human or computer)
  const getType = () => playerType;
  
  // Return the player's gameboard
  const getGameboard = () => gameboard;
  
  // Human player attack method - simply forwards to the enemy board
  const attack = (enemyGameboard, coords) => {
    return enemyGameboard.receiveAttack(coords);
  };
  
  // Computer player attack method - deterministic for testing
  const computerAttack = (enemyGameboard) => {
    // Grid size - standard 10x10 board
    const gridSize = 10;
    
    // Convert the linear position to x,y coordinates
    const x = Math.floor(nextPosition / gridSize);
    const y = nextPosition % gridSize;
    
    // Increment position counter for next attack
    nextPosition++;
    
    // Attack the enemy board and return the result
    return enemyGameboard.receiveAttack([x, y]);
  };
  
  return {
    getType,
    getGameboard,
    attack,
    computerAttack
  };
};

export default Player;
