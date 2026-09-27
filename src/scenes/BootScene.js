import SaveSystem from '../systems/SaveSystem.js';


export default class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        const { width, height } = this.scale;

        // Loading indicator
        const loadingText = this.add.text(width / 2, height / 2 - 40, 'Preparing spells...', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#8EC9A2',
            alpha: 0.7,
        }).setOrigin(0.5);

        // Progress text
        const progressText = this.add.text(width / 2, height / 2 + 20, '', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#F5C842',
            alpha: 0.5,
        }).setOrigin(0.5);

        // Update progress as files load
        this.load.on('progress', (value) => {
            progressText.setText(`${Math.round(value * 100)}%`);
        });

        // ── UI Assets ──
        this.load.image('title-bg', 'assets/ui/title-bg.jpg');
        this.load.image('logo', 'assets/ui/logo.png');

        // ── Zone Backgrounds ──
        this.load.image('bg-meadow', 'assets/backgrounds/meadow.jpg');
        this.load.image('bg-forest', 'assets/backgrounds/woods.jpg');
        this.load.image('bg-cave', 'assets/backgrounds/caves.jpg');
        this.load.image('bg-tower', 'assets/backgrounds/tower.jpg');
        this.load.image('bg-ice', 'assets/backgrounds/frozen.jpg');
        this.load.image('bg-volcano', 'assets/backgrounds/dragons-lair.jpg');

        // ── Wizard Characters ──
        for (let i = 0; i < 6; i++) {
            this.load.image(`wizard-${i}`, `assets/characters/wizard-${i}.png`);
        }

        // ── Enemy Sprites ──
        this.load.image('enemy-slime', 'assets/enemies/slime.png');
        this.load.image('enemy-goblin', 'assets/enemies/goblin.png');
        this.load.image('enemy-troll', 'assets/enemies/cave-troll.png');
        this.load.image('enemy-gargoyle', 'assets/enemies/gargoyle.png');
        this.load.image('enemy-wraith', 'assets/enemies/ice-wraith.png');
        this.load.image('enemy-dragon', 'assets/enemies/dragon.png');

        // ── Tile Assets (Letter Slots) ──
        this.load.image('tile-empty', 'assets/tiles/blank/tile-empty@2x.png');

        // Letter tiles: key = tile-{state}-{LETTER}, file = tile_{state}_{LETTER}.png
        const tileStates = ['active', 'bonus', 'complete', 'correct', 'hint', 'misplaced', 'wrong'];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        tileStates.forEach(state => {
            letters.forEach(letter => {
                this.load.image(
                    `tile-${state}-${letter}`,
                    `assets/tiles/${state}/tile_${state}_${letter}.png`
                );
            });
        });

        // ── Panel Assets ──
        this.load.image('panel-game-board', 'assets/panels/panel-game-board.png');
        this.load.image('panel-stats-sidebar', 'assets/panels/panel-stats-sidebar.png');
        this.load.image('bar-progress-frame', 'assets/panels/bar-progress-frame.png');
        this.load.image('button-hint', 'assets/panels/button-hint.png');
        this.load.image('frame-arch', 'assets/panels/frame-arch.png');
        this.load.image('speech-bubble', 'assets/panels/speech-bubble.png');

        // Cleanup loading text after preload completes
        this.load.on('complete', () => {
            loadingText.destroy();
            progressText.destroy();
        });
    }

    create() {
        const { width, height } = this.scale;

        const title = this.add.text(width / 2, height / 2, 'SPELLBINDER', {
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            color: '#F5C842',
            alpha: 0,
        }).setOrigin(0.5);

        this.tweens.add({ targets: title, alpha: 1, duration: 400, ease: 'Quad.In' });

        // Load local save
        const profile = SaveSystem.load();
        SaveSystem.updateStreak();
        this.registry.set('saveSystem', SaveSystem);
        if (profile) {
            this.registry.set('profile', profile);
            this.registry.set('progress', SaveSystem.getProgress());
        }
            this.time.delayedCall(700, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('TitleScene');
            });
        });
    }
}
