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
    selectedTower: null, // Vybraná věž pro upgrade/prodej
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
                `BOSS IS COMING!`, 
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
            `WAVE COMPLETED!`, 
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

// Funkce pro výběr věže
export function selectTower(tower) {
    // Nejprve zrušíme výběr u všech věží
    cancelSelection();
    
    // Nastavíme vybranou věž
    gameState.selectedTower = tower;
    tower.setSelected(true);
    
    // Deaktivujeme umisťování věží
    gameState.placingTower = false;
    gameState.selectedTowerType = null;
    
    // Aktualizujeme UI
    updateTowerActionUI();
}

// Funkce pro vylepšení vybrané věže
export function upgradeTower() {
    if (!gameState.selectedTower) return false;
    
    const tower = gameState.selectedTower;
    const upgradePrice = tower.getUpgradePrice();
    
    // Kontrola, zda má hráč dostatek peněz a věž lze vylepšit
    if (gameState.money >= upgradePrice && tower.canUpgrade()) {
        // Odečtení peněz
        gameState.money -= upgradePrice;
        
        // Vylepšení věže
        const success = tower.upgrade();
        
        if (success) {
            // Efekt vylepšení
            createParticles(tower.x, tower.y, '#4caf50', 15, 3, 500, 5);
            createFloatingText(
                tower.x, 
                tower.y - 20, 
                'UPGRADED', 
                '#4caf50', 
                20, 
                2000
            );
            
            // Zvukový efekt nebo další vizuální prvky by mohly být přidány zde
            
            // Aktualizace UI
            updateTowerActionUI();
            return true;
        }
    }
    
    return false;
}

// Funkce pro prodej vybrané věže
export function sellTower() {
    if (!gameState.selectedTower) return false;
    
    const tower = gameState.selectedTower;
    const sellValue = tower.getSellValue();
    
    // Přidání peněz hráči
    gameState.money += sellValue;
    
    // Nalezení indexu věže v poli věží
    const towerIndex = gameState.towers.findIndex(t => t === tower);
    
    if (towerIndex !== -1) {
        // Vytvoření efektu při prodeji
        createParticles(tower.x, tower.y, '#f44336', 15, 3, 500, 5);
        createFloatingText(
            tower.x, 
            tower.y - 20, 
            `+${sellValue}`, 
            '#ffea00', 
            20, 
            2000
        );
        
        // Odstranění věže z pole
        gameState.towers.splice(towerIndex, 1);
        
        // Uvolnění pole na gridu
        gameState.grid[tower.gridY][tower.gridX].occupied = false;
        
        // Zrušení výběru
        cancelSelection();
        
        // Aktualizace UI
        updateUI();
        return true;
    }
    
    return false;
}

// Funkce pro zrušení výběru
export function cancelSelection() {
    // Zrušíme výběr u všech věží
    for (const tower of gameState.towers) {
        tower.setSelected(false);
        tower.setUpgrading(false);
        tower.setSelling(false);
    }
    
    // Zrušíme vybranou věž
    gameState.selectedTower = null;
    
    // Skryjeme panel akcí věže
    const { towerActionsPanel } = getUIElements();
    towerActionsPanel.style.display = 'none';
}

// Funkce pro aktualizaci UI akcí věže
function updateTowerActionUI() {
    const tower = gameState.selectedTower;
    if (!tower) {
        return cancelSelection();
    }
    
    const { 
        towerActionsPanel, detailType, detailLevel, detailDamage, detailFireRate, detailRange,
        towerUpgradeInfo, upgradeLevel, upgradeDamage, upgradeFireRate, upgradeRange, upgradeSpecial, upgradePrice,
        upgradeTowerButton, upgradeCost, sellTowerButton, sellValue
    } = getUIElements();
    
    // Zobrazíme panel akcí
    towerActionsPanel.style.display = 'block';
    
    // Název věže a úroveň
    const towerTypeName = towerTypes[tower.type].name;
    detailType.textContent = towerTypeName;
    detailLevel.textContent = tower.level;
    
    // Aktualizace indikátoru úrovně - level dots
    const levelDots = document.querySelectorAll('.level-dot');
    levelDots.forEach(dot => {
        const dotLevel = parseInt(dot.getAttribute('data-level'));
        dot.classList.remove('active', 'current');
        
        // Aktivní tečky pro všechny dosažené úrovně
        if (dotLevel <= tower.level) {
            dot.classList.add('active');
        }
        
        // Označení současné úrovně
        if (dotLevel === tower.level) {
            dot.classList.add('current');
        }
    });
    
    // Přidání třídy pro maximální úroveň
    const levelIndicator = document.querySelector('.level-indicator');
    if (tower.level === 3) { // max úroveň je 3
        levelIndicator.classList.add('level-max');
    } else {
        levelIndicator.classList.remove('level-max');
    }
    
    // Aktuální statistiky
    detailDamage.textContent = tower.damage;
    detailFireRate.textContent = `${tower.fireRate}ms`;
    detailRange.textContent = tower.range;
    
    // Prodejní hodnota
    sellValue.textContent = tower.getSellValue();
    
    // Informace o vylepšení
    if (tower.canUpgrade()) {
        const nextLevel = tower.level + 1;
        const nextLevelData = towerTypes[tower.type].levels[nextLevel - 1];
        
        towerUpgradeInfo.style.display = 'block';
        upgradeLevel.textContent = nextLevel;
        upgradeDamage.textContent = nextLevelData.damage;
        upgradeFireRate.textContent = `${nextLevelData.fireRate}ms`;
        upgradeRange.textContent = nextLevelData.range;
        
        // Zobrazení speciálních efektů pro další úroveň
        let specialText = '';
        if (nextLevelData.extraFeatures) {
            if (nextLevelData.extraFeatures.doubleBarrel) {
                specialText += 'Double Barrel, ';
            }
            if (nextLevelData.extraFeatures.metallic) {
                specialText += 'Metallic Construction, ';
            }
            if (nextLevelData.extraFeatures.criticalChance) {
                specialText += `${nextLevelData.extraFeatures.criticalChance * 100}% chance of critical hit, `;
            }
            if (nextLevelData.extraFeatures.laserBeam) {
                specialText += 'Laser Beam, ';
            }
            if (nextLevelData.extraFeatures.dualBeam) {
                specialText += 'Dual Beam, ';
            }
            if (nextLevelData.extraFeatures.burnEffect) {
                specialText += 'Burning Effect, ';
            }
            if (nextLevelData.extraFeatures.scope) {
                specialText += 'Scope, ';
            }
            if (nextLevelData.extraFeatures.armorPiercing) {
                specialText += `${nextLevelData.extraFeatures.armorPiercing * 100}% ignoring armor, `;
            }
            if (nextLevelData.extraFeatures.headshotChance) {
                specialText += `${nextLevelData.extraFeatures.headshotChance * 100}% chance of headshot, `;
            }
            // Přidání speciálních efektů pro railgun
            if (nextLevelData.extraFeatures.chainLightning) {
                specialText += `Chain Lightning (${nextLevelData.extraFeatures.chainLightning.damage} damage, ${nextLevelData.extraFeatures.chainLightning.targets} targets), `;
            }
            if (nextLevelData.extraFeatures.homingEffect) {
                specialText += `Homing Projectiles, `;
            }
            
            // Odstranění poslední čárky a mezery
            specialText = specialText.replace(/, $/, '');
        }
        
        upgradeSpecial.textContent = specialText || 'None';
        upgradePrice.textContent = `${tower.getUpgradePrice()}`;
        upgradeCost.textContent = tower.getUpgradePrice();
        
        // Aktivace tlačítka pro upgrade, pokud má hráč dostatek peněz
        upgradeTowerButton.disabled = gameState.money < tower.getUpgradePrice();
    } else {
        // Skrytí informací o vylepšení, pokud věž nemůže být vylepšena
        towerUpgradeInfo.style.display = 'none';
        upgradeTowerButton.disabled = true;
        upgradeCost.textContent = "MAX";
    }
}

// Place tower on the grid
export function placeTower(gridX, gridY, towerType) {
    // Zrušení případného výběru věže
    cancelSelection();
    
    if (isValidPlacement(gameState.grid, gridX, gridY) && gameState.money >= towerTypes[towerType].cost) {
        const cost = towerTypes[towerType].cost;
        gameState.money -= cost;
        
        const newTower = new Tower(gridX, gridY, towerType);
        gameState.towers.push(newTower);
        gameState.grid[gridY][gridX].occupied = true;
        
        // Vytvoření efektu při umístění
        createParticles(newTower.x, newTower.y, '#4caf50', 10, 3, 500, 4);
        
        updateUI();
        return true;
    }
    return false;
}

// Update UI elements
export function updateUI() {
    const { waveEl, moneyEl, healthEl, selectedTowerTypeEl, towerButtons, startWaveButton, waveProgressBar, waveProgressText } = getUIElements();
    
    // Update text displays
    waveEl.textContent = gameState.wave;
    moneyEl.textContent = gameState.money;
    healthEl.textContent = Math.max(0, gameState.health);
    
    // Aktualizace progress baru pro vlnu
    if (gameState.state === 'wave_inprogress') {
        // Vypočet postupu vlny na základě počtu zbývajících nepřátel ke spawnování a celkového počtu nepřátel
        const totalEnemies = gameState.enemiesToSpawn;
        const enemiesLeft = totalEnemies - gameState.spawnCounter + gameState.enemies.length;
        const progress = totalEnemies > 0 ? Math.max(0, Math.min(100, 100 - (enemiesLeft / totalEnemies * 100))) : 0;
        
        waveProgressBar.style.width = `${progress}%`;
        waveProgressText.textContent = `Wave ${gameState.wave} Progress: ${Math.round(progress)}%`;

        // Přidání barevného přechodu podle postupu
        if (progress < 30) {
            waveProgressBar.style.background = 'linear-gradient(to right, #f44336, #ff9800)';
        } else if (progress < 70) {
            waveProgressBar.style.background = 'linear-gradient(to right, #ff9800, #ffc107)';
        } else {
            waveProgressBar.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
        }
    } else if (gameState.state === 'waiting') {
        // Když je vlna dokončena nebo hra ještě nezačala
        waveProgressBar.style.width = '100%';
        waveProgressBar.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
        waveProgressText.textContent = gameState.wave === 0 ? 'Start First Wave' : `Wave ${gameState.wave} Complete!`;
    } else if (gameState.state === 'game_over') {
        waveProgressBar.style.width = '100%';
        waveProgressBar.style.background = 'linear-gradient(to right, #f44336, #d32f2f)';
        waveProgressText.textContent = 'Game Over';
    } else if (gameState.state === 'victory') {
        waveProgressBar.style.width = '100%';
        waveProgressBar.style.background = 'linear-gradient(to right, #4CAF50, #2e7d32)';
        waveProgressText.textContent = 'Victory!';
    }
    
    // Update selected tower info
    if (gameState.selectedTowerType) {
        const stats = towerTypes[gameState.selectedTowerType];
        selectedTowerTypeEl.textContent = `${gameState.selectedTowerType.toUpperCase()} | Cost: ${stats.cost}$ | DMG: ${stats.damage} | Rate: ${stats.fireRate}ms | Range: ${stats.range}`;
    } else {
        selectedTowerTypeEl.textContent = 'None';
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
            button.title = `Cost: ${cost}$`;
        } else {
            button.style.opacity = '0.6';
            button.title = `Insufficient funds (Cost: ${cost}$)`;
        }
    });
    
    // Update wave button
    startWaveButton.disabled = (
        gameState.state === 'wave_inprogress' || 
        gameState.state === 'game_over' || 
        gameState.state === 'victory'
    );
    
    // Aktualizace UI pro akce s věží
    if (gameState.selectedTower) {
        updateTowerActionUI();
    }
} 