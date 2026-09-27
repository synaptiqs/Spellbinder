// DashboardScene — pure HTML overlay (no Phaser canvas)
// Call DashboardScene.open() to mount; DashboardScene.close() to unmount.

import SaveSystem    from '../systems/SaveSystem.js';
import WordSystem    from '../systems/WordSystem.js';

const C = {
    yellow: '#F5C842',
    mint:   '#8EC9A2',
    coral:  '#E8845A',
    cloud:  '#F5F0E8',
    deep:   '#0d0a1e',
};

function css(el, styles) { Object.assign(el.style, styles); }

const DashboardScene = {
    _root: null,

    open() {
        const pin = SaveSystem.getDashboardPin();
        if (pin) {
            this._promptPin(pin, () => this._render());
        } else {
            this._promptSetPin(() => this._render());
        }
    },

    close() {
        if (this._root) { this._root.remove(); this._root = null; }
    },

    _promptPin(storedPin, onSuccess) {
        const overlay = this._overlay();

        const box = document.createElement('div');
        css(box, {
            background: 'rgba(15,8,35,0.97)',
            border: '1px solid rgba(245,200,66,0.4)',
            borderRadius: '12px',
            padding: '40px 50px',
            textAlign: 'center',
            minWidth: '300px',
        });

        box.innerHTML = `
            <p style="font-family:'Cinzel',Arial;font-size:13px;color:${C.mint};letter-spacing:3px;margin:0 0 18px;">DASHBOARD ACCESS</p>
            <h2 style="font-family:'Cinzel Decorative',Georgia;font-size:22px;color:${C.yellow};margin:0 0 24px;">Enter PIN</h2>
            <input id="db-pin-input" type="password" maxlength="4" inputmode="numeric"
                style="width:120px;padding:12px;font-size:24px;text-align:center;letter-spacing:8px;
                background:rgba(20,10,45,0.9);border:1px solid rgba(245,200,66,0.4);border-radius:6px;
                color:${C.cloud};outline:none;font-family:Arial;">
            <br><br>
            <button id="db-pin-ok" style="padding:10px 30px;background:${C.yellow};border:none;border-radius:6px;
                font-family:'Cinzel',Arial;font-size:14px;font-weight:bold;cursor:pointer;color:${C.deep};">Enter</button>
            <br><br>
            <span id="db-pin-err" style="color:${C.coral};font-size:12px;font-family:Arial;"></span>
            <br>
            <a href="#" id="db-cancel" style="color:${C.mint};font-size:12px;font-family:Arial;">Cancel</a>
        `;
        overlay.appendChild(box);
        document.getElementById('overlay-root').appendChild(overlay);
        document.getElementById('db-pin-input').focus();

        document.getElementById('db-pin-ok').onclick = () => {
            const entered = document.getElementById('db-pin-input').value;
            if (entered === String(storedPin)) { overlay.remove(); onSuccess(); }
            else document.getElementById('db-pin-err').textContent = 'Incorrect PIN.';
        };
        document.getElementById('db-cancel').onclick = (e) => { e.preventDefault(); overlay.remove(); };
    },

    _promptSetPin(onSuccess) {
        const overlay = this._overlay();

        const box = document.createElement('div');
        css(box, {
            background: 'rgba(15,8,35,0.97)',
            border: '1px solid rgba(245,200,66,0.4)',
            borderRadius: '12px',
            padding: '40px 50px',
            textAlign: 'center',
            minWidth: '320px',
        });

        box.innerHTML = `
            <p style="font-family:'Cinzel',Arial;font-size:13px;color:${C.mint};letter-spacing:3px;margin:0 0 8px;">FIRST-TIME SETUP</p>
            <h2 style="font-family:'Cinzel Decorative',Georgia;font-size:20px;color:${C.yellow};margin:0 0 10px;">Set a Dashboard PIN</h2>
            <p style="font-family:Arial;font-size:12px;color:${C.cloud};opacity:0.7;margin:0 0 20px;">
                Choose a 4-digit PIN to protect the parent/teacher dashboard.
            </p>
            <input id="db-newpin" type="password" maxlength="4" inputmode="numeric" placeholder="New PIN"
                style="width:120px;padding:12px;font-size:24px;text-align:center;letter-spacing:8px;
                background:rgba(20,10,45,0.9);border:1px solid rgba(245,200,66,0.4);border-radius:6px;
                color:${C.cloud};outline:none;font-family:Arial;">
            <br><br>
            <button id="db-setpin-ok" style="padding:10px 30px;background:${C.yellow};border:none;border-radius:6px;
                font-family:'Cinzel',Arial;font-size:14px;font-weight:bold;cursor:pointer;color:${C.deep};">Set PIN & Open</button>
            <br><br>
            <a href="#" id="db-cancel2" style="color:${C.mint};font-size:12px;font-family:Arial;">Cancel</a>
        `;
        overlay.appendChild(box);
        document.getElementById('overlay-root').appendChild(overlay);
        document.getElementById('db-newpin').focus();

        document.getElementById('db-setpin-ok').onclick = () => {
            const val = document.getElementById('db-newpin').value;
            if (val.length === 4 && /^\d{4}$/.test(val)) {
                SaveSystem.setDashboardPin(val);
                overlay.remove();
                onSuccess();
            }
        };
        document.getElementById('db-cancel2').onclick = (e) => { e.preventDefault(); overlay.remove(); };
    },

    _render() {
        const progress = SaveSystem.getProgress();
        const profile  = SaveSystem.get('profile');

        if (this._root) this._root.remove();
        const overlay = this._overlay();
        overlay.style.alignItems = 'flex-start';
        overlay.style.padding    = '0';

        const panel = document.createElement('div');
        css(panel, {
            width: '100%', height: '100%', overflowY: 'auto',
            padding: '32px 48px', boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
        });

        // Header
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
                <div>
                    <p style="font-family:'Cinzel',Arial;font-size:11px;color:${C.mint};letter-spacing:3px;margin:0 0 6px;">SPELLBINDER</p>
                    <h1 style="font-family:'Cinzel Decorative',Georgia;font-size:26px;color:${C.yellow};margin:0;">Parent & Teacher Dashboard</h1>
                </div>
                <button id="db-close" style="padding:8px 20px;background:transparent;border:1px solid ${C.mint}66;border-radius:6px;
                    color:${C.mint};font-family:'Cinzel',Arial;font-size:13px;cursor:pointer;">✕ Close</button>
            </div>

            <!-- Stat cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px;">
                ${this._statCard('Player', profile?.name || '—')}
                ${this._statCard('Level', progress?.level || 1)}
                ${this._statCard('Words Mastered', progress?.wordsmastered?.length || 0)}
                ${this._statCard('Battles Won', progress?.battlesWon || 0)}
                ${this._statCard('Play Time', this._fmtTime(progress?.totalPlayTime || 0))}
                ${this._statCard('Grade', profile?.grade ?? '—')}
            </div>

            <!-- Zone progress -->
            <h3 style="font-family:'Cinzel',Arial;font-size:14px;color:${C.yellow};letter-spacing:2px;margin-bottom:12px;">Zone Progress</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:32px;">
                ${WordSystem.zones.map(zone => {
                    const unlocked = SaveSystem.isZoneUnlocked(zone.id);
                    const levelsComplete = Array.from({ length: 5 }, (_, li) => SaveSystem.isLevelComplete(zone.id, li)).filter(Boolean).length;
                    return this._zoneCard(zone, unlocked, levelsComplete);
                }).join('')}
            </div>

            <!-- Word mastery breakdown -->
            <h3 style="font-family:'Cinzel',Arial;font-size:14px;color:${C.yellow};letter-spacing:2px;margin-bottom:12px;">Words Mastered by Grade</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:32px;">
                ${this._gradeMasteryGrid(progress?.wordsmastered || [])}
            </div>

            <!-- Custom word list -->
            <h3 style="font-family:'Cinzel',Arial;font-size:14px;color:${C.yellow};letter-spacing:2px;margin-bottom:8px;">Custom Word List</h3>
            <p style="font-size:12px;color:${C.cloud};opacity:0.7;margin-bottom:8px;">
                Paste words (one per line, or comma-separated). Format: WORD, definition, example sentence
            </p>
            <textarea id="db-custom-words" rows="6" style="width:100%;padding:10px;
                background:rgba(20,10,45,0.8);border:1px solid rgba(245,200,66,0.3);border-radius:6px;
                color:${C.cloud};font-size:13px;font-family:Arial;resize:vertical;box-sizing:border-box;"
                placeholder="PHOTOSYNTHESIS, Process plants use to make food, Plants use photosynthesis to grow."
            >${SaveSystem.getCustomWords().map(w => `${w.word}, ${w.definition || ''}, ${w.sentence || ''}`).join('\n')}</textarea>
            <br>
            <button id="db-save-words" style="margin-top:10px;padding:10px 24px;background:${C.yellow};border:none;
                border-radius:6px;font-family:'Cinzel',Arial;font-size:13px;font-weight:bold;cursor:pointer;color:${C.deep};">Save Custom Words</button>
            <span id="db-words-saved" style="margin-left:12px;color:${C.mint};font-size:12px;"></span>

            <!-- Change PIN -->
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(245,200,66,0.15);">
                <button id="db-change-pin" style="padding:8px 18px;background:transparent;border:1px solid rgba(245,200,66,0.3);
                    border-radius:6px;color:${C.yellow};font-family:Arial;font-size:12px;cursor:pointer;">Change PIN</button>
                <button id="db-reset" style="margin-left:12px;padding:8px 18px;background:transparent;
                    border:1px solid rgba(232,132,90,0.4);border-radius:6px;color:${C.coral};font-family:Arial;font-size:12px;cursor:pointer;">Reset All Progress</button>
            </div>
        `;

        overlay.appendChild(panel);
        document.getElementById('overlay-root').appendChild(overlay);
        this._root = overlay;

        // Events
        document.getElementById('db-close').onclick = () => this.close();

        document.getElementById('db-save-words').onclick = () => {
            const raw = document.getElementById('db-custom-words').value.trim();
            const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
            const words = lines.map(line => {
                const parts = line.split(',').map(p => p.trim());
                return { word: parts[0]?.toUpperCase(), definition: parts[1] || '', sentence: parts[2] || '' };
            }).filter(w => w.word?.length >= 2);
            SaveSystem.setCustomWords(words);
            document.getElementById('db-words-saved').textContent = `Saved ${words.length} word(s) ✓`;
        };

        document.getElementById('db-change-pin').onclick = () => {
            this.close();
            this._promptSetPin(() => this._render());
        };

        document.getElementById('db-reset').onclick = () => {
            if (confirm('Reset ALL progress? This cannot be undone.')) {
                SaveSystem.clearAll();
                this.close();
                location.reload();
            }
        };
    },

    _overlay() {
        const el = document.createElement('div');
        css(el, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'radial-gradient(ellipse at 50% 30%, rgba(15,8,40,0.99) 0%, rgba(5,2,15,0.99) 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            zIndex: '500', overflowY: 'auto',
        });
        return el;
    },

    _statCard(label, value) {
        return `
        <div style="background:rgba(20,10,45,0.8);border:1px solid rgba(245,200,66,0.2);border-radius:8px;padding:16px 20px;">
            <div style="font-size:22px;font-family:'Cinzel',Arial;color:#F5C842;font-weight:bold;">${value}</div>
            <div style="font-size:11px;color:#8EC9A2;margin-top:4px;">${label}</div>
        </div>`;
    },

    _zoneCard(zone, unlocked, levelsComplete) {
        const color = unlocked ? `#${zone.color.toString(16).padStart(6, '0')}` : '#444466';
        const pct   = unlocked ? (levelsComplete / 5 * 100).toFixed(0) : 0;
        return `
        <div style="background:rgba(20,10,45,0.8);border:1px solid ${color}44;border-radius:8px;padding:14px 16px;">
            <div style="font-size:13px;font-family:'Cinzel',Arial;color:${color};margin-bottom:8px;">${zone.name}</div>
            <div style="background:#1a0a30;border-radius:3px;height:8px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${color};transition:width 0.5s;"></div>
            </div>
            <div style="font-size:11px;color:#8EC9A2;margin-top:6px;">${unlocked ? `${levelsComplete}/5 levels` : 'Locked'}</div>
        </div>`;
    },

    _gradeMasteryGrid(mastered) {
        const masteredSet = new Set(mastered.map(w => w.toUpperCase()));
        const allWords    = WordSystem.allWords();
        const groups = [
            { label: 'K–3',   min: 0, max: 3  },
            { label: '4–6',   min: 4, max: 6  },
            { label: '7–9',   min: 7, max: 9  },
            { label: '10–12', min: 10, max: 12 },
        ];

        return groups.map(({ label, min, max }) => {
            const total   = allWords.filter(w => w.grade >= min && w.grade <= max).length;
            const mastered = allWords.filter(w => w.grade >= min && w.grade <= max && masteredSet.has(w.word)).length;
            const pct     = total > 0 ? Math.round(mastered / total * 100) : 0;
            return `
            <div style="background:rgba(20,10,45,0.8);border:1px solid rgba(245,200,66,0.2);border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;font-family:'Cinzel',Arial;color:#F5C842;">${mastered}</div>
                <div style="font-size:11px;color:#8EC9A2;margin-top:2px;">Grade ${label}</div>
                <div style="background:#1a0a30;border-radius:3px;height:6px;overflow:hidden;margin-top:8px;">
                    <div style="width:${pct}%;height:100%;background:#F5C842;"></div>
                </div>
                <div style="font-size:10px;color:#666;margin-top:4px;">${pct}% of ${total}</div>
            </div>`;
        }).join('');
    },

    _fmtTime(sec) {
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },
};

export default DashboardScene;
