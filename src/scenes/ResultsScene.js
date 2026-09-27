import ProgressSystem from '../systems/ProgressSystem.js';
import SaveSystem     from '../systems/SaveSystem.js';

export default class ResultsScene extends Phaser.Scene {
    constructor() { super('ResultsScene'); }

    init(data) {
        this._won              = data.won ?? false;
        this._zoneId           = data.zoneId ?? 0;
        this._levelId          = data.levelId ?? 0;
        this._xpEarned         = data.xpEarned ?? 0;
        this._totalXP          = data.totalXP ?? 0;
        this._level            = data.level ?? 1;
        this._leveled          = data.leveled ?? false;
        this._wordsMastered    = data.wordsMastered ?? [];
        this._newAchs          = data.newAchievements ?? [];
        this._mistakes         = data.mistakes ?? 0;
        this._tokensEarned     = data.tokensEarned ?? 0;
        this._dailyGoalJustMet = data.dailyGoalJustMet ?? false;
        this._streak           = data.streak ?? 0;
    }

    create() {
        const { width: w, height: h } = this.scale;
        this.cameras.main.fadeIn(500);

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0d0a1e, 0x0d0a1e, 0x180a30, 0x050310, 1);
        bg.fillRect(0, 0, w, h);

        if (this._won) {
            this._drawVictory(w, h);
        } else {
            this._drawDefeat(w, h);
        }
    }

    _drawVictory(w, h) {
        // Title
        this.add.text(w / 2, h * 0.1, '✦  VICTORY  ✦', {
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            fontSize: '36px',
            color: '#F5C842',
            shadow: { x: 0, y: 0, color: '#FFD700', blur: 10, fill: true },
        }).setOrigin(0.5);

        // Subtitle
        const perf = this._mistakes === 0 ? '  ✨ PERFECT CAST!' : '';
        this.add.text(w / 2, h * 0.17, `Level ${this._levelId + 1} Complete${perf}`, {
            fontFamily: '"Cinzel", Arial', fontSize: '16px', color: '#8EC9A2',
        }).setOrigin(0.5);

        // XP + tokens earned
        this.add.text(w / 2, h * 0.26, `+${this._xpEarned} XP`, {
            fontFamily: '"Cinzel Decorative", Georgia',
            fontSize: '44px',
            color: '#F5C842',
        }).setOrigin(0.5);

        if (this._tokensEarned > 0) {
            this.add.text(w / 2, h * 0.33, `💎 +${this._tokensEarned} tokens`, {
                fontFamily: '"Cinzel", Arial', fontSize: '16px', color: '#8EC9A2',
            }).setOrigin(0.5);
        }

        // Daily goal completion banner
        if (this._dailyGoalJustMet) {
            const banner = this.add.text(w / 2, h * 0.39, `🔥 Daily Goal Complete!  ${this._streak} day streak!`, {
                fontFamily: '"Cinzel", Arial', fontSize: '14px', color: '#F5C842',
                backgroundColor: '#1a0a30',
                padding: { x: 16, y: 8 },
            }).setOrigin(0.5);
            this.tweens.add({ targets: banner, scaleX: 1.04, scaleY: 1.04, duration: 500, yoyo: true, repeat: 2 });
        }

        // XP bar
        this._drawXPBar(w, h * 0.44);

        // Words mastered list
        if (this._wordsMastered.length > 0) {
            this.add.text(w / 2, h * 0.52, 'Words Mastered', {
                fontFamily: '"Cinzel", Arial', fontSize: '13px', color: '#8EC9A2', letterSpacing: 3,
            }).setOrigin(0.5);

            const cols  = Math.min(6, this._wordsMastered.length);
            const gapX  = 120;
            const startX = w / 2 - ((cols - 1) * gapX) / 2;
            this._wordsMastered.forEach((word, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                this.add.text(startX + col * gapX, h * 0.58 + row * 26, word, {
                    fontFamily: '"Cinzel", Arial', fontSize: '12px', color: '#F5F0E8',
                }).setOrigin(0.5);
            });
        }

        // Level up
        if (this._leveled) {
            const lvlTxt = this.add.text(w / 2, h * 0.70, `⭐  LEVEL UP!  Now Level ${this._level}`, {
                fontFamily: '"Cinzel", Arial', fontSize: '18px', color: '#F5C842',
            }).setOrigin(0.5);
            this.tweens.add({ targets: lvlTxt, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true, repeat: 3 });
        }

        // New achievements
        if (this._newAchs.length > 0) {
            const achY = h * 0.77;
            this.add.text(w / 2, achY, '🏆  New Achievement Unlocked!', {
                fontFamily: 'Arial', fontSize: '14px', color: '#F5C842',
            }).setOrigin(0.5);

            this._newAchs.forEach((ach, i) => {
                this.add.text(w / 2, achY + 24 + i * 20,
                    `${ach.icon}  ${ach.label} — ${ach.desc}`, {
                    fontFamily: 'Arial', fontSize: '12px', color: '#F5F0E8',
                }).setOrigin(0.5);
            });
        }

        // Buttons
        this._makeButton(w / 2 - 110, h * 0.9, 'Continue  ▶', 0xF5C842, () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => {
                this.scene.start('WorldMapScene', { zoneId: this._zoneId });
            });
        });

        this._makeButton(w / 2 + 110, h * 0.9, 'World Map', 0x8EC9A2, () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => {
                this.scene.start('WorldMapScene', { zoneId: this._zoneId });
            });
        }, true);
    }

    _drawDefeat(w, h) {
        this.add.text(w / 2, h * 0.15, 'Your spell was broken...', {
            fontFamily: '"Cinzel Decorative", Georgia',
            fontSize: '32px',
            color: '#E8845A',
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.28, 'Keep practicing — you will master it!', {
            fontFamily: 'Arial', fontSize: '16px', color: '#F5F0E8', alpha: 0.7, fontStyle: 'italic',
        }).setOrigin(0.5);

        this._makeButton(w / 2 - 100, h * 0.6, 'Try Again', 0xE8845A, () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => {
                this.scene.start('BattleScene', { zoneId: this._zoneId, levelId: this._levelId });
            });
        });

        this._makeButton(w / 2 + 100, h * 0.6, 'World Map', 0x8EC9A2, () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => {
                this.scene.start('WorldMapScene', { zoneId: this._zoneId });
            });
        }, true);
    }

    _drawXPBar(w, y) {
        const xpInfo = ProgressSystem.xpToNextLevel(this._totalXP);
        const barW = w * 0.5;
        const bx   = w / 2 - barW / 2;

        const bg = this.add.graphics();
        bg.fillStyle(0x1a0a30, 1);
        bg.fillRoundedRect(bx, y, barW, 16, 4);

        const bar = this.add.graphics();
        bar.fillStyle(0xF5C842, 1);
        bar.fillRoundedRect(bx, y, 0, 16, 4);
        this.tweens.add({ targets: { pct: 0 }, pct: xpInfo.pct, duration: 800, ease: 'Quad.Out',
            onUpdate: (tween, target) => {
                bar.clear();
                bar.fillStyle(0xF5C842, 1);
                bar.fillRoundedRect(bx, y, barW * target.pct, 16, 4);
            },
        });

        this.add.text(w / 2, y + 26, `Level ${this._level}  ·  ${xpInfo.current} / ${xpInfo.needed} XP`, {
            fontFamily: 'Arial', fontSize: '12px', color: '#8EC9A2',
        }).setOrigin(0.5);
    }

    _makeButton(x, y, label, color, onClick, outline = false) {
        const txt = this.add.text(x, y, label, {
            fontFamily: '"Cinzel", Arial',
            fontSize: '15px',
            color: outline ? Phaser.Display.Color.IntegerToColor(color).rgba : '#0d0a1e',
            backgroundColor: outline ? 'transparent' : `#${color.toString(16).padStart(6, '0')}`,
            padding: { x: 22, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        txt.on('pointerover', () => txt.setScale(1.01));
        txt.on('pointerout',  () => txt.setScale(1));
        txt.on('pointerdown', onClick);
    }
}
