/**
 * Tests for Marlow's Lemonade Stand Economy System
 * Tests upgrade cost scaling, income calculations, and game progression
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createContext, runInContext } from 'vm';

// Load the Economy module by evaluating it in a context
const __dirname = dirname(fileURLToPath(import.meta.url));
const economyCode = readFileSync(join(__dirname, '..', 'src', 'economy.js'), 'utf8');

// Create a context with module.exports support
const context = createContext({
    module: { exports: {} },
    console: console
});

// Run the economy code in the context
runInContext(economyCode, context);

// Get the Economy module from the context
const Economy = context.module.exports;

describe('Economy System', () => {
    describe('Upgrade Cost Calculations', () => {
        it('should calculate base cost for level 0 upgrades', () => {
            const cost = Economy.calculateUpgradeCost('betterLemons', 0);
            expect(cost).toBe(Economy.UPGRADES.betterLemons.baseCost);
        });

        it('should scale upgrade costs exponentially', () => {
            const upgrade = Economy.UPGRADES.betterLemons;
            const cost0 = Economy.calculateUpgradeCost('betterLemons', 0);
            const cost1 = Economy.calculateUpgradeCost('betterLemons', 1);
            const cost2 = Economy.calculateUpgradeCost('betterLemons', 2);

            // Cost should increase by multiplier each level
            expect(cost1).toBeCloseTo(cost0 * upgrade.costMultiplier, 2);
            expect(cost2).toBeCloseTo(cost1 * upgrade.costMultiplier, 2);
        });

        it('should return Infinity for maxed upgrades', () => {
            const maxLevel = Economy.UPGRADES.betterLemons.maxLevel;
            const cost = Economy.calculateUpgradeCost('betterLemons', maxLevel);
            expect(cost).toBe(Infinity);
        });

        it('should return Infinity for invalid upgrade IDs', () => {
            const cost = Economy.calculateUpgradeCost('nonexistent', 0);
            expect(cost).toBe(Infinity);
        });

        it('should have different cost curves for different upgrades', () => {
            const lemonsCost = Economy.calculateUpgradeCost('betterLemons', 5);
            const helperCost = Economy.calculateUpgradeCost('helper', 5);

            // Different base costs and multipliers should give different results
            expect(lemonsCost).not.toBe(helperCost);
        });

        it('should calculate high level upgrade costs correctly', () => {
            const upgrade = Economy.UPGRADES.goldenLemon;
            const level = 5;
            const expectedCost = Math.floor(
                upgrade.baseCost * Math.pow(upgrade.costMultiplier, level) * 100
            ) / 100;

            const actualCost = Economy.calculateUpgradeCost('goldenLemon', level);
            expect(actualCost).toBe(expectedCost);
        });
    });

    describe('Click Value Calculations', () => {
        it('should return base click value with no upgrades', () => {
            const clickValue = Economy.calculateClickValue({});
            expect(clickValue).toBe(Economy.BASE_CLICK_VALUE);
        });

        it('should increase click value with betterLemons upgrade', () => {
            const baseValue = Economy.calculateClickValue({});
            const upgradedValue = Economy.calculateClickValue({ betterLemons: 1 });

            expect(upgradedValue).toBeGreaterThan(baseValue);
            expect(upgradedValue).toBe(
                Math.round((baseValue + Economy.UPGRADES.betterLemons.effectValue) * 100) / 100
            );
        });

        it('should stack multiple click value upgrades', () => {
            const upgrades = {
                betterLemons: 3,
                fasterSqueezing: 2,
                mommyRecipe: 1
            };

            const clickValue = Economy.calculateClickValue(upgrades);

            let expected = Economy.BASE_CLICK_VALUE;
            expected += Economy.UPGRADES.betterLemons.effectValue * 3;
            expected += Economy.UPGRADES.fasterSqueezing.effectValue * 2;
            expected += Economy.UPGRADES.mommyRecipe.effectValue * 1;
            expected = Math.round(expected * 100) / 100;

            expect(clickValue).toBe(expected);
        });

        it('should apply global multiplier to click value', () => {
            const baseUpgrades = { betterLemons: 5 };
            const withGlobal = { betterLemons: 5, goldenLemon: 2 };

            const baseValue = Economy.calculateClickValue(baseUpgrades);
            const globalValue = Economy.calculateClickValue(withGlobal);

            const expectedMultiplier = 1 + Economy.UPGRADES.goldenLemon.effectValue * 2;
            expect(globalValue).toBeCloseTo(baseValue * expectedMultiplier, 2);
        });
    });

    describe('Auto Income Calculations', () => {
        it('should return 0 with no auto-income upgrades', () => {
            const income = Economy.calculateAutoIncome({});
            expect(income).toBe(0);
        });

        it('should calculate income from helper upgrade', () => {
            const income = Economy.calculateAutoIncome({ helper: 1 });
            expect(income).toBe(Economy.UPGRADES.helper.effectValue);
        });

        it('should stack multiple auto-income sources', () => {
            const upgrades = {
                helper: 3,
                lemonadeRobot: 2,
                basketballCooler: 1
            };

            const income = Economy.calculateAutoIncome(upgrades);

            let expected = 0;
            expected += Economy.UPGRADES.helper.effectValue * 3;
            expected += Economy.UPGRADES.lemonadeRobot.effectValue * 2;
            expected += Economy.UPGRADES.basketballCooler.effectValue * 1;
            expected = Math.round(expected * 100) / 100;

            expect(income).toBe(expected);
        });

        it('should apply global multiplier to auto income', () => {
            const baseUpgrades = { helper: 5 };
            const withGlobal = { helper: 5, goldenLemon: 1 };

            const baseIncome = Economy.calculateAutoIncome(baseUpgrades);
            const globalIncome = Economy.calculateAutoIncome(withGlobal);

            const expectedMultiplier = 1 + Economy.UPGRADES.goldenLemon.effectValue;
            expect(globalIncome).toBeCloseTo(baseIncome * expectedMultiplier, 2);
        });

        it('should handle Mission Estancia high-value upgrade', () => {
            const income = Economy.calculateAutoIncome({ missionEstanciaSpot: 3 });
            const expectedIncome = Economy.UPGRADES.missionEstanciaSpot.effectValue * 3;
            expect(income).toBe(expectedIncome);
        });
    });

    describe('Price Multiplier Calculations', () => {
        it('should return 1x with no price upgrades', () => {
            const multiplier = Economy.calculatePriceMultiplier({});
            expect(multiplier).toBe(1);
        });

        it('should increase with biggerCups upgrade', () => {
            const multiplier = Economy.calculatePriceMultiplier({ biggerCups: 3 });
            const expected = 1 + Economy.UPGRADES.biggerCups.effectValue * 3;
            expect(multiplier).toBeCloseTo(expected, 2);
        });

        it('should stack price multiplier upgrades', () => {
            const upgrades = {
                biggerCups: 2,
                violetMarketing: 3
            };

            const multiplier = Economy.calculatePriceMultiplier(upgrades);

            let expected = 1;
            expected += Economy.UPGRADES.biggerCups.effectValue * 2;
            expected += Economy.UPGRADES.violetMarketing.effectValue * 3;
            expected = Math.round(expected * 100) / 100;

            expect(multiplier).toBe(expected);
        });
    });

    describe('Stand Level Progression', () => {
        it('should start at level 1 with no earnings', () => {
            const level = Economy.getStandLevel(0);
            expect(level.level).toBe(1);
            expect(level.name).toBe('Cardboard Box Stand');
        });

        it('should progress to level 2 at $50', () => {
            const level = Economy.getStandLevel(50);
            expect(level.level).toBe(2);
            expect(level.name).toBe('Wooden Crate Stand');
        });

        it('should reach max level at $500,000', () => {
            const level = Economy.getStandLevel(500000);
            expect(level.level).toBe(10);
            expect(level.name).toBe("Marlow's Lemonade Palace");
        });

        it('should stay at max level beyond threshold', () => {
            const level = Economy.getStandLevel(1000000);
            expect(level.level).toBe(10);
        });

        it('should calculate progress to next level', () => {
            const progress = Economy.getStandProgress(100);
            expect(progress.current.level).toBe(2);
            expect(progress.next.level).toBe(3);
            expect(progress.progress).toBeGreaterThan(0);
            expect(progress.progress).toBeLessThan(1);
        });

        it('should show 100% progress at max level', () => {
            const progress = Economy.getStandProgress(500000);
            expect(progress.next).toBeNull();
            expect(progress.progress).toBe(1);
        });
    });

    describe('Lucky Chance Calculations', () => {
        it('should have base 1% lucky chance', () => {
            const chance = Economy.calculateLuckyChance({});
            expect(chance).toBe(0.01);
        });

        it('should increase with labubuCharm upgrade', () => {
            const baseChance = Economy.calculateLuckyChance({});
            const upgradedChance = Economy.calculateLuckyChance({ labubuCharm: 3 });

            expect(upgradedChance).toBeGreaterThan(baseChance);
            expect(upgradedChance).toBe(baseChance + Economy.UPGRADES.labubuCharm.effectValue * 3);
        });

        it('should cap at 50% maximum', () => {
            // Max labubu is 10, giving 0.01 + 0.05*10 = 0.51
            const chance = Economy.calculateLuckyChance({ labubuCharm: 10 });
            expect(chance).toBe(0.5);
        });
    });

    describe('Customer Rate Calculations', () => {
        it('should return 1x with no upgrades', () => {
            const rate = Economy.calculateCustomerRate({});
            expect(rate).toBe(1);
        });

        it('should increase with prettySign upgrade', () => {
            const rate = Economy.calculateCustomerRate({ prettySign: 5 });
            const expected = 1 + Economy.UPGRADES.prettySign.effectValue * 5;
            expect(rate).toBe(expected);
        });

        it('should stack customer rate upgrades', () => {
            const upgrades = {
                prettySign: 3,
                poppyHelper: 2,
                volleyballSign: 1
            };

            const rate = Economy.calculateCustomerRate(upgrades);

            let expected = 1;
            expected += Economy.UPGRADES.prettySign.effectValue * 3;
            expected += Economy.UPGRADES.poppyHelper.effectValue * 2;
            expected += Economy.UPGRADES.volleyballSign.effectValue * 1;

            expect(rate).toBe(expected);
        });
    });

    describe('Quest System', () => {
        it('should detect completed quests', () => {
            const stats = { totalSales: 10, totalEarned: 0, luckyBonuses: 0 };
            const upgrades = {};
            const completed = [];

            const newlyCompleted = Economy.checkQuests(stats, upgrades, completed);

            expect(newlyCompleted.length).toBeGreaterThan(0);
            expect(newlyCompleted.some(q => q.id === 'firstSale')).toBe(true);
            expect(newlyCompleted.some(q => q.id === 'tenSales')).toBe(true);
        });

        it('should not re-complete already completed quests', () => {
            const stats = { totalSales: 100, totalEarned: 0, luckyBonuses: 0 };
            const upgrades = {};
            const completed = ['firstSale', 'tenSales'];

            const newlyCompleted = Economy.checkQuests(stats, upgrades, completed);

            expect(newlyCompleted.some(q => q.id === 'firstSale')).toBe(false);
            expect(newlyCompleted.some(q => q.id === 'tenSales')).toBe(false);
        });

        it('should detect family business quest', () => {
            const stats = { totalSales: 0, totalEarned: 0, luckyBonuses: 0 };
            const upgrades = {
                violetMarketing: 1,
                poppyHelper: 1,
                winnieGuard: 1
            };
            const completed = [];

            const newlyCompleted = Economy.checkQuests(stats, upgrades, completed);

            expect(newlyCompleted.some(q => q.id === 'familyBusiness')).toBe(true);
        });
    });

    describe('Save System', () => {
        it('should create valid new save', () => {
            const save = Economy.createNewSave();

            expect(save.version).toBe(Economy.SAVE_VERSION);
            expect(save.money).toBe(0);
            expect(save.totalEarned).toBe(0);
            expect(save.totalSales).toBe(0);
            expect(save.upgradeLevels).toEqual({});
            expect(save.completedQuests).toEqual([]);
            expect(save.collections).toEqual({});
        });

        it('should validate correct save data', () => {
            const save = Economy.createNewSave();
            expect(Economy.validateSave(save)).toBe(true);
        });

        it('should reject invalid save data', () => {
            expect(Economy.validateSave(null)).toBe(false);
            expect(Economy.validateSave({})).toBe(false);
            expect(Economy.validateSave({ money: -1 })).toBe(false);
            expect(Economy.validateSave({ money: 'abc' })).toBe(false);
        });

        it('should migrate old saves', () => {
            const oldSave = { money: 100 }; // No version
            const migrated = Economy.migrateSave(oldSave);

            // Should create fresh save for very old data
            expect(migrated.version).toBe(Economy.SAVE_VERSION);
        });

        it('should preserve current version saves', () => {
            const save = Economy.createNewSave();
            save.money = 500;
            save.totalEarned = 1000;

            const migrated = Economy.migrateSave(save);

            expect(migrated.money).toBe(500);
            expect(migrated.totalEarned).toBe(1000);
        });
    });

    describe('Global Multiplier', () => {
        it('should return 1x with no upgrades', () => {
            const mult = Economy.calculateGlobalMultiplier({});
            expect(mult).toBe(1);
        });

        it('should increase with goldenLemon upgrade', () => {
            const mult = Economy.calculateGlobalMultiplier({ goldenLemon: 4 });
            const expected = 1 + Economy.UPGRADES.goldenLemon.effectValue * 4;
            expect(mult).toBe(expected);
        });
    });

    describe('Easter Egg Upgrades', () => {
        it('should have all family-themed easter eggs', () => {
            const easterEggs = Object.values(Economy.UPGRADES).filter(u => u.isEasterEgg);

            // Check for family members
            const hasViolet = easterEggs.some(u => u.id === 'violetMarketing');
            const hasPoppy = easterEggs.some(u => u.id === 'poppyHelper');
            const hasWinnie = easterEggs.some(u => u.id === 'winnieGuard');
            const hasMommy = easterEggs.some(u => u.id === 'mommyRecipe');
            const hasLabubu = easterEggs.some(u => u.id === 'labubuCharm');
            const has3DPrinter = easterEggs.some(u => u.id === 'lemonadeRobot');
            const hasVolleyball = easterEggs.some(u => u.id === 'volleyballSign');
            const hasBasketball = easterEggs.some(u => u.id === 'basketballCooler');
            const hasMissionEstancia = easterEggs.some(u => u.id === 'missionEstanciaSpot');

            expect(hasViolet).toBe(true);
            expect(hasPoppy).toBe(true);
            expect(hasWinnie).toBe(true);
            expect(hasMommy).toBe(true);
            expect(hasLabubu).toBe(true);
            expect(has3DPrinter).toBe(true);
            expect(hasVolleyball).toBe(true);
            expect(hasBasketball).toBe(true);
            expect(hasMissionEstancia).toBe(true);
        });
    });

    describe('Comprehensive Income Scenario', () => {
        it('should calculate total income correctly for a mid-game state', () => {
            const upgrades = {
                betterLemons: 10,
                fasterSqueezing: 5,
                biggerCups: 3,
                helper: 5,
                lemonadeRobot: 2,
                goldenLemon: 2,
                poppyHelper: 3,
                violetMarketing: 2
            };

            const clickValue = Economy.calculateClickValue(upgrades);
            const autoIncome = Economy.calculateAutoIncome(upgrades);
            const priceMultiplier = Economy.calculatePriceMultiplier(upgrades);
            const globalMultiplier = Economy.calculateGlobalMultiplier(upgrades);

            // All values should be positive and greater than base
            expect(clickValue).toBeGreaterThan(Economy.BASE_CLICK_VALUE);
            expect(autoIncome).toBeGreaterThan(0);
            expect(priceMultiplier).toBeGreaterThan(1);
            expect(globalMultiplier).toBeGreaterThan(1);

            // Calculate expected effective click value (click * price)
            const effectiveClick = clickValue * priceMultiplier;
            expect(effectiveClick).toBeGreaterThan(clickValue);
        });
    });

    describe('Daily Challenge System', () => {
        it('should return 3 challenges for a given date', () => {
            const challenges = Economy.getDailyChallenges('2026-01-31');
            expect(challenges).toHaveLength(3);
            challenges.forEach(c => {
                expect(c).toHaveProperty('id');
                expect(c).toHaveProperty('name');
                expect(c).toHaveProperty('reward');
                expect(c).toHaveProperty('requirement');
            });
        });

        it('should return the same challenges for the same date', () => {
            const a = Economy.getDailyChallenges('2026-01-15');
            const b = Economy.getDailyChallenges('2026-01-15');
            expect(a.map(c => c.id)).toEqual(b.map(c => c.id));
        });

        it('should return different challenges for different dates', () => {
            const a = Economy.getDailyChallenges('2026-01-15');
            const b = Economy.getDailyChallenges('2026-02-20');
            // At least one challenge should differ (extremely unlikely all 3 match)
            const aIds = a.map(c => c.id).join(',');
            const bIds = b.map(c => c.id).join(',');
            expect(aIds).not.toBe(bIds);
        });

        it('should include one easy, one medium, and one hard challenge', () => {
            const challenges = Economy.getDailyChallenges('2026-06-10');
            expect(challenges[0].reward).toBeLessThanOrEqual(25);
            expect(challenges[1].reward).toBeGreaterThan(25);
            expect(challenges[1].reward).toBeLessThanOrEqual(60);
            expect(challenges[2].reward).toBeGreaterThan(60);
        });

        it('should detect completed daily challenges by taps', () => {
            const challenge = { requirement: { type: 'dailyTaps', amount: 50 } };
            expect(Economy.checkDailyChallenge(challenge, { taps: 49 })).toBe(false);
            expect(Economy.checkDailyChallenge(challenge, { taps: 50 })).toBe(true);
            expect(Economy.checkDailyChallenge(challenge, { taps: 100 })).toBe(true);
        });

        it('should detect completed daily challenges by earned', () => {
            const challenge = { requirement: { type: 'dailyEarned', amount: 25 } };
            expect(Economy.checkDailyChallenge(challenge, { earned: 10 })).toBe(false);
            expect(Economy.checkDailyChallenge(challenge, { earned: 25 })).toBe(true);
        });

        it('should detect completed daily challenges by lucky bonuses', () => {
            const challenge = { requirement: { type: 'dailyLucky', amount: 1 } };
            expect(Economy.checkDailyChallenge(challenge, { luckyBonuses: 0 })).toBe(false);
            expect(Economy.checkDailyChallenge(challenge, { luckyBonuses: 1 })).toBe(true);
        });

        it('should detect completed daily challenges by upgrades bought', () => {
            const challenge = { requirement: { type: 'dailyUpgrades', amount: 3 } };
            expect(Economy.checkDailyChallenge(challenge, { upgradesBought: 2 })).toBe(false);
            expect(Economy.checkDailyChallenge(challenge, { upgradesBought: 3 })).toBe(true);
        });

        it('should detect completed daily challenges by max combo', () => {
            const challenge = { requirement: { type: 'dailyCombo', amount: 15 } };
            expect(Economy.checkDailyChallenge(challenge, { maxCombo: 10 })).toBe(false);
            expect(Economy.checkDailyChallenge(challenge, { maxCombo: 15 })).toBe(true);
        });

        it('should handle null/undefined inputs gracefully', () => {
            expect(Economy.checkDailyChallenge(null, {})).toBe(false);
            expect(Economy.checkDailyChallenge({}, null)).toBe(false);
        });

        it('should handle missing stats fields as 0', () => {
            const challenge = { requirement: { type: 'dailyTaps', amount: 1 } };
            expect(Economy.checkDailyChallenge(challenge, {})).toBe(false);
        });

        it('should have valid DAILY_BONUS_REWARD constant', () => {
            expect(Economy.DAILY_BONUS_REWARD).toBe(75);
        });
    });

    describe('Streak System', () => {
        it('should return 0 bonus for 0 streak days', () => {
            expect(Economy.getStreakBonus(0)).toBe(0);
        });

        it('should return 0 bonus for negative streak days', () => {
            expect(Economy.getStreakBonus(-1)).toBe(0);
        });

        it('should increase bonus with more streak days', () => {
            const bonus1 = Economy.getStreakBonus(1);
            const bonus5 = Economy.getStreakBonus(5);
            const bonus10 = Economy.getStreakBonus(10);

            expect(bonus1).toBeGreaterThan(0);
            expect(bonus5).toBeGreaterThan(bonus1);
            expect(bonus10).toBeGreaterThan(bonus5);
        });

        it('should cap effective streak days at 30', () => {
            const bonus30 = Economy.getStreakBonus(30);
            const bonus50 = Economy.getStreakBonus(50);
            expect(bonus30).toBe(bonus50);
        });

        it('should calculate streak bonus correctly for day 1', () => {
            // 10 * 1 * (1 + 1 * 0.1) = 10 * 1.1 = 11
            expect(Economy.getStreakBonus(1)).toBe(Math.floor(10 * 1 * (1 + 1 * 0.1)));
        });

        it('should return 1.0 multiplier for 0 streak days', () => {
            expect(Economy.getStreakMultiplier(0)).toBe(1.0);
        });

        it('should increase multiplier by 0.01 per day', () => {
            expect(Economy.getStreakMultiplier(1)).toBeCloseTo(1.01, 5);
            expect(Economy.getStreakMultiplier(10)).toBeCloseTo(1.10, 5);
            expect(Economy.getStreakMultiplier(20)).toBeCloseTo(1.20, 5);
        });

        it('should cap multiplier at 30 days (1.30)', () => {
            expect(Economy.getStreakMultiplier(30)).toBeCloseTo(1.30, 5);
            expect(Economy.getStreakMultiplier(50)).toBeCloseTo(1.30, 5);
        });

        it('should not increment streak when playing same day', () => {
            const today = Economy.getTodayString();
            const result = Economy.updateStreak(today, 5);
            expect(result.streak).toBe(5);
            expect(result.isNewDay).toBe(false);
            expect(result.streakBonus).toBe(0);
        });

        it('should increment streak when playing on consecutive day', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const result = Economy.updateStreak(yesterdayStr, 3);
            expect(result.streak).toBe(4);
            expect(result.isNewDay).toBe(true);
            expect(result.streakBonus).toBe(Economy.getStreakBonus(4));
        });

        it('should reset streak when missing a day', () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

            const result = Economy.updateStreak(twoDaysAgoStr, 10);
            expect(result.streak).toBe(1);
            expect(result.isNewDay).toBe(true);
            expect(result.streakBonus).toBe(Economy.getStreakBonus(1));
        });

        it('should start streak at 1 for first-time player', () => {
            const result = Economy.updateStreak('', 0);
            expect(result.streak).toBe(1);
            expect(result.isNewDay).toBe(true);
        });
    });

    describe('Prestige System', () => {
        it('should return 0 stars below minimum threshold', () => {
            expect(Economy.calculatePrestigeStars(0)).toBe(0);
            expect(Economy.calculatePrestigeStars(9999)).toBe(0);
        });

        it('should return 1 star at $10,000', () => {
            expect(Economy.calculatePrestigeStars(10000)).toBe(1);
        });

        it('should return correct stars for each threshold', () => {
            expect(Economy.calculatePrestigeStars(50000)).toBe(2);
            expect(Economy.calculatePrestigeStars(200000)).toBe(3);
            expect(Economy.calculatePrestigeStars(500000)).toBe(5);
            expect(Economy.calculatePrestigeStars(1000000)).toBe(8);
            expect(Economy.calculatePrestigeStars(5000000)).toBe(13);
            expect(Economy.calculatePrestigeStars(10000000)).toBe(21);
        });

        it('should return max stars beyond max threshold', () => {
            expect(Economy.calculatePrestigeStars(99999999)).toBe(21);
        });

        it('should calculate prestige multiplier correctly', () => {
            expect(Economy.calculatePrestigeMultiplier(0)).toBe(1.0);
            expect(Economy.calculatePrestigeMultiplier(1)).toBeCloseTo(1.1, 5);
            expect(Economy.calculatePrestigeMultiplier(5)).toBeCloseTo(1.5, 5);
            expect(Economy.calculatePrestigeMultiplier(10)).toBeCloseTo(2.0, 5);
            expect(Economy.calculatePrestigeMultiplier(21)).toBeCloseTo(3.1, 5);
        });

        it('should not allow prestige below minimum threshold', () => {
            expect(Economy.canPrestige(0)).toBe(false);
            expect(Economy.canPrestige(9999)).toBe(false);
        });

        it('should allow prestige at minimum threshold', () => {
            expect(Economy.canPrestige(10000)).toBe(true);
        });

        it('should allow prestige above minimum threshold', () => {
            expect(Economy.canPrestige(500000)).toBe(true);
        });

        it('should return next milestone below first threshold', () => {
            const next = Economy.getNextPrestigeMilestone(0);
            expect(next).not.toBeNull();
            expect(next.totalEarnedRequired).toBe(10000);
            expect(next.stars).toBe(1);
        });

        it('should return correct next milestone mid-progression', () => {
            const next = Economy.getNextPrestigeMilestone(10000);
            expect(next).not.toBeNull();
            expect(next.totalEarnedRequired).toBe(50000);
        });

        it('should return null at max prestige', () => {
            const next = Economy.getNextPrestigeMilestone(10000000);
            expect(next).toBeNull();
        });

        it('should have PRESTIGE_THRESHOLDS in ascending order', () => {
            for (let i = 1; i < Economy.PRESTIGE_THRESHOLDS.length; i++) {
                expect(Economy.PRESTIGE_THRESHOLDS[i].totalEarnedRequired)
                    .toBeGreaterThan(Economy.PRESTIGE_THRESHOLDS[i - 1].totalEarnedRequired);
                expect(Economy.PRESTIGE_THRESHOLDS[i].stars)
                    .toBeGreaterThan(Economy.PRESTIGE_THRESHOLDS[i - 1].stars);
            }
        });
    });

    describe('Flavor Booster System', () => {
        it('should return no boosters with 0 earnings', () => {
            const available = Economy.getAvailableBoosters(0);
            expect(available).toHaveLength(0);
        });

        it('should unlock strawberry booster at $100', () => {
            const available = Economy.getAvailableBoosters(100);
            expect(available).toHaveLength(1);
            expect(available[0].id).toBe('strawberry');
        });

        it('should unlock blueberry booster at $1,000', () => {
            const available = Economy.getAvailableBoosters(1000);
            expect(available).toHaveLength(2);
            expect(available.some(b => b.id === 'blueberry')).toBe(true);
        });

        it('should unlock all boosters at $10,000', () => {
            const available = Economy.getAvailableBoosters(10000);
            expect(available).toHaveLength(3);
            expect(available.some(b => b.id === 'mango')).toBe(true);
        });

        it('should report booster as ready when cooldown is 0', () => {
            expect(Economy.isBoosterReady(0)).toBe(true);
        });

        it('should report booster as ready when cooldown is in the past', () => {
            expect(Economy.isBoosterReady(Date.now() - 1000)).toBe(true);
        });

        it('should report booster as not ready during cooldown', () => {
            expect(Economy.isBoosterReady(Date.now() + 60000)).toBe(false);
        });

        it('should return 0 remaining when cooldown expired', () => {
            expect(Economy.getBoosterCooldownRemaining(0)).toBe(0);
            expect(Economy.getBoosterCooldownRemaining(Date.now() - 5000)).toBe(0);
        });

        it('should return correct remaining seconds during cooldown', () => {
            const futureTime = Date.now() + 60000; // 60 seconds from now
            const remaining = Economy.getBoosterCooldownRemaining(futureTime);
            expect(remaining).toBeGreaterThan(55);
            expect(remaining).toBeLessThanOrEqual(60);
        });

        it('should have valid BOOSTER_COOLDOWN constant', () => {
            expect(Economy.BOOSTER_COOLDOWN).toBe(300000);
        });

        it('should have all boosters with required properties', () => {
            Economy.FLAVOR_BOOSTERS.forEach(booster => {
                expect(booster).toHaveProperty('id');
                expect(booster).toHaveProperty('name');
                expect(booster).toHaveProperty('effect');
                expect(booster).toHaveProperty('value');
                expect(booster).toHaveProperty('duration');
                expect(booster).toHaveProperty('color');
                expect(booster).toHaveProperty('unlockEarned');
                expect(booster.value).toBeGreaterThan(0);
                expect(booster.duration).toBeGreaterThan(0);
            });
        });
    });

    describe('Save System v2', () => {
        it('should create save with version 2', () => {
            const save = Economy.createNewSave();
            expect(save.version).toBe(2);
        });

        it('should include v2 fields in new save', () => {
            const save = Economy.createNewSave();
            expect(save.dailyStats).toEqual({ taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 });
            expect(save.dailyDate).toBe('');
            expect(save.dailyCompleted).toEqual([]);
            expect(save.streak).toBe(0);
            expect(save.lastPlayDate).toBe('');
            expect(save.prestigeStars).toBe(0);
            expect(save.boosterCooldown).toBe(0);
            expect(save.activeBooster).toBeNull();
        });

        it('should migrate v1 save to v2', () => {
            const v1Save = {
                version: 1,
                money: 500,
                totalEarned: 1000,
                totalSales: 200,
                upgradeLevels: { betterLemons: 3 },
                completedQuests: ['firstSale'],
                collections: {},
                luckyBonuses: 2,
                playTime: 3600,
                lastSaved: Date.now(),
                settings: { soundEnabled: true, particlesEnabled: true }
            };

            const migrated = Economy.migrateSave(v1Save);

            // Should preserve v1 data
            expect(migrated.version).toBe(2);
            expect(migrated.money).toBe(500);
            expect(migrated.totalEarned).toBe(1000);
            expect(migrated.upgradeLevels).toEqual({ betterLemons: 3 });
            expect(migrated.completedQuests).toEqual(['firstSale']);

            // Should add v2 defaults
            expect(migrated.dailyStats).toEqual({ taps: 0, earned: 0, luckyBonuses: 0, upgradesBought: 0, maxCombo: 0 });
            expect(migrated.dailyDate).toBe('');
            expect(migrated.dailyCompleted).toEqual([]);
            expect(migrated.streak).toBe(0);
            expect(migrated.lastPlayDate).toBe('');
            expect(migrated.prestigeStars).toBe(0);
            expect(migrated.boosterCooldown).toBe(0);
            expect(migrated.activeBooster).toBeNull();
        });

        it('should not modify already v2 saves', () => {
            const v2Save = Economy.createNewSave();
            v2Save.money = 1000;
            v2Save.streak = 5;
            v2Save.prestigeStars = 3;

            const migrated = Economy.migrateSave(v2Save);
            expect(migrated.money).toBe(1000);
            expect(migrated.streak).toBe(5);
            expect(migrated.prestigeStars).toBe(3);
        });
    });
});
