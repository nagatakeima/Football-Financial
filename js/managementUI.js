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
        // Simplified event generation
        let html = `
            <div class="menu-box" style="width: 600px;">
                <h2>イベント・ショップ</h2>
                <p>現在のAP: ${window.gameState.ap} / 資金: ¥${window.gameState.funds.toLocaleString()}</p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <div style="background: #333; padding: 15px; border-radius: 5px;">
                        <h3>臨時練習</h3>
                        <p>APを3消費して、チーム全体のコンディションを回復する。</p>
                        <button onclick="managementUI.executeEvent('training')" ${window.gameState.ap < 3 ? 'disabled' : ''}>実行 (AP:3)</button>
                    </div>
                    <div style="background: #333; padding: 15px; border-radius: 5px;">
                        <h3>スポンサー営業</h3>
                        <p>APを2消費して、資金を¥200,000獲得する。</p>
                        <button onclick="managementUI.executeEvent('sponsor')" ${window.gameState.ap < 2 ? 'disabled' : ''}>実行 (AP:2)</button>
                    </div>
                </div>

                <button style="margin-top: 20px; width: 100%;" onclick="managementUI.showDashboard()">戻る</button>
            </div>
        `;
        this.uiContent.innerHTML = html;
    }

    executeEvent(type) {
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
