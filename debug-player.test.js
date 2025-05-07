// Simplified test file to debug the player functionality

// Simple Player factory just for testing
const SimplePlayer = () => {
  const previousAttacks = new Set();
  
  const computerAttack = (board) => {
    // Simple deterministic algorithm that just goes through positions in order
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const key = `${x},${y}`;
        if (!previousAttacks.has(key)) {
          previousAttacks.add(key);
          return board.receiveAttack([x, y]);
        }
      }
    }
    return false;
  };
  
  return { computerAttack };
};

describe('Simple Player Test', () => {
  test('computer player should not attack the same spot twice', () => {
    const player = SimplePlayer();
    
    // Simple mock board
    const mockBoard = {
      receiveAttack: jest.fn().mockReturnValue(false)
    };
    
    // Make two attacks
    player.computerAttack(mockBoard);
    player.computerAttack(mockBoard);
    
    // Get the coordinates of both attacks
    const firstAttack = mockBoard.receiveAttack.mock.calls[0][0];
    const secondAttack = mockBoard.receiveAttack.mock.calls[1][0];
    
    // Log for debugging
    console.log('First attack:', firstAttack);
    console.log('Second attack:', secondAttack);
    
    // Check that board's receiveAttack was called twice
    expect(mockBoard.receiveAttack).toHaveBeenCalledTimes(2);
    
    // Check that the coordinates are different
    expect(firstAttack).not.toEqual(secondAttack);
  });
});
