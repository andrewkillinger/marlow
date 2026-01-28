/**
 * Marlow's Lemonade Stand - Economy System
 * Handles all game economy calculations including upgrades, income, and progression
 */

const Economy = (function() {
    'use strict';

    // Save version for migration handling
    const SAVE_VERSION = 1;

    // Base game constants
    const BASE_LEMONADE_PRICE = 0.25;
    const BASE_CLICK_VALUE = 0.10;
    const LEVEL_UP_BASE = 100;
    const LEVEL_UP_MULTIPLIER = 1.5;

    // Upgrade definitions
    const UPGRADES = {
        // Stand upgrades
        betterLemons: {
            id: 'betterLemons',
            name: 'Better Lemons',
            description: 'Juicier lemons mean more profit!',
            baseCost: 5,
            costMultiplier: 1.15,
            effect: 'clickValue',
            effectValue: 0.05,
            maxLevel: 50,
            category: 'stand'
        },
        fasterSqueezing: {
            id: 'fasterSqueezing',
            name: 'Faster Squeezing',
            description: 'Squeeze lemons faster!',
            baseCost: 15,
            costMultiplier: 1.2,
            effect: 'clickValue',
            effectValue: 0.10,
            maxLevel: 30,
            category: 'stand'
        },
        biggerCups: {
            id: 'biggerCups',
            name: 'Bigger Cups',
            description: 'Sell more lemonade per cup!',
            baseCost: 50,
            costMultiplier: 1.25,
            effect: 'priceMultiplier',
            effectValue: 0.1,
            maxLevel: 25,
            category: 'stand'
        },
        prettySign: {
            id: 'prettySign',
            name: 'Pretty Sign',
            description: 'Attracts more customers!',
            baseCost: 25,
            costMultiplier: 1.18,
            effect: 'customerRate',
            effectValue: 0.05,
            maxLevel: 40,
            category: 'marketing'
        },
        // Auto-sellers (idle income)
        helper: {
            id: 'helper',
            name: 'Hire Helper',
            description: 'Someone to help sell lemonade!',
            baseCost: 100,
            costMultiplier: 1.3,
            effect: 'autoIncome',
            effectValue: 0.5,
            maxLevel: 20,
            category: 'helpers'
        },
        lemonadeRobot: {
            id: 'lemonadeRobot',
            name: '3D Printed Robot',
            description: 'Daddy helped make this with his 3D printer!',
            baseCost: 500,
            costMultiplier: 1.4,
            effect: 'autoIncome',
            effectValue: 2.5,
            maxLevel: 15,
            category: 'helpers',
            isEasterEgg: true
        },
        // Special upgrades
        goldenLemon: {
            id: 'goldenLemon',
            name: 'Golden Lemon',
            description: 'A magical golden lemon that boosts everything!',
            baseCost: 1000,
            costMultiplier: 2.0,
            effect: 'globalMultiplier',
            effectValue: 0.25,
            maxLevel: 10,
            category: 'special'
        },
        poppyHelper: {
            id: 'poppyHelper',
            name: 'Poppy the Greeter',
            description: 'Poppy welcomes customers with wagging tail!',
            baseCost: 200,
            costMultiplier: 1.35,
            effect: 'customerRate',
            effectValue: 0.15,
            maxLevel: 10,
            category: 'helpers',
            isEasterEgg: true
        },
        winnieGuard: {
            id: 'winnieGuard',
            name: 'Winnie the Guard Dog',
            description: 'Winnie protects your lemons from squirrels!',
            baseCost: 250,
            costMultiplier: 1.35,
            effect: 'lemonSaver',
            effectValue: 0.1,
            maxLevel: 10,
            category: 'helpers',
            isEasterEgg: true
        },
        violetMarketing: {
            id: 'violetMarketing',
            name: "Violet's Art Stand",
            description: 'Sister Violet decorates the stand beautifully!',
            baseCost: 150,
            costMultiplier: 1.25,
            effect: 'priceMultiplier',
            effectValue: 0.15,
            maxLevel: 15,
            category: 'marketing',
            isEasterEgg: true
        },
        mommyRecipe: {
            id: 'mommyRecipe',
            name: "Mommy's Secret Recipe",
            description: 'A special family recipe that customers love!',
            baseCost: 300,
            costMultiplier: 1.5,
            effect: 'clickValue',
            effectValue: 0.25,
            maxLevel: 10,
            category: 'special',
            isEasterEgg: true
        },
        labubuCharm: {
            id: 'labubuCharm',
            name: 'Labubu Lucky Charm',
            description: 'This cute Labubu brings good luck!',
            baseCost: 175,
            costMultiplier: 1.3,
            effect: 'luckyChance',
            effectValue: 0.05,
            maxLevel: 10,
            category: 'special',
            isEasterEgg: true
        },
        volleyballSign: {
            id: 'volleyballSign',
            name: 'Volleyball Tournament Ad',
            description: 'Advertise at volleyball games!',
            baseCost: 400,
            costMultiplier: 1.4,
            effect: 'customerRate',
            effectValue: 0.2,
            maxLevel: 8,
            category: 'marketing',
            isEasterEgg: true
        },
        basketballCooler: {
            id: 'basketballCooler',
            name: 'Basketball Court Cooler',
            description: 'Sell cold lemonade at basketball games!',
            baseCost: 350,
            costMultiplier: 1.35,
            effect: 'autoIncome',
            effectValue: 1.5,
            maxLevel: 12,
            category: 'expansion',
            isEasterEgg: true
        },
        missionEstanciaSpot: {
            id: 'missionEstanciaSpot',
            name: 'Mission Estancia Location',
            description: 'Open a second stand at Mission Estancia!',
            baseCost: 2000,
            costMultiplier: 2.5,
            effect: 'autoIncome',
            effectValue: 10,
            maxLevel: 5,
            category: 'expansion',
            isEasterEgg: true
        }
    };

    // Stand evolution levels (visual progression)
    const STAND_LEVELS = [
        { level: 1, name: 'Cardboard Box Stand', moneyRequired: 0 },
        { level: 2, name: 'Wooden Crate Stand', moneyRequired: 50 },
        { level: 3, name: 'Small Table Stand', moneyRequired: 200 },
        { level: 4, name: 'Decorated Stand', moneyRequired: 500 },
        { level: 5, name: 'Professional Booth', moneyRequired: 1500 },
        { level: 6, name: 'Fancy Kiosk', moneyRequired: 5000 },
        { level: 7, name: 'Mini Shop', moneyRequired: 15000 },
        { level: 8, name: 'Lemonade Cafe', moneyRequired: 50000 },
        { level: 9, name: 'Lemonade Empire HQ', moneyRequired: 150000 },
        { level: 10, name: "Marlow's Lemonade Palace", moneyRequired: 500000 }
    ];

    // Quests
    const QUESTS = [
        { id: 'firstSale', name: 'First Sale!', description: 'Sell your first lemonade', requirement: { type: 'sales', amount: 1 }, reward: 5 },
        { id: 'tenSales', name: 'Getting Started', description: 'Sell 10 lemonades', requirement: { type: 'sales', amount: 10 }, reward: 15 },
        { id: 'hundredSales', name: 'Popular Stand', description: 'Sell 100 lemonades', requirement: { type: 'sales', amount: 100 }, reward: 50 },
        { id: 'thousandSales', name: 'Lemonade Master', description: 'Sell 1,000 lemonades', requirement: { type: 'sales', amount: 1000 }, reward: 200 },
        { id: 'firstUpgrade', name: 'Upgrade Time!', description: 'Buy your first upgrade', requirement: { type: 'upgrades', amount: 1 }, reward: 10 },
        { id: 'fiveUpgrades', name: 'Improving', description: 'Buy 5 upgrades', requirement: { type: 'upgrades', amount: 5 }, reward: 25 },
        { id: 'tenUpgrades', name: 'Expert Upgrader', description: 'Buy 10 upgrades', requirement: { type: 'upgrades', amount: 10 }, reward: 75 },
        { id: 'levelTwo', name: 'Moving Up!', description: 'Reach stand level 2', requirement: { type: 'standLevel', amount: 2 }, reward: 20 },
        { id: 'levelFive', name: 'Growing Business', description: 'Reach stand level 5', requirement: { type: 'standLevel', amount: 5 }, reward: 100 },
        { id: 'levelTen', name: 'Lemonade Tycoon', description: 'Reach stand level 10', requirement: { type: 'standLevel', amount: 10 }, reward: 1000 },
        { id: 'earnHundred', name: 'First Hundred', description: 'Earn $100 total', requirement: { type: 'totalEarned', amount: 100 }, reward: 25 },
        { id: 'earnThousand', name: 'Big Money', description: 'Earn $1,000 total', requirement: { type: 'totalEarned', amount: 1000 }, reward: 100 },
        { id: 'firstHelper', name: 'Team Building', description: 'Hire your first helper', requirement: { type: 'specificUpgrade', upgradeId: 'helper', amount: 1 }, reward: 50 },
        { id: 'familyBusiness', name: 'Family Business', description: 'Get Violet, Poppy, and Winnie to help', requirement: { type: 'multiUpgrade', upgradeIds: ['violetMarketing', 'poppyHelper', 'winnieGuard'], amount: 1 }, reward: 250 },
        { id: 'luckyDay', name: 'Lucky Day', description: 'Get a lucky bonus 5 times', requirement: { type: 'luckyBonus', amount: 5 }, reward: 75 }
    ];

    // Random events
    const EVENTS = [
        { id: 'hotDay', name: 'Hot Day!', description: 'Everyone wants lemonade!', effect: { type: 'tempMultiplier', value: 2, duration: 30000 }, chance: 0.1, isPositive: true },
        { id: 'parade', name: 'Parade Day!', description: 'A parade brings lots of customers!', effect: { type: 'tempMultiplier', value: 3, duration: 20000 }, chance: 0.05, isPositive: true },
        { id: 'rainyDay', name: 'Rainy Day', description: 'Fewer customers today...', effect: { type: 'tempMultiplier', value: 0.5, duration: 20000 }, chance: 0.08, isPositive: false },
        { id: 'lemonSale', name: 'Lemon Sale!', description: 'Lemons are cheap today!', effect: { type: 'tempBonus', value: 10 }, chance: 0.07, isPositive: true },
        { id: 'famousVisitor', name: 'Famous Visitor!', description: 'Someone famous visited your stand!', effect: { type: 'tempMultiplier', value: 5, duration: 15000 }, chance: 0.02, isPositive: true },
        { id: 'dogShow', name: 'Dog Show Nearby!', description: 'Poppy and Winnie attract dog lovers!', effect: { type: 'tempMultiplier', value: 2.5, duration: 25000 }, chance: 0.06, isPositive: true, requiresUpgrade: 'poppyHelper' },
        { id: 'sportsTournament', name: 'Sports Tournament!', description: 'Big game brings thirsty fans!', effect: { type: 'tempMultiplier', value: 4, duration: 30000 }, chance: 0.04, isPositive: true },
        { id: 'labubuFever', name: 'Labubu Craze!', description: 'Your Labubu decoration goes viral!', effect: { type: 'instantBonus', value: 50 }, chance: 0.03, isPositive: true, requiresUpgrade: 'labubuCharm' }
    ];

    // Collections (collectible items)
    const COLLECTIONS = {
        lemons: {
            name: 'Lemon Collection',
            items: [
                { id: 'regularLemon', name: 'Regular Lemon', description: 'A basic yellow lemon', rarity: 'common', chance: 0.1 },
                { id: 'meyerLemon', name: 'Meyer Lemon', description: 'Sweeter and rounder', rarity: 'uncommon', chance: 0.05 },
                { id: 'eureka', name: 'Eureka Lemon', description: 'Classic lemonade lemon', rarity: 'uncommon', chance: 0.05 },
                { id: 'pinkLemon', name: 'Pink Lemon', description: 'Rare variegated pink!', rarity: 'rare', chance: 0.02 },
                { id: 'goldenLemon', name: 'Golden Lemon', description: 'Sparkles with magic!', rarity: 'legendary', chance: 0.005 }
            ]
        },
        cups: {
            name: 'Cup Collection',
            items: [
                { id: 'paperCup', name: 'Paper Cup', description: 'Basic but works!', rarity: 'common', chance: 0.1 },
                { id: 'plasticCup', name: 'Fancy Plastic Cup', description: 'Clear and pretty', rarity: 'uncommon', chance: 0.05 },
                { id: 'glassCup', name: 'Glass Cup', description: 'Eco-friendly and fancy', rarity: 'rare', chance: 0.02 },
                { id: 'trophyCup', name: 'Trophy Cup', description: 'You\'re a champion!', rarity: 'legendary', chance: 0.005 }
            ]
        },
        decorations: {
            name: 'Decoration Collection',
            items: [
                { id: 'balloon', name: 'Yellow Balloon', description: 'Floats above the stand', rarity: 'common', chance: 0.08 },
                { id: 'banner', name: 'Colorful Banner', description: 'Handmade by Violet', rarity: 'uncommon', chance: 0.04 },
                { id: 'lights', name: 'Fairy Lights', description: 'Twinkle twinkle!', rarity: 'rare', chance: 0.02 },
                { id: 'labubuStatue', name: 'Labubu Statue', description: 'A collectible Labubu!', rarity: 'legendary', chance: 0.003 }
            ]
        }
    };

    /**
     * Calculate the cost of an upgrade at a specific level
     * @param {string} upgradeId - The upgrade identifier
     * @param {number} currentLevel - Current level of the upgrade
     * @returns {number} The cost for the next level
     */
    function calculateUpgradeCost(upgradeId, currentLevel) {
        const upgrade = UPGRADES[upgradeId];
        if (!upgrade) return Infinity;
        if (currentLevel >= upgrade.maxLevel) return Infinity;

        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel) * 100) / 100;
    }

    /**
     * Calculate click value based on upgrades
     * @param {Object} upgradeLevels - Object containing current level of each upgrade
     * @returns {number} The value earned per click
     */
    function calculateClickValue(upgradeLevels) {
        let clickValue = BASE_CLICK_VALUE;

        for (const [upgradeId, level] of Object.entries(upgradeLevels)) {
            const upgrade = UPGRADES[upgradeId];
            if (upgrade && upgrade.effect === 'clickValue') {
                clickValue += upgrade.effectValue * level;
            }
        }

        // Apply global multiplier
        const globalMult = calculateGlobalMultiplier(upgradeLevels);
        clickValue *= globalMult;

        return Math.round(clickValue * 100) / 100;
    }

    /**
     * Calculate auto income per second based on upgrades
     * @param {Object} upgradeLevels - Object containing current level of each upgrade
     * @returns {number} Income per second from auto-sellers
     */
    function calculateAutoIncome(upgradeLevels) {
        let autoIncome = 0;

        for (const [upgradeId, level] of Object.entries(upgradeLevels)) {
            const upgrade = UPGRADES[upgradeId];
            if (upgrade && upgrade.effect === 'autoIncome') {
                autoIncome += upgrade.effectValue * level;
            }
        }

        // Apply global multiplier
        const globalMult = calculateGlobalMultiplier(upgradeLevels);
        autoIncome *= globalMult;

        return Math.round(autoIncome * 100) / 100;
    }

    /**
     * Calculate price multiplier based on upgrades
     * @param {Object} upgradeLevels - Object containing current level of each upgrade
     * @returns {number} The price multiplier
     */
    function calculatePriceMultiplier(upgradeLevels) {
        let multiplier = 1;

        for (const [upgradeId, level] of Object.entries(upgradeLevels)) {
            const upgrade = UPGRADES[upgradeId];
            if (upgrade && upgrade.effect === 'priceMultiplier') {
                multiplier += upgrade.effectValue * level;
            }
        }

        return Math.round(multiplier * 100) / 100;
    }

    /**
     * Calculate global multiplier from special upgrades
     * @param {Object} upgradeLevels - Object containing current level of each upgrade
     * @returns {number} The global multiplier
     */
    function calculateGlobalMultiplier(upgradeLevels) {
        let multiplier = 1;

        for (const [upgradeId, level] of Object.entries(upgradeLevels)) {
            const upgrade = UPGRADES[upgradeId];
            if (upgrade && upgrade.effect === 'globalMultiplier') {
                multiplier += upgrade.effectValue * level;
            }
        }

        return multiplier;
    }

    /**
     * Calculate customer rate multiplier
     * @param {Object} upgradeLevels - Object containing current level of each upgrade
     * @returns {number} The customer rate multiplier
     */
    function calculateCustomerRate(upgradeLevels) {
        let rate = 1;

        for (const [upgradeId, level] of Object.entries(upgradeLevels)) {
            const upgrade = UPGRADES[upgradeId];
            if (upgrade && upgrade.effect === 'customerRate') {
                rate += upgrade.effectValue * level;
            }
        }

        return rate;
    }

    /**
     * Calculate lucky chance from upgrades
     * @param {Object} upgradeLevels - Object containing current level of each upgrade
     * @returns {number} The lucky chance (0-1)
     */
    function calculateLuckyChance(upgradeLevels) {
        let chance = 0.01; // Base 1% chance

        for (const [upgradeId, level] of Object.entries(upgradeLevels)) {
            const upgrade = UPGRADES[upgradeId];
            if (upgrade && upgrade.effect === 'luckyChance') {
                chance += upgrade.effectValue * level;
            }
        }

        return Math.min(chance, 0.5); // Cap at 50%
    }

    /**
     * Get the current stand level based on total money earned
     * @param {number} totalEarned - Total money earned in the game
     * @returns {Object} The current stand level object
     */
    function getStandLevel(totalEarned) {
        let currentLevel = STAND_LEVELS[0];

        for (const level of STAND_LEVELS) {
            if (totalEarned >= level.moneyRequired) {
                currentLevel = level;
            } else {
                break;
            }
        }

        return currentLevel;
    }

    /**
     * Get progress to next stand level
     * @param {number} totalEarned - Total money earned
     * @returns {Object} Progress info with current, next, and percentage
     */
    function getStandProgress(totalEarned) {
        const current = getStandLevel(totalEarned);
        const currentIndex = STAND_LEVELS.findIndex(l => l.level === current.level);
        const next = STAND_LEVELS[currentIndex + 1];

        if (!next) {
            return { current, next: null, progress: 1 };
        }

        const progressMoney = totalEarned - current.moneyRequired;
        const requiredMoney = next.moneyRequired - current.moneyRequired;
        const progress = Math.min(progressMoney / requiredMoney, 1);

        return { current, next, progress };
    }

    /**
     * Check which quests are completed
     * @param {Object} stats - Player statistics
     * @param {Object} upgradeLevels - Current upgrade levels
     * @param {Array} completedQuests - Array of completed quest IDs
     * @returns {Array} Newly completed quest objects
     */
    function checkQuests(stats, upgradeLevels, completedQuests) {
        const newlyCompleted = [];

        for (const quest of QUESTS) {
            if (completedQuests.includes(quest.id)) continue;

            let completed = false;

            switch (quest.requirement.type) {
                case 'sales':
                    completed = stats.totalSales >= quest.requirement.amount;
                    break;
                case 'upgrades':
                    const totalUpgrades = Object.values(upgradeLevels).reduce((a, b) => a + b, 0);
                    completed = totalUpgrades >= quest.requirement.amount;
                    break;
                case 'standLevel':
                    const standLevel = getStandLevel(stats.totalEarned);
                    completed = standLevel.level >= quest.requirement.amount;
                    break;
                case 'totalEarned':
                    completed = stats.totalEarned >= quest.requirement.amount;
                    break;
                case 'specificUpgrade':
                    completed = (upgradeLevels[quest.requirement.upgradeId] || 0) >= quest.requirement.amount;
                    break;
                case 'multiUpgrade':
                    completed = quest.requirement.upgradeIds.every(id =>
                        (upgradeLevels[id] || 0) >= quest.requirement.amount
                    );
                    break;
                case 'luckyBonus':
                    completed = (stats.luckyBonuses || 0) >= quest.requirement.amount;
                    break;
            }

            if (completed) {
                newlyCompleted.push(quest);
            }
        }

        return newlyCompleted;
    }

    /**
     * Try to get a random event
     * @param {Object} upgradeLevels - Current upgrade levels
     * @returns {Object|null} Event object or null
     */
    function tryGetRandomEvent(upgradeLevels) {
        for (const event of EVENTS) {
            if (event.requiresUpgrade && !upgradeLevels[event.requiresUpgrade]) {
                continue;
            }

            if (Math.random() < event.chance) {
                return event;
            }
        }

        return null;
    }

    /**
     * Try to collect a random item
     * @returns {Object|null} Collected item or null
     */
    function tryCollectItem() {
        for (const [collectionId, collection] of Object.entries(COLLECTIONS)) {
            for (const item of collection.items) {
                if (Math.random() < item.chance) {
                    return { collectionId, item };
                }
            }
        }
        return null;
    }

    /**
     * Calculate money required to reach next level
     * @param {number} currentLevel - Current player level
     * @returns {number} Money required
     */
    function getLevelUpRequirement(currentLevel) {
        return Math.floor(LEVEL_UP_BASE * Math.pow(LEVEL_UP_MULTIPLIER, currentLevel - 1));
    }

    /**
     * Create a new save state
     * @returns {Object} Fresh save state
     */
    function createNewSave() {
        return {
            version: SAVE_VERSION,
            money: 0,
            totalEarned: 0,
            totalSales: 0,
            upgradeLevels: {},
            completedQuests: [],
            collections: {},
            luckyBonuses: 0,
            playTime: 0,
            lastSaved: Date.now(),
            settings: {
                soundEnabled: true,
                particlesEnabled: true
            }
        };
    }

    /**
     * Migrate old save data to current version
     * @param {Object} saveData - Old save data
     * @returns {Object} Migrated save data
     */
    function migrateSave(saveData) {
        // If no version, it's very old - create fresh
        if (!saveData.version) {
            return createNewSave();
        }

        // Version 1 is current, no migration needed
        if (saveData.version === SAVE_VERSION) {
            return saveData;
        }

        // Future migrations would go here
        return saveData;
    }

    /**
     * Validate save data integrity
     * @param {Object} saveData - Save data to validate
     * @returns {boolean} Whether data is valid
     */
    function validateSave(saveData) {
        if (!saveData || typeof saveData !== 'object') return false;
        if (typeof saveData.money !== 'number' || saveData.money < 0) return false;
        if (typeof saveData.totalEarned !== 'number') return false;
        if (typeof saveData.totalSales !== 'number') return false;
        if (!saveData.upgradeLevels || typeof saveData.upgradeLevels !== 'object') return false;

        return true;
    }

    // Export for testing and game use
    return {
        SAVE_VERSION,
        UPGRADES,
        STAND_LEVELS,
        QUESTS,
        EVENTS,
        COLLECTIONS,
        BASE_CLICK_VALUE,
        BASE_LEMONADE_PRICE,
        calculateUpgradeCost,
        calculateClickValue,
        calculateAutoIncome,
        calculatePriceMultiplier,
        calculateGlobalMultiplier,
        calculateCustomerRate,
        calculateLuckyChance,
        getStandLevel,
        getStandProgress,
        checkQuests,
        tryGetRandomEvent,
        tryCollectItem,
        getLevelUpRequirement,
        createNewSave,
        migrateSave,
        validateSave
    };
})();

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Economy;
}
