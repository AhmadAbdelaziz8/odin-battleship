import Game from '../src/game.js';
import Player from '../src/components/Player.js';
import Ship from '../src/components/Ship.js';
import domManager from '../src/dom/domManager.js';

// Mock the imported modules
jest.mock('../src/components/Player.js');
jest.mock('../src/components/Ship.js');
jest.mock('../src/dom/domManager.js');

describe('Game Module', () => {
  let mockPlayer1;
  let mockPlayer2;
  let mockGameboard1;
  let mockGameboard2;
  
  beforeEach(() => {
    // Set up DOM elements that would normally be created in HTML
    document.body.innerHTML = `
      <div id="game-status"></div>
      <div id="player-board-grid"></div>
      <div id="computer-board-grid"></div>
    `;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock gameboards
    mockGameboard1 = {
      placeShip: jest.fn(),
      receiveAttack: jest.fn(),
      getMissedAttacks: jest.fn().mockReturnValue([]),
      allShipsSunk: jest.fn().mockReturnValue(false),
      getShipAt: jest.fn(),
      getGrid: jest.fn().mockReturnValue(Array(10).fill(null).map(() => Array(10).fill(null)))
    };
    
    mockGameboard2 = {
      placeShip: jest.fn(),
      receiveAttack: jest.fn(),
      getMissedAttacks: jest.fn().mockReturnValue([]),
      allShipsSunk: jest.fn().mockReturnValue(false),
      getShipAt: jest.fn(),
      getGrid: jest.fn().mockReturnValue(Array(10).fill(null).map(() => Array(10).fill(null)))
    };
    
    // Mock players
    mockPlayer1 = {
      getType: jest.fn().mockReturnValue('human'),
      getGameboard: jest.fn().mockReturnValue(mockGameboard1),
      attack: jest.fn(),
      computerAttack: jest.fn()
    };
    
    mockPlayer2 = {
      getType: jest.fn().mockReturnValue('computer'),
      getGameboard: jest.fn().mockReturnValue(mockGameboard2),
      attack: jest.fn(),
      computerAttack: jest.fn()
    };
    
    // Set up Player mock
    Player.mockImplementation((type) => {
      if (type === 'human') return mockPlayer1;
      return mockPlayer2;
    });
    
    // Set up Ship mock
    Ship.mockImplementation((length) => ({
      getLength: jest.fn().mockReturnValue(length),
      getHits: jest.fn().mockReturnValue(0),
      hit: jest.fn(),
      isSunk: jest.fn().mockReturnValue(false)
    }));
    
    // Set up domManager mock
    domManager.renderBoard = jest.fn();
    domManager.updateCell = jest.fn();
    domManager.displayMessage = jest.fn();
    domManager.highlightAttacker = jest.fn();
    domManager.addCellListeners = jest.fn();
    domManager.removeCellListeners = jest.fn();
  });
  
  test('initGame should set up the game correctly', () => {
    // Call the game initialization
    Game.initGame();
    
    // Check if players were created
    expect(Player).toHaveBeenCalledWith('human');
    expect(Player).toHaveBeenCalledWith('computer');
    
    // Check if boards were rendered
    expect(domManager.renderBoard).toHaveBeenCalledWith('player-board-grid', mockGameboard1, false);
    expect(domManager.renderBoard).toHaveBeenCalledWith('computer-board-grid', mockGameboard2, true);
    
    // Check if cell listeners were added to the computer board
    expect(domManager.addCellListeners).toHaveBeenCalledWith('computer-board-grid', expect.any(Function));
    
    // Check if initial message was displayed
    expect(domManager.displayMessage).toHaveBeenCalledWith(
      expect.stringContaining('Your turn'), 
      'game-status'
    );
    
    // Check if active player is highlighted
    expect(domManager.highlightAttacker).toHaveBeenCalledWith(true);
  });
  
  test('Game should expose necessary methods for external access', () => {
    // Check if the Game module exposes the required methods
    expect(Game.initGame).toBeDefined();
    expect(Game.getCurrentPlayer).toBeDefined();
    expect(Game.getPlayer1).toBeDefined();
    expect(Game.getPlayer2).toBeDefined();
  });
  
  // Note: Testing game flow like player turns and game over conditions
  // would be complex with the current module structure since it uses many
  // private functions and setTimeout, which would require additional
  // testing setup like jest.useFakeTimers() and triggering click events.
  // We can add more detailed tests as needed.
});
