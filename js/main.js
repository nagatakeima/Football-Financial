// ==========================================
// Phaser 3 Match Engine Integration
// ==========================================

class MatchScene extends Phaser.Scene {
    constructor() {
        super('MatchScene');
    }

    create() {
        this.playerTeamData = window.gameState.playerTeam;
        window.ChemistrySystem.calculateTeamChemistry(this.playerTeamData);
        this.opponentTeamData = managementUI.getNextOpponent();
        if(this.opponentTeamData) window.ChemistrySystem.calculateTeamChemistry(this.opponentTeamData);

        if (!this.opponentTeamData) {
            this.endMatch(0, 0);
            return;
        }

        this.gimmicks = ["none", "fever", "fortress", "badWeather"];
        this.currentGimmick = window.gameState.upcomingGimmick || "none";

        this.drawPitch();

        this.matchTime = 0;
        this.timeScale = 1;
        this.isSkip = false;

        this.score = { player: 0, opponent: 0 };
        this.matchState = 'playing';
        this.currentSetPieceType = null;
        this.kickoffTimer = 0;
        this.ball = { x: 400, y: 300, z: 0, owner: null, cooldown: 0 };
        this.lastTouchedByPlayerTeam = true;

        this.playerSprites = [];
        this.opponentSprites = [];

        this.spawnTeams();
        this.resetPositions();

        this.logicTimer = this.time.addEvent({
            delay: 100,
            callback: this.tickMatch,
            callbackScope: this,
            loop: true
        });

        this.createMatchUI();
    }


    getOffsideLineX(isPlayerTeamDefense) {
        // isPlayerTeamDefense is TRUE if Player Team is defending (opponent is attacking)
        // For Player Team Defense: Goal is at 0. Offside line is max(secondToLast, 400).
        // For Opponent Team Defense: Goal is at 800. Offside line is min(secondToLast, 400).
        const defendingTeam = isPlayerTeamDefense ? this.playerSprites : this.opponentSprites;
        const sortedDefenders = [...defendingTeam].sort((a, b) => a.x - b.x); // Left to right

        if (isPlayerTeamDefense) {
            // Defending Left side (X=0)
            if (sortedDefenders.length > 1) {
                // The opponent is attacking left (towards 0).
                // They cannot be closer to 0 than the second to last defender, AND they cannot be offside in their own half (X > 400).
                // So the limit is the minimum (closest to 0) of the defender's position and 400.
                return Math.min(sortedDefenders[1].x, 400);
            }
            return 400;
        } else {
            // Defending Right side (X=800)
            if (sortedDefenders.length > 1) {
                // The player is attacking right (towards 800).
                // They cannot be closer to 800 than the second to last defender, AND they cannot be offside in their own half (X < 400).
                // So the limit is the maximum (closest to 800) of the defender's position and 400.
                return Math.max(sortedDefenders[sortedDefenders.length - 2].x, 400);
            }
            return 400;
        }
    }

    getPitchZone(x, y, isPlayerTeam) {
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
        let lane = '';
        // Issue 9: Y-axis is now logically 60 to 540 (total height 480).
        // 480 / 5 lanes = 96 pixels per lane
        let viewY = isPlayerTeam ? y : 600 - y;
        if (viewY < 60 + 96) lane = 'Left Outside';
        else if (viewY < 60 + 192) lane = 'Left Half-space';
        else if (viewY < 60 + 288) lane = 'Center';
        else if (viewY < 60 + 384) lane = 'Right Half-space';
        else lane = 'Right Outside';
        return { third, lane };
    }

    drawPitch() {
        for (let i = 0; i < 8; i++) {
            this.add.rectangle(400, i * 75 + 37.5, 800, 75, i % 2 === 0 ? 0x2E8B57 : 0x277A4D);
        }
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeCircle(400, 300, 70);
        graphics.beginPath();
        graphics.moveTo(400, 10);
        graphics.lineTo(400, 590);
        graphics.strokePath();
        graphics.strokeRect(10, 10, 780, 580);
        graphics.strokeRect(10, 150, 150, 300);
        graphics.strokeRect(10, 225, 50, 150);
        graphics.fillCircle(110, 300, 3);
        graphics.beginPath();
        graphics.arc(110, 300, 70, -Math.PI / 3, Math.PI / 3);
        graphics.strokePath();
        graphics.strokeRect(640, 150, 150, 300);
        graphics.strokeRect(740, 225, 50, 150);
        graphics.fillCircle(690, 300, 3);
        graphics.beginPath();
        graphics.arc(690, 300, 70, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3);
        graphics.strokePath();
        graphics.lineStyle(3, 0xaaaaaa, 1);
        graphics.strokeRect(0, 260, 10, 80);
        graphics.strokeRect(790, 260, 10, 80);
    }

    getBasePosition(pos, isPlayerTeam) {
        let x = 400; let y = 300;
        const dir = isPlayerTeam ? -1 : 1;
        switch (pos) {
            case 'GK': x = 400 + dir * 370; y = 300; break;
            case 'CB': x = 400 + dir * 250; y = 300; break;
            case 'SB': x = 400 + dir * 250; y = 300; break;
            case 'CDM': x = 400 + dir * 150; y = 300; break;
            case 'CM': x = 400 + dir * 100; y = 300; break;
            case 'CAM': x = 400 + dir * 50; y = 300; break;
            case 'SH': x = 400 + dir * 50; y = 300; break;
            case 'WG': x = 400 + dir * 50; y = 300; break;
            case 'CF': x = 400 + dir * 50; y = 300; break;
            default: x = 400 + dir * 100; y = 300; break;
        }
        return { x, y };
    }
    getDynamicBasePosition(p, isPlayerTeam, isAttacking) {
        // Base coordinate from original formation
        let base = this.getBasePosition(p.expectedPosStr || p.playerData.position, isPlayerTeam);
        if (p.baseOffsetY) base.y += p.baseOffsetY;

        // Dynamic Line Control based on Ball X
        const ballX = this.ball.x;
        const dir = isPlayerTeam ? 1 : -1; // 1 means attacking Right (towards 800)

        // Define team center of mass target based on possession
        let lineShift = 0;

        if (isAttacking) {
            // Push Up: Team moves forward with the ball
            // If ball is in enemy third, push the defensive line up to midfield
            if (isPlayerTeam) {
                if (ballX > 500) lineShift = 200;
                else if (ballX > 300) lineShift = 100;
            } else {
                if (ballX < 300) lineShift = -200;
                else if (ballX < 500) lineShift = -100;
            }
        } else {
            // Fall Back (Retreat): Form a compact defensive block
            // If enemy is attacking, drop the whole team back towards own goal
            if (isPlayerTeam) {
                // Defending Left goal (0)
                if (ballX < 400) lineShift = -150; // Deep block
                else lineShift = -50;
            } else {
                // Defending Right goal (800)
                if (ballX > 400) lineShift = 150; // Deep block
                else lineShift = 50;
            }
        }

        // Apply position-specific logic to keep compactness and Dynamic Structural Shape
        const pos = p.playerData.position;
        if (pos === 'CB' || pos === 'SB' || pos === 'GK') {
            base.x += lineShift;
            // Prevent DF line from pushing past halfway line
            if (isPlayerTeam && base.x > 380) base.x = 380;
            if (!isPlayerTeam && base.x < 420) base.x = 420;
        } else if (pos === 'CDM' || pos === 'CM' || pos === 'CAM' || pos === 'WG') {
            base.x += lineShift * 0.8; // Midfield shifts slightly less to compress space
        } else if (pos === 'CF') {
            base.x += lineShift * 0.5; // FW stays high to offer outlet
            // But force FW to come back behind the ball if defending deep
            if (!isAttacking) {
                if (isPlayerTeam && base.x > ballX + 50) base.x = ballX + 50;
                if (!isPlayerTeam && base.x < ballX - 50) base.x = ballX - 50;
            }
        }

        // Structural Shape Shifting (3-2-5 / 5-4-1)
        if (isAttacking && Math.abs(lineShift) > 50) {
            // Attacking deeply (Phase C): Create 3-2-5 structure
            if (pos === 'SB') {
                base.x += dir * 80; // SB pushes up into forward line
            }
            if (pos === 'CDM') {
                base.x -= dir * 40; // CDM drops between CBs (Salida Lavolpiana / Rest defense)
            }
        } else if (!isAttacking && Math.abs(lineShift) > 50) {
            // Defending deeply (Phase F): Create 5-4-1 structure
            if (pos === 'CDM') {
                base.x -= dir * 40; // CDM absorbs into final line (5-back)
            }
            if (pos === 'WG') {
                base.x -= dir * 80; // WGs drop deep into midfield block
                base.y = base.y < 300 ? 150 : 450; // Tuck in slightly
            }
        }

        // Strict boundary check for dynamic base
        base.x = Phaser.Math.Clamp(base.x, 20, 780);
        base.y = Phaser.Math.Clamp(base.y, 65, 535);
        return base;
    }

    createPlayerSprite(x, y, color, number, isPlayerTeam, player) {
        let container = this.add.container(x, y);
        if (player.position === 'GK') color = isPlayerTeam ? 0x2ecc71 : 0xf1c40f;
        let shadow = this.add.ellipse(0, 15, 20, 8, 0x000000, 0.4);
        let legL = this.add.rectangle(-4, 12, 4, 10, 0xecf0f1);
        let legR = this.add.rectangle(4, 12, 4, 10, 0xecf0f1);
        let shoeL = this.add.rectangle(-4, 17, 6, 4, 0x333333);
        let shoeR = this.add.rectangle(4, 17, 6, 4, 0x333333);
        let body = this.add.rectangle(0, 0, 16, 18, color);
        body.setStrokeStyle(1, 0xffffff);
        let sleeveL = this.add.rectangle(-9, -2, 4, 8, color);
        let sleeveR = this.add.rectangle(9, -2, 4, 8, color);
        let pants = this.add.rectangle(0, 9, 16, 6, 0xffffff);
        let head = this.add.circle(0, -14, 9, 0xffccaa);
        const hairColors = [0x4a2311, 0x000000, 0xe6b322, 0x7c2c16];
        const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        let hair = this.add.arc(0, -16, 9, 180, 360, false, hairColor);
        let eyeL = this.add.rectangle(-3, -13, 2, 2, 0x000000);
        let eyeR = this.add.rectangle(3, -13, 2, 2, 0x000000);
        let numText = this.add.text(0, 1, number, { fontSize: '10px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);

        container.add([shadow, legL, legR, shoeL, shoeR, pants, sleeveL, sleeveR, body, head, hair, eyeL, eyeR, numText]);

        container.legL = legL; container.legR = legR; container.shoeL = shoeL; container.shoeR = shoeR;
        container.playerData = player; container.isPlayerTeam = isPlayerTeam; container.animTick = Math.random() * 10;
        container.baseColor = color; container.dirX = 1;

        container.stunTimer = 0;
        container.actionCooldown = 0; // Prevent re-touching ball immediately
        container.aiTickTimer = 0;
        let mentalStat = player.dynamicStats ? player.dynamicStats.mental : player.stats.mental;
        container.mentalTickRate = Math.max(1, Math.floor(10 - (mentalStat / 10)));
        container.aiTickTimer = Math.floor(Math.random() * container.mentalTickRate);

        container.lastForceX = 0; container.lastForceY = 0;
        return container;
    }

    spawnTeams() {
        const playerFormationDef = window.MasterData.Formations[this.playerTeamData.formation] || { slots: [] };
        this.playerTeamData.starting11.forEach((player, i) => {
            const isGK = (i === 0);
            const slotDef = playerFormationDef.slots[i] || { expectedPosStr: isGK ? 'GK' : 'CM', offsetX: 0, offsetY: 0, slotId: `p_${i}` };
            const expectedPosStr = slotDef.expectedPosStr;
            let pos = this.getBasePosition(expectedPosStr, true);
            let yOffset = slotDef.offsetY || (i % 2 === 0 ? -1 : 1) * ((i % 3) * 30);

            // Do not override with 100/500 if MasterData already has valid offsets
            if (!slotDef.offsetY) {
                if (expectedPosStr === 'SB' || expectedPosStr === 'WG') pos.y = i % 2 === 0 ? 100 : 500;
                if (expectedPosStr === 'CB' || expectedPosStr === 'CM' || expectedPosStr === 'CDM') pos.y = 300 + yOffset;
            } else {
                pos.y = 300 + yOffset;
            }

            // X positioning adjusted by offsetX
            if (!isGK) {
                // If the MasterData has an explicit offset, use it relative to center (400), otherwise rely on getBasePosition
                if (slotDef.offsetX !== undefined && slotDef.offsetX !== 0) {
                    pos.x = 400 - slotDef.offsetX;
                }
            }

            if (player.position !== expectedPosStr && (!player.subPositions || !player.subPositions.includes(expectedPosStr))) {
                player.isMob = true;
                player.dynamicStats = { pass: player.stats.pass / 2, shoot: player.stats.shoot / 2, defense: player.stats.defense / 2, physical: player.stats.physical / 2, speed: player.stats.speed / 2, mental: player.stats.mental / 2, stamina: player.stats.stamina / 2 };
            } else { player.isMob = false; }
            let sprite = this.createPlayerSprite(pos.x, pos.y, 0x3498db, i + 1, true, player);
            sprite.baseX = pos.x; sprite.baseY = pos.y; sprite.baseOffsetY = yOffset;
            sprite.expectedPosStr = expectedPosStr;
            sprite.slotId = slotDef.slotId; // For chemistry link evaluation
            this.playerSprites.push(sprite);
        });

        const oppFormationDef = window.MasterData.Formations[this.opponentTeamData.formation] || { slots: [] };
        this.opponentTeamData.starting11.forEach((player, i) => {
            const isGK = (i === 0);
            const slotDef = oppFormationDef.slots[i] || { expectedPosStr: isGK ? 'GK' : 'CM', offsetX: 0, offsetY: 0, slotId: `o_${i}` };
            const expectedPosStr = slotDef.expectedPosStr;
            let pos = this.getBasePosition(expectedPosStr, false);
            let yOffset = slotDef.offsetY || (i % 2 === 0 ? -1 : 1) * ((i % 3) * 30);

            if (!slotDef.offsetY) {
                if (expectedPosStr === 'SB' || expectedPosStr === 'WG') pos.y = i % 2 === 0 ? 100 : 500;
                if (expectedPosStr === 'CB' || expectedPosStr === 'CM' || expectedPosStr === 'CDM') pos.y = 300 + yOffset;
            } else {
                pos.y = 300 + yOffset;
            }

            // X positioning adjusted by offsetX (mirrored for opponent)
            if (!isGK) {
                if (slotDef.offsetX !== undefined && slotDef.offsetX !== 0) {
                    pos.x = 400 + slotDef.offsetX;
                }
            }

            if (player.position !== expectedPosStr && (!player.subPositions || !player.subPositions.includes(expectedPosStr))) {
                player.isMob = true;
                player.dynamicStats = { pass: player.stats.pass / 2, shoot: player.stats.shoot / 2, defense: player.stats.defense / 2, physical: player.stats.physical / 2, speed: player.stats.speed / 2, mental: player.stats.mental / 2, stamina: player.stats.stamina / 2 };
            } else { player.isMob = false; }
            let sprite = this.createPlayerSprite(pos.x, pos.y, 0xe74c3c, i + 1, false, player);
            sprite.baseX = pos.x; sprite.baseY = pos.y; sprite.baseOffsetY = yOffset;
            sprite.expectedPosStr = expectedPosStr;
            sprite.slotId = slotDef.slotId; // For chemistry link evaluation
            this.opponentSprites.push(sprite);
        });

        this.ballSprite = this.add.circle(0, 0, 6, 0xffffff);
        this.ballSprite.setStrokeStyle(1, 0x000000);
        this.ballContainer = this.add.container(400, 300);
        let shadow = this.add.ellipse(0, 8, 12, 6, 0x000000, 0.3);
        this.ballContainer.add([shadow, this.ballSprite]);
        this.ballTarget = null; this.ballSpeed = 0; this.isHighBall = false; this.ballZVelocity = 0;
    }

    createMatchUI() {
        this.hudBg = this.add.rectangle(400, 25, 800, 50, 0x000000, 0.7);
        this.scoreText = this.add.text(400, 25, `${this.playerTeamData.name} 0 - 0 ${this.opponentTeamData.name}`, { fontSize: '24px', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);
        this.timeText = this.add.text(400, 50, '00:00', { fontSize: '18px', fill: '#f1c40f' }).setOrigin(0.5);

        let gimmickStr = "通常環境";
        if (this.currentGimmick === "fever") gimmickStr = "熱狂 (前半プレッシャー増)";
        if (this.currentGimmick === "fortress") gimmickStr = "要塞 (スタミナ消費増/ファウル減)";
        if (this.currentGimmick === "badWeather") gimmickStr = "悪天候 (パス成功率低下/ロング有利)";
        this.add.text(400, 75, `環境: ${gimmickStr}`, { fontSize: '14px', fill: '#e74c3c' }).setOrigin(0.5);

        const speed1x = this.add.text(700, 25, '1x', { fontSize: '20px', fill: '#fff', backgroundColor: '#333' }).setOrigin(0.5).setInteractive();
        const speed2x = this.add.text(740, 25, '2x', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        const speedSkip = this.add.text(780, 25, '⏭', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5).setInteractive();

        speed1x.on('pointerdown', () => this.setSpeed(1, [speed1x, speed2x]));
        speed2x.on('pointerdown', () => this.setSpeed(2, [speed1x, speed2x]));
        speedSkip.on('pointerdown', () => { this.isSkip = true; this.tickMatch(); });

        this.speedButtons = [speed1x, speed2x];
        this.setSpeed(1, this.speedButtons);
        this.createCommandUI();
    }

    showActionText(sprite, text, color) {
        if (!sprite || !sprite.x || !sprite.y) return;
        const actionText = this.add.text(sprite.x, sprite.y - 30, text, {
            fontSize: '10px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        actionText.setDepth(1000);
        this.tweens.add({
            targets: actionText, y: sprite.y - 50, alpha: 0, duration: 1500, onComplete: () => actionText.destroy()
        });
    }

    setSpeed(scale, buttons) {
        this.timeScale = scale;
        this.logicTimer.timeScale = scale;
        buttons.forEach(b => b.setBackgroundColor('transparent'));
        if (scale === 1) buttons[0].setBackgroundColor('#333');
        if (scale === 2) buttons[1].setBackgroundColor('#333');
    }

    createCommandUI() {
        const cmdY = 550; const spacing = 180; const startX = 400 - (spacing * 1.5);
        this.commandSlots = [];
        this.playerTeamData.microCommands.forEach((cmdId, i) => {
            const cmdData = Object.assign({}, window.MasterData.MicroCommands.find(c => c.id === cmdId));
            if (!cmdData) return;
            let cdReduction = 0;
            this.playerTeamData.relics.forEach(relicId => {
                const r = window.MasterData.Relics.find(r => r.id === relicId);
                if (r && r.effectType === "CD_REDUCTION") cdReduction += r.value;
            });
            cmdData.cooldown = cmdData.cooldown * (1 - cdReduction);
            const bg = this.add.rectangle(startX + (i * spacing), cmdY, 160, 50, 0x2c3e50).setInteractive();
            bg.setStrokeStyle(2, 0x34495e);
            const text = this.add.text(startX + (i * spacing), cmdY, cmdData.name, { fontSize: '12px', fill: '#fff', align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5);
            const cdOverlay = this.add.rectangle(startX + (i * spacing), cmdY, 160, 50, 0x000000, 0.6);
            cdOverlay.scaleY = 0;
            this.commandSlots.push({ cmdId: cmdId, data: cmdData, bg: bg, cdOverlay: cdOverlay, currentCd: 0, usesLeft: cmdData.maxUses !== undefined ? cmdData.maxUses : Infinity });
            bg.on('pointerdown', () => this.triggerCommand(i));
        });
    }

    triggerCommand(slotIndex) {
        const slot = this.commandSlots[slotIndex];
        if (slot.currentCd > 0 || slot.usesLeft <= 0) return;
        if (slot.data.condition) {
            const isBehind = this.score.player < this.score.opponent;
            const isLead = this.score.player > this.score.opponent;
            if (slot.data.condition === "behind" && !isBehind) return;
            if (slot.data.condition === "lead" && !isLead) return;
        }
        slot.usesLeft -= 1;
        if (slot.usesLeft <= 0) slot.bg.setAlpha(0.5);

        const flash = this.add.rectangle(slot.bg.x, slot.bg.y, 160, 50, 0xf1c40f, 0.8);
        this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

        this.activeBuff = { target: slot.data.target, value: slot.data.value, actionType: slot.data.actionType, duration: 5 };

        if (slot.data.actionType === 'substitute') {
            const benchPlayer = this.playerTeamData.bench.find(p => p.skills.includes(10)) || this.playerTeamData.bench[0];
            if (benchPlayer) {
                if (!benchPlayer.dynamicStats) benchPlayer.dynamicStats = { ...benchPlayer.stats };
                if (benchPlayer.skills.includes(10)) {
                    Object.keys(benchPlayer.dynamicStats).forEach(k => benchPlayer.dynamicStats[k] = Math.min(100, benchPlayer.dynamicStats[k] + 15));
                }
                const worstPitch = this.playerSprites.sort((a,b) => a.playerData.condition - b.playerData.condition)[0];
                if (worstPitch) { worstPitch.playerData = benchPlayer; worstPitch.setStrokeStyle(2, 0xf1c40f); }
            }
        }
        if (slot.data.actionType === 'powerPlay') {
            const cb = this.playerSprites.find(p => p.playerData.position === 'CB');
            if (cb) cb.x = 600;
        }
        if (slot.data.actionType === 'comeback') {
            this.playerSprites.forEach(p => { Object.keys(p.playerData.dynamicStats).forEach(k => p.playerData.dynamicStats[k] += 20); });
        }
        if (slot.data.actionType === 'parkBus') {
            this.playerSprites.forEach(p => { if (p.playerData.position === 'SB' || p.playerData.position === 'CDM') p.x = Math.max(50, p.x - 150); });
        }
        if (slot.data.actionType === 'offsideTrap') {
             this.opponentSprites.forEach(p => { if (p.x < 300) p.x = 400; });
        }
        slot.currentCd = slot.data.cooldown;
    }

    tickMatch() {
        if (this.isSkip) { this.finishMatchInstantly(); return; }
        this.matchTime += 0.03; // Engine time increment
        const displayMin = Math.floor(this.matchTime);
        const displaySec = Math.floor((this.matchTime % 1) * 60);
        this.timeText.setText(`${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`);

        // --- Engine Tracking for Gegenpress (Possession tracking) ---
        // Since matchTime is scaled (0 to 90 representing minutes), we use delta time for the 5-sec rule.
        // Assuming 1 game minute ~ 1000ms real time in the tick loop (based on +0.03 per tick roughly equating to pace).
        // Let's track the actual real-world MS or approximate matchTime equivalent (5 seconds = approx 0.08 matchTime units).
        if (!this.lastPossessionChangeTime) this.lastPossessionChangeTime = 0;
        if (!this.lastPossessionTeam) this.lastPossessionTeam = null;

        const currentPossessorTeam = this.ball.owner ? this.ball.owner.isPlayerTeam : null;
        if (currentPossessorTeam !== null && currentPossessorTeam !== this.lastPossessionTeam) {
            this.lastPossessionTeam = currentPossessorTeam;
            this.lastPossessionChangeTime = this.time.now; // Use Phaser time.now for real-world MS
        }

        // Expose to evaluateActions logic
        this.timeSinceLastPossessionChange = this.time.now - this.lastPossessionChangeTime;

        this.commandSlots.forEach(slot => {
            if (slot.currentCd > 0) {
                slot.currentCd -= 0.1;
                if (slot.currentCd < 0) slot.currentCd = 0;
                slot.cdOverlay.scaleY = slot.currentCd / slot.data.cooldown;
                slot.cdOverlay.setOrigin(0.5, 1);
                slot.cdOverlay.y = slot.bg.y + 25;
            }
        });

        if (this.activeBuff) {
            this.activeBuff.duration -= 0.03;
            if (this.activeBuff.duration <= 0) this.activeBuff = null;
        }

        if (this.activeBuff && this.activeBuff.target === 'defenseLine') {
             this.playerSprites.forEach(p => { if (p.x < 300) p.x += 1; if (p.x > 500) p.x -= 1; });
        }
        if (this.activeBuff && this.activeBuff.target === 'press') {
             this.playerSprites.forEach(p => {
                  if (Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < 250) {
                      const angle = Phaser.Math.Angle.Between(p.x, p.y, this.ball.x, this.ball.y);
                      p.x += Math.cos(angle) * 1.5; p.y += Math.sin(angle) * 1.5;
                  }
             });
        }

        if (this.currentGimmick === 'fever' && this.matchTime < 45) {
             this.opponentSprites.forEach(p => {
                  if (Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y)  < 200) {
                      const angle = Phaser.Math.Angle.Between(p.x, p.y, this.ball.x, this.ball.y);
                      p.x += Math.cos(angle) * 1.2; p.y += Math.sin(angle) * 1.2;
                  }
             });
        }

        if (this.currentGimmick === 'fortress') {
            this.playerSprites.forEach(p => { p.playerData.currentStamina -= p.playerData.staminaConsumptionRate * 0.1; });
        }

        if (this.matchState === 'kickoff') {
            if (this.kickoffTimer > 0) {
                this.kickoffTimer -= 1;
            } else {
                this.matchState = 'playing';
                // Force a safe backpass upon kickoff
                if (this.ball.owner) {
                    const isPlayer = this.ball.owner.isPlayerTeam;
                    const teammates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(p => p !== this.ball.owner);
                    const backMates = teammates.filter(p => isPlayer ? p.x < this.ball.owner.x - 10 : p.x > this.ball.owner.x + 10);
                    let targetMate = backMates.length > 0 ? backMates[Math.floor(Math.random() * backMates.length)] : teammates[0];
                    this.ballTarget = {x: targetMate.x, y: targetMate.y};
                    this.ballSpeed = 15; this.isHighBall = false; this.ball.owner = null;
                }
            }
        } else if (this.matchState === 'setpiece') {
            if (this.kickoffTimer > 0) {
                this.kickoffTimer -= 1;
            } else {
                this.matchState = 'playing';
                this.currentSetPieceType = null;
                if (this.setpieceText) { this.setpieceText.destroy(); this.setpieceText = null; }
            }
        }

        if (this.matchState === 'playing') {
            this.simulateAction();
            if (this.setPieceCooldown && this.setPieceCooldown > 0) {
                this.setPieceCooldown--;
            } else {
                this.checkBallOut();
            }
        }

        if (this.matchTime >= 90) {
            this.logicTimer.remove();
            this.endMatch(this.score.player, this.score.opponent);
        }
    }

    checkBallOut() {
        const leftBound = 5; const rightBound = 795; const topBound = 60; const bottomBound = 540;
        let isOut = false; let type = ''; let restartX = this.ball.x; let restartY = this.ball.y;
        let isPlayerTeamBall = !this.lastTouchedByPlayerTeam;

        if (this.ball.y < topBound) {
            isOut = true; type = 'Throw In'; restartY = 65;
        } else if (this.ball.y > bottomBound) {
            isOut = true; type = 'Throw In'; restartY = 535;
        }

        if (!isOut && this.ball.x < leftBound) {
            isOut = true;
            if (this.ball.y >= 260 && this.ball.y <= 340 && this.ball.z <= 30) {
                 this.triggerGoal(false); this.resetPositions(); return;
            } else {
                if (!this.lastTouchedByPlayerTeam) {
                    type = 'Goal Kick'; restartX = 50; restartY = 300; isPlayerTeamBall = true;
                } else {
                    type = 'Corner Kick'; restartX = 15; restartY = this.ball.y < 300 ? 65 : 535; isPlayerTeamBall = false;
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
                    type = 'Corner Kick'; restartX = 785; restartY = this.ball.y < 300 ? 65 : 535; isPlayerTeamBall = true;
                }
            }
        }

        if (isOut) {
            this.ballSpeed = 0;
            this.handleSetPiece(type, restartX, restartY, isPlayerTeamBall);
        }
    }

    handleSetPiece(type, x, y, isPlayerTeam) {
        this.matchState = 'setpiece';
        this.currentSetPieceType = type;
        this.kickoffTimer = 30;
        this.setPieceCooldown = 30; // 30 frames cooldown for checkBallOut

        // Offset to prevent infinite out of bounds
        if (x <= 5) x = 20;
        else if (x >= 795) x = 780;
        if (y <= 60) y = 75;
        else if (y >= 540) y = 525;

        this.ball.x = x; this.ball.y = y; this.ball.z = 0; this.ballSpeed = 0; this.ballTarget = null; this.ball.owner = null;

        let color = isPlayerTeam ? '#3498db' : '#e74c3c';
        this.setpieceText = this.add.text(400, 300, type, { fontSize: '48px', fill: color, fontStyle: 'bold', backgroundColor: '#00000088' }).setOrigin(0.5);

        let team = isPlayerTeam ? this.playerSprites : this.opponentSprites;
        let taker = team.sort((a,b) => Phaser.Math.Distance.Between(a.x, a.y, x, y) - Phaser.Math.Distance.Between(b.x, b.y, x, y))[0];

        if (taker) {
            let offsetX = 0; let offsetY = 0;
            if (x < 30) offsetX = 15; else if (x > 770) offsetX = -15;
            if (y < 80) offsetY = 15; else if (y > 520) offsetY = -15;
            taker.x = x + offsetX; taker.y = y + offsetY;
            this.ball.owner = taker;
            this.ball.cooldown = 30; // Also protect ball
            this.lastTouchedByPlayerTeam = taker.isPlayerTeam;
        }

        [...this.playerSprites, ...this.opponentSprites].forEach((p, idx) => {
             if (p !== taker && Phaser.Math.Distance.Between(p.x, p.y, x, y) < 80) {
                 let angle = Phaser.Math.Angle.Between(x, y, 400, 300); // Towards center instead of pushing outwards
                 angle += (idx - 5) * 0.15; // Point 5: Disperse to prevent stacking
                 p.x = x + Math.cos(angle) * 90; p.y = y + Math.sin(angle) * 90;
                 // Clamp to keep them inside after pushing
                 p.x = Phaser.Math.Clamp(p.x, 15, 785);
                 p.y = Phaser.Math.Clamp(p.y, 65, 535);
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


    getEffectiveStat(p, statName, activeConditions) {
        let baseStat = p.playerData.dynamicStats[statName] || 50;

        const condSkill = window.Player.getSkillEffectFor(p.playerData, "STAT_UP_CONDITIONAL", statName, activeConditions);
        if (condSkill.value !== 0) baseStat += condSkill.value;

        const condSkillAll = window.Player.getSkillEffectFor(p.playerData, "STAT_UP_CONDITIONAL", "all", activeConditions);
        if (condSkillAll.value !== 0) baseStat += condSkillAll.value;

        return Math.min(100, Math.max(1, baseStat));
    }

    getActiveConditions(p) {
        const conditions = ['always'];

        // Match Context
        const timeElapsed = this.matchTime / 90;
        if (this.matchTime >= 65) conditions.push('lateGame');
        if (this.matchTime <= 25) conditions.push('earlyGame');

        if (this.currentGimmick === 'badWeather') conditions.push('badWeather');

        const myScore = p.isPlayerTeam ? this.score.player : this.score.opponent;
        const enemyScore = p.isPlayerTeam ? this.score.opponent : this.score.player;

        if (myScore < enemyScore) conditions.push('behind');
        if (myScore > enemyScore && this.matchTime >= 65) conditions.push('leadLateGame');

        if (p.playerData.isSubbedIn) conditions.push('sub');

        const playerRating = this.playerTeamData ? this.playerTeamData.getOverallStrength ? this.playerTeamData.getOverallStrength() : 50 : 50;
        const oppRating = this.opponentTeamData ? this.opponentTeamData.getOverallStrength ? this.opponentTeamData.getOverallStrength() : 50 : 50;
        if (p.isPlayerTeam && playerRating < oppRating) conditions.push('underdog');
        if (!p.isPlayerTeam && oppRating < playerRating) conditions.push('underdog');

        // Positional Context
        if (p.x > 533) {
            conditions.push(p.isPlayerTeam ? 'attackingThird' : 'defensiveThird');
        } else if (p.x < 266) {
            conditions.push(!p.isPlayerTeam ? 'attackingThird' : 'defensiveThird');
        }

        // Penalty Area
        const isPlayerPenaltyArea = (p.x < 150 && p.y > 150 && p.y < 450);
        const isOpponentPenaltyArea = (p.x > 650 && p.y > 150 && p.y < 450);

        if (p.isPlayerTeam && isOpponentPenaltyArea) conditions.push('penaltyAreaIn');
        else if (!p.isPlayerTeam && isPlayerPenaltyArea) conditions.push('penaltyAreaIn');
        else conditions.push('penaltyAreaOut');

        // Pressure Context
        let pressureCount = 0;
        const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
        enemies.forEach(e => {
            if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 60) pressureCount++;
        });
        if (pressureCount >= 2) conditions.push('underPressure');

        // Player state context
        if (p.playerData.condition < 40) conditions.push('tired');

        // 1vs1 Context (GK proximity)
        const enemies2 = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
        const enemyGK = enemies2.find(e => e.playerData.position === 'GK');
        if (enemyGK && Phaser.Math.Distance.Between(p.x, p.y, enemyGK.x, enemyGK.y) < 150) {
            conditions.push('1vs1');
        }

        return conditions;
    }

    evaluateActions(p, context) {
        let actionScores = { Keep: 0, Dribble: 0, Pass: 0, Shoot: 0, Clear: 0, Support: 0, RunIntoSpace: 0, HoldPosition: 0, Press: 0, Mark: 0, Cover: 0, Delay: 0, Retreat: 0 };
        const pos = p.playerData.position; const role = p.playerData.role; const tactic = context.tactic;
        const isAttacking = context.isAttacking; const hasBall = context.hasBall; const pitchZone = this.getPitchZone(p.x, p.y, p.isPlayerTeam);
        const currentThreat = this.calculateThreat(p.x, p.y, p.isPlayerTeam);
        const staminaFactor = Math.max(0.3, p.playerData.currentStamina / 100);

        // --- Tactical Risk Thresholds (from 07_3_TeamTactics.md) ---
        let riskThreshold = 50; // default
        if (tactic === 'Possession') riskThreshold = 75;
        if (tactic === 'HighPress') riskThreshold = 40;
        if (tactic === 'Retreat') riskThreshold = 85;

        // --- Chemistry & Dynamic Shape (from 07_2_Formation_and_Shape.md) ---
        const teamData = p.isPlayerTeam ? this.playerTeamData : this.opponentTeamData;
        const formationDef = window.MasterData.Formations[teamData.formation];
        let linkedMates = [];
        if (formationDef && formationDef.chemistryLinks && p.slotId) {
            const links = formationDef.chemistryLinks.filter(l => l.from === p.slotId || l.to === p.slotId);
            const linkedSlotIds = links.map(l => l.from === p.slotId ? l.to : l.from);
            const teammates = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
            linkedMates = teammates.filter(t => linkedSlotIds.includes(t.slotId));
        }

        let coverTargetId = null;

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

                // Check for enemies near pass target
                let enemiesNearMate = 0;
                const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                enemies.forEach(e => {
                    if (Phaser.Math.Distance.Between(mate.x, mate.y, e.x, e.y) < 60) enemiesNearMate++;
                });

                // Heavily penalize passing to marked teammates
                if (enemiesNearMate > 0) passScore -= (enemiesNearMate * 50);

                // Reward passing to teammates in space or backwards if under pressure
                const dist = Phaser.Math.Distance.Between(p.x, p.y, mate.x, mate.y);
                if (dist > 100 && enemiesNearMate === 0) passScore += 30;

                // BACKPASS WEIGHTING: Encourage backpasses to reduce forward clustering
                const isForward = p.isPlayerTeam ? mate.x > p.x : mate.x < p.x;
                if (!isForward) { passScore += 25; passScore -= passRisk * 0.5; }

                // Risk threshold filter: penalize risky passes if threshold is high
                if (passRisk > (100 - riskThreshold)) {
                    passScore -= 50; // Heavy penalty for breaking risk protocol
                }

                if (tactic === 'Possession' && passRisk < 30) passScore += 20;
                if (tactic === 'Possession' && linkedMates.includes(mate)) passScore += 15; // Bonus for passing to linked players in possession
                if (tactic === 'Counter' && mateThreat > currentThreat) passScore += 40;
                if (tactic === 'HighPress' && isForward) passScore += 20; // Directness

                if (passScore > bestPassScore) { bestPassScore = passScore; bestPassTarget = mate; }
            });
            actionScores.Pass = bestPassScore; context.bestPassTarget = bestPassTarget;

            const dir = p.isPlayerTeam ? 1 : -1;
            const dribbleTargetX = p.x + dir * 50;
            actionScores.Dribble = this.calculateThreat(dribbleTargetX, p.y, p.isPlayerTeam) - this.calculatePassRisk(p.x, p.y, dribbleTargetX, p.y, p.isPlayerTeam);
            if (pos === 'WG' || role === 'Ball-Playing') actionScores.Dribble += 20;
            if (tactic === 'Retreat') actionScores.Dribble -= 20; // Discourage risky dribbles in retreat

            if (pitchZone.third === 'Defensive' && this.calculatePassRisk(p.x, p.y, p.x + 10, p.y, p.isPlayerTeam) > (100 - riskThreshold)) actionScores.Clear = 80;
            actionScores.Keep = tactic === 'Possession' ? 30 : 10;
        } else if (isAttacking) {
            const dir = p.isPlayerTeam ? 1 : -1;
            const forwardX = p.x + dir * 80;
            let laneRisk = this.ball.owner && this.ball.owner.isPlayerTeam === p.isPlayerTeam ? this.calculatePassRisk(this.ball.owner.x, this.ball.owner.y, forwardX, p.y, p.isPlayerTeam) : 100;

            // Tempo Switch / Penetration trigger condition
            let isPenetrationPhase = false;
            if (this.ball.owner && this.ball.owner.isPlayerTeam === p.isPlayerTeam) {
                const ownerZone = this.getPitchZone(this.ball.owner.x, this.ball.owner.y, p.isPlayerTeam);
                // Penetration Trigger: If ball is in enemy half-spaces and NOT in our defensive third
                const inEnemyHalf = p.isPlayerTeam ? this.ball.owner.x > 400 : this.ball.owner.x < 400;
                if (inEnemyHalf && ownerZone.lane.includes('Half-space') && ownerZone.third !== 'Defensive') {
                    isPenetrationPhase = true; // Trigger!
                }
            }

            actionScores.RunIntoSpace = this.calculateThreat(forwardX, p.y, p.isPlayerTeam) - (laneRisk * 0.5);
            if (pos === 'WG' || pos === 'CF' || role === 'Attacking') actionScores.RunIntoSpace += 30;
            if (isPenetrationPhase) actionScores.RunIntoSpace += 50; // Explode into space
            if (tactic === 'Counter') actionScores.RunIntoSpace += 40; // Counter-attack sprint

            if (this.ball.owner && this.ball.owner.isPlayerTeam === p.isPlayerTeam) {
                const distToBall = Phaser.Math.Distance.Between(p.x, p.y, this.ball.owner.x, this.ball.owner.y);
                if (distToBall > 100 && distToBall < 250) {
                    actionScores.Support = 80 - this.calculatePassRisk(this.ball.owner.x, this.ball.owner.y, p.x, p.y, p.isPlayerTeam);
                    if (tactic === 'Possession') actionScores.Support += 30;
                }
            }
            actionScores.HoldPosition = tactic === 'Retreat' && pitchZone.third === 'Defensive' ? 80 : 40;

            // Slot Swap (Rotation) evaluation
            if (tactic === 'Possession' && pitchZone.third === 'Attacking' && linkedMates.length > 0) {
                // If a linked mate is making a forward run, try to cover their slot
                const activeMate = linkedMates.find(m => m.currentAction === 'RunIntoSpace');
                if (activeMate) {
                    actionScores.Cover = 60; // Temporarily swap base positioning
                    coverTargetId = activeMate.slotId;
                }
            }

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

            // 5-second Storming Rule for Gegenpress
            const timeSinceLost = this.timeSinceLastPossessionChange || 0; // Requires engine tracking
            if (tactic === 'HighPress') {
                if (timeSinceLost < 5000) { // Under 5 seconds
                    actionScores.Press += 80; // Swarm
                } else {
                    actionScores.Press += 40;
                }
            }
            if (isFirstDefender && distToBall < 300) actionScores.Press += 100;

            // High Press tactical instruction: vertical slide
            // If the 1st defender is pressing in the attacking third, midfielders step up
            if (tactic === 'HighPress' && !isFirstDefender && pitchZone.third === 'Attacking') {
                 if (pos === 'CM' || pos === 'CAM' || pos === 'WG') {
                     actionScores.Press += 60; // Push up to close passing lanes (vertical slide)
                 }
            }

            actionScores.Mark = 50;
            const goalX = p.isPlayerTeam ? 0 : 800;
            const distToOwnGoal = Phaser.Math.Distance.Between(p.x, p.y, goalX, 300);

            if (tactic === 'Retreat') {
                actionScores.Retreat = 120; // Force retreat
                actionScores.Delay = 80;
                actionScores.Press -= 30; // Discourage breaking the block
            } else if (Phaser.Math.Distance.Between(this.ball.x, this.ball.y, goalX, 300) < distToOwnGoal) {
                actionScores.Retreat = 100;
                if (isFirstDefender && distToBall < 100) actionScores.Press += 50;
            } else {
                actionScores.Retreat = 50 - (distToOwnGoal / 10);
            }

            if (pos === 'CB' || pos === 'SB') { actionScores.Retreat += 30; actionScores.Delay += 20; }

            // Dynamic shape: 5-back forming for CDM when Retreating deep
            if (pos === 'CDM' && pitchZone.third === 'Defensive' && actionScores.Retreat > 80) {
                actionScores.Cover += 50; // Absorb into defensive line
            }
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

        if (!this.particles) {
            this.particles = this.add.particles(0, 0, 'ball', { speed: 100, scale: { start: 0.5, end: 0 }, blendMode: 'ADD', lifespan: 300, emitting: false });
            let g = this.add.graphics();
            g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4); g.generateTexture('trail', 8, 8); g.destroy();
            this.trailEmitter = this.add.particles(0, 0, 'trail', { speed: 20, scale: { start: 1, end: 0 }, alpha: { start: 0.5, end: 0 }, blendMode: 'ADD', lifespan: 200, frequency: 50, follow: this.ballContainer });
        }
        this.trailEmitter.emitting = this.ballSpeed > 5;

        [...this.playerSprites, ...this.opponentSprites].forEach(p => {
            let moved = false;

            // Stun enforcement
            if (p.actionCooldown > 0) p.actionCooldown--;

            if (p.stunTimer > 0) {
                p.stunTimer--;
                p.legL.y = 12; p.legR.y = 12; // Freeze animation
                return;
            }

            p.aiTickTimer++;
            const hasBall = this.ball.owner === p;

            let mentalStat = p.playerData.dynamicStats ? p.playerData.dynamicStats.mental : p.playerData.stats.mental;
            const staminaFactor = Math.max(0.3, p.playerData.currentStamina / 100);
            mentalStat = mentalStat * staminaFactor;
            p.mentalTickRate = Math.max(1, Math.floor(10 - (mentalStat / 10)));

            const teamManager = p.isPlayerTeam ? window.MasterData.Managers.find(m => m.id === window.gameState.playerTeam.managerId) : window.MasterData.Managers.find(m => m.id === managementUI.getNextOpponent().managerId);
            const tactic = teamManager ? teamManager.preference : (p.isPlayerTeam ? window.gameState.playerTeam.tactics : managementUI.getNextOpponent().tactics);

            let urgency = 1.0;
            const myScoreDiff = p.isPlayerTeam ? scoreDiff : -scoreDiff;
            if (timeRemaining < 15) { if (myScoreDiff < 0) urgency = 1.5; if (myScoreDiff > 0) urgency = 0.8; }

            // Increase base speed by 1.5x
            const maxSpeed = (2.0 + (p.playerData.stats.speed / 50)) * staminaFactor * urgency * 1.5;

            let isAttacking = false; let isDefending = false;
            if (this.ball.owner) { isAttacking = this.ball.owner.isPlayerTeam === p.isPlayerTeam; isDefending = !isAttacking; }
            else if (this.ballTarget) {
                const headingRight = this.ballTarget.x > this.ball.x;
                if (headingRight) { isAttacking = p.isPlayerTeam; isDefending = !p.isPlayerTeam; }
                else { isAttacking = !p.isPlayerTeam; isDefending = p.isPlayerTeam; }
            }

            let forceX = 0; let forceY = 0;

            // Maintain target coordinates for a minimum time to avoid chattering
            if (p.targetMaintainTimer === undefined) p.targetMaintainTimer = 0;
            if (p.targetMaintainTimer > 0 && !hasBall) p.targetMaintainTimer--;

            let targetX = p.x; let targetY = p.y;
            if ((p.aiTickTimer >= p.mentalTickRate && p.targetMaintainTimer <= 0) || hasBall) {
                p.aiTickTimer = 0;
                if (!hasBall) p.targetMaintainTimer = Phaser.Math.Between(15, 20); // Hold decision for 15-20 frames

                const context = { tactic, isAttacking, hasBall };
                const evaluation = this.evaluateActions(p, context);
                let bestAction = evaluation.action;
                p.currentAction = bestAction;
                p.lastEvaluation = { bestPassTarget: context.bestPassTarget, targetLineX: evaluation.targetLineX };
                const dir = p.isPlayerTeam ? 1 : -1;
                const base = this.getDynamicBasePosition(p, p.isPlayerTeam, isAttacking);

                if (p.chasingLooseBall && !this.ball.owner) {
                    bestAction = 'ChaseLooseBall';
                }

                switch (bestAction) {
                    case 'HoldPosition':
                        targetX = base.x;
                        targetY = Phaser.Math.Linear(base.y, this.ball.y, 0.3);
                        break;
                    case 'RunIntoSpace':
                        let targetForwardX = p.x + (dir * 80);
                        let offsideLineX = this.getOffsideLineX(!p.isPlayerTeam);
                        if (p.isPlayerTeam) offsideLineX -= 5; else offsideLineX += 5;
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
                        if (p.playerData.position === 'GK') {
                            targetX = base.x;
                            targetY = 300;
                        } else {
                            // Use dynamic base for retreat to form a compact block
                            targetX = base.x;
                            let pullWeight = (this.ball.y < 300 !== base.y < 300 && Math.abs(base.y - 300) > 100) ? 0.1 : 0.6;
                            targetY = Phaser.Math.Linear(base.y, this.ball.y, pullWeight);
                        }
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
                    case 'ChaseLooseBall':
                        // Predict ball pos
                        let predX = this.ball.x + (Math.cos(this.ball.angle || 0) * this.ballSpeed * 5);
                        let predY = this.ball.y + (Math.sin(this.ball.angle || 0) * this.ballSpeed * 5);
                        targetX = Phaser.Math.Clamp(predX, 5, 795); targetY = Phaser.Math.Clamp(predY, 60, 540);
                        break;
                    default:
                        targetX = p.x; targetY = p.y;
                }

                p.cachedTargetX = targetX; p.cachedTargetY = targetY;
            } else {
                if (p.cachedTargetX !== undefined) { targetX = p.cachedTargetX; targetY = p.cachedTargetY; }
                else { targetX = p.x; targetY = p.y; }
            }

            forceX = targetX - p.x; forceY = targetY - p.y;

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

                let totalForceX = forceX + sepForceX; let totalForceY = forceY + sepForceY;
                if (!this.ball.owner && !this.ballTarget) {
                     const bDist = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                     if (bDist < 100) { totalForceX += (this.ball.x - p.x) / bDist * 3; totalForceY += (this.ball.y - p.y) / bDist * 3; }
                }

                p.lastForceX = totalForceX; p.lastForceY = totalForceY;

            totalForceX = p.lastForceX; totalForceY = p.lastForceY;
            let totalMagnitude = Math.sqrt(totalForceX*totalForceX + totalForceY*totalForceY);

            if (totalMagnitude > 0) {
                let actualSpeed = Math.min(totalMagnitude, maxSpeed);
                let drainRate = 0;
                if (actualSpeed > 1.5) drainRate = 0.08; else if (actualSpeed > 0.5) drainRate = 0.02;
                if (p.lastSpeedX !== undefined) {
                    const currentVelX = (totalForceX / totalMagnitude) * actualSpeed;
                    const currentVelY = (totalForceY / totalMagnitude) * actualSpeed;
                    if (Math.abs(currentVelX - p.lastSpeedX) + Math.abs(currentVelY - p.lastSpeedY) > 2.0) drainRate += 0.05;
                    p.lastSpeedX = currentVelX; p.lastSpeedY = currentVelY;
                } else { p.lastSpeedX = (totalForceX / totalMagnitude) * actualSpeed; p.lastSpeedY = (totalForceY / totalMagnitude) * actualSpeed; }

                p.playerData.currentStamina -= (drainRate * (100 / p.playerData.stats.stamina));
                if (p.playerData.currentStamina < 1) p.playerData.currentStamina = 1;

                p.x += (totalForceX / totalMagnitude) * actualSpeed;
                p.y += (totalForceY / totalMagnitude) * actualSpeed;
                moved = actualSpeed > 0.1;
            } else {
                p.playerData.currentStamina = Math.min(100, p.playerData.currentStamina + 0.05);
            }

            // Issue 9: Clamp players strictly within the visual pitch (60 to 540)
            p.x = Phaser.Math.Clamp(p.x, 10, 790);
            p.y = Phaser.Math.Clamp(p.y, 65, 535);

            // Limit GK
            if (p.playerData.position === 'GK') {
                if (p.isPlayerTeam) p.x = Math.max(10, Math.min(p.x, 150));
                else p.x = Math.max(650, Math.min(p.x, 790));
            }

            if (moved) {
                p.animTick += 0.4;
                p.legL.y = 12 + Math.sin(p.animTick) * 3; p.legR.y = 12 + Math.sin(p.animTick + Math.PI) * 3;
                p.shoeL.y = 17 + Math.sin(p.animTick) * 3; p.shoeR.y = 17 + Math.sin(p.animTick + Math.PI) * 3;
                p.y += (Math.sin(p.animTick*2) > 0 ? 0.5 : -0.5);
                if (totalForceX > 0.5) p.dirX = 1; else if (totalForceX < -0.5) p.dirX = -1;
                p.scaleX = p.dirX;
                let numText = p.list[13]; if (numText) numText.scaleX = p.dirX;
            } else {
                p.legL.y = 12; p.legR.y = 12; p.shoeL.y = 17; p.shoeR.y = 17;
            }
        });

        if (this.ballTarget || this.ballSpeed > 0) {
            this.currentSetPieceType = null;
            let targetX = this.ballTarget ? this.ballTarget.x : this.ball.x + Math.cos(this.ball.angle || 0) * 100;
            let targetY = this.ballTarget ? this.ballTarget.y : this.ball.y + Math.sin(this.ball.angle || 0) * 100;
            const dist = this.ballTarget ? Phaser.Math.Distance.Between(this.ball.x, this.ball.y, targetX, targetY) : Infinity;

            let isBouncing = false;
            if (this.isHighBall) {
                this.ball.z += this.ballZVelocity; this.ballZVelocity -= 1.5;
                if (this.ball.z <= 0) {
                    this.ball.z = 0;
                    if (this.ballZVelocity < -5) {
                        this.ballZVelocity = Math.abs(this.ballZVelocity) * (this.currentGimmick === 'badWeather' ? 0.3 : 0.6);
                        isBouncing = true;
                    } else { this.isHighBall = false; this.ballZVelocity = 0; }
                }
            } else { this.ball.z = 0; }

            // Increased inertia
            if (dist < 10 || this.ballSpeed < 0.1) {
                this.ballTarget = null; this.ballSpeed = 0; this.isHighBall = false; this.ball.z = 0;
            } else {
                const angle = this.ballTarget ? Phaser.Math.Angle.Between(this.ball.x, this.ball.y, targetX, targetY) : (this.ball.angle || 0);
                this.ball.angle = angle;
                this.ball.x += Math.cos(angle) * this.ballSpeed; this.ball.y += Math.sin(angle) * this.ballSpeed;
                let friction = (this.currentGimmick === 'badWeather') ? 0.99 : 0.98;
                if (this.isHighBall && !isBouncing) friction = 0.99;
                this.ballSpeed *= friction;
            }
        } else { if (!this.isHighBall) this.ball.z = 0; }

        // Decrement global ball cooldown
        if (this.ball.cooldown > 0) this.ball.cooldown--;

        if (!this.ball.owner) {
            const allPlayers = [...this.playerSprites, ...this.opponentSprites];

            // Loose ball chasing logic
            let closestPlayers = [...allPlayers].sort((a,b) => Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y) - Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y));
            // Let the closest 2 players from each team break formation to chase
            let pTeamChasers = 0; let oTeamChasers = 0;
            closestPlayers.forEach(p => {
                if (p.isPlayerTeam && pTeamChasers < 2 && p.playerData.position !== 'GK') { p.chasingLooseBall = true; pTeamChasers++; }
                else if (!p.isPlayerTeam && oTeamChasers < 2 && p.playerData.position !== 'GK') { p.chasingLooseBall = true; oTeamChasers++; }
                else { p.chasingLooseBall = false; }
            });

            let interceptor = null;
            for (let p of allPlayers) {
                const bDist = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                let interceptRadius = 20;
                if (this.activeBuff && this.activeBuff.target === 'intercept' && p.isPlayerTeam) interceptRadius += 20;
                const activeConditions = this.getActiveConditions(p);
                const interceptRangeSkill = window.Player.getSkillEffectFor(p.playerData, "RANGE_UP", "intercept", activeConditions);
                if (interceptRangeSkill.value > 0) interceptRadius += interceptRangeSkill.value;
                const trapRangeSkill = window.Player.getSkillEffectFor(p.playerData, "RANGE_UP", "trap", activeConditions);
                if (trapRangeSkill.value > 0) interceptRadius += trapRangeSkill.value;
                let zLimit = 15;
                if (p.playerData.position === 'GK') {
                    const isPlayerSidePA = p.isPlayerTeam && p.x < 160 && p.y > 150 && p.y < 450;
                    const isOppSidePA = !p.isPlayerTeam && p.x > 640 && p.y > 150 && p.y < 450;
                    if (isPlayerSidePA || isOppSidePA) { interceptRadius = 40; zLimit = 40; }
                }
                if (bDist < interceptRadius && this.ball.z <= zLimit && p.actionCooldown <= 0 && this.ball.cooldown <= 0) { interceptor = p; break; }
            }

            if (interceptor) {
                const activeConditions = this.getActiveConditions(interceptor);
                let trapChance = (this.getEffectiveStat(interceptor, 'mental', activeConditions) * 0.5) + (this.getEffectiveStat(interceptor, 'pass', activeConditions) * 0.5);
                if (this.ballSpeed > 15) trapChance -= 10;
                const trapSkill = window.Player.getSkillEffectFor(interceptor.playerData, "SUCCESS_RATE_UP", "trap", activeConditions);
                if (trapSkill.value > 0) {
                    trapChance += trapSkill.value;
                    if (Phaser.Math.Between(0, 100) < 50) this.showActionText(interceptor, trapSkill.names[0], "#f1c40f");
                }
                const interceptSkill = window.Player.getSkillEffectFor(interceptor.playerData, "SUCCESS_RATE_UP", "intercept", activeConditions);
                if (interceptSkill.value > 0) {
                    trapChance += interceptSkill.value;
                    if (Phaser.Math.Between(0, 100) < 50) this.showActionText(interceptor, interceptSkill.names[0], "#f1c40f");
                }
                if (this.isHighBall) trapChance -= 15;
                if (this.currentGimmick === 'badWeather') trapChance -= 20;
                if (interceptor.playerData.position === 'GK') trapChance += 30;

                if (Math.random() * 100 > trapChance && this.ballSpeed > 5) {
                    this.showActionText(interceptor, "トラップ:失敗", "#e74c3c");
                    this.lastTouchedByPlayerTeam = interceptor.isPlayerTeam;
                    this.ball.owner = null; this.ballTarget = null; this.ballSpeed = this.ballSpeed * 0.5;
                    this.ball.angle = this.ball.angle + (Math.random() * Math.PI - Math.PI/2);
                    this.isHighBall = true; this.ballZVelocity = 5;
                    interceptor.actionCooldown = 10; // Prevent interceptor from instantly trying to trap it again
                } else {
                    this.showActionText(interceptor, "トラップ:成功", "#3498db");
                    this.ball.owner = interceptor; this.lastTouchedByPlayerTeam = interceptor.isPlayerTeam;
                    this.ballTarget = null; this.isHighBall = false; this.ball.z = 0;
                }
            }
        }

        if (this.ball.owner) {
            this.ball.x = this.ball.owner.x + (this.ball.owner.dirX > 0 ? 10 : -10);
            this.ball.y = this.ball.owner.y + 10;
            // Prevent setpiece out-of-bounds loops
            this.ball.x = Phaser.Math.Clamp(this.ball.x, 15, 785);
            this.ball.y = Phaser.Math.Clamp(this.ball.y, 15, 585);

            const enemies = this.ball.owner.isPlayerTeam ? this.opponentSprites : this.playerSprites;
            // Only engage duel if an enemy is very close, AND neither player is already stunned
            const tacklers = enemies.filter(p => {
                let range = 20;
                const rangeSkill = window.Player.getSkillEffectFor(p.playerData, "RANGE_UP", "tackle", this.getActiveConditions(p));
                if (rangeSkill.value > 0) range += rangeSkill.value;
                return Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y) < range && p.stunTimer <= 0 && this.ball.owner.stunTimer <= 0;
            });

            if (tacklers.length > 0) {
                let tackler = tacklers[0];
                const activeConditions = this.getActiveConditions(tackler);
                let tackleStat = this.getEffectiveStat(tackler, 'defense', activeConditions);
                let dribbleStat = this.getEffectiveStat(this.ball.owner, 'speed', this.getActiveConditions(this.ball.owner));

                if (this.activeBuff && this.activeBuff.target === 'tackle' && tackler.isPlayerTeam) tackleStat += this.activeBuff.value;
                if (this.activeBuff && this.activeBuff.target === 'dribble' && this.ball.owner.isPlayerTeam) dribbleStat += this.activeBuff.value;

                const tackleSkill = window.Player.getSkillEffectFor(tackler.playerData, "SUCCESS_RATE_UP", "tackle", activeConditions);
                if (tackleSkill.value > 0) {
                    tackleStat += tackleSkill.value;
                    if (Phaser.Math.Between(0, 100) < 50) this.showActionText(tackler, tackleSkill.names[0], "#f1c40f");
                }
                const dribblerConditions = this.getActiveConditions(this.ball.owner);
                const dribbleSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "dribble", dribblerConditions);
                if (dribbleSkill.value > 0) {
                    dribbleStat += dribbleSkill.value;
                    if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, dribbleSkill.names[0], "#f1c40f");
                }

                const drawFoulSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "drawFoul", dribblerConditions);
                let foulChance = (tackleStat / 3);
                if (drawFoulSkill.value > 0) foulChance += drawFoulSkill.value;

                if (Math.random() * 100 < tackleStat - (dribbleStat / 2)) {
                    // Tackle Success! FW loses the ball.
                    const oldOwner = this.ball.owner;
                    this.ball.owner = tackler;
                    this.lastTouchedByPlayerTeam = tackler.isPlayerTeam;
                    this.showActionText(tackler, "タックル:成功", "#3498db");
                    this.showActionText(oldOwner, "ドリブル:失敗", "#e74c3c");

                    // Stun the FW (loser)
                    oldOwner.stunTimer = 25;
                    // White flash effect
                    if (oldOwner.list && oldOwner.list.length > 0) {
                        oldOwner.list.forEach(part => {
                            if (part.type === 'Rectangle' || part.type === 'Arc' || part.type === 'Ellipse' || part.type === 'Graphics') {
                                if (part.setTintFill) part.setTintFill(0xffffff);
                            }
                        });
                        this.time.delayedCall(500, () => {
                            oldOwner.list.forEach(part => { if(part.clearTint) part.clearTint(); });
                        });
                    }

                    const flash = this.add.circle(this.ball.x, this.ball.y, 15, 0xe74c3c, 0.6);
                    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
                } else if (Math.random() * 100 < foulChance) {
                    this.showActionText(tackler, "ファウル", "#e74c3c");
                    this.ball.owner = null; this.ballSpeed = 0;
                    const isPK = (this.ball.y > 150 && this.ball.y < 450) && ((tackler.isPlayerTeam && this.ball.x < 160) || (!tackler.isPlayerTeam && this.ball.x > 640));
                    this.handleSetPiece(isPK ? 'Penalty Kick' : 'Free Kick', this.ball.x, this.ball.y, !tackler.isPlayerTeam);
                    return;
                } else {
                    // Dribble Success! DF loses the duel.
                    this.showActionText(this.ball.owner, "ドリブル:成功", "#3498db");

                    // Stun the DF (loser)
                    tackler.stunTimer = 25;
                    if (tackler.list && tackler.list.length > 0) {
                        tackler.list.forEach(part => {
                            if (part.type === 'Rectangle' || part.type === 'Arc' || part.type === 'Ellipse' || part.type === 'Graphics') {
                                if (part.setTintFill) part.setTintFill(0xffffff);
                            }
                        });
                        this.time.delayedCall(500, () => {
                            tackler.list.forEach(part => { if(part.clearTint) part.clearTint(); });
                        });
                    }

                    // Dribbler teleports past the defender (Game-like breakthrough)
                    const pushX = (this.ball.owner.dirX > 0) ? 30 : -30;
                    this.ball.owner.x += pushX;
                    // Clamp to bounds just in case
                    this.ball.owner.x = Phaser.Math.Clamp(this.ball.owner.x, 15, 785);
                }
            }

            let forceShoot = false; let forceLongBall = false;
            if (this.activeBuff && this.ball.owner.isPlayerTeam) {
                if (['shoot', 'cutInShoot'].includes(this.activeBuff.actionType)) forceShoot = true;
                if (['longBall', 'throughBall', 'switchPlay', 'earlyCross'].includes(this.activeBuff.actionType)) forceLongBall = true;
            }

            let currentAction = this.ball.owner.currentAction;
            // Set-piece action restrictions
            if (this.currentSetPieceType) {
                // Cannot dribble or keep the ball during a set piece restart
                if (currentAction === 'Dribble' || currentAction === 'Keep' || currentAction === 'Clear') {
                    currentAction = 'Pass';
                }
                // Cannot shoot directly from throw-ins or indirect free kicks (Offside)
                if (this.currentSetPieceType === 'Throw In' || this.currentSetPieceType === 'Offside') {
                    if (currentAction === 'Shoot' || forceShoot) { currentAction = 'Pass'; forceShoot = false; }
                }
            }

            if (forceShoot || forceLongBall || ['Pass', 'Shoot', 'Clear'].includes(currentAction)) {
                const isPlayer = this.ball.owner.isPlayerTeam;
                const targetGoalX = isPlayer ? 800 : 0;

                if (forceShoot || currentAction === 'Shoot') {
                    const activeConditions = this.getActiveConditions(this.ball.owner);
                    let shootStat = this.getEffectiveStat(this.ball.owner, 'shoot', activeConditions);
                    if (isPlayer && this.activeBuff && (this.activeBuff.target === 'shoot' || this.activeBuff.target === 'header')) shootStat += this.activeBuff.value;

                    const shootSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "shoot", activeConditions);
                    if (shootSkill.value > 0) {
                        shootStat += shootSkill.value;
                        if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, shootSkill.names[0], "#f1c40f");
                    }
                    if (this.isHighBall || (this.activeBuff && this.activeBuff.target === 'header')) {
                        const headerSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "header", activeConditions);
                        if (headerSkill.value > 0) {
                            shootStat += headerSkill.value;
                            if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, headerSkill.names[0], "#f1c40f");
                        }
                    }
                    if (this.activeBuff && this.activeBuff.actionType === 'runBehind') {
                        const runBehindSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "runBehind", activeConditions);
                        if (runBehindSkill.value > 0) {
                            shootStat += runBehindSkill.value;
                            if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, runBehindSkill.names[0], "#f1c40f");
                        }
                    }

                    const isBehind = isPlayer ? scoreDiff < 0 : scoreDiff > 0;

                    const oppTeamStats = isPlayer ? this.opponentTeamData.getOverallStrength() : this.playerTeamData.getOverallStrength();
                    this.createKickEffect(this.ball.x, this.ball.y);
                    this.ballTarget = {x: targetGoalX, y: 300 + (Math.random()*100 - 50)};
                    this.ballSpeed = 25;

                    // Keep a reference to the kicker before clearing owner
                    const kicker = this.ball.owner;

                    this.ball.cooldown = 5;

                    const defendingTeamForSave = isPlayer ? this.opponentSprites : this.playerSprites;
                    const defendingGKForSave = defendingTeamForSave.find(p => p.playerData.position === 'GK');
                    if (defendingGKForSave) {
                        const gkConditions = this.getActiveConditions(defendingGKForSave);
                        const saveSkill = window.Player.getSkillEffectFor(defendingGKForSave.playerData, "SUCCESS_RATE_UP", "gkSave", gkConditions);
                        if (saveSkill.value > 0) {
                             shootStat -= saveSkill.value;
                        }
                    }

                    if (Math.random() * 100 < shootStat - (oppTeamStats / 2) + 20) {
                        this.showActionText(kicker, "シュート:成功", "#3498db");
                        this.ballTarget = {x: isPlayer ? 850 : -50, y: Phaser.Math.Between(265, 335)};
                    } else {
                        if (Math.random() > 0.5) {
                            this.showActionText(kicker, "シュート:失敗", "#e74c3c");
                            const defendingTeam = isPlayer ? this.opponentSprites : this.playerSprites;
                            const defendingGK = defendingTeam.find(p => p.playerData.position === 'GK');
                            if (defendingGK) {
                                const gkConditions = this.getActiveConditions(defendingGK);
                                const saveSkill = window.Player.getSkillEffectFor(defendingGK.playerData, "SUCCESS_RATE_UP", "gkSave", gkConditions);
                                if (saveSkill.value > 0 && Phaser.Math.Between(0, 100) < 50) {
                                    this.showActionText(defendingGK, saveSkill.names[0], "#f1c40f");
                                }
                                this.showActionText(defendingGK, "セーブ:成功", "#f1c40f");
                            }
                            this.ballTarget = {x: isPlayer ? 780 : 20, y: 300}; this.ballSpeed = 10; this.ball.cooldown = 5;
                        } else {
                            this.showActionText(kicker, "シュート:失敗", "#e74c3c");
                            this.ballTarget = {x: isPlayer ? 850 : -50, y: Math.random() > 0.5 ? 200 : 400};
                        }
                    }

                    kicker.actionCooldown = 15;
                    this.ball.owner = null;
                } else if (currentAction === 'Clear') {
                    this.createKickEffect(this.ball.x, this.ball.y);
                    this.ballTarget = {x: isPlayer ? 800 : 0, y: Math.random() * 600};
                    this.ballSpeed = 25; this.isHighBall = true; this.ballZVelocity = 20;
                    this.ball.owner.actionCooldown = 15;
                    this.ball.cooldown = 5;
                    this.ball.owner = null;
                } else {
                    const teammates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(p => p !== this.ball.owner);
                    let targetMate = this.ball.owner.lastEvaluation ? this.ball.owner.lastEvaluation.bestPassTarget : teammates[0];
                    if (!targetMate) targetMate = teammates[0];

                    let isForward = isPlayer ? targetMate.x > this.ball.owner.x : targetMate.x < this.ball.owner.x;
                    let isLongDist = Math.abs(targetMate.x - this.ball.owner.x) > 150 || Math.abs(targetMate.y - this.ball.owner.y) > 150;
                    let isLongBall = forceLongBall || (isForward && isLongDist);
                    let isThroughBall = isForward && isLongDist && targetMate.playerData.position === 'CF';


                    let isOffside = false;
                    const offsideLineX = this.getOffsideLineX(!isPlayer);
                    if (isPlayer) {
                        // Player attacking right (goal 800)
                        if (targetMate.x > 400 && targetMate.x > this.ball.x && targetMate.x > offsideLineX) {
                            isOffside = true;
                        }
                    } else {
                        // Opponent attacking left (goal 0)
                        if (targetMate.x < 400 && targetMate.x < this.ball.x && targetMate.x < offsideLineX) {
                            isOffside = true;
                        }
                    }

                    if (isOffside) {
                        this.showActionText(this.ball.owner, "パス", "#f1c40f");
                        this.showActionText(targetMate, "オフサイド", "#e74c3c");
                        this.handleSetPiece('Indirect Free Kick', targetMate.x, targetMate.y, !isPlayer);
                        return;
                    }

                    const activeConditions = this.getActiveConditions(this.ball.owner);
                    let passStat = this.getEffectiveStat(this.ball.owner, 'pass', activeConditions);
                    if (isPlayer && this.activeBuff && this.activeBuff.target === 'pass') passStat += this.activeBuff.value;
                    const staminaFactor2 = Math.max(0.3, this.ball.owner.playerData.currentStamina / 100);
                    let effectivePassStat = passStat * staminaFactor2;

                    const passSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "pass", activeConditions);
                    if (passSkill.value > 0) {
                        effectivePassStat += passSkill.value;
                        if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, passSkill.names[0], "#f1c40f");
                    }

                    let passType = 'pass';
                    if (this.ball.owner.currentAction === 'Through Pass') passType = 'throughPass';
                    else if (isLongBall) passType = 'longPass';
                    else if (this.ball.owner.currentAction === 'Cross' || this.ball.owner.y < 160 || this.ball.owner.y > 440) passType = 'cross';

                    if (passType !== 'pass') {
                         const subPassSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", passType, activeConditions);
                         if (subPassSkill.value > 0) {
                              effectivePassStat += subPassSkill.value;
                              if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, subPassSkill.names[0], "#f1c40f");
                         }
                    }

                    if (this.currentGimmick === 'badWeather') { effectivePassStat -= 20; if (isLongBall) effectivePassStat += 30; }

                    if (Math.random() * 100 > effectivePassStat) {
                        this.showActionText(this.ball.owner, "パス:失敗", "#e74c3c");

                        // Misplace the pass severely towards an enemy or random space
                        const enemies = isPlayer ? this.opponentSprites : this.playerSprites;
                        // Find an enemy somewhere near the target
                        const nearbyEnemies = enemies.filter(e => Phaser.Math.Distance.Between(e.x, e.y, targetMate.x, targetMate.y) < 150);

                        if (nearbyEnemies.length > 0) {
                            // Pass directly to the enemy by mistake
                            const badTarget = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
                            this.ballTarget = {x: badTarget.x, y: badTarget.y};
                        } else {
                            // Wildly inaccurate pass
                            this.ballTarget = {
                                x: targetMate.x + (Math.random() > 0.5 ? 100 : -100),
                                y: targetMate.y + (Math.random() > 0.5 ? 100 : -100)
                            };
                        }

                        // Slower ball speed so enemies can intercept easily
                        this.ballSpeed = 12;
                        this.isHighBall = Math.random() > 0.5; // Sometimes randomly pops up
                        this.ballZVelocity = this.isHighBall ? 10 : 0;

                    } else {
                        this.showActionText(this.ball.owner, "パス:成功", "#3498db");
                        this.ballTarget = {x: targetMate.x, y: targetMate.y};

                        if (isLongBall) {
                            let leadDist = isThroughBall ? (isPlayer ? 100 : -100) : 0;
                            this.ballTarget.x += leadDist;
                            this.ballSpeed = 22; this.isHighBall = true; this.ballZVelocity = 15;
                        } else {
                            this.ballSpeed = 16; this.isHighBall = false;
                        }
                    }

                    // Apply cooldown so the kicker doesn't immediately trap their own bad pass
                    this.ball.owner.actionCooldown = 15;
                    this.ball.cooldown = 3; // Short immunity so it leaves the kicker's feet safely
                    this.ball.owner = null;
                    if (forceLongBall) this.activeBuff = null;
                    this.createKickEffect(this.ball.x, this.ball.y);
                }
            }
        }

        this.playerSprites.forEach(p => { p.setDepth(p.y); });
        this.opponentSprites.forEach(p => { p.setDepth(p.y); });
        if (this.ballContainer) {
            this.ballContainer.setDepth(this.ball.y);
            this.ballContainer.x = this.ball.x;
            this.ballContainer.y = this.ball.y - this.ball.z;
            const shadow = this.ballContainer.list[0];
            if (shadow) {
                shadow.y = 8 + this.ball.z;
                let scale = Math.max(0.2, 1 - (this.ball.z / 100));
                shadow.scaleX = scale; shadow.scaleY = scale;
                shadow.alpha = Math.max(0.1, 0.3 - (this.ball.z / 200));
            }
            if (this.ballSpeed > 0) this.ballSprite.rotation += 0.2;
        }
    }

    createKickEffect(x, y) {
        let shockwave = this.add.circle(x, y, 5, 0xffffff, 0.8);
        shockwave.setStrokeStyle(2, 0xffffff);
        this.tweens.add({ targets: shockwave, scale: 3, alpha: 0, duration: 200, onComplete: () => shockwave.destroy() });
    }

    resetPositions() {
        const isPlayerKickoff = (this.score.player + this.score.opponent) % 2 === 0;
        let kickOffTeam = isPlayerKickoff ? this.playerSprites : this.opponentSprites;
        let forwards = kickOffTeam.filter(p => p.playerData.position === 'CF' || p.playerData.position === 'WG' || p.expectedPosStr === 'CF' || p.expectedPosStr === 'WG');
        if (forwards.length < 2) forwards = kickOffTeam.slice(0, 2);
        let striker = forwards[0]; let support = forwards[1];

        this.playerSprites.forEach((p, idx) => {
            const isGK = idx === 0;
            const slotDef = window.MasterData.Formations[this.playerTeamData.formation]?.slots[idx] || {};
            const tier = slotDef.baseMatrix ? slotDef.baseMatrix.tier : 'Middle';
            const offX = slotDef.offsetX || 0;
            const offY = slotDef.offsetY || 0;

            if (isGK) { p.x = 50; }
            else if (tier === 'Defensive' || p.playerData.position === 'CB' || p.playerData.position === 'SB') { p.x = 160 + offX; }
            else if (tier === 'Middle' || p.playerData.position === 'CDM' || p.playerData.position === 'CM' || p.playerData.position === 'SH') { p.x = 280 + offX; }
            else { p.x = isPlayerKickoff ? 360 + offX : 340 + offX; }

            p.y = 300 + offY;

            // Enforce bounds
            if (p.x > 395) p.x = 395;
            if (p.y < 65) p.y = 65; if (p.y > 535) p.y = 535;

            if (isPlayerKickoff) {
                if (p !== striker && p !== support && Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 320;
            } else {
                if (Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 320;
            }
        });

        this.opponentSprites.forEach((p, idx) => {
            const isGK = idx === 0;
            const slotDef = window.MasterData.Formations[this.opponentTeamData.formation]?.slots[idx] || {};
            const tier = slotDef.baseMatrix ? slotDef.baseMatrix.tier : 'Middle';
            const offX = slotDef.offsetX || 0;
            const offY = slotDef.offsetY || 0;

            if (isGK) { p.x = 750; }
            else if (tier === 'Defensive' || p.playerData.position === 'CB' || p.playerData.position === 'SB') { p.x = 640 - offX; }
            else if (tier === 'Middle' || p.playerData.position === 'CDM' || p.playerData.position === 'CM' || p.playerData.position === 'SH') { p.x = 520 - offX; }
            else { p.x = !isPlayerKickoff ? 440 - offX : 460 - offX; }

            p.y = 300 + offY;

            if (p.x < 405) p.x = 405;
            if (p.y < 65) p.y = 65; if (p.y > 535) p.y = 535;

            if (!isPlayerKickoff) {
                if (p !== striker && p !== support && Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 480;
            } else {
                if (Phaser.Math.Distance.Between(p.x, p.y, 400, 300) < 75) p.x = 480;
            }
        });

        this.ball.x = 400; this.ball.y = 300; this.ball.z = 0; this.ballSpeed = 0; this.isHighBall = false;

        // Place striker and support in center circle AFTER enforcing own half rule for others
        if (striker) { striker.x = 400 - (isPlayerKickoff ? 5 : -5); striker.y = 300; this.ball.owner = striker; }
        if (support) { support.x = 400 - (isPlayerKickoff ? 20 : -20); support.y = 320; }

        this.matchState = 'kickoff'; this.kickoffTimer = 20;
    }

    triggerGoal(isPlayerTeam) {
        if (isPlayerTeam) this.score.player++; else this.score.opponent++;
        this.scoreText.setText(`${this.playerTeamData.name} ${this.score.player} - ${this.score.opponent} ${this.opponentTeamData.name}`);
        const text = this.add.text(400, 300, 'GOAL!', { fontSize: '64px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({ targets: text, scale: 1.5, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
    }

    finishMatchInstantly() {
        while (this.matchTime < 90) {
            this.matchTime += 1;
            const playerStr = this.playerTeamData.getOverallStrength();
            const oppStr = this.opponentTeamData.getOverallStrength();
            if (Math.random() < 0.05) { if (Math.random() * 100 < playerStr / 2) this.score.player++; }
            if (Math.random() < 0.05) { if (Math.random() * 100 < oppStr / 2) this.score.opponent++; }
        }
        this.logicTimer.remove();
        this.endMatch(this.score.player, this.score.opponent);
    }

    endMatch(playerScore, oppScore) {
        this.scene.pause();
        const resultBg = this.add.rectangle(400, 300, 400, 200, 0x000000, 0.9);
        resultBg.setStrokeStyle(4, 0xffffff);
        this.add.text(400, 250, 'MATCH FINISHED', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 300, `${playerScore} - ${oppScore}`, { fontSize: '48px', fill: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
        const btn = this.add.rectangle(400, 360, 150, 40, 0x3498db).setInteractive();
        this.add.text(400, 360, 'ロッカールームへ', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
        btn.on('pointerdown', () => {
            window.gameState.processPostMatch(playerScore, oppScore);
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
