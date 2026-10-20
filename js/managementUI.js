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
        `;

        // Render relics bar
        const relicsHtml = window.gameState.playerTeam.relics.map(relicId => {
            const relic = window.MasterData.Relics.find(r => r.id === relicId);
            if (!relic) return '';
            return `<div class="relic-badge" title="${relic.description}">${relic.name}</div>`;
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
            alert(`戦術コマンド「${c.name}」を獲得しました！`);

        } else if (type === 'player') {
            if (team.players.length >= 18) {
                const selectEl = document.getElementById('victory_trade_select');
                if (!selectEl) {
                    alert("放出すべき選手が選択されていません。");
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

            alert(`${newPlayer.name} を引き抜きました！`);

        } else if (type === 'relic') {
            team.relics.push(idOrIdx);
            const r = window.MasterData.Relics.find(x => x.id === idOrIdx);
            alert(`宝物「${r.name}」を獲得しました！`);
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
            alert("選手が休養し、コンディションが回復しました。");
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
                        <p style="margin-bottom: 10px; color: #f39c12;"><strong>スタメン平均戦力:</strong> 約${Math.floor(opponent.starting11.reduce((sum, p) => sum + p.stats.pass + p.stats.defense + p.stats.speed, 0) / 11 / 3)}</p>

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
                                return `<li style="padding: 5px 0; border-bottom: 1px solid #34495e;">・${r ? r.name : 'Unknown'}</li>`;
                            }).join('')}
                        </ul>
                    </div>

                    <div style="background: rgba(40,40,40,0.95); padding: 15px; border-radius: 8px; text-align: left; flex: 1.5; overflow-y: auto;">
                        <h3 style="color: #f1c40f; margin-bottom: 10px;">セット中ミクロ (戦術コマンド)</h3>
                        <p style="font-size: 12px; color: #ccc; margin-bottom: 10px;">※試合中、手動または自動で発動可能 (最大4つ)</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${[0, 1, 2, 3].map(i => {
                                const cmdId = window.gameState.playerTeam.microCommands[i];
                                const allCmds = window.MasterData.MicroCommands.filter(c => window.gameState.playerTeam.ownedMicroCommands.includes(c.id));
                                let optionsHtml = `<option value="">未セット</option>`;
                                allCmds.forEach(c => {
                                    const isSelectedElsewhere = window.gameState.playerTeam.microCommands.includes(c.id) && window.gameState.playerTeam.microCommands[i] !== c.id;
                                    if (!isSelectedElsewhere) {
                                        optionsHtml += `<option value="${c.id}" ${cmdId === c.id ? 'selected' : ''}>${c.name} (CD:${c.cooldown}s)</option>`;
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

                        <div id="formation-container" style="position: relative; width: 100%; height: 100%;">
                            <!-- Players injected here by JS -->
                        </div>
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
        this.selectedPlayerIndex = null; // for tap-to-swap logic
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

        detailPanel.innerHTML = `
            <div style="background: #222; border: 2px solid ${rarityColor}; border-radius: 8px; padding: 15px; flex: 1; display: flex; flex-direction: column; text-align: left; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 10px;">
                    <div>
                        <span style="background: ${rarityColor}; color: ${player.rarity === 'SSR' ? '#000' : '#fff'}; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px;">${player.rarity}</span>
                        <span style="font-size: 14px; margin-left: 5px;">${player.nationality || ''}</span>
                        <h3 style="margin-top: 5px;">${player.name}</h3>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: bold; color: #f1c40f;">OVR ${player.getOvr()}</div>
                        <div style="font-size: 12px;">${isMax ? 'Lv.MAX' : 'Lv.'+player.level}</div>
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <div style="font-size: 10px; margin-bottom: 2px;">EXP ${isMax ? 'MAX' : player.exp + ' / ' + player.maxExp}</div>
                    <div style="width: 100%; background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${expPercent}%; background: #9b59b6; height: 100%;"></div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; margin-bottom: 2px; display: flex; justify-content: space-between;">
                        <span>体力</span><span>${player.condition}%</span>
                    </div>
                    <div style="width: 100%; background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${player.condition}%; background: ${player.condition > 50 ? '#2ecc71' : '#e74c3c'}; height: 100%;"></div>
                    </div>
                </div>

                <div style="margin-bottom: 10px; font-size: 12px;">
                    <span style="color: #bbb;">メイン適性:</span> <span style="font-weight: bold; color: #fff;">${player.position}</span><br>
                    <span style="color: #bbb;">サブ適性:</span> ${player.subPositions.length > 0 ? player.subPositions.join(', ') : 'なし'}<br>
                    <span style="color: #bbb;">役割(ロール):</span> ${player.role || 'なし'}
                </div>

                <div style="margin-bottom: 15px;">
                    <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 5px; font-size: 13px;">ステータス</h4>
                    ${statBarsHtml}
                </div>

                <div>
                    <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 5px; font-size: 13px;">スキル</h4>
                    ${skillsHtml}
                </div>
            </div>
            <button style="margin-top: 15px; width: 100%; padding: 12px; background: #27ae60;" onclick="managementUI.showDashboard()">戻る (編成確定)</button>
        `;
    }

    renderFormation() {
        const team = window.gameState.playerTeam;
        const container = document.getElementById('formation-container');
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
                <span style="font-size: 7px; color: #f1c40f;">${roleText}</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40px;">${p.name.substring(0,4)}</span>
                <span style="font-size: 8px;">${p.level>=10?'Lv.MAX':'Lv.'+p.level}</span>
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
            bDiv.innerHTML = `<span>${newBadge}[${p.position}] ${p.name} (${p.level>=10?'MAX':'Lv.'+p.level})</span> <span>OVR:${p.getOvr()}</span>`;
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

        return formationsCoords[formation] || formationsCoords["4-4-2"];
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

        // Remove NEW badge upon click
        if (player.isNew) {
            player.isNew = false;
        }

        if (this.selectedPlayerIndex === null) {
            // First click
            this.selectedPlayerIndex = index;
            this.renderFormation();
            this.renderPlayerDetailCard(player, index);
        } else {
            // Second click: swap
            const idx1 = this.selectedPlayerIndex;
            const idx2 = index;

            if (idx1 !== idx2) {
                let p1 = idx1 < 11 ? team.starting11[idx1] : team.bench[idx1 - 11];
                let p2 = idx2 < 11 ? team.starting11[idx2] : team.bench[idx2 - 11];

                // Swap them in data structure
                if (idx1 < 11) team.starting11[idx1] = p2;
                else team.bench[idx1 - 11] = p2;

                if (idx2 < 11) team.starting11[idx2] = p1;
                else team.bench[idx2 - 11] = p1;

                // Recalculate chemistry
                window.ChemistrySystem.calculateTeamChemistry(team);
            }

            this.selectedPlayerIndex = null;
            this.renderFormation();
            this.renderPlayerDetailCard(null); // Clear detail card after swap
        }
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
            if (choice.tradeCount > 0) {
                extraUI += `<div style="margin-top: 5px; font-size: 12px; color: #e74c3c;">放出対象を選択 (${choice.tradeCount}人):</div>`;
                for (let tc = 0; tc < choice.tradeCount; tc++) {
                    extraUI += `<select id="trade_select_${eventId}_${idx}_${tc}" style="width: 100%; margin-top: 3px; background: #222; color: #fff; padding: 3px; border: 1px solid #555;">`;
                    // Generate options prioritizing bench
                    team.bench.forEach(p => {
                        extraUI += `<option value="${p.id}">[${p.position}] ${p.name} (Lv.${p.level})</option>`;
                    });
                    team.starting11.forEach(p => {
                        extraUI += `<option value="${p.id}">スタメン: [${p.position}] ${p.name} (Lv.${p.level})</option>`;
                    });
                    extraUI += `</select>`;
                }
            } else if (choice.action === 'awaken') {
                extraUI += `<div style="margin-top: 5px; font-size: 12px; color: #3498db;">覚醒対象を選択:</div>`;
                extraUI += `<select id="awaken_select_${eventId}_${idx}" style="width: 100%; margin-top: 3px; background: #222; color: #fff; padding: 3px; border: 1px solid #555;">`;
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

        // Randomly determine number of events: 4 to 7
        const numEvents = Math.floor(Math.random() * 4) + 4;

        // Count how many of each type we've added to enforce max 2 per category
        const typeCounts = {
            command: 0, scout: 0, training: 0, relic: 0, mystery: 0
        };

        const tier = window.gameState.currentTier;
        const matchday = window.gameState.league ? window.gameState.league.currentMatchday : 1;

        // Base cost multiplier: (4 - tier) + (matchday * 0.1) => Tier 3: ~1.1, Tier 1: ~3.5
        const costMultiplier = (4 - tier) + (matchday * 0.1);

        const currentSquadSize = window.gameState.playerTeam.players.length;

        for (let i = 0; i < numEvents; i++) {
            // Filter available types (max 2) and handle 11-player guard for 'scout'
            let availableTypes = baseTypes.filter(t => {
                if (typeCounts[t] >= 2) return false;
                // If squad is 11, we CAN do scout, but the *choices* generated later must not reduce size below 11.
                // However, some scout events strictly require trading. We'll handle the guard inside the choice generation.
                return true;
            });

            if (availableTypes.length === 0) availableTypes = ['mystery']; // Fallback

            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            typeCounts[type]++;

            let eventObj = {
                id: `evt_${Date.now()}_${i}`,
                type: type,
                choices: []
            };

            if (type === 'scout') {
                eventObj.title = 'スカウトからの提案';
                eventObj.flavorText = '「監督、有望な選手を見つけました。チームの補強にいかがですか？」';

                // Choice 1: Standard Buy
                if (currentSquadSize >= 18) {
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(100000 * costMultiplier).toLocaleString()} ＋ 選手1人放出で選手を獲得`,
                        fundCost: Math.floor(100000 * costMultiplier),
                        tradeCount: 1,
                        rewardRarity: 'N'
                    });
                } else {
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(100000 * costMultiplier).toLocaleString()}で選手を獲得`,
                        fundCost: Math.floor(100000 * costMultiplier),
                        tradeCount: 0,
                        rewardRarity: 'N'
                    });
                }

                // Choice 2: Trade 1
                // Only allow trade if currentSquadSize - tradeCount + 1 >= 11
                if (currentSquadSize - 1 + 1 >= 11) {
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(200000 * costMultiplier).toLocaleString()} ＋ 選手1人放出で、R選手を獲得`,
                        fundCost: Math.floor(200000 * costMultiplier),
                        tradeCount: 1,
                        rewardRarity: 'R'
                    });
                } else {
                    // Fallback to pure buy if trade not allowed
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(300000 * costMultiplier).toLocaleString()}で、R選手を獲得`,
                        fundCost: Math.floor(300000 * costMultiplier),
                        tradeCount: 0,
                        rewardRarity: 'R'
                    });
                }

                // Choice 3: Premium Trade
                if (currentSquadSize - 2 + 1 >= 11) {
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(400000 * costMultiplier).toLocaleString()} ＋ 選手2人放出で、SR/SSR選手を獲得`,
                        fundCost: Math.floor(400000 * costMultiplier),
                        tradeCount: 2,
                        rewardRarity: Math.random() > 0.8 ? 'SSR' : 'SR'
                    });
                }
            } else if (type === 'training') {
                const isAwakening = Math.random() > 0.7;
                if (isAwakening) {
                    eventObj.title = '特別覚醒イベント';
                    eventObj.flavorText = '「特定の選手の潜在能力を引き出すチャンスです！」';
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor(300000 * costMultiplier).toLocaleString()}で、指定選手1名を大幅レベルアップ`,
                        fundCost: Math.floor(300000 * costMultiplier),
                        action: 'awaken'
                    });
                } else {
                    eventObj.title = '全体練習メニュー';
                    eventObj.flavorText = '「今日の練習はどうしますか？」';
                    eventObj.choices.push({ desc: '軽めの調整 (無償)', fundCost: 0, action: 'light' });
                    eventObj.choices.push({ desc: `特別合宿 (資金¥${Math.floor(150000 * costMultiplier).toLocaleString()})`, fundCost: Math.floor(150000 * costMultiplier), action: 'heavy' });
                }
            } else if (type === 'relic') {
                eventObj.title = '怪しい商人';
                eventObj.flavorText = '「ヘッヘッヘ、いいお宝があるぜ。買わねえか？」';

                const unownedRelics = window.MasterData.Relics.filter(r => !window.gameState.playerTeam.relics.includes(r.id));
                const numChoices = Math.min(3, unownedRelics.length);

                for(let c=0; c<numChoices; c++) {
                    const r = unownedRelics[c];
                    // Cost scales up per choice index
                    eventObj.choices.push({
                        desc: `資金¥${Math.floor((300000 + c*100000) * costMultiplier).toLocaleString()}で「${r.name}」を購入`,
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
            alert("リソースが不足しています。");
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
                alert("同じ選手を複数回選択することはできません。別の選手を選んでください。");
                return; // abort
            }

            // Execute trade removals
            selectedIds.forEach(id => {
                const pIndex = team.players.findIndex(p => p.id === id);
                if (pIndex !== -1) {
                    const p = team.players[pIndex];
                    tradedPlayers.push(p);
                    team.players.splice(pIndex, 1);
                    // Remove from starting11 or bench
                    const sIdx = team.starting11.findIndex(sp => sp.id === id);
                    if (sIdx !== -1) team.starting11.splice(sIdx, 1);
                    const bIdx = team.bench.findIndex(bp => bp.id === id);
                    if (bIdx !== -1) team.bench.splice(bIdx, 1);
                }
            });
        }

        // Pay cost
        window.gameState.ap -= 1;
        window.gameState.funds -= choice.fundCost;

        // Process Rewards
        if (evt.type === 'scout') {
            const newPlayer = window.Player.generateRandom(`scout_${Date.now()}`, null, choice.rewardRarity);
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
            alert(alertMsg);

        } else if (evt.type === 'relic' && choice.rewardRelicId) {
            team.relics.push(choice.rewardRelicId);
            const r = window.MasterData.Relics.find(x => x.id === choice.rewardRelicId);
            alert(`宝物「${r.name}」を獲得しました！`);
        } else if (evt.type === 'command' && choice.rewardCmdId) {
            team.ownedMicroCommands.push(choice.rewardCmdId);
            for (let i = 0; i < 4; i++) {
                if (!team.microCommands[i]) {
                    team.microCommands[i] = choice.rewardCmdId;
                    break;
                }
            }
            const c = window.MasterData.MicroCommands.find(x => x.id === choice.rewardCmdId);
            alert(`戦術コマンド「${c.name}」を獲得しました！`);
        } else if (evt.type === 'training') {
            if (choice.action === 'awaken') {
                const selectEl = document.getElementById(`awaken_select_${eventId}_${choiceIdx}`);
                const p = team.players.find(x => x.id === selectEl.value);
                if (p) {
                    p.addExp(300); // 3 levels worth roughly
                    alert(`${p.name} が特別覚醒しました！ (現在Lv.${p.level})`);
                }
            } else if (choice.action === 'heavy') {
                team.players.forEach(p => {
                    p.condition = 100;
                    p.addExp(50);
                });
                alert("特別合宿完了！コンディションが全快し、経験値を獲得しました。");
            } else {
                team.players.forEach(p => {
                    p.condition = Math.min(100, p.condition + 30);
                    p.addExp(10);
                });
                alert("軽めの調整完了。コンディションが回復しました。");
            }
        } else if (evt.type === 'mystery') {
            if (choice.action === 'random_good') {
                const heal = Math.random() > 0.5;
                if (heal) {
                    team.players.forEach(p => p.condition = 100);
                    alert("偶然良いリフレッシュになり、コンディションが全快しました。");
                } else {
                    window.gameState.funds += 100000;
                    alert("道端で¥100,000拾いました。");
                }
            } else if (choice.action === 'random_great') {
                const p = team.players[Math.floor(Math.random() * team.players.length)];
                p.addExp(200);
                alert(`お布施の恩恵か、${p.name} が突如として成長しました！ (Lv.${p.level})`);
            } else {
                alert("何も起きませんでした。");
            }
        }

        // Remove event so it can't be bought again
        window.gameState.currentEvents.splice(eventIndex, 1);

        this.showEvents();
        this.updateTopBar();
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
