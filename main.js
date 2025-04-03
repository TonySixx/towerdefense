// Main Game Entry Point
import { getCanvas, getContext, getUIElements, towerTypes, getMenuCanvas, getMenuContext } from './constants.js';
import { 
    gameState, initGame, update, startNextWave, placeTower, 
    createParticles, updateUI, selectTower, upgradeTower, 
    sellTower, cancelSelection 
} from './gameLogic.js';
import { draw } from './renderers.js';
import { getGridCoords, createGrid, markPathOnGrid } from './utils.js';
import Tower from './classes/Tower.js';
import Particle from './classes/Particle.js';
import { 
    initEditor, 
    handleEditorMouseDown, 
    handleEditorMouseMove, 
    handleEditorMouseUp, 
    exitEditor,
    editorState,
    renderEditor,
    validatePath,
    saveMap,
    getCustomMaps,
    deleteMap,
    orderPathFromStartToEnd,
    updateValidationMessage
} from './mapEditor.js';

// Get required DOM elements
const canvas = getCanvas();
const ctx = getContext();

// Tower Guide Modal Elements
const helpButton = document.getElementById('help-button');
const towerGuideModal = document.getElementById('tower-guide-modal');
const closeModalButton = document.querySelector('.close-modal');
const closeGuideButton = document.querySelector('.close-guide-button');
const inGameHelpButton = document.getElementById('in-game-help');

// Custom Maps Modal Elements
const openCustomMapsButton = document.getElementById('open-custom-maps-btn');
const customMapsModal = document.getElementById('custom-maps-modal');
const customMapsCloseButton = document.querySelector('.custom-maps-close');
const closeMapsButton = document.querySelector('.close-maps-button');
const mapSearchInput = document.getElementById('map-search');
const customMapsList = document.getElementById('custom-maps-list');
const noMapsMessage = document.getElementById('no-maps-message');
const noSearchResultsMessage = document.getElementById('no-search-results');
const createMapModalButton = document.getElementById('create-map-modal-btn');

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

// Show custom maps modal
function showCustomMapsModal() {
    customMapsModal.style.display = 'flex';
    // Add slight animation delay to make sure flex layout is applied first
    setTimeout(() => {
        customMapsModal.style.opacity = '1';
    }, 10);
    
    // Clear search input
    mapSearchInput.value = '';
    
    // Load custom maps into the modal
    loadCustomMapsIntoModal();
}

// Hide custom maps modal
function hideCustomMapsModal() {
    customMapsModal.style.opacity = '0';
    setTimeout(() => {
        customMapsModal.style.display = 'none';
    }, 300); // Match animation duration
}

// Load custom maps into the modal
function loadCustomMapsIntoModal(searchTerm = '') {
    const customMaps = getCustomMaps();
    const mapsList = document.getElementById('custom-maps-list');
    
    // Clear existing custom maps
    mapsList.innerHTML = '';
    
    // Filter custom maps based on search term if provided
    const filteredMaps = searchTerm 
        ? Object.entries(customMaps).filter(([name]) => 
            name.toLowerCase().includes(searchTerm.toLowerCase()))
        : Object.entries(customMaps);
    
    // Show appropriate messages if no maps or no search results
    if (Object.keys(customMaps).length === 0) {
        noMapsMessage.style.display = 'block';
        noSearchResultsMessage.style.display = 'none';
    } else if (filteredMaps.length === 0 && searchTerm) {
        noMapsMessage.style.display = 'none';
        noSearchResultsMessage.style.display = 'block';
    } else {
        noMapsMessage.style.display = 'none';
        noSearchResultsMessage.style.display = 'none';
    }
    
    // Add filtered custom maps to the modal
    for (const [mapName, map] of filteredMaps) {
        const mapItem = document.createElement('div');
        mapItem.className = 'custom-map-item';
        
        const mapInfo = document.createElement('div');
        mapInfo.className = 'custom-map-info';
        mapInfo.addEventListener('click', () => {
            startGameWithCustomMap(mapName);
            hideCustomMapsModal();
        });
        
        const mapNameElem = document.createElement('div');
        mapNameElem.className = 'custom-map-name';
        mapNameElem.textContent = mapName;
        
        const mapDescription = document.createElement('div');
        mapDescription.className = 'custom-map-description';
        mapDescription.textContent = 'Custom Map';
        
        mapInfo.appendChild(mapNameElem);
        mapInfo.appendChild(mapDescription);
        
        const mapActions = document.createElement('div');
        mapActions.className = 'custom-map-actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'map-action-btn map-edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = "Edit map";
        editBtn.addEventListener('click', (e) => {
            editCustomMap(mapName);
            hideCustomMapsModal();
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'map-action-btn map-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = "Delete map";
        deleteBtn.addEventListener('click', (e) => {
            if (confirm(`Are you sure you want to delete the map "${mapName}"?`)) {
                deleteMap(mapName);
                // Update main menu button visibility
                loadCustomMaps();
                // Reload maps in modal with current search term
                loadCustomMapsIntoModal(searchTerm);
            }
        });
        
        mapActions.appendChild(editBtn);
        mapActions.appendChild(deleteBtn);
        
        mapItem.appendChild(mapInfo);
        mapItem.appendChild(mapActions);
        
        mapsList.appendChild(mapItem);
    }
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

// Add event listeners for custom maps modal
openCustomMapsButton.addEventListener('click', showCustomMapsModal);
customMapsCloseButton.addEventListener('click', hideCustomMapsModal);
closeMapsButton.addEventListener('click', hideCustomMapsModal);
customMapsModal.addEventListener('click', (e) => {
    if (e.target === customMapsModal) {
        hideCustomMapsModal();
    }
});

// Create map button in modal
createMapModalButton.addEventListener('click', () => {
    initEditor();
    hideCustomMapsModal();
});

// Search functionality
mapSearchInput.addEventListener('input', (e) => {
    loadCustomMapsIntoModal(e.target.value);
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

// Handle keyboard shortcuts
function handleKeyDown(e) {
    // Kontrola, zda jsme v herním režimu (ne v menu nebo editoru map)
    if (document.getElementById('game-container').style.display === 'none') {
        return;
    }
    
    // Ignoruj klávesové zkratky, když uživatel píše do inputu
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Ignoruj klávesové zkratky, když je otevřené modální okno
    if (document.getElementById('tower-guide-modal').style.display !== 'none' ||
        document.getElementById('custom-maps-modal').style.display !== 'none' ||
        document.getElementById('game-over').style.display !== 'none' ||
        document.getElementById('victory').style.display !== 'none') {
        return;
    }
    
    // Ignoruj klávesové zkratky, když je hra ve stavu game_over nebo victory
    if (gameState.state === 'game_over' || gameState.state === 'victory') {
        return;
    }
    
    const { towerButtons, upgradeTowerButton, startWaveButton } = getUIElements();
    
    // Získání číselné hodnoty z klávesy (funguje pro různé klávesnice)
    let numKey = null;
    
    // Zpracování standardních číslic
    if (e.key >= '1' && e.key <= '6') {
        numKey = parseInt(e.key);
    } 
    // Zpracování kláves s kódy, které odpovídají číslicím
    else if (e.code) {
        // Digit1 až Digit6 pro standardní numerické klávesy
        if (e.code.startsWith('Digit') && e.code.length === 6) {
            const digitChar = e.code.charAt(5);
            if (digitChar >= '1' && digitChar <= '6') {
                numKey = parseInt(digitChar);
            }
        }
        // Numpad1 až Numpad6 pro numerickou klávesnici
        else if (e.code.startsWith('Numpad') && e.code.length === 7) {
            const digitChar = e.code.charAt(6);
            if (digitChar >= '1' && digitChar <= '6') {
                numKey = parseInt(digitChar);
            }
        }
    }
    
    switch (e.key) {
        // Klávesa U pro upgrade věže
        case 'u':
        case 'U':
            if (gameState.selectedTower && !upgradeTowerButton.disabled) {
                handleUpgradeTowerClick();
            }
            break;
        
        // Klávesa S pro prodej věže
        case 's':
        case 'S':
            if (gameState.selectedTower) {
                handleSellTowerClick();
            }
            break;
        
        // Klávesa Esc pro zrušení výběru
        case 'Escape':
            if (gameState.selectedTower || gameState.placingTower) {
                handleCancelSelectionClick();
            }
            break;
            
        // Mezerník pro spuštění další vlny
        case ' ':
            if (!startWaveButton.disabled) {
                startNextWave();
            }
            break;
    }
    
    // Zpracování číselných kláves pro výběr typů věží (odděleno od switch pro podporu více klávesnic)
    if (numKey !== null) {
        const index = numKey - 1;
        // Kontrola, zda existuje tlačítko s tímto indexem
        if (index >= 0 && index < towerButtons.length) {
            const button = towerButtons[index];
            // Simulace kliknutí na tlačítko věže pouze pokud není deaktivované
            if (!button.disabled) {
                button.click();
            }
        }
    }
}

// Initialize Event Listeners
function initEventListeners() {
    // Mouse movement
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Canvas click for tower placement and selection
    canvas.addEventListener('click', handleCanvasClick);
    
    // Keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);
    
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
    
    // Initialize map editor
    initMapEditor();
    
    // Load custom maps on startup
    loadCustomMaps();
}

// Start game when loaded
window.addEventListener('load', init);

// Initialize Map Editor
function initMapEditor() {
    // Map editor button in main menu
    const createMapBtn = document.getElementById('create-map-btn');
    createMapBtn.addEventListener('click', () => {
        initEditor();
    });
    
    // Editor canvas event listeners
    const editorCanvas = document.getElementById('editorCanvas');
    editorCanvas.addEventListener('mousedown', handleEditorMouseDown);
    editorCanvas.addEventListener('mousemove', handleEditorMouseMove);
    editorCanvas.addEventListener('mouseup', handleEditorMouseUp);
    document.addEventListener('mouseup', handleEditorMouseUp); // Handle mouse up outside canvas
    
    // Editor tool buttons
    document.getElementById('path-mode-btn').addEventListener('click', () => {
        setEditorMode('path');
    });
    document.getElementById('start-mode-btn').addEventListener('click', () => {
        setEditorMode('start');
    });
    document.getElementById('end-mode-btn').addEventListener('click', () => {
        setEditorMode('end');
    });
    document.getElementById('erase-mode-btn').addEventListener('click', () => {
        setEditorMode('erase');
    });
    document.getElementById('clear-btn').addEventListener('click', () => {
        clearEditor();
    });
    
    // Save and exit buttons
    document.getElementById('save-map-btn').addEventListener('click', () => {
        saveCurrentMap();
    });
    document.getElementById('exit-editor-btn').addEventListener('click', () => {
        exitEditor();
    });
}

// Set editor mode and update UI
function setEditorMode(mode) {
    editorState.editMode = mode;
    
    // Update button styling
    const buttons = document.querySelectorAll('.editor-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`${mode}-mode-btn`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Clear the editor
function clearEditor() {
    editorState.path = [];
    editorState.startPoint = null;
    editorState.endPoint = null;
    editorState.grid = createGrid();
    editorState.validationMessage = '';
    editorState.isValid = false;
    renderEditor();
    updateValidationMessage();
}

// Save current map
function saveCurrentMap() {
    const mapNameInput = document.getElementById('map-name');
    const mapName = mapNameInput.value.trim();
    
    if (!mapName) {
        alert('Please enter a map name');
        return;
    }
    
    if (!validatePath()) {
        alert('Map is not valid. ' + editorState.validationMessage);
        return;
    }
    
    const difficultySelect = document.getElementById('difficulty-select');
    const difficulty = difficultySelect.value;
    
    // Set difficulty modifiers based on selected option
    let startMoney = 100;
    let startHealth = 20;
    let enemyHealthModifier = 1.0;
    let waveModifier = 1.0;
    
    switch (difficulty) {
        case 'easy':
            startMoney = 150;
            startHealth = 25;
            enemyHealthModifier = 0.8;
            waveModifier = 0.9;
            break;
        case 'hard':
            startMoney = 90;
            startHealth = 15;
            enemyHealthModifier = 1.2;
            waveModifier = 1.1;
            break;
    }
    
    // Create map object
    const map = {
        name: mapName,
        path: orderPathFromStartToEnd(),
        startMoney,
        startHealth,
        enemyHealthModifier,
        waveModifier
    };
    
    // Get existing custom maps
    const customMaps = getCustomMaps();
    
    const isEditing = editorState.currentMapName === mapName;
    
    // Check if map name already exists and it's not the one being edited
    if (customMaps[mapName] && !isEditing && !confirm(`A map named "${mapName}" already exists. Do you want to overwrite it?`)) {
        return;
    }
    
    // Add or update map
    customMaps[mapName] = map;
    
    // Save to localStorage
    localStorage.setItem('towerDefenseCustomMaps', JSON.stringify(customMaps));
    
    // Show different message based on whether we're creating or updating
    if (isEditing) {
        alert(`Map "${mapName}" updated successfully!`);
    } else {
        alert(`Map "${mapName}" saved successfully!`);
    }
    
    // Reload custom maps in menu
    loadCustomMaps();
    
    // Return to main menu
    exitEditor();
}

// Load custom maps from localStorage
function loadCustomMaps() {
    const customMaps = getCustomMaps();
    const customMapsSection = document.getElementById('custom-maps-section');
    
    // Show/hide the custom maps section
    if (Object.keys(customMaps).length > 0) {
        customMapsSection.style.display = 'block';
    } else {
        customMapsSection.style.display = 'none';
    }
}

// Edit an existing custom map
function editCustomMap(mapName) {
    const customMaps = getCustomMaps();
    const map = customMaps[mapName];
    
    if (!map) {
        alert('Map not found!');
        return;
    }
    
    // Load map into editor
    initEditor(mapName, map);
}

// Start game with a custom map
function startGameWithCustomMap(mapName) {
    const customMaps = getCustomMaps();
    const customMap = customMaps[mapName];
    
    if (!customMap) {
        alert('Map not found!');
        return;
    }
    
    // Hide main menu
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    
    // Initialize game with custom map
    initGameWithCustomMap(customMap);
}

// Initialize game with custom map
function initGameWithCustomMap(map) {
    gameState.currentMapType = 'custom';
    gameState.currentPath = map.path;
    gameState.money = map.startMoney;
    gameState.health = map.startHealth;
    gameState.enemyHealthModifier = map.enemyHealthModifier;
    gameState.waveModifier = map.waveModifier;
    
    // Reset game state
    gameState.wave = 0;
    gameState.enemies = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.floatingTexts = [];
    gameState.selectedTowerType = null;
    gameState.placingTower = false;
    gameState.state = 'waiting';
    
    // Reset wave properties
    gameState.currentWaveConfig = null;
    gameState.enemyQueue = [];
    gameState.bossPending = false;
    gameState.bossConfig = null;
    
    // Reset spawn properties
    gameState.enemiesToSpawn = 0;
    gameState.spawnCounter = 0;
    
    // Setup grid
    gameState.grid = createGrid();
    gameState.grid = markPathOnGrid(gameState.grid, gameState.currentPath);
    
    updateUI();
    
    // Start game loop if not already running
    if (!gameState.lastTime) {
        gameState.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
} 