const fs = require('fs');

global.window = {};

// Load League
eval(fs.readFileSync('js/models/league.js', 'utf8'));

const teams = Array.from({length: 10}, (_, i) => ({ id: `team_${i}`, name: `Team ${i}` }));

const league = new window.League(3);
league.teams = teams;

league.generateSchedule();

let allPassed = true;

// 1. Verify 9 matchdays are generated
if (league.schedule.length !== 9) {
    console.error(`Expected 9 matchdays, but got ${league.schedule.length}`);
    allPassed = false;
} else {
    console.log("Passed: 9 matchdays generated.");
}

// 2. Verify 5 matches per matchday
let validMatches = true;
league.schedule.forEach((matchday, index) => {
    if (matchday.length !== 5) {
        console.error(`Matchday ${index + 1} does not have 5 matches, got ${matchday.length}`);
        validMatches = false;
        allPassed = false;
    }
});
if (validMatches) {
    console.log("Passed: 5 matches per matchday.");
}

// 3. Verify each team plays exactly once per matchday
let teamsPlayOnce = true;
league.schedule.forEach((matchday, index) => {
    const playedTeams = new Set();
    matchday.forEach(match => {
        if (playedTeams.has(match.home.id)) {
            console.error(`Team ${match.home.id} plays more than once on matchday ${index + 1}`);
            teamsPlayOnce = false;
            allPassed = false;
        }
        playedTeams.add(match.home.id);

        if (playedTeams.has(match.away.id)) {
            console.error(`Team ${match.away.id} plays more than once on matchday ${index + 1}`);
            teamsPlayOnce = false;
            allPassed = false;
        }
        playedTeams.add(match.away.id);
    });
});
if (teamsPlayOnce) {
    console.log("Passed: Each team plays exactly once per matchday.");
}

// 4. Verify all teams play against each other exactly once (Round Robin)
const matchups = new Map();
let validRoundRobin = true;

league.schedule.forEach(matchday => {
    matchday.forEach(match => {
        const ids = [match.home.id, match.away.id].sort();
        const key = `${ids[0]}-${ids[1]}`;
        matchups.set(key, (matchups.get(key) || 0) + 1);
    });
});

if (matchups.size !== 45) { // 10 * 9 / 2 = 45 unique matches
    console.error(`Expected 45 unique matchups, but got ${matchups.size}`);
    validRoundRobin = false;
    allPassed = false;
}

matchups.forEach((count, key) => {
    if (count !== 1) {
        console.error(`Matchup ${key} occurred ${count} times instead of 1`);
        validRoundRobin = false;
        allPassed = false;
    }
});

if (validRoundRobin) {
    console.log("Passed: All teams play each other exactly once.");
}

if (!allPassed) {
    process.exit(1);
} else {
    console.log("All tests passed successfully.");
}
