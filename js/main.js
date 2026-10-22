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
        this.firstHalfStoppage = Math.floor(Math.random() * 3) + 1; // 1-3 mins
        this.secondHalfStoppage = Math.floor(Math.random() * 5) + 1; // 1-5 mins
        this.inStoppageTime = false;
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
                base.y = base.y < 300 ? 60 : 540; // Open up wide
            }
            if (pos === 'CDM') {
                base.x -= dir * 40; // CDM drops between CBs (Salida Lavolpiana / Rest defense)
            }
            if (pos === 'WG') {
                base.y = base.y < 300 ? 50 : 550; // WGs stay very wide
            }
            if (pos === 'CF') {
                base.x += dir * 40; // CF pushes deeper against opponent DF line
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


        // Role-based Dynamic Base Position Adjustments (Phase 3 - DF/GK)
        if (!p.playerData.isMob) {
            const role = p.playerData.role;
            if (pos === 'GK' && role === 'Sweeper') {
                if (lineShift < 0) { base.x += dir * 20; }
                else if (lineShift > 0) { base.x += dir * 40; }
            } else if (pos === 'CB') {
                if (role === 'Stopper' && !isAttacking) { base.x += dir * 10; }
                else if (role === 'Covering' && !isAttacking) { base.x -= dir * 20; }
            } else if (pos === 'SB') {
                if (role === 'Defensive') {
                    if (isAttacking) base.x -= dir * (Math.abs(lineShift) * 0.5);
                    base.y += (base.y < 300) ? 20 : -20;
                } else if (role === 'Attacking' && isAttacking) { base.x += dir * 40; }
                else if (role === 'Inverted' && isAttacking) {
                    base.x += dir * 20;
                    if (base.y < 300) base.y = 220; else base.y = 380;
                } else if (role === 'Wing-Back') { base.x += dir * 30; }
            } else if (pos === 'CDM') {
                if (role === 'Anchor') {
                    if (isAttacking) base.x -= dir * 10;
                    base.y = 300;
                } else if (role === 'Deep-Lying' && isAttacking) { base.x -= dir * 10; }
            }
        }


        // Role-based Dynamic Base Position Adjustments (Phase 3 - FW/MF)
        if (!p.playerData.isMob) {
            const role = p.playerData.role;
            if (pos === 'CM') {
                if (role === 'Advanced-Playmaker' && isAttacking) {
                    base.x += dir * 20;
                    if (base.y < 300) base.y = 220; else base.y = 380;
                } else if (role === 'Box-to-Box') {
                    if (isAttacking) base.x += dir * 30; else base.x -= dir * 30;
                }
            } else if (pos === 'CAM') {
                if (role === 'Shadow-Striker' && isAttacking) { base.x += dir * 40; }
                else if (role === 'Enganche') {
                    if (isAttacking) base.x -= dir * 15;
                    base.y = 300;
                }
            } else if (pos === 'WG') {
                if (role === 'Inside-Forward' && isAttacking) {
                    base.x += dir * 20;
                    if (this.ball.x > 500 && isPlayerTeam || this.ball.x < 300 && !isPlayerTeam) {
                        base.y = (base.y < 300) ? 220 : 380;
                    }
                } else if (role === 'Wide-Target-Man' && isAttacking) { base.x += dir * 30; }
                else if (role === 'Wide-Playmaker' && isAttacking) { base.y = (base.y < 300) ? 220 : 380; }
                else if (role === 'Hard-Worker' && !isAttacking) { base.x -= dir * 30; }
            } else if (pos === 'CF') {
                if (role === 'Poacher') { base.x += dir * 30; }
                else if (role === 'False-9' && isAttacking) { base.x -= dir * 40; }
                else if (role === 'Target-Man') { base.y = 300; }
            }
        }


        // Tuck-in mechanics for opposite side (Phase 3)
        if (!isAttacking && Math.abs(lineShift) > 20) {
            if (pos === 'SB' || pos === 'WG') {
                if (this.ball.y < 220 && base.y > 300) { base.y = Phaser.Math.Linear(base.y, 300, 0.4); }
                else if (this.ball.y > 380 && base.y < 300) { base.y = Phaser.Math.Linear(base.y, 300, 0.4); }
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

        let aura = this.add.circle(0, 15, 25, 0xffffff, 0);

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

        container.add([aura, shadow, legL, legR, shoeL, shoeR, pants, sleeveL, sleeveR, body, head, hair, eyeL, eyeR, numText]);

        container.aura = aura;
        container.legL = legL; container.legR = legR; container.shoeL = shoeL; container.shoeR = shoeR;
        container.bodyParts = [body, pants, sleeveL, sleeveR, head, hair, eyeL, eyeR, numText];
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
        this.add.text(20, 20, `環境: ${gimmickStr}`, { fontSize: '12px', fill: '#e74c3c' }).setOrigin(0, 0);

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
        this.commandSlots = [];
        const container = document.getElementById('command-slots-container');
        if (container) container.innerHTML = '';

        this.playerTeamData.microCommands.forEach((cmdId, i) => {
            const cmdData = Object.assign({}, window.MasterData.MicroCommands.find(c => c.id === cmdId));
            if (!cmdData) return;
            let cdReduction = 0;
            this.playerTeamData.relics.forEach(relicId => {
                const r = window.MasterData.Relics.find(r => r.id === relicId);
                if (r && r.effectType === "CD_REDUCTION") cdReduction += r.value;
            });
            cmdData.cooldown = cmdData.cooldown * (1 - cdReduction);

            const slotData = { cmdId: cmdId, data: cmdData, currentCd: 0, usesLeft: cmdData.maxUses !== undefined ? cmdData.maxUses : Infinity };
            this.commandSlots.push(slotData);

            if (container) {
                const slotEl = document.createElement('div');
                slotEl.className = 'command-slot';
                slotEl.id = `cmd-slot-${i}`;

                const nameEl = document.createElement('div');
                nameEl.className = 'command-name';
                nameEl.innerText = cmdData.name;

                const descEl = document.createElement('div');
                descEl.className = 'command-desc';
                descEl.innerText = `残り: ${slotData.usesLeft === Infinity ? '∞' : slotData.usesLeft}`;

                const cdBar = document.createElement('div');
                cdBar.className = 'command-cd-bar';
                cdBar.id = `cmd-cd-${i}`;

                slotEl.appendChild(nameEl);
                slotEl.appendChild(descEl);
                slotEl.appendChild(cdBar);

                slotEl.addEventListener('click', () => {
                    this.triggerCommand(i);
                });

                container.appendChild(slotEl);
            }
        });

        // Also initialize tactic buttons state
        this.realTimeTactic = 'Balance';

        // Add listeners to tactic toggles
        document.querySelectorAll('.tactic-btn').forEach(btn => {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                document.querySelectorAll('.tactic-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.realTimeTactic = e.target.getAttribute('data-tactic');
            });
        });

        // Sub btn listener
        const subBtn = document.getElementById('btn-sub-tactic');
        if (subBtn) {
            const newSubBtn = subBtn.cloneNode(true);
            subBtn.parentNode.replaceChild(newSubBtn, subBtn);
            newSubBtn.addEventListener('click', () => {
                if (this.matchState === 'playing') {
                    this.openSubstitutionUI('match');
                }
            });
            this.subBtnDOM = newSubBtn;
        }

        const microBar = document.getElementById('micro-command-bar');
        if (microBar) {
            microBar.style.display = 'flex';
        }
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

        const slotEl = document.getElementById(`cmd-slot-${slotIndex}`);
        if (slotEl) {
            const descEl = slotEl.querySelector('.command-desc');
            if (descEl) descEl.innerText = `残り: ${slot.usesLeft === Infinity ? '∞' : slot.usesLeft}`;
            if (slot.usesLeft <= 0) slotEl.classList.add('disabled');
        }

        // Visual feedback handled by DOM and new player effects instead of Phaser rectangles UI
        this.activeBuff = { target: slot.data.target, value: slot.data.value, actionType: slot.data.actionType, duration: 5 };

        if (slot.data.actionType === 'substitute') {
            const benchPlayer = this.playerTeamData.bench.find(p => p.skills.includes(52)) || this.playerTeamData.bench[0];
            if (benchPlayer) {
                if (!benchPlayer.dynamicStats) benchPlayer.dynamicStats = { ...benchPlayer.stats };
                benchPlayer.isSubbedIn = true;
                const worstPitch = this.playerSprites.sort((a,b) => a.playerData.condition - b.playerData.condition)[0];
                if (worstPitch) { worstPitch.playerData = benchPlayer; worstPitch.setStrokeStyle(2, 0xf1c40f); }
            }
        }
        if (slot.data.actionType === 'powerPlay') {
            const cb = this.playerSprites.find(p => p.playerData.position === 'CB');
            if (cb) cb.x = 600;
        }
        if (slot.data.actionType === 'comeback') {
            this.playerSprites.forEach(p => { p.playerData.currentStamina = 100; p.playerData.condition += 10; });
        }
        if (slot.data.actionType === 'shoot') {
            const fw = this.playerSprites.find(p => p.playerData.position === 'CF' || p.playerData.position === 'WG');
            if (fw) { fw.playerData.dynamicStats.shoot += 30; }
        }

        slot.currentCd = slot.data.cooldown;

        // Show effect on target player
        let targetSprites = [];
        if (slot.data.target === 'all') targetSprites = this.playerSprites;
        else if (slot.data.target === 'self' && this.ball.owner && this.ball.owner.isPlayerTeam) targetSprites = [this.ball.owner];
        else if (slot.data.target === 'FW') targetSprites = this.playerSprites.filter(p => p.playerData.position === 'CF' || p.playerData.position === 'WG');
        else if (slot.data.target === 'DF') targetSprites = this.playerSprites.filter(p => p.playerData.position === 'CB' || p.playerData.position === 'SB');
        else if (slot.data.target === 'MF') targetSprites = this.playerSprites.filter(p => p.playerData.position === 'CM' || p.playerData.position === 'CDM' || p.playerData.position === 'CAM');

        targetSprites.forEach(sprite => {
            const ring = this.add.circle(0, 0, 20, 0x3498db, 0);
            ring.setStrokeStyle(3, 0x00ffff);
            sprite.add(ring);
            this.tweens.add({
                targets: ring,
                scale: 2,
                alpha: 0,
                duration: 1000,
                onComplete: () => ring.destroy()
            });
        });
    }

    evaluateActions(p, context) {
        let actionScores = { Keep: 0, Dribble: 0, Pass: 0, Shoot: 0, Clear: 0, Support: 0, RunIntoSpace: 0, HoldPosition: 0, Press: 0, Mark: 0, Cover: 0, Delay: 0, Retreat: 0 };
        const pos = p.playerData.position; const role = p.playerData.role; const tactic = context.tactic;
        const isAttacking = context.isAttacking; const hasBall = context.hasBall; const pitchZone = this.getPitchZone(p.x, p.y, p.isPlayerTeam);
        const realTimeTactic = context.realTimeTactic;
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

        // Penetration Trigger (Tempo Switch) - Tactical Eye (Skill 72)
        if (p.isPlayerTeam && hasBall && (pos === 'CM' || pos === 'CAM')) {
            if (p.playerData.skills && (p.playerData.skills.includes(72))) {
                if (pitchZone.third === 'Attacking' && (pitchZone.lane === 'Left Half-space' || pitchZone.lane === 'Right Half-space' || pitchZone.lane === 'Center')) {
                    // Temporarily boost forwards and show action text if a check passes
                    if (Math.random() < 0.05 && this.time.now - (this.lastPenetrationTrigger || 0) > 10000) { // Throttle
                        this.lastPenetrationTrigger = this.time.now;
                        this.showActionText(p, "急襲！", "#f1c40f");

                        this.playerSprites.forEach(mate => {
                            if (mate !== p && (mate.playerData.position === 'CF' || mate.playerData.position === 'WG')) {
                                mate.penetrationTriggerBoost = 200;
                            }
                        });

                        actionScores.Pass += 100; // Force passing decision
                    }
                }
            }
        }

        // Apply any active penetration boost
        if (p.penetrationTriggerBoost > 0) {
            actionScores.RunIntoSpace += p.penetrationTriggerBoost;
            p.penetrationTriggerBoost -= 5; // Decay
        }

        if (hasBall) {
            const goalX = p.isPlayerTeam ? 800 : 0;
            const distToGoal = Phaser.Math.Distance.Between(p.x, p.y, goalX, 300);
            if (distToGoal < 250) {
                actionScores.Shoot = currentThreat * 1.5;
                actionScores.Shoot -= this.calculatePassRisk(p.x, p.y, goalX, 300, p.isPlayerTeam) * 0.8;
            } else if (distToGoal > 300) {
                actionScores.Shoot = 0;
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
                    actionScores.Press += 200; // Swarm immediately! Maximized score to override positional limits
                    actionScores.HoldPosition -= 100;
                    actionScores.Retreat -= 100;

                    // Allow up to 3 players to sprint at the ball holder regardless of normal constraints
                    const teammates = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
                    let sortedMates = teammates.slice().sort((a,b) =>
                        Phaser.Math.Distance.Between(a.x, a.y, this.ball.x, this.ball.y) - Phaser.Math.Distance.Between(b.x, b.y, this.ball.x, this.ball.y)
                    );
                    const rank = sortedMates.indexOf(p);
                    if (rank < 3) {
                         actionScores.Press += 300; // Force top 3 closest to swarm
                    }
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



        // --- Apply Real-Time Tactic Bias (Player Team Only) ---
        if (p.isPlayerTeam) {
            if (realTimeTactic === 'Attack') {
                if (!hasBall && isAttacking) {
                    actionScores.RunIntoSpace += 50; // Push forward aggressively
                    if (pos === 'CB' || pos === 'SB') actionScores.RunIntoSpace += 30; // Even defenders push up
                }
            } else if (realTimeTactic === 'Defend') {
                if (!hasBall && !isAttacking) {
                    actionScores.Retreat += 80;
                    actionScores.HoldPosition += 50;
                    actionScores.Press -= 40; // Don't break shape

                    if (pos === 'SB' || pos === 'WG') {
                        actionScores.Cover += 60; // Collapse into backline
                    }
                }
            }
        }

        // Role-based Action Evaluation Bias (Phase 3 - DF/GK)
        if (!p.playerData.isMob) {
            const role = p.playerData.role;
            if (pos === 'CB') {
                if (role === 'Stopper' && !hasBall && !isAttacking) {
                    if (pitchZone && pitchZone.third === 'Defensive') actionScores.Press += 50;
                } else if (role === 'Covering' && !hasBall && !isAttacking) {
                    actionScores.Delay += 30; actionScores.Retreat += 30; actionScores.HoldPosition += 30;
                } else if (role === 'Ball-Playing' && hasBall) {
                    actionScores.Dribble += 20; actionScores.Pass += 20;
                }
            } else if (pos === 'SB') {
                if (role === 'Defensive' && !hasBall && isAttacking) { actionScores.HoldPosition += 40; }
                else if (role === 'Attacking' && !hasBall && isAttacking) { actionScores.RunIntoSpace += 30; }
                else if (role === 'Attacking' && hasBall) { actionScores.Pass += 20; }
                else if (role === 'Wing-Back') {
                    if (!hasBall && isAttacking) actionScores.RunIntoSpace += 30;
                    else if (!hasBall && !isAttacking) actionScores.Retreat += 30;
                } else if (role === 'Inverted' && !hasBall && !isAttacking) {
                    if (pitchZone && pitchZone.third === 'Middle') actionScores.Press += 20;
                }
            } else if (pos === 'CDM') {
                if (role === 'Anchor' && !hasBall && !isAttacking) { actionScores.HoldPosition += 50; actionScores.Cover += 50; }
                else if (role === 'Destroyer' && !hasBall && !isAttacking) {
                    if (pitchZone && pitchZone.third === 'Middle') actionScores.Press += 60;
                } else if (role === 'Deep-Lying' && !hasBall && isAttacking) {
                    actionScores.Support += 40;
                } else if (role === 'Deep-Lying' && hasBall) {
                    actionScores.Pass += 30;
                }
            } else if (pos === 'GK') {
                if (role === 'Sweeper' && !hasBall && !isAttacking) {
                    if (pitchZone && pitchZone.third === 'Defensive') actionScores.Cover += 40;
                } else if (role === 'Classic' && !hasBall && isAttacking) {
                    actionScores.RunIntoSpace -= 50;
                }
            }
        }

        // Role-based Action Evaluation Bias (Phase 3 - FW/MF)
        if (!p.playerData.isMob) {
            const role = p.playerData.role;
            if (pos === 'CM') {
                if (role === 'Box-to-Box') {
                    if (!hasBall && isAttacking) actionScores.RunIntoSpace += 30;
                    else if (!hasBall && !isAttacking) { actionScores.Retreat += 30; actionScores.Press += 20; }
                } else if (role === 'Advanced-Playmaker' && hasBall) { actionScores.Pass += 40; }
                else if (role === 'Ball-Winning' && !hasBall && !isAttacking) { actionScores.Press += 50; }
            } else if (pos === 'CAM') {
                if (role === 'Shadow-Striker') {
                    if (!hasBall && isAttacking) actionScores.RunIntoSpace += 50;
                    if (hasBall) actionScores.Shoot += 30;
                } else if (role === 'Enganche') {
                    if (!hasBall && isAttacking) { actionScores.HoldPosition += 30; actionScores.Support += 30; }
                    if (hasBall) actionScores.Pass += 50;
                } else if (role === 'Dynamo' && !hasBall && !isAttacking) { actionScores.Press += 60; }
            } else if (pos === 'WG') {
                if (role === 'Classic-Winger' && hasBall) { actionScores.Dribble += 40; }
                else if (role === 'Inside-Forward') {
                    if (hasBall && pitchZone && pitchZone.third === 'Attacking') { actionScores.Dribble += 50; actionScores.Shoot += 40; }
                } else if (role === 'Wide-Target-Man' && hasBall) { actionScores.Keep += 40; actionScores.Pass += 20; }
                else if (role === 'Crosser' && hasBall) {
                    if (pitchZone && pitchZone.third === 'Attacking' && pitchZone.lane.includes('Outside')) actionScores.Pass += 50;
                } else if (role === 'Wide-Playmaker' && hasBall) { actionScores.Pass += 40; }
                else if (role === 'Hard-Worker' && !hasBall && !isAttacking) { actionScores.Retreat += 50; actionScores.Cover += 30; }
            } else if (pos === 'CF') {
                if (role === 'Poacher') {
                    if (!hasBall && isAttacking) actionScores.RunIntoSpace += 50;
                    if (hasBall) actionScores.Shoot += 40;
                } else if (role === 'Target-Man') {
                    if (hasBall) { actionScores.Keep += 50; actionScores.Pass += 30; actionScores.Shoot += 20; }
                } else if (role === 'False-9') {
                    if (!hasBall && isAttacking && pitchZone && pitchZone.third !== 'Attacking') actionScores.Support += 50;
                } else if (role === 'Complete') {
                    if (!hasBall && isAttacking) actionScores.RunIntoSpace += 20;
                    if (hasBall) { actionScores.Keep += 20; actionScores.Dribble += 20; actionScores.Shoot += 20; }
                }
            }
        }

        // False-9 Drop & Rotation Mechanics (Phase 3)
        if (!hasBall && isAttacking) {
            const false9s = (p.isPlayerTeam ? this.playerSprites : this.opponentSprites).filter(mate =>
                mate.playerData.position === 'CF' && mate.playerData.role === 'False-9'
            );
            false9s.forEach(f9 => {
                if (f9 !== p) {
                    const f9X = p.isPlayerTeam ? f9.x : 800 - f9.x;
                    if (f9X < 600) {
                        const role = p.playerData.role;
                        if (pos === 'WG' && role === 'Inside-Forward') actionScores.RunIntoSpace += 50;
                        else if (pos === 'CAM' && role === 'Shadow-Striker') actionScores.RunIntoSpace += 60;
                    }
                }
            });
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



        const activeConditions = this.getActiveConditions(p);

        validActions.forEach(action => {
            let score = actionScores[action];

            // Apply ACTION_WEIGHT_UP skill
            const targetMap = {
                'RunIntoSpace': 'runIntoSpace',
                'Shoot': 'shoot',
                'Pass': 'pass',
                'Clear': 'clear',
                'Dribble': 'dribble',
                'Press': 'press',
                'Tackle': 'tackle',
                'Cover': 'cover'
            };

            const skillTarget = targetMap[action];
            if (skillTarget) {
                const weightUpEffect = window.Player.getSkillEffectFor(p.playerData, "ACTION_WEIGHT_UP", skillTarget, activeConditions);
                if (weightUpEffect.value > 0) {
                    score += weightUpEffect.value;
                }
            }

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
                if (p.legL && p.legR) {
                    p.legL.y = 12; p.legR.y = 12; // Freeze animation
                }
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

            // Increase base speed by 1.7x overall
            const maxSpeed = (1.8 + (p.playerData.stats.speed / 100) * 1.6) * staminaFactor * urgency * 1.7;

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

                let bestAction = 'HoldPosition';
                const dir = p.isPlayerTeam ? 1 : -1;
                let base = this.getDynamicBasePosition(p, p.isPlayerTeam, isAttacking);

                if (p.gkKeepTimer && p.gkKeepTimer > 0) {
                    p.gkKeepTimer--;
                    bestAction = 'Keep';
                    p.currentAction = bestAction;
                } else {
                    const context = { tactic, isAttacking, hasBall, realTimeTactic: p.isPlayerTeam ? this.realTimeTactic : 'Balance' };
                    const evaluation = this.evaluateActions(p, context);
                    bestAction = evaluation.action;
                    p.currentAction = bestAction;
                    p.lastEvaluation = { bestPassTarget: context.bestPassTarget, targetLineX: evaluation.targetLineX };
                }

                // Target Y and X modifications for RealTimeTactic
                if (p.isPlayerTeam) {
                    // Player attacks towards X=800 (+), Opponent attacks towards X=0 (-)
                    const attackDirection = p.isPlayerTeam ? 1 : -1;
                    if (this.realTimeTactic === 'Attack') {
                        base.x += attackDirection * 50; // Shift whole team forward
                    } else if (this.realTimeTactic === 'Defend') {
                        base.x -= attackDirection * 100; // Shift whole team deep
                    }
                }

                if (p.chasingLooseBall && !this.ball.owner) {
                    bestAction = 'ChaseLooseBall';
                }

                switch (bestAction) {
                    case 'HoldPosition':
                        targetX = base.x;
                        targetY = Phaser.Math.Linear(base.y, this.ball.y, 0.3);
                        // Phase 3: V-Shape Chain for Defenders
                        if (!isAttacking && (p.playerData.position === 'CB' || p.playerData.position === 'SB')) {
                            const teammates = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
                            const pressingMates = teammates.filter(m => m !== p && m.currentAction === 'Press' && (m.playerData.position === 'CB' || m.playerData.position === 'SB'));
                            if (pressingMates.length > 0) {
                                let nearestPresser = pressingMates.reduce((prev, curr) => Phaser.Math.Distance.Between(p.x, p.y, curr.x, curr.y) < Phaser.Math.Distance.Between(p.x, p.y, prev.x, prev.y) ? curr : prev);
                                if (Phaser.Math.Distance.Between(p.x, p.y, nearestPresser.x, nearestPresser.y) < 150) {
                                    targetX -= dir * 30; // Deeper
                                    targetY = Phaser.Math.Linear(targetY, nearestPresser.y, 0.5); // Tuck in towards them
                                }
                            }
                        }
                        break;
                    case 'RunIntoSpace':
                        let targetForwardX = p.x + (dir * 80);
                        let offsideLineX = this.getOffsideLineX(!p.isPlayerTeam);
                        if (p.isPlayerTeam) offsideLineX -= 5; else offsideLineX += 5;
                        if (p.isPlayerTeam && targetForwardX > offsideLineX && offsideLineX > p.x) targetForwardX = offsideLineX;
                        if (!p.isPlayerTeam && targetForwardX < offsideLineX && offsideLineX < p.x) targetForwardX = offsideLineX;
                        targetX = targetForwardX;
                        targetY = p.y + (300 - p.y) * 0.1;

                        // Phase 3: Spatial Dispersion in Penalty Area
                        if (this.ball.owner && this.ball.owner.isPlayerTeam === p.isPlayerTeam) {
                            const bX = this.ball.owner.x; const bY = this.ball.owner.y;
                            if ((p.isPlayerTeam && bX > 600) || (!p.isPlayerTeam && bX < 200)) {
                                if (bY < 180 || bY > 420) {
                                    const attackDir = p.isPlayerTeam ? 1 : -1;
                                    const goalX = p.isPlayerTeam ? 750 : 50;
                                    const role = p.playerData.role || '';
                                    const isBallTop = bY < 300;

                                    if (p.playerData.position === 'CF') {
                                        targetX = goalX - attackDir * 30;
                                        targetY = isBallTop ? 250 : 350;
                                    } else if (role === 'Shadow-Striker' || role === 'Inside-Forward') {
                                        targetX = goalX - attackDir * 35;
                                        targetY = isBallTop ? 360 : 240;
                                    } else if (p.playerData.position === 'CAM') {
                                        targetX = goalX - attackDir * 60;
                                        targetY = 300;
                                    } else if (p.playerData.position === 'CM') {
                                        targetX = goalX - attackDir * 130;
                                        targetY = 300;
                                    }
                                }
                            }
                        }
                        break;
                    case 'Support':
                        if (this.ball.owner) {
                            // Phase 3: 3rd man runs / Triangle support
                            const ownerX = this.ball.owner.x;
                            const ownerY = this.ball.owner.y;

                            const enemies = p.isPlayerTeam ? this.opponentSprites : this.playerSprites;
                            let nearestEnemy = null; let minDist = Infinity;
                            enemies.forEach(e => {
                                const d = Phaser.Math.Distance.Between(ownerX, ownerY, e.x, e.y);
                                if (d < minDist) { minDist = d; nearestEnemy = e; }
                            });

                            let safeAngle = Phaser.Math.Angle.Between(ownerX, ownerY, p.x, p.y);

                            if (nearestEnemy && minDist < 150) {
                                const enemyAngle = Phaser.Math.Angle.Between(ownerX, ownerY, nearestEnemy.x, nearestEnemy.y);
                                const diffAngle = Phaser.Math.Angle.Wrap(safeAngle - enemyAngle);

                                if (Math.abs(diffAngle) < Math.PI / 4) { // Less than 45 degrees
                                    const sign = diffAngle >= 0 ? 1 : -1;
                                    safeAngle = enemyAngle + (sign * Math.PI / 3); // Shift to ~60 degrees
                                }
                            }

                            const idealDist = Phaser.Math.Between(90, 160);
                            targetX = ownerX + Math.cos(safeAngle) * idealDist;
                            targetY = ownerY + Math.sin(safeAngle) * idealDist;

                            if (Phaser.Math.Distance.Between(p.x, p.y, ownerX, ownerY) > idealDist + 50) {
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
                        if (this.ball.owner && p.currentAction === 'Press') {
                            // Phase 3: 1st Defender Cover Shadow arc approach
                            const bx = this.ball.x; const by = this.ball.y;
                            let angleToBall = Phaser.Math.Angle.Between(p.x, p.y, bx, by);

                            const pitchCenterY = 300;
                            const isAboveCenter = by < pitchCenterY;
                            const arcOffset = isAboveCenter ? -0.2 : 0.2;

                            const distToBall = Phaser.Math.Distance.Between(p.x, p.y, bx, by);
                            if (distToBall > 60) {
                                angleToBall += arcOffset; // Curve the run
                            }

                            targetX = bx + Math.cos(angleToBall + Math.PI) * 20;
                            targetY = by + Math.sin(angleToBall + Math.PI) * 20;
                        } else if (this.ball.owner) {
                            targetX = this.ball.x + (this.ball.owner.dirX * 20); targetY = this.ball.y;
                        } else {
                            targetX = this.ball.x; targetY = this.ball.y;
                        }
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
                        // Phase 3: V-Shape Chain for Defenders (Same as HoldPosition)
                        if (!isAttacking && (p.playerData.position === 'CB' || p.playerData.position === 'SB')) {
                            const teammates = p.isPlayerTeam ? this.playerSprites : this.opponentSprites;
                            const pressingMates = teammates.filter(m => m !== p && m.currentAction === 'Press' && (m.playerData.position === 'CB' || m.playerData.position === 'SB'));
                            if (pressingMates.length > 0) {
                                let nearestPresser = pressingMates.reduce((prev, curr) => Phaser.Math.Distance.Between(p.x, p.y, curr.x, curr.y) < Phaser.Math.Distance.Between(p.x, p.y, prev.x, prev.y) ? curr : prev);
                                if (Phaser.Math.Distance.Between(p.x, p.y, nearestPresser.x, nearestPresser.y) < 150) {
                                    targetX -= dir * 30;
                                    targetY = Phaser.Math.Linear(targetY, nearestPresser.y, 0.5);
                                }
                            }
                        }
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

            let finalForceX = p.lastForceX; let finalForceY = p.lastForceY;
            let totalMagnitude = Math.sqrt(finalForceX*finalForceX + finalForceY*finalForceY);

            if (totalMagnitude > 0) {
                let actualSpeed = Math.min(totalMagnitude, maxSpeed);
                let drainRate = 0;
                if (actualSpeed > 1.5) drainRate = 0.08; else if (actualSpeed > 0.5) drainRate = 0.02;
                if (p.lastSpeedX !== undefined) {
                    const currentVelX = (totalForceX / totalMagnitude) * actualSpeed;
                    const currentVelY = (totalForceY / totalMagnitude) * actualSpeed;
                    if (Math.abs(currentVelX - p.lastSpeedX) + Math.abs(currentVelY - p.lastSpeedY) > 2.0) drainRate += 0.05;

                    if (this.realTimeTactic === 'Attack' && p.isPlayerTeam) drainRate *= 1.5;
                    if (this.realTimeTactic === 'Defend' && p.isPlayerTeam) drainRate *= 0.8;
                    p.lastSpeedX = currentVelX; p.lastSpeedY = currentVelY;
                } else { p.lastSpeedX = (totalForceX / totalMagnitude) * actualSpeed; p.lastSpeedY = (totalForceY / totalMagnitude) * actualSpeed; }

                p.playerData.currentStamina -= (drainRate * (100 / p.playerData.stats.stamina));
                if (p.playerData.currentStamina < 1) p.playerData.currentStamina = 1;

                p.x += (totalForceX / totalMagnitude) * actualSpeed;
                p.y += (totalForceY / totalMagnitude) * actualSpeed;
                moved = actualSpeed > 0.1;

                // Swing Animation based on speed
                if (moved) {
                    p.animTick += actualSpeed * 0.2;
                    const swing = Math.sin(p.animTick) * 5;
                    if (p.legL && p.legR && p.shoeL && p.shoeR) {
                        p.legL.y = 12 + swing; p.shoeL.y = 17 + swing;
                        p.legR.y = 12 - swing; p.shoeR.y = 17 - swing;
                    }

                    const bounce = Math.abs(Math.sin(p.animTick)) * 2;
                    if (p.bodyParts) {
                        p.bodyParts.forEach(part => part.y = part.getData('baseY') !== undefined ? part.getData('baseY') - bounce : part.y);
                        if (p.bodyParts[0] && p.bodyParts[0].getData('baseY') === undefined) {
                            p.bodyParts.forEach(part => part.setData('baseY', part.y));
                        }
                    }
                }
            } else {
                p.playerData.currentStamina = Math.min(100, p.playerData.currentStamina + 0.05);
                if (p.legL && p.legR && p.shoeL && p.shoeR) {
                    p.legL.y = 12; p.shoeL.y = 17;
                    p.legR.y = 12; p.shoeR.y = 17;
                }
                if (p.bodyParts) {
                    p.bodyParts.forEach(part => {
                        if (part.getData('baseY') !== undefined) part.y = part.getData('baseY');
                    });
                }
            }

            // Aura for Tactic
            if (p.isPlayerTeam) {
                if (this.realTimeTactic === 'Attack') {
                    p.aura.setFillStyle(0xe74c3c, 0.4);
                    p.aura.scale = 1 + Math.sin(this.time.now / 100) * 0.1;
                } else if (this.realTimeTactic === 'Defend') {
                    p.aura.setFillStyle(0x3498db, 0.4);
                    p.aura.scale = 1 + Math.sin(this.time.now / 100) * 0.1;
                } else {
                    p.aura.setFillStyle(0xffffff, 0);
                }
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
                if (p.legL && p.legR && p.shoeL && p.shoeR) {
                    p.legL.y = 12 + Math.sin(p.animTick) * 3; p.legR.y = 12 + Math.sin(p.animTick + Math.PI) * 3;
                    p.shoeL.y = 17 + Math.sin(p.animTick) * 3; p.shoeR.y = 17 + Math.sin(p.animTick + Math.PI) * 3;
                }
                p.y += (Math.sin(p.animTick*2) > 0 ? 0.5 : -0.5);
                if (totalForceX > 0.5) p.dirX = 1; else if (totalForceX < -0.5) p.dirX = -1;
                p.scaleX = p.dirX;
                let numText = p.list[13]; if (numText) numText.scaleX = p.dirX;
            } else {
                if (p.legL && p.legR && p.shoeL && p.shoeR) {
                    p.legL.y = 12; p.legR.y = 12; p.shoeL.y = 17; p.shoeR.y = 17;
                }
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
            if (this.ballSpeed < 0.1) {
                this.ballTarget = null; this.ballSpeed = 0; this.isHighBall = false; this.ball.z = 0;
            } else {
                if (this.ballTarget && dist < 10 && this.ball.x > 5 && this.ball.x < 795 && this.ball.y > 60 && this.ball.y < 540) {
                     this.ballTarget = null; // Let the ball roll without a strict target coordinate
                }
                const angle = this.ballTarget ? Phaser.Math.Angle.Between(this.ball.x, this.ball.y, targetX, targetY) : (this.ball.angle || 0);
                this.ball.angle = angle;
                this.ball.x += Math.cos(angle) * this.ballSpeed; this.ball.y += Math.sin(angle) * this.ballSpeed;
                let friction = (this.currentGimmick === 'badWeather') ? 0.97 : 0.96;
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
                if (p.isPlayerTeam && pTeamChasers < 2 && p.playerData.position !== 'GK') { p.chasingLooseBall = true; p.targetMaintainTimer = 0; pTeamChasers++; }
                else if (!p.isPlayerTeam && oTeamChasers < 2 && p.playerData.position !== 'GK') { p.chasingLooseBall = true; p.targetMaintainTimer = 0; oTeamChasers++; }
                else { p.chasingLooseBall = false; }
            });

            let interceptor = null;
            for (let p of allPlayers) {
                const bDist = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                let interceptRadius = 22;
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

                this.showActionText(interceptor, "トラップ:成功", "#3498db");
                this.ball.owner = interceptor; this.lastTouchedByPlayerTeam = interceptor.isPlayerTeam;
                this.ballTarget = null; this.isHighBall = false; this.ball.z = 0;
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
                let dribbleStat = this.getEffectiveStat(this.ball.owner, 'speed', this.getActiveConditions(this.ball.owner)); // assuming speed acts as dribble stat based on previous logic
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
                } else {
                    const drawFoulSkill = window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "drawFoul", this.getActiveConditions(this.ball.owner));
                    let foulChance = (tackleStat / 3);
                    if (drawFoulSkill.value > 0) foulChance += drawFoulSkill.value;

                    if (Math.random() * 100 < foulChance) {
                        let text = "ファウル";
                        let color = "#e74c3c";
                        let isRedCard = false;

                        // Check for Bribe Referee
                        if (window.gameState.bribeReferee && !tackler.isPlayerTeam) {
                            isRedCard = true;
                            window.gameState.bribeReferee = false; // Consume effect
                            text = "一発退場 (裏工作)";
                        } else {
                            // Calculate normal card probability
                            let cardChance = 15; // Base 15% chance for a card on foul
                            if (tackler.playerData.skills.includes(78)) cardChance += 20; // 悪童: +20% card chance
                            if (tackler.playerData.skills.includes(79)) cardChance -= 10; // クリーンファイター: -10% card chance

                            // Check for relic 30 (紳士の品格) if tactler is player team
                            if (tackler.isPlayerTeam && window.gameState.playerTeam.relics.includes(30)) {
                                cardChance -= 15;
                            }

                            cardChance = Math.max(0, cardChance);

                            if (Math.random() * 100 < cardChance) {
                                // It's a card. Determine Yellow or Red.
                                const isDirectRed = Math.random() < 0.1; // 10% of cards are direct red

                                if (isDirectRed) {
                                    isRedCard = true;
                                    text = "🟥 レッドカード";
                                } else {
                                    if (!tackler.playerData.yellowCards) tackler.playerData.yellowCards = 0;
                                    tackler.playerData.yellowCards++;

                                    if (tackler.playerData.yellowCards >= 2) {
                                        isRedCard = true;
                                        text = "🟥 退場 (累積2枚)";
                                    } else {
                                        text = "🟨 イエローカード";
                                        color = "#f1c40f";
                                    }
                                }
                            }
                        }

                        this.showActionText(tackler, text, color);

                        if (isRedCard) {
                            tackler.playerData.isSentOff = true;
                            // Trigger send off processing in the main loop or handle directly here
                            this.handleSendOff(tackler);
                        }

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
                if (this.currentSetPieceType === 'Throw In' || this.currentSetPieceType === 'Offside' || this.currentSetPieceType === 'Indirect Free Kick') {
                    if (currentAction === 'Shoot' || forceShoot) { currentAction = 'Pass'; forceShoot = false; }
                }
                // Penalty Kicks MUST be shot
                if (this.currentSetPieceType === 'Penalty Kick') {
                    currentAction = 'Shoot';
                    forceShoot = true;
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
                    if (shootSkill.value > 0) {
                        shootStat += shootSkill.value;
                        if (Phaser.Math.Between(0, 100) < 50) this.showActionText(this.ball.owner, shootSkill.names[0], "#f1c40f");
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
                                this.ball.owner = defendingGK;
                                this.ballTarget = null;
                                this.ballSpeed = 0;
                                defendingGK.gkKeepTimer = 60;
                                defendingGK.currentAction = 'Keep';
                            } else {
                                this.ballTarget = {x: isPlayer ? 780 : 20, y: 300}; this.ballSpeed = 10; this.ball.cooldown = 5;
                            }
                        } else {
                            this.showActionText(kicker, "シュート:外れ", "#e74c3c");
                            this.ballTarget = {x: isPlayer ? 850 : -50, y: Phaser.Math.Between(220, 380)};
                        }
                    }

                    kicker.actionCooldown = 15;
                    this.ball.owner = null;
                } else if (currentAction === 'Clear') {
                    this.createKickEffect(this.ball.x, this.ball.y);
                    this.ballTarget = {x: isPlayer ? 800 : 0, y: (this.ball.y < 300) ? 0 : 600};
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

                    this.showActionText(this.ball.owner, "パス", "#3498db");
                    this.ballTarget = {x: targetMate.x, y: targetMate.y};

                    if (isLongBall) {
                        let leadDist = isThroughBall ? (isPlayer ? 100 : -100) : 0;
                        this.ballTarget.x += leadDist;
                        this.ballSpeed = Math.min(11, Math.max(5, Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y) / 22)) + 5; this.isHighBall = true; this.ballZVelocity = 15;
                    } else {
                        this.ballSpeed = Math.min(11, Math.max(5, Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y) / 22)); this.isHighBall = false;
                    }

                    // Apply angular deviation based on pass stat/pressure (max +- 12 degrees / 0.21 radians)
                    const originalAngle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y);
                    const originalDist = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.ballTarget.x, this.ballTarget.y);
                    const angleDev = (Math.random() - 0.5) * 0.42;
                    const newAngle = originalAngle + angleDev;
                    this.ballTarget.x = this.ball.x + Math.cos(newAngle) * originalDist;
                    this.ballTarget.y = this.ball.y + Math.sin(newAngle) * originalDist;

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
            this.ballContainer.y = this.ball.y;

            const shadow = (this.ballContainer.list && this.ballContainer.list.length > 0) ? this.ballContainer.list[0] : null;
            const ballBody = (this.ballContainer.list && this.ballContainer.list.length > 1) ? this.ballContainer.list[1] : null;

            if (shadow) {
                let scale = Math.max(0.2, 1 - (this.ball.z / 100));
                shadow.scaleX = scale; shadow.scaleY = scale;
                shadow.alpha = Math.max(0.1, 0.4 - (this.ball.z / 200));
            }
            if (ballBody) {
                ballBody.y = -this.ball.z;
            }
            if (this.ballSprite && this.ballSpeed > 0) this.ballSprite.rotation += 0.2;
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

        this.matchState = 'celebration';

        const text = this.add.text(400, 300, 'GOAL!!!', {
            fontSize: '80px',
            fill: '#f1c40f',
            fontStyle: 'bold',
            stroke: '#c0392b',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(2000).setScale(0.1);

        this.tweens.add({
            targets: text,
            scale: 1.5,
            duration: 800,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: text,
                    alpha: 0,
                    delay: 2000,
                    duration: 500,
                    onComplete: () => {
                        text.destroy();
                        this.resetPositions();
                    }
                });
            }
        });

        // Find the scorer (last touched) and make them jump
        let scorer = this.ball.owner;
        if (!scorer) {
            // Find closest player to goal
            const team = isPlayerTeam ? this.playerSprites : this.opponentSprites;
            const goalX = isPlayerTeam ? 800 : 0;
            scorer = team.reduce((closest, p) => Math.abs(p.x - goalX) < Math.abs(closest.x - goalX) ? p : closest, team[0]);
        }

        if (scorer) {
            this.tweens.add({
                targets: scorer.bodyParts,
                y: '-=15',
                yoyo: true,
                repeat: 5,
                duration: 300,
                ease: 'Sine.easeInOut'
            });
        }
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
            document.getElementById('phaser-game').style.display = 'none';
            document.getElementById('ui-layer').style.pointerEvents = 'auto';

            window.gameState.processPostMatch(playerScore, oppScore);
            document.getElementById('ui-content').style.display = 'flex';
            document.querySelector('header.top-bar').style.display = 'flex';

            if (window.gameState.pendingVictoryReward) {
                managementUI.showVictoryReward();
            } else {
                managementUI.showDashboard();
            }
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
    document.getElementById('phaser-game').style.display = 'flex';
    document.getElementById('ui-layer').style.pointerEvents = 'none';

    if (!game) {
        game = new Phaser.Game(config);
    } else {
        game.scene.start('MatchScene');
    }
}
window.startGame = startGame;
