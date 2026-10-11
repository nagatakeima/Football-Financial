const fs = require('fs');

const code = fs.readFileSync('js/main.js', 'utf8');

const expectedTexts = [
    "slot.usesLeft <= 0",
    "if (slot.data.condition === \"behind\"",
    "this.activeBuff.target === 'defenseLine'",
    "this.activeBuff.target === 'intercept'",
    "actionType === 'powerPlay'"
];

let allPassed = true;
expectedTexts.forEach(text => {
    if (!code.includes(text)) {
        console.error("Missing logic: " + text);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("Verification Passed: Micro commands actions, buffs and condition logics are present.");
}
