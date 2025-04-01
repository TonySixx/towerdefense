const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const waveEl = document.getElementById('wave');
const moneyEl = document.getElementById('money');
const healthEl = document.getElementById('health');
const startWaveButton = document.getElementById('startWaveButton');
const towerButtons = document.querySelectorAll('.tower-button');
const gameOverScreen = document.getElementById('game-over');
const victoryScreen = document.getElementById('victory');
const finalWaveEl = document.getElementById('final-wave');
const selectedTowerTypeEl = document.getElementById('selected-tower-type');

// Game Settings
const TILE_SIZE = 40;
const ROWS = canvas.height / TILE_SIZE;
const COLS = canvas.width / TILE_SIZE;
const MAX_WAVES = 15;

// Game State ... (přidáme pole pro particles)
let money = 100;
let health = 20;
let wave = 0;
let enemies = [];
let towers = [];
let projectiles = [];
let particles = []; // <--- Nové pole pro efekty
let selectedTowerType = null;
let placingTower = false;
let mouse = { x: 0, y: 0, gridX: 0, gridY: 0 }; // <--- Přidány gridX/Y pro jistotu
let grid = createGrid();
let gameState = 'waiting';
let enemiesToSpawn = 0;
let spawnCounter = 0;
let spawnInterval = 900; // Mírně rychlejší spawn?
let timeSinceLastSpawn = 0;
let lastTime = 0;

// --- Path Definition (Grid coordinates) ---
// Simple S-shaped path for example
const path = [
    { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 4 },
    { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 4 },
    { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
    { x: 8, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
    { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
    { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 }, { x: 18, y: 9 }, { x: 19, y: 9 } // End point off-screen right
];
markPathOnGrid();

// --- Tower Definitions ---
// Tower Definitions - ZVÝŠENÍ RYCHLOSTI PROJEKTILŮ a přidání detailů pro kreslení
const towerTypes = {
    gun: {
        cost: 50, range: 110, damage: 12, fireRate: 450, projectileSpeed: 8, // Zvýšená rychlost
        colorBase: '#607d8b', colorTop: '#b0bec5', colorGun: '#455a64', // Více barev
        projectileColor: '#ffffff', projectileSize: 4
    },
    laser: {
        cost: 75, range: 130, damage: 8, fireRate: 300, projectileSpeed: 12, // Zvýšená rychlost, mírně nižší damage, vyšší fire rate
        colorBase: '#d32f2f', colorTop: '#ffcdd2', colorGun: '#b71c1c',
        projectileColor: '#ff8a80', projectileSize: 5 // Větší, jiná barva
    },
    sniper: {
        cost: 100, range: 220, damage: 45, fireRate: 1800, projectileSpeed: 18, // Zvýšená rychlost a dosah
        colorBase: '#388e3c', colorTop: '#c8e6c9', colorGun: '#1b5e20',
        projectileColor: '#a5d6a7', projectileSize: 3 // Menší, rychlý projektil
    }
};

// --- Utility Functions ---
function createGrid() {
    const g = [];
    for (let y = 0; y < ROWS; y++) {
        g[y] = [];
        for (let x = 0; x < COLS; x++) {
            g[y][x] = { occupied: false, isPath: false }; // 0: empty, 1: tower, 2: path
        }
    }
    return g;
}

function markPathOnGrid() {
    path.forEach(point => {
        if (point.x >= 0 && point.x < COLS && point.y >= 0 && point.y < ROWS) {
            grid[point.y][point.x].isPath = true;
            grid[point.y][point.x].occupied = true; // Cannot build on path
        }
    });
}

function getGridCoords(canvasX, canvasY) {
    return {
        x: Math.floor(canvasX / TILE_SIZE),
        y: Math.floor(canvasY / TILE_SIZE)
    };
}

// Utility Functions ... (getCanvasCoords nyní vrací jen x,y - oprava)
function getCanvasCoords(gridX, gridY) {
    return {
       x: gridX * TILE_SIZE + TILE_SIZE / 2,
       y: gridY * TILE_SIZE + TILE_SIZE / 2
   };
}

function isValidPlacement(gridX, gridY) {
    return gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS &&
           !grid[gridY][gridX].occupied && !grid[gridY][gridX].isPath;
}

function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

// --- Nová třída pro částicové efekty ---
class Particle {
    constructor(x, y, color, size, speed, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * size + 2; // Random size variation
        this.initialLife = life;
        this.life = life; // Lifespan in milliseconds
        this.vx = (Math.random() - 0.5) * speed; // Random velocity x
        this.vy = (Math.random() - 0.5) * speed; // Random velocity y
        this.gravity = 0.05; // Slight downward pull
        this.alpha = 1;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) return;

        this.x += this.vx * (deltaTime / 16); // Normalize speed slightly
        this.y += this.vy * (deltaTime / 16);
        this.vy += this.gravity; // Apply gravity
        this.alpha = Math.max(0, this.life / this.initialLife); // Fade out
        this.size *= 0.98; // Shrink slightly
    }

    draw(ctx) {
        if (this.life <= 0 || this.size < 1) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha
    }
}


// --- Game Objects ---
class Tower {
    constructor(gridX, gridY, type) {
        // ... (základní properties beze změny) ...
        this.gridX = gridX;
        this.gridY = gridY;
        const canvasCoords = getCanvasCoords(gridX, gridY);
        this.x = canvasCoords.x;
        this.y = canvasCoords.y;
        this.type = type;
        this.stats = { ...towerTypes[type] }; // Kopie pro případné modifikace
        this.range = this.stats.range;
        this.damage = this.stats.damage;
        this.fireRate = this.stats.fireRate;
        this.cooldown = 0;
        this.target = null;
        this.projectileSpeed = this.stats.projectileSpeed;
        this.projectileColor = this.stats.projectileColor;
        this.projectileSize = this.stats.projectileSize; // Nové

        // Pro animaci střelby
        this.shootAnimTimer = 0;
        this.shootAnimDuration = 100; // ms
        this.angle = 0; // Angle towards target
    }

    findTarget() {
        // ... (logika hledání cíle beze změny) ...
         this.target = null;
         let closestDist = this.range + 1;

         for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.range && dist < closestDist) {
                 this.target = enemy;
                 closestDist = dist;
            }
         }
         // Keep targeting?
         if (this.target && (this.target.isDead || distance(this.x, this.y, this.target.x, this.target.y) > this.range)) {
            this.target = null;
         }
         // Find new if needed
          if (!this.target) {
             closestDist = this.range + 1;
             for (const enemy of enemies) {
                 if (enemy.isDead) continue;
                 const dist = distance(this.x, this.y, enemy.x, enemy.y);
                 if (dist <= this.range && dist < closestDist) {
                     this.target = enemy;
                     closestDist = dist;
                 }
             }
         }
    }

    shoot(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        // Update angle even if not shooting, if target exists
        if (this.target) {
             const dx = this.target.x - this.x;
             const dy = this.target.y - this.y;
             this.angle = Math.atan2(dy, dx);
        } else {
            // Optional: Reset angle or keep last known? Resetting looks cleaner.
            // this.angle = -Math.PI / 2; // Point upwards when idle
        }


        if (this.cooldown <= 0 && this.target && !this.target.isDead) {
            // Calculate spawn position at the tip of the gun based on angle
            const gunLength = TILE_SIZE * 0.4;
            const projStartX = this.x + Math.cos(this.angle) * gunLength;
            const projStartY = this.y + Math.sin(this.angle) * gunLength;

            projectiles.push(new Projectile(projStartX, projStartY, this.target, this.damage, this.projectileSpeed, this.projectileColor, this.projectileSize));
            this.cooldown = this.fireRate;
            this.shootAnimTimer = this.shootAnimDuration; // Start shoot animation

            // Muzzle flash particle effect
            createParticles(projStartX, projStartY, this.projectileColor, 1, 3, 200, 3); // (x, y, color, num, speed, life, size)
        }
    }

    update(deltaTime) {
         if (this.shootAnimTimer > 0) {
            this.shootAnimTimer -= deltaTime;
         }
        this.findTarget();
        this.shoot(deltaTime);
    }

    draw(ctx) {
        const baseRadius = TILE_SIZE * 0.4;
        const topRadius = TILE_SIZE * 0.3;
        const gunLength = TILE_SIZE * 0.45;
        const gunWidth = TILE_SIZE * 0.15;

        const shootOffset = this.shootAnimTimer > 0 ? Math.sin((this.shootAnimDuration - this.shootAnimTimer) / this.shootAnimDuration * Math.PI) * 3 : 0; // Recoil effect

        ctx.save(); // Save context state
        ctx.translate(this.x, this.y); // Move origin to tower center
        ctx.rotate(this.angle + Math.PI / 2); // Rotate tower to face target (add PI/2 because 0 angle is right)

        // Base gradient
        const baseGrad = ctx.createLinearGradient(0, -baseRadius, 0, baseRadius);
        baseGrad.addColorStop(0, this.stats.colorTop); // Lighter top
        baseGrad.addColorStop(1, this.stats.colorBase); // Darker base

        // Base Circle
        ctx.fillStyle = baseGrad;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333'; // Outline
        ctx.lineWidth = 1;
        ctx.stroke();

        // Gun Barrel (rectangle) - Apply recoil offset here
        const gunX = -gunWidth / 2;
        const gunY = -topRadius - shootOffset; // Apply offset upwards relative to rotated tower

        ctx.fillStyle = this.stats.colorGun;
        ctx.fillRect(gunX, gunY, gunWidth, -gunLength); // Negative height to draw upwards

        // Barrel Tip / Detail
        ctx.fillStyle = this.stats.colorTop;
        ctx.fillRect(gunX - 1, gunY - gunLength - 2, gunWidth + 2, 4); // Small horizontal bar at the end

        ctx.restore(); // Restore context state (translation, rotation)

         // Draw range when placing (modified for clarity)
         if (placingTower && selectedTowerType === this.type && mouse.gridX === this.gridX && mouse.gridY === this.gridY) {
             ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)'; // Light semi-transparent white
             ctx.lineWidth = 2;
             ctx.setLineDash([5, 5]); // Dashed line for range
             ctx.beginPath();
             ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
             ctx.stroke();
             ctx.setLineDash([]); // Reset line dash
         }
    }
}
class Enemy {
    constructor(waveNum) {
        // ... (properties mostly unchanged) ...
        this.pathIndex = 0;
        const startPos = getCanvasCoords(path[0].x, path[0].y);
        this.x = startPos.x;
        this.y = startPos.y;
        this.baseHealth = 60; // Slightly higher base health
        this.healthGrowth = 1.22;
        this.maxHealth = Math.floor(this.baseHealth * Math.pow(this.healthGrowth, waveNum -1));
        this.health = this.maxHealth;
        this.speed = 60 + (waveNum * 2.5); // Pixels per second
        this.value = 5 + waveNum;
        this.size = TILE_SIZE * 0.35 + Math.random() * 3; // Slight size variation
        this.color = '#e56b6f'; // Enemy base color (reddish)
        this.darkerColor = '#b54d4f'; // Darker version for gradient/low health
        this.isDead = false;
        this.reachedEnd = false;
        // Pulsation effect
        this.pulseTimer = Math.random() * 1000;
        this.pulseSpeed = 800 + Math.random() * 400; // ms per cycle
    }

    move(deltaTime) {
        // ... (movement logic beze změny) ...
        if (this.isDead || this.reachedEnd) return;
        const targetPathPointIndex = this.pathIndex + 1;
        if (targetPathPointIndex >= path.length) {
            this.reachedEnd = true;
            health -= 1;
            this.isDead = true;
            updateUI();
            if (health <= 0) {
                endGame(false);
            }
            return;
        }
        const targetGridPos = path[targetPathPointIndex];
        const targetCanvasPos = getCanvasCoords(targetGridPos.x, targetGridPos.y);
        const dx = targetCanvasPos.x - this.x;
        const dy = targetCanvasPos.y - this.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        const moveDistance = this.speed * (deltaTime / 1000);
        if (distToTarget <= moveDistance) {
            this.x = targetCanvasPos.x;
            this.y = targetCanvasPos.y;
            this.pathIndex++;
        } else {
            this.x += (dx / distToTarget) * moveDistance;
            this.y += (dy / distToTarget) * moveDistance;
        }
         // Update pulse timer
        this.pulseTimer += deltaTime;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.isDead) {
            this.isDead = true;
            money += this.value;
            updateUI();
            // Create death explosion particles
            createParticles(this.x, this.y, this.color, 15, 4, 500, this.size * 0.5);
        } else if (!this.isDead) {
             // Create small hit particle effect
             createParticles(this.x + (Math.random()-0.5)*this.size, this.y + (Math.random()-0.5)*this.size, '#ffffff', 1, 2, 150, 2);
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        const healthPercent = this.health / this.maxHealth;

        // Pulsation effect
        const pulseFactor = 1.0 + Math.sin(this.pulseTimer / this.pulseSpeed * Math.PI * 2) * 0.05;
        const currentSize = this.size * pulseFactor;


        // Gradient based on health
        const grad = ctx.createRadialGradient(this.x, this.y, currentSize * 0.1, this.x, this.y, currentSize);
        const midColor = lerpColor(this.darkerColor, this.color, healthPercent); // Interpolate color based on health
        grad.addColorStop(0, this.color); // Center color (lighter)
        grad.addColorStop(1, midColor); // Outer color (darker, gets darker with less health)

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Draw a slightly more complex shape (rounded square or similar)
        // Simple circle for now, can be complexified
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Optional: Add a subtle outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();


        // Health bar (improved look)
        const healthBarWidth = Math.max(15, this.size * 1.2);
        const healthBarHeight = 4;
        const healthBarX = this.x - healthBarWidth / 2;
        const healthBarY = this.y - currentSize - healthBarHeight - 3;
        const currentHealthWidth = healthBarWidth * healthPercent;

        ctx.fillStyle = '#333'; // Dark background for bar
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        // Gradient for health fill
        const healthGrad = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth, healthBarY);
        healthGrad.addColorStop(0, '#f44336'); // Red (low health)
        healthGrad.addColorStop(0.5, '#ffeb3b'); // Yellow (mid health)
        healthGrad.addColorStop(1, '#4caf50'); // Green (full health)
        ctx.fillStyle = healthGrad;
        ctx.fillRect(healthBarX, healthBarY, Math.max(0, currentHealthWidth), healthBarHeight);
        // Add a small border to the health bar
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
}

// Helper function to interpolate colors
function lerpColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    if (!c1 || !c2) return color2; // Fallback

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


class Projectile {
    constructor(startX, startY, targetEnemy, damage, speed, color, size) { // Added size
        this.x = startX;
        this.y = startY;
        this.target = targetEnemy;
        this.damage = damage;
        this.speed = speed * 10; // Speed already adjusted in towerTypes, keep multiplier
        this.color = color;
        this.size = size; // Use specific size
        this.toRemove = false;
         // For trail effect
         this.trail = [];
         this.trailLength = 5;
    }

     move(deltaTime) {
         // Add current position to trail
         this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
         if (this.trail.length > this.trailLength) {
             this.trail.shift(); // Remove oldest point
         }
          // Update alpha for trail fade
          for (let i = 0; i < this.trail.length; i++) {
              this.trail[i].alpha = (i + 1) / this.trailLength;
          }


        if (this.toRemove || !this.target || this.target.isDead || this.target.reachedEnd) {
            // If target is lost, continue in the last known direction for a bit? Or just remove.
             this.toRemove = true; // Simple removal for now
             return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const moveDistance = this.speed * (deltaTime / 1000);

        // Use a slightly larger hit radius based on target size
        const hitRadius = (this.target.size || TILE_SIZE * 0.4) * 0.8;

        if (dist <= moveDistance || dist < hitRadius) { // Adjusted hit condition
            this.hitTarget();
        } else {
            this.x += (dx / dist) * moveDistance;
            this.y += (dy / dist) * moveDistance;
        }
    }

    hitTarget() {
        if (!this.toRemove && this.target && !this.target.isDead) {
            this.target.takeDamage(this.damage);
            this.toRemove = true;
            // Create impact particles
            createParticles(this.x, this.y, this.color, 5, 3, 300, this.size * 0.8);
        }
    }

    draw(ctx) {
         // Draw trail first (older points are more transparent)
         for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.globalAlpha = point.alpha * 0.5; // Make trail semi-transparent
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Trail points shrink
            ctx.arc(point.x, point.y, this.size * point.alpha * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0; // Reset alpha for main projectile

        // Draw main projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Optional: Add a brighter core/outline
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
         ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- Game Logic ---
// Helper function to create particles
function createParticles(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, size, speed, life));
    }
}


function spawnEnemy() {
    // ... (beze změny) ...
    if (enemiesToSpawn > 0 && spawnCounter < enemiesToSpawn) {
        enemies.push(new Enemy(wave));
        spawnCounter++;
    }
}

function startNextWave() {
    // ... (beze změny) ...
    if (gameState !== 'waiting') return;
   wave++;
   if (wave > MAX_WAVES) {
       endGame(true);
       return;
   }
   gameState = 'wave_inprogress';
   enemiesToSpawn = 8 + wave * 4; // Adjusted enemy count slightly
   spawnCounter = 0;
   timeSinceLastSpawn = spawnInterval;
   updateUI();
   startWaveButton.disabled = true;
   console.log(`Starting Wave ${wave}`);
}

function update(deltaTime) {
   if (gameState === 'game_over' || gameState === 'victory') return;

   // --- Enemy Spawning ---
   if (gameState === 'wave_inprogress' && spawnCounter < enemiesToSpawn) {
       timeSinceLastSpawn += deltaTime;
       if (timeSinceLastSpawn >= spawnInterval) {
           spawnEnemy();
           timeSinceLastSpawn = 0;
       }
   }

   // --- Update Game Objects ---
   enemies.forEach(enemy => enemy.move(deltaTime));
   towers.forEach(tower => tower.update(deltaTime));
   projectiles.forEach(proj => proj.move(deltaTime));
   particles.forEach(p => p.update(deltaTime)); // <-- Update particles

   // --- Cleanup ---
   enemies = enemies.filter(enemy => !enemy.isDead);
   projectiles = projectiles.filter(proj => !proj.toRemove);
   particles = particles.filter(p => p.life > 0 && p.size >= 1); // <-- Cleanup particles

   // --- Check Wave End ---
   if (gameState === 'wave_inprogress' && enemies.length === 0 && spawnCounter === enemiesToSpawn) {
       gameState = 'waiting';
       startWaveButton.disabled = false;
       money += 60 + wave * 6; // Slightly increased wave bonus
       updateUI();
       console.log(`Wave ${wave} Complete!`);
   }
}



function drawBackground(ctx) {
    // Simple gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#3a3d4a'); // Darker top
    bgGrad.addColorStop(1, '#2a2d34'); // Lighter bottom (matches canvas bg)
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid(ctx) { // Subtle grid for placement guidance
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; // Very faint white lines
    ctx.lineWidth = 1;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
             // Only draw lines for buildable tiles? Maybe too complex. Draw all faint.
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawPath(ctx) {
    if (path.length < 2) return;

    // Path Gradient
    const pathGrad = ctx.createLinearGradient(0, 0, canvas.width, 0); // Horizontal gradient
    pathGrad.addColorStop(0, '#5c5c7a'); // Start color
    pathGrad.addColorStop(0.5, '#6b6b8a'); // Middle color
    pathGrad.addColorStop(1, '#5c5c7a'); // End color


    ctx.strokeStyle = pathGrad; // Use gradient for stroke
    ctx.lineWidth = TILE_SIZE * 0.7; // Slightly narrower path width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.8; // Make path slightly transparent

    ctx.beginPath();
    const startPos = getCanvasCoords(path[0].x, path[0].y);
    ctx.moveTo(startPos.x, startPos.y);
    for (let i = 1; i < path.length; i++) {
        const pos = getCanvasCoords(path[i].x, path[i].y);
        ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0; // Reset alpha
}


function drawPlacementPreview(ctx) {
    if (placingTower && selectedTowerType) {
        const gridX = mouse.gridX;
        const gridY = mouse.gridY;
        if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return; // Out of bounds

        const stats = towerTypes[selectedTowerType];
        const canPlace = isValidPlacement(gridX, gridY) && money >= stats.cost;

        const previewCenterX = gridX * TILE_SIZE + TILE_SIZE / 2;
        const previewCenterY = gridY * TILE_SIZE + TILE_SIZE / 2;

        // Draw range indicator first (below tower preview)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = canPlace ? 'rgba(144, 238, 144, 0.3)' : 'rgba(255, 99, 71, 0.3)'; // Light green / tomato red
        ctx.beginPath();
        ctx.arc(previewCenterX, previewCenterY, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw semi-transparent tower preview using the Tower's draw logic (simplified)
        ctx.globalAlpha = 0.6;
         // Simplified drawing based on Tower draw logic elements
         const baseRadius = TILE_SIZE * 0.4;
         const gunLength = TILE_SIZE * 0.45;
         const gunWidth = TILE_SIZE * 0.15;

         ctx.save();
         ctx.translate(previewCenterX, previewCenterY);
         // Base Circle
         ctx.fillStyle = stats.colorBase;
         ctx.beginPath();
         ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
         ctx.fill();
         // Gun Barrel (pointing up as default preview)
         ctx.fillStyle = stats.colorGun;
         ctx.fillRect(-gunWidth / 2, -baseRadius, gunWidth, -gunLength);
         ctx.restore();
        ctx.globalAlpha = 1.0;

        // Draw placement valid/invalid border for the tile
        ctx.strokeStyle = canPlace ? 'rgba(144, 238, 144, 0.9)' : 'rgba(255, 99, 71, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX * TILE_SIZE, gridY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}


function draw() {
    // Clear canvas (not needed if drawing background every frame)
    // ctx.fillStyle = '#222';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground(ctx);

    // Draw grid (optional, keep it subtle)
    drawGrid(ctx);

    // Draw path
    drawPath(ctx);

    // Draw game objects
    towers.forEach(tower => tower.draw(ctx));
    projectiles.forEach(proj => proj.draw(ctx));
    enemies.forEach(enemy => enemy.draw(ctx));
    particles.forEach(p => p.draw(ctx)); // <-- Draw particles

    // Draw placement preview (must be drawn after towers/enemies)
    drawPlacementPreview(ctx);
}

// --- UI Update ---
function updateUI() {
    // ... (Logika pro wave, money, health beze změny) ...
    waveEl.textContent = wave;
    moneyEl.textContent = money;
    healthEl.textContent = Math.max(0, health);

     // Update selected tower info text more clearly
     if(selectedTowerType) {
         const stats = towerTypes[selectedTowerType];
         selectedTowerTypeEl.textContent = `${selectedTowerType.toUpperCase()} | Cena: ${stats.cost}$ | DMG: ${stats.damage} | Rychl.: ${stats.fireRate}ms | Dosah: ${stats.range}`;
     } else {
         selectedTowerTypeEl.textContent = 'Žádná';
     }


    // Update tower button disabled state based on cost
    towerButtons.forEach(button => {
        const cost = parseInt(button.dataset.cost, 10);
        button.disabled = money < cost && selectedTowerType !== button.dataset.type; // Disable if cannot afford, unless it's already selected

        button.classList.remove('selected');
        if (button.dataset.type === selectedTowerType) {
            button.classList.add('selected');
        }
        // Add visual cue if player *can* afford it
        if(money >= cost) {
            button.style.opacity = '1';
             button.title = `Cena: ${cost}$`; // Tooltip with cost
        } else {
             button.style.opacity = '0.6';
             button.title = `Nedostatek prostředků (Cena: ${cost}$)`;
        }

    });

    startWaveButton.disabled = (gameState === 'wave_inprogress' || gameState === 'game_over' || gameState === 'victory');
}

// --- Game Loop & Event Listeners & Init --- (Beze změny v logice, jen přidání particles)

function endGame(isVictory) {
    // ... (beze změny) ...
     if (gameState === 'game_over' || gameState === 'victory') return;
    if (isVictory) {
        gameState = 'victory';
        victoryScreen.style.display = 'block';
        console.log("Victory!");
    } else {
        gameState = 'game_over';
        health = 0;
        finalWaveEl.textContent = wave;
        gameOverScreen.style.display = 'block';
        console.log("Game Over!");
    }
     updateUI();
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp; // Initialize lastTime on first frame
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Skip update/draw if deltaTime is excessive (e.g., tab was inactive)
    // or if game hasn't started properly
     if (deltaTime <= 0 || deltaTime > 200) { // Avoid large jumps or zero/negative delta
        requestAnimationFrame(gameLoop);
        return;
     }

     // Handle game states where update/draw might stop or change
     if (gameState === 'game_over' || gameState === 'victory') {
         draw(); // Keep drawing the final state + overlay
         requestAnimationFrame(gameLoop);
         return;
     }


    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Event Listeners (mousemove, click, button clicks) - Logika zůstává stejná
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.gridX = Math.floor(mouse.x / TILE_SIZE);
    mouse.gridY = Math.floor(mouse.y / TILE_SIZE);
});

canvas.addEventListener('click', () => {
     if (placingTower && selectedTowerType) {
        const gridX = mouse.gridX;
        const gridY = mouse.gridY;
        if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return; // Click outside grid

        const cost = towerTypes[selectedTowerType].cost;

        if (isValidPlacement(gridX, gridY) && money >= cost) {
            money -= cost;
            const newTower = new Tower(gridX, gridY, selectedTowerType);
            towers.push(newTower);
            grid[gridY][gridX].occupied = true;
            // Keep tower selected to allow multiple placements
            // selectedTowerType = null;
            // placingTower = false;
            updateUI();
        } else if (!isValidPlacement(gridX, gridY)) {
             console.log("Cannot place tower here (occupied or path).");
             // Maybe add a visual/audio cue for invalid placement attempt
             createParticles(mouse.x, mouse.y, '#ff0000', 5, 2, 300, 3); // Red puffs
        } else if (money < cost) {
             console.log("Not enough money.");
             // Maybe add a visual/audio cue
        }
     } else if (!placingTower) {
         // Future: Click to select/upgrade existing towers
         console.log("Clicked canvas, but no tower selected for placement.");
     }
});

startWaveButton.addEventListener('click', () => {
    if (gameState === 'waiting') {
        startNextWave();
    }
});

towerButtons.forEach(button => {
    button.addEventListener('click', () => {
        const type = button.dataset.type;
        const cost = parseInt(button.dataset.cost, 10);

        // Always allow selecting/deselecting regardless of funds,
        // but actual placement checks money later.
         if (selectedTowerType === type) {
             // Deselect if clicking the same button again
             selectedTowerType = null;
             placingTower = false;
         } else {
             selectedTowerType = type;
             placingTower = true;
         }
         updateUI(); // Update button styles and info text
    });
});

// Initialization
function init() {
    updateUI();
    lastTime = performance.now(); // Initialize lastTime here too
    requestAnimationFrame(gameLoop);
}

init();
