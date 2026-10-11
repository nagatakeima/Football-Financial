const fs = require('fs');

global.window = {};

window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [
        { id: 3, name: "Big Sponsor", effectType: "FUNDS_UP", value: 100000 },
        { id: 4, name: "Medical Staff", effectType: "CONDITION_RECOVERY", value: 10 }
    ], MicroCommands: [], Positions: []
};
eval(fs.readFileSync('js/models/gameState.js', 'utf8'));

const gs = window.gameState;
// mock league and team
gs.league = {
    schedule: [[
        { home: { isPlayerTeam: true, goalsFor: 0, goalsAgainst: 0, points: 0, wins: 0, losses: 0, draws: 0 }, away: { isPlayerTeam: false, goalsFor: 0, goalsAgainst: 0, points: 0, wins: 0, losses: 0, draws: 0 } }
    ]],
    currentMatchday: 1,
    simulateOtherMatches: () => {},
    recordMatchResult: () => {},
    totalMatchdays: 9,
    getStandings: () => [{isPlayerTeam: true, points: 0}]
};
gs.playerTeam = {
    relics: [3, 4],
    players: [{ condition: 50, stats: { stamina: 100 } }],
    points: 0
};
gs.funds = 0;
// test home loss (0 - 1) base is 100000
gs.processPostMatch(0, 1);

if (gs.funds === 200000) console.log("Funds matched (100k base + 100k relic)");
else console.log("Failed funds", gs.funds);

if (gs.playerTeam.players[0].condition === 80) console.log("Condition matched (50 + 20 base + 10 relic)");
else console.log("Failed condition", gs.playerTeam.players[0].condition);
