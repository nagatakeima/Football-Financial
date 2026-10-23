const fs = require('fs');
let code = fs.readFileSync('js/managementUI.js', 'utf8');

const topBarRegex = /updateTopBar\(\) \{[\s\S]*?\}\n\n    showManagerSelection/m;
const newTopBar = `updateTopBar() {
        if (!window.gameState.playerTeam) return;
        this.topBar.style.display = 'flex';

        const rank = this.getCurrentRank();
        const targetRank = window.gameState.currentTier === 1 ? 1 : 2;
        const isSafe = rank <= targetRank;

        let relicsHtml = window.gameState.playerTeam.relics.map(relicId => {
            const relic = window.MasterData.Relics.find(r => r.id === relicId);
            if (!relic) return '';
            return \\\`<div class="relic-badge" data-tooltip="\\\${relic.description}">\\\${relic.name}</div>\\\`;
        }).join('');

        this.topBar.innerHTML = \\\`
            <div class="top-bar-row">
                <div class="top-bar-info">
                    <strong>\\\${window.gameState.playerTeam.name}</strong> |
                    Tier \\\${window.gameState.currentTier} - 第\\\${window.gameState.currentMatchday}節 |
                    <span style="color: \\\${isSafe ? '#2ecc71' : '#e74c3c'}">順位: \\\${rank}位 (解任: \\\${targetRank}位以下)</span> |
                    <span class="funds">資金: ¥\\\${window.gameState.funds.toLocaleString()}</span> |
                    <span class="ap">⚡ AP: \\\${window.gameState.ap}/10</span>
                </div>
                <div class="top-bar-actions">
                    <button onclick="managementUI.restTeam()" \\\${window.gameState.hasRestedThisTurn || window.gameState.ap < 1 ? 'disabled' : ''} class="rest-btn">🛌 休養する (AP:1 / 全員体力+30)</button>
                </div>
            </div>
            <div class="top-bar-row" style="margin-top: 10px;">
                <div class="top-bar-relics" style="display: flex; gap: 5px; flex: 1;">
                    \\\${relicsHtml}
                </div>
                <div class="global-nav">
                    <button onclick="managementUI.showSquad()">📋 編成・戦術ビルド</button>
                    <button onclick="managementUI.showEvents()">⚡ スカウト・強化 (AP)</button>
                    <button onclick="managementUI.showStandings()">🏆 順位表</button>
                    <button onclick="managementUI.showPreMatch()" style="background-color: #c0392b;">⚽ 次節へ（試合準備）</button>
                </div>
            </div>
        \\\`;
    }

    showManagerSelection`;

code = code.replace(topBarRegex, newTopBar);

const dashRegex = /showDashboard\(\) \{[\s\S]*?restTeam\(\) \{/m;
const newDash = `showDashboard() {
        this.showSquad();
    }

    restTeam() {`;

code = code.replace(dashRegex, newDash);
fs.writeFileSync('js/managementUI.js', code);
