// SaveSystem.js — localStorage persistence with schema versioning + AWS Amplify hooks

const SAVE_KEY = 'spellbinder_save_v2';
const SCHEMA_VERSION = 2;

const DEFAULTS = {
    version: SCHEMA_VERSION,
    profile: null,          // { name, avatarId, grade, createdAt }
    progress: {
        xp: 0,
        level: 1,
        wordsmastered: [],
        zonesUnlocked: [0],
        levelsComplete: {},
        battlesWon: 0,
        totalPlayTime: 0,
        lastPlayed: null,
        streak: 0,
        lastPlayedDate: null,
        dailyMinutes: 0,
        dailyDate: null,
        tokens: 0,
        dailyTokensEarned: 0,
        wordStats: {},          // { [word]: { plays: N, successes: N } }
    },
    achievements: [],       // array of achievement ids
    settings: {
        sfxVolume: 0.7,
        musicVolume: 0.4,
        dashboardPin: null,
    },
    customWords: [],        // { word, definition, sentence } added by teacher
};

const SaveSystem = {
    _data: null,

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) { this._data = structuredClone(DEFAULTS); return null; }
            const parsed = JSON.parse(raw);
            if (!parsed.version || parsed.version < SCHEMA_VERSION) {
                this._data = structuredClone(DEFAULTS);
                if (parsed.profile)      this._data.profile      = parsed.profile;
                if (parsed.progress)     this._data.progress     = { ...structuredClone(DEFAULTS.progress), ...parsed.progress };
                if (parsed.achievements) this._data.achievements = parsed.achievements;
                if (parsed.settings)     this._data.settings     = { ...structuredClone(DEFAULTS.settings), ...parsed.settings };
                if (parsed.customWords)  this._data.customWords  = parsed.customWords;
                this._data.version = SCHEMA_VERSION;
            } else {
                this._data = parsed;
                // Ensure any new progress fields are present in existing saves
                this._data.progress = { ...structuredClone(DEFAULTS.progress), ...this._data.progress };
            }
            return this._data.profile;
        } catch {
            this._data = structuredClone(DEFAULTS);
            return null;
        }
    },

    save() {
        if (!this._data) return;

        // 1. Always save to LocalStorage (Immediate persistence for the player)
        try { 
            localStorage.setItem(SAVE_KEY, JSON.stringify(this._data)); 
        } catch (e) {
            console.warn("Spellbinder: Local save failed", e);
        }

        // 2. AWS Amplify Cloud Push 
        if (window.Amplify) {
            this.pushToAmplify();
        }
    },

    async pushToAmplify() {
        try {
            // Placeholder for Amplify Data client:
            // await client.models.PlayerProgress.create({ ...this._data });
            console.log("Spellbinder: Local progress saved. (Amplify sync pending configuration)");
        } catch (err) {
            console.debug("Amplify sync pending...");
        }
    },

    // Pull cloud save from AWS Amplify and merge if it has more XP
    async syncFromCloud() {
        if (!window.Amplify) return false;

        try {
            // Placeholder for Amplify Data retrieval
            // const cloudData = await client.models.PlayerProgress.get({ id: playerID });
            const cloudData = null; 

            if (!cloudData) return false;

            const localXP = this._data?.progress?.xp ?? 0;
            const cloudXP = cloudData?.progress?.xp ?? 0;

            // "Cloud Wins" merge logic
            if (cloudXP > localXP) {
                if (!this._data) this._data = structuredClone(DEFAULTS);
                
                this._data.profile      = cloudData.profile      ?? this._data.profile;
                this._data.progress     = { ...structuredClone(DEFAULTS.progress), ...cloudData.progress };
                this._data.achievements = cloudData.achievements ?? this._data.achievements;

                try { 
                    localStorage.setItem(SAVE_KEY, JSON.stringify(this._data)); 
                } catch (e) {
                    console.error("Spellbinder: Local sync storage failed", e);
                }
                return true;
            }
            return false;
        } catch (err) {
            console.debug("Amplify sync skipped:", err);
            return false;
        }
    },

    get(path) {
        if (!this._data) this.load();
        return path.split('.').reduce((obj, key) => obj?.[key], this._data);
    },

    set(path, value) {
        if (!this._data) this.load();
        const keys = path.split('.');
        const last = keys.pop();
        const obj = keys.reduce((o, k) => o[k], this._data);
        obj[last] = value;
        this.save();
    },

    hasProfile() {
        return !!this.get('profile');
    },

    createProfile(name, avatarId, grade) {
        this._data.profile = { name, avatarId, grade, createdAt: Date.now() };
        this._data.progress.zonesUnlocked = [0];
        this.save();
        return this._data.profile;
    },

    getProgress() { return this.get('progress'); },

    addXP(amount) {
        const prog = this.get('progress');
        prog.xp += amount;
        const newLevel = Math.floor(prog.xp / 200) + 1;
        const leveled  = newLevel > prog.level;
        prog.level = newLevel;
        this.save();
        
        // AWS Amplify Hook for Leaderboard
        if (window.Amplify) {
           // await client.models.Leaderboard.update(...) 
           console.debug("Leaderboard update pending Amplify config.");
        }
        
        return { xp: prog.xp, level: prog.level, leveled };
    },

    markWordMastered(word) {
        const prog = this.get('progress');
        if (!prog.wordsmastered.includes(word)) {
            prog.wordsmastered.push(word);
            this.save();
        }
    },

    unlockZone(zoneId) {
        const prog = this.get('progress');
        if (!prog.zonesUnlocked.includes(zoneId)) {
            prog.zonesUnlocked.push(zoneId);
            this.save();
        }
    },

    completeLevel(zoneId, levelId) {
        const prog = this.get('progress');
        const key = `${zoneId}-${levelId}`;
        if (!prog.levelsComplete[key]) {
            prog.levelsComplete[key] = true;
            prog.battlesWon++;
            if (levelId >= 4) {
                this.unlockZone(zoneId + 1);
            }
            this.save();
        }
    },

    isLevelComplete(zoneId, levelId) {
        return !!this.get(`progress.levelsComplete.${zoneId}-${levelId}`);
    },

    isZoneUnlocked(zoneId) {
        return (this.get('progress.zonesUnlocked') || []).includes(zoneId);
    },

    grantAchievement(id) {
        const list = this.get('achievements') || [];
        if (!list.includes(id)) {
            list.push(id);
            this.set('achievements', list);
            return true;
        }
        return false;
    },

    hasAchievement(id) {
        return (this.get('achievements') || []).includes(id);
    },

    addPlayTime(seconds) {
        const prog = this.get('progress');
        prog.totalPlayTime = (prog.totalPlayTime || 0) + seconds;
        prog.lastPlayed = Date.now();
        this.save();
    },

    getCustomWords() { return this.get('customWords') || []; },

    setCustomWords(words) { this.set('customWords', words); },

    getDashboardPin() { return this.get('settings.dashboardPin'); },

    setDashboardPin(pin) { this.set('settings.dashboardPin', pin); },

    // ── Streak & Daily Engagement ──────────────────────────────────────────

    _todayStr() {
        return new Date().toISOString().slice(0, 10);
    },

    _daysBetween(dateA, dateB) {
        const a = new Date(dateA + 'T00:00:00');
        const b = new Date(dateB + 'T00:00:00');
        return Math.round((b - a) / (1000 * 60 * 60 * 24));
    },

    updateStreak() {
        if (!this._data) this.load();
        const today = this._todayStr();
        const prog  = this._data.progress;
        const last  = prog.lastPlayedDate;
        if (!last) return;
        if (this._daysBetween(last, today) > 1) {
            prog.streak = 0;
            prog.lastPlayedDate = null;
            this.save();
        }
    },

    getDailyProgress() {
        if (!this._data) this.load();
        const today = this._todayStr();
        const prog  = this._data.progress;
        if (prog.dailyDate !== today) {
            prog.dailyMinutes      = 0;
            prog.dailyDate         = today;
            prog.dailyTokensEarned = 0;
            this.save();
        }
        const TARGET = 10;
        const mins   = prog.dailyMinutes || 0;
        return { minutes: mins, target: TARGET, pct: Math.min(1, mins / TARGET), met: mins >= TARGET };
    },

    addDailyPlayTime(seconds) {
        if (!this._data) this.load();
        const today = this._todayStr();
        const prog  = this._data.progress;
        if (prog.dailyDate !== today) {
            prog.dailyMinutes      = 0;
            prog.dailyDate         = today;
            prog.dailyTokensEarned = 0;
        }
        const TARGET       = 10;
        const wasMetBefore = (prog.dailyMinutes || 0) >= TARGET;
        prog.dailyMinutes  = (prog.dailyMinutes || 0) + seconds / 60;
        const isMetNow     = prog.dailyMinutes >= TARGET;
        let justMet        = false;
        if (!wasMetBefore && isMetNow) {
            justMet = true;
            const daysSinceLast = prog.lastPlayedDate
                ? this._daysBetween(prog.lastPlayedDate, today)
                : 999;
            prog.streak         = daysSinceLast <= 1 ? (prog.streak || 0) + 1 : 1;
            prog.lastPlayedDate = today;
        }
        this.save();
        return { met: isMetNow, justMet, streak: prog.streak || 0 };
    },

    addTokens(amount) {
        if (!this._data) this.load();
        const today = this._todayStr();
        const prog  = this._data.progress;
        if (prog.dailyDate !== today) {
            prog.dailyMinutes      = 0;
            prog.dailyDate         = today;
            prog.dailyTokensEarned = 0;
        }
        const cap    = 120;
        const canAdd = Math.max(0, cap - (prog.dailyTokensEarned || 0));
        const actual = Math.min(amount, canAdd);
        prog.tokens            = (prog.tokens || 0) + actual;
        prog.dailyTokensEarned = (prog.dailyTokensEarned || 0) + actual;
        this.save();
        return actual;
    },

    spendTokens(amount) {
        if (!this._data) this.load();
        const prog = this._data.progress;
        if ((prog.tokens || 0) < amount) return false;
        prog.tokens -= amount;
        this.save();
        return true;
    },

    getTokens()  { return this.get('progress.tokens')  || 0; },
    getStreak()  { return this.get('progress.streak')  || 0; },

    recordWordResult(word, success) {
        if (!this._data) this.load();
        const stats = this._data.progress.wordStats;
        if (!stats[word]) stats[word] = { plays: 0, successes: 0 };
        stats[word].plays++;
        if (success) stats[word].successes++;
        this.save();
    },

    getWordSuccessRate(word) {
        const s = this._data?.progress?.wordStats?.[word];
        if (!s || s.plays === 0) return null;
        return s.successes / s.plays;
    },

    clearAll() {
        localStorage.removeItem(SAVE_KEY);
        this._data = structuredClone(DEFAULTS);
    },
};

export default SaveSystem;