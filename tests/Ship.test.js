import Ship from '../src/components/Ship.js';

describe('Ship', () => {
  let testShip;

  beforeEach(() => {
    testShip = Ship(3); // Create a ship of length 3 for testing
  });

  test('should create a ship with the correct length and 0 hits', () => {
    expect(testShip.getLength()).toBe(3);
    expect(testShip.getHits()).toBe(0);
  });

  test('hit() should increment the number of hits', () => {
    testShip.hit();
    expect(testShip.getHits()).toBe(1);
    testShip.hit();
    expect(testShip.getHits()).toBe(2);
  });

  test('isSunk() should return false for a new ship', () => {
    expect(testShip.isSunk()).toBe(false);
  });

  test('isSunk() should return false for a ship that is hit but not sunk', () => {
    testShip.hit();
    testShip.hit();
    expect(testShip.isSunk()).toBe(false);
  });

  test('isSunk() should return true when hits equal length', () => {
    testShip.hit();
    testShip.hit();
    testShip.hit();
    expect(testShip.isSunk()).toBe(true);
  });

  test('isSunk() should remain true even if hit more than length', () => {
    testShip.hit();
    testShip.hit();
    testShip.hit();
    testShip.hit(); // Extra hit
    expect(testShip.isSunk()).toBe(true);
    expect(testShip.getHits()).toBe(4); // Hits can exceed length
  });
  
  test('should throw error if length is not positive', () => {
    expect(() => Ship(0)).toThrow('Ship length must be positive');
    expect(() => Ship(-1)).toThrow('Ship length must be positive');
  });
});
