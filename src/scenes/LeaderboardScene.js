import SaveSystem from '../systems/SaveSystem.js';

const C = {
    yellow: '#F1B440',
    mint:   '#8EC9A2',
    cloud:  '#F5F4EE',
    coral:  '#E8845A',
    deep:   '#130A32',
    purple: '#7755bb',
};

const ROBE_COLORS = [0x3a5fc8, 0xb84060, 0x2e8b57, 0x8b4513, 0x6a0dad, 0x2e6b8a];

export default class LeaderboardScene extends Phaser.Scene {
    constructor() { super('LeaderboardScene'); }

    create() {
        const { width: w, height: h } = this.scale;
        this.cameras.main.fadeIn(400);

        this._drawBackground(w, h);

        // Title
        this.add.text(w / 2, h * 0.07, '✦  HALL OF MAGES  ✦', {
            fontFamily: '"Cinzel Decorative", Georgia, serif',
            fontSize: '32px',
            color: C.yellow,
            shadow: { x: 0, y: 0, color: C.yellow, blur: 10, fill: true },
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.14, 'Top spellcasters across the realm', {
            fontFamily: 'Arial',
            fontSize: '13px',
            fontStyle: 'italic',
            color: C.mint,
            alpha: 0.7,
        }).setOrigin(0.5);

        // Divider
        const div = this.add.graphics();
        div.lineStyle(1, 0xF1B440, 0.3);
        div.lineBetween(w * 0.1, h * 0.18, w * 0.9, h * 0.18);

        // Loading indicator
        this._loadingTxt = this.add.text(w / 2, h / 2, 'Consulting the arcane records…', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: C.mint,
            alpha: 0.6,
        }).setOrigin(0.5);

        // Back button
        this._makeButton(w / 2, h * 0.93, '← BACK', 0x8EC9A2, () => {
            this.cameras.main.fadeOut(300);
            this.time.delayedCall(300, () => this.scene.start('TitleScene'));
        });

        this._loadEntries(w, h);
    }

    async _loadEntries(w, h) {
        let entries = [];

        // AWS Amplify Data Hook (Placeholder)
        if (window.Amplify) {
            // entries = await client.models.Leaderboard.list({ limit: 20 });
            // console.debug("Amplify leaderboard sync pending...");
        }

        // Fallback: show local player if no cloud data
        if (entries.length === 0) {
            const profile  = SaveSystem.get('profile');
            const progress = SaveSystem.getProgress();
            if (profile) {
                entries = [{
                    uid:        SaveSystem.uid ?? 'local',
                    name:       profile.name,
                    avatarId:   profile.avatarId ?? 0,
                    xp:         progress.xp || 0,
                    level:      progress.level || 1,
                    wordsCount: (progress.wordsmastered || []).length,
                    battlesWon: progress.battlesWon || 0,
                }];
            }
        }

        this._loadingTxt.destroy();

        if (entries.length === 0) {
            this.add.text(w / 2, h / 2, 'No mages recorded yet.\nBe the first to complete a battle!', {
                fontFamily: 'Arial',
                fontSize: '15px',
                color: C.cloud,
                alpha: 0.5,
                align: 'center',
            }).setOrigin(0.5);
            return;
        }

        this._renderTable(entries, w, h);
    }

    _renderTable(entries, w, h) {
        // Replaced Firebase uid call with local fallback
        const localUid  = SaveSystem.uid ?? 'local'; 
        const startY    = h * 0.22;
        const rowH      = Math.min(44, (h * 0.65) / entries.length);
        const colRank   = w * 0.08;
        const colAvatar = w * 0.16;
        const colName   = w * 0.28;
        const colLevel  = w * 0.55;
        const colWords  = w * 0.70;
        const colXP     = w * 0.86;

        // Column headers
        const headerStyle = { fontFamily: '"Cinzel", Arial', fontSize: '11px', color: C.yellow, alpha: 0.6 };
        this.add.text(colRank,   startY - 16, '#',       headerStyle).setOrigin(0.5, 1);
        this.add.text(colName,   startY - 16, 'MAGE',    headerStyle).setOrigin(0, 1);
        this.add.text(colLevel,  startY - 16, 'LVL',     headerStyle).setOrigin(0.5, 1);
        this.add.text(colWords,  startY - 16, 'WORDS',   headerStyle).setOrigin(0.5, 1);
        this.add.text(colXP,     startY - 16, 'XP',      headerStyle).setOrigin(0.5, 1);

        entries.forEach((entry, i) => {
            const y        = startY + i * rowH + rowH / 2;
            const isLocal  = entry.uid === localUid;
            const isTop3   = i < 3;

            // Row background for current player or top-3
            if (isLocal || isTop3) {
                const rowBg = this.add.graphics();
                rowBg.fillStyle(isLocal ? 0xF1B440 : 0xffffff, isLocal ? 0.06 : 0.03);
                rowBg.fillRoundedRect(w * 0.05, y - rowH / 2 + 2, w * 0.9, rowH - 4, 4);
            }

            // Rank number / medal
            const rankLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
            this.add.text(colRank, y, rankLabel, {
                fontFamily: 'Arial',
                fontSize: isTop3 ? '16px' : '13px',
                color: isTop3 ? C.yellow : C.cloud,
                alpha: isTop3 ? 1 : 0.6,
            }).setOrigin(0.5, 0.5);

            // Mini avatar
            this._drawMiniAvatar(colAvatar, y, entry.avatarId ?? 0);

            // Name
            this.add.text(colName, y, entry.name ?? 'Mage', {
                fontFamily: '"Cinzel", Arial',
                fontSize: '13px',
                color: isLocal ? C.yellow : C.cloud,
                alpha: isLocal ? 1 : 0.85,
            }).setOrigin(0, 0.5);

            // Level
            this.add.text(colLevel, y, `${entry.level ?? 1}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: C.mint,
            }).setOrigin(0.5, 0.5);

            // Words mastered
            this.add.text(colWords, y, `${entry.wordsCount ?? 0}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: C.cloud,
                alpha: 0.7,
            }).setOrigin(0.5, 0.5);

            // XP
            this.add.text(colXP, y, `${(entry.xp ?? 0).toLocaleString()}`, {
                fontFamily: '"Cinzel", Arial',
                fontSize: '13px',
                color: C.yellow,
                alpha: 0.9,
            }).setOrigin(0.5, 0.5);
        });

        // Offline notice when Amplify not configured
        if (!window.Amplify) {
            this.add.text(w / 2, h * 0.86, 'Connect AWS Amplify to see the global leaderboard', {
                fontFamily: 'Arial',
                fontSize: '11px',
                color: C.mint,
                alpha: 0.4,
            }).setOrigin(0.5);
        }
    }

    _drawMiniAvatar(x, y, avatarId) {
        const g = this.add.graphics();
        const color = ROBE_COLORS[avatarId % ROBE_COLORS.length];
        // Hat
        g.fillStyle(0x1e2d8a, 1);
        g.fillTriangle(x - 5, y - 8, x + 1, y - 16, x + 6, y - 8);
        // Head
        g.fillStyle(0xFFD09B, 1);
        g.fillCircle(x + 1, y - 5, 5);
        // Body
        g.fillStyle(color, 1);
        g.fillTriangle(x - 6, y + 2, x + 8, y + 2, x + 9, y + 14);
        g.fillTriangle(x - 6, y + 2, x - 7, y + 14, x + 9, y + 14);
    }

    _drawBackground(w, h) {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x130A32, 0x130A32, 0x180a30, 0x0a0618, 1);
        bg.fillRect(0, 0, w, h);

        // Subtle corner decorations
        const dec = this.add.graphics();
        dec.lineStyle(1, 0xF1B440, 0.12);
        dec.strokeRect(20, 20, w - 40, h - 40);
    }

    _makeButton(x, y, label, color, onClick) {
        const probe = this.add.text(0, 0, label, {
            fontFamily: '"Cinzel", Arial',
            fontSize: '13px',
            color: C.mint,
            letterSpacing: 2,
        }).setOrigin(0.5);
        const bw = probe.width + 28;
        const bh = probe.height + 14;
        probe.destroy();

        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        bg.lineStyle(1, color, 0.5);
        bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);

        const txt = this.add.text(0, 0, label, {
            fontFamily: '"Cinzel", Arial',
            fontSize: '13px',
            color: C.mint,
            letterSpacing: 2,
        }).setOrigin(0.5);

        container.add([bg, txt]);

        const zone = this.add.zone(x, y, bw, bh).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => this.tweens.add({ targets: container, scaleX: 1.015, scaleY: 1.015, duration: 100 }));
        zone.on('pointerout',  () => this.tweens.add({ targets: container, scaleX: 1,     scaleY: 1,     duration: 100 }));
        zone.on('pointerdown', onClick);
    }
}