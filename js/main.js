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
        this.matchState = 'playing';
        this.kickoffTimer = 0;
        this.ball = { x: 400, y: 300, z: 0, owner: null }; // owner is a sprite or null

        // Sprites / Teams
        this.playerSprites = [];
        this.opponentSprites = [];

        this.spawnTeams();
        this.resetPositions();

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
            case 'CF': x = 400 - dir * 50; y = 300; break;
            default: x = 400 + dir * 100; y = 300; break;
        }
        return { x, y };
    }

    createPlayerSprite(x, y, color, number, isPlayerTeam, player) {
        let container = this.add.container(x, y);

        // Adjust color for GK
        if (player.position === 'GK') {
            color = isPlayerTeam ? 0x2ecc71 : 0xf1c40f; // Green for player GK, Yellow for opponent GK
        }

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
        const playerFormationPositions = window.MasterData.Formations[this.playerTeamData.formation] || [];
        this.playerTeamData.starting11.forEach((player, i) => {
            const expectedPosStr = playerFormationPositions[i] || player.position;
            let pos = this.getBasePosition(expectedPosStr, true);
            let yOffset = (i % 2 === 0 ? -1 : 1) * ((i % 3) * 30); // Spread them out
            if (expectedPosStr === 'SB' || expectedPosStr === 'WG') {
                pos.y = i % 2 === 0 ? 100 : 500; // Left / Right flanks
            }
            if (expectedPosStr === 'CB' || expectedPosStr === 'CM' || expectedPosStr === 'CDM') {
                pos.y = 300 + yOffset;
            }

            // Apply Mob Penalty if placed in wrong position
            if (player.position !== expectedPosStr) {
                player.isMob = true;
                player.dynamicStats = {
                    pass: player.stats.pass / 2,
                    shoot: player.stats.shoot / 2,
                    defense: player.stats.defense / 2,
                    physical: player.stats.physical / 2,
                    speed: player.stats.speed / 2,
                    mental: player.stats.mental / 2,
                    stamina: player.stats.stamina / 2
                };
            } else {
                player.isMob = false;
            }

            let sprite = this.createPlayerSprite(pos.x, pos.y, 0x3498db, i + 1, true, player);
            sprite.baseX = pos.x;
            sprite.baseY = pos.y;
            sprite.baseOffsetY = (expectedPosStr === 'CB' || expectedPosStr === 'CM' || expectedPosStr === 'CDM' || expectedPosStr === 'CAM' || expectedPosStr === 'CF') ? yOffset : 0;
            sprite.expectedPosStr = expectedPosStr; // Save for logic
            this.playerSprites.push(sprite);
        });

        const oppFormationPositions = window.MasterData.Formations[this.opponentTeamData.formation] || [];
        this.opponentTeamData.starting11.forEach((player, i) => {
            const expectedPosStr = oppFormationPositions[i] || player.position;
            let pos = this.getBasePosition(expectedPosStr, false);
            let yOffset = (i % 2 === 0 ? -1 : 1) * ((i % 3) * 30);
            if (expectedPosStr === 'SB' || expectedPosStr === 'WG') {
                pos.y = i % 2 === 0 ? 100 : 500;
            }
            if (expectedPosStr === 'CB' || expectedPosStr === 'CM' || expectedPosStr === 'CDM') {
                pos.y = 300 + yOffset;
            }

            // Apply Mob Penalty if placed in wrong position
            if (player.position !== expectedPosStr) {
                player.isMob = true;
                player.dynamicStats = {
                    pass: player.stats.pass / 2,
                    shoot: player.stats.shoot / 2,
                    defense: player.stats.defense / 2,
                    physical: player.stats.physical / 2,
                    speed: player.stats.speed / 2,
                    mental: player.stats.mental / 2,
                    stamina: player.stats.stamina / 2
                };
            } else {
                player.isMob = false;
            }

            let sprite = this.createPlayerSprite(pos.x, pos.y, 0xe74c3c, i + 1, false, player);
            sprite.baseX = pos.x;
            sprite.baseY = pos.y;
            sprite.baseOffsetY = (expectedPosStr === 'CB' || expectedPosStr === 'CM' || expectedPosStr === 'CDM' || expectedPosStr === 'CAM' || expectedPosStr === 'CF') ? yOffset : 0;
            sprite.expectedPosStr = expectedPosStr; // Save for logic
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
        this.isHighBall = false;
        this.ballZVelocity = 0;
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

        // Handle match state and simulate action
        if (this.matchState === 'kickoff') {
            if (this.kickoffTimer > 0) {
                this.kickoffTimer -= 1;
            } else {
                this.matchState = 'playing';
            }
        }

        if (this.matchState === 'playing') {
            this.simulateAction();
        }

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
            // Use expected position from formation if available
            let base = this.getBasePosition(p.expectedPosStr || p.playerData.position, p.isPlayerTeam);

            // Re-apply vertical offset for central players so they don't clump
            if (p.baseOffsetY) {
                base.y += p.baseOffsetY;
            }

            // Pitch Matrix Constants
            const laneCenter = 300;
            const laneHalfSpaceY = 150; // offset from center
            const dir = p.isPlayerTeam ? 1 : -1;

            // Role and Tactic Overrides
            const role = p.playerData.role;
            const isMob = p.playerData.isMob;

            // Adjust base based on tactic, phase, and ROLE
            if (isAttacking) {
                let attackPush = 100;

                if (tactic === 'Counter') {
                    attackPush = 150 * urgency;
                } else if (tactic === 'Possession') {
                    attackPush = 80;
                }

                if (!isMob) {
                    // Role Overrides - Attack
                    if (role === 'Inverted' && p.playerData.position === 'SB') {
                        // Move to half-space or center
                        base.y = Phaser.Math.Linear(base.y, laneCenter, 0.6);
                        attackPush += 20; // Support build-up
                    } else if (role === 'Defensive' && p.playerData.position === 'SB') {
                        // Stay back
                        attackPush = 0;
                    } else if (role === 'Attacking' && p.playerData.position === 'SB') {
                        // Overlap deep
                        attackPush += 80;
                    } else if (role === 'False-9' && p.playerData.position === 'CF') {
                        // Drop deep to midfield
                        attackPush = -50;
                    } else if (role === 'Target-Man' && p.playerData.position === 'CF') {
                        // Hold center
                        base.y = laneCenter;
                    } else if (role === 'Inside-Forward' && p.playerData.position === 'WG') {
                        // Cut inside
                        base.y = Phaser.Math.Linear(base.y, laneCenter, 0.4);
                        attackPush += 40;
                    } else if (role === 'Box-to-Box' && p.playerData.position === 'CM') {
                        // Run deep into box
                        attackPush += 60;
                    } else if (role === 'Shadow-Striker' && p.playerData.position === 'CAM') {
                        // Push up like a CF
                        attackPush += 60;
                    }
                }

                base.x += dir * attackPush;

                // Shift y slightly towards ball to support, but keep width if wide player (unless inverted)
                const isWide = p.playerData.position === 'WG' || p.playerData.position === 'SB';
                if (!isWide || (role === 'Inverted' || role === 'Inside-Forward')) {
                    // Central players and inverted wide players move towards ball
                    base.y = Phaser.Math.Linear(base.y, this.ball.y, tactic === 'Possession' ? 0.5 : 0.3);
                } else if (isWide && tactic === 'Possession') {
                    // In possession, true wide players stay VERY wide (Hug touchline)
                    base.y = base.y > 300 ? 550 : 50;
                }

            } else if (isDefending) {
                let defendDrop = -50;

                if (tactic === 'Retreat') {
                    defendDrop = -120; // Drop deep
                } else if (tactic === 'HighPress') {
                    defendDrop = 50; // Keep line high
                }

                if (!isMob) {
                    // Role Overrides - Defense
                    if (role === 'Stopper' && p.playerData.position === 'CB') {
                        // Step up to press
                        defendDrop += 40;
                    } else if (role === 'Covering' && p.playerData.position === 'CB') {
                        // Drop deeper to cover
                        defendDrop -= 30;
                    } else if ((role === 'Attacking' || role === 'Wing-Back') && p.playerData.position === 'SB') {
                        // Might be caught high if exhausted
                        if (p.playerData.condition < 40) {
                            defendDrop += 50; // Late returning
                        }
                    } else if (role === 'Enganche' && p.playerData.position === 'CAM') {
                        // Exempt from deep defense
                        defendDrop += 80;
                    } else if (role === 'Dynamo' && p.playerData.position === 'CAM') {
                        // High press engine
                        defendDrop += 60;
                    } else if (role === 'Hard-Worker' && p.playerData.position === 'WG') {
                        // Track back deep
                        defendDrop -= 60;
                    }
                }

                base.x += dir * defendDrop;

                // Shift block towards ball (Tuck in)
                base.y = Phaser.Math.Linear(base.y, this.ball.y, 0.5);

                // If ball is on opposite side, wide defenders tuck in heavily
                const ballLaneDist = Math.abs(this.ball.y - base.y);
                if (ballLaneDist > 200 && (p.playerData.position === 'SB' || p.playerData.position === 'WG')) {
                    base.y = Phaser.Math.Linear(base.y, laneCenter, 0.4);
                }
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
                // Not having the ball
                const myTeam = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
                const sortedByDistance = myTeam.slice().sort((a,b) =>
                    Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y) -
                    Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y)
                );
                const closestToBall = sortedByDistance[0];
                const secondClosest = sortedByDistance[1];

                if (isDefending) {
                    // Defending logic
                    if (closestToBall === p) {
                        // 1st defender: Press the ball (Aggressively)
                        let pressMultiplier = tactic === 'HighPress' ? 2.5 : 1.8;
                        if (urgency > 1) pressMultiplier *= 1.2;

                        ballForceX = (this.ball.x - p.x);
                        ballForceY = (this.ball.y - p.y);
                        let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                        if (bDist > 0) {
                            ballForceX = (ballForceX / bDist) * 2.0 * pressMultiplier;
                            ballForceY = (ballForceY / bDist) * 2.0 * pressMultiplier;
                        }
                    } else if (secondClosest === p && Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 150) {
                        // 2nd defender: Cover / Double team
                        let angleToGoal = p.isPlayerTeam ?
                            Phaser.Math.Angle.Between(this.ball.x, this.ball.y, 10, 300) :
                            Phaser.Math.Angle.Between(this.ball.x, this.ball.y, 790, 300);

                        // Position between ball and goal
                        let coverX = this.ball.x + Math.cos(angleToGoal) * 40;
                        let coverY = this.ball.y + Math.sin(angleToGoal) * 40;

                        ballForceX = (coverX - p.x);
                        ballForceY = (coverY - p.y);
                        let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                        if (bDist > 0) {
                            ballForceX = (ballForceX / bDist) * 1.5;
                            ballForceY = (ballForceY / bDist) * 1.5;
                        }
                    } else {
                        // Other defenders: Line Control & Marking
                        // Find nearest opponent to mark
                        const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                        let markTarget = enemies.reduce((nearest, e) => {
                            let dist = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
                            return dist < nearest.dist ? {sprite: e, dist: dist} : nearest;
                        }, {sprite: null, dist: Infinity});

                        // If an enemy is close, mark them (man-to-man)
                        if (markTarget.sprite && markTarget.dist < 100) {
                            // Position between marked player and goal
                            let angleToGoal = p.isPlayerTeam ?
                                Phaser.Math.Angle.Between(markTarget.sprite.x, markTarget.sprite.y, 10, 300) :
                                Phaser.Math.Angle.Between(markTarget.sprite.x, markTarget.sprite.y, 790, 300);

                            let markX = markTarget.sprite.x + Math.cos(angleToGoal) * 20;
                            let markY = markTarget.sprite.y + Math.sin(angleToGoal) * 20;

                            ballForceX = (markX - p.x);
                            ballForceY = (markY - p.y);
                        } else {
                            // Otherwise maintain defensive line (retreat to base slightly based on ball depth)
                            let lineShift = p.isPlayerTeam ?
                                Math.max(-50, Math.min(50, this.ball.x - 400) * 0.3) :
                                Math.min(50, Math.max(-50, this.ball.x - 400) * 0.3);

                            ballForceX = ((base.x + lineShift) - p.x);
                            ballForceY = (base.y - p.y);
                        }

                        let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                        if (bDist > 0) {
                            ballForceX = (ballForceX / bDist) * 1.0;
                            ballForceY = (ballForceY / bDist) * 1.0;
                        }
                    }
                } else if (isAttacking) {
                    // Attacking support logic
                    if (this.ball.owner) {
                        // Create passing options
                        let idealDist = 100;
                        let distToBall = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);

                        if (distToBall < 40) {
                            // Move away from ball holder to create space
                            ballForceX = (p.x - this.ball.x);
                            ballForceY = (p.y - this.ball.y);
                        } else if (distToBall > 200) {
                            // Come closer
                            ballForceX = (this.ball.x - p.x);
                            ballForceY = (this.ball.y - p.y);
                        } else {
                            // Push forward into space
                            ballForceX = p.isPlayerTeam ? 1.0 : -1.0;
                            // Move towards sidelines slightly to create width
                            if (p.y < 300) ballForceY = -0.5;
                            else ballForceY = 0.5;
                        }

                        // Evade nearest defender to open passing lane
                        const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                        let nearestEnemy = enemies.reduce((nearest, current) => {
                            let dist = Phaser.Math.Distance.Between(p.x, p.y, current.x, current.y);
                            return dist < nearest.dist ? {sprite: current, dist: dist} : nearest;
                        }, {sprite: null, dist: Infinity});

                        if (nearestEnemy.sprite && nearestEnemy.dist < 80) {
                            ballForceX += (p.x - nearestEnemy.sprite.x) * 0.5;
                            ballForceY += (p.y - nearestEnemy.sprite.y) * 0.5;
                        }

                        let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                        if (bDist > 0) {
                            ballForceX = (ballForceX / bDist) * 1.0;
                            ballForceY = (ballForceY / bDist) * 1.0;
                        }
                    } else if (closestToBall === p) {
                        // Loose ball chase
                        ballForceX = (this.ball.x - p.x);
                        ballForceY = (this.ball.y - p.y);
                        let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                        if (bDist > 0) {
                            ballForceX = (ballForceX / bDist) * 2.0;
                            ballForceY = (ballForceY / bDist) * 2.0;
                        }
                    }
                } else {
                    // Loose ball and not closest
                     if (closestToBall === p) {
                         ballForceX = (this.ball.x - p.x);
                         ballForceY = (this.ball.y - p.y);
                         let bDist = Math.sqrt(ballForceX*ballForceX + ballForceY*ballForceY);
                         if (bDist > 0) {
                             ballForceX = (ballForceX / bDist) * 2.0;
                             ballForceY = (ballForceY / bDist) * 2.0;
                         }
                     }
                }
            }

            // 3. Separation Force (Avoid stacking)
            let sepForceX = 0;
            let sepForceY = 0;
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];
            allPlayers.forEach(other => {
                if (other !== p) {
                    const dist = Phaser.Math.Distance.Between(p.x, p.y, other.x, other.y);
                    let desiredRadius = (p.isPlayerTeam === other.isPlayerTeam) ? 35 : 15; // Stay further from teammates than enemies
                    if (dist < desiredRadius) {
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

            // Handle ball Z axis (Height)
            if (this.isHighBall) {
                this.ball.z += this.ballZVelocity;
                this.ballZVelocity -= 1.0; // Gravity
                if (this.ball.z < 0) {
                    this.ball.z = 0;
                    this.isHighBall = false;
                    this.ballZVelocity = 0;
                    // Bouncing could be added here
                }
            } else {
                this.ball.z = 0;
            }

            if (dist < 10 || this.ballSpeed < 0.5) {
                this.ballTarget = null;
                this.ballSpeed = 0;
                this.isHighBall = false;
                this.ball.z = 0;
            } else {
                const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y);
                this.ball.x += Math.cos(angle) * this.ballSpeed;
                this.ball.y += Math.sin(angle) * this.ballSpeed;
                this.ballSpeed *= 0.98;
            }
        } else {
            // Loose ball or dribbling, z is 0
            this.ball.z = 0;
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
        } else if (!this.ball.owner && this.ballTarget && this.isHighBall && this.ball.z > 10 && this.ball.z < 40) {
            // Aerial Duel (競り合い)
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];
            const contenders = allPlayers.filter(p => Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 25);

            if (contenders.length > 0) {
                // Determine winner based on physical/header stats
                let winner = contenders.reduce((best, current) => {
                    let bestStat = best.playerData.stats.physical + (best.playerData.skills.includes(3) ? 20 : 0); // Skill 3 = Aerial/Header
                    let currStat = current.playerData.stats.physical + (current.playerData.skills.includes(3) ? 20 : 0);
                    // Add some randomness
                    return (currStat + Math.random() * 50) > (bestStat + Math.random() * 50) ? current : best;
                }, contenders[0]);

                this.ball.owner = winner;
                this.isHighBall = false;
                this.ball.z = 0;
                this.ballTarget = null;
                // Minor stun for others could be added
            }
        } else if (this.ball.owner) {
            // Ball follows owner
            this.ball.x = this.ball.owner.x + (this.ball.owner.dirX > 0 ? 10 : -10);
            this.ball.y = this.ball.owner.y + 10;

            // Ground Duel (Tackle)
            const enemies = this.ball.owner.isPlayerTeam ? this.opponentSprites : this.playerSprites;
            const tacklers = enemies.filter(p => Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 20);
            if (tacklers.length > 0) {
                let tackler = tacklers[0];
                let tackleStat = tackler.playerData.stats.defense;
                let dribbleStat = this.ball.owner.playerData.stats.dribble;

                // Active buff modifier
                if (this.activeBuff && this.activeBuff.target === 'tackle' && tackler.isPlayerTeam) tackleStat += this.activeBuff.value;
                if (this.activeBuff && this.activeBuff.target === 'dribble' && this.ball.owner.isPlayerTeam) dribbleStat += this.activeBuff.value;

                if (Math.random() * 100 < tackleStat - (dribbleStat / 2)) {
                    // Tackle success
                    this.ball.owner = tackler;
                    // Visual feedback
                    const flash = this.add.circle(this.ball.x, this.ball.y, 15, 0xe74c3c, 0.6);
                    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
                }
            }

            // Decision making (Pass, Shoot, Dribble)
            let forceShoot = false;
            let forceLongBall = false;

            if (this.activeBuff && this.ball.owner.isPlayerTeam) {
                if (['shoot', 'cutInShoot'].includes(this.activeBuff.actionType)) forceShoot = true;
                if (['longBall', 'throughBall', 'switchPlay', 'earlyCross'].includes(this.activeBuff.actionType)) forceLongBall = true;
            }


            // Check pressure for dribble vs pass decision
            let underPressure = false;
            const pressureEnemies = this.ball.owner.isPlayerTeam ? this.opponentSprites : this.playerSprites;
            pressureEnemies.forEach(e => {
                // If enemy is ahead and close
                if (Phaser.Math.Distance.Between(this.ball.x, this.ball.y, e.x, e.y) < 80) {
                    if ((this.ball.owner.isPlayerTeam && e.x > this.ball.x) || (!this.ball.owner.isPlayerTeam && e.x < this.ball.x)) {
                        underPressure = true;
                    }
                }
            });

            // Adjust base chance to act (pass/shoot). If open space, hold ball (dribble).
            const actionChance = underPressure ? 0.15 : 0.01;

            if (forceShoot || forceLongBall || Math.random() < actionChance) {
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

                    // Evaluate passing options
                    // 1. Through ball / Run behind
                    // 2. Forward pass
                    // 3. Side/Switch play
                    // 4. Back pass

                    let targetMate = null;

                    const forwardMates = teammates.filter(p => isPlayer ? p.x > this.ball.owner.x + 20 : p.x < this.ball.owner.x - 20);
                    const sideMates = teammates.filter(p => Math.abs(p.x - this.ball.owner.x) <= 20);
                    const backMates = teammates.filter(p => isPlayer ? p.x < this.ball.owner.x : p.x > this.ball.owner.x);

                    const teamManager = isPlayer ? window.MasterData.Managers.find(m => m.id === window.gameState.playerTeam.managerId) : window.MasterData.Managers.find(m => m.id === managementUI.getNextOpponent().managerId);
                    const tactic = teamManager ? teamManager.preference : (isPlayer ? window.gameState.playerTeam.tactics : managementUI.getNextOpponent().tactics);

                    // Decide pass type based on tactics and situation
                    let isLongBall = forceLongBall || (Math.random() < (tactic === 'Counter' ? 0.3 : 0.05));
                    let isSwitchPlay = Math.random() < 0.1;
                    let isThroughBall = Math.random() < 0.15;
                    let isBackPass = Math.random() < (tactic === 'Possession' ? 0.2 : 0.05);

                    if (isThroughBall && forwardMates.length > 0) {
                        // Find the most advanced player
                        targetMate = forwardMates.reduce((furthest, p) =>
                            (isPlayer ? p.x > furthest.x : p.x < furthest.x) ? p : furthest
                        , forwardMates[0]);
                        isLongBall = true;
                    } else if (isSwitchPlay && teammates.length > 0) {
                        // Find player on opposite side (Y axis)
                        let myY = this.ball.owner.y;
                        targetMate = teammates.sort((a,b) => Math.abs(b.y - myY) - Math.abs(a.y - myY))[0];
                        isLongBall = true;
                    } else if (isBackPass && backMates.length > 0) {
                        targetMate = backMates[Math.floor(Math.random() * backMates.length)];
                        isLongBall = false;
                    } else if (forwardMates.length > 0) {
                        // Pass to the nearest forward teammate for better short passing play
                        targetMate = forwardMates.reduce((nearest, p) => {
                            let dist = Phaser.Math.Distance.Between(this.ball.owner.x, this.ball.owner.y, p.x, p.y);
                            return dist < nearest.dist ? {sprite: p, dist: dist} : nearest;
                        }, {sprite: null, dist: Infinity}).sprite;
                    } else if (sideMates.length > 0) {
                        // Pass to the nearest side teammate
                        targetMate = sideMates.reduce((nearest, p) => {
                            let dist = Phaser.Math.Distance.Between(this.ball.owner.x, this.ball.owner.y, p.x, p.y);
                            return dist < nearest.dist ? {sprite: p, dist: dist} : nearest;
                        }, {sprite: null, dist: Infinity}).sprite;
                    } else {
                        targetMate = teammates[0];
                    }

                    let passStat = this.ball.owner.playerData.dynamicStats.pass;
                    if (isPlayer && this.activeBuff && this.activeBuff.target === 'pass') passStat += this.activeBuff.value;

                    if (this.currentGimmick === 'badWeather') {
                        passStat -= 20;
                        if (isLongBall) passStat += 30; // Weather gimmick favors long balls
                    }

                    // Visual Kick Effect
                    this.createKickEffect(this.ball.x, this.ball.y);

                    if (isLongBall) {
                        // Lead the player forward if through ball
                        let leadDist = isThroughBall ? (isPlayer ? 100 : -100) : 0;
                        this.ballTarget = {x: targetMate.x + leadDist, y: targetMate.y};
                        this.ballSpeed = 22;
                        this.isHighBall = true;
                        this.ballZVelocity = 15; // Initial upward speed
                    } else {
                        this.ballTarget = {x: targetMate.x, y: targetMate.y};
                        this.ballSpeed = 16;
                        this.isHighBall = false;
                    }

                    // Inaccuracy
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
        // Update visual drawing order (Z-index) based on Y position
        this.playerSprites.forEach(p => { p.setDepth(p.y); });
        this.opponentSprites.forEach(p => { p.setDepth(p.y); });
        if (this.ballContainer) {
            this.ballContainer.setDepth(this.ball.y);
        }

        if (this.ballContainer) {
            this.ballContainer.x = this.ball.x;
            this.ballContainer.y = this.ball.y - this.ball.z; // Apply Z height visually

            // Adjust shadow based on height
            const shadow = this.ballContainer.list[0];
            if (shadow) {
                shadow.y = 8 + this.ball.z;
                let scale = Math.max(0.2, 1 - (this.ball.z / 100));
                shadow.scaleX = scale;
                shadow.scaleY = scale;
                shadow.alpha = Math.max(0.1, 0.3 - (this.ball.z / 200));
            }

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
        this.playerSprites.forEach(p => {
            if (p.baseX) { p.x = p.baseX; p.y = p.baseY; }
            else { p.x = Phaser.Math.Between(50, 350); p.y = Phaser.Math.Between(50, 550); }
        });
        this.opponentSprites.forEach(p => {
            if (p.baseX) { p.x = p.baseX; p.y = p.baseY; }
            else { p.x = Phaser.Math.Between(450, 750); p.y = Phaser.Math.Between(50, 550); }
        });

        this.ball.x = 400;
        this.ball.y = 300;

        // Determine kicking team (alternates or based on goal)
        // For simplicity, team that conceded kicks off. If score is tied or start of match, random or player team.
        const isPlayerKickoff = (this.score.player + this.score.opponent) % 2 === 0;

        let kickOffTeam = isPlayerKickoff ? this.playerSprites : this.opponentSprites;
        let striker = kickOffTeam.find(p => p.playerData.position === 'CF') || kickOffTeam[kickOffTeam.length - 1];

        striker.x = 400 - (isPlayerKickoff ? 10 : -10);
        striker.y = 300;

        this.ball.owner = striker;
        this.matchState = 'kickoff';
        this.kickoffTimer = 20; // 20 ticks delay
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
window.startGame = startGame;
