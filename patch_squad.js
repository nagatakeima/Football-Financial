const fs = require('fs');
let code = fs.readFileSync('js/managementUI.js', 'utf8');

const squadRegex = /showSquad\(\) \{[\s\S]*?renderFormation\(\);\n    \}/m;
const newSquad = `showSquad() {
        const team = window.gameState.playerTeam;
        window.ChemistrySystem.calculateTeamChemistry(team); // Ensure chemistry is calculated

        let html = \\\`
            <div class="menu-box ui-layout-container" style="background: transparent; border: none; padding: 0;">

                <!-- Left Column: Pitch -->
                <div class="ui-panel" style="flex: 0 0 380px; padding: 15px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px;">
                        <label>
                            <select onchange="managementUI.changeFormation(this.value)" style="background: #333; color: white; padding: 5px; font-size: 14px; border-radius: 4px;">
                                \\\${team.manager.formations.map(f => \\\`<option value="\\\${f}" \\\${f === team.formation ? 'selected' : ''}>\\\${f}</option>\\\`).join('')}
                            </select>
                        </label>
                        <div style="font-size: 12px; text-align: right;">
                            <span style="color: #f1c40f; font-weight: bold;">スタメン平均OVR: \\\${Math.floor(team.starting11.reduce((sum, p) => sum + p.getOvr(), 0) / 11)}</span><br>
                            <span style="color: #3498db;">発動ケミストリー数: \\\${team.chemistryLinks.length}本</span>
                        </div>
                    </div>

                    <div style="flex: 1; background: #1e3a29; border: 2px solid #27ae60; position: relative; border-radius: 5px; overflow: hidden; min-height: 400px;" id="pitch-area">
                        <canvas id="chem-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
                        <div style="position:absolute; top: 5px; width: 100%; text-align: center; color: rgba(255,255,255,0.5); font-weight: bold; font-size: 12px; pointer-events: none; z-index: 1;">▲ FW / ATTACK</div>
                        <div style="position:absolute; bottom: 5px; width: 100%; text-align: center; color: rgba(255,255,255,0.5); font-weight: bold; font-size: 12px; pointer-events: none; z-index: 1;">▼ GK / DEFENSE</div>
                        <div id="formation-container" style="position: relative; width: 100%; height: 100%;"></div>
                    </div>

                    <div style="font-size: 10px; text-align: center; margin-top: 5px;">
                        【戦術志向】 <span style="color: #3498db;">■ポゼッション</span> <span style="color: #e74c3c;">■カウンター</span> <span style="color: #f1c40f;">■ハイプレス</span> <span style="color: #2ecc71;">■リトリート</span>
                    </div>
                </div>

                <!-- Center Column: Bench & Commands -->
                <div class="ui-panel" style="flex: 1; display: flex; flex-direction: column;">
                    <h3 style="background: #2c3e50; padding: 5px 10px; font-size: 14px; border-radius: 4px;">ベンチ (7名)</h3>
                    <div id="bench-container" style="display: flex; flex-direction: column; gap: 4px; padding: 5px 0;">
                        <!-- Bench players injected here -->
                    </div>

                    <h3 style="background: #9b59b6; padding: 5px 10px; font-size: 14px; border-radius: 4px; margin-top: auto;">戦術コマンド編成</h3>
                    <div style="display: flex; flex-direction: column; gap: 5px; padding: 5px 0;">
                        \\\${[0, 1, 2, 3].map(i => {
                            const currentCmdId = team.microCommands[i];
                            const availableCmds = window.MasterData.MicroCommands.filter(c =>
                                !team.microCommands.includes(c.id) || c.id === currentCmdId
                            );
                            const currentCmd = window.MasterData.MicroCommands.find(c => c.id === currentCmdId);
                            const desc = currentCmd ? currentCmd.description : '未設定';

                            return \\\`
                                <div style="background: #333; padding: 5px; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: bold; width: 50px;">Slot \\\${i+1}</span>
                                    <select style="background: #222; color: #fff; padding: 2px; flex: 1;" onchange="managementUI.updateMicroCommand(\\\${i}, this.value, 'squad')">
                                        <option value="">-- 外す --</option>
                                        \\\${availableCmds.map(c => \\\`<option value="\\\${c.id}" \\\${c.id === currentCmdId ? 'selected' : ''}>\\\${c.name}</option>\\\`).join('')}
                                    </select>
                                    <div style="font-size: 10px; color: #aaa; width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="\\\${desc}">\\\${desc}</div>
                                </div>
                            \\\`;
                        }).join('')}
                    </div>
                </div>

                <!-- Right Column: Details & Comparison -->
                <div class="ui-panel" id="player-detail-panel" style="flex: 1.2; display: flex; flex-direction: column;">
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #aaa;">
                        選手を選択すると詳細が表示されます
                    </div>
                </div>

            </div>
        \\\`;

        this.uiContent.innerHTML = html;
        this.selectedPlayerIndex = null;
        this.swapSourceIndex = null;
        this.renderFormation();
    }`;

code = code.replace(squadRegex, newSquad);

const detailsRegex = /renderPlayerDetailCard\([\s\S]*?renderFormation\(\) \{/m;
const newDetail = `renderPlayerDetailCard(player, index) {
        const detailPanel = document.getElementById('player-detail-panel');
        if (!detailPanel) return;
        if (!player) {
            detailPanel.innerHTML = \\\`<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #aaa;">選手を選択すると詳細が表示されます</div>\\\`;
            return;
        }

        const rarityColors = { 'N': '#7f8c8d', 'R': '#3498db', 'SR': '#9b59b6', 'SSR': '#f1c40f' };
        const rarityColor = rarityColors[player.rarity] || rarityColors['N'];
        const isMax = player.level >= 10;

        const statBarsHtml = Object.entries(player.stats).map(([key, val]) => {
            let color = '#e74c3c';
            if(val >= 80) color = '#f1c40f';
            else if(val >= 60) color = '#2ecc71';
            else if(val >= 40) color = '#3498db';

            const label = {pass: 'Pass', shoot: 'Shoot', defense: 'Defense', physical: 'Physical', speed: 'Speed', mental: 'Mental', stamina: 'Stamina'}[key];
            return \\\`
                <div style="display: flex; align-items: center; font-size: 11px; margin-bottom: 2px;">
                    <span style="width: 45px;">\\\${label}</span>
                    <div style="flex: 1; background: #333; height: 8px; border-radius: 4px; margin: 0 4px; overflow: hidden;">
                        <div style="width: \\\${val}%; background: \\\${color}; height: 100%;"></div>
                    </div>
                    <span style="width: 18px; text-align: right;">\\\${val}</span>
                </div>
            \\\`;
        }).join('');

        const skillsHtml = player.skills.length > 0 ? player.skills.map(sId => {
            const s = window.MasterData.PlayerSkills.find(sk => sk.id === sId);
            if (!s) return '';
            return \\\`<div style="background: #2c3e50; padding: 3px; margin-bottom: 2px; border-radius: 3px; font-size: 10px;">
                <strong>\\\${s.name}</strong>: \\\${s.description}
            </div>\\\`;
        }).join('') : '<div style="font-size: 11px; color: #777;">なし</div>';

        const expPercent = isMax ? 100 : (player.exp / player.maxExp) * 100;
        const roleJp = player.role || 'なし';

        let html = \\\`
            <h3 style="background: #27ae60; padding: 5px 10px; font-size: 14px; border-radius: 4px;">\\\${this.swapSourceIndex !== null ? '入れ替え候補' : '選手詳細'}</h3>
            <div style="display: flex; flex-direction: column; flex: 1; overflow-y: auto; padding: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px; border-bottom: 1px solid #444; padding-bottom: 5px;">
                    <div>
                        <span style="font-size: 10px; font-weight: bold; background: \\\${rarityColor}; color: \\\${player.rarity === 'SSR' ? '#000' : '#fff'}; padding: 1px 3px; border-radius: 2px; margin-right: 4px;">\\\${player.rarity}</span>
                        <span style="font-size: 16px; font-weight: bold;">[\\\${player.position}] \\\${player.name}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 18px; font-weight: bold; color: #f1c40f;">OVR: \\\${player.getOvr()}</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px;">
                    <span>Lv.\\\${player.level} \\\${isMax ? '(MAX)' : ''}</span>
                    <span style="color: #3498db;">\\\${player.preference || 'バランス'}</span>
                </div>

                <div style="background: #333; height: 4px; border-radius: 2px; margin-bottom: 10px; overflow: hidden;">
                    <div style="width: \\\${expPercent}%; background: #2ecc71; height: 100%;"></div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <!-- Left: Stats -->
                    <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        \\\${statBarsHtml}
                    </div>

                    <!-- Right: Info -->
                    <div style="flex: 1;">
                        <div style="margin-bottom: 5px; font-size: 11px;">
                            <strong>適性:</strong> \\\${player.subPositions.length > 0 ? player.subPositions.join(', ') : 'なし'}<br>
                            <strong>役割:</strong> \\\${roleJp}
                        </div>
                        <h4 style="border-bottom: 1px solid #444; padding-bottom: 2px; margin-bottom: 2px; font-size: 11px;">スキル</h4>
                        \\\${skillsHtml}
                    </div>
                </div>
            </div>
        \\\`;

        if (this.swapSourceIndex !== null && this.swapSourceIndex !== index) {
            const team = window.gameState.playerTeam;
            const srcPlayer = this.swapSourceIndex < 11 ? team.starting11[this.swapSourceIndex] : team.bench[this.swapSourceIndex - 11];

            html += \\\`
                <div style="border-top: 2px dashed #f1c40f; padding-top: 10px; margin-top: 5px; display: flex; flex-direction: column; gap: 5px;">
                    <div style="text-align: center; font-size: 12px; color: #f1c40f;">🔄 \\\${srcPlayer.name} (OVR \\\${srcPlayer.getOvr()}) と入れ替えますか？</div>
                    <button style="width: 100%; padding: 10px; font-size: 16px; background: #e74c3c; font-weight: bold; border-radius: 4px;" onclick="managementUI.handlePlayerClick(\\\${index}, true)">⚡ この2人を入れ替える</button>
                </div>
            \\\`;
        }

        detailPanel.innerHTML = html;
    }

    renderFormation() {`;

code = code.replace(detailsRegex, newDetail);
fs.writeFileSync('js/managementUI.js', code);
