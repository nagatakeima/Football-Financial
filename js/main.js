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

        // Generate Match Gimmick
        this.gimmicks = ["none", "fever", "fortress", "badWeather"];
        this.currentGimmick = this.gimmicks[Math.floor(Math.random() * this.gimmicks.length)];
        console.log("Match Gimmick: ", this.currentGimmick);

        // Apply pre-match gimmick effects
        if (this.currentGimmick === "badWeather") {
             // Pass success drops globally implicitly handled in pass logic
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

        // Physics/Update timer (Run every 100ms logically)
        this.logicTimer = this.time.addEvent({
            delay: 100,
            callback: this.tickMatch,
            callbackScope: this,
            loop: true
        });

        // UI Layer in Phaser
        this.createMatchUI();
    }

    drawPitch() {
        // Striped grass pattern
        for (let i = 0; i < 8; i++) {
            this.add.rectangle(400, i * 75 + 37.5, 800, 75, i % 2 === 0 ? 0x2E8B57 : 0x277A4D);
        }

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 0.8);

        // Center line & circle
        graphics.strokeCircle(400, 300, 70);
        graphics.beginPath();
        graphics.moveTo(400, 10);
        graphics.lineTo(400, 590);
        graphics.strokePath();

        // Outer bounds
        graphics.strokeRect(10, 10, 780, 580);

        // Left Penalty Area
        graphics.strokeRect(10, 150, 150, 300);
        graphics.strokeRect(10, 225, 50, 150); // Goal Area
        graphics.fillCircle(110, 300, 3); // Penalty Spot
        graphics.beginPath();
        graphics.arc(110, 300, 70, -Math.PI / 3, Math.PI / 3); // Penalty Arc
        graphics.strokePath();

        // Right Penalty Area
        graphics.strokeRect(640, 150, 150, 300);
        graphics.strokeRect(740, 225, 50, 150); // Goal Area
        graphics.fillCircle(690, 300, 3); // Penalty Spot
        graphics.beginPath();
        graphics.arc(690, 300, 70, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3); // Penalty Arc
        graphics.strokePath();

        // Goals
        graphics.lineStyle(3, 0xaaaaaa, 1);
        graphics.strokeRect(0, 260, 10, 80);
        graphics.strokeRect(790, 260, 10, 80);
    }

    getBasePosition(pos, isPlayerTeam) {
        let x = 400;
        let y = 300;
        const dir = isPlayerTeam ? -1 : 1;
        const half = 200;

        switch (pos) {
            case 'GK': x = 400 + dir * 350; y = 300; break;
            case 'CB': x = 400 + dir * 250; y = 300; break;
            case 'SB': x = 400 + dir * 250; y = 100; break;
            case 'CDM': x = 400 + dir * 150; y = 300; break;
            case 'CM': x = 400 + dir * 100; y = 300; break;
            case 'CAM': x = 400 + dir * 50; y = 300; break;
            case 'WG': x = 400 + dir * 100; y = 100; break;
            case 'ST': x = 400 - dir * 50; y = 300; break;
            default: x = 400 + dir * 100; y = 300; break;
        }
        return { x, y };
    }

    createPlayerSprite(x, y, color, number, isPlayerTeam, player) {
        let container = this.add.container(x, y);

        // Shadow
        let shadow = this.add.ellipse(0, 15, 20, 8, 0x000000, 0.4);

        // Legs (animated later)
        let legL = this.add.rectangle(-4, 12, 4, 10, 0xecf0f1);
        let legR = this.add.rectangle(4, 12, 4, 10, 0xecf0f1);

        // Shoes
        let shoeL = this.add.rectangle(-4, 17, 6, 4, 0x333333);
        let shoeR = this.add.rectangle(4, 17, 6, 4, 0x333333);

        // Body (Jersey)
        let body = this.add.rectangle(0, 0, 16, 18, color);
        body.setStrokeStyle(1, 0xffffff);

        // Sleeves
        let sleeveL = this.add.rectangle(-9, -2, 4, 8, color);
        let sleeveR = this.add.rectangle(9, -2, 4, 8, color);

        // Pants
        let pants = this.add.rectangle(0, 9, 16, 6, 0xffffff);

        // Head/Face
        let head = this.add.circle(0, -14, 9, 0xffccaa); // skin tone

        // Hair (randomized)
        const hairColors = [0x4a2311, 0x000000, 0xe6b322, 0x7c2c16];
        const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        let hair = this.add.arc(0, -16, 9, 180, 360, false, hairColor);

        // Eyes (pixel-like)
        let eyeL = this.add.rectangle(-3, -13, 2, 2, 0x000000);
        let eyeR = this.add.rectangle(3, -13, 2, 2, 0x000000);

        // Number text
        let numText = this.add.text(0, 1, number, { fontSize: '10px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);

        // Group parts for animation reference
        container.add([shadow, legL, legR, shoeL, shoeR, pants, sleeveL, sleeveR, body, head, hair, eyeL, eyeR, numText]);

        // Store references for animation
        container.legL = legL;
        container.legR = legR;
        container.shoeL = shoeL;
        container.shoeR = shoeR;

        // Reference to properties
        container.playerData = player;
        container.isPlayerTeam = isPlayerTeam;
        container.animTick = Math.random() * 10;
        container.baseColor = color;
        container.dirX = 1; // 1 for right, -1 for left

        return container;
    }

    spawnTeams() {
        this.playerTeamData.starting11.forEach((player, i) => {
            let pos = this.getBasePosition(player.position, true);
            let yOffset = (i % 2 === 0 ? -1 : 1) * ((i % 3) * 30); // Spread them out
            if (player.position === 'SB' || player.position === 'WG') {
                pos.y = i % 2 === 0 ? 100 : 500; // Left / Right flanks
            }
            if (player.position === 'CB' || player.position === 'CM' || player.position === 'CDM') {
                pos.y = 300 + yOffset;
            }

            let sprite = this.createPlayerSprite(pos.x, pos.y, 0x3498db, i + 1, true, player);
            this.playerSprites.push(sprite);
        });

        this.opponentTeamData.starting11.forEach((player, i) => {
            let pos = this.getBasePosition(player.position, false);
            let yOffset = (i % 2 === 0 ? -1 : 1) * ((i % 3) * 30);
            if (player.position === 'SB' || player.position === 'WG') {
                pos.y = i % 2 === 0 ? 100 : 500;
            }
            if (player.position === 'CB' || player.position === 'CM' || player.position === 'CDM') {
                pos.y = 300 + yOffset;
            }

            let sprite = this.createPlayerSprite(pos.x, pos.y, 0xe74c3c, i + 1, false, player);
            this.opponentSprites.push(sprite);
        });

        // Ball Sprite
        this.ballSprite = this.add.circle(0, 0, 6, 0xffffff);
        this.ballSprite.setStrokeStyle(1, 0x000000); // shadow
        this.ballContainer = this.add.container(400, 300);
        let shadow = this.add.ellipse(0, 8, 12, 6, 0x000000, 0.3);
        this.ballContainer.add([shadow, this.ballSprite]);

        this.ballTarget = null;
        this.ballSpeed = 0;
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

        // Gimmick Text
        let gimmickStr = "通常環境";
        if (this.currentGimmick === "fever") gimmickStr = "熱狂 (前半プレッシャー増)";
        if (this.currentGimmick === "fortress") gimmickStr = "要塞 (スタミナ消費増/ファウル減)";
        if (this.currentGimmick === "badWeather") gimmickStr = "悪天候 (パス成功率低下/ロング有利)";
        this.add.text(400, 75, `環境: ${gimmickStr}`, {
            fontSize: '14px', fill: '#e74c3c'
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
                currentCd: 0, // remaining CD time
                usesLeft: cmdData.maxUses !== undefined ? cmdData.maxUses : Infinity
            });

            // Trigger on click
            bg.on('pointerdown', () => this.triggerCommand(i));
        });
    }

    triggerCommand(slotIndex) {
        const slot = this.commandSlots[slotIndex];
        if (slot.currentCd > 0) return; // on cooldown
        if (slot.usesLeft <= 0) {
            console.log("No uses left for", slot.data.name);
            return;
        }

        // Conditional checks
        if (slot.data.condition) {
            const isBehind = this.score.player < this.score.opponent;
            const isLead = this.score.player > this.score.opponent;
            if (slot.data.condition === "behind" && !isBehind) {
                console.log("Condition not met: Requires behind");
                return;
            }
            if (slot.data.condition === "lead" && !isLead) {
                console.log("Condition not met: Requires lead");
                return;
            }
        }

        // Decrement Uses
        slot.usesLeft -= 1;
        if (slot.usesLeft <= 0) {
            slot.bg.setAlpha(0.5);
        }

        // Trigger logic
        console.log("Triggered command:", slot.data.name);

        // Show visual feedback
        const flash = this.add.rectangle(slot.bg.x, slot.bg.y, 160, 50, 0xf1c40f, 0.8);
        this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

        // Execute Command Logic (Simplified stat buff for next calculation)
        this.activeBuff = { target: slot.data.target, value: slot.data.value, actionType: slot.data.actionType, duration: 5 }; // lasts 5 in-game minutes

        // Check Super Sub Skill (ID: 10) on substitute
        if (slot.data.actionType === 'substitute') {
            // For MVP: Boost random bench player and swap
            const benchPlayer = this.playerTeamData.bench.find(p => p.skills.includes(10)) || this.playerTeamData.bench[0];
            if (benchPlayer) {
                // Ensure dynamic stats exist if not yet calculated
                if (!benchPlayer.dynamicStats) {
                    benchPlayer.dynamicStats = { ...benchPlayer.stats };
                }

                if (benchPlayer.skills.includes(10)) {
                    // Super Sub effect (temporary match stats)
                    Object.keys(benchPlayer.dynamicStats).forEach(k => benchPlayer.dynamicStats[k] = Math.min(100, benchPlayer.dynamicStats[k] + 15));
                    console.log("Super Sub activated for " + benchPlayer.name);
                }
                // Simple swap with worst performer on pitch
                const worstPitch = this.playerSprites.sort((a,b) => a.playerData.condition - b.playerData.condition)[0];
                if (worstPitch) {
                    worstPitch.playerData = benchPlayer;
                    worstPitch.setStrokeStyle(2, 0xf1c40f); // highlight sub
                }
            }
        }

        // Implement special action types immediately
        if (slot.data.actionType === 'powerPlay') {
            const cb = this.playerSprites.find(p => p.playerData.position === 'CB');
            if (cb) {
                // Goals are at x=0 and x=800. Center forward is roughly near opponent's half (x=600 if playing L to R).
                // Assuming player team goes L to R for simplicity, or we can just push x forward.
                cb.x = 600;
                console.log("Power play triggered.");
            }
        }
        if (slot.data.actionType === 'comeback') {
            // Apply massive buff to all stats
            this.playerSprites.forEach(p => {
                Object.keys(p.playerData.dynamicStats).forEach(k => p.playerData.dynamicStats[k] += 20);
            });
        }
        if (slot.data.actionType === 'parkBus') {
            this.playerSprites.forEach(p => {
                if (p.playerData.position === 'SB' || p.playerData.position === 'CDM') {
                     // Pull back towards own goal at x=0
                     p.x = Math.max(50, p.x - 150);
                }
            });
        }
        if (slot.data.actionType === 'offsideTrap') {
             this.opponentSprites.forEach(p => {
                 // Push opponent attackers back towards center
                 if (p.x < 300) p.x = 400;
             });
        }

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

        // Apply global temporary buffs every tick if active
        if (this.activeBuff && this.activeBuff.target === 'defenseLine') {
             // Middle block logic: keep players near center
             this.playerSprites.forEach(p => {
                 if (p.x < 300) p.x += 1;
                 if (p.x > 500) p.x -= 1;
             });
        }
        if (this.activeBuff && this.activeBuff.target === 'press') {
             // High press: players move towards ball much faster
             this.playerSprites.forEach(p => {
                  if (Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 250) {
                      const angle = Phaser.Math.Angle.Between(p.x, p.y, this.ball.x, this.ball.y);
                      p.x += Math.cos(angle) * 1.5;
                      p.y += Math.sin(angle) * 1.5;
                  }
             });
        }

        // Apply global environmental gimmicks
        if (this.currentGimmick === 'fever' && this.matchTime < 45) {
             // Opponents press hard in first half
             this.opponentSprites.forEach(p => {
                  if (Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 200) {
                      const angle = Phaser.Math.Angle.Between(p.x, p.y, this.ball.x, this.ball.y);
                      p.x += Math.cos(angle) * 1.2;
                      p.y += Math.sin(angle) * 1.2;
                  }
             });
        }

        if (this.currentGimmick === 'fortress') {
            // Fortress drains stamina faster (stamina affects stats implicitly, MVP simulate by jitter)
            this.playerSprites.forEach(p => {
                p.playerData.currentStamina -= p.playerData.staminaConsumptionRate * 0.1;
            });
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
        const timeRemaining = 90 - this.matchTime;
        const scoreDiff = this.score.player - this.score.opponent;

        // Particle manager for ball/shoot effects (lazy init)
        if (!this.particles) {
            this.particles = this.add.particles(0, 0, 'ball', {
                speed: 100,
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 300,
                emitting: false
            });
            // We don't have a texture, so we use a graphics object generated texture
            let g = this.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('trail', 8, 8);
            g.destroy();

            this.trailEmitter = this.add.particles(0, 0, 'trail', {
                speed: 20,
                scale: { start: 1, end: 0 },
                alpha: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 200,
                frequency: 50,
                follow: this.ballContainer
            });
        }

        // Toggle trail based on speed
        this.trailEmitter.emitting = this.ballSpeed > 5;

        [...this.playerSprites, ...this.opponentSprites].forEach(p => {
            let targetX = p.x;
            let targetY = p.y;
            let moved = false;

            const hasBall = this.ball.owner === p;

            // Team Context
            const teamManager = p.isPlayerTeam ? window.MasterData.Managers.find(m => m.id === window.gameState.playerTeam.managerId) : window.MasterData.Managers.find(m => m.id === managementUI.getNextOpponent().managerId);
            const tactic = teamManager ? teamManager.preference : (p.isPlayerTeam ? window.gameState.playerTeam.tactics : managementUI.getNextOpponent().tactics);

            // Contextual multipliers
            let urgency = 1.0;
            const myScoreDiff = p.isPlayerTeam ? scoreDiff : -scoreDiff;

            if (timeRemaining < 15) {
                if (myScoreDiff < 0) urgency = 1.5; // Desperate attack
                if (myScoreDiff > 0) urgency = 0.8; // Time wasting / defending
            }

            // Stamina modifier
            const staminaFactor = Math.max(0.3, p.playerData.currentStamina / 100);
            const maxSpeed = (2.0 + (p.playerData.stats.speed / 50)) * staminaFactor * urgency;

            // Determine if team is in possession
            let isAttacking = false;
            let isDefending = false;
            if (this.ball.owner) {
                isAttacking = this.ball.owner.isPlayerTeam === p.isPlayerTeam;
                isDefending = !isAttacking;
            } else if (this.ballTarget) {
                // Ball is moving, guess based on direction (simplified: ballTarget x)
                const headingRight = this.ballTarget.x > this.ball.x;
                // If heading right, player team is attacking. If heading left, opponent team.
                if (headingRight) {
                     isAttacking = p.isPlayerTeam;
                     isDefending = !p.isPlayerTeam;
                } else {
                     isAttacking = !p.isPlayerTeam;
                     isDefending = p.isPlayerTeam;
                }
            } else {
                 // Loose ball, nearest player determines intent (handled below)
            }

            // 1. Base Position Attraction Force
            let base = this.getBasePosition(p.playerData.position, p.isPlayerTeam);

            // Adjust base based on tactic and phase
            if (isAttacking) {
                if (tactic === 'Counter') {
                    base.x += (p.isPlayerTeam ? 150 : -150) * urgency; // Push hard
                } else if (tactic === 'Possession') {
                    base.x += (p.isPlayerTeam ? 80 : -80); // Push moderately
                } else {
                    base.x += (p.isPlayerTeam ? 100 : -100);
                }

                // Shift y slightly towards ball to support, but keep width if winger
                if (p.playerData.position !== 'WG' && p.playerData.position !== 'SB') {
                    base.y = Phaser.Math.Linear(base.y, this.ball.y, 0.3);
                }
            } else if (isDefending) {
                if (tactic === 'Retreat') {
                    base.x -= (p.isPlayerTeam ? 100 : -100); // Drop deep
                } else if (tactic === 'HighPress') {
                    base.x += (p.isPlayerTeam ? 50 : -50); // Keep line high
                } else {
                    base.x -= (p.isPlayerTeam ? 50 : -50);
                }
                // Shift block towards ball
                base.y = Phaser.Math.Linear(base.y, this.ball.y, 0.5);
            }

            let forceX = base.x - p.x;
            let forceY = base.y - p.y;

            // Normalize base force
            let distToBase = Math.sqrt(forceX*forceX + forceY*forceY);
            if (distToBase > 0) {
                forceX = (forceX / distToBase) * 1.0;
                forceY = (forceY / distToBase) * 1.0;
            }

            // 2. Ball Influence Force
            let ballForceX = 0;
            let ballForceY = 0;

            if (hasBall) {
                // Dribble towards opponent goal
                const targetGoalX = p.isPlayerTeam ? 800 : 0;
                ballForceX = (targetGoalX - p.x);
                ballForceY = (300 - p.y); // aim for center

                let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                if (bDist > 0) {
                    ballForceX = (ballForceX / bDist) * 1.5;
                    ballForceY = (ballForceY / bDist) * 1.5;
                }

                // Avoid defenders
                const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                enemies.forEach(e => {
                    const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
                    if (d < 50) {
                        ballForceY += (p.y > e.y ? 2.0 : -2.0); // dodge Y heavily
                        ballForceX += (p.x > e.x ? 1.0 : -1.0);
                    }
                });

            } else {
                // Are we the nearest player to the ball for our team?
                const myTeam = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
                const closestToBall = myTeam.sort((a,b) =>
                    Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y) -
                    Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y)
                )[0];

                if (closestToBall === p && (!this.ball.owner || isDefending)) {
                    // Chase ball
                    let pressMultiplier = tactic === 'HighPress' ? 1.5 : 1.0;
                    if (urgency > 1) pressMultiplier *= 1.2;

                    ballForceX = (this.ball.x - p.x);
                    ballForceY = (this.ball.y - p.y);
                    let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                    if (bDist > 0) {
                        ballForceX = (ballForceX / bDist) * 2.0 * pressMultiplier;
                        ballForceY = (ballForceY / bDist) * 2.0 * pressMultiplier;
                    }
                } else if (isAttacking && closestToBall !== p) {
                    // Support player - try to find open space (away from enemies)
                    // Simplified: just add a slight force towards opponent goal
                    ballForceX = p.isPlayerTeam ? 0.5 : -0.5;
                }
            }

            // 3. Separation Force (Avoid stacking)
            let sepForceX = 0;
            let sepForceY = 0;
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];
            allPlayers.forEach(other => {
                if (other !== p) {
                    const dist = Phaser.Math.Distance.Between(p.x, p.y, other.x, other.y);
                    if (dist < 25) { // Desired separation radius
                        sepForceX += (p.x - other.x) / dist;
                        sepForceY += (p.y - other.y) / dist;
                    }
                }
            });

            // Combine forces
            let totalForceX = forceX + ballForceX + sepForceX;
            let totalForceY = forceY + ballForceY + sepForceY;

            // Apply speed limit & stamina drain
            let totalMagnitude = Math.sqrt(totalForceX*totalForceX + totalForceY*totalForceY);
            if (totalMagnitude > 0) {
                let actualSpeed = Math.min(totalMagnitude, maxSpeed);

                // If moving fast, drain stamina
                if (actualSpeed > 1.5) {
                    p.playerData.currentStamina -= (0.05 * (100 / p.playerData.stats.stamina));
                }

                p.x += (totalForceX / totalMagnitude) * actualSpeed;
                p.y += (totalForceY / totalMagnitude) * actualSpeed;
                moved = actualSpeed > 0.1;
            }

            // Boundaries
            p.x = Phaser.Math.Clamp(p.x, 10, 790);
            p.y = Phaser.Math.Clamp(p.y, 10, 590);

            // Animate (Kairosoft style walking)
            if (moved) {
                p.animTick += 0.4;

                // Leg swinging
                p.legL.y = 12 + Math.sin(p.animTick) * 3;
                p.legR.y = 12 + Math.sin(p.animTick + Math.PI) * 3;
                p.shoeL.y = 17 + Math.sin(p.animTick) * 3;
                p.shoeR.y = 17 + Math.sin(p.animTick + Math.PI) * 3;

                // Body bobbing
                p.y += (Math.sin(p.animTick*2) > 0 ? 0.5 : -0.5);

                // Direction facing
                if (totalForceX > 0.5) p.dirX = 1;
                else if (totalForceX < -0.5) p.dirX = -1;

                p.scaleX = p.dirX;
                // Fix text being mirrored
                let numText = p.list[13];
                if (numText) numText.scaleX = p.dirX;
            } else {
                // Idle
                p.legL.y = 12; p.legR.y = 12;
                p.shoeL.y = 17; p.shoeR.y = 17;
            }
        });

        // --- Ball Interaction ---
        if (this.ballTarget) {
            // Ball is moving towards a target (pass/shoot)
            const dist = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y);
            if (dist < 10 || this.ballSpeed < 0.5) {
                this.ballTarget = null;
                this.ballSpeed = 0;
            } else {
                const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y);
                this.ball.x += Math.cos(angle) * this.ballSpeed;
                this.ball.y += Math.sin(angle) * this.ballSpeed;
                this.ballSpeed *= 0.98;
            }
        }

        if (!this.ball.owner && !this.ballTarget) {
            // Pick up loose ball
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];
            const nearest = allPlayers.sort((a, b) => {
                let distA = Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y);
                let distB = Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y);

                if (this.activeBuff && this.activeBuff.target === 'intercept') {
                    if (a.isPlayerTeam) distA -= 30;
                    if (b.isPlayerTeam) distB -= 30;
                }
                return distA - distB;
            })[0];

            if (Phaser.Math.Distance.Between(nearest.x, nearest.y, this.ball.x, this.ball.y) < 20 + (this.activeBuff && this.activeBuff.target === 'intercept' && nearest.isPlayerTeam ? 20 : 0)) {
                this.ball.owner = nearest;
            }
        } else if (this.ball.owner) {
            // Ball follows owner
            this.ball.x = this.ball.owner.x + (this.ball.owner.dirX > 0 ? 10 : -10);
            this.ball.y = this.ball.owner.y + 10;

            // Decision making (Pass, Shoot, Dribble)
            let forceShoot = false;
            let forceLongBall = false;

            if (this.activeBuff && this.ball.owner.isPlayerTeam) {
                if (['shoot', 'cutInShoot'].includes(this.activeBuff.actionType)) forceShoot = true;
                if (['longBall', 'throughBall', 'switchPlay', 'earlyCross'].includes(this.activeBuff.actionType)) forceLongBall = true;
            }

            if (forceShoot || forceLongBall || Math.random() < 0.05) {
                const isPlayer = this.ball.owner.isPlayerTeam;
                const targetGoalX = isPlayer ? 800 : 0;
                const distToGoal = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, targetGoalX, 300);

                // Shoot Logic
                if (forceShoot || distToGoal < 250) {
                    let shootStat = this.ball.owner.playerData.dynamicStats.shoot;
                    if (isPlayer && this.activeBuff && (this.activeBuff.target === 'shoot' || this.activeBuff.target === 'header')) {
                        shootStat += this.activeBuff.value;
                    }

                    if (this.activeBuff && this.activeBuff.actionType === 'runBehind' && this.ball.owner.playerData.skills.includes(1)) shootStat += 20;

                    const isBehind = isPlayer ? scoreDiff < 0 : scoreDiff > 0;
                    if (isBehind && this.ball.owner.playerData.skills.includes(9)) shootStat += 20;
                    if (this.activeBuff && this.activeBuff.target === 'header' && this.ball.owner.playerData.skills.includes(3)) shootStat += 15;

                    const oppTeamStats = isPlayer ? this.opponentTeamData.getOverallStrength() : this.playerTeamData.getOverallStrength();

                    // Visual Kick Effect
                    this.createKickEffect(this.ball.x, this.ball.y);

                    this.ballTarget = {x: targetGoalX, y: 300 + (Math.random()*100 - 50)};
                    this.ballSpeed = 25; // Faster shot
                    this.ball.owner = null;

                    if (Math.random() * 100 < shootStat - (oppTeamStats / 2) + 20) {
                        this.time.delayedCall(300, () => {
                            this.triggerGoal(isPlayer);
                            this.resetPositions();
                        });
                    } else {
                        this.time.delayedCall(300, () => {
                            this.ballTarget = null;
                            this.ball.x = isPlayer ? 750 : 50;
                            this.ball.y = 300;
                            this.resetPositions();
                        });
                    }
                }
                // Pass Logic
                else {
                    const teammates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(p => p !== this.ball.owner);

                    const forwardMates = teammates.filter(p => isPlayer ? p.x > this.ball.owner.x : p.x < this.ball.owner.x);
                    const targetMate = forwardMates.length > 0 ? forwardMates[Math.floor(Math.random() * forwardMates.length)] : teammates[0];

                    let passStat = this.ball.owner.playerData.dynamicStats.pass;
                    if (isPlayer && this.activeBuff && this.activeBuff.target === 'pass') passStat += this.activeBuff.value;

                    if (this.currentGimmick === 'badWeather') {
                        passStat -= 20;
                        if (forceLongBall) passStat += 30;
                    }

                    // Visual Kick Effect
                    this.createKickEffect(this.ball.x, this.ball.y);

                    if (forceLongBall) {
                         this.ballTarget = {x: targetMate.x + (isPlayer ? 150 : -150), y: targetMate.y};
                         this.ballSpeed = 22;
                    } else {
                         this.ballTarget = {x: targetMate.x, y: targetMate.y};
                         this.ballSpeed = 18;
                    }

                    if (Math.random() * 100 > passStat) {
                        this.ballTarget.x += (Math.random()*150 - 75);
                        this.ballTarget.y += (Math.random()*150 - 75);
                    }

                    this.ball.owner = null;
                    if (forceLongBall) this.activeBuff = null;
                }
            }
        }

        // Update ball sprite visually
        if (this.ballContainer) {
            this.ballContainer.x = this.ball.x;
            this.ballContainer.y = this.ball.y;
            if (this.ballSpeed > 0) {
                this.ballSprite.rotation += 0.2;
            }
        }
    }

    createKickEffect(x, y) {
        let shockwave = this.add.circle(x, y, 5, 0xffffff, 0.8);
        shockwave.setStrokeStyle(2, 0xffffff);
        this.tweens.add({
            targets: shockwave,
            scale: 3,
            alpha: 0,
            duration: 200,
            onComplete: () => shockwave.destroy()
        });
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
