// Import game modules
import Game from '../src/game.js';
import Ship from '../src/ship.js';

// Game state
let game;
let currentOrientation = 'horizontal';
let selectedShipType = null;
let selectedShipLength = 0;
let shipsToPlace = {
    carrier: { length: 5, placed: false },
    battleship: { length: 4, placed: false },
    cruiser: { length: 3, placed: false },
    submarine: { length: 3, placed: false },
    destroyer: { length: 2, placed: false }
};
let gamePhase = 'placement'; // placement, playing, gameOver

// DOM elements
const playerBoardElement = document.getElementById('player-board');
const computerBoardElement = document.getElementById('computer-board');
const gameStatusElement = document.getElementById('game-status');
const startGameButton = document.getElementById('start-game');
const resetGameButton = document.getElementById('reset-game');
const shipSelectionElements = document.querySelectorAll('.ship-selection');
const orientationToggle = document.querySelectorAll('input[name="orientation"]');

// Initialize the game
function initGame() {
    game = Game();
    renderGameboard(playerBoardElement, game.gameboard1, true);
    renderGameboard(computerBoardElement, game.gameboard2, false);
    
    gamePhase = 'placement';
    gameStatusElement.textContent = 'Place your ships';
    startGameButton.disabled = true;
    
    // Reset ship placement
    Object.keys(shipsToPlace).forEach(ship => {
        shipsToPlace[ship].placed = false;
    });
    
    // Update ship selection UI
    shipSelectionElements.forEach(el => {
        el.classList.remove('selected', 'placed');
    });
    selectedShipType = null;
    selectedShipLength = 0;
}

// Render a gameboard
function renderGameboard(boardElement, gameboard, isPlayerBoard) {
    boardElement.innerHTML = '';
    
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // If it's player's board, add ship placement functionality
            if (isPlayerBoard) {
                cell.addEventListener('mouseover', handleCellHover);
                cell.addEventListener('mouseout', handleCellMouseout);
                cell.addEventListener('click', handlePlayerCellClick);
            } else if (gamePhase === 'playing') {
                // If it's computer's board and game is in playing phase, add attack functionality
                cell.addEventListener('click', handleComputerCellClick);
            }
            
            boardElement.appendChild(cell);
        }
    }
}

// Update board visualization based on game state
function updateBoardDisplay() {
    // Player board
    updateBoardCells(playerBoardElement, game.gameboard1);
    
    // Computer board (only show hits and misses, not ships)
    updateBoardCells(computerBoardElement, game.gameboard2, true);
}

function updateBoardCells(boardElement, gameboard, hideShips = false) {
    const cells = boardElement.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        const position = [x, y];
        
        const ship = gameboard.getShipAt(position);
        const missedAttacks = gameboard.getMissedAttacks();
        
        // Clear previous classes
        cell.classList.remove('ship', 'hit', 'miss');
        
        // Add ship class if there's a ship and we're not hiding ships
        if (ship && !hideShips) {
            cell.classList.add('ship');
        }
        
        // Add miss class if it's a missed attack
        if (missedAttacks.some(attack => attack[0] === x && attack[1] === y)) {
            cell.classList.add('miss');
        }
        
        // Add hit class if there's a ship and it's been hit
        if (ship && gameboard.receiveAttack.returnValue === true) {
            cell.classList.add('hit');
        }
    });
}

// Handle hovering over cells during ship placement
function handleCellHover(e) {
    if (gamePhase !== 'placement' || !selectedShipType) return;
    
    const cell = e.target;
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    // Highlight cells that would be occupied by the ship
    highlightShipPlacement(x, y, selectedShipLength, currentOrientation);
}

function handleCellMouseout() {
    if (gamePhase !== 'placement') return;
    
    // Remove all highlights
    const cells = playerBoardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('highlight', 'invalid-placement');
    });
}

// Highlight cells for ship placement
function highlightShipPlacement(startX, startY, length, orientation) {
    const cells = playerBoardElement.querySelectorAll('.cell');
    let validPlacement = true;
    
    // Get cells that would be occupied by the ship
    const shipCells = [];
    
    for (let i = 0; i < length; i++) {
        let x = startX;
        let y = startY;
        
        if (orientation === 'horizontal') {
            x += i;
        } else {
            y += i;
        }
        
        // Check if placement is valid
        if (x >= 10 || y >= 10) {
            validPlacement = false;
            break;
        }
        
        const cellElement = Array.from(cells).find(
            cell => parseInt(cell.dataset.x) === x && parseInt(cell.dataset.y) === y
        );
        
        if (cellElement && cellElement.classList.contains('ship')) {
            validPlacement = false;
        }
        
        shipCells.push(cellElement);
    }
    
    // Apply highlight class to cells
    shipCells.forEach(cell => {
        if (cell) {
            cell.classList.add(validPlacement ? 'highlight' : 'invalid-placement');
        }
    });
    
    return validPlacement;
}

// Handle clicking on player board cells (for ship placement)
function handlePlayerCellClick(e) {
    if (gamePhase !== 'placement' || !selectedShipType) return;
    
    const cell = e.target;
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    // Try to place ship
    try {
        const ship = Ship(selectedShipLength);
        game.placeShip(game.gameboard1, ship, [x, y], currentOrientation);
        
        // Mark ship as placed
        shipsToPlace[selectedShipType].placed = true;
        document.querySelector(`[data-ship="${selectedShipType}"]`).classList.add('placed');
        
        // Reset selection
        selectedShipType = null;
        selectedShipLength = 0;
        
        // Update board display
        updateBoardDisplay();
        
        // Check if all ships are placed
        const allShipsPlaced = Object.values(shipsToPlace).every(ship => ship.placed);
        if (allShipsPlaced) {
            startGameButton.disabled = false;
            gameStatusElement.textContent = 'All ships placed! Click "Start Game" to begin.';
        }
    } catch (error) {
        gameStatusElement.textContent = `Invalid placement: ${error.message}`;
        setTimeout(() => {
            gameStatusElement.textContent = 'Place your ships';
        }, 2000);
    }
}

// Handle clicking on computer board cells (for attacking)
function handleComputerCellClick(e) {
    if (gamePhase !== 'playing') return;
    
    const cell = e.target;
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    // Check if it's the player's turn
    if (game.getCurrentPlayer().getType() !== 'human') {
        gameStatusElement.textContent = "It's the computer's turn!";
        return;
    }
    
    // Try to attack
    try {
        const result = game.playTurn([x, y]);
        
        if (result === 'human wins!') {
            gamePhase = 'gameOver';
            gameStatusElement.textContent = 'You win! All enemy ships have been sunk.';
            return;
        }
        
        // Update board display
        updateBoardDisplay();
        
        // After player's turn, let the computer play
        setTimeout(() => {
            const computerResult = game.playTurn(); // No coords needed
            
            if (computerResult === 'computer wins!') {
                gamePhase = 'gameOver';
                gameStatusElement.textContent = 'Computer wins! All your ships have been sunk.';
                return;
            }
            
            updateBoardDisplay();
            
            // Update status for player's turn
            gameStatusElement.textContent = 'Your turn! Click on the enemy board to attack.';
        }, 1000);
        
    } catch (error) {
        gameStatusElement.textContent = `Invalid attack: ${error.message}`;
    }
}

// Select a ship for placement
function selectShip(e) {
    if (gamePhase !== 'placement') return;
    
    const shipElement = e.target;
    const shipType = shipElement.dataset.ship;
    
    // If ship is already placed, can't select it
    if (shipsToPlace[shipType].placed) return;
    
    // Remove selected class from all ships
    shipSelectionElements.forEach(el => el.classList.remove('selected'));
    
    // Add selected class to clicked ship
    shipElement.classList.add('selected');
    
    // Update selected ship
    selectedShipType = shipType;
    selectedShipLength = parseInt(shipElement.dataset.length);
    
    gameStatusElement.textContent = `Placing ${shipType} (length: ${selectedShipLength})...`;
}

// Change ship orientation
function changeOrientation(e) {
    currentOrientation = e.target.value;
}

// Start the game
function startGame() {
    gamePhase = 'playing';
    gameStatusElement.textContent = 'Game started! Your turn. Click on the enemy board to attack.';
    
    // Place computer ships randomly
    placeComputerShips();
    
    // Refresh board display
    updateBoardDisplay();
    
    // Update UI
    startGameButton.disabled = true;
    
    // Add attack functionality to computer board
    const computerCells = computerBoardElement.querySelectorAll('.cell');
    computerCells.forEach(cell => {
        cell.addEventListener('click', handleComputerCellClick);
    });
}

// Place computer ships randomly
function placeComputerShips() {
    const ships = [
        { name: 'carrier', length: 5 },
        { name: 'battleship', length: 4 },
        { name: 'cruiser', length: 3 },
        { name: 'submarine', length: 3 },
        { name: 'destroyer', length: 2 }
    ];
    
    ships.forEach(shipInfo => {
        let placed = false;
        
        while (!placed) {
            try {
                const x = Math.floor(Math.random() * 10);
                const y = Math.floor(Math.random() * 10);
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                const ship = Ship(shipInfo.length);
                
                game.placeShip(game.gameboard2, ship, [x, y], orientation);
                placed = true;
            } catch (error) {
                // If placement fails, try again
            }
        }
    });
}

// Reset the game
function resetGame() {
    initGame();
}

// Event listeners
shipSelectionElements.forEach(el => {
    el.addEventListener('click', selectShip);
});

orientationToggle.forEach(input => {
    input.addEventListener('change', changeOrientation);
});

startGameButton.addEventListener('click', startGame);
resetGameButton.addEventListener('click', resetGame);

// Initialize the game on load
document.addEventListener('DOMContentLoaded', initGame);
