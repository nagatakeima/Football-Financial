const fs = require('fs');
let mainJs = fs.readFileSync('js/main.js', 'utf8');

// Fix the SyntaxError and Missing offX in spawnTeams
// First let's remove the duplicated const tier from previous faulty patch
// We need to replace the entire block carefully
mainJs = mainJs.replace(
    /let pos = this\.getBasePosition\(expectedPosStr, true\);\s*const tier = slotDef\.baseMatrix \? slotDef\.baseMatrix\.tier : 'Middle';\s*if \(isGK\) \{ pos\.x = 50; \}\s*else if \(tier === 'Defensive' \|\| expectedPosStr === 'CB' \|\| expectedPosStr === 'SB'\) \{ pos\.x = 160; \}\s*else if \(tier === 'Middle' \|\| expectedPosStr === 'CDM' \|\| expectedPosStr === 'CM' \|\| expectedPosStr === 'SH'\) \{ pos\.x = 280; \}\s*else \{ pos\.x = 360; \}/g,
    `let pos = this.getBasePosition(expectedPosStr, true);
            const tier = slotDef.baseMatrix ? slotDef.baseMatrix.tier : 'Middle';
            const offX = slotDef.offsetX || 0;
            if (isGK) { pos.x = 50; }
            else if (tier === 'Defensive' || expectedPosStr === 'CB' || expectedPosStr === 'SB') { pos.x = 160 + offX; }
            else if (tier === 'Middle' || expectedPosStr === 'CDM' || expectedPosStr === 'CM' || expectedPosStr === 'SH') { pos.x = 280 + offX; }
            else { pos.x = 360 + offX; }`
);

mainJs = mainJs.replace(
    /let pos = this\.getBasePosition\(expectedPosStr, false\);\s*const tierOpp = slotDef\.baseMatrix \? slotDef\.baseMatrix\.tier : 'Middle';\s*if \(isGK\) \{ pos\.x = 750; \}\s*else if \(tierOpp === 'Defensive' \|\| expectedPosStr === 'CB' \|\| expectedPosStr === 'SB'\) \{ pos\.x = 640; \}\s*else if \(tierOpp === 'Middle' \|\| expectedPosStr === 'CDM' \|\| expectedPosStr === 'CM' \|\| expectedPosStr === 'SH'\) \{ pos\.x = 520; \}\s*else \{ pos\.x = 440; \}/g,
    `let pos = this.getBasePosition(expectedPosStr, false);
            const tierOpp = slotDef.baseMatrix ? slotDef.baseMatrix.tier : 'Middle';
            const offXOpp = slotDef.offsetX || 0;
            if (isGK) { pos.x = 750; }
            else if (tierOpp === 'Defensive' || expectedPosStr === 'CB' || expectedPosStr === 'SB') { pos.x = 640 - offXOpp; }
            else if (tierOpp === 'Middle' || expectedPosStr === 'CDM' || expectedPosStr === 'CM' || expectedPosStr === 'SH') { pos.x = 520 - offXOpp; }
            else { pos.x = 440 - offXOpp; }`
);

// Point 5: Set Piece Overlap Spread
mainJs = mainJs.replace(
    /\[\.\.\.this\.playerSprites, \.\.\.this\.opponentSprites\]\.forEach\(p => \{([\s\S]*?)let angle = Phaser\.Math\.Angle\.Between\(x, y, 400, 300\); \/\/ Towards center instead of pushing outwards\s*p\.x = x \+ Math\.cos\(angle\) \* 90; p\.y = y \+ Math\.sin\(angle\) \* 90;/,
    `[...this.playerSprites, ...this.opponentSprites].forEach((p, idx) => {
             if (p !== taker && Phaser.Math.Distance.Between(p.x, p.y, x, y) < 80) {
                 let angle = Phaser.Math.Angle.Between(x, y, 400, 300); // Towards center instead of pushing outwards
                 angle += (idx - 5) * 0.15; // Point 5: Disperse to prevent stacking
                 p.x = x + Math.cos(angle) * 90; p.y = y + Math.sin(angle) * 90;`
);

fs.writeFileSync('js/main.js', mainJs);

// 2. gameState.js Fixes
let gsJs = fs.readFileSync('js/models/gameState.js', 'utf8');

// Point 3: 6 initial commands
gsJs = gsJs.replace(
    /this\.playerTeam\.microCommands = window\.MasterData\.MicroCommands\s*\.sort\(\(\) => 0\.5 - Math\.random\(\)\)\s*\.slice\(0, 4\)\s*\.map\(cmd => cmd\.id\);\s*this\.playerTeam\.ownedMicroCommands = \[\.\.\.this\.playerTeam\.microCommands\];/,
    `const randomCmds = window.MasterData.MicroCommands.sort(() => 0.5 - Math.random()).slice(0, 6).map(c => c.id);
        this.playerTeam.ownedMicroCommands = [...randomCmds];
        this.playerTeam.microCommands = randomCmds.slice(0, 4);`
);

fs.writeFileSync('js/models/gameState.js', gsJs);

// 3. managementUI.js Fixes
let muiJs = fs.readFileSync('js/managementUI.js', 'utf8');

// Point 3: updateMicroCommand screen transitions
muiJs = muiJs.replace(
    /updateMicroCommand\(slotIndex, cmdId\) \{([\s\S]*?)this\.showDashboard\(\);\s*\}/,
    `updateMicroCommand(slotIndex, cmdId, fromScreen) {
        if (!window.gameState.playerTeam) return;
        window.gameState.playerTeam.microCommands[slotIndex] = cmdId ? Number(cmdId) : null;
        if (fromScreen === 'squad') this.showSquad();
        else if (fromScreen === 'prematch') this.showPreMatch();
        else this.showDashboard();
    }`
);

muiJs = muiJs.replace(
    /onchange="managementUI\.updateMicroCommand\(\$\{i\}, this\.value\)"/g,
    `onchange="managementUI.updateMicroCommand(\${i}, this.value, 'squad')"`
);

// We need to fix the one in showPreMatch specifically
if (muiJs.includes('showPreMatch')) {
   let idxPreMatch = muiJs.indexOf('showPreMatch');
   let strBefore = muiJs.substring(0, idxPreMatch);
   let strAfter = muiJs.substring(idxPreMatch);
   strAfter = strAfter.replace(
        /onchange="managementUI\.updateMicroCommand\(\$\{i\}, this\.value, 'squad'\)"/,
        `onchange="managementUI.updateMicroCommand(\${i}, this.value, 'prematch')"`
   );
   muiJs = strBefore + strAfter;
}

// Point 6: UI Elements

// Pitch icon (Add *)
muiJs = muiJs.replace(
    /<span style="font-weight: bold;">\$\{isMob \? '⚠️ ' : ''\}\$\{p\.position\}<\/span>/,
    `<span style="font-weight: bold;">\${isMob ? '⚠️ ' : ''}\${p.position}\${isSubPos ? '*' : ''}</span>`
);
// Fallback if the previous regex didn't match the innerHTML completely
const pDivPattern = /pDiv\.innerHTML = \`([\s\S]*?)>(\$\{p\.position\}|\$\{expectedPos\})<\/(div|span)>([\s\S]*?)\`;/g;
muiJs = muiJs.replace(pDivPattern, `pDiv.innerHTML = \`$1>\${p.position}\${isSubPos ? '*' : ''}</$3>$4\`;`);

// Bench List
muiJs = muiJs.replace(
    /bDiv\.innerHTML = \`<span>\[\$\{p\.position\}\] \$\{p\.role \? p\.role : ''\} \$\{p\.name\}<\/span> <span>志向: \$\{p\.preference\.substring\(0,1\)\} 疲: \$\{100-p\.condition\}<\/span>\`;/g,
    `bDiv.innerHTML = \`<span>[\${p.position}\${p.subPositions.length > 0 ? '/サブ:' + p.subPositions.join(',') : ''}] \${p.role ? p.role : ''} \${p.name}</span> <span>志向: \${p.preference.substring(0,1)} 疲: \${100-p.condition}</span>\`;`
);

// Scout Detail Screen
muiJs = muiJs.replace(
    /<p>ポジション: \$\{e\.player\.position\}<\/p>/,
    `<p>メイン適性: \${e.player.position} / サブ適性: \${e.player.subPositions.join(', ')}</p><p>役割(ロール): \${e.player.role}</p><p>所持スキル: \${e.player.skills.map(sId => window.MasterData.PlayerSkills.find(s => s.id === sId)?.name).filter(n=>n).join(', ') || 'なし'}</p>`
);

fs.writeFileSync('js/managementUI.js', muiJs);
