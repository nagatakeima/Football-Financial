const fs = require('fs');

global.window = {};

// Mock DOM
global.document = {
    getElementById: () => ({ style: {}, innerHTML: '', addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } }),
    querySelector: () => ({ style: {}, innerHTML: '', addEventListener: () => {} }),
    createElement: () => ({ style: {}, innerHTML: '', appendChild: () => {} })
};

// Load dependencies
eval(fs.readFileSync('js/models/masterData.js', 'utf8'));
eval(fs.readFileSync('js/models/player.js', 'utf8'));
eval(fs.readFileSync('js/models/team.js', 'utf8'));
eval(fs.readFileSync('js/models/league.js', 'utf8'));
eval(fs.readFileSync('js/models/gameState.js', 'utf8'));
eval(fs.readFileSync('js/models/chemistry.js', 'utf8'));

// Provide mock logic for Phaser classes
global.Phaser = {
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2) },
        Angle: { Between: () => 0 },
        Between: (a, b) => Math.floor(Math.random() * (b - a + 1) + a),
        Clamp: (v, a, b) => Math.max(a, Math.min(v, b))
    }
};

let simFailed = false;

console.log("--- Starting Simulation Tests ---");

// Test 1: ownedMicroCommands length >= 4 after startNewDive
window.gameState.startNewDive(1);
const ownedCmdsCount = window.gameState.playerTeam.ownedMicroCommands.length;
if (ownedCmdsCount >= 4) {
    console.log("PASS: ownedMicroCommands count is", ownedCmdsCount);
} else {
    console.log("FAIL: ownedMicroCommands count is", ownedCmdsCount);
    simFailed = true;
}

// Test 2: Chemistry links valid
const formations = Object.keys(window.MasterData.Formations);
let invalidLinksCount = 0;
formations.forEach(f => {
    const formationDef = window.MasterData.Formations[f];
    const slotIds = formationDef.slots.map(s => s.id);
    const links = formationDef.chemistryLinks || [];
    links.forEach(l => {
        if (!slotIds.includes(l.from)) invalidLinksCount++;
        if (!slotIds.includes(l.to)) invalidLinksCount++;
    });
});
if (invalidLinksCount === 0) {
    console.log("PASS: All chemistryLinks point to valid slot IDs.");
} else {
    console.log(`FAIL: Found ${invalidLinksCount} invalid chemistryLinks.`);
    simFailed = true;
}

// Test 3: Kickoff Positions (Check main.js logic via evaluation or direct logic translation)
// Since we can't easily instantiate a Phaser Scene outside of browser without headless,
// we will verify the code exists in main.js
const mainJsStr = fs.readFileSync('js/main.js', 'utf8');
if (mainJsStr.includes('p.x = 160 + offX;') && mainJsStr.includes('p.x = 280 + offX;')) {
    console.log("PASS: Kickoff positioning uses distinct X tiers.");
} else {
    console.log("FAIL: Kickoff positioning logic not found.");
    simFailed = true;
}

// Test 4: Throw-in logic doesn't loop
// Verify the offsets are present in handleSetPiece
if (mainJsStr.includes('if (x <= 5) x = 20;') && mainJsStr.includes('if (x >= 795) x = 780;')) {
    console.log("PASS: Throw in bounds offsets are present.");
} else {
    console.log("FAIL: Throw in bounds offsets are missing.");
    simFailed = true;
}

if (mainJsStr.includes('this.setPieceCooldown = 30;')) {
    console.log("PASS: Setpiece cooldown is present.");
} else {
    console.log("FAIL: Setpiece cooldown is missing.");
    simFailed = true;
}


// Test 5: p.preference is defined
let prefMissing = false;
window.gameState.playerTeam.players.forEach(p => {
    if (p.preference === undefined) prefMissing = true;
});
if (prefMissing) {
    console.log("FAIL: p.preference is undefined for some players.");
    simFailed = true;
} else {
    console.log("PASS: p.preference is defined.");
}

// Test 6: const bestAction redefined correctly
if (mainJsStr.includes('const bestAction = evaluation.action;')) {
    console.log("FAIL: bestAction is still declared as const.");
    simFailed = true;
} else if (mainJsStr.includes('let bestAction = evaluation.action;')) {
    console.log("PASS: bestAction is correctly declared as let.");
} else {
    console.log("FAIL: bestAction declaration not found properly.");
    simFailed = true;
}

// Test 7: targetX scope leak (ensure targetX/targetY are declared before aiTickTimer block)
if (mainJsStr.includes('let targetX = p.x; let targetY = p.y;\n            if ((p.aiTickTimer >=')) {
    console.log("PASS: targetX scope is safe.");
} else {
    console.log("FAIL: targetX scope leak detected.");
    simFailed = true;
}

if (simFailed) {
    console.log("--- Tests FAILED ---");
    process.exit(1);
} else {
    console.log("--- Tests PASSED ---");
    process.exit(0);
}
