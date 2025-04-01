// Game Logic
import { MAX_WAVES, path, getUIElements, towerTypes, getCanvas, maps } from './constants.js';
import { createGrid, markPathOnGrid, isValidPlacement } from './utils.js';
import Enemy from './classes/Enemy.js';
import Tower from './classes/Tower.js';
import Particle from './classes/Particle.js';
import FloatingText from './classes/FloatingText.js';
import { triggerScreenFlash, updateScreenFlash } from './renderers.js';

// Game State
export const gameState = {
    money: 100,
    health: 20,
    wave: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    selectedTowerType: null,
    placingTower: false,
    mouse: { x: 0, y: 0, gridX: 0, gridY: 0 },
    grid: null,
    state: 'waiting', // 'waiting', 'wave_inprogress', 'game_over', 'victory'
    enemiesToSpawn: 0,
    spawnCounter: 0,
    spawnInterval: 900,
    timeSinceLastSpawn: 0,
    lastTime: 0,
    // Nové vlastnosti pro různé mapy
    currentMapType: 'medium',
    currentPath: null,
    enemyHealthModifier: 1.0,
    waveModifier: 1.0
};

// Initialize the game grid
export function initGame(mapType = 'medium') {
    // Nastavení vlastností podle mapy
    const selectedMap = maps[mapType];
    gameState.currentMapType = mapType;
    gameState.currentPath = selectedMap.path;
    gameState.money = selectedMap.startMoney;
    gameState.health = selectedMap.startHealth;
    gameState.enemyHealthModifier = selectedMap.enemyHealthModifier;
    gameState.waveModifier = selectedMap.waveModifier;
    
    // Reset herního stavu
    gameState.wave = 0;
    gameState.enemies = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.floatingTexts = [];
    gameState.selectedTowerType = null;
    gameState.placingTower = false;
    gameState.state = 'waiting';
    gameState.enemiesToSpawn = 0;
    gameState.spawnCounter = 0;
    
    // Vytvoření a inicializace gridu
    gameState.grid = createGrid();
    gameState.grid = markPathOnGrid(gameState.grid, gameState.currentPath);
    
    updateUI();
}

// Helper function to create particles
export function createParticles(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, size, speed, life));
    }
}

// Helper function to create floating text
export function createFloatingText(x, y, text, color = '#ffd700', size = 16, lifespan = 1500) {
    gameState.floatingTexts.push(new FloatingText(x, y, text, color, size, lifespan));
}

// Spawn new enemy
export function spawnEnemy() {
    if (gameState.enemiesToSpawn > 0 && gameState.spawnCounter < gameState.enemiesToSpawn) {
        gameState.enemies.push(new Enemy(gameState.wave, gameState.enemyHealthModifier));
        gameState.spawnCounter++;
    }
}

// Start next wave
export function startNextWave() {
    if (gameState.state !== 'waiting') return;
    
    gameState.wave++;
    if (gameState.wave > MAX_WAVES) {
        endGame(true);
        return;
    }
    
    gameState.state = 'wave_inprogress';
    // Použití modifikátoru vlny pro určení počtu nepřátel
    gameState.enemiesToSpawn = Math.floor((8 + gameState.wave * 4) * gameState.waveModifier);
    gameState.spawnCounter = 0;
    gameState.timeSinceLastSpawn = gameState.spawnInterval;
    
    updateUI();
    
    const { startWaveButton } = getUIElements();
    startWaveButton.disabled = true;
    console.log(`Starting Wave ${gameState.wave}`);
}

// Update game state each frame
export function update(deltaTime) {
    if (gameState.state === 'game_over' || gameState.state === 'victory') return;

    // Update screen flash effect
    updateScreenFlash(deltaTime);

    // Enemy Spawning
    if (gameState.state === 'wave_inprogress' && gameState.spawnCounter < gameState.enemiesToSpawn) {
        gameState.timeSinceLastSpawn += deltaTime;
        if (gameState.timeSinceLastSpawn >= gameState.spawnInterval) {
            spawnEnemy();
            gameState.timeSinceLastSpawn = 0;
        }
    }

    // Update Game Objects
    gameState.enemies.forEach(enemy => {
        enemy.move(deltaTime);
        
        // Check if enemy reached end
        if (enemy.reachedEnd && !enemy.processed) {
            enemy.processed = true;
            gameState.health -= 1;
            updateUI();
            
            if (gameState.health <= 0) {
                endGame(false);
            }
        }
    });
    
    gameState.towers.forEach(tower => {
        tower.update(deltaTime, gameState.enemies, gameState.projectiles, createParticles);
    });
    
    gameState.projectiles.forEach(proj => proj.move(deltaTime));
    gameState.particles.forEach(p => p.update(deltaTime));
    gameState.floatingTexts.forEach(text => text.update(deltaTime));

    // Cleanup
    gameState.enemies = gameState.enemies.filter(enemy => !enemy.isDead);
    gameState.projectiles = gameState.projectiles.filter(proj => !proj.toRemove);
    gameState.particles = gameState.particles.filter(p => p.life > 0 && p.size >= 1);
    gameState.floatingTexts = gameState.floatingTexts.filter(text => text.life > 0);

    // Check Wave End
    if (gameState.state === 'wave_inprogress' && 
        gameState.enemies.length === 0 && 
        gameState.spawnCounter === gameState.enemiesToSpawn) {
        gameState.state = 'waiting';
        
        const { startWaveButton } = getUIElements();
        startWaveButton.disabled = false;
        
        const canvas = getCanvas();
        const bonus = 60 + gameState.wave * 6;
        gameState.money += bonus;
        
        // Create wave bonus effect - larger text with longer duration
        createFloatingText(
            canvas.width / 2, 
            canvas.height / 2 - 50, 
            `+${bonus}`, 
            '#ffdf00', // Vibrant gold
            32, // Much larger size
            4000 // Even longer duration
        );
        createFloatingText(
            canvas.width / 2, 
            canvas.height / 2 + 20, 
            `VLNA DOKONČENA!`, 
            '#ffffff', 
            32, 
            4000
        );
        
        // Create multiple coin effects in different locations
        for (let i = 0; i < 15; i++) {
            const x = canvas.width / 2 + (Math.random() - 0.5) * 300;
            const y = canvas.height / 2 + (Math.random() - 0.5) * 200;
            Particle.createGoldCoins(gameState, x, y, 8 + Math.floor(Math.random() * 8));
        }
        
        // Strong gold flash for wave bonus
        triggerScreenFlash('rgba(255, 215, 0, 0.35)', 0.35);
        
        updateUI();
        console.log(`Wave ${gameState.wave} Complete!`);
    }
}

// End the game (victory or defeat)
export function endGame(isVictory) {
    if (gameState.state === 'game_over' || gameState.state === 'victory') return;
    
    if (isVictory) {
        gameState.state = 'victory';
        const { victoryScreen } = getUIElements();
        victoryScreen.style.display = 'block';
        console.log("Victory!");
    } else {
        gameState.state = 'game_over';
        gameState.health = 0;
        const { gameOverScreen, finalWaveEl } = getUIElements();
        finalWaveEl.textContent = gameState.wave;
        gameOverScreen.style.display = 'block';
        console.log("Game Over!");
    }
    
    updateUI();
}

// Place tower on the grid
export function placeTower(gridX, gridY, towerType) {
    if (isValidPlacement(gameState.grid, gridX, gridY) && gameState.money >= towerTypes[towerType].cost) {
        const cost = towerTypes[towerType].cost;
        gameState.money -= cost;
        
        const newTower = new Tower(gridX, gridY, towerType);
        gameState.towers.push(newTower);
        gameState.grid[gridY][gridX].occupied = true;
        
        updateUI();
        return true;
    }
    return false;
}

// Update UI elements
export function updateUI() {
    const { waveEl, moneyEl, healthEl, selectedTowerTypeEl, towerButtons, startWaveButton } = getUIElements();
    
    // Update text displays
    waveEl.textContent = gameState.wave;
    moneyEl.textContent = gameState.money;
    healthEl.textContent = Math.max(0, gameState.health);
    
    // Update selected tower info
    if (gameState.selectedTowerType) {
        const stats = towerTypes[gameState.selectedTowerType];
        selectedTowerTypeEl.textContent = `${gameState.selectedTowerType.toUpperCase()} | Cena: ${stats.cost}$ | DMG: ${stats.damage} | Rychl.: ${stats.fireRate}ms | Dosah: ${stats.range}`;
    } else {
        selectedTowerTypeEl.textContent = 'Žádná';
    }
    
    // Update tower buttons
    towerButtons.forEach(button => {
        const type = button.dataset.type;
        const cost = parseInt(button.dataset.cost, 10);
        
        button.disabled = gameState.money < cost && gameState.selectedTowerType !== type;
        
        // Update button styling
        button.classList.remove('selected');
        if (button.dataset.type === gameState.selectedTowerType) {
            button.classList.add('selected');
        }
        
        // Add visual affordance
        if (gameState.money >= cost) {
            button.style.opacity = '1';
            button.title = `Cena: ${cost}$`;
        } else {
            button.style.opacity = '0.6';
            button.title = `Nedostatek prostředků (Cena: ${cost}$)`;
        }
    });
    
    // Update wave button
    startWaveButton.disabled = (
        gameState.state === 'wave_inprogress' || 
        gameState.state === 'game_over' || 
        gameState.state === 'victory'
    );
} 