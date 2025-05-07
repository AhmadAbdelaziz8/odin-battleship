import Game from '../src/game.js';
import domManager from '../src/dom/domManager.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Battleship game ready!');
  
  // DOM element IDs
  const PLAYER_BOARD_ID = 'player-board-grid';
  const COMPUTER_BOARD_ID = 'computer-board-grid';
  const STATUS_MESSAGE_ID = 'game-status';
  
  // Game state tracking
  let gameInProgress = false;
  let isShipPlacing = true;
  let boardSize = 10;
  let difficulty = 'medium';
  
  // Initialize the game with current settings
  const initializeGame = () => {
    // Hide previous game UI if any
    document.getElementById('ship-placement').style.display = 'block';
    document.getElementById('computer-board-grid').style.pointerEvents = 'none';
    
    // Initialize the game with current settings
    const ships = Game.init(boardSize, difficulty);
    
    // Render the empty player board for ship placement
    domManager.renderBoard(PLAYER_BOARD_ID, Game.getPlayerGameboard(), false, boardSize);
    
    // Render the empty computer board (will fill later)
    domManager.renderBoard(COMPUTER_BOARD_ID, Game.getComputerGameboard(), true, boardSize);
    
    // Show ship placement UI
    domManager.renderShipSelection(ships);
    
    // Add ship placement hover preview
    domManager.addPlacementHoverListeners(PLAYER_BOARD_ID, (coords, orientation, length) => {
      return Game.canPlaceShip(coords, orientation, length);
    });
    
    // Reset game state
    gameInProgress = false;
    isShipPlacing = true;
    
    // Update scoreboard
    updateScoreboard();
    
    // Display initial message
    domManager.displayMessage('Place your ships on the board!', STATUS_MESSAGE_ID);
    
    // Set up ship placement click handler
    setupShipPlacementListeners();
  };
  
  // Set up listeners for ship placement
  const setupShipPlacementListeners = () => {
    // Player board click for ship placement
    const playerBoard = document.getElementById(PLAYER_BOARD_ID);
    playerBoard.addEventListener('click', handleShipPlacement);
    
    // Random placement button
    document.getElementById('random-placement').addEventListener('click', handleRandomPlacement);
    
    // Start game button
    document.getElementById('start-game').addEventListener('click', startActualGame);
  };
  
  // Handle player clicking to place a ship
  const handleShipPlacement = (event) => {
    if (!isShipPlacing) return;
    
    const cell = event.target;
    if (!cell.classList.contains('cell')) return;
    
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const shipInfo = domManager.getSelectedShipInfo();
    
    if (!shipInfo.type) {
      domManager.displayMessage('Please select a ship first!', STATUS_MESSAGE_ID);
      return;
    }
    
    // Try to place the ship
    const placed = Game.placeShip([x, y], shipInfo.length, shipInfo.orientation, shipInfo.type);
    
    if (placed) {
      // Update the board to show the placed ship
      domManager.renderBoard(PLAYER_BOARD_ID, Game.getPlayerGameboard(), false, boardSize);
      
      // Mark the ship as placed in the UI
      domManager.markShipPlaced(shipInfo.type);
      
      // Re-add placement hover preview (it's removed during renderBoard)
      domManager.addPlacementHoverListeners(PLAYER_BOARD_ID, (coords, orientation, length) => {
        return Game.canPlaceShip(coords, orientation, length);
      });
    } else {
      domManager.displayMessage('Cannot place ship there! Try another position.', STATUS_MESSAGE_ID);
    }
  };
  
  // Handle random ship placement
  const handleRandomPlacement = () => {
    if (!isShipPlacing) return;
    
    // Place ships randomly
    const success = Game.placeShipsRandomly();
    
    if (success) {
      // Update the board to show all placed ships
      domManager.renderBoard(PLAYER_BOARD_ID, Game.getPlayerGameboard(), false, boardSize);
      
      // Enable the start game button
      document.getElementById('start-game').disabled = false;
      
      // Update message
      domManager.displayMessage('Ships placed randomly! Click "Start Game" to begin.', STATUS_MESSAGE_ID);
      
      // Mark all ships as placed
      const ships = Game.getShips();
      ships.forEach(ship => {
        domManager.markShipPlaced(ship.name.toLowerCase());
      });
    }
  };
  
  // Start the actual game after ship placement
  const startActualGame = () => {
    // Start the game
    Game.startGame();
    
    // Hide ship placement UI
    document.getElementById('ship-placement').style.display = 'none';
    
    // Enable computer board for attacks
    document.getElementById('computer-board-grid').style.pointerEvents = 'auto';
    
    // Add click handler for attacks
    const computerBoard = document.getElementById(COMPUTER_BOARD_ID);
    computerBoard.addEventListener('click', handleAttack);
    
    // Update game state
    isShipPlacing = false;
    gameInProgress = true;
    
    // Render boards
    domManager.renderBoard(PLAYER_BOARD_ID, Game.getPlayerGameboard(), false, boardSize);
    domManager.renderBoard(COMPUTER_BOARD_ID, Game.getComputerGameboard(), true, boardSize);
    
    // Display message
    domManager.displayMessage('Game started! Click on the enemy board to attack.', STATUS_MESSAGE_ID);
  };
  
  // Handle player clicking to attack
  const handleAttack = (event) => {
    if (!gameInProgress || Game.getCurrentPlayer() !== 'player') return;
    
    const cell = event.target;
    if (!cell.classList.contains('cell')) return;
    
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    // Process player's attack
    processPlayerAttack([x, y]);
  };
  
  // Process player's attack
  const processPlayerAttack = (coords) => {
    // Execute attack
    const attackResult = Game.playTurn(coords);
    
    // If the attack was invalid (already attacked or other issue)
    if (!attackResult.hit && attackResult.alreadyAttacked) {
      domManager.displayMessage('You already attacked this position!', STATUS_MESSAGE_ID);
      return;
    }
    
    // Update UI based on result
    domManager.renderBoard(COMPUTER_BOARD_ID, Game.getComputerGameboard(), true, boardSize);
    
    // Update game statistics
    domManager.displayGameStats(Game.getGameStats());
    
    // Create result message
    let resultMessage = attackResult.hit ? 
      (attackResult.sunk ? `You sunk their ${attackResult.ship.type}!` : 'Hit!') : 
      'Miss!';
    
    // Check for game over
    if (attackResult.isGameOver) {
      gameInProgress = false;
      resultMessage = `Game Over! ${attackResult.winner === 'player' ? 'You win!' : 'Computer wins!'}`;
      domManager.displayMessage(resultMessage, STATUS_MESSAGE_ID);
      
      // Show all ships on computer board
      domManager.renderBoard(COMPUTER_BOARD_ID, Game.getComputerGameboard(), false, boardSize);
      
      // Update scoreboard
      updateScoreboard();
      return;
    }
    
    // Display result
    domManager.displayMessage(resultMessage + ' Computer is thinking...', STATUS_MESSAGE_ID);
    
    // After a short delay, computer plays its turn
    setTimeout(() => {
      if (!gameInProgress) return;
      
      // Execute computer's attack
      const computerResult = Game.playTurn();
      
      // Update UI based on result
      domManager.renderBoard(PLAYER_BOARD_ID, Game.getPlayerGameboard(), false, boardSize);
      
      // Update game statistics
      domManager.displayGameStats(Game.getGameStats());
      
      // Create result message
      let computerMessage = computerResult.hit ? 
        (computerResult.sunk ? `Computer sunk your ${computerResult.ship.type}!` : 'Computer hit your ship!') : 
        'Computer missed!';
      
      // Check for game over
      if (computerResult.isGameOver) {
        gameInProgress = false;
        computerMessage = `Game Over! ${computerResult.winner === 'player' ? 'You win!' : 'Computer wins!'}`;
        domManager.displayMessage(computerMessage, STATUS_MESSAGE_ID);
        
        // Update scoreboard
        updateScoreboard();
        return;
      }
      
      // Update game status message
      domManager.displayMessage(computerMessage + ' Your turn!', STATUS_MESSAGE_ID);
    }, 1000);
  };
  
  // Update the scoreboard with current scores
  const updateScoreboard = () => {
    domManager.updateScoreboard(Game.getScores());
  };
  
  // Apply new game options
  const applyGameOptions = () => {
    // Read settings from UI
    const newBoardSize = parseInt(document.getElementById('board-size').value);
    const newDifficulty = document.getElementById('difficulty').value;
    
    // Update settings
    boardSize = newBoardSize;
    difficulty = newDifficulty;
    
    // Initialize a new game with these settings
    initializeGame();
  };
  
  // Add event listeners for buttons
  document.getElementById('new-game').addEventListener('click', () => {
    initializeGame();
  });
  
  document.getElementById('reset-game').addEventListener('click', () => {
    Game.resetGame();
    
    // If in ship placement mode, reset that
    if (isShipPlacing) {
      domManager.resetShipSelection();
      initializeGame();
    } else {
      // Otherwise start over with ship placement
      isShipPlacing = true;
      initializeGame();
    }
  });
  
  // Add event listener for apply options button
  document.getElementById('apply-options').addEventListener('click', applyGameOptions);
  
  // Start the game initially
  initializeGame();
}); 
