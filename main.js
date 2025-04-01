// Main Game Entry Point
import { getCanvas, getContext, getUIElements, towerTypes } from './constants.js';
import { gameState, initGame, update, startNextWave, placeTower, createParticles, updateUI } from './gameLogic.js';
import { draw } from './renderers.js';
import { getGridCoords } from './utils.js';
import Tower from './classes/Tower.js';
import Particle from './classes/Particle.js';

// Get required DOM elements
const canvas = getCanvas();
const ctx = getContext();
const { towerButtons, startWaveButton } = getUIElements();

// Game Loop
function gameLoop(timestamp) {
    if (!gameState.lastTime) gameState.lastTime = timestamp; // Initialize lastTime on first frame
    const deltaTime = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;

    // Skip update/draw if deltaTime is excessive (e.g., tab was inactive)
    if (deltaTime <= 0 || deltaTime > 200) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Update game state
    update(deltaTime);
    
    // Draw the game
    draw(
        ctx, 
        canvas, 
        gameState, 
        gameState.grid, 
        gameState.towers, 
        gameState.projectiles, 
        gameState.enemies, 
        gameState.particles, 
        gameState.placingTower, 
        gameState.selectedTowerType, 
        gameState.mouse,
        gameState.money
    );

    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Event Handlers
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    gameState.mouse.x = e.clientX - rect.left;
    gameState.mouse.y = e.clientY - rect.top;
    
    const gridCoords = getGridCoords(gameState.mouse.x, gameState.mouse.y);
    gameState.mouse.gridX = gridCoords.x;
    gameState.mouse.gridY = gridCoords.y;
}

function handleCanvasClick() {
    if (gameState.placingTower && gameState.selectedTowerType) {
        const gridX = gameState.mouse.gridX;
        const gridY = gameState.mouse.gridY;
        
        if (gridX < 0 || gridX >= gameState.grid[0].length || gridY < 0 || gridY >= gameState.grid.length) {
            return; // Click outside grid
        }

        const success = placeTower(gridX, gridY, gameState.selectedTowerType);
        
        if (!success) {
            // Visual feedback for failed placement
            if (gameState.money < towerTypes[gameState.selectedTowerType].cost) {
                console.log("Not enough money.");
            } else {
                console.log("Cannot place tower here (occupied or path).");
                createParticles(gameState.mouse.x, gameState.mouse.y, '#ff0000', 5, 2, 300, 3); // Red puffs
            }
        }
    }
}

function handleTowerButtonClick(e) {
    const type = e.target.dataset.type;
    
    // Toggle tower selection
    if (gameState.selectedTowerType === type) {
        gameState.selectedTowerType = null;
        gameState.placingTower = false;
    } else {
        gameState.selectedTowerType = type;
        gameState.placingTower = true;
    }
    
    updateUI();
}

// Initialize Event Listeners
function initEventListeners() {
    // Mouse movement
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Canvas click for tower placement
    canvas.addEventListener('click', handleCanvasClick);
    
    // Start wave button
    startWaveButton.addEventListener('click', startNextWave);
    
    // Tower selection buttons
    towerButtons.forEach(button => {
        button.addEventListener('click', handleTowerButtonClick);
    });
}

// Initialize and Start Game
function init() {
    initGame();
    initEventListeners();
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Start game when loaded
window.addEventListener('load', init); 