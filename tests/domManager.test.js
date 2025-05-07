import domManager from '../src/dom/domManager.js';

describe('DOM Manager', () => {
  beforeEach(() => {
    // Set up the DOM environment for testing
    document.body.innerHTML = `
      <div id="test-board"></div>
      <div id="test-message"></div>
      <div class="board-container player"></div>
      <div class="board-container enemy"></div>
    `;
  });

  describe('renderBoard', () => {
    test('should render a 10x10 game board', () => {
      // Create mock gameboard object
      const mockGameboard = {
        getGrid: jest.fn().mockReturnValue(Array(10).fill(null).map(() => Array(10).fill(null))),
        getMissedAttacks: jest.fn().mockReturnValue([])
      };
      
      // Call the function
      domManager.renderBoard('test-board', mockGameboard, false);
      
      // Check if the board was rendered correctly
      const boardElement = document.getElementById('test-board');
      const cells = boardElement.querySelectorAll('.cell');
      
      expect(cells.length).toBe(100); // 10x10 grid
      expect(boardElement.classList.contains('player')).toBe(true);
    });
    
    test('should render ships on player board only', () => {
      // Create mock gameboard with a ship
      const mockGrid = Array(10).fill(null).map(() => Array(10).fill(null));
      mockGrid[0][0] = { isShip: true, isSunk: false, hits: 0 };
      
      const mockGameboard = {
        getGrid: jest.fn().mockReturnValue(mockGrid),
        getMissedAttacks: jest.fn().mockReturnValue([])
      };
      
      // Render player board
      domManager.renderBoard('test-board', mockGameboard, false);
      let cell = document.querySelector('[data-x="0"][data-y="0"]');
      expect(cell.classList.contains('ship')).toBe(true);
      
      // Reset the board
      document.getElementById('test-board').innerHTML = '';
      
      // Render enemy board
      domManager.renderBoard('test-board', mockGameboard, true);
      cell = document.querySelector('[data-x="0"][data-y="0"]');
      expect(cell.classList.contains('ship')).toBe(false);
    });
    
    test('should render hits and misses correctly', () => {
      // Create mock gameboard with a hit and a miss
      const mockGrid = Array(10).fill(null).map(() => Array(10).fill(null));
      mockGrid[0][0] = { isShip: true, isSunk: false, hits: 1 }; // Hit ship
      
      const mockGameboard = {
        getGrid: jest.fn().mockReturnValue(mockGrid),
        getMissedAttacks: jest.fn().mockReturnValue([[1, 1]]) // Missed attack
      };
      
      // Render board
      domManager.renderBoard('test-board', mockGameboard, false);
      
      // Check hit cell
      const hitCell = document.querySelector('[data-x="0"][data-y="0"]');
      expect(hitCell.classList.contains('hit')).toBe(true);
      
      // Check miss cell
      const missCell = document.querySelector('[data-x="1"][data-y="1"]');
      expect(missCell.classList.contains('miss')).toBe(true);
    });
  });
  
  describe('displayMessage', () => {
    test('should display a message in the specified element', () => {
      const message = 'Test message';
      domManager.displayMessage(message, 'test-message');
      
      const messageElement = document.getElementById('test-message');
      expect(messageElement.textContent).toBe(message);
    });
  });
  
  describe('highlightAttacker', () => {
    test('should highlight active player board', () => {
      domManager.highlightAttacker(true); // Player's turn
      
      const playerBoard = document.querySelector('.board-container.player');
      const enemyBoard = document.querySelector('.board-container.enemy');
      
      expect(enemyBoard.classList.contains('active')).toBe(true);
      expect(playerBoard.classList.contains('active')).toBe(false);
    });
    
    test('should highlight active computer board', () => {
      domManager.highlightAttacker(false); // Computer's turn
      
      const playerBoard = document.querySelector('.board-container.player');
      const enemyBoard = document.querySelector('.board-container.enemy');
      
      expect(playerBoard.classList.contains('active')).toBe(true);
      expect(enemyBoard.classList.contains('active')).toBe(false);
    });
  });
  
  describe('addCellListeners and removeCellListeners', () => {
    test('should add event listeners to cells', () => {
      // Set up a board with cells
      const boardElement = document.getElementById('test-board');
      for (let i = 0; i < 4; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.x = i % 2;
        cell.dataset.y = Math.floor(i / 2);
        boardElement.appendChild(cell);
      }
      
      // Mock click handler
      const mockClickHandler = jest.fn();
      
      // Add listeners
      domManager.addCellListeners('test-board', mockClickHandler);
      
      // Trigger a click
      document.querySelector('.cell').click();
      
      // Check if handler was called
      expect(mockClickHandler).toHaveBeenCalled();
    });
    
    test('should remove event listeners from cells', () => {
      // Set up a board with cells
      const boardElement = document.getElementById('test-board');
      for (let i = 0; i < 4; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.x = i % 2;
        cell.dataset.y = Math.floor(i / 2);
        boardElement.appendChild(cell);
      }
      
      // Mock click handler
      const mockClickHandler = jest.fn();
      
      // Add listeners
      domManager.addCellListeners('test-board', mockClickHandler);
      
      // Remove listeners
      domManager.removeCellListeners('test-board');
      
      // Store the click count
      const callCount = mockClickHandler.mock.calls.length;
      
      // Trigger a click (should not increase the call count)
      document.querySelector('.cell').click();
      
      // Check if handler was not called again
      expect(mockClickHandler.mock.calls.length).toBe(callCount);
    });
  });
});
