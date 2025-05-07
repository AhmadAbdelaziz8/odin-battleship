/**
 * DOM Manager Module
 * Handles all interactions with the DOM for the Battleship game
 * Functions include rendering boards, updating cells, and displaying messages
 */

const domManager = (() => {
  /**
   * Renders a game board in the specified DOM element
   * @param {string} boardElementId - The ID of the DOM element to render the board in
   * @param {Object} gameboardObject - The gameboard object to render
   * @param {boolean} isEnemyBoard - Whether this is the enemy's board (to hide ships)
   */
  const renderBoard = (boardElementId, gameboardObject, isEnemyBoard) => {
    const boardElement = document.getElementById(boardElementId);
    
    // Clear the previous content
    boardElement.innerHTML = '';
    
    // Get the grid state from the gameboard
    const grid = gameboardObject.getGrid();
    const missedAttacks = gameboardObject.getMissedAttacks();
    
    // Create cells for the 10x10 grid
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        // Determine the cell's state
        const cellData = grid[y][x];
        
        // Cell contains a ship
        if (cellData !== null && cellData.isShip) {
          // Only show ships on player's own board, not enemy's (unless hit)
          if (!isEnemyBoard) {
            cell.classList.add('ship');
          }
          
          // If ship has been hit at this location
          if (cellData.hits > 0) {
            cell.classList.add('hit');
            
            // If ship is sunk, add the sunk class
            if (cellData.isSunk) {
              cell.classList.add('sunk');
            }
          }
        }
        
        // Cell is a recorded miss
        if (missedAttacks.some(coords => coords[0] === x && coords[1] === y)) {
          cell.classList.add('miss');
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
    cell.classList.remove('hit', 'miss', 'sunk');
    
    // Add the new status
    cell.classList.add(status);
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
  
  return {
    renderBoard,
    updateCell,
    displayMessage,
    highlightAttacker,
    addCellListeners,
    removeCellListeners
  };
})();

export default domManager;
