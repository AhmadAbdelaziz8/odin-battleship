import Player from './player';
import Gameboard from './gameboard';

// Mock Gameboard for some tests to simplify and control behavior
jest.mock('./gameboard'); // Mocks the Gameboard module

describe('Player', () => {
  let humanPlayer;
  let computerPlayer;
  let enemyGameboard;

  beforeEach(() => {
    // Reset the mock before each test if necessary, or create new instances
    Gameboard.mockClear(); 
    // Create a fresh (mocked) gameboard instance for each test run if player initializes it
    // Or pass a shared mock instance if that suits the test scenario better.
    enemyGameboard = new Gameboard(); // This will be a mocked Gameboard instance

    humanPlayer = Player('human');
    computerPlayer = Player('computer');
  });

  test('should create a player with the correct type', () => {
    expect(humanPlayer.getType()).toBe('human');
    expect(computerPlayer.getType()).toBe('computer');
  });

  test('player should have their own gameboard', () => {
    // Player creates its own Gameboard internally.
    // We need to check if the Gameboard constructor was called by the Player factory.
    // This requires Player to instantiate Gameboard.
    // For this test, we can check if player.getGameboard() returns a Gameboard instance.
    // Since Gameboard is mocked, it will be a mock constructor.
    expect(humanPlayer.getGameboard).toBeDefined();
    const humanBoard = humanPlayer.getGameboard();
    expect(humanBoard).toBeInstanceOf(Gameboard); // Checks if it's an instance of the mocked Gameboard

    expect(computerPlayer.getGameboard).toBeDefined();
    const computerBoard = computerPlayer.getGameboard();
    expect(computerBoard).toBeInstanceOf(Gameboard); 
    expect(humanBoard).not.toBe(computerBoard); // Ensure they are different instances
  });

  describe('attack (for human player)', () => {
    test('should call receiveAttack on the enemyGameboard with correct coordinates', () => {
      const coords = [1, 2];
      humanPlayer.attack(enemyGameboard, coords);
      // enemyGameboard is a mock. We check if receiveAttack was called on it.
      expect(enemyGameboard.receiveAttack).toHaveBeenCalledTimes(1);
      expect(enemyGameboard.receiveAttack).toHaveBeenCalledWith(coords);
    });

    test('should return the result of enemyGameboard.receiveAttack', () => {
        enemyGameboard.receiveAttack.mockReturnValueOnce(true); // Simulate a hit
        expect(humanPlayer.attack(enemyGameboard, [0,0])).toBe(true);

        enemyGameboard.receiveAttack.mockReturnValueOnce(false); // Simulate a miss
        expect(humanPlayer.attack(enemyGameboard, [0,1])).toBe(false);
    });
  });

  describe('computerAttack', () => {
    let realEnemyBoard; // For testing actual board interactions

    beforeEach(() => {
        realEnemyBoard = jest.requireActual('./gameboard').default(); // Get a real Gameboard
        // Spy on realEnemyBoard.receiveAttack to check calls if needed, but not strictly necessary for all tests
    });

    test('should call receiveAttack on the enemyGameboard', () => {
      computerPlayer.computerAttack(enemyGameboard); // enemyGameboard is a mock
      expect(enemyGameboard.receiveAttack).toHaveBeenCalledTimes(1);
      // We can't easily check specific random coords here without more complex setup
    });

    test('should make a legal move (coordinates within 0-9)', () => {
      // To test this properly, we need to see the arguments to receiveAttack.
      // We'll spy on the mock enemyGameboard.receiveAttack
      computerPlayer.computerAttack(enemyGameboard);
      const calledCoords = enemyGameboard.receiveAttack.mock.calls[0][0]; // Get coords from first call
      expect(calledCoords[0]).toBeGreaterThanOrEqual(0);
      expect(calledCoords[0]).toBeLessThanOrEqual(9);
      expect(calledCoords[1]).toBeGreaterThanOrEqual(0);
      expect(calledCoords[1]).toBeLessThanOrEqual(9);
    });

    test('should not attack the same spot twice on the enemy board (eventually)', () => {
      // This test is more involved. We use a real board and many attacks.
      // All 100 spots should be attacked if it runs 100 times without repeating misses/hits on same spots.
      const uniqueAttacks = new Set();
      // Mock receiveAttack on the realEnemyBoard to record attacks without actual game logic for this specific test.
      // Or, let it run, and check its internal state (missedAttacks, ship hits)
      
      // For simplicity here, we'll trust the computer player to generate valid coords
      // and that it will *try* not to repeat. A perfect non-repeating strategy needs state.
      // The requirement: "Ensures it doesn't attack the same coordinate twice"
      // This implies the computer player needs to remember its attacks.

      // Let the computer player attack the realEnemyBoard (10x10 = 100 cells)
      // To avoid an infinite loop if the computer's logic is flawed, cap the attempts.
      const maxAttempts = 200; // More than 100 to allow for some randomness before all cells are hit
      let attempts = 0;
      
      // We need the computerPlayer to have its *own* memory of attacks against realEnemyBoard.
      // The Player factory will need to be designed to handle this.

      for (let i = 0; i < 100 && attempts < maxAttempts; i++) {
        // For this test, we make the computerAttack always return the coords for verification
        // This isn't how the real computerAttack would work, so this test setup is specific.
        // Instead, we'll rely on the fact that receiveAttack will be called on realEnemyBoard
        // and we can check the state of realEnemyBoard (e.g. missed attacks)
        computerPlayer.computerAttack(realEnemyBoard); 
        attempts++;
      }

      const missed = realEnemyBoard.getMissedAttacks();
      let hitSpots = 0;
      // This is a simplification: assumes no ships or all attacks miss for counting purposes
      // A more thorough test would place ships and count hits + misses.
      // For now, count unique missed attacks.
      // The current Gameboard implementation records *all* misses, even repeats on the same spot.
      // The test in Gameboard for receiveAttack: 
      // 'attacking a missed spot again should still be a miss' 
      // and it checks that getMissedAttacks() doesn't grow for repeat misses.
      // So, `realEnemyBoard.getMissedAttacks().length` should be 100 if all spots were missed once.

      // Let's track unique calls to realEnemyBoard.receiveAttack
      const attackedCoordinates = new Set();
      const originalReceiveAttack = realEnemyBoard.receiveAttack;
      const mockReceiveAttack = jest.fn((coords) => {
        attackedCoordinates.add(coords.toString());
        return originalReceiveAttack.call(realEnemyBoard, coords); // Call original
      });
      realEnemyBoard.receiveAttack = mockReceiveAttack;

      for (let i = 0; i < 100 && attempts < maxAttempts * 2; i++) { // Reset attempts, more room
        computerPlayer.computerAttack(realEnemyBoard);
        attempts++;
        if (attackedCoordinates.size === 100) break; // Stop if all cells hit
      }
      
      expect(attackedCoordinates.size).toBe(100); // All 100 unique cells should have been attacked

      // Restore original function if necessary (though Jest usually handles this for mocks in `jest.mock`)
      realEnemyBoard.receiveAttack = originalReceiveAttack;
    });

    test('computerAttack should return the result of enemyGameboard.receiveAttack', () => {
        enemyGameboard.receiveAttack.mockReturnValueOnce(true); // Simulate a hit
        expect(computerPlayer.computerAttack(enemyGameboard)).toBe(true);

        enemyGameboard.receiveAttack.mockReturnValueOnce(false); // Simulate a miss
        expect(computerPlayer.computerAttack(enemyGameboard)).toBe(false);
    });
  });
});
