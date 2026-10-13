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
        this.ball = { x: 400, y: 300, z: 0, owner: null }; this.lastTouchedByPlayerTeam = true; // owner is a sprite or null

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

    getPitchZone(x, y, isPlayerTeam) {
        // X-axis: 3 Thirds (Player team attacks left-to-right by default)
        // Def Third: 0-266, Mid Third: 266-533, Att Third: 533-800
        // If opponent team, direction is reversed
        let third = '';
        if (isPlayerTeam) {
            if (x < 266) third = 'Defensive';
            else if (x < 533) third = 'Middle';
            else third = 'Attacking';
        } else {
            if (x > 533) third = 'Defensive';
            else if (x > 266) third = 'Middle';
            else third = 'Attacking';
        }

        // Y-axis: 5 Lanes (0-600)
        // Left Outside: 0-120
        // Left Half-space: 120-240
        // Center: 240-360
        // Right Half-space: 360-480
        // Right Outside: 480-600
        let lane = '';
        // Assuming team attacking right, top (y=0) is Left, bottom (y=600) is Right
        // For opponent attacking left, top is Right, bottom is Left
        let viewY = isPlayerTeam ? y : 600 - y;

        if (viewY < 120) lane = 'Left Outside';
        else if (viewY < 240) lane = 'Left Half-space';
        else if (viewY < 360) lane = 'Center';
        else if (viewY < 480) lane = 'Right Half-space';
        else lane = 'Right Outside';

        return { third, lane };
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
            case 'CF': x = 400 + dir * 50; y = 300; break; // Corrected from - dir * 50 to ensure they are in their own half
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

        // AI Tick Logic (Utility AI Delay)
        container.aiTickTimer = 0;
        container.mentalTickRate = Math.max(1, 10 - Math.floor((player.stats ? player.stats.mental : 50) / 10));

        // AI Tick handling based on mental
        // Base AI update is 100ms. If Mental = 100, updates every tick (1). If Mental = 0, updates every 10 ticks.
        let mentalStat = player.dynamicStats ? player.dynamicStats.mental : player.stats.mental;
        container.mentalTickRate = Math.max(1, Math.floor(10 - (mentalStat / 10)));
        container.aiTickTimer = Math.floor(Math.random() * container.mentalTickRate);

        // Cached forces for inertia
        container.lastForceX = 0;
        container.lastForceY = 0;

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
                if (this.ball.owner) {
                    const isPlayer = this.ball.owner.isPlayerTeam;
                    const teammates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(p => p !== this.ball.owner);
                    const backMates = teammates.filter(p => isPlayer ? p.x < this.ball.owner.x - 10 : p.x > this.ball.owner.x + 10);
                    let targetMate = backMates.length > 0 ? backMates[Math.floor(Math.random() * backMates.length)] : teammates[0];
                    this.ballTarget = {x: targetMate.x, y: targetMate.y};
                    this.ballSpeed = 15;
                    this.isHighBall = false;
                    this.ball.owner = null;
                }
            }
        } else if (this.matchState === 'setpiece') {
            if (this.kickoffTimer > 0) {
                this.kickoffTimer -= 1;
            } else {
                this.matchState = 'playing';
                // Remove visual feedback if any
                if (this.setpieceText) {
                    this.setpieceText.destroy();
                    this.setpieceText = null;
                }
            }
        }

        if (this.matchState === 'playing') {
            this.simulateAction();
            this.checkBallOut();
        }

        // End Game
        if (this.matchTime >= 90) {
            this.logicTimer.remove();
            this.endMatch(this.score.player, this.score.opponent);
        }
    }

    checkBallOut() {
        const leftBound = 10; const rightBound = 790; const topBound = 10; const bottomBound = 590;
        let isOut = false; let type = ''; let restartX = this.ball.x; let restartY = this.ball.y;
        let isPlayerTeamBall = !this.lastTouchedByPlayerTeam;

        if (this.ball.y < topBound) {
            isOut = true; type = 'Throw In'; restartY = topBound + 5;
        } else if (this.ball.y > bottomBound) {
            isOut = true; type = 'Throw In'; restartY = bottomBound - 5;
        }

        if (!isOut && this.ball.x < leftBound) {
            isOut = true;
            if (this.ball.y >= 260 && this.ball.y <= 340 && this.ball.z <= 30) {
                 this.triggerGoal(false); this.resetPositions(); return;
            } else {
                if (!this.lastTouchedByPlayerTeam) {
                    type = 'Goal Kick'; restartX = 50; restartY = 300; isPlayerTeamBall = true;
                } else {
                    type = 'Corner Kick'; restartX = leftBound; restartY = this.ball.y < 300 ? topBound : bottomBound; isPlayerTeamBall = false;
                }
            }
        } else if (!isOut && this.ball.x > rightBound) {
            isOut = true;
            if (this.ball.y >= 260 && this.ball.y <= 340 && this.ball.z <= 30) {
                 this.triggerGoal(true); this.resetPositions(); return;
            } else {
                if (this.lastTouchedByPlayerTeam) {
                    type = 'Goal Kick'; restartX = 750; restartY = 300; isPlayerTeamBall = false;
                } else {
                    type = 'Corner Kick'; restartX = rightBound; restartY = this.ball.y < 300 ? topBound : bottomBound; isPlayerTeamBall = true;
                }
            }
        }

        if (isOut) {
            this.handleSetPiece(type, restartX, restartY, isPlayerTeamBall);
        }
    }

    handleSetPiece(type, x, y, isPlayerTeam) {
        this.matchState = 'setpiece';
        this.kickoffTimer = 30; // 3 seconds wait

        this.ball.x = x;
        this.ball.y = y;
        this.ball.z = 0;
        this.ballSpeed = 0;
        this.ballTarget = null;
        this.ball.owner = null;

        // Visual Text
        let color = isPlayerTeam ? '#3498db' : '#e74c3c';
        this.setpieceText = this.add.text(400, 300, type, { fontSize: '48px', fill: color, fontStyle: 'bold', backgroundColor: '#00000088' }).setOrigin(0.5);

        // Move nearest player to take it
        let team = isPlayerTeam ? this.playerSprites : this.opponentSprites;
        let taker = team.sort((a,b) => Phaser.Math.Distance.Between(a.x, a.y, x, y) - Phaser.Math.Distance.Between(b.x, b.y, x, y))[0];

        if (taker) {
            taker.x = x + (x < 400 ? 5 : -5);
            taker.y = y + (y < 300 ? 5 : -5);
            this.ball.owner = taker;
        }

        // Push others slightly away from ball to give space
        [...this.playerSprites, ...this.opponentSprites].forEach(p => {
             if (p !== taker && Phaser.Math.Distance.Between(p.x, p.y, x, y) < 80) {
                 let angle = Phaser.Math.Angle.Between(x, y, p.x, p.y);
                 p.x = x + Math.cos(angle) * 80;
                 p.y = y + Math.sin(angle) * 80;
             }
        });
    }

    calculateThreat(x, y, isPlayerTeam) {
        const goalX = isPlayerTeam ? 800 : 0;
        const dist = Phaser.Math.Distance.Between(x, y, goalX, 300);
        let threat = Math.max(0, 100 - (dist / 8));
        threat += Math.max(0, 30 - Math.abs(y - 300) / 10);
        return threat;
    }

    calculatePassRisk(startX, startY, targetX, targetY, isPlayerTeam) {
        const enemies = isPlayerTeam ? this.opponentSprites : this.playerSprites;
        let risk = Phaser.Math.Distance.Between(startX, startY, targetX, targetY) / 10;
        const dist = risk * 10;
        enemies.forEach(enemy => {
            if (dist === 0) return;
            const t = ((enemy.x - startX) * (targetX - startX) + (enemy.y - startY) * (targetY - startY)) / (dist * dist);
            if (t >= 0 && t <= 1) {
                const projX = startX + t * (targetX - startX);
                const projY = startY + t * (targetY - startY);
                const distToLine = Phaser.Math.Distance.Between(enemy.x, enemy.y, projX, projY);
                if (distToLine < 40) risk += 50 * (1 - distToLine / 40);
            }
        });
        return Math.min(100, risk);
    }

    evaluateActions(p, context) {
        let actionScores = { Keep: 0, Dribble: 0, Pass: 0, Shoot: 0, Clear: 0, Support: 0, RunIntoSpace: 0, HoldPosition: 0, Press: 0, Mark: 0, Cover: 0, Delay: 0, Retreat: 0 };
        const pos = p.playerData.position; const role = p.playerData.role; const tactic = context.tactic;
        const isAttacking = context.isAttacking; const hasBall = context.hasBall; const pitchZone = this.getPitchZone(p.x, p.y, p.isPlayerTeam);
        const currentThreat = this.calculateThreat(p.x, p.y, p.isPlayerTeam);
        const staminaFactor = Math.max(0.3, p.playerData.currentStamina / 100);

        if (hasBall) {
            const goalX = p.isPlayerTeam ? 800 : 0;
            const distToGoal = Phaser.Math.Distance.Between(p.x, p.y, goalX, 300);
            if (distToGoal < 250) {
                actionScores.Shoot = currentThreat * 1.5;
                actionScores.Shoot -= this.calculatePassRisk(p.x, p.y, goalX, 300, p.isPlayerTeam) * 0.8;
            }

            const teammates = (p.isPlayerTeam ? this.playerSprites : this.opponentSprites).filter(mate => mate !== p);
            let bestPassScore = -Infinity; let bestPassTarget = null;
            teammates.forEach(mate => {
                const mateThreat = this.calculateThreat(mate.x, mate.y, p.isPlayerTeam);
                const passRisk = this.calculatePassRisk(p.x, p.y, mate.x, mate.y, p.isPlayerTeam);
                let passScore = mateThreat * 1.2 - passRisk * 1.5;
                if (tactic === 'Possession' && passRisk < 30) passScore += 20;
                if (tactic === 'Counter' && mateThreat > currentThreat) passScore += 30;
                if (passScore > bestPassScore) { bestPassScore = passScore; bestPassTarget = mate; }
            });
            actionScores.Pass = bestPassScore; context.bestPassTarget = bestPassTarget;

            const dir = p.isPlayerTeam ? 1 : -1;
            const dribbleTargetX = p.x + dir * 50;
            actionScores.Dribble = this.calculateThreat(dribbleTargetX, p.y, p.isPlayerTeam) - this.calculatePassRisk(p.x, p.y, dribbleTargetX, p.y, p.isPlayerTeam);
            if (pos === 'WG' || role === 'Ball-Playing') actionScores.Dribble += 20;

            if (pitchZone.third === 'Defensive' && this.calculatePassRisk(p.x, p.y, p.x + 10, p.y, p.isPlayerTeam) > 50) actionScores.Clear = 75;
            actionScores.Keep = 10;
        } else if (isAttacking) {
            const dir = p.isPlayerTeam ? 1 : -1;
            const forwardX = p.x + dir * 80;
            let laneRisk = this.ball.owner && this.ball.owner.isPlayerTeam === p.isPlayerTeam ? this.calculatePassRisk(this.ball.owner.x, this.ball.owner.y, forwardX, p.y, p.isPlayerTeam) : 100;
            actionScores.RunIntoSpace = this.calculateThreat(forwardX, p.y, p.isPlayerTeam) - (laneRisk * 0.5);
            if (pos === 'WG' || pos === 'CF' || role === 'Attacking') actionScores.RunIntoSpace += 30;

            if (this.ball.owner && this.ball.owner.isPlayerTeam === p.isPlayerTeam) {
                const distToBall = Phaser.Math.Distance.Between(p.x, p.y, this.ball.owner.x, this.ball.owner.y);
                if (distToBall > 100 && distToBall < 250) {
                    actionScores.Support = 80 - this.calculatePassRisk(this.ball.owner.x, this.ball.owner.y, p.x, p.y, p.isPlayerTeam);
                }
            }
            actionScores.HoldPosition = 40;
        } else {
            const teammates = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
            let closestDist = Infinity; let closestMate = null;
            teammates.forEach(mate => {
                const dist = Phaser.Math.Distance.Between(mate.x, mate.y, this.ball.x, this.ball.y);
                if (dist < closestDist) { closestDist = dist; closestMate = mate; }
            });
            const isFirstDefender = (closestMate === p);

            const ballThreat = this.calculateThreat(this.ball.x, this.ball.y, !p.isPlayerTeam);
            const distToBall = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);

            actionScores.Press = ballThreat * 1.2 - (distToBall / 5);
            if (tactic === 'HighPress') actionScores.Press += 40;
            if (isFirstDefender && distToBall < 300) actionScores.Press += 100;

            actionScores.Mark = 50;
            const goalX = p.isPlayerTeam ? 0 : 800;
            const distToOwnGoal = Phaser.Math.Distance.Between(p.x, p.y, goalX, 300);

            if (Phaser.Math.Distance.Between(this.ball.x, this.ball.y, goalX, 300) < distToOwnGoal) {
                actionScores.Retreat = 100;
                if (isFirstDefender && distToBall < 100) actionScores.Press += 50;
            } else {
                actionScores.Retreat = 50 - (distToOwnGoal / 10);
            }
            if (pos === 'CB' || pos === 'SB') { actionScores.Retreat += 30; actionScores.Delay += 20; }
        }

        for (let key in actionScores) {
            actionScores[key] *= staminaFactor;
            actionScores[key] += Math.random() * (10 + (1 - staminaFactor) * 20);
        }

        let targetLineX = null;
        if (!isAttacking && !hasBall && (pos === 'CB' || pos === 'SB')) {
            const myTeam = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
            const cbs = myTeam.filter(mate => mate.playerData.position === 'CB');
            if (cbs.length > 0) targetLineX = cbs.sort((a,b) => p.isPlayerTeam ? a.x - b.x : b.x - a.x)[0].x;
        }

        let bestAction = 'HoldPosition'; let maxScore = -Infinity;
        const validActions = hasBall ? ['Keep', 'Dribble', 'Pass', 'Shoot', 'Clear'] : (isAttacking ? ['Support', 'RunIntoSpace', 'HoldPosition'] : ['Press', 'Mark', 'Cover', 'Delay', 'Retreat']);

        validActions.forEach(action => {
            let score = actionScores[action];
            if (targetLineX !== null) {
                let distToLine = Math.abs(p.x - targetLineX);
                if (distToLine > 30) {
                    if (action === 'HoldPosition' || action === 'Retreat' || action === 'Delay') score += (distToLine * 0.8);
                    if (action === 'Press' || action === 'Mark') score -= (distToLine * 0.8);
                }
            }
            if (score > maxScore) { maxScore = score; bestAction = action; }
        });

        return { action: bestAction, score: maxScore, targetLineX: targetLineX };
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
            let moved = false;

            p.aiTickTimer++;

            const hasBall = this.ball.owner === p;

            // Re-calculate mentalTickRate based on stamina fatigue (IQ Drop)
            let mentalStat = p.playerData.dynamicStats ? p.playerData.dynamicStats.mental : p.playerData.stats.mental;
            const staminaFactor = Math.max(0.3, p.playerData.currentStamina / 100);

            // IQ Drop: Lower stamina decreases mental logic speed
            mentalStat = mentalStat * staminaFactor;
            p.mentalTickRate = Math.max(1, Math.floor(10 - (mentalStat / 10)));

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

            let forceX = 0;
            let forceY = 0;

            // Only run heavy AI decisions if it's their tick, or they have the ball (need high responsiveness)
            if (p.aiTickTimer >= p.mentalTickRate || hasBall) {
                p.aiTickTimer = 0;

                // Evaluate Actions
                const context = { tactic, isAttacking, hasBall };
                const evaluation = this.evaluateActions(p, context);
                const bestAction = evaluation.action;
                p.currentAction = bestAction;
                p.lastEvaluation = { bestPassTarget: context.bestPassTarget, targetLineX: evaluation.targetLineX }; // store for debug/render

                // Translate Action to Force Vectors
                let targetX = p.x;
                let targetY = p.y;
                const dir = p.isPlayerTeam ? 1 : -1;
                const base = this.getBasePosition(p.expectedPosStr || p.playerData.position, p.isPlayerTeam);
                if (p.baseOffsetY) base.y += p.baseOffsetY;

                switch (bestAction) {
                    case 'HoldPosition':
                        targetX = (evaluation.targetLineX !== null) ? evaluation.targetLineX : base.x;
                        targetY = Phaser.Math.Linear(base.y, this.ball.y, 0.2);
                        break;
                    case 'RunIntoSpace':
                        let targetForwardX = p.x + (dir * 80);
                        let offsideLineX = p.isPlayerTeam ? 800 : 0;
                        if (p.isPlayerTeam && p.x > 400) {
                            let oppDefenders = [...this.opponentSprites].sort((a, b) => b.x - a.x);
                            if (oppDefenders.length > 1) offsideLineX = oppDefenders[1].x - 5;
                        } else if (!p.isPlayerTeam && p.x < 400) {
                            let playerDefenders = [...this.playerSprites].sort((a, b) => a.x - b.x);
                            if (playerDefenders.length > 1) offsideLineX = playerDefenders[1].x + 5;
                        }
                        if (p.isPlayerTeam && targetForwardX > offsideLineX && offsideLineX > p.x) targetForwardX = offsideLineX;
                        if (!p.isPlayerTeam && targetForwardX < offsideLineX && offsideLineX < p.x) targetForwardX = offsideLineX;
                        targetX = targetForwardX;
                        targetY = p.y + (300 - p.y) * 0.1;
                        break;
                    case 'Support':
                        if (this.ball.owner) {
                            let safeAngle = Phaser.Math.Angle.Between(this.ball.owner.x, this.ball.owner.y, p.x, p.y);
                            const idealDist = 180;
                            targetX = this.ball.owner.x + Math.cos(safeAngle) * idealDist;
                            targetY = this.ball.owner.y + Math.sin(safeAngle) * idealDist;
                            if (Phaser.Math.Distance.Between(p.x, p.y, this.ball.owner.x, this.ball.owner.y) > idealDist + 50) {
                                targetX = p.x + Math.cos(safeAngle - Math.PI) * 50; targetY = p.y + Math.sin(safeAngle - Math.PI) * 50;
                            }
                        } else { targetX = p.x; targetY = p.y; }
                        break;
                    case 'Retreat':
                    case 'Delay':
                        targetX = (p.lastEvaluation && p.lastEvaluation.targetLineX !== null) ? p.lastEvaluation.targetLineX : base.x - (dir * 100);
                        let pullWeight = (this.ball.y < 300 !== base.y < 300 && Math.abs(base.y - 300) > 100) ? 0.1 : 0.5;
                        targetY = Phaser.Math.Linear(base.y, this.ball.y, pullWeight);
                        break;
                    case 'Press':
                    case 'Clear':
                        if (this.ball.owner) { targetX = this.ball.x + (this.ball.owner.dirX * 20); targetY = this.ball.y; }
                        else { targetX = this.ball.x; targetY = this.ball.y; }
                        break;
                    case 'Mark':
                        const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                        let nearestEnemy = enemies.reduce((n, e) => Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < n.d ? {s: e, d: Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y)} : n, {s: null, d: Infinity});
                        if (nearestEnemy.s) {
                            const markAngle = Phaser.Math.Angle.Between(nearestEnemy.s.x, nearestEnemy.s.y, p.isPlayerTeam ? 0 : 800, 300);
                            targetX = nearestEnemy.s.x + Math.cos(markAngle) * 30; targetY = nearestEnemy.s.y + Math.sin(markAngle) * 30;
                        } else { targetX = p.x; targetY = p.y; }
                        break;
                    case 'Dribble':
                        targetX = p.x + (dir * 80); targetY = 300;
                        const opps = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                        for(let o of opps) { if (Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < 60) { targetY += (p.y < o.y) ? -40 : 40; break; } }
                        break;
                    case 'Cover':
                        targetX = base.x - (dir * 50); targetY = Phaser.Math.Linear(base.y, this.ball.y, 0.4);
                        break;
                    default:
                        targetX = p.x;
                        targetY = p.y;
                }

                forceX = targetX - p.x;
                forceY = targetY - p.y;

                // 3. Separation Force (Avoid stacking)
                let sepForceX = 0; let sepForceY = 0;
                const allPlayers = [...this.playerSprites, ...this.opponentSprites];
                allPlayers.forEach(other => {
                    if (other !== p) {
                        const dist = Phaser.Math.Distance.Between(p.x, p.y, other.x, other.y);
                        let desiredRadius = (p.isPlayerTeam === other.isPlayerTeam) ? 80 : 25;
                        if (p.isPlayerTeam === other.isPlayerTeam && (p.playerData.position === 'CB' || p.playerData.position === 'SB') && (other.playerData.position === 'CB' || other.playerData.position === 'SB')) desiredRadius = 60;
                        if (dist < desiredRadius && dist > 0) {
                            const forceScale = (desiredRadius - dist) / desiredRadius;
                            sepForceX += ((p.x - other.x) / dist) * forceScale * 30;
                            sepForceY += ((p.y - other.y) / dist) * forceScale * 30;
                        }
                    }
                });

                // Combine forces
                let totalForceX = forceX + sepForceX;
                let totalForceY = forceY + sepForceY;

                // Add minor ball attraction for loose balls if no one owns it to avoid stagnation
                if (!this.ball.owner && !this.ballTarget) {
                     const bDist = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                     if (bDist < 100) {
                         totalForceX += (this.ball.x - p.x) / bDist * 3;
                         totalForceY += (this.ball.y - p.y) / bDist * 3;
                     }
                }

                p.lastForceX = totalForceX;
                p.lastForceY = totalForceY;
            }

            let totalForceX = p.lastForceX;
            let totalForceY = p.lastForceY;

            // Apply speed limit & stamina drain (Runs every physical tick)
            let totalMagnitude = Math.sqrt(totalForceX*totalForceX + totalForceY*totalForceY);
            if (totalMagnitude > 0) {
                let actualSpeed = Math.min(totalMagnitude, maxSpeed);

                // Movement stamina drain
                let drainRate = 0;
                if (actualSpeed > 1.5) {
                    drainRate = 0.08; // Sprinting
                } else if (actualSpeed > 0.5) {
                    drainRate = 0.02; // Jogging
                }

                // Sharp turn penalty
                if (p.lastSpeedX !== undefined) {
                    const currentVelX = (totalForceX / totalMagnitude) * actualSpeed;
                    const currentVelY = (totalForceY / totalMagnitude) * actualSpeed;
                    const turnDiff = Math.abs(currentVelX - p.lastSpeedX) + Math.abs(currentVelY - p.lastSpeedY);
                    if (turnDiff > 2.0) {
                        drainRate += 0.05; // Sharp turn drain
                    }
                    p.lastSpeedX = currentVelX;
                    p.lastSpeedY = currentVelY;
                } else {
                    p.lastSpeedX = (totalForceX / totalMagnitude) * actualSpeed;
                    p.lastSpeedY = (totalForceY / totalMagnitude) * actualSpeed;
                }

                p.playerData.currentStamina -= (drainRate * (100 / p.playerData.stats.stamina));

                // Prevent stamina from dropping below 1 to avoid divide by zero later, though we clamp it
                if (p.playerData.currentStamina < 1) p.playerData.currentStamina = 1;

                p.x += (totalForceX / totalMagnitude) * actualSpeed;
                p.y += (totalForceY / totalMagnitude) * actualSpeed;
                moved = actualSpeed > 0.1;
            } else {
                // Passive recovery when standing still
                p.playerData.currentStamina = Math.min(100, p.playerData.currentStamina + 0.05);
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
        if (this.ballTarget || this.ballSpeed > 0) {
            // Ball is moving towards a target or rolling loose
            let targetX = this.ballTarget ? this.ballTarget.x : this.ball.x + Math.cos(this.ball.angle || 0) * 100;
            let targetY = this.ballTarget ? this.ballTarget.y : this.ball.y + Math.sin(this.ball.angle || 0) * 100;

            const dist = this.ballTarget ? Phaser.Math.Distance.Between(this.ball.x, this.ball.y, targetX, targetY) : Infinity;

            // Z-axis Physics (Bounce, Gravity)
            let isBouncing = false;
            if (this.isHighBall) {
                this.ball.z += this.ballZVelocity;
                this.ballZVelocity -= 1.5; // Gravity pull

                if (this.ball.z <= 0) {
                    this.ball.z = 0;
                    // Bouncing physics
                    if (this.ballZVelocity < -5) {
                        this.ballZVelocity = Math.abs(this.ballZVelocity) * (this.currentGimmick === 'badWeather' ? 0.3 : 0.6); // dampening
                        isBouncing = true;
                    } else {
                        this.isHighBall = false;
                        this.ballZVelocity = 0;
                    }
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
                const angle = this.ballTarget ? Phaser.Math.Angle.Between(this.ball.x, this.ball.y, targetX, targetY) : (this.ball.angle || 0);
                this.ball.angle = angle; // Store angle for loose balls
                this.ball.x += Math.cos(angle) * this.ballSpeed;
                this.ball.y += Math.sin(angle) * this.ballSpeed;

                // Friction
                let friction = (this.currentGimmick === 'badWeather') ? 0.98 : 0.94; // slides more in rain
                if (this.isHighBall && !isBouncing) friction = 0.99; // air resistance is low
                this.ballSpeed *= friction;
            }
        } else {
            // Stationary loose ball or dribbling, z is 0
            if (!this.isHighBall) this.ball.z = 0;
        }

        // Intercept logic for loose or passing balls
        if (!this.ball.owner) {
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];

            // Check for interceptions based on Z-axis capabilities
            let interceptor = null;

            for (let p of allPlayers) {
                const bDist = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);

                // Base interception radius
                let interceptRadius = 20;
                if (this.activeBuff && this.activeBuff.target === 'intercept' && p.isPlayerTeam) interceptRadius += 20;

                // GK Special Rules in PA
                let zLimit = 15; // Normal player jump/reach limit
                if (p.playerData.position === 'GK') {
                    // Check if inside PA
                    const isPlayerSidePA = p.isPlayerTeam && p.x < 160 && p.y > 150 && p.y < 450;
                    const isOppSidePA = !p.isPlayerTeam && p.x > 640 && p.y > 150 && p.y < 450;

                    if (isPlayerSidePA || isOppSidePA) {
                        interceptRadius = 40; // Hand reach X/Y
                        zLimit = 40; // Hand reach Z
                    }
                }

                if (bDist < interceptRadius && this.ball.z <= zLimit) {
                    interceptor = p;
                    break;
                }
            }

            if (interceptor) {
                // First Touch / Trap calculation with environmental factors
                let trapChance = (interceptor.playerData.dynamicStats.mental * 0.5) + (interceptor.playerData.dynamicStats.pass * 0.5);

                // Penalty for fast balls or high balls
                if (this.ballSpeed > 15) trapChance -= 10;
                if (this.isHighBall) trapChance -= 15;
                if (this.currentGimmick === 'badWeather') trapChance -= 20;

                // GK catching logic
                if (interceptor.playerData.position === 'GK') {
                    trapChance += 30; // Handling bonus
                }

                if (Math.random() * 100 > trapChance && this.ballSpeed > 5) {
                    // Trap Miss / Punching (if GK)
                    this.lastTouchedByPlayerTeam = interceptor.isPlayerTeam;
                    this.ball.owner = null;
                    this.ballTarget = null;
                    this.ballSpeed = this.ballSpeed * 0.5; // Loses some speed
                    this.ball.angle = this.ball.angle + (Math.random() * Math.PI - Math.PI/2); // Deflects randomly
                    this.isHighBall = true;
                    this.ballZVelocity = 5;
                } else {
                    // Success
                    this.ball.owner = interceptor;
                    this.lastTouchedByPlayerTeam = interceptor.isPlayerTeam;
                    this.ballTarget = null;
                    this.isHighBall = false;
                    this.ball.z = 0;
                }
            }
        }

        if (this.ball.owner) {
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
                    this.lastTouchedByPlayerTeam = tackler.isPlayerTeam;
                    // Visual feedback
                    const flash = this.add.circle(this.ball.x, this.ball.y, 15, 0xe74c3c, 0.6);
                    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
                } else if (Math.random() * 100 < (tackleStat / 3)) {
                    // Foul
                    this.ball.owner = null;
                    this.ballSpeed = 0;
                    // Simplified PK check (within X: 10-160/640-790, Y: 150-450)
                    const isPK = (this.ball.y > 150 && this.ball.y < 450) && ((tackler.isPlayerTeam && this.ball.x < 160) || (!tackler.isPlayerTeam && this.ball.x > 640));
                    this.handleSetPiece(isPK ? 'Penalty Kick' : 'Free Kick', this.ball.x, this.ball.y, !tackler.isPlayerTeam);
                    return;
                }
            }

            // Execute AI Decision (Pass, Shoot, Clear)
            // 'Dribble' and 'Keep' are handled by movement logic.
            // If action is Pass/Shoot/Clear, trigger the execution here.
            let forceShoot = false;
            let forceLongBall = false;

            if (this.activeBuff && this.ball.owner.isPlayerTeam) {
                if (['shoot', 'cutInShoot'].includes(this.activeBuff.actionType)) forceShoot = true;
                if (['longBall', 'throughBall', 'switchPlay', 'earlyCross'].includes(this.activeBuff.actionType)) forceLongBall = true;
            }

            const currentAction = this.ball.owner.currentAction;

            // Execute action if dictated by AI or Forced by Command
            if (forceShoot || forceLongBall || ['Pass', 'Shoot', 'Clear'].includes(currentAction)) {
                const isPlayer = this.ball.owner.isPlayerTeam;
                const targetGoalX = isPlayer ? 800 : 0;
                const distToGoal = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, targetGoalX, 300);

                // Shoot Logic
                if (forceShoot || currentAction === 'Shoot') {
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
                        // Successful shot, target is within goal frame
                        this.ballTarget = {x: isPlayer ? 850 : -50, y: Phaser.Math.Between(265, 335)};
                    } else {
                        // Missed shot or saved, deflect it away or catch it
                        if (Math.random() > 0.5) {
                            // Saved (catch) - simplifed by giving to GK or resetting near goal
                            this.ballTarget = {x: isPlayer ? 780 : 20, y: 300};
                            this.ballSpeed = 10;
                        } else {
                            // Miss wide
                            this.ballTarget = {x: isPlayer ? 850 : -50, y: Math.random() > 0.5 ? 200 : 400};
                        }
                    }
                }
                // Clear Logic
                else if (currentAction === 'Clear') {
                    this.createKickEffect(this.ball.x, this.ball.y);
                    this.ballTarget = {x: isPlayer ? 800 : 0, y: Math.random() * 600};
                    this.ballSpeed = 25;
                    this.isHighBall = true;
                    this.ballZVelocity = 20;
                    this.ball.owner = null;
                }
                // Pass Logic
                else {
                    const teammates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(p => p !== this.ball.owner);
                    let targetMate = this.ball.owner.lastEvaluation ? this.ball.owner.lastEvaluation.bestPassTarget : teammates[0];
                    if (!targetMate) targetMate = teammates[0];

                    let isForward = isPlayer ? targetMate.x > this.ball.owner.x : targetMate.x < this.ball.owner.x;
                    let isLongDist = Math.abs(targetMate.x - this.ball.owner.x) > 150 || Math.abs(targetMate.y - this.ball.owner.y) > 150;
                    let isLongBall = forceLongBall || (isForward && isLongDist);
                    let isThroughBall = isForward && isLongDist && targetMate.playerData.position === 'CF';

                    let passStat = this.ball.owner.playerData.dynamicStats.pass;
                    if (isPlayer && this.activeBuff && this.activeBuff.target === 'pass') passStat += this.activeBuff.value;
                    const staminaFactor = Math.max(0.3, this.ball.owner.playerData.currentStamina / 100);
                    let effectivePassStat = passStat * staminaFactor;
                    if (this.currentGimmick === 'badWeather') { effectivePassStat -= 20; if (isLongBall) effectivePassStat += 30; }

                    if (Math.random() * 100 > effectivePassStat) {
                        // Inaccuracy handled later in block naturally
                    }

                    // Visual Kick Effect
                    this.createKickEffect(this.ball.x, this.ball.y);

                    // Offside check (Only applies in opponent's half)
                    let isOffside = false;
                    if (isPlayer) {
                        // Player attacks Right (X=800).
                        // Offside only applies in the opponent's half
                        if (targetMate.x > 400) {
                            // Sort all opponent players by their X coordinate, closest to their goal line (X=800) first
                            let oppDefenders = [...this.opponentSprites].sort((a, b) => b.x - a.x);
                            // The offside line is the 2nd-to-last defender (index 1)
                            if (oppDefenders.length > 1) {
                                let offsideLine = oppDefenders[1].x;

                                // To be offside:
                                // 1. Target must be ahead of the ball
                                // 2. Target must be ahead of the offside line
                                if (targetMate.x > this.ball.x && targetMate.x > offsideLine) {
                                    isOffside = true;
                                }
                            }
                        }
                    } else {
                        // Opponent attacks Left (X=0).
                        if (targetMate.x < 400) {
                            // Sort all player team players by their X coordinate, closest to their goal line (X=0) first
                            let playerDefenders = [...this.playerSprites].sort((a, b) => a.x - b.x);

                            // The offside line is the 2nd-to-last defender (index 1)
                            if (playerDefenders.length > 1) {
                                let offsideLine = playerDefenders[1].x;

                                if (targetMate.x < this.ball.x && targetMate.x < offsideLine) {
                                    isOffside = true;
                                }
                            }
                        }
                    }

                    if (isOffside) {
                        // Visual indication of offside line (optional MVP, but good for debug)
                        console.log(`Offside triggered! Target X: ${targetMate.x}`);
                        // Indirect free kick from the spot of the offside player
                        this.handleSetPiece('Offside', targetMate.x, targetMate.y, !isPlayer);

                        // Clear the current owner and stop executing this logic loop
                        this.ball.owner = null;
                        this.ballSpeed = 0;
                        return;
                    }

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
        const isPlayerKickoff = (this.score.player + this.score.opponent) % 2 === 0;
        let kickOffTeam = isPlayerKickoff ? this.playerSprites : this.opponentSprites;
        let forwards = kickOffTeam.filter(p => p.playerData.position === 'CF' || p.playerData.position === 'WG');
        if (forwards.length < 2) forwards = kickOffTeam.slice(0, 2);
        let striker = forwards[0];
        let support = forwards[1];

        this.playerSprites.forEach(p => {
            if (p.baseX) { p.x = p.baseX; p.y = p.baseY; }
            else { p.x = Phaser.Math.Between(50, 350); p.y = Phaser.Math.Between(50, 550); }
            if (p.x > 390) p.x = 390;
            if (isPlayerKickoff) {
                if (p !== striker && p !== support && Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 320;
            } else {
                if (Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 320;
            }
        });

        this.opponentSprites.forEach(p => {
            if (p.baseX) { p.x = p.baseX; p.y = p.baseY; }
            else { p.x = Phaser.Math.Between(450, 750); p.y = Phaser.Math.Between(50, 550); }
            if (p.x < 410) p.x = 410;
            if (!isPlayerKickoff) {
                if (p !== striker && p !== support && Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 480;
            } else {
                if (Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 480;
            }
        });

        this.ball.x = 400; this.ball.y = 300; this.ball.z = 0; this.ballSpeed = 0; this.isHighBall = false;

        if (striker) { striker.x = 400 - (isPlayerKickoff ? 5 : -5); striker.y = 300; this.ball.owner = striker; }
        if (support) { support.x = 400 - (isPlayerKickoff ? 20 : -20); support.y = 320; }

        this.matchState = 'kickoff';
        this.kickoffTimer = 20;
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
