// Main Game Entry Point
import { getCanvas, getContext, getUIElements, towerTypes, getMenuCanvas, getMenuContext } from './constants.js';
import { 
    gameState, initGame, update, startNextWave, placeTower, 
    createParticles, updateUI, selectTower, upgradeTower, 
    sellTower, cancelSelection, skipToWave
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

// Import Supabase functions
import {
    hasUserNickname,
    setUserNickname,
    getUserNickname,
    fetchMaps,
    saveMapToSupabase,
    deleteMapFromSupabase,
    getMapById,
    rateMap,
    getUserMapRating,
    incrementPlayCount
} from './supabaseClient.js';

// Track game loop animation frame
let gameLoopId = null;

// FPS tracking variables
let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;
let fpsUpdateInterval = 500; // Update FPS display every 500ms
let lastFpsUpdate = 0;

// Cheat code tracking
let cheatSequence = '';
const targetCheatCode = 'WAVE';

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

// Settings Modal Elements
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseButton = document.querySelector('.settings-close');
const closeSettingsButton = document.querySelector('.close-settings-button');
const toggleParticles = document.getElementById('toggle-particles');
const toggleFloatingTexts = document.getElementById('toggle-floating-texts');
const particleIntensitySlider = document.getElementById('particle-intensity-slider');
const particleIntensityValue = document.getElementById('particle-intensity-value');
const floatingTextIntensitySlider = document.getElementById('floating-text-intensity-slider');
const floatingTextIntensityValue = document.getElementById('floating-text-intensity-value');
const inGameSettingsButton = document.getElementById('in-game-settings');

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

// Load custom maps into the modal - updated to use Supabase
async function loadCustomMapsIntoModal(searchTerm = '', sortBy = 'created_at', ascending = false, myMapsOnly = false) {
    try {
        // Fetch maps from Supabase
        let maps = await fetchMaps(sortBy, ascending);
        const mapsList = document.getElementById('custom-maps-list');
        
        // Clear existing custom maps
        mapsList.innerHTML = '';
        
        // Filter maps based on search term if provided
        if (searchTerm) {
            maps = maps.filter(map => 
                map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                map.author.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter maps by current user if "My Maps Only" is checked
        if (myMapsOnly) {
            const currentUser = getUserNickname();
            maps = maps.filter(map => map.author === currentUser);
        }
        
        // Show appropriate messages if no maps or no search results
        if (maps.length === 0 && !searchTerm && !myMapsOnly) {
            noMapsMessage.style.display = 'block';
            noSearchResultsMessage.style.display = 'none';
        } else if (maps.length === 0 && (searchTerm || myMapsOnly)) {
            noMapsMessage.style.display = 'none';
            noSearchResultsMessage.style.display = 'block';
        } else {
            noMapsMessage.style.display = 'none';
            noSearchResultsMessage.style.display = 'none';
        }
        
        // Add maps to the modal
        for (const map of maps) {
            const mapItem = document.createElement('div');
            mapItem.className = 'custom-map-item';
            
            const mapInfo = document.createElement('div');
            mapInfo.className = 'custom-map-info';
            mapInfo.addEventListener('click', () => {
                startGameWithCustomMap(map.id);
                hideCustomMapsModal();
            });
            
            const mapNameElem = document.createElement('div');
            mapNameElem.className = 'custom-map-name';
            mapNameElem.textContent = map.name;
            
            const mapAuthor = document.createElement('div');
            mapAuthor.className = 'map-author';
            mapAuthor.textContent = `by ${map.author}`;
            
            const mapDescription = document.createElement('div');
            mapDescription.className = 'custom-map-description';
            const difficultyText = getMapDifficultyText(map.map_data);
            mapDescription.textContent = difficultyText;
            
            // Create play count element
            const playCount = document.createElement('div');
            playCount.className = 'map-play-count';
            playCount.innerHTML = `<i class="fas fa-play"></i> ${map.play_count || 0} plays`;
            
            mapInfo.appendChild(mapNameElem);
            mapInfo.appendChild(mapAuthor);
            mapInfo.appendChild(mapDescription);
            mapInfo.appendChild(playCount);
            
            // Create rating container
            const ratingContainer = document.createElement('div');
            ratingContainer.className = 'rating-container';
            
            // Add rating stars
            const ratingStars = document.createElement('div');
            ratingStars.className = 'rating-stars';
            ratingStars.dataset.mapId = map.id;
            
            // Create 5 stars
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.dataset.rating = i;
                star.textContent = '★';
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    rateMapHandler(map.id, i);
                });
                ratingStars.appendChild(star);
            }
            
            // Add rating info
            const ratingInfo = document.createElement('div');
            ratingInfo.className = 'rating-info';
            
            const avgRating = document.createElement('span');
            avgRating.className = 'avg-rating';
            avgRating.textContent = map.average_rating ? map.average_rating.toFixed(1) : '0.0';
            
            const ratingCount = document.createElement('span');
            ratingCount.className = 'rating-count';
            ratingCount.textContent = `(${map.rating_count || 0})`;
            
            ratingInfo.appendChild(avgRating);
            ratingInfo.appendChild(ratingCount);
            
            ratingContainer.appendChild(ratingStars);
            ratingContainer.appendChild(ratingInfo);
            
            mapInfo.appendChild(ratingContainer);
            
            // Check if the current user is the author of the map
            const currentUser = getUserNickname();
            const isAuthor = map.author === currentUser;

            // Disable rating if user is the author
            if (isAuthor) {
                // Disable rating stars and add a message
                ratingStars.classList.add('disabled');
                // Add a note indicating they can't rate their own map
                const authorNote = document.createElement('span');
                authorNote.className = 'author-note';
                authorNote.textContent = '(Can\'t rate your own map)';
                ratingInfo.appendChild(authorNote);
                
                // Remove click event listeners from stars
                ratingStars.querySelectorAll('.star').forEach(star => {
                    const oldStar = star.cloneNode(true);
                    star.parentNode.replaceChild(oldStar, star);
                    oldStar.style.cursor = 'default';
                });
            }
            
            const mapActions = document.createElement('div');
            mapActions.className = 'custom-map-actions';
            
            // Edit button - only show for maps the user created
            if (isAuthor) {
                const editBtn = document.createElement('button');
                editBtn.className = 'map-action-btn map-edit-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = "Edit map";
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editCustomMap(map.id);
                    hideCustomMapsModal();
                });
                mapActions.appendChild(editBtn);
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'map-action-btn map-delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = "Delete map";
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete the map "${map.name}"?`)) {
                        try {
                            await deleteMapFromSupabase(map.id);
                            // Update main menu button visibility
                            loadCustomMaps();
                            // Reload maps in modal with current search term
                            loadCustomMapsIntoModal(searchTerm, sortBy, ascending, myMapsOnly);
                            showToast(`Map "${map.name}" deleted successfully!`, 'success');
                        } catch (error) {
                            console.error('Error deleting map:', error);
                            showToast('Error deleting map. Please try again.', 'error');
                        }
                    }
                });
                mapActions.appendChild(deleteBtn);
            }
            
            mapItem.appendChild(mapInfo);
            mapItem.appendChild(mapActions);
            
            mapsList.appendChild(mapItem);
            
            // Check if user has rated this map and highlight stars
            highlightUserRating(map.id, ratingStars);
        }
    } catch (error) {
        console.error('Error loading maps into modal:', error);
        noMapsMessage.style.display = 'block';
        noSearchResultsMessage.style.display = 'none';
    }
}

// Function to determine map difficulty text
function getMapDifficultyText(mapData) {
    if (!mapData) return 'Custom';
    
    if (mapData.startMoney === 150 && mapData.startHealth === 25 && 
        mapData.enemyHealthModifier === 0.8 && mapData.waveModifier === 0.9) {
        return 'Easy';
    } else if (mapData.startMoney === 90 && mapData.startHealth === 15 && 
            mapData.enemyHealthModifier === 1.2 && mapData.waveModifier === 1.1) {
        return 'Hard';
    } else if (mapData.startMoney === 100 && mapData.startHealth === 20 && 
            mapData.enemyHealthModifier === 1.0 && mapData.waveModifier === 1.0) {
        return 'Medium';
    } else {
        return 'Custom';
    }
}

// Function to highlight user's rating
async function highlightUserRating(mapId, ratingStarsContainer) {
    try {
        const userRating = await getUserMapRating(mapId);
        if (userRating > 0) {
            const stars = ratingStarsContainer.querySelectorAll('.star');
            stars.forEach(star => {
                const rating = parseInt(star.dataset.rating);
                if (rating <= userRating) {
                    star.classList.add('active');
                }
            });
            
            // Add "Your rating" indicator
            const userRatedIndicator = document.createElement('span');
            userRatedIndicator.className = 'user-rated';
            userRatedIndicator.textContent = '(Your rating)';
            ratingStarsContainer.appendChild(userRatedIndicator);
        }
    } catch (error) {
        console.error('Error highlighting user rating:', error);
    }
}

// Handler for rating a map
async function rateMapHandler(mapId, rating) {
    try {
        // Check if user has a nickname
        if (!hasUserNickname()) {
            showNicknameModal();
            return;
        }
        
        await rateMap(mapId, rating);
        // Reload the maps to get updated ratings
        const searchTerm = document.getElementById('map-search').value;
        const sortSelect = document.getElementById('sort-maps');
        const sortBy = sortSelect ? sortSelect.value : 'created_at';
        const sortDirectionBtn = document.getElementById('sort-direction');
        const ascending = sortDirectionBtn ? sortDirectionBtn.classList.contains('asc') : false;
        
        await loadCustomMapsIntoModal(searchTerm, sortBy, ascending);
        showToast('Rating submitted. Thank you for your feedback!', 'success');
    } catch (error) {
        console.error('Error rating map:', error);
        showToast('Error rating map. Please try again.', 'error');
    }
}

// Update the editCustomMap function
async function editCustomMap(mapId) {
    try {
        // Fetch map from Supabase by ID
        const map = await getMapById(mapId);
        
        if (!map) {
            showToast('Map not found!', 'error');
            return;
        }
        
        // Load map into editor
        initEditor(map.name, map.map_data);
    } catch (error) {
        console.error('Error editing map:', error);
        showToast('Error loading map for editing. Please try again.', 'error');
    }
}

// Update the startGameWithCustomMap function
async function startGameWithCustomMap(mapId) {
    try {
        // Fetch map from Supabase by ID
        const map = await getMapById(mapId);
        
        if (!map) {
            showToast('Map not found!', 'error');
            return;
        }
        
        // Increment play count with proper error handling
        try {
            const playCountIncremented = await incrementPlayCount(mapId);
            if (!playCountIncremented) {
                console.error('Failed to increment play count for map:', mapId);
            } else {
                console.log('Successfully incremented play count for map:', mapId);
            }
        } catch (incrementError) {
            console.error('Error during play count increment:', incrementError);
        }
        
        // Hide main menu
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        
        // Initialize game with custom map
        initGameWithCustomMap(map.map_data);
    } catch (error) {
        console.error('Error starting game with custom map:', error);
        showToast('Error loading map. Please try again.', 'error');
    }
}

// Show nickname modal
function showNicknameModal() {
    const nicknameModal = document.getElementById('nickname-modal');
    nicknameModal.style.display = 'flex';
    setTimeout(() => {
        nicknameModal.style.opacity = '1';
    }, 10);
    
    // Focus on input
    document.getElementById('nickname-input').focus();
}

// Hide nickname modal
function hideNicknameModal() {
    const nicknameModal = document.getElementById('nickname-modal');
    
    // Okamžitě nastavit pointer-events na none, aby neblokoval klikání
    nicknameModal.style.pointerEvents = 'none';
    
    // Animace opacity pro plynulé zmizení
    nicknameModal.style.opacity = '0';
    
    // Nastavit display: none po dokončení animace
    setTimeout(() => {
        nicknameModal.style.display = 'none';
        // Ujistit se, že modál nebude blokovat interakci
        nicknameModal.style.pointerEvents = 'auto';
        nicknameModal.style.zIndex = '-1';
    }, 300);
}

// Save nickname
function saveNickname() {
    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput.value.trim();
    const errorMsg = document.getElementById('nickname-error');
    
    if (!nickname) {
        errorMsg.textContent = 'Please enter a nickname';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (nickname.length < 3) {
        errorMsg.textContent = 'Nickname must be at least 3 characters';
        errorMsg.style.display = 'block';
        return;
    }
    
    // Save nickname
    setUserNickname(nickname);
    hideNicknameModal();
}

// Update the saveCurrentMap function
async function saveCurrentMap() {
    const mapNameInput = document.getElementById('map-name');
    const mapName = mapNameInput.value.trim();
    
    if (!mapName) {
        showToast('Please enter a map name', 'error');
        return;
    }
    
    if (!validatePath()) {
        showToast('Map is not valid. ' + editorState.validationMessage, 'error');
        return;
    }
    
    // Check if user has a nickname
    if (!hasUserNickname()) {
        // Show nickname modal
        showNicknameModal();
        
        // Set up an event listener for when the nickname is saved
        const saveNicknameBtn = document.getElementById('save-nickname-btn');
        const originalClickHandler = saveNicknameBtn.onclick;
        
        saveNicknameBtn.onclick = () => {
            // Call the original handler
            if (originalClickHandler) originalClickHandler();
            
            // If nickname was saved successfully, continue with map save
            if (hasUserNickname()) {
                // Remove the temporary event handler
                saveNicknameBtn.onclick = originalClickHandler;
                
                // Continue with map save
                completeMapSave(mapName);
            }
        };
        
        return;
    }
    
    // If we already have a nickname, save directly
    completeMapSave(mapName);
}

// Function to show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);
    
    // Create close button
    const closeBtn = document.createElement('i');
    closeBtn.className = 'fas fa-times toast-close';
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    toast.appendChild(closeBtn);
    
    // Add toast to container
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Remove toast after animation completes
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.remove();
        }
    }, 4300);
}

// Helper function to complete map saving
async function completeMapSave(mapName) {
    const difficultySelect = document.getElementById('difficulty-select');
    const difficulty = difficultySelect.value;
    
    // Get values from inputs
    let startMoney, startHealth, enemyHealthModifier, waveModifier, maxWaves;
    
    if (difficulty === 'custom') {
        // Use values from custom inputs
        startMoney = parseInt(document.getElementById('start-money').value);
        startHealth = parseInt(document.getElementById('start-health').value);
        enemyHealthModifier = parseFloat(document.getElementById('enemy-health-modifier').value);
        waveModifier = parseFloat(document.getElementById('wave-modifier').value);
        maxWaves = parseInt(document.getElementById('max-waves').value);
        
        // Ensure maxWaves is within valid range
        maxWaves = Math.max(20, Math.min(40, maxWaves));
    } else {
        // Use predefined values based on difficulty
        startMoney = 100; // Default medium values
        startHealth = 20;
        enemyHealthModifier = 1.0;
        waveModifier = 1.0;
        maxWaves = 20; // Default value for predefined difficulties
        
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
    }
    
    // Create map object
    const map = {
        name: mapName,
        path: orderPathFromStartToEnd(),
        startMoney,
        startHealth,
        enemyHealthModifier,
        waveModifier,
        maxWaves
    };
    
    const isEditing = editorState.currentMapName === mapName;
    
    // Save to Supabase
    try {
        await saveMapToSupabase(map);
        
        // Show different message based on whether we're creating or updating
        if (isEditing) {
            showToast(`Map "${mapName}" updated successfully!`, 'success');
        } else {
            showToast(`Map "${mapName}" saved successfully!`, 'success');
        }
        
        // Reload custom maps in menu
        loadCustomMaps();
        
        // Return to main menu
        exitEditor();
    } catch (error) {
        console.error('Error saving map to Supabase:', error);
        showToast('Error saving map to the database. Please try again later.', 'error');
    }
}

// Update the loadCustomMaps function to use only Supabase
async function loadCustomMaps() {
    try {
        // Fetch maps from Supabase
        const maps = await fetchMaps();
        const customMapsSection = document.getElementById('custom-maps-section');
        
        // Show/hide the custom maps section
        if (maps.length > 0) {
            customMapsSection.style.display = 'block';
        } else {
            customMapsSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading maps:', error);
        // Hide custom maps section if error
        const customMapsSection = document.getElementById('custom-maps-section');
        customMapsSection.style.display = 'none';
    }
}

// Menu functions
function showMenu() {
    document.getElementById('main-menu').style.display = 'flex';
    document.getElementById('game-container').style.display = 'none';
    
    // Stop the game loop and clean up
    stopGameLoop();
    
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
    gameState.currentWaveConfig = null;
    gameState.enemyQueue = [];
    gameState.bossPending = false;
    gameState.bossConfig = null;
    gameState.enemiesToSpawn = 0;
    gameState.spawnCounter = 0;
    
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
    stopGameLoop(); // Ensure any existing loop is stopped first
    gameState.lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
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
    // Calculate delta time for smooth animations
    const deltaTime = timestamp - (gameState.lastTime || timestamp);
    gameState.lastTime = timestamp;
    
    // Update FPS calculation
    frameCount++;
    if (timestamp - lastFpsUpdate >= fpsUpdateInterval) {
        fps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = timestamp;
    }
    
    // Update and draw game state
    update(deltaTime);
    
    // Get canvas and context for drawing
    const canvas = getCanvas();
    const ctx = getContext();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game
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
    
    // Draw FPS counter in bottom right
    drawFpsCounter(ctx, canvas.width, canvas.height);
    
    // Continue game loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Function to draw FPS counter
function drawFpsCounter(ctx, width, height) {
    ctx.font = '11px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${fps} FPS`, width - 10, height - 10);
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
    
    // Check for cheat code sequence
    const key = e.key.toUpperCase();
    const expectedKey = targetCheatCode.charAt(cheatSequence.length);
    
    if (key === expectedKey) {
        // Append the correct key to the sequence
        cheatSequence += key;
        
        // Check if the full cheat code has been entered
        if (cheatSequence === targetCheatCode) {
            // Reset the sequence
            cheatSequence = '';
            
            // Prompt user for wave number
            const waveNumber = prompt('CHEAT ACTIVATED: Enter wave number to skip to:');
            if (waveNumber !== null) {
                skipToWave(waveNumber);
            }
        }
    } else {
        // Wrong key, reset the sequence
        cheatSequence = '';
        
        // If this key is the first key of the cheat code, start a new sequence
        if (key === targetCheatCode.charAt(0)) {
            cheatSequence = key;
        }
    }
    
    // Získání číselné hodnoty z klávesy (funguje pro různé klávesnice)
    let numKey = null;
    
    // Zpracování standardních číslic
    if (e.key >= '1' && e.key <= '7') {
        numKey = parseInt(e.key);
    } 
    // Zpracování kláves s kódy, které odpovídají číslicím
    else if (e.code) {
        // Digit1 až Digit7 pro standardní numerické klávesy
        if (e.code.startsWith('Digit') && e.code.length === 6) {
            const digitChar = e.code.charAt(5);
            if (digitChar >= '1' && digitChar <= '7') {
                numKey = parseInt(digitChar);
            }
        }
        // Numpad1 až Numpad7 pro numerickou klávesnici
        else if (e.code.startsWith('Numpad') && e.code.length === 7) {
            const digitChar = e.code.charAt(6);
            if (digitChar >= '1' && digitChar <= '7') {
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
        
        // Klávesa M pro návrat do menu
        case 'm':
        case 'M':
            // Kontrola, zda není otevřené nějaké modální okno
            if (document.getElementById('settings-modal').style.display !== 'none' ||
                document.getElementById('tower-guide-modal').style.display !== 'none' ||
                document.getElementById('custom-maps-modal').style.display !== 'none') {
                return;
            }
            // Návrat do menu
            showMenu();
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
    
    // Event listener pro tlačítko Play Again
    document.querySelectorAll('.play-again-button, #retry-button').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('game-over-screen').style.display = 'none';
            document.getElementById('victory-screen').style.display = 'none';
            
            // Stop the game loop and clean up
            stopGameLoop();
            
            // Vrácení na výběr map
            document.getElementById('game-view').style.display = 'none';
            document.getElementById('map-selection').style.display = 'flex';
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
    // Load settings from localStorage
    loadSettings();
    
    // Initialize map selection event handlers
    document.querySelectorAll('.map-button').forEach(button => {
        button.addEventListener('click', () => {
            const mapType = button.dataset.map;
            startGame(mapType);
        });
    });
    
    // Initialize create map button handler
    document.getElementById('create-map-btn').addEventListener('click', initMapEditor);
    
    // Start menu background animation
    initMenuParticles();
    
    // Initialize event listeners
    initEventListeners();
    
    // Check if user has a nickname
    if (!hasUserNickname()) {
        // Show nickname modal after a short delay to make sure everything else is loaded
        setTimeout(showNicknameModal, 500);
    }
    
    // Initialize nickname and sorting listeners
    initNicknameModalListeners();
    initSortingListeners();
    
    // Load custom maps to check if we should show the custom maps section
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
    
    // Add event listeners for parameter inputs
    const startMoneyInput = document.getElementById('start-money');
    const startHealthInput = document.getElementById('start-health');
    const maxWavesInput = document.getElementById('max-waves');
    const enemyHealthModifierInput = document.getElementById('enemy-health-modifier');
    const waveModifierInput = document.getElementById('wave-modifier');
    const enemyHealthValue = document.getElementById('enemy-health-value');
    const waveModifierValue = document.getElementById('wave-modifier-value');
    
    // Add event listeners to set custom difficulty when parameters change
    startMoneyInput.addEventListener('input', setCustomDifficulty);
    startHealthInput.addEventListener('input', setCustomDifficulty);
    maxWavesInput.addEventListener('input', setCustomDifficulty);
    
    // Add event listeners for slider updates with custom difficulty setting
    enemyHealthModifierInput.addEventListener('input', function() {
        enemyHealthValue.textContent = parseFloat(this.value).toFixed(1);
        setCustomDifficulty();
    });
    
    waveModifierInput.addEventListener('input', function() {
        waveModifierValue.textContent = parseFloat(this.value).toFixed(1);
        setCustomDifficulty();
    });
    
    // Add event listener for difficulty change
    const difficultySelect = document.getElementById('difficulty-select');
    difficultySelect.addEventListener('change', function() {
        updateCustomParams(this.value);
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

// Update custom parameter inputs based on selected difficulty
function updateCustomParams(difficulty) {
    const startMoneyInput = document.getElementById('start-money');
    const startHealthInput = document.getElementById('start-health');
    const enemyHealthModifierInput = document.getElementById('enemy-health-modifier');
    const waveModifierInput = document.getElementById('wave-modifier');
    const enemyHealthValue = document.getElementById('enemy-health-value');
    const waveModifierValue = document.getElementById('wave-modifier-value');
    const maxWavesInput = document.getElementById('max-waves');
    
    // Default values (medium)
    let startMoney = 100;
    let startHealth = 20;
    let enemyHealthModifier = 1.0;
    let waveModifier = 1.0;
    let maxWaves = 20; // Default is 20 waves for all preset difficulties
    
    // Set values based on difficulty
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
        case 'custom':
            // Keep current values for custom
            return;
    }
    
    // Update input values
    startMoneyInput.value = startMoney;
    startHealthInput.value = startHealth;
    enemyHealthModifierInput.value = enemyHealthModifier;
    waveModifierInput.value = waveModifier;
    maxWavesInput.value = maxWaves;
    
    // Update displayed values for sliders
    enemyHealthValue.textContent = enemyHealthModifier.toFixed(1);
    waveModifierValue.textContent = waveModifier.toFixed(1);
}

// Set difficulty to custom when parameters are manually changed
function setCustomDifficulty() {
    const difficultySelect = document.getElementById('difficulty-select');
    difficultySelect.value = 'custom';
}

// Load settings from localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('tdGameSettings')) || {};
    
    gameState.showParticles = settings.showParticles !== undefined ? settings.showParticles : true;
    gameState.showFloatingTexts = settings.showFloatingTexts !== undefined ? settings.showFloatingTexts : true;
    gameState.particleIntensity = settings.particleIntensity !== undefined ? settings.particleIntensity : 1.0;
    gameState.floatingTextIntensity = settings.floatingTextIntensity !== undefined ? settings.floatingTextIntensity : 1.0;
    gameState.floatingTextEffects = settings.floatingTextEffects !== undefined ? settings.floatingTextEffects : 1.0;
    gameState.floatingTextDuration = settings.floatingTextDuration !== undefined ? settings.floatingTextDuration : 1.0;
    gameState.projectileQuality = settings.projectileQuality !== undefined ? settings.projectileQuality : 1.0;
    
    // Update checkboxes to match loaded settings
    if (toggleParticles) toggleParticles.checked = gameState.showParticles;
    if (toggleFloatingTexts) toggleFloatingTexts.checked = gameState.showFloatingTexts;
    
    // Update particle intensity slider
    if (particleIntensitySlider) {
        particleIntensitySlider.value = Math.round(gameState.particleIntensity * 100);
        particleIntensityValue.textContent = Math.round(gameState.particleIntensity * 100) + '%';
        particleIntensitySlider.disabled = !gameState.showParticles;
        particleIntensityValue.style.opacity = gameState.showParticles ? '1' : '0.5';
    }
    
    // Update floating text intensity slider
    if (floatingTextIntensitySlider) {
        floatingTextIntensitySlider.value = Math.round(gameState.floatingTextIntensity * 100);
        floatingTextIntensityValue.textContent = Math.round(gameState.floatingTextIntensity * 100) + '%';
        floatingTextIntensitySlider.disabled = !gameState.showFloatingTexts;
        floatingTextIntensityValue.style.opacity = gameState.showFloatingTexts ? '1' : '0.5';
    }
    
    // Update floating text effects slider
    if (floatingTextEffectsSlider) {
        floatingTextEffectsSlider.value = Math.round(gameState.floatingTextEffects * 100);
        floatingTextEffectsValue.textContent = Math.round(gameState.floatingTextEffects * 100) + '%';
        floatingTextEffectsSlider.disabled = !gameState.showFloatingTexts;
        floatingTextEffectsValue.style.opacity = gameState.showFloatingTexts ? '1' : '0.5';
    }
    
    // Update floating text duration slider
    if (floatingTextDurationSlider) {
        floatingTextDurationSlider.value = Math.round(gameState.floatingTextDuration * 100);
        floatingTextDurationValue.textContent = Math.round(gameState.floatingTextDuration * 100) + '%';
        floatingTextDurationSlider.disabled = !gameState.showFloatingTexts;
        floatingTextDurationValue.style.opacity = gameState.showFloatingTexts ? '1' : '0.5';
    }
    
    // Update projectile quality slider
    if (projectileQualitySlider) {
        projectileQualitySlider.value = Math.round(gameState.projectileQuality * 100);
        projectileQualityValue.textContent = Math.round(gameState.projectileQuality * 100) + '%';
    }
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        showParticles: gameState.showParticles,
        showFloatingTexts: gameState.showFloatingTexts,
        particleIntensity: gameState.particleIntensity,
        floatingTextIntensity: gameState.floatingTextIntensity,
        floatingTextEffects: gameState.floatingTextEffects,
        floatingTextDuration: gameState.floatingTextDuration,
        projectileQuality: gameState.projectileQuality
    };
    
    localStorage.setItem('tdGameSettings', JSON.stringify(settings));
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

// Add event listeners for settings modal
settingsButton.addEventListener('click', showSettings);
inGameSettingsButton.addEventListener('click', showSettings);

settingsCloseButton.addEventListener('click', hideSettings);
closeSettingsButton.addEventListener('click', hideSettings);
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        hideSettings();
    }
});

// Add event listener for Return to Menu button in settings
const returnToMenuButton = document.getElementById('return-to-menu-button');
if (returnToMenuButton) {
    returnToMenuButton.addEventListener('click', () => {
        hideSettings(); // Nejdřív skryjeme modální okno
        showMenu(); // Potom přejdeme do menu
    });
}

// Add event listeners for toggle switches
toggleParticles.addEventListener('change', (e) => {
    gameState.showParticles = e.target.checked;
    // Enable/disable intensity slider based on particles being enabled/disabled
    particleIntensitySlider.disabled = !e.target.checked;
    particleIntensityValue.style.opacity = e.target.checked ? '1' : '0.5';
    saveSettings();
});

toggleFloatingTexts.addEventListener('change', (e) => {
    gameState.showFloatingTexts = e.target.checked;
    // Enable/disable intensity slider based on floating texts being enabled/disabled
    floatingTextIntensitySlider.disabled = !e.target.checked;
    floatingTextIntensityValue.style.opacity = e.target.checked ? '1' : '0.5';
    
    // Enable/disable effects slider based on floating texts being enabled/disabled
    floatingTextEffectsSlider.disabled = !e.target.checked;
    floatingTextEffectsValue.style.opacity = e.target.checked ? '1' : '0.5';
    
    // Enable/disable duration slider based on floating texts being enabled/disabled
    floatingTextDurationSlider.disabled = !e.target.checked;
    floatingTextDurationValue.style.opacity = e.target.checked ? '1' : '0.5';
    
    saveSettings();
});

// Add event listener for particle intensity slider
particleIntensitySlider.addEventListener('input', (e) => {
    const intensity = parseInt(e.target.value) / 100;
    gameState.particleIntensity = intensity;
    particleIntensityValue.textContent = e.target.value + '%';
    saveSettings();
});

// Add event listener for floating text intensity slider
floatingTextIntensitySlider.addEventListener('input', (e) => {
    const intensity = parseInt(e.target.value) / 100;
    gameState.floatingTextIntensity = intensity;
    floatingTextIntensityValue.textContent = e.target.value + '%';
    saveSettings();
});

// Add event listener for floating text effects slider
const floatingTextEffectsSlider = document.getElementById('floating-text-effects-slider');
const floatingTextEffectsValue = document.getElementById('floating-text-effects-value');

if (floatingTextEffectsSlider) {
    floatingTextEffectsSlider.addEventListener('input', (e) => {
        const effects = parseInt(e.target.value) / 100;
        gameState.floatingTextEffects = effects;
        floatingTextEffectsValue.textContent = e.target.value + '%';
        saveSettings();
    });
}

// Add event listener for floating text duration slider
const floatingTextDurationSlider = document.getElementById('floating-text-duration-slider');
const floatingTextDurationValue = document.getElementById('floating-text-duration-value');

if (floatingTextDurationSlider) {
    floatingTextDurationSlider.addEventListener('input', (e) => {
        // Convert 50-200 range to 0.5-2.0 for the duration factor
        const duration = parseInt(e.target.value) / 100;
        gameState.floatingTextDuration = duration;
        floatingTextDurationValue.textContent = e.target.value + '%';
        saveSettings();
    });
}

// Add event listener for projectile quality slider
const projectileQualitySlider = document.getElementById('projectile-quality-slider');
const projectileQualityValue = document.getElementById('projectile-quality-value');

if (projectileQualitySlider) {
    projectileQualitySlider.addEventListener('input', (e) => {
        const quality = parseInt(e.target.value) / 100;
        gameState.projectileQuality = quality;
        projectileQualityValue.textContent = e.target.value + '%';
        saveSettings();
    });
}

// Create map button in modal
createMapModalButton.addEventListener('click', () => {
    initEditor();
    hideCustomMapsModal();
});

// Search functionality
mapSearchInput.addEventListener('input', (e) => {
    const myMapsOnly = document.getElementById('my-maps-only').checked;
    const sortSelect = document.getElementById('sort-maps');
    const sortBy = sortSelect ? sortSelect.value : 'created_at';
    const sortDirectionBtn = document.getElementById('sort-direction');
    const ascending = sortDirectionBtn ? sortDirectionBtn.classList.contains('asc') : false;
    
    loadCustomMapsIntoModal(e.target.value, sortBy, ascending, myMapsOnly);
});

// Function to stop the game loop and clean up resources
function stopGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        gameState.lastTime = 0;
    }
}

// Show settings modal
function showSettings() {
    settingsModal.style.display = 'flex';
    // Add slight animation delay to make sure flex layout is applied first
    setTimeout(() => {
        settingsModal.style.opacity = '1';
    }, 10);
    
    // Update checkboxes to match current settings
    toggleParticles.checked = gameState.showParticles;
    toggleFloatingTexts.checked = gameState.showFloatingTexts;
    
    // Update particle intensity slider
    particleIntensitySlider.value = Math.round(gameState.particleIntensity * 100);
    particleIntensityValue.textContent = Math.round(gameState.particleIntensity * 100) + '%';
    particleIntensitySlider.disabled = !gameState.showParticles;
    particleIntensityValue.style.opacity = gameState.showParticles ? '1' : '0.5';
    
    // Update floating text intensity slider
    floatingTextIntensitySlider.value = Math.round(gameState.floatingTextIntensity * 100);
    floatingTextIntensityValue.textContent = Math.round(gameState.floatingTextIntensity * 100) + '%';
    floatingTextIntensitySlider.disabled = !gameState.showFloatingTexts;
    floatingTextIntensityValue.style.opacity = gameState.showFloatingTexts ? '1' : '0.5';
    
    // Update floating text effects slider
    floatingTextEffectsSlider.value = Math.round(gameState.floatingTextEffects * 100);
    floatingTextEffectsValue.textContent = Math.round(gameState.floatingTextEffects * 100) + '%';
    floatingTextEffectsSlider.disabled = !gameState.showFloatingTexts;
    floatingTextEffectsValue.style.opacity = gameState.showFloatingTexts ? '1' : '0.5';
    
    // Update floating text duration slider
    floatingTextDurationSlider.value = Math.round(gameState.floatingTextDuration * 100);
    floatingTextDurationValue.textContent = Math.round(gameState.floatingTextDuration * 100) + '%';
    floatingTextDurationSlider.disabled = !gameState.showFloatingTexts;
    floatingTextDurationValue.style.opacity = gameState.showFloatingTexts ? '1' : '0.5';
    
    // Update projectile quality slider
    projectileQualitySlider.value = Math.round(gameState.projectileQuality * 100);
    projectileQualityValue.textContent = Math.round(gameState.projectileQuality * 100) + '%';
}

// Hide settings modal
function hideSettings() {
    settingsModal.style.opacity = '0';
    setTimeout(() => {
        settingsModal.style.display = 'none';
    }, 300); // Match animation duration
}

// Initialize nickname modal event listeners
function initNicknameModalListeners() {
    const nicknameCloseBtn = document.querySelector('.nickname-close');
    const saveNicknameBtn = document.getElementById('save-nickname-btn');
    const nicknameInput = document.getElementById('nickname-input');
    
    if (nicknameCloseBtn) {
        nicknameCloseBtn.addEventListener('click', hideNicknameModal);
    }
    
    if (saveNicknameBtn) {
        saveNicknameBtn.addEventListener('click', saveNickname);
    }
    
    if (nicknameInput) {
        nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveNickname();
            }
        });
    }
}

// Initialize sorting controls event listeners
function initSortingListeners() {
    const sortSelect = document.getElementById('sort-maps');
    const sortDirectionBtn = document.getElementById('sort-direction');
    const myMapsOnlyCheckbox = document.getElementById('my-maps-only');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const searchTerm = document.getElementById('map-search').value;
            const sortBy = sortSelect.value;
            const ascending = sortDirectionBtn ? sortDirectionBtn.classList.contains('asc') : false;
            const myMapsOnly = myMapsOnlyCheckbox ? myMapsOnlyCheckbox.checked : false;
            loadCustomMapsIntoModal(searchTerm, sortBy, ascending, myMapsOnly);
        });
    }
    
    if (sortDirectionBtn) {
        sortDirectionBtn.addEventListener('click', () => {
            sortDirectionBtn.classList.toggle('asc');
            // Update icon
            const icon = sortDirectionBtn.querySelector('i');
            if (sortDirectionBtn.classList.contains('asc')) {
                icon.className = 'fas fa-sort-up';
            } else {
                icon.className = 'fas fa-sort-down';
            }
            
            const searchTerm = document.getElementById('map-search').value;
            const sortBy = sortSelect ? sortSelect.value : 'created_at';
            const ascending = sortDirectionBtn.classList.contains('asc');
            const myMapsOnly = myMapsOnlyCheckbox ? myMapsOnlyCheckbox.checked : false;
            loadCustomMapsIntoModal(searchTerm, sortBy, ascending, myMapsOnly);
        });
    }
    
    // Add event listener for My Maps Only checkbox
    if (myMapsOnlyCheckbox) {
        myMapsOnlyCheckbox.addEventListener('change', () => {
            const searchTerm = document.getElementById('map-search').value;
            const sortBy = sortSelect ? sortSelect.value : 'created_at';
            const ascending = sortDirectionBtn ? sortDirectionBtn.classList.contains('asc') : false;
            loadCustomMapsIntoModal(searchTerm, sortBy, ascending, myMapsOnlyCheckbox.checked);
        });
    }
}

// Přidání chybějící funkce initGameWithCustomMap
// Initialize game with custom map
function initGameWithCustomMap(map) {
    gameState.currentMapType = 'custom';
    gameState.currentPath = map.path;
    gameState.money = map.startMoney;
    gameState.health = map.startHealth;
    gameState.enemyHealthModifier = map.enemyHealthModifier;
    gameState.waveModifier = map.waveModifier;
    
    // Set maximum number of waves (default to 20 if not defined)
    gameState.maxWaves = map.maxWaves || 20;
    
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
    stopGameLoop(); // Ensure any existing loop is stopped first
    gameState.lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);
} 