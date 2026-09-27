import SaveSystem from './SaveSystem.js';

// XP required to reach each level (cumulative)
const XP_PER_LEVEL = 200; // every 200 XP = 1 level

const ACHIEVEMENTS = [
    { id: 'first_spell',     label: 'First Spell',      desc: 'Cast your very first word',          icon: '✦',  check: (p) => p.wordsmastered.length >= 1 },
    { id: 'ten_words',       label: 'Apprentice',        desc: 'Master 10 words',                    icon: '📖', check: (p) => p.wordsmastered.length >= 10 },
    { id: 'fifty_words',     label: 'Wordsmith',         desc: 'Master 50 words',                    icon: '📚', check: (p) => p.wordsmastered.length >= 50 },
    { id: 'hundred_words',   label: 'Lexicon Master',    desc: 'Master 100 words',                   icon: '🔮', check: (p) => p.wordsmastered.length >= 100 },
    { id: 'first_battle',    label: 'Spell Warrior',     desc: 'Win your first battle',              icon: '⚔️', check: (p) => p.battlesWon >= 1 },
    { id: 'ten_battles',     label: 'Battle Hardened',   desc: 'Win 10 battles',                     icon: '🛡️', check: (p) => p.battlesWon >= 10 },
    { id: 'zone2_unlock',    label: 'Into the Woods',    desc: 'Unlock Whispering Woods',            icon: '🌲', check: (p) => p.zonesUnlocked.includes(1) },
    { id: 'zone3_unlock',    label: 'Deep Delver',       desc: 'Unlock Crystal Caves',               icon: '💎', check: (p) => p.zonesUnlocked.includes(2) },
    { id: 'zone4_unlock',    label: 'Storm Seeker',      desc: 'Unlock Stormspire Tower',            icon: '⚡', check: (p) => p.zonesUnlocked.includes(3) },
    { id: 'zone5_unlock',    label: 'Frozen Path',       desc: 'Unlock the Frozen North',            icon: '❄️', check: (p) => p.zonesUnlocked.includes(4) },
    { id: 'dragon_slayer',   label: 'Dragon Slayer',     desc: "Complete Dragon's Lair",             icon: '🐉', check: (p) => p.zonesUnlocked.includes(6) },
    { id: 'level5',          label: 'Rising Mage',       desc: 'Reach Level 5',                      icon: '⭐', check: (p) => p.level >= 5 },
    { id: 'level10',         label: 'Archmage',          desc: 'Reach Level 10',                     icon: '🌟', check: (p) => p.level >= 10 },
    { id: 'speed_run',       label: 'Lightning Caster',  desc: 'Earn max speed bonus in a battle',   icon: '⚡', check: () => false }, // set by BattleScene
    { id: 'perfect_battle',  label: 'Flawless Casting',  desc: 'Win a battle with no mistakes',      icon: '✨', check: () => false }, // set by BattleScene
];

const ProgressSystem = {
    // Call after any meaningful game event to check/grant achievements
    checkAchievements(extraFlags = {}) {
        const progress = SaveSystem.getProgress();
        const newlyEarned = [];
        for (const ach of ACHIEVEMENTS) {
            if (!SaveSystem.hasAchievement(ach.id)) {
                const earned = extraFlags[ach.id] || ach.check({ ...progress });
                if (earned) {
                    SaveSystem.grantAchievement(ach.id);
                    newlyEarned.push(ach);
                }
            }
        }
        return newlyEarned;
    },

    // Compute XP for a battle round
    calcBattleXP(wordsCorrect, wordsTotal, elapsedMs, hintsUsed) {
        const base = wordsCorrect * 10;
        // Speed bonus: par time = 6s per word; scale up to 1.5× if faster
        const parMs = wordsTotal * 6000;
        const speedRatio = Math.min(parMs / Math.max(elapsedMs, 1000), 1.5);
        const speedMult = 1 + (speedRatio - 1) * 0.5; // range: 1.0 – 1.25
        const hintMult = hintsUsed === 0 ? 1.25 : 1.0;
        return Math.round(base * speedMult * hintMult);
    },

    levelForXP(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; },

    xpToNextLevel(xp) {
        const current = xp % XP_PER_LEVEL;
        return { current, needed: XP_PER_LEVEL, pct: current / XP_PER_LEVEL };
    },

    allAchievements() { return ACHIEVEMENTS; },

    getAchievement(id) { return ACHIEVEMENTS.find(a => a.id === id); },
};

export default ProgressSystem;
