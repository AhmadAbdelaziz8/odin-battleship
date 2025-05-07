/**
 * Game.js
 * Main game controller for the Battleship game
 * Manages game state, player turns, and integrates with the DOM manager
 */

import Player from './components/Player.js';
import Gameboard from './components/Gameboard.js';
import Ship from './components/Ship.js';

const Game = (() => {
  // Game state
  let player;
  let computer;
  let playerGameboard;
  let computerGameboard;
  let currentPlayer;
  let isGameOver = false;
  
  // Game settings
  let boardSize = 10;
  let difficulty = 'medium';
  let placementMode = false;
  
  // Game statistics
  let gameStats = {
    turns: 0,
    hits: 0,
    misses: 0,
    get accuracy() {
      return this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0;
    }
  };
  
  // Scoring
  let scores = {
    wins: 0,
    losses: 0,
    get totalGames() { return this.wins + this.losses; }
  };
  
  // Load scores from localStorage if available
  const loadScores = () => {
    const savedScores = localStorage.getItem('battleship-scores');
    if (savedScores) {
      const parsedScores = JSON.parse(savedScores);
      scores.wins = parsedScores.wins || 0;
      scores.losses = parsedScores.losses || 0;
    }
    return scores;
  };
  
  // Save scores to localStorage
  const saveScores = () => {
    localStorage.setItem('battleship-scores', JSON.stringify({
      wins: scores.wins,
      losses: scores.losses
    }));
  };
  
  /**
   * Initialize the game with players and gameboards
   * @param {number} size - Size of the board (default: 10)
   * @param {string} difficultyLevel - Difficulty level (easy, medium, hard)
   */
  const init = (size = 10, difficultyLevel = 'medium') => {
    // Set game settings
    boardSize = size;
    difficulty = difficultyLevel;
    
    // Create gameboards
    playerGameboard = Gameboard(boardSize);
    computerGameboard = Gameboard(boardSize);
    
    // Create players
    player = Player('human', boardSize);
    computer = Player('computer', boardSize, difficulty);
    
    // Set player as the first one to move
    currentPlayer = player;
    
    // Reset game state
    isGameOver = false;
    placementMode = true;
    
    // Reset game statistics
    gameStats = {
      turns: 0,
      hits: 0,
      misses: 0,
      get accuracy() {
        return this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0;
      }
    };
    
    // Load scores
    loadScores();
    
    return getShips();
  };
  
  /**
   * Get the list of ships for the game
   * @returns {Array} - List of ships with their lengths and names
   */
  const getShips = () => {
    // Return a different set of ships based on board size
    if (boardSize <= 8) {
      return [
        { length: 4, name: 'Battleship' },
        { length: 3, name: 'Cruiser' },
        { length: 3, name: 'Submarine' },
        { length: 2, name: 'Destroyer' }
      ];
    } else if (boardSize >= 12) {
      return [
        { length: 5, name: 'Carrier' },
        { length: 4, name: 'Battleship' },
        { length: 3, name: 'Cruiser' },
        { length: 3, name: 'Submarine' },
        { length: 2, name: 'Destroyer' },
        { length: 2, name: 'Patrol Boat' }
      ];
    } else {
      // Default 10x10 board ships
      return [
        { length: 5, name: 'Carrier' },
        { length: 4, name: 'Battleship' },
        { length: 3, name: 'Cruiser' },
        { length: 3, name: 'Submarine' },
        { length: 2, name: 'Destroyer' }
      ];
    }
  };
  
  /**
   * Check if a ship can be placed at the given coordinates
   * @param {Array} coords - Starting coordinates
   * @param {string} orientation - Ship orientation (horizontal/vertical)
   * @param {number} length - Ship length
   * @returns {boolean} - Whether the ship can be placed
   */
  const canPlaceShip = (coords, orientation, length) => {
    return playerGameboard.canPlaceShip(coords, length, orientation);
  };
  
  /**
   * Place a ship on the player's board manually
   * @param {Array} coords - Starting coordinates
   * @param {number} length - Ship length
   * @param {string} orientation - Ship orientation
   * @param {string} shipType - Ship type/name
   * @returns {boolean} - Whether the ship was placed successfully
   */
  const placeShip = (coords, length, orientation, shipType) => {
    if (!placementMode) return false;
    
    // Place the ship on the player's board
    return playerGameboard.placeShip(coords, length, orientation, shipType);
  };
  
  /**
   * Place ships randomly on the computer's board
   */
  const placeComputerShips = () => {
    const ships = getShips();
    
    // Place ships randomly on computer board
    ships.forEach(ship => {
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      
      // Find a valid position for computer
      let computerPos;
      do {
        const x = Math.floor(Math.random() * boardSize);
        const y = Math.floor(Math.random() * boardSize);
        computerPos = [x, y];
      } while (!computerGameboard.canPlaceShip(computerPos, ship.length, orientation));
      
      // Place ship
      computerGameboard.placeShip(computerPos, ship.length, orientation, ship.name.toLowerCase());
    });
  };
  
  /**
   * Place ships randomly on the player's board
   * @returns {boolean} - Whether all ships were placed successfully
   */
  const placeShipsRandomly = () => {
    if (!placementMode) return false;
    
    // Clear player board first
    playerGameboard = Gameboard(boardSize);
    const ships = getShips();
    
    // Place ships randomly on player board
    ships.forEach(ship => {
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      
      // Find a valid position for player
      let playerPos;
      do {
        const x = Math.floor(Math.random() * boardSize);
        const y = Math.floor(Math.random() * boardSize);
        playerPos = [x, y];
      } while (!playerGameboard.canPlaceShip(playerPos, ship.length, orientation));
      
      // Place ship
      playerGameboard.placeShip(playerPos, ship.length, orientation, ship.name.toLowerCase());
    });
    
    return true;
  };
  
  /**
   * Start the game after ship placement
   */
  const startGame = () => {
    placementMode = false;
    placeComputerShips();
  };
  
  /**
   * Handle a player's turn
   * @param {Array} coords - The coordinates to attack (required for human player)
   * @returns {Object} - Result of the attack
   */
  const playTurn = (coords) => {
    if (isGameOver) {
      return { success: false, message: 'Game is over' };
    }
    
    if (placementMode) {
      return { success: false, message: 'Still in placement mode' };
    }
    
    if (currentPlayer === player && !coords) {
      return { success: false, message: 'Human player needs coordinates to attack' };
    }
    
    let attackResult;
    let targetBoard;
    
    if (currentPlayer === player) {
      targetBoard = computerGameboard;
      attackResult = player.attack(targetBoard, coords);
      
      // Update statistics
      gameStats.turns++;
      if (attackResult.hit) {
        gameStats.hits++;
      } else {
        gameStats.misses++;
      }
      
    } else {
      targetBoard = playerGameboard;
      attackResult = computer.computerAttack(targetBoard);
    }
    
    // Check for game over condition
    if (targetBoard.allShipsSunk()) {
      isGameOver = true;
      
      // Update scores
      if (currentPlayer === player) {
        scores.wins++;
      } else {
        scores.losses++;
      }
      
      // Save scores
      saveScores();
      
      return { 
        ...attackResult, 
        isGameOver: true, 
        winner: currentPlayer === player ? 'player' : 'computer',
        stats: gameStats
      };
    }
    
    // Switch turn if attack was processed (successful or not)
    switchTurn();
    
    return { ...attackResult, stats: gameStats };
  };
  
  /**
   * Switch the current player
   */
  const switchTurn = () => {
    currentPlayer = currentPlayer === player ? computer : player;
  };
  
  /**
   * Reset the game completely
   */
  const resetGame = () => {
    init(boardSize, difficulty);
  };
  
  return {
    init,
    getShips,
    placeShip,
    canPlaceShip,
    placeShipsRandomly,
    startGame,
    playTurn,
    resetGame,
    isGameOver: () => isGameOver,
    isPlacementMode: () => placementMode,
    getCurrentPlayer: () => currentPlayer === player ? 'player' : 'computer',
    getPlayerGameboard: () => playerGameboard,
    getComputerGameboard: () => computerGameboard,
    getGameStats: () => gameStats,
    getScores: () => ({ ...scores }),
    getBoardSize: () => boardSize,
    getDifficulty: () => difficulty
  };
})();

export default Game;
