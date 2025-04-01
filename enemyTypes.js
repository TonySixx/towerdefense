// enemyTypes.js - Definice typů nepřátel a bossů

// Základní typy nepřátel
export const enemyTypes = {
    // Základní nepřítel s vyváženými statistikami
    standard: {
        name: "Standard",
        healthModifier: 1.0,     // Standardní množství životů
        speedModifier: 1.0,      // Standardní rychlost
        sizeModifier: 1.0,       // Standardní velikost
        valueModifier: 1.0,      // Standardní odměna
        color: '#e56b6f',        // Červená barva
        darkerColor: '#b54d4f',  // Tmavě červená barva
        isBoss: false
    },
    
    // Rychlý, ale slabý nepřítel
    fast: {
        name: "Fast",
        healthModifier: 0.6,     // Méně životů
        speedModifier: 1.7,      // Výrazně vyšší rychlost
        sizeModifier: 0.8,       // O něco menší
        valueModifier: 1.2,      // Mírně vyšší odměna
        color: '#52b788',        // Zelená barva
        darkerColor: '#2d6a4f',  // Tmavě zelená barva
        isBoss: false
    },
    
    // Pomalý, ale odolný nepřítel
    tank: {
        name: "Tank",
        healthModifier: 2.2,     // Výrazně více životů
        speedModifier: 0.6,      // Podstatně nižší rychlost
        sizeModifier: 1.3,       // Větší velikost
        valueModifier: 1.5,      // Vyšší odměna
        color: '#6d6875',        // Šedá barva
        darkerColor: '#4a4e69',  // Tmavě šedá barva
        isBoss: false
    },
    
    // Velmi rychlý a malý nepřítel
    swift: {
        name: "Swift",
        healthModifier: 0.4,     // Velmi málo životů
        speedModifier: 2.2,      // Extrémně vysoká rychlost
        sizeModifier: 0.6,       // Velmi malý
        valueModifier: 1.3,      // Vyšší odměna
        color: '#48cae4',        // Světle modrá barva
        darkerColor: '#0096c7',  // Tmavě modrá barva
        isBoss: false
    },
    
    // Vysoce odolný, ale pomalý nepřítel
    armored: {
        name: "Armored",
        healthModifier: 3.0,     // Extrémně vysoké životy
        speedModifier: 0.5,      // Velmi nízká rychlost
        sizeModifier: 1.2,       // Větší velikost
        valueModifier: 2.0,      // Vysoká odměna
        color: '#cdb4db',        // Fialová barva
        darkerColor: '#a2a3bb',  // Tmavě fialová barva
        isBoss: false
    },
    
    // Vyváženější nepřítel kombinující rychlost a odolnost
    hybrid: {
        name: "Hybrid",
        healthModifier: 1.8,     // Téměř tak odolný jako tank
        speedModifier: 1.4,      // Rychlejší než standard, ale ne tak rychlý jako fast typy
        sizeModifier: 1.1,       // Mírně větší
        valueModifier: 2.5,      // Vysoká odměna kvůli náročnosti
        color: '#9d4edd',        // Fialová barva
        darkerColor: '#5a189a',  // Tmavě fialová barva
        isBoss: false
    }
};

// Bossy (speciální nepřátelé na konci vln 5, 10 a 15)
export const bossTypes = {
    // Boss pro vlnu 5
    waveBoss5: {
        name: "Wave 5 Boss",
        healthModifier: 5.0,     // 5x více životů než standardní nepřítel
        speedModifier: 0.8,      // Mírně pomalejší
        sizeModifier: 1.8,       // Výrazně větší
        valueModifier: 5.0,      // 5x větší odměna
        color: '#ef476f',        // Výrazně červená barva
        darkerColor: '#c9184a',  // Tmavě červená barva
        isBoss: true,
        waveAppearance: 5,       // Boss se objeví ve vlně 5
        spawnDelay: 3000         // Delší prodleva před spawnováním (v ms)
    },
    
    // Boss pro vlnu 10
    waveBoss10: {
        name: "Wave 10 Boss",
        healthModifier: 12.0,    // 12x více životů
        speedModifier: 0.7,      // Ještě pomalejší
        sizeModifier: 2.0,       // Dvojnásobná velikost
        valueModifier: 10.0,     // 10x větší odměna
        color: '#ffd166',        // Zlatá barva
        darkerColor: '#e29e21',  // Tmavě zlatá barva
        isBoss: true,
        waveAppearance: 10,      // Boss se objeví ve vlně 10
        spawnDelay: 4000         // Ještě delší prodleva (v ms)
    },
    
    // Finální boss pro vlnu 15
    finalBoss: {
        name: "Final Boss",
        healthModifier: 25.0,    // 25x více životů
        speedModifier: 0.9,      // Průměrná rychlost
        sizeModifier: 2.5,       // 2.5x větší velikost
        valueModifier: 20.0,     // 20x větší odměna
        color: '#6a0dad',        // Jasně fialová barva
        darkerColor: '#3a015c',  // Tmavě fialová barva
        isBoss: true,
        waveAppearance: 15,      // Boss se objeví ve vlně 15
        spawnDelay: 5000         // Velmi dlouhá prodleva (v ms)
    },
    
    // Ultimátní megaboss pro vlnu 20
    megaBoss: {
        name: "Mega Boss",
        healthModifier: 40.0,    // 40x více životů než standard
        speedModifier: 1.1,      // Mírně rychlejší než standard
        sizeModifier: 3.0,       // 3x větší velikost
        valueModifier: 40.0,     // 40x větší odměna
        color: '#ff0000',        // Jasně červená barva
        darkerColor: '#8b0000',  // Tmavě červená barva
        isBoss: true,
        waveAppearance: 20,      // Boss se objeví ve finální vlně 20
        spawnDelay: 6000         // Extrémně dlouhá prodleva (v ms)
    }
};

// Konfigurace vln - určuje, jací nepřátelé se objeví v jednotlivých vlnách
export const waveConfigurations = [
    // Vlna 1 - pouze standardní nepřátelé
    {
        waveNumber: 1,
        enemies: [
            { type: 'standard', count: 10, spawnDelay: 900 }
        ]
    },
    // Vlna 2 - standardní + pár rychlých
    {
        waveNumber: 2,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 900 },
            { type: 'fast', count: 3, spawnDelay: 800 }
        ]
    },
    // Vlna 3 - více rychlých + první tank
    {
        waveNumber: 3,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 900 },
            { type: 'fast', count: 6, spawnDelay: 700 },
            { type: 'tank', count: 1, spawnDelay: 1500 }
        ]
    },
    // Vlna 4 - mix standardních, rychlých a tanků
    {
        waveNumber: 4,
        enemies: [
            { type: 'standard', count: 8, spawnDelay: 850 },
            { type: 'fast', count: 5, spawnDelay: 650 },
            { type: 'tank', count: 2, spawnDelay: 1400 }
        ]
    },
    // Vlna 5 - těžší mix + první boss
    {
        waveNumber: 5,
        enemies: [
            { type: 'standard', count: 5, spawnDelay: 800 },
            { type: 'fast', count: 8, spawnDelay: 600 },
            { type: 'tank', count: 3, spawnDelay: 1300 }
        ],
        boss: { type: 'waveBoss5', spawnDelay: 3000 }
    },
    // Vlna 6 - přidáme swift nepřátele
    {
        waveNumber: 6,
        enemies: [
            { type: 'standard', count: 7, spawnDelay: 800 },
            { type: 'fast', count: 5, spawnDelay: 600 },
            { type: 'swift', count: 4, spawnDelay: 500 },
            { type: 'tank', count: 2, spawnDelay: 1200 }
        ]
    },
    // Vlna 7 - mix všech typů
    {
        waveNumber: 7,
        enemies: [
            { type: 'standard', count: 6, spawnDelay: 750 },
            { type: 'fast', count: 6, spawnDelay: 550 },
            { type: 'swift', count: 6, spawnDelay: 450 },
            { type: 'tank', count: 3, spawnDelay: 1100 }
        ]
    },
    // Vlna 8 - přidáme armored nepřátele
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
    // Vlna 9 - těžký mix všech typů
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
    // Vlna 10 - střední mix + boss vlny 10
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
    // Vlna 11 - těžký mix po bossovi
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
    // Vlna 12 - těžký mix s důrazem na rychlé typy
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
    // Vlna 13 - těžký mix s důrazem na odolné typy
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
    // Vlna 14 - předposlední vlna, těžký mix všeho
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
    // Vlna 15 - finální vlna s nejtěžším mixem a finálním bossem
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
    // Vlna 16 - první vlna nové výzvy, představení hybrid nepřátel
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
    // Vlna 17 - důraz na rychlé nepřátele
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
    // Vlna 18 - vyvážený mix se zvýšeným počtem všech jednotek
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
    // Vlna 19 - předposlední vlna s důrazem na odolné nepřátele
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
    // Vlna 20 - finální vlna s ultimátním megabossem
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
    }
]; 