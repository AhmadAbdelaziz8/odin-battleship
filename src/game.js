// game.js - Main game orchestration module

import Player from './components/Player.js';
import Ship from './components/Ship.js';
import domManager from './dom/domManager.js';

const Game = (() => {
    // Game state variables
    let player1;
    let player2;
    let currentPlayer;
    let opponentPlayer;
    let opponentGameboard;
    let isGameOver = false;
    
    // DOM element IDs
    const PLAYER_BOARD_ID = 'player-board-grid';
    const COMPUTER_BOARD_ID = 'computer-board-grid';
    const STATUS_MESSAGE_ID = 'game-status';
    
    // Standard ship configurations
    const SHIP_CONFIGS = [
        { name: 'Carrier', length: 5 },
        { name: 'Battleship', length: 4 },
        { name: 'Cruiser', length: 3 },
        { name: 'Submarine', length: 3 },
        { name: 'Destroyer', length: 2 }
    ];
    
    // Initialize the game
    const initGame = () => {
        // Create players
        player1 = Player('human');
        player2 = Player('computer');
        
        // Set initial game state
        currentPlayer = player1;
        opponentPlayer = player2;
        opponentGameboard = player2.getGameboard();
        isGameOver = false;
        
        // Place ships on both boards (predefined placements for now)
        placeInitialShips();
        
        // Render boards
        domManager.renderBoard(PLAYER_BOARD_ID, player1.getGameboard(), false);
        domManager.renderBoard(COMPUTER_BOARD_ID, player2.getGameboard(), true);
        
        // Add event listeners for player attacks
        domManager.addCellListeners(COMPUTER_BOARD_ID, handleCellClick);
        
        // Display initial message
        domManager.displayMessage('Your turn! Click on the enemy board to attack.', STATUS_MESSAGE_ID);
        
        // Highlight active player's board
        domManager.highlightAttacker(true);
    };
    
    // Place initial ships on both gameboards
    const placeInitialShips = () => {
        // Place ships on player's board
        const playerPlacements = [
            { shipIndex: 0, coords: [0, 0], orientation: 'horizontal' },
            { shipIndex: 1, coords: [0, 2], orientation: 'horizontal' },
            { shipIndex: 2, coords: [0, 4], orientation: 'horizontal' },
            { shipIndex: 3, coords: [0, 6], orientation: 'horizontal' },
            { shipIndex: 4, coords: [0, 8], orientation: 'horizontal' }
        ];
        
        playerPlacements.forEach(placement => {
            const ship = Ship(SHIP_CONFIGS[placement.shipIndex].length);
            try {
                player1.getGameboard().placeShip(ship, placement.coords, placement.orientation);
            } catch (error) {
                console.error(`Error placing player ship: ${error.message}`);
            }
        });
        
        // Place ships on computer's board randomly
        placeComputerShips();
    };
    
    // Place computer ships randomly
    const placeComputerShips = () => {
        SHIP_CONFIGS.forEach(shipConfig => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                try {
                    const x = Math.floor(Math.random() * 10);
                    const y = Math.floor(Math.random() * 10);
                    const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                    const ship = Ship(shipConfig.length);
                    
                    player2.getGameboard().placeShip(ship, [x, y], orientation);
                    placed = true;
                } catch (error) {
                    // Try again if placement failed
                    attempts++;
                }
            }
            
            if (!placed) {
                console.error(`Failed to place ${shipConfig.name} on computer board after ${maxAttempts} attempts`);
            }
        });
    };
    
    // Handle player clicking on a cell
    const handleCellClick = (event) => {
        if (isGameOver || currentPlayer.getType() !== 'human') {
            return; // Not player's turn or game is over
        }
        
        const cell = event.target;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        
        // Check if this cell has already been attacked
        const missedAttacks = opponentGameboard.getMissedAttacks();
        const alreadyAttacked = missedAttacks.some(coords => coords[0] === x && coords[1] === y);
        
        if (alreadyAttacked) {
            domManager.displayMessage('You already attacked this position!', STATUS_MESSAGE_ID);
            return;
        }
        
        // Process player's attack
        processPlayerAttack([x, y]);
    };
    
    // Process player's attack
    const processPlayerAttack = (coords) => {
        // Execute attack
        const attackResult = currentPlayer.attack(opponentGameboard, coords);
        
        // Update UI based on result
        domManager.renderBoard(COMPUTER_BOARD_ID, opponentGameboard, true);
        
        // Check for game over
        if (opponentGameboard.allShipsSunk()) {
            gameOver('human');
            return;
        }
        
        // Update game status message
        domManager.displayMessage(attackResult ? 'Hit!' : 'Miss!', STATUS_MESSAGE_ID);
        
        // Switch turns
        switchTurn();
        
        // After a short delay, let the computer play
        setTimeout(playComputerTurn, 1000);
    };
    
    // Play computer's turn
    const playComputerTurn = () => {
        if (isGameOver || currentPlayer.getType() !== 'computer') {
            return; // Not computer's turn or game is over
        }
        
        // Update status message
        domManager.displayMessage('Computer is thinking...', STATUS_MESSAGE_ID);
        
        // Update UI to highlight active player
        domManager.highlightAttacker(false);
        
        // Execute computer's attack
        const attackResult = currentPlayer.computerAttack(opponentGameboard);
        
        // Get the coordinates of the last attack (for message)
        const missedAttacks = opponentGameboard.getMissedAttacks();
        const lastAttackCoords = missedAttacks.length > 0 ? 
            missedAttacks[missedAttacks.length - 1] : [0, 0]; // Fallback if no missed attacks
        
        // Update UI based on result
        domManager.renderBoard(PLAYER_BOARD_ID, opponentGameboard, false);
        
        // Check for game over
        if (opponentGameboard.allShipsSunk()) {
            gameOver('computer');
            return;
        }
        
        // Create result message
        const resultMessage = attackResult ? 
            `Computer hit a ship at [${lastAttackCoords[0]}, ${lastAttackCoords[1]}]!` : 
            `Computer missed at [${lastAttackCoords[0]}, ${lastAttackCoords[1]}].`;
        
        // Update game status message
        domManager.displayMessage(resultMessage + ' Your turn!', STATUS_MESSAGE_ID);
        
        // Switch turns back to player
        switchTurn();
        
        // Update UI to highlight active player
        domManager.highlightAttacker(true);
    };
    
    // Handle game over state
    const gameOver = (winner) => {
        isGameOver = true;
        
        // Update message
        const message = winner === 'human' ? 
            'Game Over! You win! All enemy ships have been sunk.' : 
            'Game Over! Computer wins! All your ships have been sunk.';
        
        domManager.displayMessage(message, STATUS_MESSAGE_ID);
        
        // Remove event listeners to prevent further attacks
        domManager.removeCellListeners(COMPUTER_BOARD_ID);
        
        // Show all computer ships
        domManager.renderBoard(COMPUTER_BOARD_ID, player2.getGameboard(), false);
    };
    
    // Switch turn between players
    const switchTurn = () => {
        if (currentPlayer === player1) {
            currentPlayer = player2;
            opponentPlayer = player1;
            opponentGameboard = player1.getGameboard();
        } else {
            currentPlayer = player1;
            opponentPlayer = player2;
            opponentGameboard = player2.getGameboard();
        }
    };

    return {
        initGame,
        // Expose some methods and properties for testing or external access
        getCurrentPlayer: () => currentPlayer,
        getPlayer1: () => player1,
        getPlayer2: () => player2,
    };
})();

export default Game;
