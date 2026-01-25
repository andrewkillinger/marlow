// Material types and their properties
const MaterialType = {
    EMPTY: 0,
    SAND: 1,
    STONE: 2,
    WOOD: 3,
    WATER: 4,
    OIL: 5,
    LAVA: 6,
    FIRE: 7,
    STEAM: 8,
    SMOKE: 9,
    PLANT: 10
};

// Material categories for UI
const MaterialCategories = {
    solid: [MaterialType.SAND, MaterialType.STONE, MaterialType.WOOD],
    liquid: [MaterialType.WATER, MaterialType.OIL, MaterialType.LAVA],
    gas: [MaterialType.FIRE, MaterialType.STEAM, MaterialType.SMOKE],
    special: [MaterialType.PLANT],
    tools: ['eraser', 'clear']
};

// Material properties
const Materials = {
    [MaterialType.EMPTY]: {
        name: 'Empty',
        density: 0,
        durability: 0,
        flammable: false,
        state: 'none',
        colors: ['#1a1a2e']
    },
    [MaterialType.SAND]: {
        name: 'Sand',
        density: 1.5,
        durability: 0.3,
        flammable: false,
        state: 'powder',
        colors: ['#e6c86e', '#d4b85e', '#c9a84e', '#dfc16a', '#e8d078'],
        behavior: 'fall'
    },
    [MaterialType.STONE]: {
        name: 'Stone',
        density: 2.5,
        durability: 1.0,
        flammable: false,
        state: 'solid',
        colors: ['#7a7a8c', '#6a6a7c', '#8a8a9c', '#5a5a6c', '#9090a0'],
        behavior: 'static'
    },
    [MaterialType.WOOD]: {
        name: 'Wood',
        density: 0.6,
        durability: 0.5,
        flammable: true,
        burnTemp: 300,
        state: 'solid',
        colors: ['#8b6b4a', '#7b5b3a', '#9b7b5a', '#6b4a2a', '#a08060'],
        behavior: 'static'
    },
    [MaterialType.WATER]: {
        name: 'Water',
        density: 1.0,
        durability: 0,
        flammable: false,
        state: 'liquid',
        colors: ['#4a9eff', '#3a8eef', '#5aaeFF', '#2d7dd2', '#60b4ff'],
        behavior: 'liquid',
        evaporateTemp: 100
    },
    [MaterialType.OIL]: {
        name: 'Oil',
        density: 0.8,
        durability: 0,
        flammable: true,
        burnTemp: 200,
        state: 'liquid',
        colors: ['#4a4a3a', '#3a3a2a', '#5a5a4a', '#2a2a1a', '#606050'],
        behavior: 'liquid'
    },
    [MaterialType.LAVA]: {
        name: 'Lava',
        density: 3.0,
        durability: 0,
        flammable: false,
        state: 'liquid',
        temperature: 1200,
        colors: ['#ff5722', '#ff6a00', '#ff4500', '#e64a19', '#ff7043'],
        behavior: 'liquid',
        glows: true
    },
    [MaterialType.FIRE]: {
        name: 'Fire',
        density: 0.1,
        durability: 0,
        flammable: false,
        state: 'gas',
        temperature: 600,
        lifetime: 60,
        colors: ['#ff9800', '#ff5722', '#ffeb3b', '#f57c00', '#ff6f00'],
        behavior: 'fire',
        glows: true
    },
    [MaterialType.STEAM]: {
        name: 'Steam',
        density: 0.05,
        durability: 0,
        flammable: false,
        state: 'gas',
        lifetime: 120,
        colors: ['#b8d4e8', '#c8e4f8', '#a8c4d8', '#d8f4ff', '#90b8d4'],
        behavior: 'gas'
    },
    [MaterialType.SMOKE]: {
        name: 'Smoke',
        density: 0.08,
        durability: 0,
        flammable: false,
        state: 'gas',
        lifetime: 180,
        colors: ['#5a5a5a', '#4a4a4a', '#6a6a6a', '#3a3a3a', '#707070'],
        behavior: 'gas'
    },
    [MaterialType.PLANT]: {
        name: 'Plant',
        density: 0.4,
        durability: 0.3,
        flammable: true,
        burnTemp: 250,
        state: 'solid',
        colors: ['#7ed56f', '#6ec55f', '#8ee57f', '#5eb54f', '#4caf50'],
        behavior: 'plant',
        growthRate: 0.02
    }
};

// Get a random color variant for a material
function getMaterialColor(type) {
    const material = Materials[type];
    if (!material || !material.colors) return '#1a1a2e';
    return material.colors[Math.floor(Math.random() * material.colors.length)];
}

// Check if material A can displace material B (based on density)
function canDisplace(typeA, typeB) {
    if (typeB === MaterialType.EMPTY) return true;
    const matA = Materials[typeA];
    const matB = Materials[typeB];
    if (!matA || !matB) return false;
    return matA.density > matB.density && matB.state !== 'solid';
}
