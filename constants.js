// Game Constants and Settings

// Canvas & UI Elements
export const getCanvas = () => document.getElementById('gameCanvas');
export const getContext = () => getCanvas().getContext('2d');
export const getMenuCanvas = () => document.getElementById('menuCanvas');
export const getMenuContext = () => getMenuCanvas().getContext('2d');

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
    selectedTowerTypeEl: document.getElementById('selected-tower-type'),
    retryButtons: document.querySelectorAll('#retry-button'),
    mapButtons: document.querySelectorAll('.map-button'),
    
    // Nové UI prvky pro vylepšení a prodej věží
    towerActionsPanel: document.getElementById('tower-actions'),
    detailType: document.getElementById('detail-type'),
    detailLevel: document.getElementById('detail-level'),
    detailDamage: document.getElementById('detail-damage'),
    detailFireRate: document.getElementById('detail-fire-rate'),
    detailRange: document.getElementById('detail-range'),
    
    towerUpgradeInfo: document.getElementById('tower-upgrade-info'),
    upgradeLevel: document.getElementById('upgrade-level'),
    upgradeDamage: document.getElementById('upgrade-damage'),
    upgradeFireRate: document.getElementById('upgrade-fire-rate'),
    upgradeRange: document.getElementById('upgrade-range'),
    upgradeSpecial: document.getElementById('upgrade-special'),
    upgradePrice: document.getElementById('upgrade-price'),
    
    upgradeTowerButton: document.getElementById('upgrade-tower-button'),
    sellTowerButton: document.getElementById('sell-tower-button'),
    sellValue: document.getElementById('sell-value'),
    cancelSelectionButton: document.getElementById('cancel-selection-button')
});

// Game Settings
export const TILE_SIZE = 40;
export const ROWS = 15; // canvas.height / TILE_SIZE;
export const COLS = 20; // canvas.width / TILE_SIZE;
export const MAX_WAVES = 20;

// Tower Definitions
export const towerTypes = {
    gun: {
        name: "Kulomet",
        levels: [
            {
                level: 1,
                cost: 50, 
                range: 110, 
                damage: 12, 
                fireRate: 450, 
                projectileSpeed: 8,
                sellValue: 35, // 70% návratnost
                upgradePrice: 40,
                colorBase: '#607d8b', 
                colorTop: '#b0bec5', 
                colorGun: '#455a64',
                projectileColor: '#ffffff', 
                projectileSize: 4
            },
            {
                level: 2,
                cost: 90, // původní + upgrade
                range: 130, 
                damage: 18, 
                fireRate: 400, 
                projectileSpeed: 9,
                sellValue: 63, // 70% návratnost
                upgradePrice: 60,
                colorBase: '#455a64', 
                colorTop: '#cfd8dc', 
                colorGun: '#263238',
                projectileColor: '#e0e0e0', 
                projectileSize: 5,
                // Speciální efekt pro level 2
                extraFeatures: {
                    doubleBarrel: true
                }
            },
            {
                level: 3,
                cost: 150, // celková investice
                range: 150, 
                damage: 25, 
                fireRate: 350, 
                projectileSpeed: 10,
                sellValue: 105, // 70% návratnost
                upgradePrice: 0, // maximální úroveň
                colorBase: '#263238', 
                colorTop: '#eceff1', 
                colorGun: '#000a12',
                projectileColor: '#bbdefb', 
                projectileSize: 6,
                // Speciální efekt pro level 3
                extraFeatures: {
                    doubleBarrel: true,
                    metallic: true,
                    criticalChance: 0.15 // 15% šance na kritický zásah (2x damage)
                }
            }
        ],
        // Pro zpětnou kompatibilitu ponecháme základní vlastnosti úrovně 1
        cost: 50, range: 110, damage: 12, fireRate: 450, projectileSpeed: 8,
        colorBase: '#607d8b', colorTop: '#b0bec5', colorGun: '#455a64',
        projectileColor: '#ffffff', projectileSize: 4
    },
    laser: {
        name: "Laser",
        levels: [
            {
                level: 1,
                cost: 75, 
                range: 130, 
                damage: 8, 
                fireRate: 300, 
                projectileSpeed: 12,
                sellValue: 52, // 70% návratnost
                upgradePrice: 55,
                colorBase: '#d32f2f', 
                colorTop: '#ffcdd2', 
                colorGun: '#b71c1c',
                projectileColor: '#ff8a80', 
                projectileSize: 5
            },
            {
                level: 2,
                cost: 130, // původní + upgrade
                range: 150, 
                damage: 12, 
                fireRate: 250, 
                projectileSpeed: 14,
                sellValue: 91, // 70% návratnost
                upgradePrice: 80,
                colorBase: '#b71c1c', 
                colorTop: '#ef9a9a', 
                colorGun: '#7f0000',
                projectileColor: '#ff5252', 
                projectileSize: 6,
                // Speciální efekt pro level 2
                extraFeatures: {
                    laserBeam: true // vizuální efekt paprsku
                }
            },
            {
                level: 3,
                cost: 210, // celková investice
                range: 170, 
                damage: 18, 
                fireRate: 200, 
                projectileSpeed: 16,
                sellValue: 147, // 70% návratnost
                upgradePrice: 0, // maximální úroveň
                colorBase: '#7f0000', 
                colorTop: '#ef5350', 
                colorGun: '#560027',
                projectileColor: '#ff1744', 
                projectileSize: 7,
                // Speciální efekt pro level 3
                extraFeatures: {
                    laserBeam: true,
                    dualBeam: true,
                    burnEffect: true // způsobuje dodatečné poškození v čase
                }
            }
        ],
        // Pro zpětnou kompatibilitu ponecháme základní vlastnosti úrovně 1
        cost: 75, range: 130, damage: 8, fireRate: 300, projectileSpeed: 12,
        colorBase: '#d32f2f', colorTop: '#ffcdd2', colorGun: '#b71c1c',
        projectileColor: '#ff8a80', projectileSize: 5
    },
    sniper: {
        name: "Odstřelovač",
        levels: [
            {
                level: 1,
                cost: 100, 
                range: 220, 
                damage: 45, 
                fireRate: 1800, 
                projectileSpeed: 18,
                sellValue: 70, // 70% návratnost
                upgradePrice: 80,
                colorBase: '#388e3c', 
                colorTop: '#c8e6c9', 
                colorGun: '#1b5e20',
                projectileColor: '#a5d6a7', 
                projectileSize: 3
            },
            {
                level: 2,
                cost: 180, // původní + upgrade
                range: 260, 
                damage: 70, 
                fireRate: 1600, 
                projectileSpeed: 20,
                sellValue: 126, // 70% návratnost
                upgradePrice: 120,
                colorBase: '#1b5e20', 
                colorTop: '#a5d6a7', 
                colorGun: '#003300',
                projectileColor: '#69f0ae', 
                projectileSize: 4,
                // Speciální efekt pro level 2
                extraFeatures: {
                    scope: true, // vizuální efekt zaměřovače
                    armorPiercing: 0.2 // ignoruje 20% armor nepřátel (připraveno pro budoucí vylepšení)
                }
            },
            {
                level: 3,
                cost: 300, // celková investice
                range: 300, 
                damage: 110, 
                fireRate: 1400, 
                projectileSpeed: 22,
                sellValue: 210, // 70% návratnost
                upgradePrice: 0, // maximální úroveň
                colorBase: '#003300', 
                colorTop: '#81c784', 
                colorGun: '#002200',
                projectileColor: '#00e676', 
                projectileSize: 5,
                // Speciální efekt pro level 3
                extraFeatures: {
                    scope: true,
                    armorPiercing: 0.4, // ignoruje 40% armor nepřátel
                    headshotChance: 0.2 // 20% šance na headshot (3x damage)
                }
            }
        ],
        // Pro zpětnou kompatibilitu ponecháme základní vlastnosti úrovně 1
        cost: 100, range: 220, damage: 45, fireRate: 1800, projectileSpeed: 18,
        colorBase: '#388e3c', colorTop: '#c8e6c9', colorGun: '#1b5e20',
        projectileColor: '#a5d6a7', projectileSize: 3
    }
};

// Tower Status Definitions - pro vykreslování speciálních stavů věží
export const towerStatus = {
    selected: {
        color: 'rgba(255, 255, 255, 0.4)',
        width: 2,
        lineStyle: []
    },
    upgrading: {
        color: 'rgba(76, 175, 80, 0.5)',
        width: 2,
        lineStyle: [5, 5]
    },
    selling: {
        color: 'rgba(244, 67, 54, 0.5)',
        width: 2,
        lineStyle: [3, 3]
    }
};

// Maps Definition - tři různé mapy s různými obtížnostmi
export const maps = {
    easy: {
        name: "Lehká",
        path: [
            // Jednoduchá rovná cesta ve tvaru písmene L
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, 
            { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 },
            { x: 10, y: 2 }, { x: 10, y: 3 }, { x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 6 },
            { x: 10, y: 7 }, { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 12, y: 9 },
            { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 },
            { x: 18, y: 9 }, { x: 19, y: 9 }
        ],
        startMoney: 150,
        startHealth: 25,
        enemyHealthModifier: 0.8, // Slabší nepřátelé
        waveModifier: 0.9 // Méně nepřátel ve vlnách
    },
    medium: {
        name: "Střední",
        path: [
            // Původní, středně složitá cesta - tuto ponecháme beze změny
            { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 4 },
            { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 4 },
            { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
            { x: 8, y: 6 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
            { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 }, { x: 13, y: 9 }, { x: 14, y: 9 },
            { x: 15, y: 9 }, { x: 16, y: 9 }, { x: 17, y: 9 }, { x: 18, y: 9 }, { x: 19, y: 9 }
        ],
        startMoney: 100,
        startHealth: 20,
        enemyHealthModifier: 1.0, // Standardní nepřátelé
        waveModifier: 1.0 // Standardní vlny
    },
    hard: {
        name: "Těžká",
        path: [
            // Komplexní cesta ve tvaru dvojitého Z
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
            { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 },
            { x: 10, y: 2 }, { x: 11, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 13, y: 3 },
            { x: 13, y: 4 }, { x: 13, y: 5 }, { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 },
            { x: 10, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 6 }, { x: 7, y: 6 }, { x: 6, y: 6 },
            { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 5, y: 9 }, { x: 5, y: 10 },
            { x: 5, y: 11 }, { x: 6, y: 11 }, { x: 7, y: 11 }, { x: 8, y: 11 }, { x: 9, y: 11 },
            { x: 10, y: 11 }, { x: 11, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 }, { x: 14, y: 11 },
            { x: 15, y: 11 }, { x: 16, y: 11 }, { x: 17, y: 11 }, { x: 18, y: 11 }, { x: 19, y: 11 }
        ],
        startMoney: 90,
        startHealth: 15,
        enemyHealthModifier: 1.2, // Silnější nepřátelé
        waveModifier: 1.1 // Více nepřátel ve vlnách
    }
};

// Pro zpětnou kompatibilitu - výchozí cesta
export const path = maps.medium.path; 