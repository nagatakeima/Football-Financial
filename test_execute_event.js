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
                    choices: [
                        {
                            fundCost: 1000,
                            desc: 'テスト選択肢'
                        }
                    ]
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
        getElementById: (id) => {
            return {
                style: {},
                innerHTML: '',
                addEventListener: () => {},
                classList: { remove: () => {}, add: () => {} },
                appendChild: () => {}
            };
        },
        querySelector: () => ({ style: {}, innerHTML: '', addEventListener: () => {} }),
        createElement: () => { context.alertCalled = true; return { style: {}, innerHTML: '', appendChild: () => {}, classList: { add: () => {}, remove: () => {} }, remove: () => {} }; }
    },
    alertCalled: false,
    alert: (msg) => {
        context.alertCalled = true;
    },
    console: console,
    setTimeout: setTimeout
};

vm.createContext(context);

const code = fs.readFileSync('js/managementUI.js', 'utf8');
vm.runInContext(code, context);

vm.runInContext(`
    const ui = new ManagementUI();
    ui.showDashboard = () => {};
    ui.showEvents = () => {};
    ui.updateTopBar = () => {};
    ui.executeEvent('test_event', 0);
`, context);

if (context.window.gameState.ap === 0 && context.window.gameState.funds === 0 && context.alertCalled) {
    console.log("Test Passed: State unchanged and alert called for insufficient resources.");
} else {
    console.error("Test Failed", context.window.gameState);
    process.exit(1);
}
