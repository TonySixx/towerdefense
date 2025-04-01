// Rendering Functions
import { TILE_SIZE, ROWS, COLS, path, towerTypes } from './constants.js';
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
export function drawPath(ctx, canvas) {
    if (path.length < 2) return;

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
    const startPos = getCanvasCoords(path[0].x, path[0].y);
    ctx.moveTo(startPos.x, startPos.y);
    
    for (let i = 1; i < path.length; i++) {
        const pos = getCanvasCoords(path[i].x, path[i].y);
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
}

// Main draw function that combines all rendering
export function draw(ctx, canvas, gameState, grid, towers, projectiles, enemies, particles, placingTower, selectedTowerType, mouse, money) {
    // Draw background
    drawBackground(ctx, canvas);

    // Draw grid
    drawGrid(ctx, canvas);

    // Draw path
    drawPath(ctx, canvas);

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