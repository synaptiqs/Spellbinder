import SaveSystem    from '../systems/SaveSystem.js';
import WordSystem    from '../systems/WordSystem.js';
import ProgressSystem from '../systems/ProgressSystem.js';

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP  = 100;
const DAMAGE_WRONG  = 15;
const DAMAGE_WORD   = 25;

const C = {
    yellow: 0xF5C842,
    mint:   0x8EC9A2,
    cloud:  0xF5F0E8,
    coral:  0xE8845A,
    deep:   0x0d0a1e,
};

export default class BattleScene extends Phaser.Scene {
    constructor() { super('BattleScene'); }

    init(data) {
        this._zoneId    = data.zoneId    ?? 0;
        this._levelId   = data.levelId   ?? 0;
        this._wordCount = data.wordCount ?? 8;
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.fadeIn(500);

        const zone = WordSystem.getZone(this._zoneId);
        this._zone  = zone;
        this._words = WordSystem.getBattleWords(this._zoneId, this._wordCount);
        this._wordIndex = 0;

        this._playerHP    = PLAYER_MAX_HP;
        this._enemyHP     = ENEMY_MAX_HP;
        this._typed       = '';
        this._wrongCount  = 0;
        this._hintsUsed   = 0;
        this._mistakes    = 0;
        this._tokensEarned = 0;
        this._battleStart = Date.now();
        this._isMobile    = 'ontouchstart' in window;
        this._inputEnabled = false;
        this._tiles       = [];

        this._lh = height; // canvas is resized above the keyboard in _buildVirtualKeyboard

        this._drawBackground(width, height, zone);
        this._buildHUD(width, height);
        this._drawEnemy(width, height, zone);
        this._drawPlayer(width, height);
        this._buildLetterSlots(width, height);
        this._buildVirtualKeyboard(width, height);

        this.input.keyboard.on('keydown', (e) => this._onKey(e));

        this._startNextWord();
    }

    shutdown() {
        this._clearFlashTimer();
        this._tiles.forEach(t => { if (t?.active) t.destroy(); });
        this._tiles = [];
        if (this._kbEl) { this._kbEl.remove(); this._kbEl = null; }
    }

    // ── Background ────────────────────────────────────────────────────────
    _drawBackground(w, h, zone) {
        const BG = {
            meadow: 'bg-meadow', forest: 'bg-forest', cave: 'bg-cave',
            tower: 'bg-tower', ice: 'bg-ice', volcano: 'bg-volcano',
        };
        this.add.image(w / 2, h / 2, BG[zone.theme] || 'bg-meadow').setDisplaySize(w, h);
    }

    // ── Enemy ─────────────────────────────────────────────────────────────
    _drawEnemy(w, h, zone) {
        this._enemyX = w * 0.75;
        this._enemyY = h * 0.35;
        this._drawEnemyShape(zone.enemy, zone.color);

        this._enemyNameTxt = this.add.text(w * 0.5, h * 0.06, zone.enemy.toUpperCase(), {
            fontFamily: '"Cinzel", Arial',
            fontSize: '14px',
            color: Phaser.Display.Color.IntegerToColor(zone.color).rgba,
            letterSpacing: 4,
        }).setOrigin(0.5);
    }

    _drawEnemyShape(enemy, color) {
        if (this._enemyGfx) this._enemyGfx.destroy();
        this._enemyGfx = this.add.image(this._enemyX, this._enemyY, `enemy-${enemy}`)
            .setOrigin(0.5).setScale(0.9);
    }

    // ── Player ────────────────────────────────────────────────────────────
    _drawPlayer(w, h) {
        const profile  = SaveSystem.get('profile');
        const avatarId = profile?.avatarId ?? 0;
        const px = w * 0.15;
        const py = h * 0.75;
        this._playerGfx = this.add.image(px, py - 80, `wizard-${avatarId}`)
            .setOrigin(0.5).setScale(1.375);
    }

    // ── HUD ───────────────────────────────────────────────────────────────
    _buildHUD(w, h) {
        const bar = this.add.graphics();
        bar.fillStyle(0x0d0a1e, 0.9);
        bar.fillRect(0, 0, w, 52);
        bar.lineStyle(1, 0xF5C842, 0.2);
        bar.lineBetween(0, 52, w, 52);

        this._enemyHPBg = this.add.graphics();
        this._enemyHPBg.fillStyle(0x331111, 1);
        this._enemyHPBg.fillRoundedRect(w * 0.25, 14, w * 0.35, 16, 4);

        this._enemyHPBar = this.add.graphics();
        this.add.text(w * 0.25 - 6, 22, '👾', { fontSize: '14px' }).setOrigin(1, 0.5);
        this._enemyHPLabel = this.add.text(w * 0.6 + 8, 22, '100%', {
            fontFamily: 'Arial', fontSize: '11px', color: '#E8845A',
        }).setOrigin(0, 0.5);

        this._playerHPBg = this.add.graphics();
        this._playerHPBg.fillStyle(0x113311, 1);
        this._playerHPBg.fillRoundedRect(w * 0.05, 14, w * 0.18, 16, 4);

        this._playerHPBar = this.add.graphics();
        this.add.text(w * 0.05 - 6, 22, '🧙', { fontSize: '14px' }).setOrigin(1, 0.5);
        this._playerHPLabel = this.add.text(w * 0.23 + 6, 22, '100%', {
            fontFamily: 'Arial', fontSize: '11px', color: '#8EC9A2',
        }).setOrigin(0, 0.5);

        this._wordCounterTxt = this.add.text(w - 14, 16, `0 / ${this._wordCount}`, {
            fontFamily: '"Cinzel", Arial', fontSize: '12px', color: '#F5C842',
        }).setOrigin(1, 0.5);

        this._tokenCounterTxt = this.add.text(w - 14, 36, '💎 0', {
            fontFamily: 'Arial', fontSize: '11px', color: '#8EC9A2',
        }).setOrigin(1, 0.5);

        this._updateHPBars(w);

        this._statusTxt = this.add.text(w / 2, h * 0.42, '', {
            fontFamily: 'Arial', fontSize: '13px', color: '#8EC9A2', fontStyle: 'italic',
        }).setOrigin(0.5).setDepth(5);

        this._hintTxt = this.add.text(w / 2, h * 0.88, '', {
            fontFamily: '"Crimson Text", Georgia, serif',
            fontSize: '15px',
            color: '#F5F0E8',
            alpha: 0.7,
            wordWrap: { width: w * 0.7 },
            align: 'center',
        }).setOrigin(0.5).setDepth(5);
    }

    _updateHPBars(w) {
        const ePct = Math.max(0, this._enemyHP  / ENEMY_MAX_HP);
        const pPct = Math.max(0, this._playerHP / PLAYER_MAX_HP);

        this._enemyHPBar.clear();
        this._enemyHPBar.fillStyle(0xE8845A, 1);
        this._enemyHPBar.fillRoundedRect(w * 0.25, 14, w * 0.35 * ePct, 16, 4);
        this._enemyHPLabel.setText(`${Math.ceil(this._enemyHP)}%`);

        this._playerHPBar.clear();
        this._playerHPBar.fillStyle(0x8EC9A2, 1);
        this._playerHPBar.fillRoundedRect(w * 0.05, 14, w * 0.18 * pPct, 16, 4);
        this._playerHPLabel.setText(`${Math.ceil(this._playerHP)}%`);
    }

    // ── Letter tiles ──────────────────────────────────────────────────────
    _buildLetterSlots(w, h) {
        this._slotsY   = h * 0.50;   // center — preview landing zone
        this._hoverY   = h * 0.25;   // upper third — idle hover zone
        this._hovering = false;
        this._tiles    = [];
    }

    _animateWordIn(word) {
        this._tiles.forEach(t => { if (t?.active) t.destroy(); });
        this._tiles = [];

        const w     = this.scale.width;
        const h     = this._lh;
        const count = word.length;
        const slotW = Math.min(58, (w * 0.8) / count);
        const slotH = slotW * 1.2;
        this._slotW = slotW;
        this._slotH = slotH;
        const gap    = 14;
        const totalW = count * slotW + (count - 1) * gap;
        const startX = (w - totalW) / 2 + slotW / 2;

        for (let i = 0; i < count; i++) {
            const letter  = word[i];
            const targetX = startX + i * (slotW + gap);
            const targetY = this._slotsY;

            // Random off-screen start position from any of the 4 edges
            const edge = Phaser.Math.Between(0, 3);
            let sx, sy;
            switch (edge) {
                case 0:  sx = Phaser.Math.Between(0, w); sy = -80;     break; // top
                case 1:  sx = Phaser.Math.Between(0, w); sy = h + 80;  break; // bottom
                case 2:  sx = -80;    sy = Phaser.Math.Between(52, h); break; // left
                default: sx = w + 80; sy = Phaser.Math.Between(52, h); break; // right
            }

            const tile = this.add.image(sx, sy, `tile-active-${letter}`)
                .setDisplaySize(slotW, slotH)
                .setDepth(4);

            tile._logicalIndex = i;
            tile._targetX      = targetX;
            tile._targetY      = targetY;
            tile._letter       = letter;
            tile._filled       = false;

            this.tweens.add({
                targets: tile,
                x: targetX,
                y: targetY,
                duration: 450,
                delay: i * 80,
                ease: 'Back.Out',
            });

            this._tiles.push(tile);
        }
    }

    _flipAndShuffle(h) {
        const count = this._tiles.length;
        let flipsComplete = 0;

        this._tiles.forEach((tile, i) => {
            if (!tile?.active) {
                flipsComplete++;
                if (flipsComplete === count) this._shuffleTiles(h);
                return;
            }
            // Flip: scale to 0, swap texture, scale back to 1
            this.tweens.add({
                targets: tile,
                scaleX: 0,
                duration: 150,
                delay: i * 30,
                ease: 'Quad.In',
                onComplete: () => {
                    if (!tile.active) {
                        flipsComplete++;
                        if (flipsComplete === count) this._shuffleTiles(h);
                        return;
                    }
                    tile.setTexture('tile-empty').setDisplaySize(this._slotW, this._slotH);
                    this.tweens.add({
                        targets: tile,
                        scaleX: 1,
                        duration: 150,
                        ease: 'Quad.Out',
                        onComplete: () => {
                            flipsComplete++;
                            if (flipsComplete === count) this._shuffleTiles(h);
                        },
                    });
                },
            });
        });
    }

    _shuffleTiles(h) {
        // Collect target X positions and Fisher-Yates shuffle them
        const positions = this._tiles.map(t => t._targetX);
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        this._tiles.forEach((tile, i) => {
            if (!tile?.active) return;
            this.tweens.add({
                targets: tile,
                x: positions[i],
                duration: 350,
                ease: 'Quad.InOut',
            });
        });

        // Enable input 200ms after shuffle settles, then start idle hover
        this.time.delayedCall(550, () => {
            if (!this.scene.isActive('BattleScene')) return;
            this._inputEnabled = true;
            this._statusTxt.setText('Spell it!').setY(h * 0.43);
            this._startHoverAnimation();
        });
    }

    _startHoverAnimation() {
        this._tiles.forEach((tile, i) => {
            if (!tile?.active) return;
            tile._hoverCenterX = tile.x;
            tile._hoverCenterY = tile.y;
            tile._hoverPhase   = (i / Math.max(this._tiles.length, 1)) * Math.PI * 2;
        });
        this._hovering = true;
    }

    _stopHoverAnimation() {
        if (!this._hovering) return;
        this._hovering = false;
        this._tiles.forEach(tile => {
            if (!tile?.active || tile._hoverCenterX === undefined) return;
            tile.x = tile._hoverCenterX;
            tile.y = tile._hoverCenterY;
        });
    }

    update(time) {
        if (!this._hovering) return;
        const r      = 5;
        const period = 2200;
        const t      = (time / period) * Math.PI * 2;
        this._tiles.forEach(tile => {
            if (!tile?.active || tile._filled) return;
            tile.x = tile._hoverCenterX + r * Math.cos(t + tile._hoverPhase);
            tile.y = tile._hoverCenterY + r * Math.sin(t + tile._hoverPhase);
        });
    }

    _fillSlot(index, letter) {
        const tile = this._tiles[index];
        if (!tile) return;
        tile._letter = letter;
        tile._filled = true;
        tile.setTexture(`tile-correct-${letter}`).setDisplaySize(this._slotW, this._slotH);
        tile.setDepth(6);

        const targetX  = tile._targetX;
        const targetY  = tile._targetY;
        const fillerCX = tile._hoverCenterX ?? tile.x;
        const fillerCY = tile._hoverCenterY ?? tile.y;

        // After shuffle a different tile may occupy this slot's target X.
        // Displace it to where the filling tile came from so they never stack.
        this._tiles.forEach((other, i) => {
            if (i === index || !other?.active || other._filled) return;
            const cx = other._hoverCenterX ?? other.x;
            if (Math.abs(cx - targetX) < this._slotW * 0.5) {
                other._hoverCenterX = fillerCX;
                other._hoverCenterY = fillerCY;
                this.tweens.add({
                    targets: other,
                    x: fillerCX,
                    y: fillerCY,
                    duration: 200,
                    ease: 'Quad.Out',
                });
            }
        });

        this.tweens.add({
            targets: tile,
            x: targetX,
            y: targetY,
            duration: 220,
            ease: 'Back.Out',
        });
    }

    _setSlotHint(index, letter) {
        const tile = this._tiles[index];
        if (!tile?.active || tile._filled) return;
        tile.setTexture(`tile-hint-${letter}`).setDisplaySize(this._slotW, this._slotH);
    }

    _completeAllSlots() {
        this._tiles.forEach(tile => {
            if (tile?._filled && tile?._letter) {
                tile.setTexture(`tile-complete-${tile._letter}`).setDisplaySize(this._slotW, this._slotH);
            }
        });
    }

    // ── Virtual keyboard (mobile) ─────────────────────────────────────────
    _buildVirtualKeyboard(w, h) {
        if (!this._isMobile) return;

        const root = document.getElementById('overlay-root');
        const kb   = document.createElement('div');
        kb.id = 'vkb';
        const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
        const keyH = Math.min(48, (window.innerHeight * 0.22) / 3);
        kb.style.cssText = `
            position:fixed;bottom:0;left:0;width:100%;
            display:grid;grid-template-rows:repeat(3,auto);gap:4px;
            padding:6px 6px 10px;background:rgba(10,6,25,0.96);
            border-top:1px solid rgba(245,200,66,0.25);z-index:20;
        `;
        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;gap:4px;';
            [...row].forEach(ch => {
                const btn = document.createElement('button');
                btn.textContent = ch;
                btn.style.cssText = `
                    flex:1;max-width:${100 / row.length}%;height:${keyH}px;
                    background:rgba(30,15,60,0.9);border:1px solid rgba(245,200,66,0.3);
                    border-radius:5px;color:#F5F0E8;font-size:${keyH * 0.42}px;
                    font-family:'Cinzel',Arial;cursor:pointer;
                `;
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this._processLetter(ch);
                }, { passive: false });
                rowDiv.appendChild(btn);
            });
            kb.appendChild(rowDiv);
        });
        root.appendChild(kb);
        this._kbEl = kb;

        // Shrink the game container so Phaser's FIT mode rescales the canvas
        // to sit entirely above the keyboard — nothing hidden underneath.
        // Measure the real rendered height after append (offsetHeight forces layout).
        const container = document.getElementById('game-container');
        if (container) {
            const kbH = kb.offsetHeight || 0;
            container.style.height = `${window.innerHeight - kbH}px`;
            this.game.scale.refresh();
        }
    }

    // ── Game flow ─────────────────────────────────────────────────────────
    _currentWord() { return this._words[this._wordIndex]; }

    _startNextWord() {
        if (this._wordIndex >= this._words.length) { this._victory(); return; }
        this._typed        = '';
        this._wrongCount   = 0;
        this._hintsUsed    = 0; // hints (and the no-hint token bonus) reset per word
        this._inputEnabled = false;
        this._hovering     = false;

        const entry  = this._currentWord();
        const word   = entry.word;
        const grade  = entry.grade;
        const h      = this._lh;

        WordSystem.pronounce(word);

        // flashMs = how long the word stays visible after all tiles have landed
        const flashMs = grade <= 1 ? 4000 : grade <= 3 ? 3000 : grade <= 6 ? 2500 : 2000;
        // flyInMs = time for last tile to arrive (stagger + tween duration + small buffer)
        const flyInMs = word.length * 80 + 500;

        this._statusTxt
            .setText('Memorize this word!')
            .setY(h * 0.42)
            .setColor('#8EC9A2')
            .setVisible(true);
        this._hintTxt.setText('').setVisible(false);

        this._animateWordIn(word);

        this._flashTimer = this.time.delayedCall(flyInMs + flashMs, () => {
            this._flipAndShuffle(h);
        });
    }

    _clearFlashTimer() {
        if (this._flashTimer) { this._flashTimer.remove(); this._flashTimer = null; }
    }

    // ── Input handling ────────────────────────────────────────────────────
    _onKey(e) {
        if (!this._inputEnabled) return;
        const ch = e.key.toUpperCase();
        if (/^[A-Z]$/.test(ch)) this._processLetter(ch);
    }

    _processLetter(ch) {
        if (!this._inputEnabled) return;
        this._stopHoverAnimation();
        const word   = this._currentWord().word;
        const needed = word[this._typed.length];

        if (ch === needed) {
            const idx = this._typed.length;
            this._typed += ch;
            this._wrongCount = 0;
            this._playTone(true);

            this._fillSlot(idx, ch);
            this._spawnSparkle(
                this._tiles[idx]?._targetX ?? this.scale.width / 2,
                this._slotsY
            );

            if (this._typed === word) {
                this._inputEnabled = false;
                this._onWordComplete();
            }
        } else {
            this._inputEnabled = false;
            this._wrongCount++;
            this._mistakes++;
            this._playTone(false);

            this._playerHP = Math.max(0, this._playerHP - DAMAGE_WRONG);
            this._updateHPBars(this.scale.width);
            this._shakeTarget(this._playerGfx);

            // Flash only the current slot with the wrong letter typed — don't reveal other slots
            const slotIdx  = this._typed.length;
            const wrongTile = this._tiles[slotIdx];
            if (wrongTile?.active) {
                wrongTile.setTexture(`tile-wrong-${ch}`).setDisplaySize(this._slotW, this._slotH);
            }

            if (this._wrongCount >= 2 && this._hintsUsed === 0) {
                this._hintsUsed++;
                const entry   = this._currentWord();
                const hintTxt = entry.definition
                    ? `"${entry.definition}"\n${entry.sentence || ''}`
                    : '';
                this._hintTxt.setText(hintTxt).setVisible(true);
                this._statusTxt.setText(`Hint: next letter is ${word[slotIdx]}`);
            }

            if (this._playerHP <= 0) { this._defeat(); return; }

            this.time.delayedCall(400, () => {
                if (!this.scene.isActive('BattleScene')) return;
                if (wrongTile?.active && !wrongTile._filled) {
                    wrongTile.setTexture('tile-empty').setDisplaySize(this._slotW, this._slotH);
                }
                if (this._hintsUsed > 0) {
                    this._setSlotHint(slotIdx, word[slotIdx]);
                    this._statusTxt.setText(`Hint: next letter is ${word[slotIdx]}`);
                }
                this._inputEnabled = true;
                this._startHoverAnimation();
            });
        }
    }

    _onWordComplete() {
        const entry = this._currentWord();
        SaveSystem.markWordMastered(entry.word);
        SaveSystem.recordWordResult(entry.word, true);

        const tokenAmt = 10 + (this._hintsUsed === 0 ? 5 : 0);
        const actual   = SaveSystem.addTokens(tokenAmt);
        this._tokensEarned += actual;
        this._tokenCounterTxt.setText(`💎 ${this._tokensEarned}`);

        // Wait for last tile's position tween (220ms) before switching to complete state
        this.time.delayedCall(250, () => { this._completeAllSlots(); });

        this._enemyHP = Math.max(0, this._enemyHP - DAMAGE_WORD);
        this._updateHPBars(this.scale.width);

        this._shakeTarget(this._enemyGfx);
        this._spawnSparkle(this._enemyX, this._enemyY);
        this._statusTxt.setText(`✦ ${entry.word}! ✦`).setColor('#F5C842');

        this._wordCounterTxt.setText(`${this._wordIndex + 1} / ${this._wordCount}`);

        this.time.delayedCall(700, () => {
            this._wordIndex++;
            this._statusTxt.setColor('#8EC9A2');

            if (this._enemyHP <= 0) { this._victory(); return; }
            if (this._wordIndex >= this._words.length) { this._victory(); return; }
            this._startNextWord();
        });
    }

    // ── Effects ───────────────────────────────────────────────────────────
    _spawnSparkle(x, y) {
        for (let i = 0; i < 8; i++) {
            const g = this.add.graphics();
            g.fillStyle(0xFFD700, 1);
            g.fillCircle(0, 0, 3);
            g.x = x; g.y = y;
            const angle = (i / 8) * Math.PI * 2;
            const dist  = 40 + Math.random() * 30;
            this.tweens.add({
                targets: g,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 500,
                ease: 'Quad.Out',
                onComplete: () => g.destroy(),
            });
        }
    }

    _shakeTarget(target) {
        const origX = target.x;
        this.tweens.add({
            targets: target,
            x: { from: origX - 8, to: origX + 8 },
            duration: 60,
            repeat: 4,
            yoyo: true,
            onComplete: () => { target.x = origX; },
        });
    }

    _playTone(correct) {
        if (!this.sound?.context) return;
        const ctx  = this.sound.context;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = correct ? 660 : 220;
        osc.type = correct ? 'sine' : 'sawtooth';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
    }

    // ── End states ────────────────────────────────────────────────────────
    _victory() {
        const elapsed = Date.now() - this._battleStart;
        const xp = ProgressSystem.calcBattleXP(
            this._wordIndex, this._wordCount, elapsed, this._hintsUsed
        );
        const { xp: totalXP, level, leveled } = SaveSystem.addXP(xp);
        SaveSystem.completeLevel(this._zoneId, this._levelId);
        SaveSystem.addPlayTime(Math.floor(elapsed / 1000));
        const { met: dailyMet, justMet: dailyJustMet, streak } = SaveSystem.addDailyPlayTime(elapsed / 1000);

        // Max speed bonus (speed ratio hits the 1.5x cap) earns Lightning Caster.
        // Mirrors the speedRatio computation in ProgressSystem.calcBattleXP.
        const speedRatio = Math.min((this._wordCount * 6000) / Math.max(elapsed, 1000), 1.5);
        const newAchs = ProgressSystem.checkAchievements({
            perfect_battle: this._mistakes === 0,
            speed_run: speedRatio >= 1.5,
        });

        this._cleanup();
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('ResultsScene', {
                won: true,
                zoneId: this._zoneId,
                levelId: this._levelId,
                xpEarned: xp,
                totalXP,
                level,
                leveled,
                wordsMastered: this._words.slice(0, this._wordIndex).map(w => w.word),
                newAchievements: newAchs,
                mistakes: this._mistakes,
                tokensEarned: this._tokensEarned,
                dailyGoalMet: dailyMet,
                dailyGoalJustMet: dailyJustMet,
                streak,
            });
        });
    }

    _defeat() {
        // Option C: a lost battle is a RETREAT, not a wipe. The player keeps
        // 65% of the XP their completed words would have earned, plus every
        // completed word (markWordMastered already ran per word). The level
        // itself is NOT completed — campaign progress is never lost.
        const elapsed    = Date.now() - this._battleStart;
        const wordsKept  = this._wordIndex;
        const failedWord = this._words[this._wordIndex]?.word;
        if (failedWord) SaveSystem.recordWordResult(failedWord, false);
        const retreatXP = Math.round(ProgressSystem.calcBattleXP(
            wordsKept, this._wordCount, elapsed, this._hintsUsed
        ) * 0.65);
        const { xp: totalXP, level, leveled } = SaveSystem.addXP(retreatXP);
        SaveSystem.addPlayTime(Math.floor(elapsed / 1000));
        const newAchs = ProgressSystem.checkAchievements({});
        this._cleanup();
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('ResultsScene', {
                won: false,
                zoneId: this._zoneId,
                levelId: this._levelId,
                xpEarned: retreatXP,
                totalXP,
                level,
                leveled,
                wordsMastered: this._words.slice(0, wordsKept).map(w => w.word),
                newAchievements: newAchs,
                mistakes: this._mistakes,
                tokensEarned: this._tokensEarned,
            });
        });
    }

    _cleanup() {
        this._clearFlashTimer();
        this._tiles.forEach(t => { if (t?.active) t.destroy(); });
        this._tiles = [];
        if (this._kbEl) {
            this._kbEl.remove();
            this._kbEl = null;
            // Restore full-screen canvas for other scenes
            const container = document.getElementById('game-container');
            if (container) {
                container.style.height = '';
                this.game.scale.refresh();
            }
        }
    }
}
