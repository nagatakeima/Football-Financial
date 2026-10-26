class MatchScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MatchScene' });
        this.gimmicks = ["none", "fever", "fortress", "badWeather"];
        this.currentGimmick = "none";
        this.matchState = 'kickoff';
        this.matchTime = 0;
        this.timeScale = 1;
        this.isSkip = false;
        this.playerSprites = [];
        this.opponentSprites = [];
        this.commandSlots = [];
        this.activeBuff = null;
        this.realTimeTactic = 'Balance';
        this.substitutionsLeft = 3;
        this.setPieceCooldown = 0;
        this.sideViewMode = 'stamina'; // 'stamina' | 'rating' | 'stats' | 'gameplan'
        this.rosterGroup = { home: 'starters', away: 'starters' };
    }

    create() {
        this.playerTeamData = window.gameState.playerTeam;
        this.opponentTeamData = window.managementUI.getNextOpponent() || window.gameState.league.teams[1];
        this.currentGimmick = window.gameState.upcomingGimmick || 'none';

        window.ChemistrySystem.calculateTeamChemistry(this.playerTeamData);
        window.ChemistrySystem.calculateTeamChemistry(this.opponentTeamData);

        this.score = { player: 0, opponent: 0 };
        this.matchStats = {
            playerPossessionTicks: 1,
            oppPossessionTicks: 1,
            playerShots: 0,
            oppShots: 0,
            playerBigChances: 0,
            oppBigChances: 0,
            scorersHome: [],
            scorersAway: []
        };

        this.matchTime = 0;
        this.firstHalfStoppage = Math.floor(Math.random() * 3) + 1;
        this.secondHalfStoppage = Math.floor(Math.random() * 4) + 1;
        this.inStoppageTime = false;
        this.halfNumber = 1;
        this.matchState = 'kickoff';
        this.setPieceTimer = 15;
        this.setPieceCooldown = 0;
        this.substitutionsLeft = 3;
        this.activeBuff = null;
        this.isSkip = false;
        this.timeScale = 1;

        this.drawTacticalPitch();
        this.createTeamsAndBall();
        this.createMatchUI();
        this.createCommandUI();
        this.resetPositions(true);

        if (this.logicTimer) this.logicTimer.remove();
        this.logicTimer = this.time.addEvent({
            delay: 33,
            callback: this.tickMatch,
            callbackScope: this,
            loop: true
        });
    }

    // =========================================================
    // FC27-Style Dark Emerald Tactical Pitch Drawing
    // =========================================================
    drawTacticalPitch() {
        const g = this.add.graphics();

        // Outer dark surround
        g.fillStyle(0x081a13, 1);
        g.fillRect(0, 0, 800, 600);

        // Turf stripes (FC27 Dark Emerald)
        const stripeCount = 10;
        const pitchLeft = 25;
        const pitchTop = 45;
        const pitchW = 750;
        const pitchH = 510;
        const stripeW = pitchW / stripeCount;

        for (let i = 0; i < stripeCount; i++) {
            g.fillStyle(i % 2 === 0 ? 0x0d291e : 0x103024, 1);
            g.fillRect(pitchLeft + i * stripeW, pitchTop, stripeW, pitchH);
        }

        // Crisp tactical pitch markings
        g.lineStyle(2, 0xffffff, 0.42);
        g.strokeRect(pitchLeft, pitchTop, pitchW, pitchH);

        // Halfway line & Center circle
        g.beginPath();
        g.moveTo(400, pitchTop);
        g.lineTo(400, pitchTop + pitchH);
        g.strokePath();
        g.strokeCircle(400, 300, 58);
        g.fillStyle(0xffffff, 0.65);
        g.fillCircle(400, 300, 3);

        // Penalty Areas
        g.strokeRect(pitchLeft, 165, 115, 270);
        g.strokeRect(pitchLeft + pitchW - 115, 165, 115, 270);

        // Goal Areas (6-yard box)
        g.strokeRect(pitchLeft, 235, 42, 130);
        g.strokeRect(pitchLeft + pitchW - 42, 235, 42, 130);

        // Penalty Spots
        g.fillCircle(pitchLeft + 82, 300, 3);
        g.fillCircle(pitchLeft + pitchW - 82, 300, 3);

        // Goals
        g.lineStyle(3, 0xffffff, 0.85);
        g.strokeRect(pitchLeft - 14, 255, 14, 90);
        g.strokeRect(pitchLeft + pitchW, 255, 14, 90);
    }

    createTeamsAndBall() {
        this.playerSprites.forEach(s => s.destroy());
        this.opponentSprites.forEach(s => s.destroy());
        this.playerSprites = [];
        this.opponentSprites = [];

        const initTeamRatings = (team) => {
            team.players.forEach((p, idx) => {
                p.currentStamina = p.stats.stamina || 80;
                p.matchRating = 6.0;
                p.matchGoals = 0;
                p.matchAssists = 0;
                p.jerseyNumber = idx + 1;
                if (!p.dynamicStats) p.dynamicStats = { ...p.stats };
            });
        };
        initTeamRatings(this.playerTeamData);
        initTeamRatings(this.opponentTeamData);

        const pSlots = window.MasterData.Formations[this.playerTeamData.formation]?.slots || [];
        this.playerTeamData.starting11.forEach((pData, idx) => {
            const expectedPos = pSlots[idx]?.expectedPosStr || pData.position;
            const sprite = this.createPlayerToken(pData, true, idx + 1, expectedPos);
            this.playerSprites.push(sprite);
        });

        const oSlots = window.MasterData.Formations[this.opponentTeamData.formation]?.slots || [];
        this.opponentTeamData.starting11.forEach((pData, idx) => {
            const expectedPos = oSlots[idx]?.expectedPosStr || pData.position;
            const sprite = this.createPlayerToken(pData, false, idx + 1, expectedPos);
            this.opponentSprites.push(sprite);
        });

        // Ball & Shadow
        if (this.ballContainer) this.ballContainer.destroy();
        const shadow = this.add.ellipse(0, 3, 12, 6, 0x000000, 0.45);
        const ballBody = this.add.circle(0, 0, 5.5, 0xffffff);
        ballBody.setStrokeStyle(1.5, 0x222222);
        this.ballSprite = ballBody;
        this.ballContainer = this.add.container(400, 300, [shadow, ballBody]);
        this.ballContainer.setDepth(30);

        this.ball = {
            x: 400,
            y: 300,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            owner: null,
            lastTouchTeam: true,
            cooldown: 0,
            isShot: false
        };
        this.ballSpeed = 0;
    }

    createPlayerToken(pData, isPlayerTeam, number, expectedPosStr) {
        const container = this.add.container(400, 300);
        container.setDepth(20);

        // Tactical Aura Ring
        const aura = this.add.circle(0, 0, 16, isPlayerTeam ? 0xe74c3c : 0xf1c40f, 0);
        // Active Ball Owner Ring
        const activeRing = this.add.circle(0, 0, 14, 0x2ecc71, 0);
        activeRing.setStrokeStyle(2, 0xffffff, 0.9);
        activeRing.setVisible(false);

        // Token Disk (FC27 Style: Home=Crimson/BlueGK, Away=Gold/GreenGK)
        const isGK = expectedPosStr === 'GK';
        const fillColor = isPlayerTeam
            ? (isGK ? 0x2980b9 : 0xd63031)
            : (isGK ? 0x27ae60 : 0xf1c40f);
        const strokeColor = isPlayerTeam ? 0xffffff : 0x111111;
        const textColor = isPlayerTeam ? '#ffffff' : '#111111';

        const tokenCircle = this.add.circle(0, 0, 10.5, fillColor, 1);
        tokenCircle.setStrokeStyle(2, strokeColor, 0.95);

        const numText = this.add.text(0, 0, String(pData.jerseyNumber || number), {
            fontSize: '11px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: textColor
        }).setOrigin(0.5);

        const nameLabel = this.add.text(0, 15, pData.name.split(' ').pop(), {
            fontSize: '9px',
            fontFamily: 'Arial',
            color: isPlayerTeam ? '#ecf0f1' : '#f9e79f',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Hidden compatibility refs so legacy checks never fail
        const dummyLegL = { y: 12 };
        const dummyLegR = { y: 12 };
        const dummyShoeL = { y: 17 };
        const dummyShoeR = { y: 17 };

        container.add([aura, activeRing, tokenCircle, numText, nameLabel]);

        container.playerData = pData;
        container.isPlayerTeam = isPlayerTeam;
        container.expectedPosStr = expectedPosStr;
        container.aura = aura;
        container.activeRing = activeRing;
        container.tokenCircle = tokenCircle;
        container.legL = dummyLegL;
        container.legR = dummyLegR;
        container.shoeL = dummyShoeL;
        container.shoeR = dummyShoeR;
        container.bodyParts = [];
        container.stunTimer = 0;
        container.actionCooldown = 0;
        container.gkKeepTimer = 0;
        container.aiTickTimer = 0;
        container.animTick = 0;
        container.currentAction = 'HoldPosition';

        return container;
    }

    // =========================================================
    // FC27 Broadcast Header & Side Panels Binding
    // =========================================================
    createMatchUI() {
        const tierNames = { 3: 'LEAGUE THREE', 2: 'LEAGUE TWO', 1: 'LEAGUE ONE' };
        const gimmickLabels = {
            none: '環境: 通常ピッチ',
            fever: '環境: 熱狂 (前半相手プレス増)',
            fortress: '環境: 要塞 (相手守備ブロック強化)',
            badWeather: '環境: 悪天候 (パス・トラップ精度低下)'
        };

        const setElText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setElText('fc-league-pill', `${tierNames[window.gameState.currentTier] || 'LEAGUE'} - 第${window.gameState.league?.currentMatchday || 1}節`);
        setElText('fc-home-name', this.playerTeamData.name);
        setElText('fc-away-name', this.opponentTeamData.name);
        setElText('fc-score-home', '0');
        setElText('fc-score-away', '0');
        setElText('fc-match-clock', '00:00');
        setElText('fc-scorers-home', '');
        setElText('fc-scorers-away', '');
        setElText('fc-gimmick-label', gimmickLabels[this.currentGimmick] || '環境: 通常');

        // Dummy Phaser text objects for legacy references
        this.timeText = { setText: (t) => setElText('fc-match-clock', t) };
        this.scoreText = {
            setText: () => {
                setElText('fc-score-home', String(this.score.player));
                setElText('fc-score-away', String(this.score.opponent));
            }
        };

        // Bind Speed Controls
        document.querySelectorAll('.fc-speed-btn[data-speed]').forEach(btn => {
            btn.onclick = () => {
                this.timeScale = Number(btn.getAttribute('data-speed')) || 1;
                if (this.logicTimer) this.logicTimer.paused = false;
                document.querySelectorAll('.fc-speed-btn[data-speed]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        const pauseBtn = document.getElementById('btn-pause-match');
        if (pauseBtn) {
            pauseBtn.onclick = () => {
                if (!this.logicTimer) return;
                this.logicTimer.paused = !this.logicTimer.paused;
                pauseBtn.textContent = this.logicTimer.paused ? '▶ 再開' : '⏸ 一時停止';
            };
        }

        const skipBtn = document.getElementById('btn-skip-match');
        if (skipBtn) {
            skipBtn.onclick = () => {
                this.isSkip = true;
                this.quickSimulateRemainingMatch();
            };
        }

        // Bind FC27 View Mode Tabs (Stamina | Rating | Stats | GamePlan)
        document.querySelectorAll('.fc-view-tab').forEach(tab => {
            tab.onclick = () => {
                this.sideViewMode = tab.getAttribute('data-view') || 'stamina';
                document.querySelectorAll('.fc-view-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateSidePanels();
            };
        });

        // Bind Starter / Bench Roster Tabs
        document.querySelectorAll('.fc-roster-tab').forEach(tab => {
            tab.onclick = () => {
                const side = tab.getAttribute('data-side');
                const grp = tab.getAttribute('data-group');
                this.rosterGroup[side] = grp;
                tab.parentElement.querySelectorAll('.fc-roster-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateSidePanels();
            };
        });

        this.updateSidePanels();
    }

    updateSidePanels() {
        const leftContent = document.getElementById('fc-left-content');
        const rightContent = document.getElementById('fc-right-content');
        const leftTabs = document.getElementById('fc-left-roster-tabs');
        const rightTabs = document.getElementById('fc-right-roster-tabs');
        if (!leftContent || !rightContent) return;

        if (this.sideViewMode === 'stats') {
            if (leftTabs) leftTabs.style.visibility = 'hidden';
            if (rightTabs) rightTabs.style.visibility = 'hidden';

            const totalTicks = this.matchStats.playerPossessionTicks + this.matchStats.oppPossessionTicks;
            const homePoss = Math.round((this.matchStats.playerPossessionTicks / totalTicks) * 100);
            const awayPoss = 100 - homePoss;

            leftContent.innerHTML = `
                <div class="fc-stats-big-container">
                    <div>
                        <div class="fc-stat-item-label">ポゼッション</div>
                        <div class="fc-stat-item-value">${homePoss}</div>
                    </div>
                    <div>
                        <div class="fc-stat-item-label">シュート</div>
                        <div class="fc-stat-item-value">${this.matchStats.playerShots}</div>
                    </div>
                    <div>
                        <div class="fc-stat-item-label">決定機</div>
                        <div class="fc-stat-item-value">${this.matchStats.playerBigChances}</div>
                    </div>
                </div>
            `;
            rightContent.innerHTML = `
                <div class="fc-stats-big-container fc-stats-big-Container-right">
                    <div>
                        <div class="fc-stat-item-label">ポゼッション</div>
                        <div class="fc-stat-item-value">${awayPoss}</div>
                    </div>
                    <div>
                        <div class="fc-stat-item-label">シュート</div>
                        <div class="fc-stat-item-value">${this.matchStats.oppShots}</div>
                    </div>
                    <div>
                        <div class="fc-stat-item-label">決定機</div>
                        <div class="fc-stat-item-value">${this.matchStats.oppBigChances}</div>
                    </div>
                </div>
            `;
            return;
        }

        if (this.sideViewMode === 'gameplan') {
            if (leftTabs) leftTabs.style.visibility = 'hidden';
            if (rightTabs) rightTabs.style.visibility = 'hidden';

            const tacticJp = { Balance: 'バランス', Attack: '猛攻 (ハイライン)', Defend: '全員守備 (リトリート)' };
            leftContent.innerHTML = `
                <div class="fc-gameplan-container">
                    <div class="fc-gp-title">${this.playerTeamData.name} 基本</div>
                    <div>
                        <div class="fc-gp-block-label">フォーメーション</div>
                        <div class="fc-gp-block-val">${this.playerTeamData.formation}</div>
                    </div>
                    <div>
                        <div class="fc-gp-block-label">ビルドアップスタイル</div>
                        <div class="fc-gp-block-val">${this.playerTeamData.manager?.preference || 'Balance'}</div>
                    </div>
                    <div>
                        <div class="fc-gp-block-label">リアルタイム指示</div>
                        <div class="fc-gp-block-val">${tacticJp[this.realTimeTactic] || 'バランス'}</div>
                    </div>
                </div>
            `;
            rightContent.innerHTML = `
                <div class="fc-gameplan-container" style="text-align: right;">
                    <div class="fc-gp-title">${this.opponentTeamData.name} 基本</div>
                    <div>
                        <div class="fc-gp-block-label">フォーメーション</div>
                        <div class="fc-gp-block-val">${this.opponentTeamData.formation}</div>
                    </div>
                    <div>
                        <div class="fc-gp-block-label">ビルドアップスタイル</div>
                        <div class="fc-gp-block-val">${this.opponentTeamData.manager?.preference || 'Counter'}</div>
                    </div>
                    <div>
                        <div class="fc-gp-block-label">チームコンセプト</div>
                        <div class="fc-gp-block-val">${this.opponentTeamData.specializedConcept || 'Normal'}</div>
                    </div>
                </div>
            `;
            return;
        }

        if (leftTabs) leftTabs.style.visibility = 'visible';
        if (rightTabs) rightTabs.style.visibility = 'visible';

        const renderRosterList = (team, isHome) => {
            const group = isHome ? this.rosterGroup.home : this.rosterGroup.away;
            const list = group === 'starters' ? team.starting11 : team.bench;

            return list.map((p, idx) => {
                const isOwner = this.ball && this.ball.owner && this.ball.owner.playerData === p;
                const stamPct = Math.max(0, Math.min(100, Math.round(((p.currentStamina ?? 80) / (p.stats.stamina || 80)) * 100)));
                const stamColor = stamPct > 55 ? '#2ecc71' : (stamPct > 25 ? '#f1c40f' : '#e74c3c');
                const goalIcons = p.matchGoals > 0 ? '⚽'.repeat(p.matchGoals) : '';

                let metricHtml = '';
                if (this.sideViewMode === 'rating') {
                    const rVal = group === 'bench' && !p.playedInMatch ? 'N/A' : (p.matchRating || 6.0).toFixed(1);
                    const rColor = rVal >= 7.0 ? '#2ecc71' : (rVal >= 6.0 ? '#f39c12' : '#95a5a6');
                    metricHtml = `<span class="fc-rating-badge" style="color: ${rColor};">${rVal}</span>`;
                } else {
                    metricHtml = `
                        <div class="fc-stamina-bar-wrap">
                            <div class="fc-stamina-bar-fill" style="width: ${stamPct}%; background: ${stamColor};"></div>
                        </div>
                    `;
                }

                const num = p.jerseyNumber || (group === 'starters' ? idx + 1 : idx + 12);
                if (isHome) {
                    return `
                        <div class="fc-player-row ${isOwner ? 'has-ball' : ''}">
                            <div class="fc-player-label">
                                <span class="fc-player-num">${num}</span>
                                <span class="fc-player-name">${p.name}</span>
                                <span class="fc-player-pos-tag">${p.position} ${goalIcons}</span>
                            </div>
                            ${metricHtml}
                        </div>
                    `;
                } else {
                    return `
                        <div class="fc-player-row ${isOwner ? 'has-ball' : ''}">
                            ${metricHtml}
                            <div class="fc-player-label">
                                <span class="fc-player-pos-tag">${goalIcons} ${p.position}</span>
                                <span class="fc-player-name">${p.name}</span>
                                <span class="fc-player-num">${num}</span>
                            </div>
                        </div>
                    `;
                }
            }).join('');
        };

        leftContent.innerHTML = renderRosterList(this.playerTeamData, true);
        rightContent.innerHTML = renderRosterList(this.opponentTeamData, false);
    }

    // =========================================================
    // Bottom Tactical Command Deck
    // =========================================================
    createCommandUI() {
        const container = document.getElementById('command-slots-container');
        if (container) container.innerHTML = '';
        this.commandSlots = [];

        let cdReduction = 0;
        (this.playerTeamData.relics || []).forEach(rId => {
            const relic = window.MasterData.Relics.find(r => r.id === rId);
            if (relic && relic.effectType === 'CD_REDUCE') cdReduction += relic.value;
        });

        const equipped = this.playerTeamData.microCommands || [];
        for (let i = 0; i < 4; i++) {
            const cmdId = equipped[i];
            const rawCmd = window.MasterData.MicroCommands.find(c => c.id === cmdId);
            if (!rawCmd) {
                if (container) {
                    const emptyEl = document.createElement('div');
                    emptyEl.className = 'command-slot disabled';
                    emptyEl.innerHTML = `<div class="command-name">SLOT ${i + 1}: 未設定</div>`;
                    container.appendChild(emptyEl);
                }
                this.commandSlots.push(null);
                continue;
            }

            const cmdData = { ...rawCmd, cooldown: Math.max(5, Math.round(rawCmd.cooldown * (1 - cdReduction))) };
            const slotData = {
                cmdId,
                data: cmdData,
                currentCd: 0,
                usesLeft: cmdData.maxUses !== undefined ? cmdData.maxUses : Infinity,
                auto: false
            };
            this.commandSlots.push(slotData);

            if (container) {
                const slotEl = document.createElement('div');
                slotEl.className = 'command-slot';
                slotEl.id = `cmd-slot-${i}`;

                const expl = cmdData.description || (cmdData.type === 'buff' ? `${cmdData.target} +${cmdData.value}` : cmdData.actionType);
                slotEl.innerHTML = `
                    <div class="command-slot-top">
                        <span class="command-name">${cmdData.name}</span>
                        <button class="auto-toggle-btn" id="cmd-auto-${i}" style="background: #555;">AUTO: OFF</button>
                    </div>
                    <div class="command-expl">${expl}</div>
                    <div class="command-slot-bottom">
                        <span class="command-desc">残り: ${slotData.usesLeft === Infinity ? '∞' : slotData.usesLeft} (CD:${cmdData.cooldown}s)</span>
                    </div>
                    <div class="command-cd-bar" id="cmd-cd-${i}"></div>
                `;

                const autoBtn = slotEl.querySelector(`#cmd-auto-${i}`);
                if (autoBtn) {
                    autoBtn.onclick = (e) => {
                        e.stopPropagation();
                        slotData.auto = !slotData.auto;
                        autoBtn.textContent = slotData.auto ? 'AUTO: ON' : 'AUTO: OFF';
                        autoBtn.style.background = slotData.auto ? '#27ae60' : '#555';
                    };
                }

                slotEl.onclick = () => this.triggerCommand(i);
                container.appendChild(slotEl);
            }
        }

        document.querySelectorAll('.tactic-btn').forEach(btn => {
            btn.onclick = () => {
                this.realTimeTactic = btn.getAttribute('data-tactic') || 'Balance';
                document.querySelectorAll('.tactic-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateSidePanels();
            };
        });

        const subBtn = document.getElementById('btn-sub-tactic');
        if (subBtn) {
            subBtn.textContent = `🔄 チーム管理・交代 (枠: ${this.substitutionsLeft})`;
            subBtn.onclick = () => this.openSubstitutionUI('inmatch');
        }
    }

    triggerCommand(slotIndex) {
        const slot = this.commandSlots[slotIndex];
        if (!slot) return;
        if (slot.currentCd > 0 || slot.usesLeft <= 0) return;

        if (slot.data.condition) {
            const isBehind = this.score.player < this.score.opponent;
            const isLead = this.score.player > this.score.opponent;
            if (slot.data.condition === "behind" && !isBehind) return;
            if (slot.data.condition === "lead" && !isLead) return;
        }

        slot.usesLeft -= 1;
        slot.currentCd = slot.data.cooldown;

        const slotEl = document.getElementById(`cmd-slot-${slotIndex}`);
        if (slotEl) {
            const descEl = slotEl.querySelector('.command-desc');
            if (descEl) descEl.textContent = `残り: ${slot.usesLeft === Infinity ? '∞' : slot.usesLeft} (CD:${slot.data.cooldown}s)`;
        }

        const actionType = slot.data.actionType;
        if (actionType === 'powerPlay') {
            const cb = this.playerSprites.find(p => p.playerData.position === 'CB');
            if (cb) {
                cb.x = 600;
                cb.expectedPosStr = 'CF';
            }
        }

        this.activeBuff = {
            name: slot.data.name,
            target: slot.data.target || slot.data.actionType || 'all',
            value: slot.data.value || 25,
            actionType: slot.data.actionType || null,
            timer: (slot.data.duration || 10) * 10
        };

        if (window.managementUI) {
            window.managementUI.showToast(`⚡ 戦術発動: ${slot.data.name}`);
        }
    }

    // =========================================================
    // Kickoff & Set Piece Positioning
    // =========================================================
    resetPositions(isPlayerKickoff = true) {
        const placeTeam = (sprites, teamData, isPlayer) => {
            const fSlots = window.MasterData.Formations[teamData.formation]?.slots || [];
            sprites.forEach((p, idx) => {
                const s = fSlots[idx] || { offsetX: 200, offsetY: 300, expectedPosStr: p.playerData.position };
                const offX = (Math.random() - 0.5) * 8;
                const offY = (Math.random() - 0.5) * 10;

                if (isPlayer) {
                    if (s.expectedPosStr === 'GK') p.x = 45;
                    else if (['CB', 'SB'].includes(s.expectedPosStr)) p.x = 160 + offX;
                    else if (['CDM', 'CM', 'CAM'].includes(s.expectedPosStr)) p.x = 280 + offX;
                    else p.x = 375 + offX;
                    p.y = Phaser.Math.Clamp(s.offsetY + offY, 65, 535);
                } else {
                    if (s.expectedPosStr === 'GK') p.x = 755;
                    else if (['CB', 'SB'].includes(s.expectedPosStr)) p.x = 640 + offX;
                    else if (['CDM', 'CM', 'CAM'].includes(s.expectedPosStr)) p.x = 520 + offX;
                    else p.x = 425 + offX;
                    p.y = Phaser.Math.Clamp(s.offsetY + offY, 65, 535);
                }
                p.stunTimer = 0;
                p.actionCooldown = 0;
            });
        };

        placeTeam(this.playerSprites, this.playerTeamData, true);
        placeTeam(this.opponentSprites, this.opponentTeamData, false);

        this.ball.x = 400;
        this.ball.y = 300;
        this.ball.z = 0;
        this.ballSpeed = 0;

        const kickingSprites = isPlayerKickoff ? this.playerSprites : this.opponentSprites;
        const kicker = kickingSprites[kickingSprites.length - 1] || kickingSprites[0];
        if (kicker) {
            kicker.x = 400;
            kicker.y = 300;
            this.ball.owner = kicker;
            this.ball.lastTouchTeam = isPlayerKickoff;
        }
        this.matchState = 'kickoff';
        this.setPieceTimer = 12;
    }

    handleSetPiece(type, x, y, isPlayerTeam) {
        if (x <= 5) x = 20;
        if (x >= 795) x = 780;
        this.setPieceCooldown = 30;
        this.matchState = 'setpiece';
        this.setPieceTimer = 14;
        this.setPieceType = type;

        const attackingSprites = isPlayerTeam ? this.playerSprites : this.opponentSprites;
        const defendingSprites = isPlayerTeam ? this.opponentSprites : this.playerSprites;

        let taker = attackingSprites[0];

        if (type === 'Goal Kick') {
            taker = attackingSprites.find(p => p.playerData.position === 'GK') || attackingSprites[0];
            const gkX = isPlayerTeam ? 35 : 765;
            taker.x = gkX;
            taker.y = 300;
            this.ball.x = gkX;
            this.ball.y = 300;
        } else if (type === 'Corner Kick') {
            const fieldPlayers = attackingSprites.filter(p => p.playerData.position !== 'GK');
            fieldPlayers.sort((a, b) => (b.playerData.stats.pass || 50) - (a.playerData.stats.pass || 50));
            taker = fieldPlayers[0] || attackingSprites[0];
            const ckX = isPlayerTeam ? 770 : 30;
            const ckY = y < 300 ? 55 : 545;
            taker.x = ckX;
            taker.y = ckY;
            this.ball.x = ckX;
            this.ball.y = ckY;
        } else if (type === 'Penalty Kick') {
            const fieldPlayers = attackingSprites.filter(p => p.playerData.position !== 'GK');
            fieldPlayers.sort((a, b) => (b.playerData.stats.shoot || 50) - (a.playerData.stats.shoot || 50));
            taker = fieldPlayers[0] || attackingSprites[0];
            const pkX = isPlayerTeam ? 685 : 115;
            taker.x = pkX;
            taker.y = 300;
            this.ball.x = pkX;
            this.ball.y = 300;

            attackingSprites.forEach(p => {
                if (p !== taker && p.playerData.position !== 'GK') {
                    if (isPlayerTeam && p.x > 600) p.x = 580;
                    if (!isPlayerTeam && p.x < 200) p.x = 220;
                }
            });
            defendingSprites.forEach(p => {
                if (p.playerData.position !== 'GK') {
                    if (isPlayerTeam && p.x > 600) p.x = 580;
                    if (!isPlayerTeam && p.x < 200) p.x = 220;
                }
            });
        } else {
            // Throw-In or Free Kick
            const clampedX = Phaser.Math.Clamp(x, 45, 755);
            const clampedY = type === 'Throw In' ? (y < 300 ? 52 : 548) : Phaser.Math.Clamp(y, 65, 535);
            const fieldPlayers = attackingSprites.filter(p => p.playerData.position !== 'GK');
            fieldPlayers.sort((a, b) =>
                Phaser.Math.Distance.Between(a.x, a.y, clampedX, clampedY) -
                Phaser.Math.Distance.Between(b.x, b.y, clampedX, clampedY)
            );
            taker = fieldPlayers[0] || attackingSprites[0];
            taker.x = clampedX;
            taker.y = clampedY;
            this.ball.x = clampedX;
            this.ball.y = clampedY;

            // Bring 2 teammates near the throw-in/free-kick taker so a pass target is always available
            if (fieldPlayers[1]) {
                fieldPlayers[1].x = Phaser.Math.Clamp(clampedX + (isPlayerTeam ? 35 : -35), 55, 745);
                fieldPlayers[1].y = Phaser.Math.Clamp(clampedY + (clampedY < 300 ? 45 : -45), 75, 525);
            }
            if (fieldPlayers[2]) {
                fieldPlayers[2].x = Phaser.Math.Clamp(clampedX + (isPlayerTeam ? -30 : 30), 55, 745);
                fieldPlayers[2].y = Phaser.Math.Clamp(clampedY + (clampedY < 300 ? 60 : -60), 75, 525);
            }
        }

        this.ball.z = 0;
        this.ballSpeed = 0;
        this.ball.owner = taker;
        this.ball.lastTouchTeam = isPlayerTeam;
        this.ball.cooldown = 10;
    }

    // =========================================================
    // AI Helper Methods (Required by Phase 3 & Match Simulation)
    // =========================================================
    getPitchZone(x, y, isPlayerTeam) {
        const relX = isPlayerTeam ? x : 800 - x;
        let tier = 'Middle';
        if (relX < 266) tier = 'Defensive';
        else if (relX > 533) tier = 'Attacking';

        let lane = 'Center';
        if (y < 140) lane = 'OutsideL';
        else if (y < 250) lane = 'Half-spaceL';
        else if (y > 460) lane = 'OutsideR';
        else if (y > 350) lane = 'Half-spaceR';

        return { tier, lane };
    }

    getBasePosition(p, isPlayerTeam) {
        const teamData = isPlayerTeam ? this.playerTeamData : this.opponentTeamData;
        const slots = window.MasterData.Formations[teamData.formation]?.slots || [];
        const sprites = isPlayerTeam ? this.playerSprites : this.opponentSprites;
        const idx = sprites.indexOf(p);
        const slot = slots[idx] || { offsetX: 250, offsetY: 300 };
        return {
            x: isPlayerTeam ? slot.offsetX : 800 - slot.offsetX,
            y: slot.offsetY
        };
    }

    getDynamicBasePosition(p, isAttacking, isPlayerTeam) {
        const base = this.getBasePosition(p, isPlayerTeam);
        let tx = base.x;
        let ty = base.y;
        const pos = p.expectedPosStr || p.playerData?.position;
        const role = p.playerData?.role;
        const dir = isPlayerTeam ? 1 : -1;

        if (pos === 'GK') {
            return { x: isPlayerTeam ? 42 : 758, y: Phaser.Math.Clamp(300 + (this.ball.y - 300) * 0.15, 265, 335) };
        }

        // Dynamic team block shift based on ball X (FC27 cohesive block movement)
        const ballShift = (this.ball.x - 400) * 0.42;
        const phaseShift = isAttacking ? 65 * dir : -55 * dir;
        tx += ballShift + phaseShift;

        if (this.realTimeTactic === 'Attack' && isPlayerTeam) tx += 35;
        if (this.realTimeTactic === 'Defend' && isPlayerTeam) tx -= 40;
        if (this.activeBuff && this.activeBuff.target === 'defenseLine' && isPlayerTeam) tx += 45;

        // Role overrides (Required by test_phase3_ai.js)
        if (!p.playerData?.isMob) {
            if (pos === 'SB' && role === 'Inverted' && isAttacking) {
                ty = ty < 300 ? 220 : 380;
                tx += 25 * dir;
            } else if (pos === 'SB' && role === 'Attacking' && isAttacking) {
                tx += 55 * dir;
            } else if (pos === 'CF' && role === 'False-9' && isAttacking) {
                tx -= 45 * dir;
            } else if (pos === 'CF' && role === 'Poacher' && isAttacking) {
                tx += 30 * dir;
            } else if (pos === 'WG' && role === 'Inside-Forward' && isAttacking) {
                ty = ty < 300 ? 235 : 365;
                tx += 25 * dir;
            }
        }

        // Width compression when defending
        if (!isAttacking) {
            ty = ty + (this.ball.y - ty) * 0.22;
        }

        tx = Phaser.Math.Clamp(tx, 65, 735);
        ty = Phaser.Math.Clamp(ty, 58, 542);
        return { x: tx, y: ty };
    }

    calculateThreat(x, y, isPlayerTeam) {
        const goalX = isPlayerTeam ? 775 : 25;
        const dist = Phaser.Math.Distance.Between(x, y, goalX, 300);
        return Phaser.Math.Clamp(100 - dist * 0.14, 5, 100);
    }

    calculatePassRisk(x1, y1, x2, y2, isPlayerTeam) {
        const enemies = isPlayerTeam ? this.opponentSprites : this.playerSprites;
        let risk = Phaser.Math.Distance.Between(x1, y1, x2, y2) * 0.08;
        enemies.forEach(e => {
            const d = Phaser.Math.Distance.Between(x2, y2, e.x, e.y);
            if (d < 45) risk += (45 - d) * 0.9;
        });
        return Phaser.Math.Clamp(risk, 0, 95);
    }

    getActiveConditions(player) {
        const conds = ['always'];
        const isPlayer = player?.isPlayerTeam !== false;
        const myScore = isPlayer ? (this.score?.player || 0) : (this.score?.opponent || 0);
        const oppScore = isPlayer ? (this.score?.opponent || 0) : (this.score?.player || 0);
        if (myScore < oppScore) conds.push('behind');
        if (myScore > oppScore) conds.push('lead');
        if (this.matchTime >= 70) conds.push('lateGame');
        if (this.currentGimmick === 'badWeather') conds.push('badWeather');
        return conds;
    }

    getEffectiveStat(player, statName, activeConditions = []) {
        const pData = player?.playerData || player || {};
        const base = pData.dynamicStats?.[statName] ?? pData.stats?.[statName] ?? 50;
        let bonus = 0;
        if (window.Player && typeof window.Player.getSkillEffectFor === 'function') {
            bonus += window.Player.getSkillEffectFor(pData, 'STAT_UP', statName, activeConditions).value || 0;
        }
        return Phaser.Math.Clamp(base + bonus, 10, 100);
    }

    evaluateActions(p, contextData = {}) {
        const conds = this.getActiveConditions(p);
        const isPlayer = p.isPlayerTeam !== false;
        const threat = this.calculateThreat(p.x, p.y, isPlayer);
        const passStat = this.getEffectiveStat(p, 'pass', conds);
        const shootStat = this.getEffectiveStat(p, 'shoot', conds);
        const speedStat = this.getEffectiveStat(p, 'speed', conds);

        const scores = {
            Shoot: threat > 62 ? threat + shootStat * 0.45 : 10,
            Pass: 55 + passStat * 0.35 - this.calculatePassRisk(p.x, p.y, p.x + (isPlayer ? 80 : -80), p.y, isPlayer) * 0.25,
            Dribble: 42 + speedStat * 0.35,
            RunIntoSpace: contextData.isAttacking ? 58 + speedStat * 0.25 : 20,
            Press: !contextData.isAttacking ? 60 : 15,
            HoldPosition: 45
        };

        if (contextData.tactic === 'Possession') scores.Pass += 18;
        if (contextData.tactic === 'Counter') {
            scores.Dribble += 12;
            scores.RunIntoSpace += 15;
        }

        let bestAction = 'HoldPosition';
        let bestScore = -1;
        Object.entries(scores).forEach(([act, sc]) => {
            if (sc > bestScore) {
                bestScore = sc;
                bestAction = act;
            }
        });

        return { action: bestAction, score: bestScore };
    }

    getOffsideLineX(isPlayerTeamDefense) {
        const defenders = isPlayerTeamDefense ? this.playerSprites : this.opponentSprites;
        if (!defenders || defenders.length < 2) return isPlayerTeamDefense ? 120 : 680;
        const xs = defenders.map(d => d.x).sort((a, b) => isPlayerTeamDefense ? a - b : b - a);
        return isPlayerTeamDefense ? Math.min(400, xs[1]) : Math.max(400, xs[1]);
    }

    // =========================================================
    // Main Orchestrator Loop (tickMatch & simulateAction)
    // =========================================================
    tickMatch() {
        if (this.matchState === 'gameover' || !this.logicTimer || this.logicTimer.paused) return;

        if (this.matchState === 'celebration') {
            this.celebrationTimer = (this.celebrationTimer || 45) - 1;
            if (this.celebrationTimer <= 0) {
                const banner = document.getElementById('fc-goal-banner');
                if (banner) banner.style.display = 'none';
                this.resetPositions(this.nextKickoffIsPlayer);
            }
            return;
        }

        const steps = Math.max(1, Math.min(4, Math.floor(this.timeScale)));
        for (let s = 0; s < steps; s++) {
            this.stepMatchTick();
            if (this.matchState === 'gameover' || this.matchState === 'halftime' || this.matchState === 'celebration') break;
        }

        if (Math.floor(this.matchTime * 10) % 4 === 0) {
            this.updateSidePanels();
        }
    }

    stepMatchTick() {
        if (this.setPieceCooldown > 0) this.setPieceCooldown--;
        if (this.activeBuff) {
            this.activeBuff.timer--;
            if (this.activeBuff.timer <= 0) this.activeBuff = null;
        }

        // Advance match clock during active play and brief set-piece transitions
        this.matchTime += 0.045;
        const displayMin = Math.floor(this.matchTime);
        const displaySec = Math.floor((this.matchTime % 1) * 60);

        if (this.halfNumber === 1 && this.matchTime >= 45) {
            const extra = Math.floor(this.matchTime - 45);
            this.timeText.setText(`45:00 +${Math.min(this.firstHalfStoppage, extra + 1)}'`);
        } else if (this.halfNumber === 2 && this.matchTime >= 90) {
            const extra = Math.floor(this.matchTime - 90);
            this.timeText.setText(`90:00 +${Math.min(this.secondHalfStoppage, extra + 1)}'`);
        } else {
            this.timeText.setText(`${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`);
        }

        // Check Half-Time & Full-Time
        if (this.halfNumber === 1 && this.matchTime >= 45 + this.firstHalfStoppage) {
            const inDanger = this.ball.x > 610 || this.ball.x < 190;
            if (!inDanger || this.matchTime >= 45 + this.firstHalfStoppage + 1.5) {
                this.halfNumber = 2;
                this.matchTime = 45;
                this.matchState = 'halftime';
                this.openSubstitutionUI('halftime');
                return;
            }
        } else if (this.halfNumber === 2 && this.matchTime >= 90 + this.secondHalfStoppage) {
            const inDanger = this.ball.x > 610 || this.ball.x < 190;
            if (!inDanger || this.matchTime >= 90 + this.secondHalfStoppage + 1.5) {
                this.matchState = 'gameover';
                this.endMatch(this.score.player, this.score.opponent);
                return;
            }
        }

        // Cooldowns & Auto Micro Commands
        this.commandSlots.forEach((slot, idx) => {
            if (!slot) return;
            if (slot.currentCd > 0) {
                slot.currentCd = Math.max(0, slot.currentCd - 0.05);
                const cdBar = document.getElementById(`cmd-cd-${idx}`);
                if (cdBar) cdBar.style.width = `${(slot.currentCd / slot.data.cooldown) * 100}%`;
            } else if (slot.auto && slot.usesLeft > 0) {
                this.triggerCommand(idx);
            }
        });

        this.simulateAction();
    }

    simulateAction() {
        const allPlayers = [...this.playerSprites, ...this.opponentSprites];

        // 1. Handle Kickoff & Set-Piece Restart Guaranteed Transition
        if (this.matchState === 'kickoff' || this.matchState === 'setpiece') {
            this.setPieceTimer = (this.setPieceTimer || 10) - 1;
            if (this.setPieceTimer <= 0) {
                const owner = this.ball.owner;
                if (owner) {
                    const isPlayer = owner.isPlayerTeam;
                    const mates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(m => m !== owner && m.playerData.position !== 'GK');
                    mates.sort((a, b) =>
                        Phaser.Math.Distance.Between(owner.x, owner.y, a.x, a.y) -
                        Phaser.Math.Distance.Between(owner.x, owner.y, b.x, b.y)
                    );
                    const target = mates[0];
                    if (this.setPieceType === 'Penalty Kick') {
                        this.executeShoot(owner);
                    } else if (this.setPieceType === 'Corner Kick') {
                        this.executePass(owner, { x: isPlayer ? 700 : 100, y: 300 + (Math.random() - 0.5) * 60 }, 11, 22);
                    } else if (target) {
                        this.executePass(owner, target, 9.5, 0);
                    }
                }
                this.matchState = 'playing';
                this.setPieceType = null;
            }
            this.syncBallVisuals();
            return;
        }

        // 2. Ball Physics & Out-of-Bounds / Goal Detection
        if (this.ball.cooldown > 0) this.ball.cooldown--;

        if (this.ball.owner) {
            const owner = this.ball.owner;
            if (owner.isPlayerTeam) this.matchStats.playerPossessionTicks++;
            else this.matchStats.oppPossessionTicks++;

            const dir = owner.isPlayerTeam ? 1 : -1;
            this.ball.x = owner.x + 7 * dir;
            this.ball.y = owner.y + 2;
            this.ball.z = 0;
            this.ballSpeed = 0;

            if (owner.gkKeepTimer > 0) {
                owner.gkKeepTimer--;
            } else {
                this.decideBallOwnerAction(owner);
            }
        } else {
            // Free ball physics
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            const friction = this.currentGimmick === 'badWeather' ? 0.975 : 0.955;
            this.ball.vx *= friction;
            this.ball.vy *= friction;
            this.ballSpeed = Math.hypot(this.ball.vx, this.ball.vy);

            if (this.ball.z > 0 || this.ball.vz !== 0) {
                this.ball.z += this.ball.vz;
                this.ball.vz -= 0.65;
                if (this.ball.z <= 0) {
                    this.ball.z = 0;
                    this.ball.vz = Math.abs(this.ball.vz) > 2 ? -this.ball.vz * 0.45 : 0;
                }
            }

            // Goal & Boundary checks (Pitch: X=25..775, Y=45..555)
            if (this.ball.x <= 25 || this.ball.x >= 775) {
                const isRightGoal = this.ball.x >= 775;
                if (this.ball.y >= 255 && this.ball.y <= 345 && this.ball.z <= 35) {
                    this.onGoalScored(isRightGoal);
                    return;
                }
                if (this.setPieceCooldown <= 0) {
                    const lastTeam = this.ball.lastTouchTeam;
                    if (isRightGoal) {
                        if (lastTeam) this.handleSetPiece('Goal Kick', 765, 300, false);
                        else this.handleSetPiece('Corner Kick', 770, this.ball.y, true);
                    } else {
                        if (!lastTeam) this.handleSetPiece('Goal Kick', 35, 300, true);
                        else this.handleSetPiece('Corner Kick', 30, this.ball.y, false);
                    }
                    return;
                }
            } else if ((this.ball.y <= 45 || this.ball.y >= 555) && this.setPieceCooldown <= 0) {
                this.handleSetPiece('Throw In', this.ball.x, this.ball.y, !this.ball.lastTouchTeam);
                return;
            }
        }

        // 3. Closest Chasers for Loose Ball (Prevents dead balls)
        let closestPlayer = null;
        let closestOpp = null;
        if (!this.ball.owner) {
            let minPD = Infinity, minOD = Infinity;
            this.playerSprites.forEach(p => {
                if (p.stunTimer > 0) return;
                const d = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                if (d < minPD) { minPD = d; closestPlayer = p; }
            });
            this.opponentSprites.forEach(p => {
                if (p.stunTimer > 0) return;
                const d = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                if (d < minOD) { minOD = d; closestOpp = p; }
            });
        }

        // 4. Update All 22 Players
        const playerTeamAttacking = this.ball.owner ? this.ball.owner.isPlayerTeam : this.ball.lastTouchTeam;

        allPlayers.forEach(p => {
            p.activeRing.setVisible(this.ball.owner === p);
            if (p.actionCooldown > 0) p.actionCooldown--;
            if (p.stunTimer > 0) {
                p.stunTimer--;
                if (p.legL && p.legR) { p.legL.y = 12; p.legR.y = 12; }
                return;
            }

            const isPlayer = p.isPlayerTeam;
            const isTeamAttacking = isPlayer ? playerTeamAttacking : !playerTeamAttacking;
            const conds = this.getActiveConditions(p);

            // Aura display
            if (isPlayer && (this.realTimeTactic !== 'Balance' || this.activeBuff)) {
                p.aura.setFillStyle(this.realTimeTactic === 'Defend' ? 0x3498db : 0xe74c3c, 0.28);
            } else {
                p.aura.setFillStyle(0x000000, 0);
            }

            // Ball Interception / Trapping when ball is free
            if (!this.ball.owner && this.ball.cooldown <= 0 && p.actionCooldown <= 0) {
                const reach = p.playerData.position === 'GK' ? 20 : (this.activeBuff && this.activeBuff.target === 'intercept' && isPlayer ? 18 : 13);
                const distToBall = Phaser.Math.Distance.Between(p.x, p.y, this.ball.x, this.ball.y);
                if (distToBall <= reach && this.ball.z <= (p.playerData.position === 'GK' ? 40 : 22)) {
                    this.attemptTrapOrSave(p);
                    return;
                }
            }

            // Tackle attempt if opponent has the ball nearby
            if (this.ball.owner && this.ball.owner.isPlayerTeam !== isPlayer && p.actionCooldown <= 0) {
                const distToOwner = Phaser.Math.Distance.Between(p.x, p.y, this.ball.owner.x, this.ball.owner.y);
                if (distToOwner <= 14) {
                    this.attemptTackle(p, this.ball.owner);
                    return;
                }
            }

            // Movement Target Calculation
            let targetX = p.x; let targetY = p.y;
            if ((p.aiTickTimer >= 0)) {
                const evaluation = this.evaluateActions(p, {
                    tactic: isPlayer ? this.playerTeamData.manager?.preference : this.opponentTeamData.manager?.preference,
                    isAttacking: isTeamAttacking,
                    hasBall: this.ball.owner === p
                });
                let bestAction = evaluation.action;
                p.currentAction = bestAction;
            }

            if (this.ball.owner === p) {
                const goalX = isPlayer ? 765 : 35;
                targetX = p.x + (goalX - p.x) * 0.25;
                targetY = p.y + (300 - p.y) * 0.12;
            } else if (!this.ball.owner && (p === closestPlayer || p === closestOpp)) {
                targetX = this.ball.x;
                targetY = this.ball.y;
            } else if (!isTeamAttacking && this.ball.owner && Phaser.Math.Distance.Between(p.x, p.y, this.ball.owner.x, this.ball.owner.y) < 95 && p.playerData.position !== 'GK') {
                // Pressing the ball carrier
                targetX = this.ball.owner.x;
                targetY = this.ball.owner.y;
            } else {
                const dynPos = this.getDynamicBasePosition(p, isTeamAttacking, isPlayer);
                targetX = dynPos.x;
                targetY = dynPos.y;
            }

            // Separation force so tokens never stack on top of each other
            const teammates = isPlayer ? this.playerSprites : this.opponentSprites;
            teammates.forEach(mate => {
                if (mate === p) return;
                const d = Phaser.Math.Distance.Between(p.x, p.y, mate.x, mate.y);
                if (d < 28 && d > 0.1) {
                    targetX += ((p.x - mate.x) / d) * 12;
                    targetY += ((p.y - mate.y) / d) * 12;
                }
            });

            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 1.5) {
                const spdStat = this.getEffectiveStat(p, 'speed', conds);
                const stamRatio = Math.max(0.45, (p.playerData.currentStamina || 50) / 100);
                let moveSpeed = (1.55 + (spdStat / 100) * 1.15) * stamRatio;
                if (this.currentGimmick === 'fever' && this.matchTime < 45 && !isPlayer) {
                    moveSpeed *= 1.15;
                }
                const step = Math.min(dist, moveSpeed);
                p.x = Phaser.Math.Clamp(p.x + (dx / dist) * step, 28, 772);
                p.y = Phaser.Math.Clamp(p.y + (dy / dist) * step, 48, 552);
                p.playerData.currentStamina = Math.max(5, (p.playerData.currentStamina || 80) - 0.012 * (p.playerData.staminaConsumptionRate || 1));
            }
        });

        this.syncBallVisuals();
    }

    decideBallOwnerAction(owner) {
        const isPlayer = owner.isPlayerTeam;
        const goalX = isPlayer ? 775 : 25;
        const distToGoal = Phaser.Math.Distance.Between(owner.x, owner.y, goalX, 300);
        const enemies = isPlayer ? this.opponentSprites : this.playerSprites;

        let nearestEnemyDist = Infinity;
        enemies.forEach(e => {
            const d = Phaser.Math.Distance.Between(owner.x, owner.y, e.x, e.y);
            if (d < nearestEnemyDist) nearestEnemyDist = d;
        });

        // Shoot if in shooting range
        const shootRange = (this.activeBuff && this.activeBuff.actionType === 'longShoot' && isPlayer) ? 260 : 175;
        if (distToGoal < shootRange && owner.playerData.position !== 'GK') {
            if (distToGoal < 115 || Math.random() < 0.35) {
                this.executeShoot(owner);
                return;
            }
        }

        // Pass if pressured or randomly during build-up
        if (nearestEnemyDist < 48 || owner.playerData.position === 'GK' || Math.random() < 0.14) {
            const mates = (isPlayer ? this.playerSprites : this.opponentSprites).filter(m => m !== owner);
            let bestTarget = null;
            let bestScore = -999;

            mates.forEach(m => {
                const d = Phaser.Math.Distance.Between(owner.x, owner.y, m.x, m.y);
                if (d < 35 || d > 340) return;
                const progress = isPlayer ? (m.x - owner.x) : (owner.x - m.x);
                const risk = this.calculatePassRisk(owner.x, owner.y, m.x, m.y, isPlayer);
                const score = progress * 0.65 - risk * 0.8 + (Math.random() * 25);
                if (score > bestScore) {
                    bestScore = score;
                    bestTarget = m;
                }
            });

            if (bestTarget) {
                const leadX = bestTarget.x + (isPlayer ? 18 : -18);
                const leadY = bestTarget.y;
                const dist = Phaser.Math.Distance.Between(owner.x, owner.y, leadX, leadY);
                const loft = dist > 180 ? 14 : 0;
                this.executePass(owner, { x: Phaser.Math.Clamp(leadX, 35, 765), y: Phaser.Math.Clamp(leadY, 55, 545) }, Math.min(12, 7.5 + dist * 0.018), loft);
            }
        }
    }

    executePass(passer, targetPos, speed = 9, loftZ = 0) {
        const conds = this.getActiveConditions(passer);
        const skillBonus = window.Player.getSkillEffectFor(passer.playerData, "SUCCESS_RATE_UP", "pass", conds);
        const passStat = this.getEffectiveStat(passer, 'pass', conds) + (skillBonus.value || 0);

        let noise = (100 - passStat) * 0.18;
        if (this.currentGimmick === 'badWeather') noise *= 1.35;
        if (this.activeBuff && passer.isPlayerTeam) noise *= 0.25;

        const tx = targetPos.x + (Math.random() - 0.5) * noise;
        const ty = targetPos.y + (Math.random() - 0.5) * noise;
        const angle = Phaser.Math.Angle.Between(passer.x, passer.y, tx, ty);

        this.ball.owner = null;
        this.ball.lastTouchTeam = passer.isPlayerTeam;
        this.ball.vx = Math.cos(angle) * speed;
        this.ball.vy = Math.sin(angle) * speed;
        this.ball.vz = loftZ > 0 ? loftZ * 0.35 : 0;
        this.ball.isShot = false;
        this.ball.cooldown = 6;
        passer.actionCooldown = 14;
        passer.playerData.matchRating = Math.min(9.9, (passer.playerData.matchRating || 6.0) + 0.04);
    }

    executeShoot(shooter) {
        const isPlayer = shooter.isPlayerTeam;
        const conds = this.getActiveConditions(shooter);
        const skillBonus = window.Player.getSkillEffectFor(shooter.playerData, "SUCCESS_RATE_UP", "shoot", conds);
        const shootStat = this.getEffectiveStat(shooter, 'shoot', conds) + (skillBonus.value || 0);

        if (isPlayer) {
            this.matchStats.playerShots++;
            if (Phaser.Math.Distance.Between(shooter.x, shooter.y, 775, 300) < 145) this.matchStats.playerBigChances++;
        } else {
            this.matchStats.oppShots++;
            if (Phaser.Math.Distance.Between(shooter.x, shooter.y, 25, 300) < 145) this.matchStats.oppBigChances++;
        }

        const goalX = isPlayer ? 780 : 20;
        const spread = Math.max(8, (100 - shootStat) * 0.65);
        const targetY = 300 + (Math.random() - 0.5) * spread;
        const angle = Phaser.Math.Angle.Between(shooter.x, shooter.y, goalX, targetY);
        const power = 13.5 + (shootStat / 100) * 4.0;

        this.ball.owner = null;
        this.ball.lastTouchTeam = isPlayer;
        this.ball.vx = Math.cos(angle) * power;
        this.ball.vy = Math.sin(angle) * power;
        this.ball.vz = 3.5;
        this.ball.isShot = true;
        this.ball.lastShooter = shooter;
        this.ball.cooldown = 5;
        shooter.actionCooldown = 20;
    }

    attemptTrapOrSave(interceptor) {
        const isGK = interceptor.playerData.position === 'GK';
        const conds = this.getActiveConditions(interceptor);
        const skillBonus = window.Player.getSkillEffectFor(interceptor.playerData, "SUCCESS_RATE_UP", isGK ? "save" : "trap", conds);
        const stat = this.getEffectiveStat(interceptor, isGK ? 'defense' : 'dribble', conds) + (skillBonus.value || 0);

        let successChance = stat * (isGK ? 0.8 : 0.9);
        if (this.ball.isShot && !isGK) successChance *= 0.3; // Hard to trap a shot

        if (Math.random() * 100 < successChance) {
            this.ball.owner = interceptor;
            this.ball.z = 0;
            this.ball.isShot = false;
            interceptor.actionCooldown = 15;
            if (isGK) {
                this.matchStats.playerPossession += (interceptor.isPlayerTeam ? 1 : 0);
            }
        }
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

    if (!game) {
        game = new Phaser.Game(config);
    } else {
        game.scene.start('MatchScene');
    }
}
window.startGame = startGame;
