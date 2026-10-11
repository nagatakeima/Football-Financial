class ManagementUI {
    constructor() {
        this.uiContent = document.getElementById('ui-content');
        this.topBarInfo = document.querySelector('.team-info');
        this.topBarSchedule = document.querySelector('.schedule');

        // Initialize if gamestate doesn't have a team yet (Start Screen)
        if (!window.gameState.playerTeam) {
            this.showManagerSelection();
        } else {
            this.showDashboard();
        }
    }

    updateTopBar() {
        if (!window.gameState.playerTeam) return;

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

        const opponent = this.getNextOpponent();

        let html = `
            <div class="menu-box">
                <h2>監督室 - マネジメント</h2>
                <div style="margin: 20px 0; padding: 15px; background: #34495e; border-radius: 5px;">
                    <h3>次戦: ${opponent ? opponent.name : 'シーズン終了'}</h3>
                    <p>リーグ順位: ${this.getCurrentRank()}位</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button onclick="startGame()">試合開始 (AP:0)</button>
                    <button onclick="managementUI.showSquad()">編成・戦術</button>
                    <button onclick="managementUI.showEvents()">イベント (AP消費)</button>
                    <button onclick="managementUI.showStandings()">リーグ順位表</button>
                </div>
            </div>
        `;
        this.uiContent.innerHTML = html;
        this.uiContent.style.display = 'flex';
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

    showStandings() {
        const standings = window.gameState.league.getStandings();
        let html = `
            <div class="menu-box" style="width: 700px; max-height: 80vh; overflow-y: auto;">
                <h2>第${window.gameState.currentTier}部リーグ 順位表</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; text-align: center;">
                    <tr style="background: #444; border-bottom: 2px solid #666;">
                        <th style="padding: 10px;">順位</th>
                        <th style="text-align: left; padding: 10px;">チーム</th>
                        <th>勝点</th><th>勝</th><th>分</th><th>負</th><th>得</th><th>失</th><th>得失差</th>
                    </tr>
        `;

        standings.forEach((team, index) => {
            const isPlayer = team.isPlayerTeam;
            const targetRank = window.gameState.currentTier === 1 ? 1 : 2;
            const isTarget = index < targetRank;

            html += `
                <tr style="background: ${isPlayer ? '#2c3e50' : 'transparent'}; border-bottom: 1px solid #444; color: ${isTarget ? '#f1c40f' : '#fff'};">
                    <td style="padding: 8px;">${index + 1}</td>
                    <td style="text-align: left;">${team.name}</td>
                    <td style="font-weight: bold;">${team.points}</td>
                    <td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td>
                    <td>${team.goalsFor}</td><td>${team.goalsAgainst}</td><td>${team.goalDifference}</td>
                </tr>
            `;
        });

        html += `
                </table>
                <button style="margin-top: 20px; width: 100%;" onclick="managementUI.showDashboard()">戻る</button>
            </div>
        `;

        this.uiContent.innerHTML = html;
    }

    showSquad() {
        const team = window.gameState.playerTeam;
        let html = `
            <div class="menu-box" style="width: 700px; max-height: 80vh; overflow-y: auto;">
                <h2>編成・戦術</h2>

                <div style="margin-bottom: 15px; text-align: left;">
                    <label>フォーメーション:
                        <select onchange="managementUI.changeFormation(this.value)" style="background: #333; color: white; padding: 5px;">
                            ${team.manager.formations.map(f => `<option value="${f}" ${f === team.formation ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                    </label>
                </div>

                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <h3 style="background: #27ae60; padding: 5px;">スタメン (11人)</h3>
                        <ul style="list-style: none; padding: 0; text-align: left; font-size: 12px;">
        `;

        team.starting11.forEach(p => {
            html += `<li style="padding: 3px; border-bottom: 1px solid #444;">[${p.position}] ${p.name} (志向: ${p.preference})</li>`;
        });

        html += `
                        </ul>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="background: #f39c12; padding: 5px;">セット済みコマンド</h3>
                        <ul style="list-style: none; padding: 0; text-align: left; font-size: 14px;">
        `;

        team.microCommands.forEach(cmdId => {
            const cmd = window.MasterData.MicroCommands.find(c => c.id === cmdId);
            html += `<li style="padding: 5px; border-bottom: 1px solid #444;">${cmd ? cmd.name : 'Unknown'} (CD:${cmd.cooldown}s)</li>`;
        });

        html += `
                        </ul>
                    </div>
                </div>

                <button style="width: 100%;" onclick="managementUI.showDashboard()">戻る</button>
            </div>
        `;

        this.uiContent.innerHTML = html;
    }

    changeFormation(newForm) {
        window.gameState.playerTeam.formation = newForm;
    }

    showEvents() {
        // Generate random scout and shop offerings if not already generated for this turn
        if (!window.gameState.eventsGeneratedForTurn) {
            this.generateEvents();
            window.gameState.eventsGeneratedForTurn = true;
        }

        const events = window.gameState.currentEvents || [];
        const scoutHtml = events.filter(e => e.type === 'scout').map(e => `
            <div style="background: #333; padding: 15px; border-radius: 5px; border: 1px solid #27ae60;">
                <h3 style="color: #27ae60;">スカウト: ${e.player.name} (${e.player.position})</h3>
                <p>志向: ${e.player.preference}</p>
                <p>コスト: AP ${e.apCost} / ¥${e.fundCost.toLocaleString()}</p>
                <button onclick="managementUI.executeEvent('${e.id}')" ${window.gameState.ap < e.apCost || window.gameState.funds < e.fundCost ? 'disabled' : ''}>獲得</button>
            </div>
        `).join('');

        const shopHtml = events.filter(e => e.type === 'shop').map(e => `
            <div style="background: #333; padding: 15px; border-radius: 5px; border: 1px solid #f39c12;">
                <h3 style="color: #f39c12;">ショップ: ${e.item.name}</h3>
                <p>${e.itemType === 'relic' ? '宝物 (パッシブ効果)' : 'ミクロ (戦術コマンド)'}</p>
                <p>コスト: AP ${e.apCost} / ¥${e.fundCost.toLocaleString()}</p>
                <button onclick="managementUI.executeEvent('${e.id}')" ${window.gameState.ap < e.apCost || window.gameState.funds < e.fundCost ? 'disabled' : ''}>購入</button>
            </div>
        `).join('');

        let html = `
            <div class="menu-box" style="width: 800px; max-height: 80vh; overflow-y: auto;">
                <h2>イベント・ショップ</h2>
                <p>現在のAP: ${window.gameState.ap} / 資金: ¥${window.gameState.funds.toLocaleString()}</p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <!-- Fixed Events -->
                    <div style="background: #333; padding: 15px; border-radius: 5px;">
                        <h3>臨時練習</h3>
                        <p>APを3消費して、チーム全体のコンディションを回復する。</p>
                        <button onclick="managementUI.executeFixedEvent('training')" ${window.gameState.ap < 3 ? 'disabled' : ''}>実行 (AP:3)</button>
                    </div>
                    <div style="background: #333; padding: 15px; border-radius: 5px;">
                        <h3>スポンサー営業</h3>
                        <p>APを2消費して、資金を¥200,000獲得する。</p>
                        <button onclick="managementUI.executeFixedEvent('sponsor')" ${window.gameState.ap < 2 ? 'disabled' : ''}>実行 (AP:2)</button>
                    </div>

                    <!-- Dynamic Events (Scout & Shop) -->
                    ${scoutHtml}
                    ${shopHtml}
                </div>

                <button style="margin-top: 20px; width: 100%;" onclick="managementUI.showDashboard()">戻る</button>
            </div>
        `;
        this.uiContent.innerHTML = html;
    }

    generateEvents() {
        const events = [];

        // Generate 2 Scout events
        for(let i=0; i<2; i++) {
            const newPlayer = window.Player.generateRandom(`scout_${Date.now()}_${i}`);
            events.push({
                id: `evt_scout_${i}`,
                type: 'scout',
                player: newPlayer,
                apCost: 2,
                fundCost: 300000
            });
        }

        // Generate 2 Shop events (1 Relic, 1 Command)
        const unownedRelics = window.MasterData.Relics.filter(r => !window.gameState.playerTeam.relics.includes(r.id));
        if (unownedRelics.length > 0) {
            const randomRelic = unownedRelics[Math.floor(Math.random() * unownedRelics.length)];
            events.push({
                id: `evt_shop_relic`,
                type: 'shop',
                itemType: 'relic',
                item: randomRelic,
                apCost: 1,
                fundCost: 500000
            });
        }

        const unownedCmds = window.MasterData.MicroCommands.filter(c => !window.gameState.playerTeam.microCommands.includes(c.id));
        if (unownedCmds.length > 0) {
            const randomCmd = unownedCmds[Math.floor(Math.random() * unownedCmds.length)];
            events.push({
                id: `evt_shop_cmd`,
                type: 'shop',
                itemType: 'microCommand',
                item: randomCmd,
                apCost: 1,
                fundCost: 200000
            });
        }

        window.gameState.currentEvents = events;
    }

    executeFixedEvent(type) {
        if (type === 'training' && window.gameState.ap >= 3) {
            window.gameState.ap -= 3;
            window.gameState.playerTeam.players.forEach(p => p.condition = Math.min(100, p.condition + 20));
            alert("チームのコンディションが回復しました！");
        } else if (type === 'sponsor' && window.gameState.ap >= 2) {
            window.gameState.ap -= 2;
            window.gameState.funds += 200000;
            alert("資金を¥200,000獲得しました！");
        }

        this.showEvents(); // refresh
        this.updateTopBar();
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
        }

        // Remove event so it can't be bought again
        window.gameState.currentEvents.splice(eventIndex, 1);

        this.showEvents();
        this.updateTopBar();
    }

    showGameOver() {
        this.uiContent.innerHTML = `
            <div class="menu-box" style="background: #c0392b; color: white;">
                <h2>GAME OVER</h2>
                <p>あなたは監督を解任されました。</p>
                <button style="margin-top: 20px; background: white; color: black;" onclick="location.reload()">再挑戦</button>
            </div>
        `;
        this.uiContent.style.display = 'flex';
    }
}

// Global instance
let managementUI;
window.addEventListener('DOMContentLoaded', () => {
    managementUI = new ManagementUI();
});
