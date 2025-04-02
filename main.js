// Main Game Entry Point
import { getCanvas, getContext, getUIElements, towerTypes, getMenuCanvas, getMenuContext } from './constants.js';
import { 
    gameState, initGame, update, startNextWave, placeTower, 
    createParticles, updateUI, selectTower, upgradeTower, 
    sellTower, cancelSelection 
} from './gameLogic.js';
import { draw } from './renderers.js';
import { getGridCoords } from './utils.js';
import Tower from './classes/Tower.js';
import Particle from './classes/Particle.js';

// Get required DOM elements
const canvas = getCanvas();
const ctx = getContext();

// Tower Guide Modal Elements
const helpButton = document.getElementById('help-button');
const towerGuideModal = document.getElementById('tower-guide-modal');
const closeModalButton = document.querySelector('.close-modal');
const closeGuideButton = document.querySelector('.close-guide-button');
const inGameHelpButton = document.getElementById('in-game-help');

// Show tower guide modal
function showTowerGuide() {
    towerGuideModal.style.display = 'flex';
    // Add slight animation delay to make sure flex layout is applied first
    setTimeout(() => {
        towerGuideModal.style.opacity = '1';
    }, 10);
}

// Hide tower guide modal
function hideTowerGuide() {
    towerGuideModal.style.opacity = '0';
    setTimeout(() => {
        towerGuideModal.style.display = 'none';
    }, 300); // Match animation duration
}

// Add event listeners for tower guide
helpButton.addEventListener('click', showTowerGuide);
inGameHelpButton.addEventListener('click', showTowerGuide);
closeModalButton.addEventListener('click', hideTowerGuide);
closeGuideButton.addEventListener('click', hideTowerGuide);
towerGuideModal.addEventListener('click', (e) => {
    if (e.target === towerGuideModal) {
        hideTowerGuide();
    }
});

// Menu functions
function showMenu() {
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('game-container').style.display = 'none';
    
    // Ensure menu canvas is properly sized
    const menuCanvas = getMenuCanvas();
    if (menuCanvas) {
        menuCanvas.width = window.innerWidth;
        menuCanvas.height = window.innerHeight;
        initMenuParticles();
    }
}

function startGame(mapType) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    
    // Inicializace hry s vybranou mapou
    initGame(mapType);
    
    // Start game loop if it's not already running
    if (!gameState.lastTime) {
        gameState.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

// Vytvoření animovaných částic pro menu
function initMenuParticles() {
    const menuCanvas = getMenuCanvas();
    const menuCtx = getMenuContext();
    
    if (!menuCanvas || !menuCtx) return;
    
    const particles = [];
    const particleCount = 70;
    
    // Vytvoření částic
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * menuCanvas.width,
            y: Math.random() * menuCanvas.height,
            size: Math.random() * 4 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            color: Math.random() > 0.7 ? '#ffdf00' : '#f2e9e4' // Mix of gold and white particles
        });
    }
    
    // Funkce pro vykreslení částic
    function drawMenuParticles() {
        menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
        
        particles.forEach(p => {
            menuCtx.fillStyle = p.color === '#ffdf00' 
                ? `rgba(255, 223, 0, ${p.opacity})` 
                : `rgba(242, 233, 228, ${p.opacity})`;
            
            menuCtx.beginPath();
            menuCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            menuCtx.fill();
            
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Boundary check
            if (p.x < -10) p.x = menuCanvas.width + 10;
            if (p.x > menuCanvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = menuCanvas.height + 10;
            if (p.y > menuCanvas.height + 10) p.y = -10;
            
            // Slight random movement
            p.speedX += (Math.random() - 0.5) * 0.01;
            p.speedY += (Math.random() - 0.5) * 0.01;
            
            // Keep speed in check
            const maxSpeed = 0.7;
            if (Math.abs(p.speedX) > maxSpeed) p.speedX *= 0.9;
            if (Math.abs(p.speedY) > maxSpeed) p.speedY *= 0.9;
        });
        
        requestAnimationFrame(drawMenuParticles);
    }
    
    drawMenuParticles();
}

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
    
    // Draw the game - předáváme celý gameState, který obsahuje všechny potřebné informace
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
    
    // Získání vnitřních rozměrů canvasu
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Získání skutečných vykreslených rozměrů canvasu (z CSS)
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Přepočet souřadnic myši s ohledem na poměr mezi vnitřními rozměry canvasu (800x600) 
    // a jeho skutečnými vykreslenými rozměry, které se mohou lišit v kompaktním režimu (např. 800x550).
    // Toto je důležité pro správnou detekci kliknutí na věže a další interakce.
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    
    // Převod souřadnic myši s ohledem na poměr
    gameState.mouse.x = (e.clientX - rect.left) * scaleX;
    gameState.mouse.y = (e.clientY - rect.top) * scaleY;
    
    const gridCoords = getGridCoords(gameState.mouse.x, gameState.mouse.y);
    gameState.mouse.gridX = gridCoords.x;
    gameState.mouse.gridY = gridCoords.y;
}

function handleCanvasClick() {
    // Pokud je aktivní umisťování věže
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
    } else {
        // Zkontrolovat, zda uživatel klikl na věž
        checkTowerSelection();
    }
}

// Nová funkce pro kontrolu, zda uživatel klikl na věž
function checkTowerSelection() {
    // Nejprve vynulujeme výběr
    cancelSelection();
    
    // Zkontrolujeme, zda kliknutí bylo na některou věž
    const mouseX = gameState.mouse.x;
    const mouseY = gameState.mouse.y;
    const clickRadius = 20; // Poloměr pro detekci kliknutí
    
    for (const tower of gameState.towers) {
        const dx = mouseX - tower.x;
        const dy = mouseY - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= clickRadius) {
            // Nalezena věž, na kterou uživatel klikl
            selectTower(tower);
            break;
        }
    }
}

function handleTowerButtonClick(e) {
    // Získáme nejbližší rodičovské tlačítko, pro případ že uživatel klikl na ikonu, jméno nebo cenu
    const button = e.target.closest('.tower-button');
    if (!button) return; // Pokud nebyl nalezen žádný rodičovský prvek s třídou tower-button
    
    const type = button.dataset.type;
    
    // Zrušíme případný výběr věže
    cancelSelection();
    
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

// Nové handlery pro akce s věžemi
function handleUpgradeTowerClick() {
    upgradeTower();
    updateUI();
}

function handleSellTowerClick() {
    sellTower();
    // updateUI je voláno uvnitř sellTower
}

function handleCancelSelectionClick() {
    cancelSelection();
    updateUI();
}

// Initialize Event Listeners
function initEventListeners() {
    // Mouse movement
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Canvas click for tower placement and selection
    canvas.addEventListener('click', handleCanvasClick);
    
    // Right-click to cancel tower placement mode
    canvas.addEventListener('contextmenu', function(e) {
        // Prevent default context menu
        e.preventDefault();
        
        // Cancel tower placement if in that mode
        if (gameState.placingTower) {
            gameState.selectedTowerType = null;
            gameState.placingTower = false;
            updateUI();
        }
        
        return false;
    });
    
    // Start wave button
    const { startWaveButton } = getUIElements();
    startWaveButton.addEventListener('click', startNextWave);
    
    // Tower selection buttons
    const { towerButtons } = getUIElements();
    towerButtons.forEach(button => {
        button.addEventListener('click', handleTowerButtonClick);
    });
    
    // Nové event listenery pro akce s věžemi
    const { upgradeTowerButton, sellTowerButton, cancelSelectionButton } = getUIElements();
    upgradeTowerButton.addEventListener('click', handleUpgradeTowerClick);
    sellTowerButton.addEventListener('click', handleSellTowerClick);
    cancelSelectionButton.addEventListener('click', handleCancelSelectionClick);
    
    // Map selection buttons
    const { mapButtons } = getUIElements();
    mapButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mapType = this.dataset.map;
            startGame(mapType);
        });
    });
    
    // Retry buttons
    const { retryButtons } = getUIElements();
    retryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Skrytí game-over nebo victory obrazovky
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('victory').style.display = 'none';
            
            // Zobrazení menu
            showMenu();
        });
    });
    
    // Resize event for menu particles
    window.addEventListener('resize', function() {
        const menuCanvas = getMenuCanvas();
        if (menuCanvas && document.getElementById('main-menu').style.display !== 'none') {
            menuCanvas.width = window.innerWidth;
            menuCanvas.height = window.innerHeight;
        }
    });
}

// Initialize and Start Game
function init() {
    // Inicializovat gameState.currentPath pro správné vykreslení cesty v menu
    initGame('medium'); // Pre-inicializace se střední obtížností
    
    initEventListeners();
    showMenu();
}

// Start game when loaded
window.addEventListener('load', init); 