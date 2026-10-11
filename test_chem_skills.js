const fs = require('fs');

global.window = {};

window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [], MicroCommands: [], Positions: []
};
eval(fs.readFileSync('js/models/chemistry.js', 'utf8'));

const p1 = { stats: { pass: 50, speed: 50, defense: 50 }, preference: 'A', skills: [2, 4, 7] }; // Dynamo, PassMaster, Playmaker
const p2 = { stats: { pass: 50, speed: 50, defense: 50 }, preference: 'A', skills: [8] }; // Iron Man

// Add padding because formation links goes to 10
const starting11 = [p1, p2];
for(let i=0; i<9; i++) {
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
if (p2.injuryRiskMultiplier === 0.1) console.log("IronMan passed");
if (p2.dynamicStats.pass > p2.stats.pass) console.log("Playmaker passed");
