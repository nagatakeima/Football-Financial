const fs = require('fs');

global.window = {};

window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [
        { id: 1, name: "Spikes", effectType: "STAT_UP", target: "speed", value: 10 },
        { id: 5, name: "Local Fans", effectType: "ALL_STAT_UP", value: 5 },
        { id: 10, name: "Veteran", effectType: "LOW_STAT_BOOST", threshold: 40, value: 10 }
    ], MicroCommands: [], Positions: []
};

if (!window.MasterData) window.MasterData = {};
if (!window.MasterData.Formations) {
    window.MasterData.Formations = {
        "4-4-2": { chemistryLinks: [] },
        "4-3-3": { chemistryLinks: [] },
        "3-2-4-1": { chemistryLinks: [] },
        "4-1-4-1": { chemistryLinks: [] },
        "4-2-3-1": { chemistryLinks: [] },
        "5-3-2": { chemistryLinks: [] },
        "4-3-1-2": { chemistryLinks: [] },
        "3-5-2": { chemistryLinks: [] }
    };
}

eval(fs.readFileSync('js/models/chemistry.js', 'utf8'));

const p1 = { stats: { pass: 30, speed: 50 }, preference: 'A', skills: [] };

const starting11 = [p1];
for(let i=0; i<10; i++) {
    starting11.push({ stats: { pass: 50, speed: 50 }, preference: 'B', skills: [] });
}

const team = {
    starting11: starting11,
    formation: '4-4-2',
    relics: [1, 5, 10]
};

window.ChemistrySystem.calculateTeamChemistry(team);

if (p1.dynamicStats.speed === 65) console.log("Spikes + Fans speed passed");
else console.log("Failed speed: ", p1.dynamicStats.speed);

if (p1.dynamicStats.pass === 45) console.log("Veteran + Fans pass passed");
else console.log("Failed pass: ", p1.dynamicStats.pass);
