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

    updateTopBar() {
        if (!window.gameState.playerTeam) return;
        this.topBar.style.display = 'flex';

        this.topBarInfo.innerHTML = `
            チーム: ${window.gameState.playerTeam.name}
            <span class="funds">資金: ¥${window.gameState.funds.toLocaleString()}</span>
            <span class="ap">AP: ${window.gameState.ap}/10</span>
        `;

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
            html += `
                <div style="border: 1px solid #555; padding: 15px; border-radius: 5px; text-align: left; background: #333;">
                    <h3 style="color: #f1c40f; margin-bottom: 5px;">${m.name}</h3>
                    <p><strong>戦術志向:</strong> ${m.preference}</p>
                    <p><strong>初期フォーメーション:</strong> ${m.formations.join(', ')}</p>
                    <p><strong>初期特性 (宝物):</strong> ${m.initialTrait}</p>
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
        const weather = weathers[Math.floor(Math.random() * weathers.length)];

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
                                const cmd = cmdId ? window.MasterData.MicroCommands.find(c => c.id === cmdId) : null;
                                return `
                                    <div style="background: #222; padding: 10px; border: 1px solid #555; border-radius: 4px; display: flex; justify-content: space-between;">
                                        <span>${i+1}. ${cmd ? cmd.name : '<span style="color:#777">未セット</span>'}</span>
                                        <span style="color: #3498db; font-size: 12px;">${cmd ? 'CD: ' + cmd.cooldown + 's' : ''}</span>
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
            this.showDashboard();
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

                <div class="ui-right-panel" style="flex: 1; gap: 10px; border-radius: 8px; margin-left: 10px;">
                    <h3 style="background: #2c3e50; padding: 8px; border-radius: 4px;">ベンチ</h3>
                    <div id="bench-container" style="display: flex; flex-direction: column; gap: 5px; overflow-y: auto; flex: 1;">
                        <!-- Bench players injected here -->
                    </div>

                    <h3 style="background: #f39c12; padding: 8px; margin-top: 10px; border-radius: 4px;">セット中コマンド</h3>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        ${team.microCommands.map((cmdId, index) => {
                            const cmd = window.MasterData.MicroCommands.find(c => c.id === cmdId);
                            return `<div style="background: #333; padding: 8px; border: 1px solid #f39c12; font-size: 14px;">${index+1}. ${cmd ? cmd.name : 'なし'}</div>`;
                        }).join('')}
                    </div>

                    <button style="margin-top: 15px; width: 100%; padding: 12px; background: #27ae60;" onclick="managementUI.showDashboard()">戻る (編成確定)</button>
                </div>
            </div>
        `;

        this.uiContent.innerHTML = html;
        this.selectedPlayerIndex = null; // for tap-to-swap logic
        this.renderFormation();
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
        container.innerHTML = '';

        team.starting11.forEach((p, idx) => {
            const pos = posMap[idx] || {x: 0.5, y: 0.5};
            const left = pos.x * 100;
            const top = pos.y * 100;
            const isSelected = this.selectedPlayerIndex === idx;

            const pDiv = document.createElement('div');
            pDiv.className = 'pitch-player';
            pDiv.style = `
                position: absolute; left: ${left}%; top: ${top}%;
                transform: translate(-50%, -50%);
                width: 45px; height: 50px;
                background: ${isSelected ? '#f39c12' : '#34495e'};
                border: 2px solid ${p.preference === 'ポゼッション' ? '#3498db' : (p.preference === 'カウンター' ? '#e74c3c' : '#2ecc71')};
                border-radius: 5px; color: white;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-size: 10px; cursor: pointer; user-select: none;
                z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            `;
            pDiv.innerHTML = `
                <span style="font-weight: bold;">${p.position}</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40px;">${p.name.substring(0,4)}</span>
                <span style="font-size: 8px;">疲${100 - p.condition}</span>
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
                cursor: pointer; display: flex; justify-content: space-between;
                border-left: 4px solid ${p.preference === 'ポゼッション' ? '#3498db' : (p.preference === 'カウンター' ? '#e74c3c' : '#2ecc71')};
            `;
            bDiv.innerHTML = `<span>[${p.position}] ${p.name}</span> <span>志向: ${p.preference.substring(0,1)} 疲: ${100-p.condition}</span>`;
            bDiv.onclick = () => this.handlePlayerClick(bIdx, false);
            benchContainer.appendChild(bDiv);
        });

        this.drawChemistryLinks(canvas, posMap, team);
    }

    getFormationPositions(formation) {
        // Approximate Y (0=top/GK, 1=bottom/FW) and X (0=left, 1=right)
        if (formation === "4-4-2") {
            return [
                {x: 0.5, y: 0.05}, // 0 GK
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, // 1,2 CB
                {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25}, // 3,4 SB
                {x: 0.35, y: 0.55}, {x: 0.65, y: 0.55}, // 5,6 CM
                {x: 0.15, y: 0.65}, {x: 0.85, y: 0.65}, // 7,8 WG
                {x: 0.35, y: 0.85}, {x: 0.65, y: 0.85}  // 9,10 CF
            ];
        } else if (formation === "4-3-3") {
            return [
                {x: 0.5, y: 0.05}, // GK
                {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, // CBs
                {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25}, // SBs
                {x: 0.5, y: 0.45}, // CDM
                {x: 0.3, y: 0.6}, {x: 0.7, y: 0.6}, // CMs
                {x: 0.15, y: 0.85}, {x: 0.5, y: 0.85}, {x: 0.85, y: 0.85} // WG, CF, WG
            ];
        }
        // Fallback generic 4-4-2 shape
        return [
            {x: 0.5, y: 0.05},
            {x: 0.35, y: 0.25}, {x: 0.65, y: 0.25}, {x: 0.15, y: 0.25}, {x: 0.85, y: 0.25},
            {x: 0.35, y: 0.55}, {x: 0.65, y: 0.55}, {x: 0.15, y: 0.65}, {x: 0.85, y: 0.65},
            {x: 0.35, y: 0.85}, {x: 0.65, y: 0.85}
        ];
    }

    drawChemistryLinks(canvas, posMap, team) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const links = window.ChemistrySystem.getFormationLinks(team.formation);

        links.forEach(([idx1, idx2]) => {
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
            ctx.strokeStyle = isMatch ? '#f1c40f' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = isMatch ? 3 : 1;
            ctx.stroke();
        });
    }

    handlePlayerClick(index, isStarter) {
        if (this.selectedPlayerIndex === null) {
            // First click
            this.selectedPlayerIndex = index;
            this.renderFormation();
        } else {
            // Second click: swap
            const team = window.gameState.playerTeam;
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
                            if(e.type === 'shop') borderColor = '#f39c12';
                            if(e.type === 'training') borderColor = '#3498db';
                            if(e.type === 'sponsor') borderColor = '#9b59b6';
                            if(e.isRare || e.id.includes('emerg')) borderColor = '#e74c3c';

                            const canAfford = window.gameState.ap >= e.apCost && window.gameState.funds >= e.fundCost;

                            return `
                                <div id="card_${e.id}" class="event-card" onclick="managementUI.selectEvent('${e.id}')"
                                     style="background: #333; border: 2px solid ${borderColor}; border-radius: 8px; padding: 15px; cursor: pointer; opacity: ${canAfford ? '1' : '0.5'}; display: flex; flex-direction: column; justify-content: space-between;">
                                    <h3 style="font-size: 16px; margin-bottom: 5px;">${e.title}</h3>
                                    <div style="font-size: 14px; color: #f1c40f;">AP ${e.apCost} / ¥${e.fundCost.toLocaleString()}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="ui-right-panel" style="flex: 1; display: flex; flex-direction: column; margin-left: 10px; padding: 0; background: transparent;">
                    <div id="event-detail-panel" style="flex: 1; background: #2c3e50; border: 2px solid #34495e; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: left;">
                        <p style="color: #bbb;">イベントを選択してください</p>
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

        const canAfford = window.gameState.ap >= e.apCost && window.gameState.funds >= e.fundCost;
        const detailPanel = document.getElementById('event-detail-panel');

        let detailHtml = `
            <h3 style="margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px; width: 100%; text-align: center;">${e.title}</h3>
            <div style="flex: 1; width: 100%; overflow-y: auto; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
        `;

        if (e.type === 'scout') {
            detailHtml += `
                <p style="color: #27ae60; font-weight: bold;">選手: ${e.player.name}</p>
                <p>ポジション: ${e.player.position}</p>
                <p>戦術志向: ${e.player.preference}</p>
                <p>スタミナ: ${e.player.stats.stamina} / スピード: ${e.player.stats.speed}</p>
            `;
        } else if (e.type === 'shop') {
            detailHtml += `
                <p style="color: #f39c12; font-weight: bold;">アイテム: ${e.item.name}</p>
                <p>種類: ${e.itemType === 'relic' ? '宝物 (パッシブ効果)' : 'ミクロ (戦術コマンド)'}</p>
                <p style="margin-top: 10px; color: #ddd;">${e.item.description || '強力なアイテムです。'}</p>
            `;
        } else {
            detailHtml += `<p>${e.desc}</p>`;
        }

        detailHtml += `
            </div>
            <div style="background: #1a252f; width: 100%; padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 15px;">
                <span style="color: ${window.gameState.ap >= e.apCost ? '#fff' : '#e74c3c'};">必要 AP: ${e.apCost}</span><br>
                <span style="color: ${window.gameState.funds >= e.fundCost ? '#fff' : '#e74c3c'};">必要 資金: ¥${e.fundCost.toLocaleString()}</span>
            </div>
            <button onclick="managementUI.executeEvent('${e.id}')" ${!canAfford ? 'disabled' : ''} style="width: 100%; padding: 15px; font-size: 18px; background: ${canAfford ? '#27ae60' : '#555'};">実行 (確定)</button>
        `;

        detailPanel.innerHTML = detailHtml;
    }

    generateEvents() {
        const events = [];
        const types = ['training', 'scout', 'shop', 'sponsor'];

        let totalApCost = 0;
        const maxAp = 10;
        const targetMinAp = maxAp + 2; // at least 12 AP total to force choice

        // Ensure at least 3 categories are present
        const selectedCategories = [];
        while(selectedCategories.length < 3) {
            const cat = types[Math.floor(Math.random() * types.length)];
            if (!selectedCategories.includes(cat)) selectedCategories.push(cat);
        }

        // We need 6 events total
        for (let i = 0; i < 6; i++) {
            let cat = i < 3 ? selectedCategories[i] : types[Math.floor(Math.random() * types.length)];

            // Check for Rare/Emergency events based on hidden stats
            const isRare = window.gameState.managerInfluence >= 10 && Math.random() < 0.3;
            const isEmergency = window.gameState.losingStreak >= 2 && Math.random() < 0.5;

            if (isEmergency && i === 5) {
                // Emergency Board Meeting
                events.push({
                    id: `evt_emerg_${i}`,
                    type: 'sponsor',
                    title: '【緊急】フロントからの叱咤',
                    desc: '連敗の責任を追及されるが、資金援助を引き出す。AP0で資金獲得。',
                    apCost: 0,
                    fundCost: 0,
                    rewardFunds: 500000
                });
                continue;
            }

            if (cat === 'training') {
                const cost = isRare ? 1 : Math.floor(Math.random() * 2) + 2; // 2-3 AP
                events.push({
                    id: `evt_train_${i}`,
                    type: 'training',
                    title: isRare ? '伝説のコーチの特訓' : '全体練習',
                    desc: isRare ? 'チーム全体のコンディションが全回復し、スタッツも微増する。' : 'コンディションを回復する。',
                    apCost: cost,
                    fundCost: 0,
                    isRare: isRare
                });
                totalApCost += cost;
            } else if (cat === 'scout') {
                const newPlayer = window.Player.generateRandom(`scout_${Date.now()}_${i}`);
                if (isRare) {
                    newPlayer.stats.pass += 20; newPlayer.stats.speed += 20; // Bump stats
                    newPlayer.name = "★" + newPlayer.name;
                }
                const cost = 2;
                events.push({
                    id: `evt_scout_${i}`,
                    type: 'scout',
                    player: newPlayer,
                    title: isRare ? '超大物スカウト' : '選手スカウト',
                    apCost: cost,
                    fundCost: isRare ? 800000 : 300000
                });
                totalApCost += cost;
            } else if (cat === 'shop') {
                const unownedRelics = window.MasterData.Relics.filter(r => !window.gameState.playerTeam.relics.includes(r.id));
                const unownedCmds = window.MasterData.MicroCommands.filter(c => !window.gameState.playerTeam.microCommands.includes(c.id));

                const isRelic = Math.random() > 0.5 && unownedRelics.length > 0;

                if (isRelic || unownedCmds.length === 0) {
                    const randomRelic = unownedRelics[Math.floor(Math.random() * unownedRelics.length)];
                    if(randomRelic) {
                        const cost = 1;
                        events.push({
                            id: `evt_shop_${i}`,
                            type: 'shop',
                            itemType: 'relic',
                            item: randomRelic,
                            title: 'ショップ (宝物)',
                            apCost: cost,
                            fundCost: 500000
                        });
                        totalApCost += cost;
                    }
                } else {
                    const randomCmd = unownedCmds[Math.floor(Math.random() * unownedCmds.length)];
                    if(randomCmd) {
                        const cost = 1;
                        events.push({
                            id: `evt_shop_${i}`,
                            type: 'shop',
                            itemType: 'microCommand',
                            item: randomCmd,
                            title: 'ショップ (ミクロ)',
                            apCost: cost,
                            fundCost: 200000
                        });
                        totalApCost += cost;
                    }
                }
            } else if (cat === 'sponsor') {
                const cost = Math.floor(Math.random() * 2) + 1; // 1-2 AP
                events.push({
                    id: `evt_sponsor_${i}`,
                    type: 'sponsor',
                    title: isRare ? '大口スポンサー契約' : 'スポンサー営業',
                    desc: isRare ? '多額の活動資金を獲得する。' : '活動資金を獲得する。',
                    apCost: cost,
                    fundCost: 0,
                    rewardFunds: isRare ? 1000000 : (cost === 2 ? 300000 : 150000),
                    isRare: isRare
                });
                totalApCost += cost;
            }
        }

        // Adjust AP to meet the Target Min AP requirement (>= 12)
        // Prevent infinite loop if we don't have enough events that can be upgraded
        let attempts = 0;
        while(totalApCost < targetMinAp && attempts < 100 && events.length > 0) {
            const validEvents = events.filter(e => e.apCost < 3 && e.apCost > 0);
            if (validEvents.length === 0) break; // Can't increase AP any further

            const e = validEvents[Math.floor(Math.random() * validEvents.length)];
            e.apCost++;
            totalApCost++;
            attempts++;
        }

        window.gameState.currentEvents = events;
    }

    executeEvent(eventId) {
        const eventIndex = window.gameState.currentEvents.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        const evt = window.gameState.currentEvents[eventIndex];

        if (window.gameState.ap < evt.apCost || window.gameState.funds < evt.fundCost) {
            alert("リソースが不足しています。");
            return;
        }

        // Pay cost
        window.gameState.ap -= evt.apCost;
        window.gameState.funds -= evt.fundCost;

        if (evt.type === 'scout') {
            window.gameState.playerTeam.players.push(evt.player);
            window.gameState.playerTeam.bench.push(evt.player); // Add to bench by default
            alert(`${evt.player.name} を獲得しました！`);
        } else if (evt.type === 'shop') {
            if (evt.itemType === 'relic') {
                window.gameState.playerTeam.relics.push(evt.item.id);
                alert(`宝物「${evt.item.name}」を獲得しました！`);
            } else if (evt.itemType === 'microCommand') {
                if (window.gameState.playerTeam.microCommands.length < 4) {
                     window.gameState.playerTeam.microCommands.push(evt.item.id);
                } else {
                     // MVP logic: just add it, UI only shows first 4 or allows swapping (if implemented)
                     // To keep it simple, replace the last one
                     window.gameState.playerTeam.microCommands[3] = evt.item.id;
                     alert(`コマンドスロットが一杯のため、一番右のコマンドと入れ替えました。`);
                }
                alert(`戦術コマンド「${evt.item.name}」を獲得しました！`);
            }
        } else if (evt.type === 'training') {
            window.gameState.playerTeam.players.forEach(p => {
                p.condition = 100;
                if (evt.isRare) {
                    p.stats.pass = Math.min(100, p.stats.pass + 2);
                    p.stats.speed = Math.min(100, p.stats.speed + 2);
                }
            });
            alert(evt.isRare ? "伝説の特訓完了！コンディション全快し能力上昇！" : "練習完了！コンディションが回復しました。");
        } else if (evt.type === 'sponsor') {
            window.gameState.funds += evt.rewardFunds;
            alert(`スポンサーから ¥${evt.rewardFunds.toLocaleString()} を獲得しました！`);
        }

        // Increase manager influence if a high AP event was chosen
        if (evt.apCost >= 2) {
            window.gameState.managerInfluence += 1;
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
