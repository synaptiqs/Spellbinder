import SaveSystem from '../systems/SaveSystem.js';

const AVATARS = [
    { id: 0, label: 'Boy Mage' },
    { id: 1, label: 'Girl Mage' },
];

export default class CharCreateScene extends Phaser.Scene {
    constructor() { super('CharCreateScene'); }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.fadeIn(500);
        this._selectedAvatar = 0;
        this._selectedGrade = 3;

        // Background
        this.add.image(width / 2, height / 2, 'title-bg').setDisplaySize(width, height);

        // Title
        this.add.text(width / 2, 40, '✦  CREATE YOUR MAGE  ✦', {
            fontFamily: '"Cinzel", Arial',
            fontSize: '22px',
            color: '#F1B440',
        }).setOrigin(0.5);

        // Avatar preview
        this._drawAvatarPreview(width / 2, height * 0.38);

        // Avatar selection row
        this._avatarPositions = [];
        this._avatarButtons = AVATARS.map((av, i) => {
            const cols = 2;
            const spacing = Math.min(90, (width - 80) / cols);
            const startX = width / 2 - (spacing * (cols - 1)) / 2;
            const bx = startX + i * spacing;
            const by = height * 0.6;
            this._avatarPositions.push({ bx, by });

            const ring = this.add.graphics();

            const img = this.add.image(bx, by, `wizard-${i}`)
                .setOrigin(0.5)
                .setDisplaySize(56, 72)
                .setInteractive({ useHandCursor: true });
            img.on('pointerdown', () => this._selectAvatar(i));
            img.on('pointerover', () => { if (i !== this._selectedAvatar) img.setAlpha(0.7); });
            img.on('pointerout',  () => { if (i !== this._selectedAvatar) img.setAlpha(0.4); });

            this.add.text(bx, by + 44, av.label.split(' ')[0], {
                fontFamily: 'Arial', fontSize: '10px', color: '#F5F4EE', alpha: 0.6,
            }).setOrigin(0.5);

            return { img, ring };
        });
        this._updateAvatarSelection();

        // Name input (DOM)
        this._nameInput = this._createInput(width / 2, height * 0.72, 'Enter your name', 240);

        // Grade selector
        this.add.text(width / 2, height * 0.82, 'Starting Grade', {
            fontFamily: 'Arial', fontSize: '13px', color: '#8EC9A2',
        }).setOrigin(0.5);

        this._gradeText = this.add.text(width / 2, height * 0.87, `Grade ${this._selectedGrade}`, {
            fontFamily: '"Cinzel", Arial', fontSize: '18px', color: '#F1B440',
        }).setOrigin(0.5);

        const arrowStyle = { fontFamily: 'Arial', fontSize: '24px', color: '#F1B440' };
        const lArrow = this.add.text(width / 2 - 70, height * 0.87, '◀', arrowStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const rArrow = this.add.text(width / 2 + 70, height * 0.87, '▶', arrowStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
        lArrow.on('pointerdown', () => this._changeGrade(-1));
        rArrow.on('pointerdown', () => this._changeGrade(1));

        // Begin button
        const beginTxt = this.add.text(width / 2, height * 0.94, '✦  BEGIN QUEST  ✦', {
            fontFamily: '"Cinzel", Arial',
            fontSize: '18px',
            color: '#130A32',
            backgroundColor: '#F1B440',
            padding: { x: 28, y: 12 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        beginTxt.on('pointerover', () => beginTxt.setScale(1.01));
        beginTxt.on('pointerout',  () => beginTxt.setScale(1));
        beginTxt.on('pointerdown', () => this._confirm());

        // Back
        this.add.text(20, 20, '← Back', {
            fontFamily: 'Arial', fontSize: '13px', color: '#8EC9A2',
        }).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => { this._cleanup(); this.scene.start('TitleScene'); });
    }

    shutdown() { this._cleanup(); }

    _cleanup() {
        if (this._inputEl) {
            this._inputEl.remove();
            this._inputEl = null;
        }
    }

    _selectAvatar(id) {
        this._selectedAvatar = id;
        this._updateAvatarSelection();
        this._drawAvatarPreview(this.scale.width / 2, this.scale.height * 0.38);
    }

    _updateAvatarSelection() {
        this._avatarButtons.forEach(({ img, ring }, i) => {
            const { bx, by } = this._avatarPositions[i];
            ring.clear();
            if (i === this._selectedAvatar) {
                img.setAlpha(1);
                ring.lineStyle(3, 0xFFD700, 1);
                ring.strokeRoundedRect(bx - 32, by - 40, 64, 80, 8);
            } else {
                img.setAlpha(0.4);
            }
        });
    }

    _drawAvatarPreview(x, y) {
        if (this._previewImg) this._previewImg.destroy();
        this._previewImg = this.add.image(x, y - 10, `wizard-${this._selectedAvatar}`).setOrigin(0.5).setScale(0.7);
    }

    _changeGrade(delta) {
        this._selectedGrade = Math.max(0, Math.min(12, this._selectedGrade + delta));
        const label = this._selectedGrade === 0 ? 'Kindergarten' : `Grade ${this._selectedGrade}`;
        this._gradeText.setText(label);
    }

    _createInput(x, y, placeholder, w) {
        this.add.text(x, y - 22, 'Your Name', {
            fontFamily: 'Arial', fontSize: '12px', color: '#8EC9A2',
        }).setOrigin(0.5);

        const { screenX, screenY, scaleX } = this._gameToScreen(x, y);
        const screenW = w * scaleX;

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 20;
        input.placeholder = placeholder;
        input.style.cssText = `
            position:fixed;
            left:${screenX}px;transform:translateX(-50%);
            top:${screenY - 18}px;
            width:${Math.max(180, screenW)}px;
            padding:10px 14px;
            font-size:${Math.round(16 * scaleX)}px;
            font-family:Arial,sans-serif;
            background:rgba(20,10,45,0.9);
            border:1px solid rgba(241,180,64,0.5);
            border-radius:6px;
            color:#F5F4EE;
            outline:none;
            text-align:center;
            letter-spacing:2px;
            z-index:10;
        `;
        document.getElementById('overlay-root').appendChild(input);
        input.focus();
        this._inputEl = input;
        return input;
    }

    _gameToScreen(gx, gy) {
        const canvas = this.game.canvas;
        const rect   = canvas.getBoundingClientRect();
        const scaleX = rect.width  / this.scale.width;
        const scaleY = rect.height / this.scale.height;
        return {
            screenX: rect.left + gx * scaleX,
            screenY: rect.top  + gy * scaleY,
            scaleX, scaleY,
        };
    }

    _confirm() {
        const name = (this._inputEl?.value || '').trim() || 'Mage';
        SaveSystem.createProfile(name, this._selectedAvatar, this._selectedGrade);
        this.registry.set('profile', SaveSystem.get('profile'));
        this.registry.set('progress', SaveSystem.getProgress());
        this._cleanup();
        this.cameras.main.fadeOut(400);
        this.time.delayedCall(400, () => this.scene.start('WorldMapScene', { zoneId: 0 }));
    }
}
