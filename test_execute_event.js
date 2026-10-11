const fs = require('fs');
const vm = require('vm');

const context = {
    window: {
        addEventListener: () => {},
        gameState: {
            ap: 0,
            funds: 0,
            currentEvents: [
                {
                    id: 'test_event',
                    type: 'scout',
                    apCost: 10,
                    fundCost: 1000,
                    player: { name: 'Test Player' }
                }
            ],
            playerTeam: {
                name: 'Test Team',
                players: [],
                bench: []
            }
        }
    },
    document: {
        getElementById: () => ({ style: {}, innerHTML: '', addEventListener: () => {} }),
        querySelector: () => ({ style: {}, innerHTML: '', addEventListener: () => {} }),
        createElement: () => ({ style: {}, innerHTML: '', appendChild: () => {} })
    },
    alertCalled: false,
    alert: (msg) => {
        context.alertCalled = true;
    },
    console: console
};

vm.createContext(context);

const code = fs.readFileSync('js/managementUI.js', 'utf8');
vm.runInContext(code, context);

vm.runInContext(`
    const ui = new ManagementUI();
    ui.showDashboard = () => {};
    ui.showEvents = () => {};
    ui.updateTopBar = () => {};
    ui.executeEvent('test_event');
`, context);

if (context.window.gameState.ap === 0 && context.window.gameState.funds === 0 && context.alertCalled) {
    console.log("Test Passed: State unchanged and alert called for insufficient resources.");
} else {
    console.error("Test Failed", context.window.gameState);
    process.exit(1);
}
