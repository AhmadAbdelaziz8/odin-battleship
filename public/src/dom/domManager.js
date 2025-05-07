/**
 * DOM Manager Module
 * Handles all interactions with the DOM for the Battleship game
 * Functions include rendering boards, updating cells, displaying messages,
 * and supporting ship placement, animations, and scoreboard updates
 */

const domManager = (() => {
  // Sound effects for game events
  const sounds = {
    hit: null,  // new Audio('/sounds/hit.mp3'),
    miss: null, // new Audio('/sounds/miss.mp3'),
    sunk: null, // new Audio('/sounds/sunk.mp3'),
    win: null,  // new Audio('/sounds/win.mp3'),
    lose: null  // new Audio('/sounds/lose.mp3')
  };
  
  // Track which ships are placed and selected
  let selectedShipType = null;
  let selectedShipLength = 0;
  let currentOrientation = 'horizontal';
  let shipsToPlace = {};
  
  /**
   * Renders a game board in the specified DOM element
   * @param {string} boardElementId - The ID of the DOM element to render the board in
   * @param {Object} gameboardObject - The gameboard object to render
   * @param {boolean} isEnemyBoard - Whether this is the enemy's board (to hide ships)
   * @param {number} boardSize - The size of the board (default: 10)
   */
  const renderBoard = (boardElementId, gameboardObject, isEnemyBoard, boardSize = 10) => {
    const boardElement = document.getElementById(boardElementId);
    
    // Clear the previous content
    boardElement.innerHTML = '';
    
    // Set the grid size based on the board size
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
    
    // Get the grid state from the gameboard
    const grid = gameboardObject.getGrid();
    const missedAttacks = gameboardObject.getMissedAttacks();
    
    // Create cells for the grid
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Determine the cell's state
        const cellData = grid[y] && grid[y][x] ? grid[y][x] : null;
        
        // Cell contains a ship
        if (cellData !== null && cellData.isShip) {
          // Only show ships on player's own board, not enemy's (unless hit)
          if (!isEnemyBoard) {
            cell.classList.add('ship');
          }
          
          // If ship has been hit at this location
          if (cellData.hits > 0) {
            cell.classList.add('hit');
            
            // Play hit sound
            playSound('hit');
            
            // If ship is sunk, add the sunk class
            if (cellData.isSunk) {
              cell.classList.add('sunk');
              playSound('sunk');
            }
          }
        }
        
        // Cell is a recorded miss
        if (missedAttacks.some(coords => coords[0] === x && coords[1] === y)) {
          cell.classList.add('miss');
          playSound('miss');
        }
        
        boardElement.appendChild(cell);
      }
    }
    
    // If this is the enemy board, add the 'enemy' class to the board
    if (isEnemyBoard) {
      boardElement.classList.add('enemy');
    } else {
      boardElement.classList.add('player');
    }
  };
  
  /**
   * Plays a sound effect
   * @param {string} soundName - The name of the sound to play
   */
  const playSound = (soundName) => {
    if (sounds[soundName]) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(e => {
        // Silent catch - audio may not be loaded or allowed
      });
    }
  };

  /**
   * Updates a single cell's appearance based on its status
   * @param {string} boardElementId - The ID of the board containing the cell
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} status - The new status ('hit', 'miss', 'sunk')
   */
  const updateCell = (boardElementId, x, y, status) => {
    const boardElement = document.getElementById(boardElementId);
    const cell = boardElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    
    if (!cell) return;
    
    // Remove existing status classes
    cell.classList.remove('hit', 'miss', 'sunk', 'ship');
    
    // Add the new status
    cell.classList.add(status);
    
    // Play appropriate sound
    playSound(status);
  };
  
  /**
   * Displays a message in the specified element
   * @param {string} message - The message to display
   * @param {string} messageElementId - The ID of the element to display the message in
   */
  const displayMessage = (message, messageElementId) => {
    const messageElement = document.getElementById(messageElementId);
    if (messageElement) {
      messageElement.textContent = message;
    }
  };
  
  /**
   * Highlights the active player's board
   * @param {boolean} isPlayerTurn - Whether it's the player's turn
   */
  const highlightAttacker = (isPlayerTurn) => {
    const playerBoardContainer = document.querySelector('.board-container:not(.enemy)');
    const computerBoardContainer = document.querySelector('.board-container.enemy');
    
    if (isPlayerTurn) {
      computerBoardContainer.classList.add('active');
      playerBoardContainer.classList.remove('active');
    } else {
      playerBoardContainer.classList.add('active');
      computerBoardContainer.classList.remove('active');
    }
  };
  
  /**
   * Adds event listeners to cells for attacks
   * @param {string} boardElementId - The ID of the board to add listeners to
   * @param {function} clickHandler - The function to call when a cell is clicked
   */
  const addCellListeners = (boardElementId, clickHandler) => {
    const boardElement = document.getElementById(boardElementId);
    const cells = boardElement.querySelectorAll('.cell');
    
    cells.forEach(cell => {
      // Remove any existing listeners to avoid duplicates
      const newCell = cell.cloneNode(true);
      cell.parentNode.replaceChild(newCell, cell);
      
      // Add the new listener
      newCell.addEventListener('click', clickHandler);
    });
  };
  
  /**
   * Removes event listeners from cells
   * @param {string} boardElementId - The ID of the board to remove listeners from
   */
  const removeCellListeners = (boardElementId) => {
    const boardElement = document.getElementById(boardElementId);
    const cells = boardElement.querySelectorAll('.cell');
    
    cells.forEach(cell => {
      const newCell = cell.cloneNode(true);
      cell.parentNode.replaceChild(newCell, cell);
    });
  };
  
  /**
   * Renders ship selection for placement phase
   * @param {Array} ships - Array of ship configurations
   */
  const renderShipSelection = (ships) => {
    const selectionContainer = document.getElementById('ship-selection-area');
    selectionContainer.innerHTML = '';
    
    // Reset ship tracking
    shipsToPlace = {};
    ships.forEach(ship => {
      shipsToPlace[ship.name.toLowerCase()] = { length: ship.length, placed: false };
    });
    
    // Create ship elements for selection
    ships.forEach(ship => {
      const shipElement = document.createElement('div');
      shipElement.classList.add('ship-item');
      shipElement.dataset.shipLength = ship.length;
      shipElement.dataset.shipName = ship.name.toLowerCase();
      shipElement.textContent = `${ship.name} (${ship.length})`;
      
      // Add click handler for selecting ships
      shipElement.addEventListener('click', (e) => {
        if (e.target.classList.contains('placed')) return;
        
        // Remove selected class from all ships
        selectionContainer.querySelectorAll('.ship-item').forEach(el => {
          el.classList.remove('selected');
        });
        
        // Add selected class to clicked ship
        e.target.classList.add('selected');
        
        // Set selected ship data
        selectedShipType = e.target.dataset.shipName;
        selectedShipLength = parseInt(e.target.dataset.shipLength);
        
        // Update status message
        displayMessage(`Placing ${selectedShipType} (length: ${selectedShipLength})...`, 'game-status');
      });
      
      selectionContainer.appendChild(shipElement);
    });
    
    // Set up rotation button
    const rotateButton = document.getElementById('rotate-ship');
    if (rotateButton) {
      rotateButton.addEventListener('click', () => {
        currentOrientation = currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        document.getElementById('orientation-display').textContent = currentOrientation.charAt(0).toUpperCase() + currentOrientation.slice(1);
      });
    }
  };
  
  /**
   * Handles ship placement hover preview
   * @param {string} boardElementId - Board element ID
   * @param {function} validationCallback - Callback to validate ship placement
   */
  const addPlacementHoverListeners = (boardElementId, validationCallback) => {
    const boardElement = document.getElementById(boardElementId);
    const cells = boardElement.querySelectorAll('.cell');
    
    // Clear any existing previews
    const clearPreviews = () => {
      cells.forEach(cell => {
        cell.classList.remove('placement-preview', 'invalid-placement');
      });
    };
    
    // Show placement preview on hover
    cells.forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        if (!selectedShipType) return;
        
        clearPreviews();
        
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        // Get all cells that would be occupied by the ship
        const shipCells = [];
        let isValid = true;
        
        for (let i = 0; i < selectedShipLength; i++) {
          let posX = x;
          let posY = y;
          
          if (currentOrientation === 'horizontal') {
            posX += i;
          } else {
            posY += i;
          }
          
          // Check if placement is valid using callback
          if (!validationCallback([posX, posY], currentOrientation, selectedShipLength)) {
            isValid = false;
          }
          
          const targetCell = boardElement.querySelector(`[data-x="${posX}"][data-y="${posY}"]`);
          if (targetCell) {
            shipCells.push(targetCell);
          } else {
            isValid = false;
          }
        }
        
        // Apply preview class to cells
        shipCells.forEach(cellElement => {
          cellElement.classList.add(isValid ? 'placement-preview' : 'invalid-placement');
        });
      });
      
      cell.addEventListener('mouseleave', clearPreviews);
    });
  };
  
  /**
   * Marks a ship as placed in the UI
   * @param {string} shipType - The type of ship that was placed
   */
  const markShipPlaced = (shipType) => {
    if (!shipsToPlace[shipType]) return;
    
    shipsToPlace[shipType].placed = true;
    
    // Update UI
    const shipElement = document.querySelector(`.ship-item[data-ship-name="${shipType}"]`);
    if (shipElement) {
      shipElement.classList.remove('selected');
      shipElement.classList.add('placed');
    }
    
    // Clear selection
    selectedShipType = null;
    selectedShipLength = 0;
    
    // Check if all ships are placed
    const allShipsPlaced = Object.values(shipsToPlace).every(ship => ship.placed);
    if (allShipsPlaced) {
      document.getElementById('start-game').disabled = false;
      displayMessage('All ships placed! Click "Start Game" to begin.', 'game-status');
    }
  };
  
  /**
   * Updates the scoreboard with current scores
   * @param {Object} scores - Object containing wins, losses, and win rate
   */
  const updateScoreboard = (scores) => {
    const winCount = document.querySelector('.win-count');
    const lossCount = document.querySelector('.loss-count');
    const winRate = document.querySelector('.win-rate');
    
    if (winCount) winCount.textContent = scores.wins;
    if (lossCount) lossCount.textContent = scores.losses;
    if (winRate) {
      const rate = scores.totalGames > 0 ? Math.round((scores.wins / scores.totalGames) * 100) : 0;
      winRate.textContent = `${rate}%`;
    }
  };
  
  /**
   * Updates game statistics display
   * @param {Object} stats - Object with turns, hits, misses, and accuracy
   */
  const displayGameStats = (stats) => {
    const turnCount = document.getElementById('turn-count');
    const hitCount = document.getElementById('hit-count');
    const missCount = document.getElementById('miss-count');
    const accuracy = document.getElementById('accuracy');
    
    if (turnCount) turnCount.textContent = stats.turns;
    if (hitCount) hitCount.textContent = stats.hits;
    if (missCount) missCount.textContent = stats.misses;
    if (accuracy) accuracy.textContent = `${Math.round(stats.accuracy)}%`;
  };
  
  return {
    renderBoard,
    updateCell,
    displayMessage,
    highlightAttacker,
    addCellListeners,
    removeCellListeners,
    renderShipSelection,
    addPlacementHoverListeners,
    markShipPlaced,
    updateScoreboard,
    displayGameStats,
    getSelectedShipInfo: () => ({ type: selectedShipType, length: selectedShipLength, orientation: currentOrientation }),
    resetShipSelection: () => {
      selectedShipType = null;
      selectedShipLength = 0;
      Object.keys(shipsToPlace).forEach(key => {
        shipsToPlace[key].placed = false;
      });
    }
  };
})();

export default domManager;
