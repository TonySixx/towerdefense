// Game Logic
import { MAX_WAVES, path, getUIElements, towerTypes, getCanvas, maps } from './constants.js';
import { createGrid, markPathOnGrid, isValidPlacement } from './utils.js';
import Enemy from './classes/Enemy.js';
import Tower from './classes/Tower.js';
import Particle from './classes/Particle.js';
import FloatingText from './classes/FloatingText.js';
import { triggerScreenFlash, updateScreenFlash } from './renderers.js';
import { enemyTypes, bossTypes, waveConfigurations } from './enemyTypes.js';

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
    // Nové vlastnosti pro systém vln
    currentWaveConfig: null,   // Konfigurace aktuální vlny
    enemyQueue: [],            // Fronta nepřátel, kteří mají být spawnováni (s typy a časováním)
    bossPending: false,        // Čekáme na spawn bosse
    bossConfig: null,          // Konfigurace bosse pro aktuální vlnu
    // Staré vlastnosti pro spawnování nepřátel
    enemiesToSpawn: 0,
    spawnCounter: 0,
    spawnInterval: 900,
    timeSinceLastSpawn: 0,
    lastTime: 0,
    // Vlastnosti pro různé mapy
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
    
    // Reset nových vlastností pro systém vln
    gameState.currentWaveConfig = null;
    gameState.enemyQueue = [];
    gameState.bossPending = false;
    gameState.bossConfig = null;
    
    // Reset starých vlastností
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

// Spawn new enemy - aktualizovaná metoda pro nový systém vln
export function spawnEnemy() {
    // Pokud je fronta prázdná, nekontrolujeme, zda je čas na bosse
    if (gameState.enemyQueue.length === 0) {
        // Pokud existuje boss pro tuto vlnu a všichni běžní nepřátelé byli spawnováni,
        // přidáme bosse
        if (gameState.bossPending && gameState.bossConfig) {
            const bossType = gameState.bossConfig.type;
            gameState.enemies.push(new Enemy(
                gameState.wave,
                gameState.enemyHealthModifier,
                bossType,
                true // je to boss
            ));
            gameState.bossPending = false;
            
            console.log(`Boss ${bossType} spawned in wave ${gameState.wave}!`);
            
            // Oznámení o spawnování bosse
            const canvas = getCanvas();
            triggerScreenFlash('rgba(255, 0, 0, 0.25)', 0.3); // Červený záblesk pro bosse
            createFloatingText(
                canvas.width / 2, 
                canvas.height / 2, 
                `BOSS PŘICHÁZÍ!`, 
                '#ff0000', 
                32, 
                4000
            );
        }
        return;
    }
    
    // Získáme další položku z fronty nepřátel
    const nextEnemy = gameState.enemyQueue.shift();
    gameState.enemies.push(new Enemy(
        gameState.wave,
        gameState.enemyHealthModifier,
        nextEnemy.type,
        false // není to boss
    ));
    
    // Aktualizujeme čítače pro zpětnou kompatibilitu
    gameState.spawnCounter++;
}

// Pomocná funkce pro vytvoření fronty nepřátel na základě konfigurace vlny
function prepareEnemyQueue(waveConfig) {
    const queue = [];
    
    // Zpracujeme všechny typy nepřátel definované v konfiguraci vlny
    for (const enemyGroup of waveConfig.enemies) {
        for (let i = 0; i < enemyGroup.count; i++) {
            queue.push({
                type: enemyGroup.type,
                spawnDelay: enemyGroup.spawnDelay
            });
        }
    }
    
    // Náhodně promícháme pořadí nepřátel (kromě bossů)
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    
    return queue;
}

// Start next wave - aktualizovaná metoda pro nový systém vln
export function startNextWave() {
    if (gameState.state !== 'waiting') return;
    
    gameState.wave++;
    if (gameState.wave > MAX_WAVES) {
        endGame(true);
        return;
    }
    
    // Nastavení stavu vlny
    gameState.state = 'wave_inprogress';
    
    // Získání konfigurace vlny
    const waveIndex = gameState.wave - 1; // pole je indexováno od 0
    
    if (waveIndex < waveConfigurations.length) {
        // Použití definované konfigurace vlny
        gameState.currentWaveConfig = waveConfigurations[waveIndex];
        gameState.enemyQueue = prepareEnemyQueue(gameState.currentWaveConfig);
        
        // Nastavení starých vlastností pro zpětnou kompatibilitu
        gameState.enemiesToSpawn = gameState.enemyQueue.length;
        gameState.spawnCounter = 0;
        
        // Kontrola, zda vlna obsahuje bosse
        if (gameState.currentWaveConfig.boss) {
            gameState.bossPending = true;
            gameState.bossConfig = gameState.currentWaveConfig.boss;
        } else {
            gameState.bossPending = false;
            gameState.bossConfig = null;
        }
    } else {
        // Fallback pro případ, že konfigurace vlny není definována
        // Použití původního systému generování nepřátel
        const enemyCount = Math.floor((8 + gameState.wave * 4) * gameState.waveModifier);
        gameState.enemiesToSpawn = enemyCount;
        gameState.spawnCounter = 0;
        
        // Vytvoření fronty standardních nepřátel
        gameState.enemyQueue = Array(enemyCount).fill().map(() => ({
            type: 'standard',
            spawnDelay: 900
        }));
        
        // Žádný boss
        gameState.bossPending = false;
        gameState.bossConfig = null;
    }
    
    // Nastavení časovače pro spawnování
    gameState.timeSinceLastSpawn = 0;
    
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

    // Enemy Spawning - upravená logika pro nový systém vln
    if (gameState.state === 'wave_inprogress') {
        gameState.timeSinceLastSpawn += deltaTime;
        
        // Kontrola, zda máme nepřátele ve frontě
        if (gameState.enemyQueue.length > 0) {
            const nextEnemyDelay = gameState.enemyQueue[0].spawnDelay;
            
            if (gameState.timeSinceLastSpawn >= nextEnemyDelay) {
                spawnEnemy();
                gameState.timeSinceLastSpawn = 0;
            }
        } 
        // Pokud je fronta prázdná, ale čekáme na bosse
        else if (gameState.bossPending && gameState.bossConfig) {
            if (gameState.timeSinceLastSpawn >= gameState.bossConfig.spawnDelay) {
                spawnEnemy(); // Tato funkce nyní zpracovává i spawnování bossů
                gameState.timeSinceLastSpawn = 0;
            }
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

    // Check Wave End - upravená logika pro kontrolu konce vlny
    if (gameState.state === 'wave_inprogress' && 
        gameState.enemies.length === 0 && 
        gameState.enemyQueue.length === 0 &&
        !gameState.bossPending) {
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