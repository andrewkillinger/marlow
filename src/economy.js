/**
 * Marlow's Lemonade Stand - Economy System
 * Handles all game economy calculations including upgrades, income, and progression
 */

const Economy = (function() {
    'use strict';

    // Save version for migration handling
    const SAVE_VERSION = 2;

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
            category: 'helpers',
            isEasterEgg: true
        },
        daddyManager: {
            id: 'daddyManager',
            name: "Daddy the Manager",
            description: 'Daddy helps run the business!',
            baseCost: 400,
            costMultiplier: 1.4,
            effect: 'autoIncome',
            effectValue: 3.0,
            maxLevel: 10,
            category: 'helpers',
            isEasterEgg: true
        },
        mommyAccountant: {
            id: 'mommyAccountant',
            name: "Mommy the Accountant",
            description: 'Mommy tracks all the money!',
            baseCost: 350,
            costMultiplier: 1.35,
            effect: 'priceMultiplier',
            effectValue: 0.2,
            maxLevel: 10,
            category: 'helpers',
            isEasterEgg: true
        },
        amelieFriend: {
            id: 'amelieFriend',
            name: "Amelie's Help",
            description: 'Best friend Amelie brings more customers!',
            baseCost: 180,
            costMultiplier: 1.28,
            effect: 'customerRate',
            effectValue: 0.12,
            maxLevel: 12,
            category: 'helpers',
            isEasterEgg: true
        },
        maddieFriend: {
            id: 'maddieFriend',
            name: "Maddie's Help",
            description: 'Best friend Maddie helps make lemonade!',
            baseCost: 200,
            costMultiplier: 1.3,
            effect: 'clickValue',
            effectValue: 0.15,
            maxLevel: 12,
            category: 'helpers',
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

    // ========================================
    // NEW: Daily Challenge System
    // ========================================

    const DAILY_CHALLENGE_POOL = [
        // Easy challenges (reward <= 30)
        { id: 'tap50', name: 'Tappy Fingers', description: 'Tap 50 times today', requirement: { type: 'dailyTaps', amount: 50 }, reward: 20 },
        { id: 'earn25', name: 'Quick Earner', description: 'Earn $25 today', requirement: { type: 'dailyEarned', amount: 25 }, reward: 15 },
        { id: 'buy1', name: 'Smart Shopper', description: 'Buy an upgrade today', requirement: { type: 'dailyUpgrades', amount: 1 }, reward: 20 },
        { id: 'combo5', name: 'Nice Combo', description: 'Get a 5x tap combo', requirement: { type: 'dailyCombo', amount: 5 }, reward: 25 },
        // Medium challenges (reward 30-75)
        { id: 'tap150', name: 'Tap Champion', description: 'Tap 150 times today', requirement: { type: 'dailyTaps', amount: 150 }, reward: 50 },
        { id: 'earn100', name: 'Big Earner', description: 'Earn $100 today', requirement: { type: 'dailyEarned', amount: 100 }, reward: 45 },
        { id: 'lucky1', name: 'Feeling Lucky', description: 'Get a lucky bonus today', requirement: { type: 'dailyLucky', amount: 1 }, reward: 40 },
        { id: 'buy3', name: 'Upgrade Spree', description: 'Buy 3 upgrades today', requirement: { type: 'dailyUpgrades', amount: 3 }, reward: 60 },
        { id: 'combo15', name: 'Combo King', description: 'Get a 15x tap combo', requirement: { type: 'dailyCombo', amount: 15 }, reward: 50 },
        // Hard challenges (reward > 75)
        { id: 'tap300', name: 'Tap Master', description: 'Tap 300 times today', requirement: { type: 'dailyTaps', amount: 300 }, reward: 100 },
        { id: 'earn500', name: 'Money Machine', description: 'Earn $500 today', requirement: { type: 'dailyEarned', amount: 500 }, reward: 120 },
        { id: 'lucky3', name: 'Lucky Streak', description: 'Get 3 lucky bonuses today', requirement: { type: 'dailyLucky', amount: 3 }, reward: 100 },
        { id: 'combo30', name: 'Combo Legend', description: 'Get a 30x tap combo', requirement: { type: 'dailyCombo', amount: 30 }, reward: 90 },
        { id: 'buy5', name: 'Shopping Frenzy', description: 'Buy 5 upgrades today', requirement: { type: 'dailyUpgrades', amount: 5 }, reward: 100 }
    ];

    // Bonus reward for completing all 3 daily challenges
    const DAILY_BONUS_REWARD = 75;

    // ========================================
    // NEW: Prestige System - Lemonade Stars
    // ========================================

    const PRESTIGE_THRESHOLDS = [
        { stars: 1, totalEarnedRequired: 10000 },
        { stars: 2, totalEarnedRequired: 50000 },
        { stars: 3, totalEarnedRequired: 200000 },
        { stars: 5, totalEarnedRequired: 500000 },
        { stars: 8, totalEarnedRequired: 1000000 },
        { stars: 13, totalEarnedRequired: 5000000 },
        { stars: 21, totalEarnedRequired: 10000000 }
    ];

    // ========================================
    // NEW: Flavor Boosters
    // ========================================

    const FLAVOR_BOOSTERS = [
        { id: 'strawberry', name: 'Strawberry Lemonade', description: '2x tap value for 60s', effect: 'tapMultiplier', value: 2, duration: 60000, color: 0xEC4899, unlockEarned: 100 },
        { id: 'blueberry', name: 'Blueberry Blast', description: '2x auto income for 60s', effect: 'autoMultiplier', value: 2, duration: 60000, color: 0x8B5CF6, unlockEarned: 1000 },
        { id: 'mango', name: 'Mango Madness', description: '3x ALL income for 30s', effect: 'allMultiplier', value: 3, duration: 30000, color: 0xF97316, unlockEarned: 10000 }
    ];

    const BOOSTER_COOLDOWN = 300000; // 5 minutes between boosters

    // ========================================
    // Original calculation functions
    // ========================================

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

    // ========================================
    // NEW: Daily Challenge Functions
    // ========================================

    /**
     * Get today's date as a string (YYYY-MM-DD)
     * @returns {string}
     */
    function getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Simple deterministic hash from a string (for date-seeded challenge selection)
     * @param {string} str
     * @returns {number}
     */
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    /**
     * Get 3 daily challenges for a given date (deterministic selection)
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {Array} Array of 3 challenge objects
     */
    function getDailyChallenges(dateString) {
        const seed = hashString(dateString);

        // Split pool into difficulty tiers
        const easy = DAILY_CHALLENGE_POOL.filter(c => c.reward <= 25);
        const medium = DAILY_CHALLENGE_POOL.filter(c => c.reward > 25 && c.reward <= 60);
        const hard = DAILY_CHALLENGE_POOL.filter(c => c.reward > 60);

        return [
            easy[seed % easy.length],
            medium[(seed * 7 + 13) % medium.length],
            hard[(seed * 13 + 37) % hard.length]
        ];
    }

    /**
     * Check if a daily challenge is completed
     * @param {Object} challenge - Challenge definition
     * @param {Object} dailyStats - Today's stats
     * @returns {boolean}
     */
    function checkDailyChallenge(challenge, dailyStats) {
        if (!challenge || !dailyStats) return false;
        switch (challenge.requirement.type) {
            case 'dailyTaps': return (dailyStats.taps || 0) >= challenge.requirement.amount;
            case 'dailyEarned': return (dailyStats.earned || 0) >= challenge.requirement.amount;
            case 'dailyLucky': return (dailyStats.luckyBonuses || 0) >= challenge.requirement.amount;
            case 'dailyUpgrades': return (dailyStats.upgradesBought || 0) >= challenge.requirement.amount;
            case 'dailyCombo': return (dailyStats.maxCombo || 0) >= challenge.requirement.amount;
            default: return false;
        }
    }

    // ========================================
    // NEW: Streak System
    // ========================================

    /**
     * Calculate streak bonus reward (money given on login)
     * @param {number} streakDays - Current consecutive play days
     * @returns {number} Bonus money reward
     */
    function getStreakBonus(streakDays) {
        if (streakDays <= 0) return 0;
        const effectiveDays = Math.min(streakDays, 30);
        return Math.floor(10 * effectiveDays * (1 + effectiveDays * 0.1));
    }

    /**
     * Calculate streak multiplier (small permanent income boost)
     * @param {number} streakDays - Current consecutive play days
     * @returns {number} Multiplier (1.0 to 1.3)
     */
    function getStreakMultiplier(streakDays) {
        const effectiveDays = Math.min(streakDays, 30);
        return 1 + effectiveDays * 0.01;
    }

    /**
     * Update streak based on last play date
     * @param {string} lastPlayDate - Last play date (YYYY-MM-DD)
     * @param {number} currentStreak - Current streak count
     * @returns {Object} { streak, isNewDay, streakBonus }
     */
    function updateStreak(lastPlayDate, currentStreak) {
        const today = getTodayString();
        if (lastPlayDate === today) {
            return { streak: currentStreak, isNewDay: false, streakBonus: 0 };
        }

        // Check if last play was yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak;
        if (lastPlayDate === yesterdayStr) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = 1; // Reset streak
        }

        return {
            streak: newStreak,
            isNewDay: true,
            streakBonus: getStreakBonus(newStreak)
        };
    }

    // ========================================
    // NEW: Prestige System
    // ========================================

    /**
     * Calculate how many prestige stars would be earned
     * @param {number} totalEarned - Total money earned in current run
     * @returns {number} Stars earned
     */
    function calculatePrestigeStars(totalEarned) {
        let stars = 0;
        for (const threshold of PRESTIGE_THRESHOLDS) {
            if (totalEarned >= threshold.totalEarnedRequired) {
                stars = threshold.stars;
            }
        }
        return stars;
    }

    /**
     * Calculate prestige multiplier from accumulated stars
     * @param {number} stars - Total accumulated stars
     * @returns {number} Multiplier (each star = +10%)
     */
    function calculatePrestigeMultiplier(stars) {
        return 1 + stars * 0.1;
    }

    /**
     * Check if player can prestige (minimum threshold)
     * @param {number} totalEarned - Total money earned
     * @returns {boolean}
     */
    function canPrestige(totalEarned) {
        return totalEarned >= PRESTIGE_THRESHOLDS[0].totalEarnedRequired;
    }

    /**
     * Get the next prestige milestone info
     * @param {number} totalEarned - Total money earned
     * @returns {Object|null} Next threshold or null if at max
     */
    function getNextPrestigeMilestone(totalEarned) {
        for (const threshold of PRESTIGE_THRESHOLDS) {
            if (totalEarned < threshold.totalEarnedRequired) {
                return threshold;
            }
        }
        return null;
    }

    // ========================================
    // NEW: Flavor Booster Functions
    // ========================================

    /**
     * Get boosters available based on total earnings
     * @param {number} totalEarned - Total money earned
     * @returns {Array} Available booster objects
     */
    function getAvailableBoosters(totalEarned) {
        return FLAVOR_BOOSTERS.filter(b => totalEarned >= b.unlockEarned);
    }

    /**
     * Check if booster cooldown has expired
     * @param {number} cooldownEnd - Timestamp when cooldown ends
     * @returns {boolean}
     */
    function isBoosterReady(cooldownEnd) {
        return Date.now() >= (cooldownEnd || 0);
    }

    /**
     * Get remaining cooldown time in seconds
     * @param {number} cooldownEnd - Timestamp when cooldown ends
     * @returns {number} Seconds remaining (0 if ready)
     */
    function getBoosterCooldownRemaining(cooldownEnd) {
        const remaining = (cooldownEnd || 0) - Date.now();
        return Math.max(0, Math.ceil(remaining / 1000));
    }

    // ========================================
    // Save System
    // ========================================

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
            },
            // v2 fields
            dailyStats: { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 },
            dailyDate: '',
            dailyCompleted: [],
            streak: 0,
            lastPlayDate: '',
            prestigeStars: 0,
            boosterCooldown: 0,
            activeBooster: null
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

        // Migrate v1 to v2: add new fields with defaults
        if (saveData.version === 1) {
            saveData.version = 2;
            saveData.dailyStats = saveData.dailyStats || { taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 };
            saveData.dailyDate = saveData.dailyDate || '';
            saveData.dailyCompleted = saveData.dailyCompleted || [];
            saveData.streak = saveData.streak || 0;
            saveData.lastPlayDate = saveData.lastPlayDate || '';
            saveData.prestigeStars = saveData.prestigeStars || 0;
            saveData.boosterCooldown = saveData.boosterCooldown || 0;
            saveData.activeBooster = saveData.activeBooster || null;
        }

        // Version 2 is current
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
        DAILY_CHALLENGE_POOL,
        DAILY_BONUS_REWARD,
        PRESTIGE_THRESHOLDS,
        FLAVOR_BOOSTERS,
        BOOSTER_COOLDOWN,
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
        validateSave,
        // New exports
        getTodayString,
        getDailyChallenges,
        checkDailyChallenge,
        getStreakBonus,
        getStreakMultiplier,
        updateStreak,
        calculatePrestigeStars,
        calculatePrestigeMultiplier,
        canPrestige,
        getNextPrestigeMilestone,
        getAvailableBoosters,
        isBoosterReady,
        getBoosterCooldownRemaining
    };
})();

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Economy;
}
