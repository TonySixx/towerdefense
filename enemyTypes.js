// enemyTypes.js - Definition of enemy types and bosses

// Basic enemy types
export const enemyTypes = {
    // Basic enemy with balanced stats
    standard: {
        name: "Standard",
        healthModifier: 1.0,     // Standard amount of health
        speedModifier: 1.0,      // Standard speed
        sizeModifier: 1.0,       // Standard size
        valueModifier: 1.0,      // Standard reward
        color: '#e56b6f',        // Red color
        darkerColor: '#b54d4f',  // Dark red color
        isBoss: false
    },
    
    // Fast but weak enemy
    fast: {
        name: "Fast",
        healthModifier: 0.6,     // Less health
        speedModifier: 1.7,      // Significantly higher speed
        sizeModifier: 0.8,       // Slightly smaller
        valueModifier: 1.2,      // Slightly higher reward
        color: '#52b788',        // Green color
        darkerColor: '#2d6a4f',  // Dark green color
        isBoss: false
    },
    
    // Slow but resilient enemy
    tank: {
        name: "Tank",
        healthModifier: 2.2,     // Significantly more health
        speedModifier: 0.6,      // Substantially lower speed
        sizeModifier: 1.3,       // Larger size
        valueModifier: 1.5,      // Higher reward
        color: '#6d6875',        // Gray color
        darkerColor: '#4a4e69',  // Dark gray color
        isBoss: false
    },
    
    // Very fast and small enemy
    swift: {
        name: "Swift",
        healthModifier: 0.4,     // Very little health
        speedModifier: 2.2,      // Extremely high speed
        sizeModifier: 0.6,       // Very small
        valueModifier: 1.3,      // Higher reward
        color: '#48cae4',        // Light blue color
        darkerColor: '#0096c7',  // Dark blue color
        isBoss: false
    },
    
    // Highly resistant but slow enemy
    armored: {
        name: "Armored",
        healthModifier: 3.0,     // Extremely high health
        speedModifier: 0.5,      // Very low speed
        sizeModifier: 1.2,       // Larger size
        valueModifier: 2.0,      // High reward
        color: '#cdb4db',        // Purple color
        darkerColor: '#a2a3bb',  // Dark purple color
        isBoss: false
    },
    
    // Balanced enemy combining speed and resistance
    hybrid: {
        name: "Hybrid",
        healthModifier: 1.8,     // Almost as resistant as a tank
        speedModifier: 1.4,      // Faster than standard, but not as fast as fast types
        sizeModifier: 1.1,       // Slightly larger
        valueModifier: 2.5,      // High reward due to difficulty
        color: '#9d4edd',        // Purple color
        darkerColor: '#5a189a',  // Dark purple color
        isBoss: false
    }
};

// Bosses (special enemies at the end of waves 5, 10 and 15)
export const bossTypes = {
    // Boss for wave 5
    waveBoss5: {
        name: "Wave 5 Boss",
        healthModifier: 5.0,     // 5x more health than standard enemy
        speedModifier: 0.8,      // Slightly slower
        sizeModifier: 1.8,       // Significantly larger
        valueModifier: 5.0,      // 5x greater reward
        color: '#ef476f',        // Bright red color
        darkerColor: '#c9184a',  // Dark red color
        isBoss: true,
        waveAppearance: 5,       // Boss appears in wave 5
        spawnDelay: 3000         // Longer spawn delay (in ms)
    },
    
    // Boss for wave 10
    waveBoss10: {
        name: "Wave 10 Boss",
        healthModifier: 12.0,    // 12x more health
        speedModifier: 0.7,      // Even slower
        sizeModifier: 2.0,       // Double size
        valueModifier: 10.0,     // 10x greater reward
        color: '#ffd166',        // Gold color
        darkerColor: '#e29e21',  // Dark gold color
        isBoss: true,
        waveAppearance: 10,      // Boss appears in wave 10
        spawnDelay: 4000         // Even longer delay (in ms)
    },
    
    // Final boss for wave 15
    finalBoss: {
        name: "Final Boss",
        healthModifier: 25.0,    // 25x more health
        speedModifier: 0.9,      // Average speed
        sizeModifier: 2.5,       // 2.5x larger size
        valueModifier: 20.0,     // 20x greater reward
        color: '#6a0dad',        // Bright purple color
        darkerColor: '#3a015c',  // Dark purple color
        isBoss: true,
        waveAppearance: 15,      // Boss appears in wave 15
        spawnDelay: 5000         // Very long delay (in ms)
    },
    
    // Ultimate megaboss for wave 20
    megaBoss: {
        name: "Mega Boss",
        healthModifier: 40.0,    // 40x more health than standard
        speedModifier: 1.1,      // Slightly faster than standard
        sizeModifier: 3.0,       // 3x larger size
        valueModifier: 40.0,     // 40x greater reward
        color: '#ff0000',        // Bright red color
        darkerColor: '#8b0000',  // Dark red color
        isBoss: true,
        waveAppearance: 20,      // Boss appears in final wave 20
        spawnDelay: 6000         // Extremely long delay (in ms)
    },
    
    // Hyper boss for wave 25
    hyperBoss: {
        name: "Hyper Boss",
        healthModifier: 60.0,    // 60x more health than standard
        speedModifier: 1.2,      // Faster than mega boss
        sizeModifier: 2.8,       // Slightly smaller but more dangerous
        valueModifier: 60.0,     // 60x greater reward
        color: '#8a2be2',        // Blueviolet color
        darkerColor: '#4b0082',  // Indigo color
        isBoss: true,
        waveAppearance: 25,      // Boss appears in wave 25
        spawnDelay: 6000         // Same delay as mega boss
    },
    
    // Ultra boss for wave 30
    ultraBoss: {
        name: "Ultra Boss",
        healthModifier: 85.0,    // 85x more health than standard
        speedModifier: 1.0,      // Standard speed but very resistant
        sizeModifier: 3.2,       // Larger than mega boss
        valueModifier: 85.0,     // 85x greater reward
        color: '#00ffff',        // Cyan color
        darkerColor: '#008b8b',  // Dark cyan color
        isBoss: true,
        waveAppearance: 30,      // Boss appears in wave 30
        spawnDelay: 7000         // Longer delay
    },
    
    // Titan boss for wave 35
    titanBoss: {
        name: "Titan Boss",
        healthModifier: 120.0,   // 120x more health than standard
        speedModifier: 0.9,      // Slower but extremely resistant
        sizeModifier: 3.5,       // Very large
        valueModifier: 120.0,    // 120x greater reward
        color: '#ffd700',        // Gold color
        darkerColor: '#b8860b',  // Dark goldenrod color
        isBoss: true,
        waveAppearance: 35,      // Boss appears in wave 35
        spawnDelay: 8000         // Very long delay
    },
    
    // Ultimate titan boss for wave 40
    ultimateBoss: {
        name: "Ultimate Titan",
        healthModifier: 200.0,   // 200x more health than standard
        speedModifier: 1.3,      // Fast AND extremely resistant
        sizeModifier: 4.0,       // Enormous
        valueModifier: 200.0,    // 200x greater reward
        color: '#ff00ff',        // Magenta color
        darkerColor: '#8b008b',  // Dark magenta color
        isBoss: true,
        waveAppearance: 40,      // Boss appears in final wave 40
        spawnDelay: 10000        // Extremely long delay
    }
};

// Wave configuration - determines which enemies appear in each wave
export const waveConfigurations = [
    // Wave 1 - only standard enemies
    {
        waveNumber: 1,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 900 }
        ]
    },
    // Wave 2 - standard + a few fast ones
    {
        waveNumber: 2,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 900 },
            { type: 'fast', count: 3, spawnDelay: 800 }
        ]
    },
    // Wave 3 - more fast ones + first tank
    {
        waveNumber: 3,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 900 },
            { type: 'fast', count: 6, spawnDelay: 700 },
            { type: 'tank', count: 1, spawnDelay: 1500 }
        ]
    },
    // Wave 4 - mix of standard, fast and tanks
    {
        waveNumber: 4,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 850 },
            { type: 'fast', count: 5, spawnDelay: 650 },
            { type: 'tank', count: 2, spawnDelay: 1400 }
        ]
    },
    // Wave 5 - harder mix + first boss
    {
        waveNumber: 5,
        enemies: [
            { type: 'standard', count: 5, spawnDelay: 800 },
            { type: 'fast', count: 8, spawnDelay: 600 },
            { type: 'tank', count: 3, spawnDelay: 1300 }
        ],
        boss: { type: 'waveBoss5', spawnDelay: 3000 }
    },
    // Wave 6 - adding swift enemies
    {
        waveNumber: 6,
        enemies: [
            { type: 'standard', count: 7, spawnDelay: 800 },
            { type: 'fast', count: 5, spawnDelay: 600 },
            { type: 'swift', count: 4, spawnDelay: 500 },
            { type: 'tank', count: 2, spawnDelay: 1200 }
        ]
    },
    // Wave 7 - mix of all types
    {
        waveNumber: 7,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 750 },
            { type: 'fast', count: 6, spawnDelay: 550 },
            { type: 'swift', count: 6, spawnDelay: 450 },
            { type: 'tank', count: 3, spawnDelay: 1100 }
        ]
    },
    // Wave 8 - adding armored enemies
    {
        waveNumber: 8,
        enemies: [
            { type: 'standard', count: 5, spawnDelay: 700 },
            { type: 'fast', count: 5, spawnDelay: 500 },
            { type: 'swift', count: 5, spawnDelay: 400 },
            { type: 'tank', count: 3, spawnDelay: 1000 },
            { type: 'armored', count: 2, spawnDelay: 1500 }
        ]
    },
    // Wave 9 - difficult mix of all types
    {
        waveNumber: 9,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 650 },
            { type: 'fast', count: 6, spawnDelay: 450 },
            { type: 'swift', count: 6, spawnDelay: 350 },
            { type: 'tank', count: 4, spawnDelay: 900 },
            { type: 'armored', count: 3, spawnDelay: 1300 }
        ]
    },
    // Wave 10 - medium mix + wave 10 boss
    {
        waveNumber: 10,
        enemies: [
            { type: 'standard', count: 5, spawnDelay: 600 },
            { type: 'fast', count: 7, spawnDelay: 400 },
            { type: 'swift', count: 7, spawnDelay: 300 },
            { type: 'tank', count: 3, spawnDelay: 800 },
            { type: 'armored', count: 2, spawnDelay: 1200 }
        ],
        boss: { type: 'waveBoss10', spawnDelay: 4000 }
    },
    // Wave 11 - hard mix after boss
    {
        waveNumber: 11,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 550 },
            { type: 'fast', count: 8, spawnDelay: 380 },
            { type: 'swift', count: 8, spawnDelay: 280 },
            { type: 'tank', count: 5, spawnDelay: 750 },
            { type: 'armored', count: 4, spawnDelay: 1100 }
        ]
    },
    // Wave 12 - hard mix with emphasis on fast types
    {
        waveNumber: 12,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 500 },
            { type: 'fast', count: 10, spawnDelay: 350 },
            { type: 'swift', count: 10, spawnDelay: 250 },
            { type: 'tank', count: 3, spawnDelay: 700 },
            { type: 'armored', count: 3, spawnDelay: 1000 }
        ]
    },
    // Wave 13 - hard mix with emphasis on resilient types
    {
        waveNumber: 13,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 480 },
            { type: 'fast', count: 5, spawnDelay: 330 },
            { type: 'swift', count: 5, spawnDelay: 230 },
            { type: 'tank', count: 7, spawnDelay: 650 },
            { type: 'armored', count: 7, spawnDelay: 950 }
        ]
    },
    // Wave 14 - penultimate wave, hard mix of everything
    {
        waveNumber: 14,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 450 },
            { type: 'fast', count: 8, spawnDelay: 300 },
            { type: 'swift', count: 8, spawnDelay: 200 },
            { type: 'tank', count: 6, spawnDelay: 600 },
            { type: 'armored', count: 6, spawnDelay: 900 }
        ]
    },
    // Wave 15 - final wave with hardest mix and final boss
    {
        waveNumber: 15,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 400 },
            { type: 'fast', count: 10, spawnDelay: 250 },
            { type: 'swift', count: 10, spawnDelay: 180 },
            { type: 'tank', count: 8, spawnDelay: 550 },
            { type: 'armored', count: 8, spawnDelay: 800 }
        ],
        boss: { type: 'finalBoss', spawnDelay: 5000 }
    },
    // Wave 16 - first wave of new challenge, introducing hybrid enemies
    {
        waveNumber: 16,
        enemies: [
            { type: 'standard', count: 12, spawnDelay: 380 },
            { type: 'fast', count: 12, spawnDelay: 220 },
            { type: 'swift', count: 10, spawnDelay: 160 },
            { type: 'tank', count: 8, spawnDelay: 520 },
            { type: 'armored', count: 6, spawnDelay: 750 },
            { type: 'hybrid', count: 4, spawnDelay: 600 }
        ]
    },
    // Wave 17 - emphasis on fast enemies
    {
        waveNumber: 17,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 350 },
            { type: 'fast', count: 15, spawnDelay: 200 },
            { type: 'swift', count: 15, spawnDelay: 140 },
            { type: 'tank', count: 5, spawnDelay: 480 },
            { type: 'armored', count: 5, spawnDelay: 700 },
            { type: 'hybrid', count: 8, spawnDelay: 550 }
        ]
    },
    // Wave 18 - balanced mix with increased number of all units
    {
        waveNumber: 18,
        enemies: [
            { type: 'standard', count: 14, spawnDelay: 320 },
            { type: 'fast', count: 12, spawnDelay: 180 },
            { type: 'swift', count: 12, spawnDelay: 120 },
            { type: 'tank', count: 10, spawnDelay: 450 },
            { type: 'armored', count: 8, spawnDelay: 650 },
            { type: 'hybrid', count: 10, spawnDelay: 500 }
        ]
    },
    // Wave 19 - penultimate wave with emphasis on resilient enemies
    {
        waveNumber: 19,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 300 },
            { type: 'fast', count: 10, spawnDelay: 160 },
            { type: 'swift', count: 10, spawnDelay: 100 },
            { type: 'tank', count: 12, spawnDelay: 400 },
            { type: 'armored', count: 12, spawnDelay: 600 },
            { type: 'hybrid', count: 15, spawnDelay: 450 }
        ]
    },
    // Wave 20 - final wave with ultimate megaboss
    {
        waveNumber: 20,
        enemies: [
            { type: 'standard', count: 15, spawnDelay: 250 },
            { type: 'fast', count: 12, spawnDelay: 140 },
            { type: 'swift', count: 12, spawnDelay: 80 },
            { type: 'tank', count: 10, spawnDelay: 350 },
            { type: 'armored', count: 10, spawnDelay: 550 },
            { type: 'hybrid', count: 10, spawnDelay: 400 }
        ],
        boss: { type: 'megaBoss', spawnDelay: 6000 }
    },
    
    // EXTENDED WAVES (21-40)
    
    // Wave 21 - first wave after mega boss
    {
        waveNumber: 21,
        enemies: [
            { type: 'standard', count: 18, spawnDelay: 240 },
            { type: 'fast', count: 15, spawnDelay: 130 },
            { type: 'swift', count: 15, spawnDelay: 75 },
            { type: 'tank', count: 12, spawnDelay: 320 },
            { type: 'armored', count: 12, spawnDelay: 500 },
            { type: 'hybrid', count: 15, spawnDelay: 380 }
        ]
    },
    
    // Wave 22 - heavy emphasis on hybrid enemies
    {
        waveNumber: 22,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 230 },
            { type: 'fast', count: 10, spawnDelay: 120 },
            { type: 'swift', count: 10, spawnDelay: 70 },
            { type: 'tank', count: 12, spawnDelay: 300 },
            { type: 'armored', count: 12, spawnDelay: 480 },
            { type: 'hybrid', count: 20, spawnDelay: 350 }
        ]
    },
    
    // Wave 23 - focus on fast enemies
    {
        waveNumber: 23,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 220 },
            { type: 'fast', count: 20, spawnDelay: 110 },
            { type: 'swift', count: 20, spawnDelay: 65 },
            { type: 'tank', count: 8, spawnDelay: 280 },
            { type: 'armored', count: 8, spawnDelay: 450 },
            { type: 'hybrid', count: 12, spawnDelay: 320 }
        ]
    },
    
    // Wave 24 - focus on tank and armored enemies
    {
        waveNumber: 24,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 210 },
            { type: 'fast', count: 10, spawnDelay: 100 },
            { type: 'swift', count: 10, spawnDelay: 60 },
            { type: 'tank', count: 18, spawnDelay: 270 },
            { type: 'armored', count: 18, spawnDelay: 430 },
            { type: 'hybrid', count: 12, spawnDelay: 300 }
        ]
    },
    
    // Wave 25 - boss wave with hyper boss
    {
        waveNumber: 25,
        enemies: [
            { type: 'standard', count: 15, spawnDelay: 200 },
            { type: 'fast', count: 15, spawnDelay: 90 },
            { type: 'swift', count: 15, spawnDelay: 55 },
            { type: 'tank', count: 15, spawnDelay: 250 },
            { type: 'armored', count: 15, spawnDelay: 400 },
            { type: 'hybrid', count: 15, spawnDelay: 280 }
        ],
        boss: { type: 'hyperBoss', spawnDelay: 6000 }
    },
    
    // Wave 26 - harder enemies after hyper boss
    {
        waveNumber: 26,
        enemies: [
            { type: 'standard', count: 12, spawnDelay: 190 },
            { type: 'fast', count: 16, spawnDelay: 85 },
            { type: 'swift', count: 16, spawnDelay: 50 },
            { type: 'tank', count: 16, spawnDelay: 240 },
            { type: 'armored', count: 16, spawnDelay: 380 },
            { type: 'hybrid', count: 18, spawnDelay: 260 }
        ]
    },
    
    // Wave 27 - balanced wave with high counts
    {
        waveNumber: 27,
        enemies: [
            { type: 'standard', count: 16, spawnDelay: 180 },
            { type: 'fast', count: 16, spawnDelay: 80 },
            { type: 'swift', count: 16, spawnDelay: 45 },
            { type: 'tank', count: 16, spawnDelay: 230 },
            { type: 'armored', count: 16, spawnDelay: 360 },
            { type: 'hybrid', count: 16, spawnDelay: 250 }
        ]
    },
    
    // Wave 28 - focus on fast and hybrid enemies
    {
        waveNumber: 28,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 170 },
            { type: 'fast', count: 20, spawnDelay: 75 },
            { type: 'swift', count: 20, spawnDelay: 40 },
            { type: 'tank', count: 12, spawnDelay: 220 },
            { type: 'armored', count: 12, spawnDelay: 340 },
            { type: 'hybrid', count: 20, spawnDelay: 240 }
        ]
    },
    
    // Wave 29 - focus on tank and armored enemies
    {
        waveNumber: 29,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 160 },
            { type: 'fast', count: 10, spawnDelay: 70 },
            { type: 'swift', count: 10, spawnDelay: 35 },
            { type: 'tank', count: 20, spawnDelay: 210 },
            { type: 'armored', count: 20, spawnDelay: 320 },
            { type: 'hybrid', count: 15, spawnDelay: 230 }
        ]
    },
    
    // Wave 30 - boss wave with ultra boss
    {
        waveNumber: 30,
        enemies: [
            { type: 'standard', count: 15, spawnDelay: 150 },
            { type: 'fast', count: 15, spawnDelay: 65 },
            { type: 'swift', count: 15, spawnDelay: 30 },
            { type: 'tank', count: 15, spawnDelay: 200 },
            { type: 'armored', count: 15, spawnDelay: 300 },
            { type: 'hybrid', count: 15, spawnDelay: 220 }
        ],
        boss: { type: 'ultraBoss', spawnDelay: 7000 }
    },
    
    // Wave 31 - harder enemies after ultra boss
    {
        waveNumber: 31,
        enemies: [
            { type: 'standard', count: 12, spawnDelay: 140 },
            { type: 'fast', count: 18, spawnDelay: 60 },
            { type: 'swift', count: 18, spawnDelay: 25 },
            { type: 'tank', count: 18, spawnDelay: 190 },
            { type: 'armored', count: 18, spawnDelay: 280 },
            { type: 'hybrid', count: 20, spawnDelay: 210 }
        ]
    },
    
    // Wave 32 - very fast enemies
    {
        waveNumber: 32,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 130 },
            { type: 'fast', count: 22, spawnDelay: 55 },
            { type: 'swift', count: 22, spawnDelay: 20 },
            { type: 'tank', count: 14, spawnDelay: 180 },
            { type: 'armored', count: 14, spawnDelay: 270 },
            { type: 'hybrid', count: 18, spawnDelay: 200 }
        ]
    },
    
    // Wave 33 - heavy tank and armored enemies
    {
        waveNumber: 33,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 120 },
            { type: 'fast', count: 10, spawnDelay: 50 },
            { type: 'swift', count: 10, spawnDelay: 15 },
            { type: 'tank', count: 22, spawnDelay: 170 },
            { type: 'armored', count: 22, spawnDelay: 260 },
            { type: 'hybrid', count: 16, spawnDelay: 190 }
        ]
    },
    
    // Wave 34 - balanced but very difficult
    {
        waveNumber: 34,
        enemies: [
            { type: 'standard', count: 15, spawnDelay: 110 },
            { type: 'fast', count: 20, spawnDelay: 45 },
            { type: 'swift', count: 20, spawnDelay: 10 },
            { type: 'tank', count: 20, spawnDelay: 160 },
            { type: 'armored', count: 20, spawnDelay: 250 },
            { type: 'hybrid', count: 20, spawnDelay: 180 }
        ]
    },
    
    // Wave 35 - boss wave with titan boss
    {
        waveNumber: 35,
        enemies: [
            { type: 'standard', count: 18, spawnDelay: 100 },
            { type: 'fast', count: 18, spawnDelay: 40 },
            { type: 'swift', count: 18, spawnDelay: 8 },
            { type: 'tank', count: 18, spawnDelay: 150 },
            { type: 'armored', count: 18, spawnDelay: 240 },
            { type: 'hybrid', count: 18, spawnDelay: 170 }
        ],
        boss: { type: 'titanBoss', spawnDelay: 8000 }
    },
    
    // Wave 36 - extremely challenging after titan boss
    {
        waveNumber: 36,
        enemies: [
            { type: 'standard', count: 20, spawnDelay: 90 },
            { type: 'fast', count: 20, spawnDelay: 35 },
            { type: 'swift', count: 20, spawnDelay: 7 },
            { type: 'tank', count: 20, spawnDelay: 140 },
            { type: 'armored', count: 20, spawnDelay: 230 },
            { type: 'hybrid', count: 20, spawnDelay: 160 }
        ]
    },
    
    // Wave 37 - heavy wave of hybrid enemies
    {
        waveNumber: 37,
        enemies: [
            { type: 'standard', count: 15, spawnDelay: 80 },
            { type: 'fast', count: 15, spawnDelay: 30 },
            { type: 'swift', count: 15, spawnDelay: 6 },
            { type: 'tank', count: 15, spawnDelay: 130 },
            { type: 'armored', count: 15, spawnDelay: 220 },
            { type: 'hybrid', count: 25, spawnDelay: 150 }
        ]
    },
    
    // Wave 38 - very fast enemies rush
    {
        waveNumber: 38,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 70 },
            { type: 'fast', count: 25, spawnDelay: 25 },
            { type: 'swift', count: 25, spawnDelay: 5 },
            { type: 'tank', count: 15, spawnDelay: 120 },
            { type: 'armored', count: 15, spawnDelay: 210 },
            { type: 'hybrid', count: 20, spawnDelay: 140 }
        ]
    },
    
    // Wave 39 - penultimate wave with massive tank and armored rush
    {
        waveNumber: 39,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 60 },
            { type: 'fast', count: 15, spawnDelay: 20 },
            { type: 'swift', count: 15, spawnDelay: 4 },
            { type: 'tank', count: 25, spawnDelay: 110 },
            { type: 'armored', count: 25, spawnDelay: 200 },
            { type: 'hybrid', count: 20, spawnDelay: 130 }
        ]
    },
    
    // Wave 40 - final wave with ultimate titan boss
    {
        waveNumber: 40,
        enemies: [
            { type: 'standard', count: 20, spawnDelay: 50 },
            { type: 'fast', count: 20, spawnDelay: 15 },
            { type: 'swift', count: 20, spawnDelay: 3 },
            { type: 'tank', count: 20, spawnDelay: 100 },
            { type: 'armored', count: 20, spawnDelay: 180 },
            { type: 'hybrid', count: 20, spawnDelay: 120 }
        ],
        boss: { type: 'ultimateBoss', spawnDelay: 10000 }
    }
]; 