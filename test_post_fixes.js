const fs = require('fs');

global.window = {};
window.addEventListener = function() {};

window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [], MicroCommands: [], Positions: []
};

// Test UI events loop fix
eval(fs.readFileSync('js/managementUI.js', 'utf8'));

window.gameState = {
    currentEvents: []
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
// The fix was to check `some(e => e.type === 'scout' || e.type === 'shop')`. So if empty, it'll generate again (which is correct behavior for a new turn, but within a turn we shouldn't wipe everything if it means restocking infinitely).
// Wait, the reviewer said: "The condition `if (!window.gameState.currentEvents || window.gameState.currentEvents.length === 0)` in `showEvents()` means that if a user has enough resources to buy all available items, the array becomes empty, and the shop will instantly restock itself with new items in the same turn."
