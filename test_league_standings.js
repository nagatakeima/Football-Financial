const fs = require('fs');
global.window = {};

// Load the League model
eval(fs.readFileSync('js/models/league.js', 'utf8'));

const League = window.League;
const league = new League(1);

// Mock teams with specific points, GD, and GF
league.teams = [
    { name: 'Team A', points: 10, goalDifference: 5, goalsFor: 10 },
    { name: 'Team B', points: 12, goalDifference: 2, goalsFor: 15 },
    { name: 'Team C', points: 10, goalDifference: 5, goalsFor: 12 },
    { name: 'Team D', points: 10, goalDifference: 8, goalsFor: 8 },
    { name: 'Team E', points: 8, goalDifference: -2, goalsFor: 5 }
];

/*
Expected sort order (Points -> Goal Difference -> Goals For):
1. Team B (12 pts)
2. Team D (10 pts, +8 GD)
3. Team C (10 pts, +5 GD, 12 GF)
4. Team A (10 pts, +5 GD, 10 GF)
5. Team E (8 pts)
*/

const expectedOrder = ['Team B', 'Team D', 'Team C', 'Team A', 'Team E'];
const standings = league.getStandings();
const actualOrder = standings.map(t => t.name);

let passed = true;
if (actualOrder.length !== expectedOrder.length) {
    console.error(`Length mismatch. Expected ${expectedOrder.length}, got ${actualOrder.length}`);
    passed = false;
} else {
    for (let i = 0; i < expectedOrder.length; i++) {
        if (actualOrder[i] !== expectedOrder[i]) {
            console.error(`Position ${i+1} mismatch. Expected ${expectedOrder[i]}, got ${actualOrder[i]}`);
            passed = false;
        }
    }
}

if (passed) {
    console.log("League Standings test passed.");
    process.exit(0);
} else {
    console.error("League Standings test failed.");
    console.error("Actual standings: ", actualOrder);
    process.exit(1);
}
