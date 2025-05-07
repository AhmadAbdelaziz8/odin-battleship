// Factory function to create Ship objects
const Ship = (length) => {
  if (length <= 0) {
    throw new Error('Ship length must be positive');
  }
  let hitCount = 0;

  const getLength = () => length;
  const getHits = () => hitCount;

  const hit = () => {
    hitCount++;
  };

  const isSunk = () => {
    return hitCount >= length;
  };

  return {
    getLength,
    getHits,
    hit,
    isSunk,
  };
};

export default Ship;
