// Rendering Functions
import { TILE_SIZE, ROWS, COLS, towerTypes } from './constants.js';
import { getCanvasCoords, isValidPlacement } from './utils.js';

// Global variables for screen flash effect
let flashIntensity = 0;
let flashColor = 'rgba(255, 215, 0, 0)'; // Golden color for money reward

// Screen flash effect - call this when enemy is killed
export function triggerScreenFlash(color = 'rgba(255, 215, 0, 0.15)', intensity = 0.15) {
    flashIntensity = Math.min(flashIntensity + intensity, 0.3); // Cap intensity
    flashColor = color;
}

// Update flash effect each frame
export function updateScreenFlash(deltaTime) {
    if (flashIntensity > 0) {
        flashIntensity -= deltaTime / 500; // Fade out speed
        if (flashIntensity < 0) flashIntensity = 0;
    }
}

// Draw screen flash effect
function drawScreenFlash(ctx, canvas) {
    if (flashIntensity <= 0) return;
    
    const alpha = flashColor.slice(0, -4) + flashIntensity + ')';
    ctx.fillStyle = alpha;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw background with gradient
export function drawBackground(ctx, canvas) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#3a3d4a'); // Darker top
    bgGrad.addColorStop(1, '#2a2d34'); // Lighter bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw subtle grid lines for placement guidance
export function drawGrid(ctx, canvas) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; // Very faint white lines
    ctx.lineWidth = 1;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// Draw the path that enemies follow
export function drawPath(ctx, canvas, currentPath) {
    if (!currentPath || currentPath.length < 2) return;

    // Path Gradient
    const pathGrad = ctx.createLinearGradient(0, 0, canvas.width, 0); // Horizontal gradient
    pathGrad.addColorStop(0, '#5c5c7a'); // Start color
    pathGrad.addColorStop(0.5, '#6b6b8a'); // Middle color
    pathGrad.addColorStop(1, '#5c5c7a'); // End color

    ctx.strokeStyle = pathGrad; // Use gradient for stroke
    ctx.lineWidth = TILE_SIZE * 0.7; // Path width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.8; // Make path slightly transparent

    ctx.beginPath();
    const startPos = getCanvasCoords(currentPath[0].x, currentPath[0].y);
    ctx.moveTo(startPos.x, startPos.y);
    
    for (let i = 1; i < currentPath.length; i++) {
        const pos = getCanvasCoords(currentPath[i].x, currentPath[i].y);
        ctx.lineTo(pos.x, pos.y);
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1.0; // Reset alpha
}

// Draw preview when placing towers
export function drawPlacementPreview(ctx, mouseX, mouseY, gridX, gridY, selectedTowerType, money, grid) {
    if (!selectedTowerType) return;
    
    if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return; // Out of bounds

    const stats = towerTypes[selectedTowerType];
    const canPlace = isValidPlacement(grid, gridX, gridY) && money >= stats.cost;

    const previewCenterX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const previewCenterY = gridY * TILE_SIZE + TILE_SIZE / 2;

    // Draw range indicator first (below tower preview)
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = canPlace ? 'rgba(144, 238, 144, 0.3)' : 'rgba(255, 99, 71, 0.3)'; // Light green / tomato red
    ctx.beginPath();
    ctx.arc(previewCenterX, previewCenterY, stats.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw semi-transparent tower preview
    ctx.globalAlpha = 0.6;
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
    
    // Draw tower details panel
    drawTowerDetailsForPlacement(ctx, mouseX, mouseY, selectedTowerType, canPlace);
}

// New function to draw tower details when placing a tower
function drawTowerDetailsForPlacement(ctx, mouseX, mouseY, towerType, canPlace) {
    const stats = towerTypes[towerType];
    const levelData = stats.levels[0]; // Level 1 data (for placement)
    
    // Panel parameters
    const panelWidth = 220;
    const lineHeight = 22;
    const panelPadding = 10;
    const panelBorderRadius = 8;
    
    // Calculate panel height based on content
    let totalLines = 5; // Basic stats (name, cost, damage, firerate, range)
    
    // Add additional lines if tower has special features
    if (levelData.extraFeatures) {
        totalLines++; // Základní řádek pro speciální efekty
        
        // Přidání dalších řádků pro věže s více efekty
        if (levelData.extraFeatures.multiBarrel && 
            (levelData.extraFeatures.explosiveRounds || levelData.extraFeatures.devastatingBlows || 
             levelData.extraFeatures.metallic || levelData.extraFeatures.criticalChance || 
             levelData.extraFeatures.armorPiercing)) {
            totalLines++;
        }
        
        if (levelData.extraFeatures.explosiveRounds && 
            (levelData.extraFeatures.devastatingBlows || levelData.extraFeatures.metallic || 
             levelData.extraFeatures.criticalChance || levelData.extraFeatures.armorPiercing)) {
            totalLines++;
        }
    }
    
    const panelHeight = lineHeight * totalLines + panelPadding * 2;
    
    // Position panel near cursor but not under it
    // Make sure panel stays in viewport
    let panelX = mouseX + 20; // Offset from cursor
    let panelY = mouseY;
    
    // Adjust if panel would go off the right edge
    if (panelX + panelWidth > ctx.canvas.width) {
        panelX = mouseX - panelWidth - 20;
    }
    
    // Adjust if panel would go off the bottom edge
    if (panelY + panelHeight > ctx.canvas.height) {
        panelY = ctx.canvas.height - panelHeight - 10;
    }
    
    // Draw panel background with semi-transparency
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, panelBorderRadius);
    ctx.fill();
    
    // Draw panel border
    ctx.strokeStyle = canPlace ? '#66bb6a' : '#e57373';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    
    // Draw tower info text
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let textY = panelY + panelPadding;
    const textX = panelX + panelPadding;
    
    // Tower name and cost
    const towerName = stats.name || towerType.toUpperCase();
    ctx.fillText(`${towerName} - Cost: ${stats.cost}$`, textX, textY);
    textY += lineHeight;
    
    // Basic stats
    ctx.font = '13px Arial';
    ctx.fillText(`Damage: ${levelData.damage}`, textX, textY);
    textY += lineHeight;
    
    ctx.fillText(`Fire Rate: ${levelData.fireRate}ms`, textX, textY);
    textY += lineHeight;
    
    ctx.fillText(`Range: ${levelData.range}`, textX, textY);
    textY += lineHeight;
    
    // Level indicator
    ctx.fillText(`Level: 1 (initial)`, textX, textY);
    textY += lineHeight;
    
    // Display special features if any
    if (levelData.extraFeatures) {
        ctx.fillStyle = '#81c784'; // Light green for special features
        
        let specialText = 'Special: ';
        
        if (levelData.extraFeatures.doubleBarrel) {
            specialText += 'Double Barrel, ';
        }
        if (levelData.extraFeatures.multiBarrel) {
            specialText += 'Multi Barrel';
            // Přidáme řádek pokud máme více speciálních efektů
            if (levelData.extraFeatures.explosiveRounds || levelData.extraFeatures.devastatingBlows || 
                levelData.extraFeatures.metallic || levelData.extraFeatures.criticalChance ||
                levelData.extraFeatures.armorPiercing) {
                ctx.fillText(specialText, textX, textY);
                textY += lineHeight;
                specialText = 'Special: ';
            } else {
                specialText += ', ';
            }
        }
        if (levelData.extraFeatures.explosiveRounds) {
            const radius = levelData.extraFeatures.explosiveRounds.radius;
            const damage = Math.round(levelData.extraFeatures.explosiveRounds.damageFactor * 100);
            specialText += `Explosion (R:${radius}, ${damage}%)`;
            // Přidáme řádek pokud máme více speciálních efektů
            if (levelData.extraFeatures.devastatingBlows || levelData.extraFeatures.metallic || 
                levelData.extraFeatures.criticalChance || levelData.extraFeatures.armorPiercing) {
                ctx.fillText(specialText, textX, textY);
                textY += lineHeight;
                specialText = 'Special: ';
            } else {
                specialText += ', ';
            }
        }
        if (levelData.extraFeatures.devastatingBlows) {
            specialText += 'Devastating Blows, ';
        }
        if (levelData.extraFeatures.metallic) {
            specialText += 'Metallic, ';
        }
        if (levelData.extraFeatures.criticalChance) {
            specialText += `${levelData.extraFeatures.criticalChance * 100}% Crit, `;
        }
        if (levelData.extraFeatures.laserBeam) {
            specialText += 'Laser Beam, ';
        }
        if (levelData.extraFeatures.dualBeam) {
            specialText += 'Dual Beam, ';
        }
        if (levelData.extraFeatures.burnEffect) {
            specialText += 'Burn, ';
        }
        if (levelData.extraFeatures.scope) {
            specialText += 'Scope, ';
        }
        if (levelData.extraFeatures.armorPiercing) {
            specialText += `${levelData.extraFeatures.armorPiercing * 100}% ArmorPierce, `;
        }
        if (levelData.extraFeatures.headshotChance) {
            specialText += `${levelData.extraFeatures.headshotChance * 100}% Headshot, `;
        }
        if (levelData.extraFeatures.chainLightning) {
            specialText += `Chain Lightning, `;
        }
        if (levelData.extraFeatures.homingEffect) {
            specialText += `Homing, `;
        }
        if (levelData.extraFeatures.freezeEffect) {
            specialText += `Freeze, `;
        }
        if (levelData.extraFeatures.pulsarAreaDamage) {
            specialText += `Area Damage, `;
        }
        if (levelData.extraFeatures.pulsarDebuff) {
            specialText += `Debuff, `;
        }
        
        // Odstranění poslední čárky a mezery
        specialText = specialText.replace(/, $/, '');
        
        // Wrap text if too long
        if (ctx.measureText(specialText).width > panelWidth - panelPadding * 2) {
            const words = specialText.split(', ');
            let line = words[0];
            
            for (let i = 1; i < words.length; i++) {
                if (ctx.measureText(line + ', ' + words[i]).width <= panelWidth - panelPadding * 2) {
                    line += ', ' + words[i];
                } else {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                    line = words[i];
                }
            }
            
            ctx.fillText(line, textX, textY);
        } else {
            ctx.fillText(specialText, textX, textY);
        }
    }
}

// Main draw function that combines all rendering
export function draw(ctx, canvas, gameState, grid, towers, projectiles, enemies, particles, placingTower, selectedTowerType, mouse, money) {
    // Draw background
    drawBackground(ctx, canvas);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw path - použít aktuální cestu z gameState
    drawPath(ctx, canvas, gameState.currentPath);

    // Draw game objects
    towers.forEach(tower => tower.draw(ctx, placingTower, selectedTowerType, mouse.gridX, mouse.gridY));
    projectiles.forEach(proj => proj.draw(ctx));
    enemies.forEach(enemy => enemy.draw(ctx));
    particles.forEach(particle => particle.draw(ctx));
    
    // Draw floating texts
    if (gameState.floatingTexts) {
        gameState.floatingTexts.forEach(text => text.draw(ctx));
    }

    // Draw placement preview
    if (placingTower && selectedTowerType) {
        drawPlacementPreview(
            ctx, 
            mouse.x, mouse.y, 
            mouse.gridX, mouse.gridY, 
            selectedTowerType, 
            money, 
            grid
        );
    }

    // Draw screen flash effect at the end
    drawScreenFlash(ctx, canvas);
} 