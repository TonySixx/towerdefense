// Utility Functions
import { TILE_SIZE, ROWS, COLS } from './constants.js';

// Grid and Path Functions
export function createGrid() {
    const grid = [];
    for (let y = 0; y < ROWS; y++) {
        grid[y] = [];
        for (let x = 0; x < COLS; x++) {
            grid[y][x] = { occupied: false, isPath: false };
        }
    }
    return grid;
}

export function markPathOnGrid(grid, path) {
    path.forEach(point => {
        if (point.x >= 0 && point.x < COLS && point.y >= 0 && point.y < ROWS) {
            grid[point.y][point.x].isPath = true;
            grid[point.y][point.x].occupied = true; // Cannot build on path
        }
    });
    return grid;
}

// Coordinate Conversion Functions
export function getGridCoords(canvasX, canvasY) {
    return {
        x: Math.floor(canvasX / TILE_SIZE),
        y: Math.floor(canvasY / TILE_SIZE)
    };
}

export function getCanvasCoords(gridX, gridY) {
    return {
        x: gridX * TILE_SIZE + TILE_SIZE / 2,
        y: gridY * TILE_SIZE + TILE_SIZE / 2
    };
}

export function isValidPlacement(grid, gridX, gridY) {
    return gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS &&
           !grid[gridY][gridX].occupied && !grid[gridY][gridX].isPath;
}

export function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

// Color Utility Functions
export function lerpColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    if (!c1 || !c2) return color2; // Fallback

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r},${g},${b})`;
}

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
} 