const fs = require('fs');

global.window = { MasterData: { Managers: [{ id: 1, preference: 'Possession' }, { id: 2, preference: 'Counter' }] } };
global.Phaser = { Math: { Distance: { Between: (x1,y1,x2,y2) => Math.hypot(x2-x1, y2-y1) }, Angle: { Between: (x1,y1,x2,y2) => Math.atan2(y2-y1, x2-x1) }, Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) }, Scene: class {} };
global.managementUI = { getNextOpponent: () => ({ managerId: 2, tactics: 'Counter' }) };
global.gameState = { playerTeam: { managerId: 1, tactics: 'Possession' } };

// Safely extract just the handleSetPiece method
let mainCode = fs.readFileSync('js/main.js', 'utf8');
let start = mainCode.indexOf('handleSetPiece(type, x, y, isPlayerTeam) {');
let endIdx = start;
let braces = 0;
for(let i=start; i<mainCode.length; i++) {
    if(mainCode[i] === '{') braces++;
    if(mainCode[i] === '}') { braces--; if(braces===0) { endIdx = i+1; break; } }
}
let handleSetPieceSrc = mainCode.substring(start, endIdx);
handleSetPieceSrc = handleSetPieceSrc.replace('handleSetPiece(type, x, y, isPlayerTeam) {', 'function(type, x, y, isPlayerTeam) {');

const mockScene = {
    playerTeamData: { manager: window.MasterData.Managers[0], tactics: 'Possession' },
    opponentTeamData: { manager: window.MasterData.Managers[1], tactics: 'Counter' },
    ball: { x:400, y:300, z:0, cooldown: 0, owner: null },
    playerSprites: [], opponentSprites: [],
    add: { text: () => ({ setOrigin: () => {} }) },
    handleSetPiece: null
};

eval('mockScene.handleSetPiece = ' + handleSetPieceSrc);

const pPos = ['GK', 'CB', 'CB', 'SB', 'SB', 'CDM', 'CM', 'CAM', 'WG', 'WG', 'CF'];
for(let i=0; i<11; i++) mockScene.playerSprites.push({ isPlayerTeam: true, x: 400, y: 300, playerData: { position: pPos[i], stats: { pass: 50 + i, physical: 50 - i, speed: 50 + i, shoot: 50 + i, mental: 50, defense: 50 } } });
for(let i=0; i<11; i++) mockScene.opponentSprites.push({ isPlayerTeam: false, x: 400, y: 300, playerData: { position: pPos[i], stats: { pass: 50 - i, physical: 50 + i, speed: 50 - i, shoot: 50 - i, mental: 50, defense: 50 + i } } });

mockScene.handleSetPiece('Goal Kick', 0, 300, true);
if (mockScene.ball.owner.playerData.position !== 'GK' || mockScene.ball.owner.x !== 35) throw new Error("GK taker failed in GK");

mockScene.handleSetPiece('Corner Kick', 790, 10, true);
if (mockScene.ball.owner.playerData.position !== 'CF') throw new Error("Corner Kick taker failed");

mockScene.handleSetPiece('Penalty Kick', 700, 300, true);
if (mockScene.ball.x !== 685) throw new Error("PK ball X not at PK spot");
mockScene.playerSprites.forEach(p => { if (p !== mockScene.ball.owner && p.playerData.position !== 'GK' && p.x > (785 - 185)) throw new Error("Player inside PK box: " + p.x); });

console.log("PASS: Phase 4 Set Pieces verification complete.");
