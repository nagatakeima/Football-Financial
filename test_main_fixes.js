const fs = require('fs');

global.window = {};
window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [], MicroCommands: [], Positions: []
};

const code = fs.readFileSync('js/main.js', 'utf8');

if (!code.includes('benchPlayer.dynamicStats = { ...benchPlayer.stats }') && !code.includes('benchPlayer.dynamicStats[k] =')) {
    console.log("Super Sub state leak fix missing");
} else {
    console.log("Super Sub state leak fix present");
}

if (!code.includes('p.x = Math.max(50, p.x - 150);') || !code.includes('cb.x = 600;')) {
    console.log("Coordinate direction fix missing");
} else {
    console.log("Coordinate direction fix present");
}
