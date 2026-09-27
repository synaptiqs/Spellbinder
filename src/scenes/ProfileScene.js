import SaveSystem      from '../systems/SaveSystem.js';
import ProgressSystem  from '../systems/ProgressSystem.js';

const AVATAR_ROBE_COLORS = [0x3a5fc8, 0x7b2d8a, 0x8a2d2d, 0x2d8a3e, 0x8a7a2d, 0x2d6a8a];
const AVATAR_HAT_COLORS  = [0x1e2d8a, 0x4a1a5a, 0x5a1a1a, 0x1a5a28, 0x5a4e1a, 0x1a3e5a];

export default class ProfileScene extends Phaser.Scene {
    constructor() { super('ProfileScene'); }

    create() {
        const { width: w, height: h } = this.scale;
        this.cameras.main.fadeIn(500);

        // Background
        this.add.image(w / 2, h / 2, 'title-bg').setDisplaySize(w, h);

        const profile  = SaveSystem.get('profile');
        const progress = SaveSystem.getProgress();

        if (!profile) {
            this.add.text(w / 2, h / 2, 'No profile found.\nStart a new game first!', {
                fontFamily: 'Arial', fontSize: '18px', color: '#F5F0E8', align: 'center',
            }).setOrigin(0.5);
            this._backBtn(w, h);
            return;
        }

        // ── Avatar ──────────────────────────────────────────────────────
        const avId = profile.avatarId ?? 0;
        this._drawAvatar(w * 0.15, h * 0.25, avId);

        // ── Name & Level ─────────────────────────────────────────────────
        this.add.text(w * 0.3, h * 0.1, profile.name, {
            fontFamily: '"Cinzel Decorative", Georgia',
            fontSize: '28px',
            color: '#F5C842',
            shadow: { x: 0, y: 0, color: '#FFD700', blur: 7, fill: true },
        });

        const gradeLabel = progress.grade ?? profile.grade;
        this.add.text(w * 0.3, h * 0.18, `Level ${progress.level}  ·  Grade ${gradeLabel}`, {
            fontFamily: '"Cinzel", Arial', fontSize: '14px', color: '#8EC9A2',
        });

        // ── XP Bar ───────────────────────────────────────────────────────
        const xpInfo = ProgressSystem.xpToNextLevel(progress.xp || 0);
        const barW = w * 0.55;
        const barX = w * 0.3;
        const barY = h * 0.24;

        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a0a30, 1);
        barBg.fillRoundedRect(barX, barY, barW, 18, 5);

        const barFill = this.add.graphics();
        barFill.fillStyle(0xF5C842, 1);
        barFill.fillRoundedRect(barX, barY, barW * xpInfo.pct, 18, 5);

        this.add.text(barX, barY + 24, `${xpInfo.current} / ${xpInfo.needed} XP to Level ${progress.level + 1}`, {
            fontFamily: 'Arial', fontSize: '11px', color: '#8EC9A2',
        });

        // ── Stats grid ───────────────────────────────────────────────────
        const stats = [
            { label: 'Words Mastered',  value: (progress.wordsmastered?.length || 0).toString() },
            { label: 'Battles Won',     value: (progress.battlesWon || 0).toString() },
            { label: 'Total XP',        value: (progress.xp || 0).toLocaleString() },
            { label: 'Play Time',       value: this._fmtTime(progress.totalPlayTime || 0) },
        ];

        stats.forEach((s, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx  = w * (0.28 + col * 0.28);
            const sy  = h * (0.33 + row * 0.1);

            const statBg = this.add.graphics();
            statBg.fillStyle(0x1a0a30, 0.8);
            statBg.fillRoundedRect(sx - 10, sy - 6, 200, 54, 8);
            statBg.lineStyle(1, 0xF5C842, 0.2);
            statBg.strokeRoundedRect(sx - 10, sy - 6, 200, 54, 8);

            this.add.text(sx, sy, s.value, {
                fontFamily: '"Cinzel", Arial', fontSize: '22px', color: '#F5C842',
            });
            this.add.text(sx, sy + 26, s.label, {
                fontFamily: 'Arial', fontSize: '11px', color: '#8EC9A2',
            });
        });

        // ── Achievements ─────────────────────────────────────────────────
        this.add.text(w / 2, h * 0.58, '─── Achievements ───', {
            fontFamily: '"Cinzel", Arial', fontSize: '13px', color: '#F5C842', letterSpacing: 4,
        }).setOrigin(0.5);

        const allAchs = ProgressSystem.allAchievements();
        const earnedIds = SaveSystem.get('achievements') || [];
        const cols = 7;
        const achSpacing = Math.min(80, (w - 80) / cols);
        const startX = w / 2 - (achSpacing * (cols - 1)) / 2;

        allAchs.forEach((ach, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const ax  = startX + col * achSpacing;
            const ay  = h * 0.64 + row * 70;
            const earned = earnedIds.includes(ach.id);

            const dotG = this.add.graphics();
            dotG.fillStyle(earned ? 0xF5C842 : 0x2a1a40, 1);
            dotG.fillCircle(ax, ay, 22);
            dotG.lineStyle(1, earned ? 0xFFD700 : 0x444466, 1);
            dotG.strokeCircle(ax, ay, 22);

            this.add.text(ax, ay, ach.icon, {
                fontSize: '18px', alpha: earned ? 1 : 0.2,
            }).setOrigin(0.5);

            if (earned) {
                dotG.setInteractive(new Phaser.Geom.Circle(ax, ay, 22), Phaser.Geom.Circle.Contains);
                dotG.on('pointerover', () => this._showAchTooltip(ax, ay - 36, ach));
                dotG.on('pointerout',  () => { if (this._achTooltip) { this._achTooltip.destroy(); this._achTooltip = null; } });
            }
        });

        this._backBtn(w, h);
    }

    _drawAvatar(x, y, avId) {
        this.add.image(x, y, `wizard-${avId}`).setOrigin(0.5).setScale(0.65);
    }

    _showAchTooltip(x, y, ach) {
        if (this._achTooltip) this._achTooltip.destroy();
        this._achTooltip = this.add.text(x, y, `${ach.label}\n${ach.desc}`, {
            fontFamily: 'Arial', fontSize: '11px', color: '#F5F0E8',
            backgroundColor: '#0d0a1ecc',
            padding: { x: 8, y: 5 },
            align: 'center',
        }).setOrigin(0.5).setDepth(10);
    }

    _fmtTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    _backBtn(w, h) {
        const back = this.add.text(w / 2, h - 24, '← Back to Title', {
            fontFamily: '"Cinzel", Arial', fontSize: '13px', color: '#8EC9A2',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        back.on('pointerover', () => back.setAlpha(0.8));
        back.on('pointerout',  () => back.setAlpha(1));
        back.on('pointerdown', () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => this.scene.start('TitleScene'));
        });
    }
}
