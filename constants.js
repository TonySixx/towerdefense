// Game Constants and Settings

// Canvas & UI Elements
export const getCanvas = () => document.getElementById('gameCanvas');
export const getContext = () => getCanvas().getContext('2d');

// UI Element Selectors - export as getters to avoid issues with loading order
export const getUIElements = () => ({
    waveEl: document.getElementById('wave'),
    moneyEl: document.getElementById('money'),
    healthEl: document.getElementById('health'),
    startWaveButton: document.getElementById('startWaveButton'),
    towerButtons: document.querySelectorAll('.tower-button'),
    gameOverScreen: document.getElementById('game-over'),
    victoryScreen: document.getElementById('victory'),
    finalWaveEl: document.getElementById('final-wave'),
    selectedTowerTypeEl: document.getElementById('selected-tower-type')
});

// Game Settings
export const TILE_SIZE = 40;
export const ROWS = 15; // canvas.height / TILE_SIZE;
export const COLS = 20; // canvas.width / TILE_SIZE;
export const MAX_WAVES = 15;

// Tower Definitions
export const towerTypes = {
    gun: {
        cost: 50, range: 110, damage: 12, fireRate: 450, projectileSpeed: 8,
        colorBase: '#607d8b', colorTop: '#b0bec5', colorGun: '#455a64',
        projectileColor: '#ffffff', projectileSize: 4
    },
    laser: {
        cost: 75, range: 130, damage: 8, fireRate: 300, projectileSpeed: 12,
        colorBase: '#d32f2f', colorTop: '#ffcdd2', colorGun: '#b71c1c',
        projectileColor: '#ff8a80', projectileSize: 5
    },
    sniper: {
        cost: 100, range: 220, damage: 45, fireRate: 1800, projectileSpeed: 18,
        colorBase: '#388e3c', colorTop: '#c8e6c9', colorGun: '#1b5e20',
        projectileColor: '#a5d6a7', projectileSize: 3
    }
};

// Path Definition (Grid coordinates)
export const path = [
    { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 4 },
    { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 4 },
    { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
    { x: 8, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
    { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
    { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 }, { x: 18, y: 9 }, { x: 19, y: 9 }
]; 