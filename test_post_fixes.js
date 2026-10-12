const fs = require('fs');

global.window = { addEventListener: () => {} };
global.document = {
    getElementById: () => ({ style: {}, innerHTML: '', addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } }),
    querySelector: () => ({ style: {}, innerHTML: '', addEventListener: () => {} }),
    createElement: () => ({ style: {}, innerHTML: '', appendChild: () => {} })
};
window.MasterData = {
    Managers: [], PlayerSkills: [], Relics: [], MicroCommands: [], Positions: []
};

window.gameState = {
    currentEvents: [],
    ap: 10,
    funds: 100000
};

// We will use vm to load it correctly
const vm = require('vm');
const context = {
    window: global.window,
    document: global.document,
    console: console,
    MasterData: window.MasterData
};
vm.createContext(context);
const code = fs.readFileSync('js/managementUI.js', 'utf8');
vm.runInContext(code, context);

vm.runInContext(`
    const ui = new ManagementUI();
    ui.generateEvents = function() {
        window.gameState.currentEvents.push({id: 'test_1', type: 'scout', player: {name: 'Test', position: 'FW'}, apCost: 10, fundCost: 1000});
    };
    ui.uiContent = { innerHTML: "" };

    ui.showEvents();
    console.log("After first showEvents:", window.gameState.currentEvents.length);

    window.gameState.currentEvents = [];
`, context);
