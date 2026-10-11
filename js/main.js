// ==========================================
// Phaser 3 Match Scene
// ==========================================
class MatchScene extends Phaser.Scene {
    constructor() {
        super('MatchScene');
    }

    preload() {
        // Load basic assets (we'll use generated graphics for now)
    }

    create() {
        // Create a basic green pitch
        this.add.rectangle(400, 300, 800, 600, 0x2E8B57);

        // Pitch lines
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.8);

        // Center circle and line
        graphics.strokeCircle(400, 300, 70);
        graphics.beginPath();
        graphics.moveTo(400, 0);
        graphics.lineTo(400, 600);
        graphics.strokePath();

        // Penalty areas
        graphics.strokeRect(0, 150, 150, 300); // Left
        graphics.strokeRect(650, 150, 150, 300); // Right

        // Add dummy players
        this.createDummyTeam(200, 0x3498db); // Blue team
        this.createDummyTeam(600, 0xe74c3c); // Red team

        // Match UI Text
        this.add.text(400, 50, 'MATCH IN PROGRESS', {
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    createDummyTeam(baseX, color) {
        // Draw 3 dummy players for visualization
        const positions = [
            { x: baseX, y: 300 },
            { x: baseX + (baseX < 400 ? 50 : -50), y: 150 },
            { x: baseX + (baseX < 400 ? 50 : -50), y: 450 }
        ];

        positions.forEach(pos => {
            this.add.circle(pos.x, pos.y, 15, color);
            this.add.circle(pos.x, pos.y, 15, 0xffffff).setStrokeStyle(2, 0xffffff);
        });
    }

    update() {
        // Match logic / animation update loop will go here
    }
}

// ==========================================
// Game Configuration
// ==========================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game', // Attach to the div id
    scene: [MatchScene],
    transparent: true // Let HTML background show through if needed
};

// Initialize Phaser game (but don't start the match immediately)
let game;

// ==========================================
// HTML UI Interactions
// ==========================================
function startGame() {
    // Hide Management UI
    document.getElementById('ui-content').style.display = 'none';

    // Start Phaser Game
    if (!game) {
        game = new Phaser.Game(config);
    } else {
        // If already initialized, restart scene
        game.scene.start('MatchScene');
    }
}
