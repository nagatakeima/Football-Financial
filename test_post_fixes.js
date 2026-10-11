const fs = require('fs');

global.window = { addEventListener: () => {} };
global.document = { getElementById: () => ({}), querySelector: () => ({}) };

window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [], MicroCommands: [], Positions: []
};

// Test UI events loop fix
const code = fs.readFileSync('js/managementUI.js', 'utf8');
eval(code);

window.gameState = {
    currentEvents: [],
    playerTeam: true // to avoid calling showManagerSelection()
};
const ui = new ManagementUI();
// mock generate events to push a fixed event and a scout
ui.generateEvents = function() {
    window.gameState.currentEvents.push({type: 'scout'});
};
ui.uiContent = { innerHTML: "" };

ui.showEvents(); // Should call generateEvents
console.log("After first showEvents:", window.gameState.currentEvents.length); // 1

// Simulate buying the scout
window.gameState.currentEvents = []; // Now it's empty, but maybe we have a 'training' event if we refactored
