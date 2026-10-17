const fs = require('fs');

const code = fs.readFileSync('js/main.js', 'utf8');

const expectedTexts = [
    'window.Player.getSkillEffectFor(interceptor.playerData, "SUCCESS_RATE_UP", "trap"',
    'window.Player.getSkillEffectFor(tackler.playerData, "SUCCESS_RATE_UP", "tackle"',
    'window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "shoot"',
    'window.Player.getSkillEffectFor(defendingGK.playerData, "SUCCESS_RATE_UP", "gkSave"',
    'window.Player.getSkillEffectFor(this.ball.owner.playerData, "SUCCESS_RATE_UP", "pass"'
];

let allPassed = true;
expectedTexts.forEach(text => {
    if (!code.includes(text)) {
        console.error("Missing skill logic: " + text);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("Verification Passed: Match engine generic skills are implemented.");
} else {
    process.exit(1);
}
