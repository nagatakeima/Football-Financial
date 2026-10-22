class ManagementUI {
    constructor() {
        this.uiContent = document.getElementById('ui-content');
        this.topBarInfo = document.getElementById('team-info');
        this.topBarSchedule = document.getElementById('schedule-info');
        this.topBar = document.getElementById('top-bar');
        this.phaserGame = document.getElementById('phaser-game');
        this.gameContainer = document.getElementById('game-container');

        // Initialize with Title Screen
        this.showTitleScreen();
    }

    showTitleScreen() {
        this.topBar.style.display = 'none';
        this.phaserGame.style.display = 'none';
        this.gameContainer.classList.remove('match-mode');

        this.uiContent.innerHTML = `
            <div class="menu-box" style="background: rgba(20,20,20,0.95); border: 2px solid #f1c40f;">
                <h1 style="color: #f1c40f; margin-bottom: 30px; font-size: 32px;">Football Tactics: Unseated</h1>
                <p style="margin-bottom: 20px;">限られたリソースでチームをビルドし、解任を回避せよ。</p>
                <button onclick="managementUI.showManagerSelection()" style="width: 250px; padding: 15px; font-size: 18px;">New Dive (新規開始)</button>
            </div>
        `;
    }

    updateMicroCommand(slotIndex, cmdId, fromScreen) {
        if (!window.gameState.playerTeam) return;
        window.gameState.playerTeam.microCommands[slotIndex] = cmdId ? Number(cmdId) : null;
        if (fromScreen === 'squad') this.showSquad();
        else if (fromScreen === 'prematch') this.showPreMatch();
        else this.showDashboard();
    }

    updateTopBar() {
        if (!window.gameState.playerTeam) return;
        this.topBar.style.display = 'flex';

        this.topBarInfo.innerHTML = `
            チーム: ${window.gameState.playerTeam.name}
            <span class="funds">資金: ¥${window.gameState.funds.toLocaleString()}</span>
            <span class="ap">AP: ${window.gameState.ap}/10</span>
            <div class="global-nav">
                <button onclick="managementUI.showDashboard()">🏠 ダッシュボード</button>
                <button onclick="managementUI.showSquad()">📋 編成・戦術</button>
                <button onclick="managementUI.showEvents()">⚡ イベント (AP)</button>
                <button onclick="managementUI.showStandings()">🏆 順位表</button>
                <button onclick="managementUI.showPreMatch()">⚽ 試合へ進む</button>
            </div>
        `;

        // Render relics bar
        const relicsHtml = window.gameState.playerTeam.relics.map(relicId => {
            const relic = window.MasterData.Relics.find(r => r.id === relicId);
            if (!relic) return '';
            return `<div class="relic-badge" data-tooltip="${relic.description}">${relic.name}</div>`;
        }).join('');

        let relicsContainer = document.getElementById('top-bar-relics');
        if (!relicsContainer) {
            relicsContainer = document.createElement('div');
            relicsContainer.id = 'top-bar-relics';
            relicsContainer.style = 'display: flex; gap: 5px; margin-top: 5px; flex-wrap: wrap;';
            this.topBar.appendChild(relicsContainer);
        }
        relicsContainer.innerHTML = relicsHtml;

        this.topBarSchedule.textContent = `第${window.gameState.currentTier}部 第${window.gameState.league ? window.gameState.league.currentMatchday : 1}節`;
    }

    showManagerSelection() {
        let html = `
            <div class="menu-box" style="width: 600px; max-height: 80vh; overflow-y: auto;">
                <h2>監督選択</h2>
                <p>ゲームを開始する監督（初期戦術・特性）を選んでください。</p>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
        `;

        window.MasterData.Managers.forEach(m => {
            const initialRelic = window.MasterData.Relics.find(r => r.name === m.initialTrait);
            const relicDesc = initialRelic ? initialRelic.description : '';
            html += `
                <div style="border: 1px solid #555; padding: 15px; border-radius: 5px; text-align: left; background: #333;">
                    <h3 style="color: #f1c40f; margin-bottom: 5px;">${m.name}</h3>
                    <p><strong>戦術志向:</strong> ${m.preference}</p>
                    <p><strong>初期フォーメーション:</strong> ${m.formations.join(', ')}</p>
                    <p><strong>初期特性 (宝物):</strong> ${m.initialTrait} <span style="font-size: 12px; color: #aaa;">${relicDesc}</span></p>
                    <p><strong>初期資金:</strong> ¥${m.initialFunds.toLocaleString()}</p>
                    <button style="margin-top: 10px; width: 100%;" onclick="managementUI.selectManager(${m.id})">この監督でスタート</button>
                </div>
            `;
        });

        html += `</div></div>`;
        this.uiContent.innerHTML = html;
        this.uiContent.style.display = 'flex';
    }

    selectManager(managerId) {
        window.gameState.startNewDive(managerId);
        this.updateTopBar();
        this.showDashboard();
    }

    showVictoryReward() {
        if (!window.gameState.pendingVictoryReward || !window.gameState.lastOpponentStarting11) {
            this.showDashboard();
            return;
        }

        let html = `
            <div class="menu-box ui-layout-container" style="background: transparent; border: none; padding: 0;">
                <div class="ui-left-panel" style="flex: 1; padding: 20px; border-radius: 8px; background: rgba(40,40,40,0.95); display: flex; flex-direction: column;">
                    <h2 style="color: #f1c40f; margin-bottom: 10px;">MATCH WON! 勝利報酬</h2>
                    <p style="font-size: 14px; margin-bottom: 20px;">見事な勝利です！以下の3つの報酬から1つを選んで獲得してください。</p>

                    <div style="flex: 1; display: flex; flex-direction: column; gap: 15px;">
                        <button onclick="managementUI.selectVictoryRewardType('command')" style="padding: 15px; font-size: 16px; background: #9b59b6; text-align: left;">
                            <span style="font-size: 20px; font-weight: bold;">【戦術コマンド】</span> を獲得
                        </button>
                        <button onclick="managementUI.selectVictoryRewardType('player')" style="padding: 15px; font-size: 16px; background: #27ae60; text-align: left;">
                            <span style="font-size: 20px; font-weight: bold;">【相手選手引き抜き】</span> を獲得
                        </button>
                        <button onclick="managementUI.selectVictoryRewardType('relic')" style="padding: 15px; font-size: 16px; background: #f39c12; text-align: left; color: #000;">
                            <span style="font-size: 20px; font-weight: bold;">【宝物 (特性)】</span> を獲得
                        </button>
                    </div>
                </div>

                <div class="ui-right-panel" id="victory-detail-panel" style="flex: 1.5; margin-left: 10px; padding: 20px; border-radius: 8px; background: rgba(40,40,40,0.95); overflow-y: auto;">
                    <p style="color: #bbb; text-align: center; margin-top: 50px;">左のリストから報酬のジャンルを選択してください</p>
                </div>
            </div>
        `;
        this.uiContent.innerHTML = html;
        this.currentVictoryRewardChoices = null;
        this.currentVictoryRewardType = null;
    }

    selectVictoryRewardType(type) {
        const detailPanel = document.getElementById('victory-detail-panel');
        if (!detailPanel) return;

        this.currentVictoryRewardType = type;
        let html = '';

        if (type === 'command') {
            if (!this.currentVictoryRewardChoices || this.currentVictoryRewardChoices.type !== 'command') {
                const unownedCmds = window.MasterData.MicroCommands.filter(c => !window.gameState.playerTeam.ownedMicroCommands.includes(c.id));
                const shuffled = unownedCmds.sort(() => 0.5 - Math.random());
                this.currentVictoryRewardChoices = { type: 'command', items: shuffled.slice(0, 3) };
            }

            html += `<h3 style="color: #9b59b6; margin-bottom: 15px;">戦術コマンド獲得</h3>`;
            if (this.currentVictoryRewardChoices.items.length === 0) {
                html += `<p>これ以上獲得できるコマンドがありません。</p>`;
            } else {
                html += `<p style="margin-bottom: 15px;">以下のコマンドから1つを選んでください。</p><div style="display: flex; flex-direction: column; gap: 10px;">`;
                this.currentVictoryRewardChoices.items.forEach(cmd => {
                    html += `
                        <div style="background: #222; padding: 15px; border: 1px solid #555; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-weight: bold; font-size: 16px;">${cmd.name}</span> <span style="font-size: 12px; color: #aaa;">(CD: ${cmd.cooldown}s)</span>
                            </div>
                            <button onclick="managementUI.claimVictoryReward('command', ${cmd.id})" style="background: #2980b9;">獲得</button>
                        </div>
                    `;
                });
                html += `</div>`;
            }

        } else if (type === 'player') {
            html += `<h3 style="color: #27ae60; margin-bottom: 15px;">相手選手引き抜き</h3>`;
            html += `<p style="margin-bottom: 15px;">対戦相手のスタメンから1人を獲得できます。<br><span style="color:#e74c3c; font-size: 12px;">※18人上限を超える場合は、獲得時に手持ち選手との入れ替え（放出）が必要です。</span></p>`;

            const players = window.gameState.lastOpponentStarting11;
            html += `<div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px;">`;

            players.forEach((p, idx) => {
                const isSSR = p.rarity === 'SSR';
                html += `
                    <div style="background: #222; padding: 10px; border: 1px solid #555; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="background: ${isSSR?'#f1c40f':'#3498db'}; color: ${isSSR?'#000':'#fff'}; padding: 2px 5px; border-radius: 3px; font-size: 10px;">${p.rarity||'N'}</span>
                            <strong>[${p.position}] ${p.name}</strong> <span style="font-size:12px;">(Lv.${p.level})</span>
                            <span style="color:#f1c40f; margin-left: 10px; font-size:12px;">OVR: ${p.getOvr()}</span>
                        </div>
                        <button onclick="managementUI.claimVictoryReward('player', ${idx})" style="background: #27ae60;">引き抜く</button>
                    </div>
                `;
            });
            html += `</div>`;

            // Release UI if needed
            if (window.gameState.playerTeam.players.length >= 18) {
                html += `
                    <div style="margin-top: 15px; padding: 10px; background: #c0392b; border-radius: 5px;">
                        <p style="font-size: 12px; margin-bottom: 5px;">⚠️ チーム上限(18人)に達しています。獲得するには誰かを放出してください:</p>
                        <select id="victory_trade_select" style="width: 100%; padding: 5px; background: #222; color: #fff;">
                            ${window.gameState.playerTeam.bench.map(p => `<option value="${p.id}">ベンチ: [${p.position}] ${p.name}</option>`).join('')}
                            ${window.gameState.playerTeam.starting11.map(p => `<option value="${p.id}">スタメン: [${p.position}] ${p.name}</option>`).join('')}
                        </select>
                    </div>
                `;
            }

        } else if (type === 'relic') {
            if (!this.currentVictoryRewardChoices || this.currentVictoryRewardChoices.type !== 'relic') {
                const unownedRelics = window.MasterData.Relics.filter(r => !window.gameState.playerTeam.relics.includes(r.id));
                const shuffled = unownedRelics.sort(() => 0.5 - Math.random());
                this.currentVictoryRewardChoices = { type: 'relic', items: shuffled.slice(0, 3) };
            }

            html += `<h3 style="color: #f39c12; margin-bottom: 15px;">宝物獲得</h3>`;
            if (this.currentVictoryRewardChoices.items.length === 0) {
                html += `<p>これ以上獲得できる宝物がありません。</p>`;
            } else {
                html += `<p style="margin-bottom: 15px;">以下の宝物から1つを選んでください。</p><div style="display: flex; flex-direction: column; gap: 10px;">`;
                this.currentVictoryRewardChoices.items.forEach(r => {
                    html += `
                        <div style="background: #222; padding: 15px; border: 1px solid #555; border-radius: 5px; display: flex; flex-direction: column; gap: 10px;">
                            <div>
                                <span style="font-weight: bold; font-size: 16px; color: #f39c12;">${r.name}</span>
                            </div>
                            <div style="font-size: 12px; color: #bbb;">${r.description || ''}</div>
                            <button onclick="managementUI.claimVictoryReward('relic', ${r.id})" style="background: #d35400; align-self: flex-end;">獲得</button>
                        </div>
                    `;
                });
                html += `</div>`;
            }
        }

        detailPanel.innerHTML = html;
    }

    claimVictoryReward(type, idOrIdx) {
        const team = window.gameState.playerTeam;

        if (type === 'command') {
            team.ownedMicroCommands.push(idOrIdx);
            for (let i = 0; i < 4; i++) {
                if (!team.microCommands[i]) {
                    team.microCommands[i] = idOrIdx;
                    break;
                }
            }
            const c = window.MasterData.MicroCommands.find(x => x.id === idOrIdx);
            this.showToast(`戦術コマンド「${c.name}」を獲得しました！`);

        } else if (type === 'player') {
            if (team.players.length >= 18) {
                const selectEl = document.getElementById('victory_trade_select');
                if (!selectEl) {
                    this.showToast("放出すべき選手が選択されていません。");
                    return;
                }
                const releaseId = selectEl.value;
                const pIndex = team.players.findIndex(p => p.id === releaseId);
                if (pIndex !== -1) {
                    team.players.splice(pIndex, 1);
                    const sIdx = team.starting11.findIndex(sp => sp.id === releaseId);
                    if (sIdx !== -1) team.starting11.splice(sIdx, 1);
                    const bIdx = team.bench.findIndex(bp => bp.id === releaseId);
                    if (bIdx !== -1) team.bench.splice(bIdx, 1);
                }
            }

            const newPlayer = window.gameState.lastOpponentStarting11[idOrIdx];
            newPlayer.isNew = true;
            newPlayer.id = `poached_${Date.now()}`; // Ensure unique ID

            team.players.push(newPlayer);
            if (team.starting11.length < 11) {
                team.starting11.push(newPlayer);
            } else {
                team.bench.push(newPlayer);
            }

            this.showToast(`${newPlayer.name} を引き抜きました！`);

        } else if (type === 'relic') {
            team.relics.push(idOrIdx);
            const r = window.MasterData.Relics.find(x => x.id === idOrIdx);
            this.showToast(`宝物「${r.name}」を獲得しました！`);
        }

        window.gameState.pendingVictoryReward = false;
        window.gameState.lastOpponentStarting11 = null;
        this.currentVictoryRewardChoices = null;
        this.showDashboard();
    }

    showDashboard() {
        if (window.gameState.isGameOver) {
            this.showGameOver();
            return;
        }

        this.updateTopBar();
        this.phaserGame.style.display = 'none';
        this.gameContainer.classList.remove('match-mode');

        const opponent = this.getNextOpponent();
        const rank = this.getCurrentRank();
        const targetRank = window.gameState.currentTier === 1 ? 1 : 2;

        let html = `
            <div class="menu-box">
                <h2>監督室 - マネジメント</h2>
                <div style="margin: 20px 0; padding: 15px; background: #34495e; border-radius: 5px;">
                    <h3 style="margin-bottom: 5px;">次戦: ${opponent ? opponent.name : 'シーズン終了'}</h3>
                    <p style="font-size: 18px; color: ${rank > targetRank ? '#e74c3c' : '#2ecc71'};">
                        リーグ順位: ${rank}位 <span style="font-size: 14px; color: #ccc;">(解任ライン: ${targetRank}位以下)</span>
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <button onclick="managementUI.showPreMatch()" style="background-color: #c0392b; border-color: #a93226; font-size: 18px;">試合へ進む</button>
                    <button onclick="managementUI.showEvents()" style="background-color: #2980b9; border-color: #2471a3;">イベント (AP消費)</button>
                    <button onclick="managementUI.showSquad()">編成・戦術</button>
                    <button onclick="managementUI.showStandings()">リーグ順位表</button>
                </div>

                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #555;">
                    <button onclick="managementUI.restTeam()" ${window.gameState.hasRestedThisTurn || window.gameState.ap < 1 ? 'disabled' : ''} style="width: 100%; background: #27ae60;">休養する (AP: 1)</button>
                </div>
            </div>
        `;
        this.uiContent.innerHTML = html;
    }

    restTeam() {
        if (window.gameState.ap >= 1 && !window.gameState.hasRestedThisTurn) {
            window.gameState.ap -= 1;
            window.gameState.hasRestedThisTurn = true;
            window.gameState.playerTeam.players.forEach(p => p.condition = Math.min(100, p.condition + 15));
            this.showToast("選手が休養し、コンディションが回復しました。");
            this.showDashboard();
        }
    }

    showPreMatch() {
        const opponent = this.getNextOpponent();
        if (!opponent) return;

        // Generate random upcoming gimmicks for flavor/mechanics
        const weathers = ['晴れ', '雨 (スリップ増加)', '雪 (スタミナ消費増)'];
        let weather = '晴れ';
        if (window.gameState.upcomingGimmick === 'badWeather') weather = '悪天候 (パス・トラップ精度低下)';
        if (window.gameState.upcomingGimmick === 'fever') weather = '熱狂 (全選手能力微増・スタミナ減)';
        if (window.gameState.upcomingGimmick === 'fortress') weather = '要塞 (アウェー不利)';

        const opponentTactic = opponent.manager ? opponent.manager.preference : 'バランス';

        let html = `
            <div class="menu-box ui-layout-container" style="background: transparent; border: none; padding: 0;">

                <div class="ui-left-panel" style="flex: 1; padding: 20px; border-radius: 8px; background: rgba(40,40,40,0.95); display: flex; flex-direction: column; border-left: 4px solid #e74c3c; overflow-y: auto;">
                    <h2 style="margin-bottom: 20px;">試合前カンファレンス</h2>
                    <h3 style="color: #e74c3c; font-size: 24px; border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 15px; text-align: left;">VS ${opponent.name}</h3>

                    <div style="text-align: left;">
                        <p style="margin-bottom: 10px;"><strong>予想フォーメーション:</strong> ${opponent.formation}</p>
                        <p style="margin-bottom: 10px;"><strong>戦術志向:</strong> ${opponentTactic}</p>
                        <p style="margin-bottom: 10px;"><strong>チーム特性:</strong> ${
                            opponent.specializedConcept === 'HighLine' ? '超ハイライン軍団 (Speed 特化)' :
                            opponent.specializedConcept === 'TargetMan' ? '放り込み軍団 (Physical 特化)' :
                            opponent.specializedConcept === 'LowBlock' ? '堅守速攻 (Defense 特化)' : 'バランス型'
                        }</p>
                        <p style="margin-bottom: 10px; color: #f39c12;"><strong>スタメン平均戦力:</strong> 約${Math.floor(opponent.starting11.reduce((sum, p) => sum + p.stats.pass + p.stats.defense + p.stats.speed, 0) / 11 / 3)}</p>

                        <div style="margin-top: 15px; padding: 10px; border: 1px solid #c0392b; background: rgba(192, 57, 43, 0.2);">
                            <h4 style="color: #e74c3c; margin-bottom: 5px;">⚠️ 要注意選手</h4>
                            ${(() => {
                                const keyPlayer = opponent.starting11.reduce((prev, current) => (prev.getOvr() > current.getOvr()) ? prev : current);
                                return `<p><strong>${keyPlayer.name} (${keyPlayer.position})</strong> - OVR: ${keyPlayer.getOvr()}</p>
                                        <p style="font-size: 12px; color: #ccc;">SPD: ${Math.floor(keyPlayer.stats.speed)} / PHY: ${Math.floor(keyPlayer.stats.physical)} / DEF: ${Math.floor(keyPlayer.stats.defense)}</p>`;
                            })()}
                        </div>

                        <div style="margin-top: 15px; padding: 10px; border: 1px solid #f1c40f; background: rgba(241, 196, 15, 0.2);">
                            <h4 style="color: #f1c40f; margin-bottom: 5px;">敵の所持宝物</h4>
                            <p style="font-size: 12px; color: #eee;">
                                ${opponent.relics.length > 0 ? opponent.relics.map(rId => {
                                    const r = window.MasterData.Relics.find(x => x.id === rId);
                                    return r ? `<span class="relic-badge" data-tooltip="${r.description}">${r.name}</span>` : 'Unknown';
                                }).join(', ') : '特になし'}
                            </p>
                        </div>

                        <div style="margin-top: 20px; background: #222; padding: 15px; border-radius: 5px;">
                            <h4 style="color: #3498db; margin-bottom: 10px;">環境・ギミック予告</h4>
                            <p><strong>天候:</strong> ${weather}</p>
                            <p><strong>審判傾向:</strong> ${Math.random() > 0.5 ? '厳格 (カードが出やすい)' : '寛容 (ラフプレー許容)'}</p>
                            <p style="margin-top: 10px; font-size: 12px; color: #bbb;">※対策となるコマンドや宝物が勝利の鍵となります。</p>
                        </div>
                    </div>
                </div>

                <div class="ui-right-panel" style="flex: 1; display: flex; flex-direction: column; gap: 15px; margin-left: 10px; padding: 0; background: transparent;">
                    <div style="background: rgba(40,40,40,0.95); padding: 15px; border-radius: 8px; text-align: left; flex: 1; overflow-y: auto;">
                        <h3 style="color: #2ecc71; margin-bottom: 10px;">所持マクロ (宝物)</h3>
                        <ul style="list-style: none; padding: 0; font-size: 14px;">
                            ${window.gameState.playerTeam.relics.length === 0 ? '<li style="color: #7f8c8d;">なし</li>' : ''}
                            ${window.gameState.playerTeam.relics.map(rId => {
                                const r = window.MasterData.Relics.find(x => x.id === rId);
                                return `<li style="padding: 5px 0; border-bottom: 1px solid #34495e;">・${r ? `<span class="relic-badge" data-tooltip="${r.description}">${r.name}</span>` : 'Unknown'}</li>`;
                            }).join('')}
                        </ul>
                    </div>

                    <div style="background: rgba(40,40,40,0.95); padding: 15px; border-radius: 8px; text-align: left; flex: 1.5; overflow-y: auto;">
                        <h3 style="color: #f1c40f; margin-bottom: 10px;">セット中ミクロ (戦術コマンド)</h3>
                        <p style="font-size: 12px; color: #ccc; margin-bottom: 10px;">※試合中、手動または自動で発動可能 (最大4つ)</p>
                        <div style="display: flex; flex-direction: column; gap: 8px; flex-wrap: wrap; max-height: 200px; overflow-y: auto;">
                            ${[0, 1, 2, 3].map(i => {
                                const cmdId = window.gameState.playerTeam.microCommands[i];
                                const allCmds = window.MasterData.MicroCommands.filter(c => window.gameState.playerTeam.ownedMicroCommands.includes(c.id));
                                let optionsHtml = `<option value="">未セット</option>`;
                                allCmds.forEach(c => {
                                    const isSelectedElsewhere = window.gameState.playerTeam.microCommands.includes(c.id) && window.gameState.playerTeam.microCommands[i] !== c.id;
                                    if (!isSelectedElsewhere) {
                                        const desc = c.description || (c.type === 'buff' ? `${c.target} ${c.value}UP` : c.actionType);
                                        optionsHtml += `<option value="${c.id}" ${cmdId === c.id ? 'selected' : ''}>${c.name} (CD:${c.cooldown}s) - ${desc}</option>`;
                                    }
                                });
                                return `
                                    <div style="background: #222; padding: 10px; border: 1px solid #555; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                                        <span style="margin-right: 10px;">Slot ${i+1}</span>
                                        <select style="flex: 1; padding: 5px; background: #333; color: white; border: 1px solid #777;"
                                            onchange="managementUI.updateMicroCommand(${i}, this.value, 'prematch')">
                                            ${optionsHtml}
                                        </select>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button style="flex: 1; padding: 15px; font-size: 18px;" onclick="managementUI.showDashboard()">戻る</button>
                        <button style="flex: 2; padding: 15px; font-size: 18px; background: #c0392b; border-color: #a93226;" onclick="managementUI.startMatch()">KICK OFF</button>
                    </div>
                </div>
            </div>
        `;
        this.uiContent.innerHTML = html;
    }

    startMatch() {
        this.uiContent.innerHTML = ''; // clear UI
        this.topBar.style.display = 'none'; // hide topbar in match
        this.gameContainer.classList.add('match-mode');
        this.phaserGame.style.display = 'block';
        window.startGame(); // Trigger global startGame from main.js
    }

    showMatchResult(homeScore, awayScore) {
        this.phaserGame.style.display = 'none';
        this.gameContainer.classList.remove('match-mode');
        this.topBar.style.display = 'flex';

        const isHome = window.gameState.league.schedule[window.gameState.league.currentMatchday - 1].find(m => m.home.isPlayerTeam).home.isPlayerTeam;
        const playerScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;

        let matchFunds = 100000;
        if (playerScore > oppScore) matchFunds += 50000;
        else if (playerScore === oppScore) matchFunds += 20000;

        // Determine injured or exhausted players
        let injuries = [];
        window.gameState.playerTeam.starting11.forEach(p => {
            if (p.condition <= 20) {
                if (Math.random() < 0.3) injuries.push(`${p.name} (軽傷)`);
            }
        });

        let resultText = playerScore > oppScore ? "勝利！" : (playerScore === oppScore ? "引き分け" : "敗北...");
        let color = playerScore > oppScore ? "#27ae60" : (playerScore === oppScore ? "#f39c12" : "#c0392b");

        let html = `
            <div class="menu-box" style="width: 700px;">
                <h2>試合結果</h2>
                <h1 style="color: ${color}; font-size: 40px; margin: 20px 0; text-shadow: 0 0 10px rgba(0,0,0,0.8);">${resultText}</h1>

                <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px; background: #222; padding: 15px; border-radius: 5px; display: inline-block;">
                    ${isHome ? window.gameState.playerTeam.name : '相手チーム'} ${homeScore} - ${awayScore} ${!isHome ? window.gameState.playerTeam.name : '相手チーム'}
                </div>

                <div style="display: flex; gap: 15px; margin-top: 10px;">
                    <div style="flex: 1; background: #34495e; padding: 15px; border-radius: 5px; text-align: left;">
                        <h3 style="color: #f1c40f; margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px;">報酬</h3>
                        <p>・基本給与: ¥100,000</p>
                        ${playerScore > oppScore ? '<p>・勝利ボーナス: ¥50,000</p>' : ''}
                        ${playerScore === oppScore ? '<p>・引分ボーナス: ¥20,000</p>' : ''}
                        <p style="margin-top: 10px; font-weight: bold;">合計獲得資金: <span style="color: #f1c40f;">¥${matchFunds.toLocaleString()}</span></p>
                    </div>

                    <div style="flex: 1; background: #34495e; padding: 15px; border-radius: 5px; text-align: left;">
                        <h3 style="color: #e74c3c; margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px;">メディカルレポート</h3>
                        <p>・全選手の疲労が蓄積しました。</p>
                        ${injuries.length > 0 ? `<p style="color: #e74c3c; font-weight: bold; margin-top: 5px;">【負傷者】<br>${injuries.join('<br>')}</p>` : '<p style="color: #2ecc71; margin-top: 5px;">怪我人はいません。</p>'}
                    </div>
                </div>

                <button onclick="managementUI.processPostMatch(${homeScore}, ${awayScore})" style="margin-top: 30px; width: 100%; padding: 15px; font-size: 18px; background: #2980b9;">順位表を確認する</button>
            </div>
        `;
        this.uiContent.innerHTML = html;
    }

    processPostMatch(homeScore, awayScore) {
        window.gameState.processPostMatch(homeScore, awayScore);

        // Always show standings right after match to see rank changes
        this.showStandings(true);
    }

    // Called after acknowledging the post-match standings
    continueFromPostMatch() {
        if (window.gameState.isGameOver) {
            this.showGameOver();
        } else if (window.gameState.seasonJustEnded) {
            // If season ended but player survived (promoted)
            window.gameState.seasonJustEnded = false;
            let html = `
                <div class="menu-box">
                    <h2 style="font-size: 32px; color: #f1c40f; margin-bottom: 20px;">シーズン終了！</h2>
                    <div style="background: #27ae60; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                        <p style="color: #fff; font-size: 24px; font-weight: bold;">見事昇格圏内に入りました！</p>
                        <p style="color: #fff; margin-top: 10px;">ノルマを達成し、監督の座を死守しました。</p>
                    </div>
                    <p>次のシーズン（第${window.gameState.currentTier}部）へ進みます。準備を整えてください。</p>
                    <button onclick="managementUI.showDashboard()" style="margin-top: 30px; width: 100%; padding: 15px; font-size: 18px;">新シーズンへ</button>
                </div>
            `;
            this.uiContent.innerHTML = html;
        } else {
            if (window.gameState.pendingVictoryReward) {
                this.showVictoryReward();
            } else {
                this.showDashboard();
            }
        }
    }

    getNextOpponent() {
        if (!window.gameState.league) return null;
        const currentMatchday = window.gameState.league.schedule[window.gameState.league.currentMatchday - 1];
        if (!currentMatchday) return null; // Season end

        const playerMatch = currentMatchday.find(m => m.home.isPlayerTeam || m.away.isPlayerTeam);
        if (!playerMatch) return null;

        return playerMatch.home.isPlayerTeam ? playerMatch.away : playerMatch.home;
    }

    getCurrentRank() {
        if (!window.gameState.league) return "-";
        const standings = window.gameState.league.getStandings();
        return standings.findIndex(t => t.isPlayerTeam) + 1;
    }

    showStandings(isPostMatch = false) {
        const standings = window.gameState.league.getStandings();
        const targetRank = window.gameState.currentTier === 1 ? 1 : 2;

        let html = `
            <div class="menu-box" style="width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
                <h2>第${window.gameState.currentTier}部リーグ 順位表</h2>
                <p style="color: #bbb; margin-bottom: 10px;">※上位${targetRank}チームが昇格（ノルマ達成）、それ以外は即時解任。</p>

                <div style="flex: 1; overflow-y: auto; border: 1px solid #555; border-radius: 5px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 14px;">
                        <tr style="background: #222; border-bottom: 2px solid #555; position: sticky; top: 0; z-index: 10;">
                            <th style="padding: 10px;">順位</th>
                            <th style="text-align: left; padding: 10px;">チーム</th>
                            <th>勝点</th><th>勝</th><th>分</th><th>負</th><th>得失差</th>
                        </tr>
        `;

        standings.forEach((team, index) => {
            const isPlayer = team.isPlayerTeam;
            const isTarget = index < targetRank;
            let bgColor = isPlayer ? (isTarget ? '#1e3a29' : '#4a2323') : (index % 2 === 0 ? '#333' : '#3a3a3a');

            // Draw a red line below the target rank
            let borderBottom = (index === targetRank - 1) ? '2px solid #e74c3c' : '1px solid #444';

            html += `
                <tr style="background: ${bgColor}; border-bottom: ${borderBottom}; font-weight: ${isPlayer ? 'bold' : 'normal'};">
                    <td style="padding: 12px; color: ${isTarget ? '#f1c40f' : '#fff'};">${index + 1}</td>
                    <td style="text-align: left; color: ${isPlayer ? '#3498db' : '#fff'};">${team.name}</td>
                    <td style="font-size: 16px;">${team.points}</td>
                    <td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td>
                    <td>${team.goalDifference > 0 ? '+'+team.goalDifference : team.goalDifference}</td>
                </tr>
            `;
        });

        html += `
                    </table>
                </div>

                <button style="margin-top: 20px; width: 100%; padding: 15px; font-size: 18px; background: ${isPostMatch ? '#2980b9' : '#2c3e50'};"
                        onclick="${isPostMatch ? 'managementUI.continueFromPostMatch()' : 'managementUI.showDashboard()'}">
                    ${isPostMatch ? '確認して次へ' : '戻る'}
                </button>
            </div>
        `;

        this.uiContent.innerHTML = html;
    }

    showSquad() {
        const team = window.gameState.playerTeam;
        window.ChemistrySystem.calculateTeamChemistry(team); // Ensure chemistry is calculated

        let html = `
            <div class="menu-box ui-layout-container" style="background: transparent; border: none; padding: 0;">
                <div class="ui-left-panel" style="flex: 2; padding: 20px; border-radius: 8px; background: rgba(40,40,40,0.95); display: flex; flex-direction: column; gap: 15px;">
                    <h2>編成・ケミストリー</h2>

                    <div style="text-align: left; display: flex; justify-content: space-between; align-items: center;">
                        <label>フォーメーション:
                            <select onchange="managementUI.changeFormation(this.value)" style="background: #333; color: white; padding: 5px; font-size: 16px;">
                                ${team.manager.formations.map(f => `<option value="${f}" ${f === team.formation ? 'selected' : ''}>${f}</option>`).join('')}
                            </select>
                        </label>
                        <span style="font-size: 14px; color: #bbb;">※選手をタップして入れ替え</span>
                    </div>

                    <div style="flex: 1; background: #1e3a29; border: 2px solid #27ae60; position: relative; border-radius: 5px; overflow: hidden; min-height: 300px;" id="pitch-area">
                        <!-- Links canvas -->
                        <canvas id="chem-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>

                        <div style="position:absolute; top: 10px; width: 100%; text-align: center; color: rgba(255,255,255,0.5); font-weight: bold; font-size: 14px; pointer-events: none; z-index: 1;">▲ ATTACK (FW)</div>
                        <div style="position:absolute; bottom: 10px; width: 100%; text-align: center; color: rgba(255,255,255,0.5); font-weight: bold; font-size: 14px; pointer-events: none; z-index: 1;">▼ DEFENSE (GK)</div>

                        <div id="formation-container" style="position: relative; width: 100%; height: 100%;">
                            <!-- Players injected here by JS -->
                        </div>
                    </div>
                    <div style="font-size: 11px; text-align: center; color: #ccc;">
                        【戦術志向】 <span style="color: #3498db;">■ポゼッション</span> <span style="color: #e74c3c;">■カウンター</span> <span style="color: #f1c40f;">■ハイプレス</span> <span style="color: #2ecc71;">■リトリート</span>
                    </div>
                </div>

                <div class="ui-middle-panel" style="flex: 1; gap: 10px; border-radius: 8px; margin-left: 10px;">
                    <h3 style="background: #2c3e50; padding: 8px; border-radius: 4px;">ベンチ</h3>
                    <div id="bench-container" style="display: flex; flex-direction: column; gap: 5px; overflow-y: auto; flex: 1;">
                        <!-- Bench players injected here -->
                    </div>
                </div>

                <div class="ui-right-panel" id="player-detail-panel" style="flex: 1.5; gap: 10px; border-radius: 8px; margin-left: 10px; display: flex; flex-direction: column;">
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #aaa;">
                        選手を選択すると詳細が表示されます
                    </div>
                    <button style="margin-top: 15px; width: 100%; padding: 12px; background: #27ae60;" onclick="managementUI.showDashboard()">戻る (編成確定)</button>
                </div>
            </div>
        `;

        this.uiContent.innerHTML = html;
        this.selectedPlayerIndex = null;
        this.swapSourceIndex = null; // explicitly track swap mode
        this.renderFormation();
    }

    renderPlayerDetailCard(player, index) {
        const detailPanel = document.getElementById('player-detail-panel');
        if (!detailPanel) return;
        if (!player) {
            detailPanel.innerHTML = `
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #aaa;">
                    選手を選択すると詳細が表示されます
                </div>
                <button style="margin-top: 15px; width: 100%; padding: 12px; background: #27ae60;" onclick="managementUI.showDashboard()">戻る (編成確定)</button>
            `;
            return;
        }

        // Color mapping for rarity
        const rarityColors = {
            'N': '#7f8c8d', // Gray
            'R': '#3498db', // Blue
            'SR': '#9b59b6', // Purple
            'SSR': '#f1c40f' // Gold
        };
        const rarityColor = rarityColors[player.rarity] || rarityColors['N'];
        const isMax = player.level >= 10;

        const statBarsHtml = Object.entries(player.stats).map(([key, val]) => {
            let color = '#e74c3c'; // red
            if(val >= 80) color = '#f1c40f'; // gold
            else if(val >= 60) color = '#2ecc71'; // green
            else if(val >= 40) color = '#3498db'; // blue

            const label = {pass: 'Pass', shoot: 'Shoot', defense: 'Defense', physical: 'Physical', speed: 'Speed', mental: 'Mental', stamina: 'Stamina'}[key];
            return `
                <div style="display: flex; align-items: center; font-size: 12px; margin-bottom: 3px;">
                    <span style="width: 55px;">${label}</span>
                    <div style="flex: 1; background: #333; height: 10px; border-radius: 5px; margin: 0 5px; overflow: hidden;">
                        <div style="width: ${val}%; background: ${color}; height: 100%;"></div>
                    </div>
                    <span style="width: 20px; text-align: right;">${val}</span>
                </div>
            `;
        }).join('');

        const skillsHtml = player.skills.length > 0 ? player.skills.map(sId => {
            const s = window.MasterData.PlayerSkills.find(sk => sk.id === sId);
            if (!s) return '';
            return `<div style="background: #2c3e50; padding: 4px; margin-bottom: 2px; border-radius: 4px; font-size: 11px;">
                <strong>${s.name}</strong> - ${s.description || '効果なし'}
            </div>`;
        }).join('') : '<div style="font-size: 12px; color: #777;">なし</div>';

        const expPercent = isMax ? 100 : (player.exp / player.maxExp) * 100;

        const roleMap = {
            'Classic': 'クラシック', 'Inverted': 'インバーテッド', 'Poacher': 'ポーチャー',
            'Ball-Playing': 'ボールプレイング', 'Stopper': 'ストッパー', 'Covering': 'カバーリング',
            'Defensive': 'ディフェンシブ', 'Attacking': 'アタッキング', 'Wing-Back': 'ウイングバック',
            'Anchor': 'アンカー', 'Destroyer': 'デストロイヤー', 'Deep-Lying': 'ディープライイング',
            'Box-to-Box': 'BtoB', 'Advanced-Playmaker': 'アドバンスドPM', 'Ball-Winning': 'ボールウィニング',
            'Shadow-Striker': 'シャドーストライカー', 'Enganche': 'エンガンチェ', 'Dynamo': 'ダイナモ',
            'Classic-Winger': 'ウインガー', 'Crosser': 'クロサー', 'Inside-Forward': 'インサイドFW',
            'Wide-Playmaker': 'ワイドPM', 'Wide-Target-Man': 'ワイドターゲット', 'Hard-Worker': 'ハードワーカー',
            'Target-Man': 'ターゲットマン', 'False-9': 'フォルス9', 'Complete': 'コンプリートFW'
        };
        const roleJp = player.role ? (roleMap[player.role] || player.role) : 'なし';

        const career = player.careerStats || { appearances: 0, goals: 0, assists: 0, avgRating: 0.0 };


        let comparisonHtml = '';
        if (this.swapSourceIndex !== null && this.swapSourceIndex !== index) {
            const team = window.gameState.playerTeam;
            const srcPlayer = this.swapSourceIndex < 11 ? team.starting11[this.swapSourceIndex] : team.bench[this.swapSourceIndex - 11];

            const srcStatBarsHtml = Object.entries(srcPlayer.stats).map(([key, val]) => {
                let color = '#e74c3c';
                if(val >= 80) color = '#f1c40f';
                else if(val >= 60) color = '#2ecc71';
                else if(val >= 40) color = '#3498db';

                const label = {pass: 'Pass', shoot: 'Shoot', defense: 'Defense', physical: 'Physical', speed: 'Speed', mental: 'Mental', stamina: 'Stamina'}[key];
                return `
                    <div style="display: flex; align-items: center; font-size: 9px; margin-bottom: 2px;">
                        <span style="width: 45px;">${label}</span>
                        <div style="flex: 1; background: #333; height: 6px; border-radius: 3px; margin: 0 4px; overflow: hidden;">
                            <div style="width: ${val}%; background: ${color}; height: 100%;"></div>
                        </div>
                        <span style="width: 15px; text-align: right;">${val}</span>
                    </div>
                `;
            }).join('');

            const srcSkillsHtml = srcPlayer.skills.length > 0 ? srcPlayer.skills.map(sId => {
                const s = window.MasterData.PlayerSkills.find(sk => sk.id === sId);
                if (!s) return '';
                return `<span style="background: #2c3e50; padding: 2px 4px; margin: 1px; border-radius: 3px; font-size: 9px; display: inline-block;">${s.name}</span>`;
            }).join('') : '<span style="font-size: 9px; color: #777;">なし</span>';

            comparisonHtml = `
            <div style="background: #111; border: 2px dashed #e74c3c; border-radius: 8px; padding: 10px; flex: 1; display: flex; flex-direction: column; text-align: left; overflow-y: auto; margin-top: 10px;">
                <h4 style="color: #e74c3c; margin-bottom: 5px; font-size: 12px;">入れ替え元: ${srcPlayer.name}</h4>
                <div style="font-size: 14px; font-weight: bold; color: #f1c40f; margin-bottom: 5px;">OVR ${srcPlayer.getOvr()} <span style="font-size: 10px; color: #aaa;">[${srcPlayer.preference}]</span></div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc; margin-bottom: 5px;">
                    <div><strong>主:</strong> ${srcPlayer.position}</div>
                    <div><strong>副:</strong> ${srcPlayer.subPositions && srcPlayer.subPositions.length > 0 ? srcPlayer.subPositions.join(', ') : 'なし'}</div>
                </div>
                <div style="margin-bottom: 5px;">
                    <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 2px; font-size: 10px; color: #aaa;">ステータス</h4>
                    ${srcStatBarsHtml}
                </div>
                <div>
                    <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 2px; font-size: 10px; color: #aaa;">スキル</h4>
                    <div>${srcSkillsHtml}</div>
                </div>
            </div>`;
        }

        detailPanel.innerHTML = `
            <button onclick="managementUI.toggleSwapMode(${index})" style="margin-bottom: 5px; width: 100%; padding: 6px; font-size: 12px; background: ${this.swapSourceIndex === index ? '#c0392b' : '#2980b9'}; border: 1px solid #fff; border-radius: 4px; cursor: pointer; color: white;">
                ${this.swapSourceIndex === index ? '取消' : '🔄 この選手を入れ替え対象にする'}
            </button>
            <div style="background: #222; border: 2px solid ${rarityColor}; border-radius: 8px; padding: 10px; flex: 1; display: flex; flex-direction: column; text-align: left; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #555; padding-bottom: 5px; margin-bottom: 5px;">
                    <div>
                        <span style="background: ${rarityColor}; color: ${player.rarity === 'SSR' ? '#000' : '#fff'}; padding: 2px 4px; border-radius: 4px; font-weight: bold; font-size: 10px;">${player.rarity}</span>
                        <span style="font-size: 12px; margin-left: 5px;">${player.nationality || ''}</span>
                        <h3 style="margin-top: 2px; font-size: 14px;">${player.name}</h3>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 16px; font-weight: bold; color: #f1c40f;">OVR ${player.getOvr()}</div>
                        <div style="font-size: 10px;">${isMax ? 'Lv.MAX' : 'Lv.'+player.level} <span style="color:#aaa;">[${player.preference}]</span></div>
                    </div>
                </div>

                <div style="margin-bottom: 5px;">
                    <div style="font-size: 9px; margin-bottom: 2px;">EXP ${isMax ? 'MAX' : player.exp + ' / ' + player.maxExp}</div>
                    <div style="width: 100%; background: #333; height: 4px; border-radius: 2px; overflow: hidden;">
                        <div style="width: ${expPercent}%; background: #9b59b6; height: 100%;"></div>
                    </div>
                </div>

                <div style="margin-bottom: 5px;">
                    <div style="font-size: 10px; margin-bottom: 2px; display: flex; justify-content: space-between;">
                        <span>体力</span><span>${player.condition}%</span>
                    </div>
                    <div style="width: 100%; background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${player.condition}%; background: ${player.condition > 50 ? '#2ecc71' : '#e74c3c'}; height: 100%;"></div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #ccc; margin-bottom: 5px;">
                    <div><strong>主適性:</strong> ${player.position}</div>
                    <div><strong>副適性:</strong> ${player.subPositions && player.subPositions.length > 0 ? player.subPositions.join(', ') : 'なし'}</div>
                </div>

                <div style="margin-bottom: 5px; font-size: 11px;">
                    <span style="color: #bbb;">役割(ロール):</span> ${roleJp}
                </div>

                <div style="margin-bottom: 5px; font-size: 11px; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px;">
                    <span style="color: #f39c12;">通算成績:</span> 出場 ${career.appearances} / G ${career.goals} / A ${career.assists} / 評 ${career.avgRating.toFixed(2)}
                </div>
                <div style="margin-bottom: 5px;">
                    <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 2px; font-size: 11px;">ステータス</h4>
                    ${statBarsHtml}
                </div>

                <div>
                    <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 2px; font-size: 11px;">スキル</h4>
                    ${skillsHtml}
                </div>
            </div>
            ${comparisonHtml}
            <button style="margin-top: 15px; width: 100%; padding: 12px; background: #27ae60;" onclick="managementUI.showDashboard()">戻る (編成確定)</button>
        `;
    }

    renderFormation() {
        const team = window.gameState.playerTeam;
        const container = document.getElementById('formation-container');
        const rarityColors = {'N': '#7f8c8d', 'R': '#3498db', 'SR': '#9b59b6', 'SSR': '#f1c40f'};
        const benchContainer = document.getElementById('bench-container');
        const canvas = document.getElementById('chem-canvas');

        if(!container || !benchContainer || !canvas) return;

        // Draw players on pitch
        // Basic mapping for visual representation (normalized 0-1 coords)
        const posMap = this.getFormationPositions(team.formation);
        const expectedPositions = window.MasterData.Formations[team.formation]?.slots || [];
        container.innerHTML = '';

        team.starting11.forEach((p, idx) => {
            const pos = posMap[idx] || {x: 0.5, y: 0.5};
            const left = pos.x * 100;
            const top = pos.y * 100;
            const isSelected = this.selectedPlayerIndex === idx;

            const expectedPos = expectedPositions[idx]?.expectedPosStr;
            const isSubPos = p.position !== expectedPos && p.subPositions && p.subPositions.includes(expectedPos);
            const isMob = p.position !== expectedPos && !isSubPos;

            const pDiv = document.createElement('div');
            pDiv.className = 'pitch-player';
            pDiv.style = `
                position: absolute; left: ${left}%; top: ${top}%;
                transform: translate(-50%, -50%);
                width: 45px; height: 50px;
                background: ${isMob ? '#7f8c8d' : (isSelected ? '#f39c12' : '#34495e')};
                border: 2px solid ${p.preference === 'Possession' ? '#3498db' : (p.preference === 'Counter' ? '#e74c3c' : (p.preference === 'HighPress' ? '#f1c40f' : '#2ecc71'))};
                border-radius: 5px; color: ${isSubPos ? '#76d7c4' : 'white'};
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-size: 10px; cursor: pointer; user-select: none;
                z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                ${isMob ? 'opacity: 0.8;' : ''}
            `;

            let roleText = p.role || '';
            if (isMob) {
                roleText = '汎用(モブ)';
            }

            const newBadge = p.isNew ? `<span style="position:absolute; top:-5px; right:-5px; background:red; color:white; font-size:8px; padding:1px 2px; border-radius:3px; font-weight:bold; z-index:3;">NEW!</span>` : '';

            pDiv.innerHTML = `
                ${newBadge}
                <span style="font-weight: bold;">${isMob ? '⚠️ ' : ''}${p.position}${isSubPos ? '*' : ''}</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40px;">${p.name.substring(0,4)}</span>
                <span style="font-size: 8px; color: #f1c40f;">OVR: ${p.getOvr()}</span>
                <span style="font-size: 8px;">${p.level>=10?'Lv.MAX':'Lv.'+p.level}</span>
                <div style="width: 80%; height: 3px; background: #555; margin-top: 2px; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${p.condition ?? 100}%; height: 100%; background: ${p.condition > 50 ? '#2ecc71' : (p.condition > 20 ? '#f1c40f' : '#e74c3c')};"></div>
                </div>
            `;
            pDiv.onclick = () => this.handlePlayerClick(idx, true);
            container.appendChild(pDiv);
        });

        // Draw Bench
        benchContainer.innerHTML = '';
        team.bench.forEach((p, idx) => {
            const bIdx = idx + 11;
            const isSelected = this.selectedPlayerIndex === bIdx;

            const bDiv = document.createElement('div');
            bDiv.style = `
                background: ${isSelected ? '#f39c12' : '#333'};
                border: 1px solid #555; padding: 8px; font-size: 12px;
                cursor: pointer; display: flex; justify-content: space-between; position: relative;
                border-left: 4px solid ${p.preference === 'Possession' ? '#3498db' : (p.preference === 'Counter' ? '#e74c3c' : (p.preference === 'HighPress' ? '#f1c40f' : '#2ecc71'))};
            `;
            const newBadge = p.isNew ? `<span style="background:red; color:white; font-size:8px; padding:1px 2px; border-radius:3px; font-weight:bold; margin-right:5px;">NEW!</span>` : '';
            bDiv.innerHTML = `<span>${newBadge}<span style="font-size: 10px; font-weight: bold; background: ${rarityColors[p.rarity] || '#7f8c8d'}; color: ${p.rarity === 'SSR' ? '#000' : '#fff'}; padding: 1px 3px; border-radius: 2px; margin-right: 4px;">${p.rarity}</span>[${p.position}] ${p.name} (${p.level>=10?'MAX':'Lv.'+p.level})</span> <span>OVR:${p.getOvr()}</span>`;
            bDiv.style.border = `1px solid ${rarityColors[p.rarity] || '#555'}`;
            bDiv.onclick = () => this.handlePlayerClick(bIdx, false);
            benchContainer.appendChild(bDiv);
        });

        this.drawChemistryLinks(canvas, posMap, team);
    }

    getFormationPositions(formation) {
        const formationsCoords = {
            "4-4-2": [
                {x: 0.5, y: 0.05},
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
                {x: 0.35, y: 0.55}, {x: 0.65, y: 0.55}, {x: 0.15, y: 0.65}, {x: 0.85, y: 0.65},
                {x: 0.35, y: 0.85}, {x: 0.65, y: 0.85}
            ],
            "4-3-3": [
                {x: 0.5, y: 0.05},
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
                {x: 0.5, y: 0.45}, {x: 0.3, y: 0.6}, {x: 0.7, y: 0.6},
                {x: 0.15, y: 0.85}, {x: 0.85, y: 0.85}, {x: 0.5, y: 0.9}
            ],
            "3-2-4-1": [
                {x: 0.5, y: 0.05},
                {x: 0.3, y: 0.25}, {x: 0.5, y: 0.25}, {x: 0.7, y: 0.25},
                {x: 0.35, y: 0.45}, {x: 0.65, y: 0.45},
                {x: 0.35, y: 0.65}, {x: 0.65, y: 0.65}, {x: 0.15, y: 0.65}, {x: 0.85, y: 0.65},
                {x: 0.5, y: 0.9}
            ],
            "4-1-4-1": [
                {x: 0.5, y: 0.05},
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
                {x: 0.5, y: 0.45},
                {x: 0.35, y: 0.65}, {x: 0.65, y: 0.65}, {x: 0.15, y: 0.65}, {x: 0.85, y: 0.65},
                {x: 0.5, y: 0.9}
            ],
            "4-2-3-1": [
                {x: 0.5, y: 0.05},
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
                {x: 0.35, y: 0.45}, {x: 0.65, y: 0.45},
                {x: 0.5, y: 0.7}, {x: 0.15, y: 0.7}, {x: 0.85, y: 0.7},
                {x: 0.5, y: 0.9}
            ],
            "5-3-2": [
                {x: 0.5, y: 0.05},
                {x: 0.35, y: 0.25}, {x: 0.5, y: 0.2}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.3}, {x: 0.85, y: 0.3},
                {x: 0.35, y: 0.55}, {x: 0.5, y: 0.5}, {x: 0.65, y: 0.55},
                {x: 0.35, y: 0.85}, {x: 0.65, y: 0.85}
            ],
            "4-3-1-2": [
                {x: 0.5, y: 0.05},
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
                {x: 0.35, y: 0.5}, {x: 0.5, y: 0.45}, {x: 0.65, y: 0.5},
                {x: 0.5, y: 0.7},
                {x: 0.35, y: 0.85}, {x: 0.65, y: 0.85}
            ],
            "3-5-2": [
                {x: 0.5, y: 0.05},
                {x: 0.3, y: 0.25}, {x: 0.5, y: 0.2}, {x: 0.7, y: 0.25},
                {x: 0.5, y: 0.45}, {x: 0.35, y: 0.6}, {x: 0.65, y: 0.6}, {x: 0.15, y: 0.55}, {x: 0.85, y: 0.55},
                {x: 0.35, y: 0.85}, {x: 0.65, y: 0.85}
            ]
        };

        let coords = formationsCoords[formation] || formationsCoords["4-4-2"];
        return coords.map(c => ({ x: c.x, y: 1.0 - c.y }));
    }

    drawChemistryLinks(canvas, posMap, team) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Pitch Matrix (5 lanes x 3 thirds)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // 5 Lanes (vertical lines)
        for (let i = 1; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(canvas.width * (i / 5), 0);
            ctx.lineTo(canvas.width * (i / 5), canvas.height);
            ctx.stroke();
        }

        // 3 Thirds (horizontal lines)
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height * (i / 3));
            ctx.lineTo(canvas.width, canvas.height * (i / 3));
            ctx.stroke();
        }

        // Highlight areas based on tactics
        const tactic = team.manager ? team.manager.preference : null;
        if (tactic === 'Possession') {
            // Highlight center lanes (lane 2, 3, 4)
            ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
            ctx.fillRect(canvas.width * 0.2, 0, canvas.width * 0.6, canvas.height);
        } else if (tactic === 'HighPress') {
            // Highlight attacking third
            ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
            ctx.fillRect(0, canvas.height * 0.66, canvas.width, canvas.height * 0.34);
        } else if (tactic === 'Retreat') {
            // Highlight defensive third
            ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.33);
        } else if (tactic === 'Counter') {
             // Highlight outside lanes in attacking half
             ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
             ctx.fillRect(0, canvas.height * 0.5, canvas.width * 0.2, canvas.height * 0.5);
             ctx.fillRect(canvas.width * 0.8, canvas.height * 0.5, canvas.width * 0.2, canvas.height * 0.5);
        }

        const links = window.ChemistrySystem.getFormationLinks(team.formation);

        links.forEach(({from, to}) => {
            const expectedPositions = window.MasterData.Formations[team.formation]?.slots || [];
            const idx1 = expectedPositions.findIndex(s => s.id === from);
            const idx2 = expectedPositions.findIndex(s => s.id === to);

            if (idx1 === -1 || idx2 === -1) return;
            if (idx1 >= 11 || idx2 >= 11) return;
            const p1 = team.starting11[idx1];
            const p2 = team.starting11[idx2];
            const pos1 = posMap[idx1];
            const pos2 = posMap[idx2];

            if(!pos1 || !pos2) return;

            const x1 = pos1.x * canvas.width;
            const y1 = pos1.y * canvas.height;
            const x2 = pos2.x * canvas.width;
            const y2 = pos2.y * canvas.height;

            const isMatch = p1.preference === p2.preference;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = isMatch ? 3 : 1;
            ctx.strokeStyle = isMatch ? '#f1c40f' : 'rgba(255, 255, 255, 0.2)';
            ctx.setLineDash(isMatch ? [] : [5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    handlePlayerClick(index, isStarter) {
        const team = window.gameState.playerTeam;
        const player = index < 11 ? team.starting11[index] : team.bench[index - 11];

        if (player && player.isNew) {
            player.isNew = false;
        }

        if (this.swapSourceIndex !== null) {
            // We are in swap mode
            const idx1 = this.swapSourceIndex;
            const idx2 = index;

            if (idx1 !== idx2) {
                const p1 = idx1 < 11 ? team.starting11[idx1] : team.bench[idx1 - 11];
                const p2 = idx2 < 11 ? team.starting11[idx2] : team.bench[idx2 - 11];

                if (idx1 < 11) team.starting11[idx1] = p2;
                else team.bench[idx1 - 11] = p2;

                if (idx2 < 11) team.starting11[idx2] = p1;
                else team.bench[idx2 - 11] = p1;

                window.ChemistrySystem.calculateTeamChemistry(team);

                // Exit swap mode
                this.swapSourceIndex = null;
                this.selectedPlayerIndex = index; // Keep selection on the newly clicked player position
                this.renderFormation();
                this.renderPlayerDetailCard(p1, index); // p1 is the player that moved to this slot
            } else {
                // Exit swap mode
                this.swapSourceIndex = null;
                this.selectedPlayerIndex = index;
                this.renderFormation();
                this.renderPlayerDetailCard(player, index);
            }
        } else {
            // Just view player
            this.selectedPlayerIndex = index;
            this.renderFormation();
            this.renderPlayerDetailCard(player, index);
        }
    }

    toggleSwapMode(index) {
        if (this.swapSourceIndex === index) {
            this.swapSourceIndex = null; // cancel swap mode
        } else {
            this.swapSourceIndex = index;
        }
        this.renderFormation();

        const team = window.gameState.playerTeam;
        const player = index < 11 ? team.starting11[index] : team.bench[index - 11];
        this.renderPlayerDetailCard(player, index);
    }

    changeFormation(newForm) {
        window.gameState.playerTeam.formation = newForm;
        window.ChemistrySystem.calculateTeamChemistry(window.gameState.playerTeam);
        this.selectedPlayerIndex = null;
        this.renderFormation();
    }

    showEvents() {
        if (!window.gameState.eventsGeneratedForTurn) {
            this.generateEvents();
            window.gameState.eventsGeneratedForTurn = true;
        }

        const events = window.gameState.currentEvents || [];
        this.selectedEventId = null;

        let html = `
            <div class="menu-box ui-layout-container" style="background: transparent; border: none; padding: 0;">

                <div class="ui-left-panel" style="flex: 2; padding: 20px; border-radius: 8px; background: rgba(40,40,40,0.95); display: flex; flex-direction: column;">
                    <h2>イベント選択 (AP: ${window.gameState.ap})</h2>
                    <p style="font-size: 14px; margin-bottom: 15px;">実行したいイベントをタップし、内容を確認して確定してください。</p>

                    <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 10px; overflow-y: auto;">
                        ${events.map(e => {
                            let borderColor = '#555';
                            if(e.type === 'scout') borderColor = '#27ae60';
                            if(e.type === 'relic') borderColor = '#f39c12';
                            if(e.type === 'training') borderColor = '#3498db';
                            if(e.type === 'command') borderColor = '#9b59b6';
                            if(e.type === 'mystery') borderColor = '#95a5a6';

                            return `
                                <div id="card_${e.id}" class="event-card" onclick="managementUI.selectEvent('${e.id}')"
                                     style="background: #333; border: 2px solid ${borderColor}; border-radius: 8px; padding: 15px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;">
                                    <h3 style="font-size: 16px; margin-bottom: 5px;">${e.title}</h3>
                                    <div style="font-size: 12px; color: #bbb;">${e.flavorText}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="ui-right-panel" style="flex: 1; display: flex; flex-direction: column; margin-left: 10px; padding: 0; background: transparent;">
                    <div id="event-detail-panel" style="flex: 1; background: #2c3e50; border: 2px solid #34495e; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; text-align: left; overflow-y: auto;">
                        <p style="color: #bbb; text-align: center; margin-top: 50px;">イベントを選択してください</p>
                    </div>

                    <button style="margin-top: 15px; width: 100%; padding: 15px; font-size: 16px; background: #c0392b;" onclick="managementUI.showDashboard()">戻る (マネジメント完了)</button>
                </div>
            </div>
        `;
        this.uiContent.innerHTML = html;
    }

    selectEvent(eventId) {
        this.selectedEventId = eventId;
        const e = window.gameState.currentEvents.find(ev => ev.id === eventId);
        if (!e) return;

        // Highlight selected card
        document.querySelectorAll('.event-card').forEach(c => c.style.boxShadow = 'none');
        document.getElementById(`card_${eventId}`).style.boxShadow = '0 0 15px #f1c40f';

        const detailPanel = document.getElementById('event-detail-panel');
        const team = window.gameState.playerTeam;

        let detailHtml = `
            <h3 style="margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px; text-align: center;">${e.title}</h3>
            <p style="font-size: 13px; color: #ddd; margin-bottom: 15px; font-style: italic;">${e.flavorText}</p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
        `;

        e.choices.forEach((choice, idx) => {
            const canAffordFunds = window.gameState.funds >= choice.fundCost;
            const canAffordAP = window.gameState.ap >= 1; // Assuming 1 AP per event for now
            const canAfford = canAffordFunds && canAffordAP;

            let extraUI = '';
            if (choice.candidates) {
                extraUI += `<div style="margin-top: 10px; font-size: 13px; font-weight: bold; color: #2ecc71;">獲得する候補を選択:</div>`;
                choice.candidates.forEach((cand, candIdx) => {
                    const skillsStr = cand.skills.map(sid => window.MasterData.PlayerSkills.find(s=>s.id===sid)?.name).filter(Boolean).join(', ') || 'なし';
                    extraUI += `
                        <div style="background: #333; padding: 8px; margin-top: 5px; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                            <input type="radio" name="draft_select_${eventId}_${idx}" value="${candIdx}" id="cand_${eventId}_${idx}_${candIdx}" ${candIdx === 0 ? 'checked' : ''}>
                            <label for="cand_${eventId}_${idx}_${candIdx}" style="cursor: pointer; font-size: 12px; display: inline-block;">
                                <strong>[${cand.position}${cand.subPositions.length>0?'/'+cand.subPositions.join(','):''}] [${cand.rarity}] ${cand.name} (Lv.${cand.level} / OVR: ${cand.getOvr()})</strong> <br>
                                <span style="color: #bbb;">スキル: ${skillsStr}</span>
                            </label>
                        </div>
                    `;
                });
            }

            if (choice.tradeCount > 0) {
                extraUI += `<div style="margin-top: 5px; font-size: 12px; color: #e74c3c;">放出対象を選択 (${choice.tradeCount}人):</div>`;
                for (let tc = 0; tc < choice.tradeCount; tc++) {
                    extraUI += `<select id="trade_select_${eventId}_${idx}_${tc}" style="width: 100%; margin-top: 3px; background: #222; color: #fff; padding: 3px; border: 1px solid #555;">`;
                    // Generate options prioritizing bench
                    let optionIndex = 0;
                    team.bench.forEach(p => {
                        extraUI += `<option value="${p.id}" ${optionIndex === tc ? 'selected' : ''}>[ベンチ] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`;
                        optionIndex++;
                    });
                    team.starting11.forEach(p => {
                        extraUI += `<option value="${p.id}" ${optionIndex === tc ? 'selected' : ''}>[スタメン] [${p.rarity}] [${p.position}] ${p.name} (Lv.${p.level} / OVR: ${p.getOvr()})</option>`;
                        optionIndex++;
                    });
                    extraUI += `</select>`;
                }
            } else if (choice.action === 'awaken') {
                extraUI += `<div style="margin-top: 5px; font-size: 12px; color: #3498db;">覚醒対象を選択:</div>`;
                extraUI += `<select id="awaken_select_${eventId}_${idx}" style="width: 100%; margin-top: 3px; background: #222; color: #fff; padding: 3px; border: 1px solid #555;">`;
                team.starting11.forEach(p => { extraUI += `<option value="${p.id}">[${p.position}] ${p.name} (Lv.${p.level})</option>`; });
                team.bench.forEach(p => { extraUI += `<option value="${p.id}">ベンチ: [${p.position}] ${p.name} (Lv.${p.level})</option>`; });
                extraUI += `</select>`;
            } else if (choice.action === 'teach_skill') {
                extraUI += `<div style="margin-top: 5px; font-size: 12px; color: #3498db;">伝授する選手を選択:</div>`;
                extraUI += `<select id="teach_select_${eventId}_${idx}" style="width: 100%; margin-top: 3px; background: #222; color: #fff; padding: 3px; border: 1px solid #555;">`;

                const validTargets = team.players.filter(p => p.skills.length < 3 && choice.skill.allowedPositions.includes(p.position) && !p.skills.includes(choice.skill.id));
                if (validTargets.length === 0) {
                    extraUI += `<option value="">対象選手がいません</option>`;
                } else {
                    validTargets.forEach(p => { extraUI += `<option value="${p.id}">[${p.position}] ${p.name} (Lv.${p.level})</option>`; });
                }
                extraUI += `</select>`;
            } else if (choice.action === 'mad_science') {
                extraUI += `<div style="margin-top: 5px; font-size: 12px; color: #3498db;">手術対象を選択:</div>`;
                extraUI += `<select id="mad_select_${eventId}_${idx}" style="width: 100%; margin-top: 3px; background: #222; color: #fff; padding: 3px; border: 1px solid #555;">`;
                team.starting11.forEach(p => { extraUI += `<option value="${p.id}">[${p.position}] ${p.name} (Lv.${p.level})</option>`; });
                team.bench.forEach(p => { extraUI += `<option value="${p.id}">ベンチ: [${p.position}] ${p.name} (Lv.${p.level})</option>`; });
                extraUI += `</select>`;
            }

            detailHtml += `
                <div style="background: #1a252f; border: 1px solid ${canAfford ? '#3498db' : '#555'}; padding: 10px; border-radius: 5px;">
                    <div style="font-size: 13px; margin-bottom: 5px; line-height: 1.4;">${choice.desc}</div>
                    ${extraUI}
                    <button onclick="managementUI.executeEvent('${e.id}', ${idx})"
                            ${!canAfford ? 'disabled' : ''}
                            style="margin-top: 10px; width: 100%; padding: 8px; font-size: 14px; background: ${canAfford ? '#2980b9' : '#555'};">
                        実行 (AP: 1)
                    </button>
                </div>
            `;
        });

        detailHtml += `</div>`;
        detailPanel.innerHTML = detailHtml;
    }

    generateEvents() {
        const events = [];
        const baseTypes = ['command', 'scout', 'training', 'relic', 'mystery'];
        window.gameState.turnRelicPool = null;

        // Randomly determine number of events: 4 to 7
        const numEvents = Math.floor(Math.random() * 4) + 4;

        // Count how many of each type we've added to enforce max 2 per category
        const typeCounts = {
            command: 0, scout: 0, training: 0, relic: 0, mystery: 0
        };

        const tier = window.gameState.currentTier;
        const matchday = window.gameState.league ? window.gameState.league.currentMatchday : 1;
        const costMultiplier = (4 - tier) + (matchday * 0.1);
        const currentSquadSize = window.gameState.playerTeam.players.length;

        // Guarantee at least one of each main type
        const guaranteedTypes = ['scout', 'training', 'relic', 'command'];
        const numEventsToGenerate = Math.max(numEvents, 4);

        for (let i = 0; i < numEventsToGenerate; i++) {
            let type;
            if (i < 4) {
                type = guaranteedTypes[i];
            } else {
                let availableTypes = baseTypes.filter(t => typeCounts[t] < 2);
                if (availableTypes.length === 0) availableTypes = ['mystery'];
                type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            }
            typeCounts[type]++;

            let eventObj = {
                id: `evt_${Date.now()}_${i}`,
                type: type,
                choices: []
            };

            if (type === 'scout') {
                eventObj.title = 'スカウトからの提案';
                eventObj.flavorText = '「監督、有望な選手を見つけました。チームの補強にいかがですか？」';

                // Draft options creation
                const generateDraftChoice = (costBase, tradeCount, rarity) => {
                    const cost = Math.floor(costBase * costMultiplier);
                    const candidates = [
                        window.Player.generateRandom("draft_0", null, rarity),
                        window.Player.generateRandom("draft_1", null, rarity),
                        window.Player.generateRandom("draft_2", null, rarity)
                    ];
                    let descStr = tradeCount > 0 ? `資金¥${cost.toLocaleString()} ＋ 選手${tradeCount}人放出` : `資金¥${cost.toLocaleString()}`;
                    descStr += `で ${rarity}候補から1人獲得`;

                    eventObj.choices.push({
                        desc: descStr,
                        fundCost: cost,
                        tradeCount: tradeCount,
                        rewardRarity: rarity,
                        candidates: candidates
                    });
                };

                // Choice 1: Standard
                if (currentSquadSize >= 18) {
                    generateDraftChoice(100000, 1, 'N');
                } else {
                    generateDraftChoice(100000, 0, 'N');
                }

                // Choice 2: Trade 1
                if (currentSquadSize - 1 + 1 >= 11) {
                    generateDraftChoice(200000, 1, 'R');
                } else {
                    generateDraftChoice(300000, 0, 'R');
                }

                // Choice 3: Premium
                if (currentSquadSize - 2 + 1 >= 11) {
                    generateDraftChoice(400000, 2, Math.random() > 0.8 ? 'SSR' : 'SR');
                }
            } else if (type === 'training') {
                const isAwakening = Math.random() > 0.7;
                if (isAwakening) {
                    eventObj.title = '特別覚醒イベント';
                    eventObj.flavorText = '「特定の選手の潜在能力を引き出すチャンスです！」';
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(300000 * costMultiplier).toLocaleString()}で、指定選手1名を大幅レベルアップ (EXP +300 / コンディション回復)`,
                        fundCost: Math.floor(300000 * costMultiplier),
                        action: 'awaken'
                    });
                } else {
                    eventObj.title = '全体練習メニュー';
                    eventObj.flavorText = '「今日の練習はどうしますか？」';
                    eventObj.choices.push({ desc: '軽めの調整 (無償) - 全員の体力+30 / EXP+10', fundCost: 0, action: 'light' });
                    eventObj.choices.push({ desc: `特別合宿 (資金¥${Math.floor(150000 * costMultiplier).toLocaleString()}) - 全員のEXP+50 / 体力-20`, fundCost: Math.floor(150000 * costMultiplier), action: 'heavy' });
                }
            } else if (type === 'relic') {
                eventObj.title = '怪しい商人';
                eventObj.flavorText = '「ヘッヘッヘ、いいお宝があるぜ。買わねえか？」';

                // Use game state tracker for unowned relics so multiple merchants in a turn share the pool
                if (!window.gameState.turnRelicPool) {
                    window.gameState.turnRelicPool = window.MasterData.Relics.filter(r => !window.gameState.playerTeam.relics.includes(r.id)).sort(() => 0.5 - Math.random());
                }
                const numChoices = Math.min(3, window.gameState.turnRelicPool.length);

                for(let c=0; c<numChoices; c++) {
                    const r = window.gameState.turnRelicPool.pop(); // Remove so it doesn't appear again this turn
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor((300000 + c*100000) * costMultiplier).toLocaleString()}で「${r.name}」を購入 (${r.description})`,
                        fundCost: Math.floor((300000 + c*100000) * costMultiplier),
                        rewardRelicId: r.id
                    });
                }
                if(numChoices === 0) {
                    eventObj.choices.push({ desc: '「もう売るもんはねえよ」', fundCost: 0, action: 'none' });
                }
            } else if (type === 'command') {
                eventObj.title = '戦術コーチの提案';
                eventObj.flavorText = '「新しい戦術オプションを導入しませんか？」';

                const unownedCmds = window.MasterData.MicroCommands.filter(c => !window.gameState.playerTeam.ownedMicroCommands.includes(c.id));
                const numChoices = Math.min(2, unownedCmds.length);

                for(let c=0; c<numChoices; c++) {
                    const cmd = unownedCmds[c];
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(150000 * costMultiplier).toLocaleString()}で「${cmd.name}」を習得`,
                        fundCost: Math.floor(150000 * costMultiplier),
                        rewardCmdId: cmd.id
                    });
                }
                if(numChoices === 0) {
                    eventObj.choices.push({ desc: '「すでに完璧な戦術をマスターしています」', fundCost: 0, action: 'none' });
                }
            } else {
                // mystery
                eventObj.title = '謎の出来事';
                eventObj.flavorText = '「何かが起きる予感がする……」';
                eventObj.choices.push({ desc: '様子を見る', fundCost: 0, action: 'random_good' });
                eventObj.choices.push({ desc: `お布施する (¥${Math.floor(50000 * costMultiplier).toLocaleString()})`, fundCost: Math.floor(50000 * costMultiplier), action: 'random_great' });
            }

            events.push(eventObj);
        }

        window.gameState.currentEvents = events;
    }

    executeEvent(eventId, choiceIdx) {
        const eventIndex = window.gameState.currentEvents.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const evt = window.gameState.currentEvents[eventIndex];
        const choice = evt.choices[choiceIdx];

        if (window.gameState.ap < 1 || window.gameState.funds < choice.fundCost) {
            this.showToast("リソースが不足しています。");
            return;
        }

        const team = window.gameState.playerTeam;

        // Verify and process trades
        let tradedPlayers = [];
        if (choice.tradeCount > 0) {
            const selectedIds = new Set();
            for (let tc = 0; tc < choice.tradeCount; tc++) {
                const selectEl = document.getElementById(`trade_select_${eventId}_${choiceIdx}_${tc}`);
                if (selectEl) {
                    selectedIds.add(selectEl.value);
                }
            }
            if (selectedIds.size < choice.tradeCount) {
                this.showToast("同じ選手を複数回選択することはできません。別の選手を選んでください。");
                return; // abort
            }

            // Execute trade removals
            selectedIds.forEach(idStr => {
                const pIndex = team.players.findIndex(p => String(p.id) === idStr);
                if (pIndex !== -1) {
                    const p = team.players[pIndex];
                    tradedPlayers.push(p);
                    team.players.splice(pIndex, 1);
                    // Remove from starting11 or bench
                    const sIdx = team.starting11.findIndex(sp => String(sp.id) === idStr);
                    if (sIdx !== -1) team.starting11.splice(sIdx, 1);
                    const bIdx = team.bench.findIndex(bp => String(bp.id) === idStr);
                    if (bIdx !== -1) team.bench.splice(bIdx, 1);
                }
            });
        }

        // Pay cost
        window.gameState.ap -= 1;
        window.gameState.funds -= choice.fundCost;

        // Process Rewards
        if (evt.type === 'scout') {
            let newPlayer;
            if (choice.candidates) {
                let selectedCandidateIndex = 0;
                const radioGrp = document.getElementsByName(`draft_select_${eventId}_${choiceIdx}`);
                for (let radio of radioGrp) {
                    if (radio.checked) {
                        selectedCandidateIndex = parseInt(radio.value);
                        break;
                    }
                }
                newPlayer = choice.candidates[selectedCandidateIndex];
                newPlayer.id = `scout_${Date.now()}`; // Refresh ID
            } else {
                newPlayer = window.Player.generateRandom(`scout_${Date.now()}`, null, choice.rewardRarity);
            }
            newPlayer.isNew = true;
            // Generate decent level based on tier
            newPlayer.level = Math.floor(Math.random() * (4 - window.gameState.currentTier + 1)) + 1;
            newPlayer.maxExp = newPlayer.level * 100;

            team.players.push(newPlayer);
            if (team.starting11.length < 11) {
                team.starting11.push(newPlayer);
            } else {
                team.bench.push(newPlayer);
            }

            let alertMsg = `${newPlayer.name} (${choice.rewardRarity}) を獲得しました！`;
            if (tradedPlayers.length > 0) {
                alertMsg += `\n(放出した選手: ${tradedPlayers.map(p=>p.name).join(', ')})`;
            }
            this.showToast(alertMsg);

        } else if (evt.type === 'relic' && choice.rewardRelicId) {
            team.relics.push(choice.rewardRelicId);
            const r = window.MasterData.Relics.find(x => x.id === choice.rewardRelicId);
            this.showToast(`宝物「${r.name}」を獲得しました！`);
        } else if (evt.type === 'command' && choice.rewardCmdId) {
            team.ownedMicroCommands.push(choice.rewardCmdId);
            for (let i = 0; i < 4; i++) {
                if (!team.microCommands[i]) {
                    team.microCommands[i] = choice.rewardCmdId;
                    break;
                }
            }
            const c = window.MasterData.MicroCommands.find(x => x.id === choice.rewardCmdId);
            this.showToast(`戦術コマンド「${c.name}」を獲得しました！`);
        } else if (evt.type === 'training') {
            if (choice.action === 'awaken') {
                const selectEl = document.getElementById(`awaken_select_${eventId}_${choiceIdx}`);
                const p = team.players.find(x => String(x.id) === selectEl.value);
                if (p) {
                    const oldLv = p.level;
                    for (let i = 0; i < 2; i++) {
                        if (p.level < 10) p.addExp(p.maxExp);
                    }
                    this.showToast(`${p.name} が特別覚醒しました！ (Lv.${oldLv} ➔ Lv.${p.level})`);
                }
            } else if (choice.action === 'train_pos') {
                const targets = team.players.filter(p => choice.targetPos.includes(p.position));
                targets.forEach(p => p.addExp(120));
                this.showToast(`${choice.targetPos.join('/')}陣の特訓が完了し、対象選手が大量の経験値を獲得しました！`);
            } else if (choice.action === 'teach_skill') {
                const selectEl = document.getElementById(`teach_select_${eventId}_${choiceIdx}`);
                if (!selectEl || !selectEl.value) {
                    this.showToast("対象選手がいません。");
                    return;
                }
                const p = team.players.find(x => String(x.id) === selectEl.value);
                if (p) {
                    p.skills.push(choice.skill.id);
                    this.showToast(`${p.name} にスキル『${choice.skill.name}』を伝授しました！`);
                }
            } else if (choice.action === 'heavy') {
                team.players.forEach(p => {
                    p.condition = 100;
                    p.addExp(50);
                });
                this.showToast("特別合宿完了！コンディションが全快し、経験値を獲得しました。");
            } else if (choice.action === 'light') {
                team.players.forEach(p => {
                    p.condition = Math.min(100, p.condition + 30);
                    p.addExp(10);
                });
                this.showToast("軽めの調整完了。コンディションが回復しました。");
            }
        } else if (evt.type === 'mystery') {
            if (choice.action === 'bribe_referee') {
                window.gameState.bribeReferee = true;
                this.showToast("怪しいフィクサーに裏工作を依頼した。次の試合で相手が最初にファウルを犯した時、一発退場になるだろう……");
            } else if (choice.action === 'sponsor_tour') {
                window.gameState.funds += 400000;
                team.players.forEach(p => p.condition = Math.max(0, p.condition - 25));
                this.showToast("強行スポンサー巡業で¥400,000の資金を得たが、チーム全員の体力が減少した……");
            } else if (choice.action === 'mad_science') {
                const selectEl = document.getElementById(`mad_select_${eventId}_${choiceIdx}`);
                const p = team.players.find(x => String(x.id) === selectEl.value);
                if (p) {
                    p.addExp(900); // 3 levels worth
                    if (!p.skills.includes(77)) {
                        p.skills.push(77); // ID 77: ガラスの天才
                    }
                    this.showToast(`${p.name} は肉体改造を受け、レベルが劇的に上昇したが、『ガラスの天才』の副作用が付与された！`);
                }
            } else if (choice.action === 'refuse_science') {
                team.players.forEach(p => p.condition = Math.min(100, p.condition + 10));
                this.showToast("断った。ホッとしたのか、全員の体力が少し回復した。");
            } else if (choice.action === 'random_good') {
                const heal = Math.random() > 0.5;
                if (heal) {
                    team.players.forEach(p => p.condition = 100);
                    this.showToast("偶然良いリフレッシュになり、コンディションが全快しました。");
                } else {
                    window.gameState.funds += 100000;
                    this.showToast("道端で¥100,000拾いました。");
                }
            } else if (choice.action === 'random_great') {
                const p = team.players[Math.floor(Math.random() * team.players.length)];
                p.addExp(200);
                this.showToast(`お布施の恩恵か、${p.name} が突如として成長しました！ (Lv.${p.level})`);
            } else {
                this.showToast("何も起きませんでした。");
            }
        }

        // Remove event so it can't be bought again
        window.gameState.currentEvents.splice(eventIndex, 1);

        this.showEvents();
        this.updateTopBar();
    }

    showToast(msg) {
        const uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) return;
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerText = msg;
        uiLayer.appendChild(toast);

        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        toast.onclick = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        };
    }

    showGameOver() {
        this.uiContent.innerHTML = `
            <div class="menu-box" style="background: #c0392b; border: 4px solid #fff; border-radius: 10px; width: 600px;">
                <h2 style="font-size: 48px; text-shadow: 2px 2px 5px rgba(0,0,0,0.5); margin-bottom: 20px;">解任宣告</h2>
                <div style="background: #000; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: left; border-left: 5px solid #f1c40f;">
                    <p style="font-size: 18px; margin-bottom: 10px;">「クラブの期待に応えられなかったため、君を解任する。」</p>
                    <p style="color: #bbb; font-size: 14px;">ノルマ未達が確定したため、即時契約解除となりました。</p>
                </div>
                <button style="margin-top: 20px; background: white; color: black; font-weight: bold; width: 100%; padding: 15px; font-size: 18px;" onclick="location.reload()">タイトルへ戻る (再挑戦)</button>
            </div>
        `;
    }
}

// Global instance
let managementUI;
window.addEventListener('DOMContentLoaded', () => {
    managementUI = new ManagementUI();
});
