import SaveSystem from '../systems/SaveSystem.js';

const C = {
    yellow:  '#F5C842',
    mint:    '#8EC9A2',
    cloud:   '#F5F0E8',
    coral:   '#E8845A',
    deep:    '#0d0a1e',
};

export default class TitleScene extends Phaser.Scene {
    constructor() { super('TitleScene'); }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.fadeIn(600);

        // ── Background gradient & stars ──────────────────────────────────
        this._drawBackground(width, height);
        this._spawnMotes(width, height);

        // ── Wizard silhouette ─────────────────────────────────────────────
        this._drawWizard(width * 0.5, height * 0.55);

        // ── Title text ────────────────────────────────────────────────────
        this.add.text(width / 2, height * 0.14, 'TimeForSpelling.com Presents', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#7755bb',
            letterSpacing: 8,
        }).setOrigin(0.5);

        this.add.image(width / 2, height * 0.25, 'logo').setOrigin(0.5).setDisplaySize(700, 175);

        this.add.text(width / 2, height * 0.34, 'Where every word is a spell', {
            fontFamily: 'Arial',
            fontSize: '15px',
            fontStyle: 'italic',
            color: C.mint,
        }).setOrigin(0.5);

        // ── Engagement strip (streak / daily gate / tokens) ───────────────
        this._drawEngagementStrip(width, height);

        // ── Buttons ───────────────────────────────────────────────────────
        const hasProfile = SaveSystem.hasProfile();
        const btnY = height * 0.70;

        if (hasProfile) {
            const profile = SaveSystem.get('profile');
            this.add.text(width / 2, btnY - 30, `Welcome back, ${profile.name}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: C.cloud,
                alpha: 0.7,
            }).setOrigin(0.5);
            this._makeButton(width / 2, btnY + 10, '✦  CONTINUE QUEST  ✦', 0xF5C842, () => this._startGame());
        } else {
            this._makeButton(width / 2, btnY, '✦  BEGIN ADVENTURE  ✦', 0xF5C842, () => this.scene.start('CharCreateScene'));
        }

        this._makeButton(width / 2, btnY + 64,  'PLAYER PROFILE',            0x8EC9A2, () => this.scene.start('ProfileScene'),     true);
        this._makeButton(width / 2, btnY + 110, 'LEADERBOARD',                0x8EC9A2, () => this.scene.start('LeaderboardScene'), true);
        this._makeButton(width / 2, btnY + 156, 'PARENT / TEACHER DASHBOARD', 0x8EC9A2, () => this._openDashboard(),                true);

        // ── Version tag ───────────────────────────────────────────────────
        this.add.text(width / 2, height - 18, '✦ APPRENTICE  ·  AGES 5–18  ✦', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#F5C842',
            alpha: 0.45,
            letterSpacing: 4,
        }).setOrigin(0.5);

        // ── Top Right Auth UI ─────────────────────────────────────────────
        this._buildAuthUI(width, height);
    }

    update() {
        if (this._motes) {
            this._motes.forEach(m => {
                m.gfx.x += m.vx;
                m.gfx.y += m.vy;
                m.t += 0.022;
                const a = m.baseAlpha * (0.6 + 0.4 * Math.sin(m.t));
                m.gfx.setAlpha(a);
                const { width, height } = this.scale;
                if (m.gfx.y < -6) { m.gfx.y = height + 6; m.gfx.x = Math.random() * width; }
                if (m.gfx.x < -6) m.gfx.x = width + 6;
                if (m.gfx.x > width + 6) m.gfx.x = -6;
            });
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────

    _buildAuthUI(w, h) {
        // AWS Amplify Auth Placeholder
        // This will be re-enabled once the Amplify sandbox is configured.
        
        const container = this.add.container(0, 0).setDepth(10);
        
        const label = this.add.text(w - 16, 14, 'Offline Mode', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#8EC9A2',
            alpha: 0.7,
        }).setOrigin(1, 0);

        container.add(label);
    }

    _drawEngagementStrip(w, h) {
        const streak = SaveSystem.getStreak();
        const tokens = SaveSystem.getTokens();
        const daily  = SaveSystem.getDailyProgress();

        const stripY   = h * 0.41;
        const stripW   = 480;
        const stripH   = 40;
        const stripX   = w / 2 - stripW / 2;

        const strip = this.add.graphics();
        strip.fillStyle(0x0d0a1e, 0.72);
        strip.fillRoundedRect(stripX, stripY - stripH / 2, stripW, stripH, 10);
        strip.lineStyle(1, 0xF5C842, 0.18);
        strip.strokeRoundedRect(stripX, stripY - stripH / 2, stripW, stripH, 10);

        // Streak
        const streakLabel = streak > 0 ? `🔥 ${streak} day streak` : '🔥 Start a streak!';
        this.add.text(stripX + 16, stripY, streakLabel, {
            fontFamily: 'Arial', fontSize: '12px',
            color: streak > 0 ? C.yellow : '#555577',
        }).setOrigin(0, 0.5);

        // Daily Spell Gate bar (center)
        const barX = w / 2 - 55;
        const barW = 110;
        const barH = 10;
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1040, 1);
        barBg.fillRoundedRect(barX, stripY - barH / 2, barW, barH, 3);

        const barFill = this.add.graphics();
        barFill.fillStyle(daily.met ? 0x8EC9A2 : 0xF5C842, 1);
        if (daily.pct > 0) {
            barFill.fillRoundedRect(barX, stripY - barH / 2, barW * daily.pct, barH, 3);
        }

        const gateLabel = daily.met
            ? 'Daily Goal ✓'
            : `${Math.floor(daily.minutes)}/${daily.target} min`;
        this.add.text(w / 2, stripY + 9, gateLabel, {
            fontFamily: 'Arial', fontSize: '10px',
            color: daily.met ? C.mint : C.mint,
        }).setOrigin(0.5, 0);

        // Tokens
        this.add.text(stripX + stripW - 16, stripY, `💎 ${tokens}`, {
            fontFamily: '"Cinzel", Arial', fontSize: '12px', color: C.mint,
        }).setOrigin(1, 0.5);
    }

    _drawBackground(w, h) {
        this.add.image(w / 2, h / 2, 'title-bg').setDisplaySize(w, h);
    }

    _spawnMotes(w, h) {
        this._motes = Array.from({ length: 60 }, () => {
            const amber = Math.random() < 0.6;
            const gfx = this.add.graphics();
            const r = Math.random() * 2 + 0.5;
            gfx.fillStyle(amber ? 0xFFC04B : 0x9BD7AF, 1);
            gfx.fillCircle(0, 0, r);
            gfx.x = Math.random() * w;
            gfx.y = Math.random() * h;
            return {
                gfx,
                vx: (Math.random() - 0.5) * 0.18,
                vy: -(Math.random() * 0.35 + 0.12),
                baseAlpha: Math.random() * 0.3 + 0.08,
                t: Math.random() * Math.PI * 2,
            };
        });
    }

    _drawWizard(x, y) {
        this.add.image(x, y, 'wizard-0').setOrigin(0.5).setScale(0.55);
    }

    _makeButton(x, y, label, color, onClick, small = false) {
        const fontSize = small ? '13px' : '20px';
        const padX = small ? 20 : 32;
        const padY = small ? 8 : 14;

        // Measure text at local origin so padding math is clean
        const probe = this.add.text(0, 0, label, {
            fontFamily: '"Cinzel", Arial, sans-serif',
            fontSize,
            color: small ? C.mint : C.deep,
            letterSpacing: 2,
        }).setOrigin(0.5);
        const bw = probe.width + padX * 2;
        const bh = probe.height + padY * 2;
        probe.destroy();

        // Container at button centre — both children use local coords
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        if (small) {
            bg.lineStyle(1, color, 0.5);
            bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
        } else {
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
        }

        const txt = this.add.text(0, 0, label, {
            fontFamily: '"Cinzel", Arial, sans-serif',
            fontSize,
            color: small ? C.mint : C.deep,
            letterSpacing: 2,
        }).setOrigin(0.5);

        container.add([bg, txt]);

        // Zone stays in world space; 1.5% scale difference is imperceptible for hit area
        const zone = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
            this.tweens.add({ targets: container, scaleX: 1.015, scaleY: 1.015, duration: 100 });
        });
        zone.on('pointerout', () => {
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
        });
        zone.on('pointerdown', () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, onClick);
        });
    }

    _startGame() {
        const progress = SaveSystem.getProgress();
        const lastZone = Math.max(...(progress.zonesUnlocked || [0]));
        this.scene.start('WorldMapScene', { zoneId: lastZone });
    }

    _openDashboard() {
        import('../scenes/DashboardScene.js').then(m => m.default.open());
    }
}