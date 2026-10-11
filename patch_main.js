const fs = require('fs');

let mainJs = fs.readFileSync('js/main.js', 'utf8');

// Apply CD reduction to command UI
mainJs = mainJs.replace(
    /const cmdData = window.MasterData.MicroCommands.find\(c => c.id === cmdId\);/g,
    `const cmdData = Object.assign({}, window.MasterData.MicroCommands.find(c => c.id === cmdId));
            if (!cmdData) return;

            // Apply Manager/Relic CD reduction
            let cdReduction = 0;
            this.playerTeamData.relics.forEach(relicId => {
                const r = window.MasterData.Relics.find(r => r.id === relicId);
                if (r && r.effectType === "CD_REDUCTION") cdReduction += r.value;
            });
            cmdData.cooldown = cmdData.cooldown * (1 - cdReduction);`
);

fs.writeFileSync('js/main.js', mainJs);
