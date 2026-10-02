import SaveSystem from '../systems/SaveSystem.js';
import WordSystem from '../systems/WordSystem.js';

const LEVELS_PER_ZONE = 5;
const WORDS_PER_BATTLE = 8;

export default class WorldMapScene extends Phaser.Scene {
    constructor() { super('WorldMapScene'); }

    init(data) {
        this._focusZone = data?.zoneId ?? 0;
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.fadeIn(500);

        this._drawBackground(width, height);
        this._drawZonePath(width, height);
        this._drawAllZones(width, height);
        this._drawHUD(width, height);
    }

    // ── Background ────────────────────────────────────────────────────────
    _drawBackground(w, h) {
        this.add.image(w / 2, h / 2, 'title-bg').setDisplaySize(w, h);
    }

    // ── Zone / path layout ─────────────────────────────────────────────────
    _zonePositions(w, h) {
        // 6 zones arranged along a winding path
        return [
            { x: w * 0.15, y: h * 0.8  },   // 0 Meadow
            { x: w * 0.30, y: h * 0.6  },   // 1 Woods
            { x: w * 0.48, y: h * 0.72 },   // 2 Caves
            { x: w * 0.62, y: h * 0.52 },   // 3 Tower
            { x: w * 0.76, y: h * 0.65 },   // 4 Frozen
            { x: w * 0.88, y: h * 0.45 },   // 5 Dragon
        ];
    }

    _drawZonePath(w, h) {
        const positions = this._zonePositions(w, h);
        const g = this.add.graphics();
        g.lineStyle(3, 0xF1B440, 0.2);
        g.beginPath();
        g.moveTo(positions[0].x, positions[0].y);
        for (let i = 1; i < positions.length; i++) {
            g.lineTo(positions[i].x, positions[i].y);
        }
        g.strokePath();
    }

    _drawAllZones(w, h) {
        const positions = this._zonePositions(w, h);
        WordSystem.zones.forEach((zone, zi) => {
            const { x, y } = positions[zi];
            const unlocked = SaveSystem.isZoneUnlocked(zone.id);
            this._drawZoneNode(x, y, zone, unlocked, zi === this._focusZone);
        });
    }

    _drawZoneNode(x, y, zone, unlocked, focused) {
        const radius = focused ? 48 : 40;
        const g = this.add.graphics();

        if (unlocked) {
            // Glow ring
            g.lineStyle(focused ? 3 : 2, zone.color, focused ? 0.9 : 0.5);
            g.strokeCircle(x, y, radius);
            g.fillStyle(zone.color, 0.18);
            g.fillCircle(x, y, radius - 2);

            // Enemy icon
            this.add.image(x, y, 'enemy-' + zone.enemy).setOrigin(0.5).setScale(0.22);

            // Zone name
            this.add.text(x, y + radius + 14, zone.name, {
                fontFamily: '"Cinzel", Arial',
                fontSize: '11px',
                color: Phaser.Display.Color.IntegerToColor(zone.color).rgba,
            }).setOrigin(0.5);

            // Level dots
            for (let li = 0; li < LEVELS_PER_ZONE; li++) {
                const angle = ((li / LEVELS_PER_ZONE) * Math.PI * 2) - Math.PI / 2;
                const lx = x + Math.cos(angle) * (radius + 14);
                const ly = y + Math.sin(angle) * (radius + 14);
                const complete = SaveSystem.isLevelComplete(zone.id, li);
                const dotG = this.add.graphics();
                dotG.fillStyle(complete ? 0xF1B440 : 0x333355, 1);
                dotG.fillCircle(lx, ly, 5);
            }

            // Click handler
            const zone2 = this.add.zone(x, y, radius * 2, radius * 2).setInteractive({ useHandCursor: true });
            zone2.on('pointerdown', () => this._enterZone(zone));
            zone2.on('pointerover', () => {
                g.setAlpha(0.8);
                this._showZoneTooltip(x, y - radius - 36, zone);
            });
            zone2.on('pointerout', () => {
                g.setAlpha(1);
                if (this._tooltip) { this._tooltip.destroy(); this._tooltip = null; }
            });
        } else {
            // Locked
            g.fillStyle(0x111133, 0.6);
            g.fillCircle(x, y, radius);
            g.lineStyle(1, 0x444466, 0.4);
            g.strokeCircle(x, y, radius);
            this.add.text(x, y, '🔒', { fontSize: '22px' }).setOrigin(0.5);
            this.add.text(x, y + radius + 14, zone.name, {
                fontFamily: 'Arial', fontSize: '10px', color: '#444466',
            }).setOrigin(0.5);
        }
    }

_showZoneTooltip(x, y, zone) {
        if (this._tooltip) this._tooltip.destroy();
        this._tooltip = this.add.text(x, y, `${zone.name}\nGrades ${zone.gradeMin}–${zone.gradeMax}`, {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#F5F4EE',
            backgroundColor: '#130A32cc',
            padding: { x: 8, y: 6 },
            align: 'center',
        }).setOrigin(0.5);
    }

    _enterZone(zone) {
        // Show level select panel
        this._showLevelSelect(zone);
    }

    _showLevelSelect(zone) {
        // Remove previous panel
        if (this._levelPanel) this._levelPanel.forEach(o => o.destroy());
        this._levelPanel = [];

        const { width, height } = this.scale;
        const panelW = 300, panelH = 320;
        const px = width / 2 - panelW / 2;
        const py = height / 2 - panelH / 2;

        const bg = this.add.graphics();
        bg.fillStyle(0x130A32, 0.95);
        bg.fillRoundedRect(px, py, panelW, panelH, 12);
        bg.lineStyle(1, 0xF1B440, 0.4);
        bg.strokeRoundedRect(px, py, panelW, panelH, 12);
        this._levelPanel.push(bg);

        const title = this.add.text(width / 2, py + 24, zone.name, {
            fontFamily: '"Cinzel", Arial', fontSize: '16px', color: '#F1B440',
        }).setOrigin(0.5);
        this._levelPanel.push(title);

        const sub = this.add.text(width / 2, py + 46, `Grades ${zone.gradeMin}–${zone.gradeMax} · ${WORDS_PER_BATTLE} words per battle`, {
            fontFamily: 'Arial', fontSize: '11px', color: '#8EC9A2',
        }).setOrigin(0.5);
        this._levelPanel.push(sub);

        for (let li = 0; li < LEVELS_PER_ZONE; li++) {
            const complete = SaveSystem.isLevelComplete(zone.id, li);
            const lx = width / 2;
            const ly = py + 90 + li * 42;
            const labelTxt = `Level ${li + 1}  ${complete ? '✓' : ''}`;

            const btn = this.add.text(lx, ly, labelTxt, {
                fontFamily: '"Cinzel", Arial',
                fontSize: '14px',
                color: complete ? '#8EC9A2' : '#F5F4EE',
                backgroundColor: complete ? '#1a3a1a' : '#1a1040',
                padding: { x: 22, y: 9 },
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setScale(1.01));
            btn.on('pointerout',  () => btn.setScale(1));
            btn.on('pointerdown', () => {
                this._levelPanel.forEach(o => o.destroy());
                this._levelPanel = [];
                this.cameras.main.fadeOut(300);
                this.time.delayedCall(300, () => {
                    this.scene.start('BattleScene', {
                        zoneId: zone.id,
                        levelId: li,
                        wordCount: WORDS_PER_BATTLE,
                    });
                });
            });
            this._levelPanel.push(btn);
        }

        // Close button
        const close = this.add.text(px + panelW - 18, py + 12, '✕', {
            fontFamily: 'Arial', fontSize: '16px', color: '#888',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => {
            this._levelPanel.forEach(o => o.destroy());
            this._levelPanel = [];
        });
        this._levelPanel.push(close);
    }

    _drawHUD(w, h) {
        const progress = SaveSystem.getProgress();
        const profile  = SaveSystem.get('profile');

        // Top bar
        const bar = this.add.graphics();
        bar.fillStyle(0x130A32, 0.88);
        bar.fillRect(0, 0, w, 50);
        bar.lineStyle(1, 0xF1B440, 0.2);
        bar.lineBetween(0, 50, w, 50);

        this.add.text(20, 15, `${profile?.name || 'Mage'}  ·  Level ${progress?.level || 1}`, {
            fontFamily: '"Cinzel", Arial', fontSize: '14px', color: '#F1B440',
        });

        const streak = SaveSystem.getStreak();
        const tokens = SaveSystem.getTokens();
        const streakStr = streak > 0 ? `🔥 ${streak}  ` : '';
        this.add.text(w - 20, 14, `${streakStr}💎 ${tokens}  ·  ${progress?.wordsmastered?.length || 0} words`, {
            fontFamily: 'Arial', fontSize: '12px', color: '#8EC9A2',
        }).setOrigin(1, 0);

        // Back to title
        const backBtn = this.add.text(w / 2, h - 22, '← Title Screen', {
            fontFamily: 'Arial', fontSize: '12px', color: '#8EC9A2', alpha: 0.6,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => this.scene.start('TitleScene'));
        });
    }
}
