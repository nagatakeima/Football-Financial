const fs = require('fs');

global.window = {};

eval(fs.readFileSync('js/models/masterData.js', 'utf8'));
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

eval(fs.readFileSync('js/models/player.js', 'utf8'));
eval(fs.readFileSync('js/models/chemistry.js', 'utf8'));

const p1 = { stats: { pass: 50, speed: 50, defense: 50 }, preference: 'A', skills: [61, 1, 63] }; // Dynamo, PassMaster, Playmaker
const p2 = { stats: { pass: 50, speed: 50, defense: 50 }, preference: 'A', skills: [62] }; // Iron Man

// Add padding because formation links goes to 10
const starting11 = [];
for(let i=0; i<11; i++) {
    if (i === 1) starting11.push(p1); // LCB
    else if (i === 2) starting11.push(p2); // LSB
    else
    starting11.push({ stats: { pass: 50, speed: 50, defense: 50 }, preference: 'B', skills: [] });
}

const team = {
    starting11: starting11,
    formation: '4-4-2',
    relics: []
};

window.ChemistrySystem.calculateTeamChemistry(team);

if (p1.staminaConsumptionRate === 0.5) console.log("Dynamo passed");
if (p1.dynamicStats.pass >= 65) console.log("PassMaster passed");
if (p2.injuryRiskMultiplier <= 0.11) console.log("IronMan passed");
if (p2.dynamicStats.pass > p2.stats.pass) console.log("Playmaker passed");
