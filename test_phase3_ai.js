const fs = require('fs');
const vm = require('vm');
let code = fs.readFileSync('js/main.js', 'utf8');
code += "\nwindow.MatchScene = MatchScene;\n";

const context = vm.createContext({
    console: console,
    Math: Math,
    Phaser: {
        Math: {
            Clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
            Linear: (p1, p2, t) => p1 + (p2 - p1) * t,
            Distance: { Between: (x1,y1,x2,y2) => Math.sqrt((x1-x2)**2 + (y1-y2)**2) },
            Angle: {
                Between: (x1,y1,x2,y2) => Math.atan2(y2-y1, x2-x1),
                Wrap: (a) => {
                    while (a > Math.PI) a -= Math.PI * 2;
                    while (a < -Math.PI) a += Math.PI * 2;
                    return a;
                }
            }
        },
        Scene: class {}
    },
    window: {
        MasterData: {
            Formations: {
                "4-4-2": {
                    slots: [
                        { id: 1, baseMatrix: { tier: 'Defensive', lane: 'Center' }, offsetX: 50, offsetY: 300 },
                        { id: 2, baseMatrix: { tier: 'Defensive', lane: 'OutsideR' }, offsetX: 150, offsetY: 100 },
                        { id: 3, baseMatrix: { tier: 'Defensive', lane: 'Half-spaceR' }, offsetX: 130, offsetY: 220 },
                        { id: 4, baseMatrix: { tier: 'Defensive', lane: 'Half-spaceL' }, offsetX: 130, offsetY: 380 },
                        { id: 5, baseMatrix: { tier: 'Defensive', lane: 'OutsideL' }, offsetX: 150, offsetY: 500 }
                    ],
                    chemistryLinks: []
                }
            }
        },
        Player: {
            getSkillEffectFor: () => ({ value: 0, names: [] })
        }
    }
});

vm.runInContext(code, context);
const matchScene = new context.window.MatchScene();
matchScene.playerTeamData = { formation: "4-4-2" };
matchScene.opponentTeamData = { formation: "4-4-2" };
matchScene.ball = { x: 400, y: 300 };
matchScene.getBasePosition = () => ({ x: 200, y: 300 });

let passed = true;

const pSB = {
    isPlayerTeam: true,
    playerData: { isMob: false, position: 'SB', role: 'Inverted' },
    expectedPosStr: 'SB'
};
const basePosSB = matchScene.getDynamicBasePosition(pSB, true, true);
if (basePosSB.y !== 220 && basePosSB.y !== 380) {
    console.error("Test 1 Failed: Inverted SB did not move to half-space. Y is " + basePosSB.y);
    passed = false;
}

const pCF = {
    isPlayerTeam: true,
    playerData: { isMob: false, position: 'CF', role: 'False-9' },
    expectedPosStr: 'CF'
};
const basePosCF_Normal = matchScene.getDynamicBasePosition({ ...pCF, playerData: { isMob: false, position: 'CF', role: 'Poacher' } }, true, true);
const basePosCF_F9 = matchScene.getDynamicBasePosition(pCF, true, true);
if (basePosCF_F9.x >= basePosCF_Normal.x) {
    console.error("Test 2 Failed: False-9 did not drop deeper than Poacher.");
    passed = false;
}

if (passed) {
    console.log("Phase 3 AI tests passed.");
} else {
    process.exit(1);
}
