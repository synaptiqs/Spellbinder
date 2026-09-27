// [Spellbinder] Core Game Configuration
import BootScene        from './src/scenes/BootScene.js';
import TitleScene       from './src/scenes/TitleScene.js';
import CharCreateScene  from './src/scenes/CharCreateScene.js';
import WorldMapScene    from './src/scenes/WorldMapScene.js';
import BattleScene      from './src/scenes/BattleScene.js';
import ResultsScene     from './src/scenes/ResultsScene.js';
import ProfileScene     from './src/scenes/ProfileScene.js';
import LeaderboardScene from './src/scenes/LeaderboardScene.js';
import DashboardScene   from './src/scenes/DashboardScene.js'; // Added from your src folder

// Basic engine check
if (typeof Phaser === 'undefined') {
    console.error('[Spellbinder] Phaser failed to load from CDN');
    const container = document.getElementById('game-container');
    if (container) {
        container.innerHTML = '<p style="color:#F5F0E8;text-align:center;padding:2rem;font-family:Arial">Game engine failed to load. Please refresh the page.</p>';
    }
    throw new Error('Phaser not loaded');
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#0d0a1e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: {
        disableWebAudio: false,
    },
    // The order here determines the initial scene sequence
    scene: [
        BootScene,
        TitleScene,
        CharCreateScene,
        WorldMapScene,
        BattleScene,
        ResultsScene,
        ProfileScene,
        LeaderboardScene,
        DashboardScene // Included in the scene manager
    ],
};

// Initialize the game
window.game = new Phaser.Game(config);
console.log("Spellbinder: Phaser engine initialized."); 