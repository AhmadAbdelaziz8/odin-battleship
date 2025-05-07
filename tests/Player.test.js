import Player from '../src/components/Player.js';
import Gameboard from '../src/components/Gameboard.js';

// Create a mock for Gameboard
jest.mock('../src/components/Gameboard.js', () => {
  return jest.fn().mockImplementation(() => ({
    receiveAttack: jest.fn().mockReturnValue(false),
    getMissedAttacks: jest.fn().mockReturnValue([]),
    allShipsSunk: jest.fn().mockReturnValue(false),
    getShipAt: jest.fn().mockReturnValue(null),
    getGrid: jest.fn().mockReturnValue(Array(10).fill(Array(10).fill(null)))
  }));
});

describe('Player', () => {
  let humanPlayer;
  let computerPlayer;
  let enemyGameboard;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock enemy gameboard
    enemyGameboard = {
      receiveAttack: jest.fn().mockReturnValue(false),
      getMissedAttacks: jest.fn().mockReturnValue([]),
    };

    // Create player instances
    humanPlayer = Player('human');
    computerPlayer = Player('computer');
  });

  test('should create a player with the correct type', () => {
    expect(humanPlayer.getType()).toBe('human');
    expect(computerPlayer.getType()).toBe('computer');
  });

  test('player should have their own gameboard', () => {
    expect(humanPlayer.getGameboard()).toBeDefined();
    expect(computerPlayer.getGameboard()).toBeDefined();
    
    // Check they're different instances
    expect(humanPlayer.getGameboard()).not.toBe(computerPlayer.getGameboard());
  });

  describe('attack', () => {
    test('human player attack should forward to the enemy gameboard', () => {
      const coords = [1, 2];
      humanPlayer.attack(enemyGameboard, coords);
      
      expect(enemyGameboard.receiveAttack).toHaveBeenCalledWith(coords);
      expect(enemyGameboard.receiveAttack).toHaveBeenCalledTimes(1);
    });
    
    test('human player attack should return the result from the enemy gameboard', () => {
      // Set up the mock to return true (hit)
      enemyGameboard.receiveAttack.mockReturnValueOnce(true);
      expect(humanPlayer.attack(enemyGameboard, [0, 0])).toBe(true);
    });
  });

  describe('computerAttack', () => {
    test('computer player should attack the enemy gameboard', () => {
      computerPlayer.computerAttack(enemyGameboard);
      expect(enemyGameboard.receiveAttack).toHaveBeenCalledTimes(1);
    });
    
    test('computer player should make a legal move (0-9 range)', () => {
      computerPlayer.computerAttack(enemyGameboard);
      const coords = enemyGameboard.receiveAttack.mock.calls[0][0];
      
      expect(coords[0]).toBeGreaterThanOrEqual(0);
      expect(coords[0]).toBeLessThanOrEqual(9);
      expect(coords[1]).toBeGreaterThanOrEqual(0);
      expect(coords[1]).toBeLessThanOrEqual(9);
    });
    
    test('computer player should not attack the same position twice', () => {
      // Create a fresh computer player
      const testComputer = Player('computer');
      
      // Let it attack twice
      testComputer.computerAttack(enemyGameboard);
      testComputer.computerAttack(enemyGameboard);
      
      // Get the first and second attack coordinates
      const firstAttack = enemyGameboard.receiveAttack.mock.calls[0][0];
      const secondAttack = enemyGameboard.receiveAttack.mock.calls[1][0];
      
      // Use deep equality comparison
      expect(firstAttack).not.toEqual(secondAttack);
    });
    
    test('computer attack should return the result from the enemy gameboard', () => {
      // Set up the mock to return true (hit)
      enemyGameboard.receiveAttack.mockReturnValueOnce(true);
      expect(computerPlayer.computerAttack(enemyGameboard)).toBe(true);
    });
  });
});
