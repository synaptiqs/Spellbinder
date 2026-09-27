import WORDS_K3   from '../data/words-k3.js';
import WORDS_4_8  from '../data/words-4-8.js';
import WORDS_9_12 from '../data/words-9-12.js';
import SaveSystem from './SaveSystem.js';

const ALL_WORDS = [...WORDS_K3, ...WORDS_4_8, ...WORDS_9_12];

// Words that are suitable for each grade (grade and below + 1 above for challenge)
function gradePool(grade) {
    const g = Math.max(0, Math.min(12, grade));
    return ALL_WORDS.filter(w => w.grade <= g && w.grade >= Math.max(0, g - 2));
}

const WordSystem = {
    // Return a word entry for a battle in the given zone
    getWordForZone(zoneGradeMin, zoneGradeMax, masteredWords = []) {
        const pool = ALL_WORDS.filter(w =>
            w.grade >= zoneGradeMin && w.grade <= zoneGradeMax
        );
        const unmastered = pool.filter(w => !masteredWords.includes(w.word));
        const source = unmastered.length > 0 ? unmastered : pool;
        return source[Math.floor(Math.random() * source.length)];
    },

    // Return N distinct word entries for a full battle round, targeting ~85% success rate.
    // Words are bucketed by tracked performance: struggling (<60%), review (60-90%), fresh (never played).
    // Mix targets: ~20% struggling (relearn), ~30% review, rest fresh. Full pool fills any gap.
    getBattleWords(zoneId, count = 8) {
        const zone      = this.zones[Math.min(zoneId, this.zones.length - 1)];
        const mastered  = SaveSystem.get('progress.wordsmastered') || [];
        const wordStats = SaveSystem.get('progress.wordStats') || {};

        const pool    = ALL_WORDS.filter(w => w.grade >= zone.gradeMin && w.grade <= zone.gradeMax);
        const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

        const struggling = [];
        const review     = [];
        const fresh      = [];

        for (const w of pool) {
            if (mastered.includes(w.word)) continue;
            const s = wordStats[w.word];
            if (!s || s.plays === 0) {
                fresh.push(w);
            } else {
                const rate = s.successes / s.plays;
                if (rate < 0.6) struggling.push(w);
                else review.push(w);
            }
        }

        const nStruggling = Math.min(Math.ceil(count * 0.2), struggling.length);
        const nReview     = Math.min(Math.ceil(count * 0.3), review.length);

        const seen   = new Set();
        const result = [];

        for (const w of shuffle(struggling).slice(0, nStruggling)) { seen.add(w.word); result.push(w); }
        for (const w of shuffle(review).slice(0, nReview))         { if (!seen.has(w.word)) { seen.add(w.word); result.push(w); } }
        for (const w of shuffle(fresh))     { if (result.length >= count) break; if (!seen.has(w.word)) { seen.add(w.word); result.push(w); } }
        for (const w of shuffle(pool))      { if (result.length >= count) break; if (!seen.has(w.word)) { seen.add(w.word); result.push(w); } }

        return shuffle(result).slice(0, count);
    },

    // Generate plausible decoy variants for a word (used in recall training)
    getDecoys(word, count = 5) {
        const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const ops = [
            (w) => { const i = Math.floor(Math.random() * w.length); return w.slice(0, i) + w[i] + w.slice(i); },
            (w) => { if (w.length < 3) return w + w[0]; const i = 1 + Math.floor(Math.random() * (w.length - 1)); return w.slice(0, i) + w.slice(i + 1); },
            (w) => { const i = Math.floor(Math.random() * (w.length - 1)); return w.slice(0, i) + w[i+1] + w[i] + w.slice(i + 2); },
            (w) => { const i = Math.floor(Math.random() * w.length); return w.slice(0, i) + ALPHA[Math.floor(Math.random() * 26)] + w.slice(i + 1); },
        ];
        const variants = new Set();
        let attempts = 0;
        while (variants.size < count && attempts < 120) {
            const v = ops[Math.floor(Math.random() * ops.length)](word);
            if (v !== word && /^[A-Z]+$/.test(v) && v.length >= 2) variants.add(v);
            attempts++;
        }
        return [...variants].slice(0, count);
    },

    pronounce(word) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(word.toLowerCase());
        utt.rate = 0.85;
        utt.pitch = 1;
        window.speechSynthesis.speak(utt);
    },

    zones: [
        { id: 0, name: 'The Meadow',       gradeMin: 0, gradeMax: 1, theme: 'meadow',   enemy: 'slime',    color: 0x4CAF50 },
        { id: 1, name: 'Whispering Woods', gradeMin: 2, gradeMax: 3, theme: 'forest',   enemy: 'goblin',   color: 0x2E7D32 },
        { id: 2, name: 'Crystal Caves',    gradeMin: 4, gradeMax: 5, theme: 'cave',     enemy: 'troll',    color: 0x5C6BC0 },
        { id: 3, name: 'Stormspire Tower', gradeMin: 6, gradeMax: 7, theme: 'tower',    enemy: 'gargoyle', color: 0x546E7A },
        { id: 4, name: 'The Frozen North', gradeMin: 8, gradeMax: 9, theme: 'ice',      enemy: 'wraith',   color: 0x80DEEA },
        { id: 5, name: "Dragon's Lair",    gradeMin:10, gradeMax:12, theme: 'volcano',  enemy: 'dragon',   color: 0xE53935 },
    ],

    getZone(id) { return this.zones[Math.min(id, this.zones.length - 1)]; },

    allWords() { return ALL_WORDS; },

    wordsByGrade(grade) { return ALL_WORDS.filter(w => w.grade === grade); },
};

export default WordSystem;
