# Battleship Game

## Overview

A modern, interactive implementation of the classic Battleship game built with JavaScript. This project follows a modular design pattern with clean separation of concerns, focusing on delivering a smooth user experience with an intelligent computer opponent.

## Features

- **Interactive Ship Placement**: Place ships manually with rotation options or use random placement
- **Multiple Difficulty Levels**: Easy, Medium, and Hard AI opponents with progressively more intelligent targeting strategies
- **Customizable Board Sizes**: Choose from 8×8, 10×10, or 12×12 grid sizes
- **Visual Feedback**: Animations for hits, misses, and sunk ships
- **Game Statistics**: Track hits, misses, accuracy, and win rate
- **Persistent Scoreboard**: Store and display win/loss statistics across game sessions

## Technologies Used

- **HTML5/CSS3**: Modern, responsive layout
- **JavaScript (ES6+)**: Object-oriented programming with the module pattern
- **Node.js**: Simple server for local development
- **Jest**: Unit testing framework

## Project Structure

```
├── public/               # Static assets and client-side code
│   ├── index.html       # Main HTML entry point
│   ├── style.css        # Game styling
│   └── main.js          # Client initialization
├── src/                 # Source code
│   ├── components/      # Core game components
│   │   ├── Ship.js      # Ship factory
│   │   ├── Gameboard.js # Game board logic
│   │   └── Player.js    # Player logic (human & computer)
│   ├── dom/             # DOM manipulation
│   │   └── domManager.js # DOM interaction module
│   └── game.js          # Main game controller
├── tests/               # Unit tests
└── server.js           # Simple development server
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/odin-battleship.git
   cd odin-battleship
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3002
   ```

## How to Play

1. **Setup Phase**:
   - Choose your board size and difficulty level
   - Place your ships on the board either manually or using random placement
   - Click "Start Game" when ready

2. **Battle Phase**:
   - Take turns with the computer opponent attacking each other's boards
   - Click on the enemy grid to attack a position
   - Hits are marked in red, misses in blue
   - First to sink all enemy ships wins!

## Computer AI Strategies

- **Easy**: Random attacks with no targeting strategy
- **Medium**: Uses hunt and target mode to find and sink ships
- **Hard**: Uses advanced parity strategy to optimize initial hits, plus enhanced targeting once a ship is found

## Testing

Run the test suite with:
```
npm test
```

Tests cover core game logic including ship creation, placement, hit detection, and game flow.



## Credits

- Created as part of [The Odin Project](https://www.theodinproject.com/) curriculum
- Developed with modern JavaScript following best practices for modularity and testing

## License

MIT