import Gameboard from '../src/components/Gameboard.js';
import Ship from '../src/components/Ship.js';

describe('Gameboard', () => {
  let gameboard;
  let ship1;
  let ship2;

  beforeEach(() => {
    gameboard = Gameboard();
    ship1 = Ship(3); // Length 3
    ship2 = Ship(2); // Length 2
  });

  describe('placeShip', () => {
    test('should place a ship horizontally at specified coordinates', () => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal');
      expect(gameboard.getShipAt([0, 0])).toBe(ship1);
      expect(gameboard.getShipAt([1, 0])).toBe(ship1);
      expect(gameboard.getShipAt([2, 0])).toBe(ship1);
      expect(gameboard.getShipAt([3, 0])).toBeNull(); // Off the end of ship1
      expect(gameboard.getShipAt([0, 1])).toBeNull(); // Different row
    });

    test('should place a ship vertically at specified coordinates', () => {
      gameboard.placeShip(ship2, [5, 5], 'vertical');
      expect(gameboard.getShipAt([5, 5])).toBe(ship2);
      expect(gameboard.getShipAt([5, 6])).toBe(ship2);
      expect(gameboard.getShipAt([5, 7])).toBeNull(); // Off the end of ship2
      expect(gameboard.getShipAt([6, 5])).toBeNull(); // Different column
    });

    test('should throw error when ship placement is out of bounds', () => {
      expect(() => {
        gameboard.placeShip(ship1, [8, 0], 'horizontal');
      }).toThrow('Ship placement (horizontal) is out of bounds.');
      
      expect(() => {
        gameboard.placeShip(ship1, [0, 8], 'vertical');
      }).toThrow('Ship placement (vertical) is out of bounds.');
    });

    test('should throw error when ship placement overlaps another ship', () => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal');
      expect(() => {
        gameboard.placeShip(ship2, [1, 0], 'vertical');
      }).toThrow('Ship placement overlaps another ship.');
    });

    test('should throw error for invalid orientation', () => {
      expect(() => {
        gameboard.placeShip(ship1, [0, 0], 'diagonal');
      }).toThrow('Invalid ship orientation.');
    });
  });

  describe('receiveAttack', () => {
    beforeEach(() => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal'); // Ship at [0,0], [1,0], [2,0]
      gameboard.placeShip(ship2, [5, 5], 'vertical');   // Ship at [5,5], [5,6]
    });

    test('attacking an empty coordinate should record a miss and return false', () => {
      expect(gameboard.receiveAttack([3, 3])).toBe(false);
      expect(gameboard.getMissedAttacks()).toContainEqual([3, 3]);
      expect(ship1.getHits()).toBe(0);
      expect(ship2.getHits()).toBe(0);
    });

    test('attacking a coordinate with a ship should call hit() on the ship and return true', () => {
      expect(gameboard.receiveAttack([0, 0])).toBe(true); // Hit ship1
      expect(ship1.getHits()).toBe(1);
      expect(gameboard.getMissedAttacks()).not.toContainEqual([0, 0]);

      expect(gameboard.receiveAttack([5, 6])).toBe(true); // Hit ship2
      expect(ship2.getHits()).toBe(1);
      expect(gameboard.getMissedAttacks()).not.toContainEqual([5, 6]);
    });

    test('attacking the same ship multiple times should register multiple hits', () => {
      gameboard.receiveAttack([0, 0]); // Hit ship1
      gameboard.receiveAttack([1, 0]); // Hit ship1 again
      expect(ship1.getHits()).toBe(2);
    });

    test('attacking a missed spot again should still be a miss', () => {
      gameboard.receiveAttack([3,3]); // First miss
      expect(gameboard.receiveAttack([3,3])).toBe(false); // Second miss at same spot
      
      // Ensure it's only recorded once in the missedAttacks array
      const missedAttacks = gameboard.getMissedAttacks();
      const matchingMisses = missedAttacks.filter(miss => miss[0] === 3 && miss[1] === 3);
      expect(matchingMisses.length).toBe(1);
    });
  });

  describe('allShipsSunk', () => {
    test('should return true if there are no ships on the board', () => {
      const emptyBoard = Gameboard();
      expect(emptyBoard.allShipsSunk()).toBe(true);
    });

    test('should return false if ships are present and none are sunk', () => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal');
      gameboard.placeShip(ship2, [5, 5], 'vertical');
      expect(gameboard.allShipsSunk()).toBe(false);
    });

    test('should return false if some ships are sunk but not all', () => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal'); // Length 3
      gameboard.placeShip(ship2, [5, 5], 'vertical');   // Length 2

      // Sink ship2
      gameboard.receiveAttack([5, 5]);
      gameboard.receiveAttack([5, 6]);
      expect(ship2.isSunk()).toBe(true);
      expect(gameboard.allShipsSunk()).toBe(false);
    });

    test('should return true when all ships on the board are sunk', () => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal');
      gameboard.placeShip(ship2, [5, 5], 'vertical');

      // Sink ship1
      gameboard.receiveAttack([0, 0]);
      gameboard.receiveAttack([1, 0]);
      gameboard.receiveAttack([2, 0]);
      expect(ship1.isSunk()).toBe(true);

      // Sink ship2
      gameboard.receiveAttack([5, 5]);
      gameboard.receiveAttack([5, 6]);
      expect(ship2.isSunk()).toBe(true);

      expect(gameboard.allShipsSunk()).toBe(true);
    });
  });

  describe('getGrid', () => {
    test('should return a grid representation for rendering', () => {
      gameboard.placeShip(ship1, [0, 0], 'horizontal');
      
      const grid = gameboard.getGrid();
      
      // Check dimensions
      expect(grid.length).toBe(10);
      expect(grid[0].length).toBe(10);
      
      // Check ship positions
      expect(grid[0][0]).not.toBeNull();
      expect(grid[0][0].isShip).toBe(true);
      expect(grid[0][1]).not.toBeNull();
      expect(grid[0][1].isShip).toBe(true);
      expect(grid[0][2]).not.toBeNull();
      expect(grid[0][2].isShip).toBe(true);
      
      // Check empty position
      expect(grid[0][3]).toBeNull();
    });
  });
});
