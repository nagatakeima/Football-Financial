class ManagementUI {
    constructor() {
        this.uiLayer = document.getElementById('ui-layer');
        this.topBar = document.getElementById('top-bar');
        this.topBarInfo = document.getElementById('team-info');
        this.topBarSchedule = document.getElementById('schedule-info');
        this.uiContent = document.getElementById('ui-content');
        this.phaserGame = document.getElementById('phaser-game');
        this.gameContainer = document.getElementById('game-container');
        this.matchWrapper = document.getElementById('match-screen-wrapper');

        this.selectedPlayerIndex = 0;
        this.swapSourceIndex = null;
        this.activeTab = 'squad';
    }

    init() {
        this.showTitleScreen();
    }

    showToast(message) {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            if (document.body) {
                document.body.appendChild(toast);
            }
        }
        toast.textContent = message;
        toast.classList.add('show');
        if (typeof alert === 'function' && (!document.body || !document.body.appendChild)) {
            alert(message);
        }
        setTimeout(() => {
            if (toast && toast.classList) toast.classList.remove('show');
        }, 2400);
    }

    updateTopBar() {
        if (!window.gameState || !window.gameState.playerTeam || !this.topBar) return;
        this.topBar.style.display = 'flex';

        const rank = this.getCurrentRank();
        const targetRank = window.gameState.currentTier === 1 ? 1 : 2;
        const isSafe = rank <= targetRank;
        const matchday = window.gameState.league ? window.gameState.league.currentMatchday : 1;

        const relicsHtml = (window.gameState.playerTeam.relics || []).map(relicId => {
            const relic = window.MasterData.Relics.find(r => r.id === relicId);
            if (!relic) return '';
            return `<div class="relic-badge" data-tooltip="${relic.description}">${relic.name}</div>`;
        }).join('');

        this.topBar.innerHTML = `
            <div class="top-bar-row">
                <div class="top-bar-info">
                    <span class="club-badge">⚽ ${window.gameState.playerTeam.name}</span>
                    <span>第${window.gameState.currentTier}部 第${matchday}節 / 全9節</span>
                    <span style="color: ${isSafe ? '#2ecc71' : '#e74c3c'}; font-weight: 800;">
                        現在順位: ${rank}位 (ノルマ: ${targetRank}位以内)
                    </span>
                    <span class="funds">資金: ¥${window.gameState.funds.toLocaleString()}</span>
                    <span class="ap">⚡ AP: ${window.gameState.ap}/10</span>
                </div>
                <div class="top-bar-actions">
                    <button onclick="managementUI.restTeam()" ${window.gameState.hasRestedThisTurn || window.gameState.ap < 1 ? 'disabled' : ''} style="background: #1e8449; border-color: #2ecc71; padding: 5px 12px; font-size: 12px;">
                        🛌 全体休養 (AP:1 / 全員体力+30)
                    </button>
                </div>
            </div>
            <div class="top-bar-row">
                <div style="display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap;">
                    <span style="font-size: 11px; color: #7f8c8d; font-weight: 700;">所持マクロ:</span>
                    ${relicsHtml || '<span style="font-size: 11px; color: #555;">なし</span>'}
                </div>
                <div class="global-nav">
                    <button class="${this.activeTab === 'squad' ? 'active-tab' : ''}" onclick="managementUI.showSquad()">📋 チーム編成・戦術</button>
                    <button class="${this.activeTab === 'events' ? 'active-tab' : ''}" onclick="managementUI.showEvents()">⚡ スカウト・強化 (${window.gameState.ap})</button>
                    <button class="${this.activeTab === 'standings' ? 'active-tab' : ''}" onclick="managementUI.showStandings()">🏆 リーグ順位表</button>
                    <button class="kickoff-nav-btn ${this.activeTab === 'prematch' ? 'active-tab' : ''}" onclick="managementUI.showPreMatch()">⚽ 次節へ進む</button>
                </div>
            </div>
        `;
    }

    showTitleScreen() {
        if (this.topBar) this.topBar.style.display = 'none';
        if (this.matchWrapper) this.matchWrapper.style.display = 'none';
        if (this.uiLayer) this.uiLayer.style.display = 'flex';

        this.uiContent.innerHTML = `
            <div class="menu-box" style="max-width: 640px; padding: 48px 36px;">
                <div style="font-size: 12px; font-weight: 900; letter-spacing: 3px; color: #2ecc71; margin-bottom: 8px;">SURVIVAL FOOTBALL ROGUELITE</div>
                <h1 style="font-size: 40px; font-weight: 900; margin-bottom: 14px; color: #fff;">FOOTBALL TACTICS: UNSEATED</h1>
                <p style="color: #95a5a6; font-size: 14px; margin-bottom: 32px; line-height: 1.6;">
                    戦術ビルド × ケミストリー × リアルタイム指揮。<br>
                    第3部から1部リーグ完全制覇を目指す、解任サバイバル・サッカーシム。
                </p>
                <button onclick="managementUI.showManagerSelection()" style="font-size: 18px; padding: 14px 42px; background: #27ae60; border-color: #2ecc71;">
                    NEW DIVE (新規キャリア開始)
                </button>
            </div>
        `;
    }

    showManagerSelection() {
        if (this.topBar) this.topBar.style.display = 'none';
        const managers = window.MasterData.Managers || [];

        const cardsHtml = managers.map(m => {
            const relic = window.MasterData.Relics.find(r => r.name === m.initialTrait);
            const relicDesc = relic ? relic.description : '';
            return `
                <div style="background: #10241e; border: 1px solid #285446; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h3 style="font-size: 18px; color: #f1c40f;">${m.name}</h3>
                            <span style="background: #1b4d3e; color: #2ecc71; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">
                                戦術志向: ${m.preference}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #bdc3c7; margin-bottom: 6px;">
                            <strong>習得フォーメーション:</strong> ${m.formations.join(' / ')}
                        </div>
                        <div style="font-size: 12px; color: #a3e4d7; margin-bottom: 8px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">
                            <strong>初期マクロ: ${m.initialTrait}</strong><br>
                            <span style="font-size: 11px; color: #95a5a6;">${relicDesc}</span>
                        </div>
                        <div style="font-size: 13px; color: #f1c40f; font-weight: 700;">
                            初期資金: ¥${m.initialFunds.toLocaleString()}
                        </div>
                    </div>
                    <button onclick="managementUI.selectManager(${m.id})" style="margin-top: 12px; width: 100%; padding: 10px; background: #2980b9; border-color: #3498db;">
                        この監督でスタート
                    </button>
                </div>
            `;
        }).join('');

        this.uiContent.innerHTML = `
            <div class="menu-box" style="max-width: 980px; padding: 24px;">
                <h2 style="margin-bottom: 6px;">監督選択</h2>
                <p style="font-size: 13px; color: #95a5a6; margin-bottom: 18px;">初期戦術・フォーメーション・初期マクロ（宝物）を選択してください</p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    selectManager(managerId) {
        window.gameState.startNewDive(managerId);
        this.showDashboard();
    }

    getNextOpponent() {
        if (!window.gameState.league) return null;
        const idx = window.gameState.league.currentMatchday - 1;
        if (idx >= window.gameState.league.schedule.length) return null;
        const matchday = window.gameState.league.schedule[idx];
        const match = matchday.find(m => m.home.isPlayerTeam || m.away.isPlayerTeam);
        if (!match) return null;
        return match.home.isPlayerTeam ? match.away : match.home;
    }

    getCurrentRank() {
        if (!window.gameState.league) return 1;
        const standings = window.gameState.league.getStandings();
        return standings.findIndex(t => t.isPlayerTeam) + 1;
    }

    showDashboard() {
        if (window.gameState.isGameOver) {
            this.showGameOver();
            return;
        }
        if (window.gameState.pendingVictoryReward) {
            this.showVictoryRewardModal();
            return;
        }
        if (window.gameState.seasonJustEnded) {
            window.gameState.seasonJustEnded = false;
            this.showToast(`🎉 昇格決定！第${window.gameState.currentTier}部リーグが開幕します！`);
        }
        this.showSquad();
    }

    restTeam() {
        if (window.gameState.hasRestedThisTurn || window.gameState.ap < 1) return;
        window.gameState.ap -= 1;
        window.gameState.hasRestedThisTurn = true;
        window.gameState.playerTeam.players.forEach(p => {
            p.condition = Math.min(100, (p.condition ?? 100) + 30);
        });
        this.showToast('全体の休養を実施し、全選手の体力が+30回復しました！');
        this.updateTopBar();
        if (this.activeTab === 'squad') this.showSquad();
        else if (this.activeTab === 'events') this.showEvents();
    }

    // =========================================================
    // 1. 編成・戦術ビルド画面 (3カラム・スクロールゼロ)
    // =========================================================
    showSquad() {
        if (window.gameState.isGameOver) {
            this.showGameOver();
            return;
        }
        this.activeTab = 'squad';
        if (this.matchWrapper) this.matchWrapper.style.display = 'none';
        if (this.uiLayer) this.uiLayer.style.display = 'flex';
        this.gameContainer.classList.remove('match-mode');

        const team = window.gameState.playerTeam;
        const activeLinksCount = window.ChemistrySystem.calculateTeamChemistry(team) || 0;
        this.updateTopBar();

        let html = `
            <div class="ui-layout-container" style="display: flex; flex-direction: row; width: 100%; height: calc(100vh - 100px); overflow: hidden; gap: 15px; padding: 10px;">
                <div class="left-panel-tactics" style="flex: 1; display: flex; flex-direction: column; gap: 10px; height: 100%;">

                    <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; display: flex; gap: 10px; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="color:#aaa; font-size: 12px; margin-right: 8px;">フォーメーション:</span>
                            <select id="formation-select" onchange="managementUI.changeFormation(this.value)" style="padding: 4px 8px; background: #1a3c2f; color: #ecf0f1; border: 1px solid #2ecc71; border-radius: 6px; cursor: pointer;">
                                ${team.manager.formations.map(f => `<option value="${f}" ${team.formation === f ? 'selected' : ''}>${f}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display:flex; gap: 5px;">
                            ${[0,1,2,3].map(i => {
                                const currentCmdId = team.microCommands[i];
                                const availableCmds = window.MasterData.MicroCommands.filter(c =>
                                    team.ownedMicroCommands.includes(c.id) && (!team.microCommands.includes(c.id) || c.id === currentCmdId)
                                );
                                return `
                                <select id="micro-cmd-${i}" onchange="managementUI.updateMicroCommand(${i}, this.value, 'squad')" style="background:#222; color:#fff; border:1px solid #444; padding:4px; max-width: 100px;">
                                    <option value="">--未設定--</option>
                                    ${availableCmds.map(cmd => `<option value="${cmd.id}" ${currentCmdId === cmd.id ? 'selected' : ''}>${cmd.name}</option>`).join('')}
                                </select>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="pitch-container-25d" id="fc-tactics-pitch" style="flex: 1; position: relative; background: url('kickoff.png') no-repeat center center; background-size: cover; border-radius: 12px; transform: perspective(900px) rotateX(16deg); transform-origin: bottom center; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 15px 35px rgba(0,0,0,0.5); margin-bottom: -20px; z-index: 1;">
                        <canvas id="chem-canvas" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 1; width: 100%; height: 100%;"></canvas>
                        <div id="formation-container" style="width: 100%; height: 100%; position: absolute; z-index: 2; top:0; left:0;"></div>
                    </div>

                    <div class="horizontal-bench-container" id="bench-container" style="height: 140px; background: rgba(0,0,0,0.6); border-radius: 12px; display: flex; flex-direction: row; align-items: center; justify-content: space-around; padding: 5px; z-index: 2; border: 1px solid rgba(255,255,255,0.15); margin-top: auto;">
                    </div>
                </div>

                <div class="right-panel-details" id="player-detail-panel" style="width: 450px; height: 100%; background: rgba(0, 30, 15, 0.75); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; backdrop-filter: blur(8px); display: flex; flex-direction: column; overflow: hidden; position: relative;">
                    <div style="padding: 20px; text-align: center; color: #aaa; margin-top: 50px;">
                        <span style="font-size: 48px;">👤</span><br><br>
                        左のピッチまたはベンチから選手を選択してください。
                    </div>
                </div>
            </div>
        `;

        this.uiContent.innerHTML = html;
        if (this.selectedPlayerIndex === null || this.selectedPlayerIndex === undefined) {
            this.selectedPlayerIndex = 0;
        }
        this.renderFormation();
        const initPlayer = this.selectedPlayerIndex < 11
            ? team.starting11[this.selectedPlayerIndex]
            : team.bench[this.selectedPlayerIndex - 11];
        if(initPlayer) this.renderPlayerDetailCard(initPlayer, this.selectedPlayerIndex);
    }

    changeFormation(newFormation) {
        const team = window.gameState.playerTeam;
        team.formation = newFormation;
        window.ChemistrySystem.calculateTeamChemistry(team);
        this.showSquad();
    }

    updateMicroCommand(slotIndex, val, source) {
        const team = window.gameState.playerTeam;
        team.microCommands[slotIndex] = val ? Number(val) : null;
        if (source === 'prematch') this.showPreMatch();
        else if (source === 'squad') this.showSquad();
    }

    getFormationCoordinates(formation) {
        const fData = window.MasterData.Formations[formation] || window.MasterData.Formations['4-4-2'];
        if (fData && fData.slots) {
            return fData.slots.map(s => ({
                x: s.offsetY / 600,
                y: 1.0 - (s.offsetX / 800),
                expectedPos: s.expectedPosStr
            }));
        }
        return [];
    }

    renderFormation() {
        const team = window.gameState.playerTeam;
        const container = document.getElementById('formation-container');
        const benchContainer = document.getElementById('bench-container');
        const canvas = document.getElementById('chem-canvas');
        if (!container || !benchContainer) return;

        container.innerHTML = '';
        benchContainer.innerHTML = '';

        const fSlots = window.MasterData.Formations[team.formation]?.slots || [];
        const posMap = {};
        const coords = this.getFormationCoordinates(team.formation);

        if (canvas) {
            canvas.width = container.parentElement.clientWidth;
            canvas.height = container.parentElement.clientHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            team.starting11.forEach((player, idx) => {
                if(!player) return;
                const c = coords[idx] || { x: 0.5, y: 0.5 };
                const sId = fSlots[idx]?.id;
                if (sId) posMap[sId] = { x: c.x, y: c.y, pref: player.preference };
            });

            const links = window.ChemistrySystem.getFormationLinks(team.formation);
            if (links) {
                ctx.lineWidth = 3;
                links.forEach(({from, to}) => {
                    const p1 = posMap[from];
                    const p2 = posMap[to];
                    if (p1 && p2) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);

                        if (p1.pref === p2.pref) {
                            ctx.strokeStyle = '#2ecc71';
                        } else {
                            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                            ctx.lineWidth = 1.5;
                        }
                        ctx.stroke();
                        ctx.lineWidth = 3; // reset
                    }
                });
            }
        }

        team.starting11.forEach((player, idx) => {
            const c = coords[idx] || { x: 0.5, y: 0.5 };
            const div = this.createFCPlayerToken(player, true, idx, team.formation);
            div.style.left = `${c.x * 100}%`;
            div.style.top = `${c.y * 100}%`;
            div.onclick = () => this.handlePlayerClick(idx, false);
            if (this.selectedPlayerIndex === idx) {
                div.style.transform = 'translate(-50%, -50%) scale(1.1)';
                div.style.borderColor = '#f1c40f';
                div.style.zIndex = 100;
            }
            if (this.swapSourceIndex === idx) div.style.borderColor = '#2ecc71';
            container.appendChild(div);
        });

        team.bench.forEach((player, i) => {
            const idx = i + 11;
            const div = this.createFCPlayerToken(player, false, idx, team.formation);
            div.onclick = () => this.handlePlayerClick(idx, false);
            if (this.selectedPlayerIndex === idx) {
                div.style.transform = 'scale(1.05)';
                div.style.borderColor = '#f1c40f';
                div.style.zIndex = 100;
            }
            if (this.swapSourceIndex === idx) div.style.borderColor = '#2ecc71';
            benchContainer.appendChild(div);
        });
    }

    createFCPlayerToken(player, isStarter, idx, formation) {
        const div = document.createElement('div');
        div.className = 'player-token-fc' + (isStarter ? '' : ' bench-token');
        div.style.cssText = `
            width: ${isStarter ? '60px' : '65px'};
            height: ${isStarter ? '80px' : '90px'};
            background: rgba(20, 20, 20, 0.85);
            border: 1px solid #aaa;
            border-radius: 6px;
            position: ${isStarter ? 'absolute' : 'relative'};
            ${isStarter ? 'transform: translate(-50%, -50%);' : ''}
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
            box-shadow: 0 4px 6px rgba(0,0,0,0.5); cursor: pointer; transition: all 0.1s;
        `;

        if (!player) {
            div.innerHTML = `<div style="font-size:32px; margin-top:15px;">❌</div>`;
            return div;
        }

        const ovr = player.getOvr ? player.getOvr() : 50;
        const stamRatio = (player.condition || 100) / 100;
        const stamColor = stamRatio > 0.6 ? '#2ecc71' : stamRatio > 0.3 ? '#f1c40f' : '#e74c3c';

        let mobWarning = '';
        if (isStarter && formation) {
            const fSlots = window.MasterData.Formations[formation]?.slots;
            if (fSlots && fSlots[idx]) {
                const expectedPosStr = fSlots[idx].expectedPosStr || fSlots[idx].position || player.position;
                const isMainPos = player.position === expectedPosStr;
                const isSubPos = !isMainPos && player.subPositions && player.subPositions.includes(expectedPosStr);
                const isMob = !isMainPos && !isSubPos;
                player.isMob = isMob;

                if (isMob) {
                    mobWarning = `<div style="position:absolute; top:-12px; left:-12px; font-size:16px; background:#000; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 4px #000; z-index:3;" title="適性外 (モブ化ペナルティ)">⚠️</div>`;
                }
            }
        }

        const ovrHtml = `<div style="position:absolute; top:-8px; right:-8px; background:#e67e22; color:#fff; font-weight:bold; font-size:14px; padding:2px 4px; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.5); z-index:2;">${ovr}</div>`;
        const prefColor = player.preference === 'Possession' ? '#3498db' : player.preference === 'Counter' ? '#e74c3c' : player.preference === 'HighPress' ? '#f1c40f' : '#2ecc71';

        const svgIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="margin-top: 5px;">
            <circle cx="12" cy="7" r="4" fill="#ffe0bd" stroke="black" stroke-width="1"/>
            <path d="M7 13 L17 13 L16 22 L8 22 Z" fill="${prefColor}" stroke="black" stroke-width="1"/>
            <path d="M7 13 L4 18 L6 19 L8 15 Z" fill="${prefColor}" stroke="black" stroke-width="1"/>
            <path d="M17 13 L20 18 L18 19 L16 15 Z" fill="${prefColor}" stroke="black" stroke-width="1"/>
        </svg>`;

        div.innerHTML = `
            ${mobWarning}
            ${ovrHtml}
            ${svgIcon}
            <div style="width: 90%; height: 4px; background: #333; border-radius: 2px; margin: 4px 0 2px 0; overflow:hidden;"><div style="height:100%; width:${stamRatio * 100}%; background:${stamColor}"></div></div>
            <div style="font-size: 11px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:90%; text-align:center;">${player.name}</div>
            <div style="font-size: 10px; color:#f1c40f; font-weight:bold;">${player.position}</div>
        `;
        return div;
    }



    handlePlayerClick(index, executeSwap = false) {
        const team = window.gameState.playerTeam;
        const player = index < 11 ? team.starting11[index] : team.bench[index - 11];

        if (this.swapSourceIndex !== null) {
            if (this.swapSourceIndex === index) {
                this.swapSourceIndex = null;
                this.selectedPlayerIndex = index;
                this.renderFormation();
                this.renderPlayerDetailCard(player, index);
            } else if (executeSwap) {
                const idx1 = this.swapSourceIndex;
                const idx2 = index;
                const p1 = idx1 < 11 ? team.starting11[idx1] : team.bench[idx1 - 11];
                const p2 = idx2 < 11 ? team.starting11[idx2] : team.bench[idx2 - 11];

                if (idx1 < 11) team.starting11[idx1] = p2;
                else team.bench[idx1 - 11] = p2;

                if (idx2 < 11) team.starting11[idx2] = p1;
                else team.bench[idx2 - 11] = p1;

                window.ChemistrySystem.calculateTeamChemistry(team);
                this.swapSourceIndex = null;
                this.selectedPlayerIndex = index;
                this.showSquad();
            } else {
                this.selectedPlayerIndex = index;
                this.renderFormation();
                this.renderPlayerComparison(this.swapSourceIndex, index);
            }
        } else {
            this.selectedPlayerIndex = index;
            this.renderFormation();
            this.renderPlayerDetailCard(player, index);
        }
    }

    renderPlayerComparison(idx1, idx2) {
        const detailPanel = document.getElementById('player-detail-panel');
        if (!detailPanel) return;

        const team = window.gameState.playerTeam;
        const p1 = idx1 < 11 ? team.starting11[idx1] : team.bench[idx1 - 11];
        const p2 = idx2 < 11 ? team.starting11[idx2] : team.bench[idx2 - 11];
        if(!p1 || !p2) return;

        detailPanel.innerHTML = `
            <div style="padding: 15px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; margin-bottom: 10px;">
                    <div style="flex:1; text-align:center;">
                        <div style="font-size: 18px; font-weight: bold; color: #f1c40f;">${p1.position}</div>
                        <div style="font-size: 16px; color: #fff;">${p1.name}</div>
                    </div>
                    <div style="font-size: 20px; color: #fff; font-weight:bold;">VS</div>
                    <div style="flex:1; text-align:center;">
                        <div style="font-size: 18px; font-weight: bold; color: #f1c40f;">${p2.position}</div>
                        <div style="font-size: 16px; color: #fff;">${p2.name}</div>
                    </div>
                </div>

                <div class="compare-radar-container" style="width: 100%; height: 200px; display: flex; justify-content: center; align-items: center; position: relative; margin-bottom: 10px;">
                    <canvas id="fc-radar-chart" width="200" height="200"></canvas>
                </div>

                <div style="flex: 1; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #fff;">
                        <tr><th style="background: rgba(0,0,0,0.5); padding: 5px;">${p1.name}</th><th style="background: rgba(0,0,0,0.5); padding: 5px;">STAT</th><th style="background: rgba(0,0,0,0.5); padding: 5px;">${p2.name}</th></tr>
                        ${this.generateCompareRow(p1.condition, p2.condition, '体力')}
                        ${this.generateCompareRow(p1.stats.pass, p2.stats.pass, 'パス')}
                        ${this.generateCompareRow(p1.stats.shoot, p2.stats.shoot, 'シュート')}
                        ${this.generateCompareRow(p1.stats.defense, p2.stats.defense, '守備')}
                        ${this.generateCompareRow(p1.stats.speed, p2.stats.speed, 'スピード')}
                        ${this.generateCompareRow(p1.stats.physical, p2.stats.physical, 'フィジカル')}
                        ${this.generateCompareRow(p1.stats.mental, p2.stats.mental, 'メンタル')}
                    </table>
                </div>

                <button onclick="managementUI.handlePlayerClick(${idx2}, true)" style="margin-top: 10px; width: 100%; padding: 12px; font-size: 16px; font-weight: bold; background: #27ae60; color:#fff; border: none; border-radius: 6px; cursor: pointer;">
                    ⚡ 入れ替えを確定する
                </button>
            </div>
        `;

        this.drawRadarChart(document.getElementById('fc-radar-chart'), p1, p2);
    }

    generateCompareRow(v1, v2, label) {
        let c1 = '', c2 = '';
        if (v1 > v2) { c1 = 'color: #2ecc71; font-weight: bold;'; c2 = 'color: #e74c3c; font-weight: bold;'; }
        else if (v1 < v2) { c1 = 'color: #e74c3c; font-weight: bold;'; c2 = 'color: #2ecc71; font-weight: bold;'; }
        return `<tr><td style="padding: 4px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); ${c1}">${Math.floor(v1)}</td><td style="padding: 4px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">${label}</td><td style="padding: 4px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); ${c2}">${Math.floor(v2)}</td></tr>`;
    }

    drawRadarChart(canvas, p1, p2) {
        const ctx = canvas.getContext('2d');
        const cx = 100, cy = 100, r = 80;

        ctx.clearRect(0,0,200,200);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        for(let j=1; j<=5; j++){
            ctx.beginPath();
            for(let i=0; i<6; i++) {
                const a = (i * 60 - 90) * Math.PI / 180;
                const dist = r * (j/5);
                ctx.lineTo(cx + Math.cos(a)*dist, cy + Math.sin(a)*dist);
            }
            ctx.closePath();
            ctx.stroke();
        }

        const drawData = (data, color, fillMode) => {
            ctx.beginPath();
            for(let i=0; i<6; i++) {
                const a = (i * 60 - 90) * Math.PI / 180;
                const val = Math.min(100, Math.max(0, data[i])) / 100;
                ctx.lineTo(cx + Math.cos(a)*r*val, cy + Math.sin(a)*r*val);
            }
            ctx.closePath();
            ctx.fillStyle = fillMode;
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        const p1Data = [p1.stats.pass, p1.stats.shoot, p1.stats.defense, p1.stats.physical, p1.stats.speed, p1.stats.mental];
        const p2Data = [p2.stats.pass, p2.stats.shoot, p2.stats.defense, p2.stats.physical, p2.stats.speed, p2.stats.mental];
        drawData(p1Data, '#3498db', 'rgba(52, 152, 219, 0.4)');
        drawData(p2Data, '#e74c3c', 'rgba(231, 76, 60, 0.4)');
    }

    renderPlayerDetailCard(player, index) {
        const detailPanel = document.getElementById('player-detail-panel');
        if (!detailPanel) return;
        if (!player) {
            detailPanel.innerHTML = `<div style="flex:1; display:flex; align-items:center; justify-content:center; color:#7f8c8d;">選手を選択してください</div>`;
            return;
        }

        const team = window.gameState.playerTeam;
        const isComparing = this.swapSourceIndex !== null && this.swapSourceIndex !== index;
        const srcPlayer = isComparing
            ? (this.swapSourceIndex < 11 ? team.starting11[this.swapSourceIndex] : team.bench[this.swapSourceIndex - 11])
            : null;

        const statLabels = {
            pass: 'Pass', shoot: 'Shoot', defense: 'Defense',
            physical: 'Physical', speed: 'Speed', mental: 'Mental', stamina: 'Stamina'
        };

        const buildStatGrid = (targetP, baseCompareP = null) => {
            return Object.entries(targetP.stats).map(([key, val]) => {
                let color = '#3498db';
                if (val >= 80) color = '#f1c40f';
                else if (val >= 65) color = '#2ecc71';
                else if (val < 45) color = '#e74c3c';

                let diffHtml = '';
                if (baseCompareP) {
                    const diff = val - (baseCompareP.stats[key] || 0);
                    if (diff > 0) diffHtml = `<span style="color:#2ecc71; font-size:10px; margin-left:2px;">+${diff}</span>`;
                    else if (diff < 0) diffHtml = `<span style="color:#e74c3c; font-size:10px; margin-left:2px;">${diff}</span>`;
                }

                return `
                    <div style="background: rgba(0,0,0,0.25); padding: 3px 6px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
                            <span style="color: #bdc3c7;">${statLabels[key]}</span>
                            <span style="font-weight: 800; color: #fff;">${val}${diffHtml}</span>
                        </div>
                        <div style="width: 100%; background: #222; height: 5px; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${val}%; background: ${color}; height: 100%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        };

        const buildSkillsList = (targetP) => {
            if (!targetP.skills || targetP.skills.length === 0) return '<span style="font-size:10px; color:#666;">スキルなし</span>';
            return targetP.skills.map(sId => {
                const s = window.MasterData.PlayerSkills.find(sk => sk.id === sId);
                return s ? `<span style="background:#1a3a30; border:1px solid #2ecc71; padding:2px 6px; border-radius:4px; font-size:10px; display:inline-block; margin:2px;" title="${s.description}">${s.name}</span>` : '';
            }).join('');
        };

        let comparisonSectionHtml = '';
        if (isComparing && srcPlayer) {
            comparisonSectionHtml = `
                <div style="margin-top: 8px; padding: 8px; background: rgba(231, 76, 60, 0.1); border: 1px dashed #e74c3c; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; font-weight: 800; color: #ff7979;">入れ替え元: [${srcPlayer.position}] ${srcPlayer.name}</span>
                        <span style="font-size: 13px; font-weight: 900; color: #f1c40f;">OVR ${srcPlayer.getOvr()}</span>
                    </div>
                    <div style="font-size: 10px; color: #bdc3c7; margin-bottom: 4px;">
                        副適性: ${srcPlayer.subPositions?.join(', ') || 'なし'} | 志向: ${srcPlayer.preference} | 体力: ${srcPlayer.condition ?? 100}%
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        ${buildStatGrid(srcPlayer)}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: auto; padding-top: 8px;">
                    <button onclick="managementUI.toggleSwapMode(null)" style="flex: 1; background: #555;">キャンセル</button>
                    <button onclick="managementUI.handlePlayerClick(${index}, true)" style="flex: 2; background: #e74c3c; border-color: #ff7979; font-size: 14px;">
                        ⚡ この2人を入れ替える
                    </button>
                </div>
            `;
        } else {
            comparisonSectionHtml = `
                <div style="margin-top: auto; padding-top: 8px;">
                    <button onclick="managementUI.toggleSwapMode(${index})" style="width: 100%; padding: 10px; font-size: 13px; background: ${this.swapSourceIndex === index ? '#c0392b' : '#2980b9'}; border-color: #5dade2;">
                        ${this.swapSourceIndex === index ? '❌ 入れ替え選択を解除（他の選手をクリックで比較）' : '🔄 この選手を入れ替え元に指定する'}
                    </button>
                </div>
            `;
        }

        detailPanel.innerHTML = `
            <div class="panel-header-title">
                <span>${isComparing ? '🔍 2選手ステータス比較' : '選手詳細インスペクター'}</span>
                <span style="color: #f1c40f;">${index < 11 ? 'スタメン' : 'ベンチ'}</span>
            </div>

            <div style="background: #122620; border: 1px solid #285446; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="background: #f39c12; color: #000; font-weight: 900; font-size: 10px; padding: 1px 5px; border-radius: 3px;">${player.rarity}</span>
                        <span style="font-size: 11px; color: #bdc3c7; margin-left: 4px;">${player.nationality || ''}</span>
                        <div style="font-size: 16px; font-weight: 900; color: #fff; margin-top: 2px;">[${player.position}] ${player.name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: 900; color: #f1c40f;">OVR ${player.getOvr()}</div>
                        <div style="font-size: 11px; color: #2ecc71;">Lv.${player.level} (${player.preference})</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #bdc3c7; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 4px;">
                    <span><strong>副適性:</strong> ${player.subPositions?.length ? player.subPositions.join(', ') : 'なし'}</span>
                    <span><strong>役割:</strong> ${player.role || 'Standard'}</span>
                    <span><strong>体力:</strong> ${player.condition ?? 100}%</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${buildStatGrid(player, srcPlayer)}
                </div>

                <div>
                    <div style="font-size: 10px; color: #95a5a6; margin-bottom: 2px;">所持スキル:</div>
                    <div>${buildSkillsList(player)}</div>
                </div>
            </div>

            ${comparisonSectionHtml}
        `;
    }

    toggleSwapMode(index) {
        if (index === null || this.swapSourceIndex === index) {
            this.swapSourceIndex = null;
        } else {
            this.swapSourceIndex = index;
        }
        const team = window.gameState.playerTeam;
        const p = this.selectedPlayerIndex < 11
            ? team.starting11[this.selectedPlayerIndex]
            : team.bench[this.selectedPlayerIndex - 11];
        this.renderFormation();
        this.renderPlayerDetailCard(p, this.selectedPlayerIndex);
    }

    handlePlayerClick(index, executeSwap = false) {
        const team = window.gameState.playerTeam;
        const player = index < 11 ? team.starting11[index] : team.bench[index - 11];

        if (this.swapSourceIndex !== null) {
            if (this.swapSourceIndex === index) {
                this.swapSourceIndex = null;
                this.selectedPlayerIndex = index;
                this.renderFormation();
                this.renderPlayerDetailCard(player, index);
            } else if (executeSwap) {
                const idx1 = this.swapSourceIndex;
                const idx2 = index;
                const p1 = idx1 < 11 ? team.starting11[idx1] : team.bench[idx1 - 11];
                const p2 = idx2 < 11 ? team.starting11[idx2] : team.bench[idx2 - 11];

                if (idx1 < 11) team.starting11[idx1] = p2;
                else team.bench[idx1 - 11] = p2;

                if (idx2 < 11) team.starting11[idx2] = p1;
                else team.bench[idx2 - 11] = p1;

                window.ChemistrySystem.calculateTeamChemistry(team);
                this.swapSourceIndex = null;
                this.selectedPlayerIndex = index;
                this.showSquad();
            } else {
                this.selectedPlayerIndex = index;
                this.renderFormation();
                this.renderPlayerDetailCard(player, index);
            }
        } else {
            this.selectedPlayerIndex = index;
            this.renderFormation();
            this.renderPlayerDetailCard(player, index);
        }
    }

    // =========================================================
    // 2. スカウト・強化 (APイベント) 画面
    // =========================================================
    showEvents() {
        this.activeTab = 'events';
        this.updateTopBar();

        if (!window.gameState.currentEvents || window.gameState.currentEvents.length === 0) {
            if (!window.gameState.eventsGeneratedForTurn) {
                this.generateEvents();
                window.gameState.eventsGeneratedForTurn = true;
            }
        }

        const events = window.gameState.currentEvents;
        this.uiContent.innerHTML = `
            <div class="ui-layout-container" style="flex-direction: column;">
                <div style="display: flex; gap: 10px; flex-shrink: 0;">
                    ${events.map(e => {
                        const colors = { scout: '#2ecc71', training: '#3498db', relic: '#f39c12', command: '#9b59b6', mystery: '#e74c3c' };
                        const c = colors[e.type] || '#bdc3c7';
                        return `
                            <div id="card_${e.id}" class="event-card" onclick="managementUI.selectEvent('${e.id}')"
                                style="flex: 1; background: #10241e; border: 2px solid ${c}; border-radius: 8px; padding: 10px 12px; cursor: pointer;">
                                <div style="font-size: 14px; font-weight: 800; color: ${c}; margin-bottom: 4px;">${e.title}</div>
                                <div style="font-size: 11px; color: #95a5a6;">${e.flavorText || ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div id="event-detail-panel" class="ui-panel" style="flex: 1; overflow-y: auto;">
                    <div style="margin: auto; color: #7f8c8d; font-size: 14px;">上のイベントカードを選択してください</div>
                </div>
            </div>
        `;

        if (events.length > 0) {
            this.selectEvent(events[0].id);
        }
    }

    selectEvent(eventId) {
        const e = window.gameState.currentEvents.find(ev => ev.id === eventId);
        if (!e) return;

        document.querySelectorAll('.event-card').forEach(el => {
            el.style.boxShadow = 'none';
        });
        const cardEl = document.getElementById(`card_${eventId}`);
        if (cardEl) cardEl.style.boxShadow = '0 0 14px rgba(46, 204, 113, 0.5)';

        const detailPanel = document.getElementById('event-detail-panel');
        if (!detailPanel) return;

        const team = window.gameState.playerTeam;
        const posCounts = { GK: 0, DF: 0, MF: 0, FW: 0 };
        (team.players || []).forEach(p => {
            if (p.position === 'GK') posCounts.GK++;
            else if (['CB', 'SB'].includes(p.position)) posCounts.DF++;
            else if (['CDM', 'CM', 'CAM'].includes(p.position)) posCounts.MF++;
            else posCounts.FW++;
        });

        let html = `
            <div class="panel-header-title">
                <span style="font-size: 16px;">${e.title} — ${e.flavorText || ''}</span>
                <span style="color: #f1c40f; font-size: 12px;">
                    現在編成: GK ${posCounts.GK} | DF ${posCounts.DF} | MF ${posCounts.MF} | FW ${posCounts.FW} (計${team.players.length}/18名)
                </span>
            </div>
            <div style="display: flex; gap: 12px; flex: 1; align-items: stretch; overflow-y: auto;">
        `;

        e.choices.forEach((choice, idx) => {
            const canAfford = window.gameState.funds >= choice.fundCost && window.gameState.ap >= 1;
            const titleText = choice.text || choice.desc;

            let innerContent = '';
            if (choice.candidates) {
                innerContent += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px;">`;
                choice.candidates.forEach((cand, candIdx) => {
                    const skillsStr = cand.skills.map(sid => window.MasterData.PlayerSkills.find(s => s.id === sid)?.name).filter(Boolean).join(', ') || 'なし';
                    const subStr = cand.subPositions?.length ? `/${cand.subPositions.join(',')}` : '';
                    innerContent += `
                        <label style="background: #0b1814; border: 1px solid #285446; border-radius: 6px; padding: 8px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span><input type="radio" name="draft_select_${eventId}_${idx}" value="${candIdx}" ${candIdx === 0 ? 'checked' : ''}> <strong>[${cand.position}${subStr}] ${cand.name}</strong></span>
                                <span style="color: #f1c40f; font-weight: 900;">OVR ${cand.getOvr()}</span>
                            </div>
                            <div style="font-size: 10px; color: #a3e4d7;">${cand.rarity} | Lv.${cand.level} | 志向: ${cand.preference} | 役割: ${cand.role || 'なし'}</div>
                            <div style="font-size: 10px; color: #bdc3c7;">SPD:${cand.stats.speed} PAS:${cand.stats.pass} SHT:${cand.stats.shoot} DEF:${cand.stats.defense} PHY:${cand.stats.physical}</div>
                            <div style="font-size: 10px; color: #95a5a6;">スキル: ${skillsStr}</div>
                        </label>
                    `;
                });
                innerContent += `</div>`;
            }

            if (choice.tradeCount > 0) {
                innerContent += `<div style="margin-bottom: 8px;">`;
                for (let tc = 0; tc < choice.tradeCount; tc++) {
                    let optIdx = 0;
                    innerContent += `<div style="font-size: 11px; color: #ff7979; margin-bottom: 2px;">放出選手 ${tc + 1}:</div>`;
                    innerContent += `<select id="trade_select_${eventId}_${idx}_${tc}" style="width: 100%; background: #0b1714; color: #fff; padding: 5px; border: 1px solid #e74c3c; border-radius: 4px; font-size: 11px; margin-bottom: 4px;">`;
                    team.bench.forEach(p => {
                        innerContent += `<option value="${p.id}" ${optIdx === tc ? 'selected' : ''}>[ベンチ] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()} / ${p.preference})</option>`;
                        optIdx++;
                    });
                    team.starting11.forEach(p => {
                        innerContent += `<option value="${p.id}" ${optIdx === tc ? 'selected' : ''}>[スタメン] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()} / ${p.preference})</option>`;
                        optIdx++;
                    });
                    innerContent += `</select>`;
                }
                innerContent += `</div>`;
            } else if (choice.action === 'awaken') {
                innerContent += `
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 11px; color: #3498db; margin-bottom: 3px;">覚醒対象を選択:</div>
                        <select id="awaken_select_${eventId}_${idx}" style="width: 100%; background: #0b1714; color: #fff; padding: 6px; border: 1px solid #3498db; border-radius: 4px;">
                            ${team.starting11.map(p => `<option value="${p.id}">[スタメン] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`).join('')}
                            ${team.bench.map(p => `<option value="${p.id}">[ベンチ] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`).join('')}
                        </select>
                    </div>
                `;
            } else if (choice.action === 'teach_skill') {
                const validTargets = team.players.filter(p => p.skills.length < 3 && choice.skill.allowedPositions.includes(p.position) && !p.skills.includes(choice.skill.id));
                innerContent += `
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 11px; color: #3498db; margin-bottom: 3px;">伝授する対象選手:</div>
                        <select id="teach_select_${eventId}_${idx}" style="width: 100%; background: #0b1714; color: #fff; padding: 6px; border: 1px solid #3498db; border-radius: 4px;">
                            ${validTargets.length === 0 ? `<option value="">対象選手がいません</option>` : validTargets.map(p => `<option value="${p.id}">[${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`).join('')}
                        </select>
                    </div>
                `;
            } else if (choice.action === 'mad_science') {
                innerContent += `
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 11px; color: #9b59b6; margin-bottom: 3px;">手術対象を選択:</div>
                        <select id="mad_select_${eventId}_${idx}" style="width: 100%; background: #0b1714; color: #fff; padding: 6px; border: 1px solid #9b59b6; border-radius: 4px;">
                            ${team.starting11.map(p => `<option value="${p.id}">[スタメン] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`).join('')}
                            ${team.bench.map(p => `<option value="${p.id}">[ベンチ] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`).join('')}
                        </select>
                    </div>
                `;
            }

            html += `
                <div style="flex: 1; background: #122620; border: 1px solid #285446; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 6px;">${titleText}</div>
                        ${choice.detailHtml || ''}
                        ${innerContent}
                    </div>
                    <button onclick="managementUI.executeEvent('${eventId}', ${idx})" ${!canAfford ? 'disabled' : ''}
                        style="width: 100%; padding: 10px; background: ${canAfford ? '#27ae60' : '#333'}; margin-top: 8px;">
                        実行する (資金: ¥${choice.fundCost.toLocaleString()} / AP: 1)
                    </button>
                </div>
            `;
        });

        html += `</div>`;
        detailPanel.innerHTML = html;
    }

    generateEvents() {
        window.gameState.currentEvents = [];
        const baseTypes = ['command', 'scout', 'training', 'relic', 'mystery'];
        const tier = window.gameState.currentTier || 3;
        const matchday = window.gameState.league ? window.gameState.league.currentMatchday : 1;
        const costMultiplier = (4 - tier) + (matchday * 0.1);
        const currentSquadSize = window.gameState.playerTeam.players.length;

        const guaranteedTypes = ['scout', 'training', 'relic', 'command', 'mystery'];

        guaranteedTypes.forEach((type, i) => {
            const eventObj = { id: `evt_${Date.now()}_${i}`, type, choices: [] };

            if (type === 'scout') {
                eventObj.title = 'スカウトからの提案';
                eventObj.flavorText = '3名の候補から1名をドラフト獲得します';
                const addDraft = (costBase, tradeCount, rarity) => {
                    const cost = Math.floor(costBase * costMultiplier);
                    const candidates = [
                        window.Player.generateRandom(`draft_${i}_${rarity}_0`, null, rarity),
                        window.Player.generateRandom(`draft_${i}_${rarity}_1`, null, rarity),
                        window.Player.generateRandom(`draft_${i}_${rarity}_2`, null, rarity)
                    ];
                    const label = tradeCount > 0 ? `${rarity}ランク補強 (${tradeCount}名放出)` : `${rarity}ランク補強`;
                    eventObj.choices.push({
                        text: label,
                        desc: label,
                        fundCost: cost,
                        tradeCount,
                        rewardRarity: rarity,
                        candidates
                    });
                };
                addDraft(100000, currentSquadSize >= 18 ? 1 : 0, 'N');
                addDraft(200000, 1, 'R');
                addDraft(400000, 2, Math.random() > 0.75 ? 'SSR' : 'SR');
            } else if (type === 'training') {
                eventObj.title = 'トレーニング・特別指導';
                eventObj.flavorText = '選手の能力強化とコンディション調整';
                eventObj.choices.push({
                    text: '軽めの調整メニュー',
                    desc: '軽めの調整 (無償) - 全員の体力+30 / EXP+15',
                    detailHtml: '<p style="font-size:12px; color:#2ecc71; margin-bottom:8px;">効果: チーム全員の体力+30回復 / EXP+15獲得</p>',
                    fundCost: 0,
                    action: 'light'
                });
                eventObj.choices.push({
                    text: '強化合宿',
                    desc: '特別合宿 - 全員のEXP+60 / 体力-15',
                    detailHtml: '<p style="font-size:12px; color:#f1c40f; margin-bottom:8px;">効果: チーム全員のEXP+60獲得 / 体力-15消費</p>',
                    fundCost: Math.floor(150000 * costMultiplier),
                    action: 'heavy'
                });
                eventObj.choices.push({
                    text: '個別覚醒指導',
                    desc: '指定選手1名を大幅レベルアップ (EXP+300 / 体力全快)',
                    detailHtml: '<p style="font-size:12px; color:#3498db; margin-bottom:8px;">効果: 指定した選手1名のEXP+300＆体力100%回復</p>',
                    fundCost: Math.floor(280000 * costMultiplier),
                    action: 'awaken'
                });
            } else if (type === 'relic') {
                eventObj.title = '戦術アナリスト・ショップ';
                eventObj.flavorText = 'クラブ全体を強化するマクロ（宝物）の購入';
                const unowned = window.MasterData.Relics.filter(r => !window.gameState.playerTeam.relics.includes(r.id));
                unowned.slice(0, 3).forEach(r => {
                    const cost = Math.floor(300000 * costMultiplier);
                    eventObj.choices.push({
                        text: `宝物「${r.name}」を購入`,
                        desc: `資金¥${cost.toLocaleString()}で「${r.name}」を購入 [効果] ${r.description}`,
                        detailHtml: `<p style="font-size:12px; color:#f1c40f; margin-bottom:8px;">効果: ${r.description}</p>`,
                        fundCost: cost,
                        relicId: r.id
                    });
                });
                if (eventObj.choices.length === 0) {
                    eventObj.choices.push({ text: '寄付金を受け取る', desc: 'スポンサー臨時収入 (+¥100,000)', fundCost: 0, action: 'sponsor_funds' });
                }
            } else if (type === 'command') {
                eventObj.title = '戦術コーチの提案';
                eventObj.flavorText = '試合中に発動できる新しいミクロ戦術コマンドの習得';
                const unownedCmds = window.MasterData.MicroCommands.filter(c => !window.gameState.playerTeam.ownedMicroCommands.includes(c.id));
                unownedCmds.slice(0, 3).forEach(c => {
                    const cost = Math.floor(150000 * costMultiplier);
                    const cDesc = c.description || (c.type === 'buff' ? `${c.target} +${c.value}` : c.actionType);
                    eventObj.choices.push({
                        text: `戦術「${c.name}」を習得`,
                        desc: `「${c.name}」を習得 (CD:${c.cooldown}s / 効果:${cDesc})`,
                        detailHtml: `<p style="font-size:12px; color:#a3e4d7; margin-bottom:8px;">クールダウン: ${c.cooldown}秒 | 効果: ${cDesc}</p>`,
                        fundCost: cost,
                        cmdId: c.id
                    });
                });
            } else if (type === 'mystery') {
                eventObj.title = 'フロント・特別イベント';
                eventObj.flavorText = 'ハイリスク・ハイリターンな特別決断';
                eventObj.choices.push({
                    text: 'スポンサー巡業イベント',
                    desc: '資金+¥250,000獲得 / 全員の体力-15',
                    detailHtml: '<p style="font-size:12px; color:#f1c40f; margin-bottom:8px;">効果: 資金¥250,000を即時獲得（全員の体力-15）</p>',
                    fundCost: 0,
                    action: 'sponsor'
                });
                eventObj.choices.push({
                    text: '超人フィジカル改造',
                    desc: '指定選手1名のEXP+250',
                    detailHtml: '<p style="font-size:12px; color:#9b59b6; margin-bottom:8px;">効果: 指定した選手1名のEXP+250</p>',
                    fundCost: 100000,
                    action: 'mad_science'
                });
            }

            if (eventObj.choices.length > 0) {
                window.gameState.currentEvents.push(eventObj);
            }
        });
    }

    executeEvent(eventId, choiceIndex) {
        const eventIdx = window.gameState.currentEvents.findIndex(e => e.id === eventId);
        if (eventIdx === -1) return;
        const ev = window.gameState.currentEvents[eventIdx];
        const choice = ev.choices[choiceIndex];
        if (!choice) return;

        if (window.gameState.ap < 1 || window.gameState.funds < choice.fundCost) {
            this.showToast('APまたは資金が不足しています！');
            return;
        }

        const team = window.gameState.playerTeam;

        if (choice.candidates) {
            let selectedCandIdx = 0;
            if (typeof document.querySelector === 'function') {
                const radio = document.querySelector(`input[name="draft_select_${eventId}_${choiceIndex}"]:checked`);
                if (radio && radio.value !== undefined) selectedCandIdx = Number(radio.value);
            }
            const newPlayer = choice.candidates[selectedCandIdx] || choice.candidates[0];

            const tradedIds = [];
            for (let tc = 0; tc < (choice.tradeCount || 0); tc++) {
                const sel = document.getElementById(`trade_select_${eventId}_${choiceIndex}_${tc}`);
                if (sel && sel.value) tradedIds.push(sel.value);
            }
            if (new Set(tradedIds).size !== tradedIds.length) {
                this.showToast('放出する選手に同じ選手が複数選ばれています！');
                return;
            }

            tradedIds.forEach(tId => {
                this.replaceOrRemovePlayer(team, tId, null);
            });

            newPlayer.isNew = true;
            team.players.push(newPlayer);
            if (team.starting11.length < 11) team.starting11.push(newPlayer);
            else team.bench.push(newPlayer);

            this.showToast(`${newPlayer.name} (${newPlayer.rarity} / OVR:${newPlayer.getOvr()}) を獲得しました！`);
        } else if (choice.action === 'light') {
            team.players.forEach(p => {
                p.condition = Math.min(100, (p.condition ?? 100) + 30);
                p.addExp(15);
            });
            this.showToast('軽めの調整を実施しました（体力+30 / EXP+15）');
        } else if (choice.action === 'heavy') {
            team.players.forEach(p => {
                p.condition = Math.max(10, (p.condition ?? 100) - 15);
                p.addExp(60);
            });
            this.showToast('強化合宿を実施しました（EXP+60 / 体力-15）');
        } else if (choice.action === 'awaken') {
            const sel = document.getElementById(`awaken_select_${eventId}_${choiceIndex}`);
            const target = team.players.find(p => p.id === (sel ? sel.value : '')) || team.starting11[0];
            if (target) {
                target.addExp(300);
                target.condition = 100;
                this.showToast(`${target.name} が覚醒しました！(Lv.${target.level} / OVR:${target.getOvr()})`);
            }
        } else if (choice.action === 'mad_science') {
            const sel = document.getElementById(`mad_select_${eventId}_${choiceIndex}`);
            const target = team.players.find(p => p.id === (sel ? sel.value : '')) || team.starting11[0];
            if (target) {
                target.addExp(250);
                this.showToast(`${target.name} の肉体改造が完了しました！(Lv.${target.level})`);
            }
        } else if (choice.action === 'sponsor' || choice.action === 'sponsor_funds') {
            window.gameState.funds += 250000;
            team.players.forEach(p => { p.condition = Math.max(10, (p.condition ?? 100) - 15); });
            this.showToast('スポンサー巡業で資金¥250,000を獲得しました！');
        } else if (choice.relicId) {
            if (!team.relics.includes(choice.relicId)) team.relics.push(choice.relicId);
            const r = window.MasterData.Relics.find(x => x.id === choice.relicId);
            this.showToast(`マクロ宝物「${r ? r.name : ''}」を獲得しました！`);
        } else if (choice.cmdId) {
            if (!team.ownedMicroCommands.includes(choice.cmdId)) team.ownedMicroCommands.push(choice.cmdId);
            const emptyIdx = team.microCommands.findIndex(x => !x);
            if (emptyIdx !== -1) team.microCommands[emptyIdx] = choice.cmdId;
            const c = window.MasterData.MicroCommands.find(x => x.id === choice.cmdId);
            this.showToast(`戦術コマンド「${c ? c.name : ''}」を習得しました！`);
        }

        window.gameState.ap -= 1;
        window.gameState.funds -= choice.fundCost;
        window.gameState.currentEvents.splice(eventIdx, 1);
        window.ChemistrySystem.calculateTeamChemistry(team);

        this.updateTopBar();
        this.showEvents();
    }

    replaceOrRemovePlayer(team, targetId, replacementPlayer = null) {
        team.players = team.players.filter(p => p.id !== targetId);
        const sIdx = team.starting11.findIndex(p => p.id === targetId);
        if (sIdx !== -1) {
            if (replacementPlayer) {
                team.starting11[sIdx] = replacementPlayer;
            } else if (team.bench.length > 0) {
                team.starting11[sIdx] = team.bench.shift();
            } else {
                team.starting11.splice(sIdx, 1);
            }
        } else {
            const bIdx = team.bench.findIndex(p => p.id === targetId);
            if (bIdx !== -1) {
                if (replacementPlayer) team.bench[bIdx] = replacementPlayer;
                else team.bench.splice(bIdx, 1);
            }
        }
    }

    // =========================================================
    // 3. 順位表画面
    // =========================================================
    showStandings() {
        this.activeTab = 'standings';
        this.updateTopBar();

        const standings = window.gameState.league.getStandings();
        const targetRank = window.gameState.currentTier === 1 ? 1 : 2;

        const rowsHtml = standings.map((t, idx) => {
            const rank = idx + 1;
            const isPromo = rank <= targetRank;
            return `
                <tr style="background: ${t.isPlayerTeam ? 'rgba(46, 204, 113, 0.2)' : 'transparent'}; border-bottom: 1px solid #1f3d34;">
                    <td style="padding: 8px; font-weight: 800; color: ${isPromo ? '#f1c40f' : '#ecf0f1'};">${rank}</td>
                    <td style="padding: 8px; text-align: left; font-weight: ${t.isPlayerTeam ? '900' : '600'}; color: ${t.isPlayerTeam ? '#2ecc71' : '#fff'};">
                        ${t.name} ${isPromo ? '👑' : ''}
                    </td>
                    <td style="padding: 8px;">${t.wins + t.draws + t.losses}</td>
                    <td style="padding: 8px;">${t.wins}</td>
                    <td style="padding: 8px;">${t.draws}</td>
                    <td style="padding: 8px;">${t.losses}</td>
                    <td style="padding: 8px;">${t.goalsFor}</td>
                    <td style="padding: 8px;">${t.goalsAgainst}</td>
                    <td style="padding: 8px;">${t.goalDifference > 0 ? '+' + t.goalDifference : t.goalDifference}</td>
                    <td style="padding: 8px; font-weight: 900; color: #f1c40f;">${t.points}</td>
                </tr>
            `;
        }).join('');

        this.uiContent.innerHTML = `
            <div class="ui-panel" style="width: 100%; max-width: 960px; margin: auto; height: 100%;">
                <div class="panel-header-title">
                    <span>🏆 第${window.gameState.currentTier}部リーグ 順位表</span>
                    <span style="color: #f1c40f;">目標ライン: ${targetRank}位以内</span>
                </div>
                <div style="flex: 1; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: center;">
                        <thead>
                            <tr style="background: #122821; color: #2ecc71; border-bottom: 2px solid #2ecc71;">
                                <th style="padding: 8px;">順位</th>
                                <th style="padding: 8px; text-align: left;">クラブ名</th>
                                <th style="padding: 8px;">試</th>
                                <th style="padding: 8px;">勝</th>
                                <th style="padding: 8px;">分</th>
                                <th style="padding: 8px;">敗</th>
                                <th style="padding: 8px;">得</th>
                                <th style="padding: 8px;">失</th>
                                <th style="padding: 8px;">差</th>
                                <th style="padding: 8px;">勝点</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================
    // 4. FC27スタイル 試合前プレビュー画面
    // =========================================================
    showPreMatch() {
        this.activeTab = 'prematch';
        this.updateTopBar();

        const opponent = this.getNextOpponent();
        if (!opponent) return;

        const team = window.gameState.playerTeam;
        window.ChemistrySystem.calculateTeamChemistry(team);
        window.ChemistrySystem.calculateTeamChemistry(opponent);

        const gimmickNames = {
            none: '通常コンディション (快晴)',
            fever: '熱狂スタジアム (前半の相手プレス強化)',
            fortress: 'アウェーの要塞 (相手の守備意識強化)',
            badWeather: '悪天候・ピッチ水没 (パス・トラップ精度低下)'
        };
        const gimmickText = gimmickNames[window.gameState.upcomingGimmick] || gimmickNames.none;

        const keyPlayer = [...opponent.starting11].sort((a, b) => b.getOvr() - a.getOvr())[0];

        this.uiContent.innerHTML = `
            <div class="ui-layout-container">
                <!-- Left: Matchup & Opponent Tactical Report -->
                <div class="ui-panel" style="flex: 1;">
                    <div class="panel-header-title">
                        <span>MATCH PREVIEW - 第${window.gameState.league.currentMatchday}節</span>
                        <span style="color: #f39c12;">${gimmickText}</span>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-around; background: #10241e; padding: 18px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #285446;">
                        <div style="text-align: center;">
                            <div style="width: 54px; height: 54px; border-radius: 50%; background: #c0392b; border: 3px solid #ff7979; display: flex; align-items: center; justify-content: center; font-weight: 900; margin: 0 auto 6px;">YC</div>
                            <div style="font-size: 16px; font-weight: 900;">${team.name}</div>
                            <div style="font-size: 12px; color: #2ecc71;">${team.formation} | 平均OVR ${Math.floor(team.getOverallStrength())}</div>
                        </div>
                        <div style="font-size: 28px; font-weight: 900; color: #2ecc71;">VS</div>
                        <div style="text-align: center;">
                            <div style="width: 54px; height: 54px; border-radius: 50%; background: #f1c40f; color: #111; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; margin: 0 auto 6px;">OPP</div>
                            <div style="font-size: 16px; font-weight: 900;">${opponent.name}</div>
                            <div style="font-size: 12px; color: #f1c40f;">${opponent.formation} | 平均OVR ${Math.floor(opponent.getOverallStrength())}</div>
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
                        <div><strong>敵将の戦術志向:</strong> <span style="color: #f1c40f;">${opponent.manager ? opponent.manager.preference : 'Balance'}</span></div>
                        <div><strong>チームコンセプト:</strong> ${opponent.specializedConcept || 'Standard'}</div>
                        <div style="border-top: 1px solid #264a3f; padding-top: 8px;">
                            <strong style="color: #e74c3c;">⚠️ スカウト警戒選手:</strong>
                            [${keyPlayer.position}] ${keyPlayer.name} (OVR: ${keyPlayer.getOvr()} / SPD:${keyPlayer.stats.speed} SHT:${keyPlayer.stats.shoot} DEF:${keyPlayer.stats.defense})
                        </div>
                    </div>
                </div>

                <!-- Right: Tactical Command Deck Check & Kickoff -->
                <div class="ui-panel" style="flex: 1; justify-content: space-between;">
                    <div>
                        <div class="panel-header-title">
                            <span>戦術コマンド (ミクロ 4スロット最終確認)</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${[0, 1, 2, 3].map(i => {
                                const cmdId = team.microCommands[i];
                                const available = window.MasterData.MicroCommands.filter(c =>
                                    team.ownedMicroCommands.includes(c.id) && (!team.microCommands.includes(c.id) || c.id === cmdId)
                                );
                                const cur = window.MasterData.MicroCommands.find(c => c.id === cmdId);
                                const desc = cur ? (cur.description || (cur.type === 'buff' ? `${cur.target} +${cur.value}` : cur.actionType)) : '未設定';
                                return `
                                    <div style="background: #10241e; border: 1px solid #285446; padding: 10px; border-radius: 6px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                            <strong style="color: #2ecc71; font-size: 12px;">SLOT ${i + 1}</strong>
                                            <select style="background: #08120f; color: #fff; border: 1px solid #2ecc71; padding: 4px 8px; border-radius: 4px; width: 75%;"
                                                onchange="managementUI.updateMicroCommand(${i}, this.value, 'prematch')">
                                                <option value="">-- 未セット --</option>
                                                ${available.map(c => `<option value="${c.id}" ${c.id === cmdId ? 'selected' : ''}>${c.name} (CD:${c.cooldown}s)</option>`).join('')}
                                            </select>
                                        </div>
                                        <div style="font-size: 11px; color: #95a5a6;">効果: ${desc}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <button onclick="managementUI.showSquad()" style="flex: 1; padding: 16px; font-size: 15px;">📋 編成に戻る</button>
                        <button onclick="managementUI.startMatch()" style="flex: 2; padding: 16px; font-size: 20px; background: linear-gradient(135deg, #27ae60, #2ecc71); color: #05140f; border-color: #a3e4d7; font-weight: 900;">
                            ⚽ 試合開始 (KICK OFF)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    startMatch() {
        if (this.uiLayer) this.uiLayer.style.display = 'none';
        if (this.topBar) this.topBar.style.display = 'none';
        if (this.matchWrapper) this.matchWrapper.style.display = 'flex';
        this.gameContainer.classList.add('match-mode');

        if (typeof window.startGame === 'function') {
            window.startGame();
        }
    }

    showVictoryRewardModal() {
        const oppStarters = window.gameState.lastOpponentStarting11 || [];
        const draftPool = [...oppStarters].sort(() => 0.5 - Math.random()).slice(0, 3);
        const team = window.gameState.playerTeam;

        this.uiContent.innerHTML = `
            <div class="menu-box" style="max-width: 860px;" id="victory-detail-panel">
                <h2 style="color: #f1c40f; margin-bottom: 6px;">🏆 勝利ボーナス報酬</h2>
                <p style="font-size: 13px; color: #bdc3c7; margin-bottom: 16px;">対戦相手からの選手引き抜き（1名）、または特別勝利ボーナス資金を受け取れます</p>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; text-align: left;">
                    ${draftPool.map((cand, idx) => `
                        <label style="background: #10241e; border: 1px solid #2ecc71; border-radius: 8px; padding: 12px; cursor: pointer;">
                            <input type="radio" name="victory_draft" value="${idx}" ${idx === 0 ? 'checked' : ''}>
                            <strong style="color: #fff;">[${cand.position}] ${cand.name}</strong>
                            <div style="color: #f1c40f; font-weight: 800; margin: 4px 0;">OVR ${cand.getOvr()} (${cand.rarity})</div>
                            <div style="font-size: 11px; color: #95a5a6;">SPD:${cand.stats.speed} PAS:${cand.stats.pass} SHT:${cand.stats.shoot} DEF:${cand.stats.defense}</div>
                        </label>
                    `).join('')}
                </div>

                <div style="text-align: left; margin-bottom: 16px;">
                    <div style="font-size: 12px; color: #ff7979; margin-bottom: 4px;">引き抜く場合の放出選手を選択:</div>
                    <select id="victory_trade_select" style="width: 100%; padding: 8px; background: #0b1714; color: #fff; border: 1px solid #285446; border-radius: 4px;">
                        ${team.bench.map(p => `<option value="${p.id}">[ベンチ] [${p.rarity}] [${p.position}] ${p.name} (OVR: ${p.getOvr()})</option>`).join('')}
                        ${team.starting11.map(p => `<option value="${p.id}">[スタメン] [${p.rarity}] [${p.position}] ${p.name} (OVR: ${p.getOvr()})</option>`).join('')}
                    </select>
                </div>

                <div style="display: flex; gap: 12px;" class="ui-left-panel">
                    <button id="btn-claim-player" style="flex: 1; background: #27ae60; padding: 12px;">選択した選手を引き抜く</button>
                    <button id="btn-claim-funds" style="flex: 1; background: #f39c12; color: #000; padding: 12px;">臨時ボーナス資金 (+¥150,000) を受け取る</button>
                </div>
            </div>
        `;

        const btnPlayer = document.getElementById('btn-claim-player');
        if (btnPlayer) {
            btnPlayer.onclick = () => {
                const radio = document.querySelector('input[name="victory_draft"]:checked');
                const idx = radio ? Number(radio.value) : 0;
                const picked = draftPool[idx];
                const tradeSel = document.getElementById('victory_trade_select');
                if (picked && tradeSel) {
                    this.replaceOrRemovePlayer(team, tradeSel.value, picked);
                    team.players.push(picked);
                }
                window.gameState.pendingVictoryReward = false;
                this.showSquad();
            };
        }

        const btnFunds = document.getElementById('btn-claim-funds');
        if (btnFunds) {
            btnFunds.onclick = () => {
                window.gameState.funds += 150000;
                window.gameState.pendingVictoryReward = false;
                this.showSquad();
            };
        }
    }

    showGameOver() {
        if (this.topBar) this.topBar.style.display = 'none';
        if (this.matchWrapper) this.matchWrapper.style.display = 'none';
        if (this.uiLayer) this.uiLayer.style.display = 'flex';

        this.uiContent.innerHTML = `
            <div class="menu-box" style="max-width: 560px;">
                <h2 style="font-size: 32px; color: #e74c3c;">CAREER ENDED</h2>
                <p style="margin: 16px 0 24px; color: #bdc3c7;">シーズンの目標達成が不可能となったため、契約終了となりました。</p>
                <button onclick="location.reload()" style="padding: 14px 36px; background: #27ae60; font-size: 16px;">タイトルへ戻る</button>
            </div>
        `;
    }
}

window.ManagementUI = ManagementUI;
window.addEventListener('DOMContentLoaded', () => {
    window.managementUI = new ManagementUI();
    window.managementUI.init();
});
