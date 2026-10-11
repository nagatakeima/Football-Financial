// ==========================================
// Phaser 3 Match Engine Integration
// ==========================================

class MatchScene extends Phaser.Scene {
    constructor() {
        super('MatchScene');
    }

    create() {
        // Setup initial Match State from GameState
        this.playerTeamData = window.gameState.playerTeam;
        window.ChemistrySystem.calculateTeamChemistry(this.playerTeamData);
        this.opponentTeamData = managementUI.getNextOpponent();
        if(this.opponentTeamData) window.ChemistrySystem.calculateTeamChemistry(this.opponentTeamData);

        // Safety check if no opponent
        if (!this.opponentTeamData) {
            this.endMatch(0, 0);
            return;
        }

        // Draw Pitch
        this.drawPitch();

        // Game Variables
        this.matchTime = 0; // 0 to 90 (minutes equivalent)
        this.timeScale = 1; // 1x, 2x, etc.
        this.isSkip = false;

        this.score = { player: 0, opponent: 0 };
        this.ball = { x: 400, y: 300, owner: null }; // owner is a sprite or null

        // Sprites / Teams
        this.playerSprites = [];
        this.opponentSprites = [];

        this.spawnTeams();

        // UI Layer in Phaser
        this.createMatchUI();

        // Physics/Update timer (Run every 100ms logically)
        this.logicTimer = this.time.addEvent({
            delay: 100,
            callback: this.tickMatch,
            callbackScope: this,
            loop: true
        });
    }

    drawPitch() {
        this.add.rectangle(400, 300, 800, 600, 0x2E8B57);
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff, 0.8);
        graphics.strokeCircle(400, 300, 70);
        graphics.beginPath();
        graphics.moveTo(400, 0);
        graphics.lineTo(400, 600);
        graphics.strokePath();
        graphics.strokeRect(0, 150, 150, 300); // Left Penalty
        graphics.strokeRect(650, 150, 150, 300); // Right Penalty
    }

    spawnTeams() {
        // Very basic positional mapping logic based on standard formations
        // For MVP, randomly scatter players in their half

        this.playerTeamData.starting11.forEach((player, i) => {
            const x = Phaser.Math.Between(50, 350);
            const y = Phaser.Math.Between(50, 550);
            let sprite = this.add.circle(x, y, 10, 0x3498db);
            sprite.setStrokeStyle(2, 0xffffff);
            sprite.playerData = player;
            sprite.isPlayerTeam = true;
            this.playerSprites.push(sprite);

            // Number label
            this.add.text(x, y, i+1, { fontSize: '10px', color: '#fff' }).setOrigin(0.5);
        });

        this.opponentTeamData.starting11.forEach((player, i) => {
            const x = Phaser.Math.Between(450, 750);
            const y = Phaser.Math.Between(50, 550);
            let sprite = this.add.circle(x, y, 10, 0xe74c3c);
            sprite.setStrokeStyle(2, 0xffffff);
            sprite.playerData = player;
            sprite.isPlayerTeam = false;
            this.opponentSprites.push(sprite);
        });

        // Ball Sprite
        this.ballSprite = this.add.circle(400, 300, 6, 0xffffff);
    }

    createMatchUI() {
        // Top HUD
        this.hudBg = this.add.rectangle(400, 25, 800, 50, 0x000000, 0.7);

        this.scoreText = this.add.text(400, 25, `${this.playerTeamData.name} 0 - 0 ${this.opponentTeamData.name}`, {
            fontSize: '24px', fontStyle: 'bold', fill: '#fff'
        }).setOrigin(0.5);

        this.timeText = this.add.text(400, 50, '00:00', {
            fontSize: '18px', fill: '#f1c40f'
        }).setOrigin(0.5);

        // Speed Controls
        const speed1x = this.add.text(700, 25, '1x', { fontSize: '20px', fill: '#fff', backgroundColor: '#333' }).setOrigin(0.5).setInteractive();
        const speed2x = this.add.text(740, 25, '2x', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const speedSkip = this.add.text(780, 25, '⏭', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5).setInteractive();

        speed1x.on('pointerdown', () => this.setSpeed(1, [speed1x, speed2x]));
        speed2x.on('pointerdown', () => this.setSpeed(2, [speed1x, speed2x]));
        speedSkip.on('pointerdown', () => { this.isSkip = true; this.tickMatch(); }); // Force skip

        this.speedButtons = [speed1x, speed2x];
        this.setSpeed(1, this.speedButtons);

        // Micro Command Slots (Bottom)
        this.createCommandUI();
    }

    setSpeed(scale, buttons) {
        this.timeScale = scale;
        this.logicTimer.timeScale = scale;

        buttons.forEach(b => b.setBackgroundColor('transparent'));
        if (scale === 1) buttons[0].setBackgroundColor('#333');
        if (scale === 2) buttons[1].setBackgroundColor('#333');
    }

    createCommandUI() {
        const cmdY = 550;
        const spacing = 180;
        const startX = 400 - (spacing * 1.5);

        this.commandSlots = [];

        this.playerTeamData.microCommands.forEach((cmdId, i) => {
            const cmdData = Object.assign({}, window.MasterData.MicroCommands.find(c => c.id === cmdId));
            if (!cmdData) return;

            // Apply Manager/Relic CD reduction
            let cdReduction = 0;
            this.playerTeamData.relics.forEach(relicId => {
                const r = window.MasterData.Relics.find(r => r.id === relicId);
                if (r && r.effectType === "CD_REDUCTION") cdReduction += r.value;
            });
            cmdData.cooldown = cmdData.cooldown * (1 - cdReduction);
            if (!cmdData) return;

            const bg = this.add.rectangle(startX + (i * spacing), cmdY, 160, 50, 0x2c3e50).setInteractive();
            bg.setStrokeStyle(2, 0x34495e);

            const text = this.add.text(startX + (i * spacing), cmdY, cmdData.name, {
                fontSize: '12px', fill: '#fff', align: 'center', wordWrap: { width: 150 }
            }).setOrigin(0.5);

            // Cooldown overlay
            const cdOverlay = this.add.rectangle(startX + (i * spacing), cmdY, 160, 50, 0x000000, 0.6);
            cdOverlay.scaleY = 0; // 1 = full CD

            this.commandSlots.push({
                cmdId: cmdId,
                data: cmdData,
                bg: bg,
                cdOverlay: cdOverlay,
                currentCd: 0 // remaining CD time
            });

            // Trigger on click
            bg.on('pointerdown', () => this.triggerCommand(i));
        });
    }

    triggerCommand(slotIndex) {
        const slot = this.commandSlots[slotIndex];
        if (slot.currentCd > 0) return; // on cooldown

        // Trigger logic
        console.log("Triggered command:", slot.data.name);

        // Show visual feedback
        const flash = this.add.rectangle(slot.bg.x, slot.bg.y, 160, 50, 0xf1c40f, 0.8);
        this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

        // Execute Command Logic (Simplified stat buff for next calculation)
        this.activeBuff = { target: slot.data.target, value: slot.data.value, duration: 5 }; // lasts 5 in-game minutes

        // Reset CD
        slot.currentCd = slot.data.cooldown;
    }

    tickMatch() {
        if (this.isSkip) {
            this.finishMatchInstantly();
            return;
        }

        // Advance time (90 mins total, approx 5 real minutes at 1x)
        // 5 mins = 300 seconds. Logic runs 10 times a second. So 3000 ticks.
        // 90 mins / 3000 ticks = 0.03 in-game minutes per tick.
        this.matchTime += 0.03;

        // Update Time UI
        const displayMin = Math.floor(this.matchTime);
        const displaySec = Math.floor((this.matchTime % 1) * 60);
        this.timeText.setText(`${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`);

        // Decrement Cooldowns & Buffs
        this.commandSlots.forEach(slot => {
            if (slot.currentCd > 0) {
                // 0.1 real seconds passed
                slot.currentCd -= 0.1;
                if (slot.currentCd < 0) slot.currentCd = 0;

                // Update Overlay height
                slot.cdOverlay.scaleY = slot.currentCd / slot.data.cooldown;
                slot.cdOverlay.setOrigin(0.5, 1);
                slot.cdOverlay.y = slot.bg.y + 25;
            }
        });

        if (this.activeBuff) {
            this.activeBuff.duration -= 0.03;
            if (this.activeBuff.duration <= 0) this.activeBuff = null;
        }

        // Simulate Action
        this.simulateAction();

        // End Game
        if (this.matchTime >= 90) {
            this.logicTimer.remove();
            this.endMatch(this.score.player, this.score.opponent);
        }
    }

    simulateAction() {
        // Extremely simplified simulation loop for visual MVP
        // Move players slightly towards ball
        const speed = 2;

        [...this.playerSprites, ...this.opponentSprites].forEach(p => {
            // Jitter
            p.x += (Math.random() - 0.5) * 2;
            p.y += (Math.random() - 0.5) * 2;

            // Very slowly move towards ball if near
            if (Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 100) {
                const angle = Phaser.Math.Angle.Between(p.x, p.y, this.ball.x, this.ball.y);
                p.x += Math.cos(angle) * speed;
                p.y += Math.sin(angle) * speed;
            }
        });

        // Ball movement logic
        if (!this.ball.owner) {
            // Pick a random player nearby to get ball
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];
            const nearest = allPlayers.sort((a, b) =>
                Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y) -
                Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y)
            )[0];

            if (Phaser.Math.Distance.Between(nearest.x, nearest.y, this.ball.x, this.ball.y) < 20) {
                this.ball.owner = nearest;
            } else {
                // Ball rolls randomly
                this.ball.x += (Math.random() - 0.5) * 5;
                this.ball.y += (Math.random() - 0.5) * 5;
            }
        } else {
            // Owner has ball
            this.ball.x = this.ball.owner.x;
            this.ball.y = this.ball.owner.y;

            // Decide action (Pass, Shoot, Dribble)
            if (Math.random() < 0.05) {
                const isPlayer = this.ball.owner.isPlayerTeam;
                const targetGoalX = isPlayer ? 800 : 0;

                // Shoot?
                if (Phaser.Math.Distance.Between(this.ball.x, this.ball.y, targetGoalX, 300) < 250) {
                    // Apply buffs
                    let shootStat = this.ball.owner.playerData.dynamicStats.shoot;
                    if (isPlayer && this.activeBuff && (this.activeBuff.target === 'shoot' || this.activeBuff.target === 'header')) {
                        shootStat += this.activeBuff.value;
                    }

                    // Opponent GK save calculation
                    const oppTeamStats = isPlayer ? this.opponentTeamData.getOverallStrength() : this.playerTeamData.getOverallStrength();

                    if (Math.random() * 100 < shootStat - (oppTeamStats / 2) + 20) {
                        // GOAL
                        this.triggerGoal(isPlayer);
                    }
                    // Reset ball
                    this.ball.owner = null;
                    this.ball.x = 400;
                    this.ball.y = 300;

                    // Reposition players
                    this.resetPositions();
                } else {
                    // Pass / Lose ball
                    let passStat = this.ball.owner.playerData.dynamicStats.pass;
                    if (isPlayer && this.activeBuff && this.activeBuff.target === 'pass') {
                        passStat += this.activeBuff.value;
                    }

                    if (Math.random() * 100 < passStat) {
                        // Pass success - ball detaches and moves fast
                        this.ball.owner = null;
                        this.ball.x += (isPlayer ? 50 : -50);
                    } else {
                        // Intercepted
                        this.ball.owner = null;
                    }
                }
            }
        }

        // Update ball sprite
        this.ballSprite.x = this.ball.x;
        this.ballSprite.y = this.ball.y;
    }

    resetPositions() {
        this.playerSprites.forEach(p => { p.x = Phaser.Math.Between(50, 350); p.y = Phaser.Math.Between(50, 550); });
        this.opponentSprites.forEach(p => { p.x = Phaser.Math.Between(450, 750); p.y = Phaser.Math.Between(50, 550); });
    }

    triggerGoal(isPlayerTeam) {
        if (isPlayerTeam) this.score.player++;
        else this.score.opponent++;

        this.scoreText.setText(`${this.playerTeamData.name} ${this.score.player} - ${this.score.opponent} ${this.opponentTeamData.name}`);

        const text = this.add.text(400, 300, 'GOAL!', { fontSize: '64px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({
            targets: text, scale: 1.5, alpha: 0, duration: 1500, onComplete: () => text.destroy()
        });
    }

    finishMatchInstantly() {
        // Fast forward simulation mathematically
        while (this.matchTime < 90) {
            // Increase time faster
            this.matchTime += 1;

            // Simple probability
            const playerStr = this.playerTeamData.getOverallStrength();
            const oppStr = this.opponentTeamData.getOverallStrength();

            if (Math.random() < 0.05) {
                if (Math.random() * 100 < playerStr / 2) this.score.player++;
            }
            if (Math.random() < 0.05) {
                if (Math.random() * 100 < oppStr / 2) this.score.opponent++;
            }
        }

        this.logicTimer.remove();
        this.endMatch(this.score.player, this.score.opponent);
    }

    endMatch(playerScore, oppScore) {
        // Stop updates
        this.scene.pause();

        // Show result
        const resultBg = this.add.rectangle(400, 300, 400, 200, 0x000000, 0.9);
        resultBg.setStrokeStyle(4, 0xffffff);

        this.add.text(400, 250, 'MATCH FINISHED', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 300, `${playerScore} - ${oppScore}`, { fontSize: '48px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);

        const btn = this.add.rectangle(400, 360, 150, 40, 0x3498db).setInteractive();
        this.add.text(400, 360, 'ロッカールームへ', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            // Return to Management UI
            window.gameState.processPostMatch(playerScore, oppScore);

            // Clean up Phaser scene state
            document.getElementById('ui-content').style.display = 'flex';
            document.querySelector('header.top-bar').style.display = 'flex';

            managementUI.showDashboard();
            this.scene.stop();
        });
    }
}

// ==========================================
// Game Configuration
// ==========================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    scene: [MatchScene],
    transparent: true
};

let game;

function startGame() {
    document.getElementById('ui-content').style.display = 'none';
    document.querySelector('header.top-bar').style.display = 'none';

    if (!game) {
        game = new Phaser.Game(config);
    } else {
        game.scene.start('MatchScene');
    }
}
