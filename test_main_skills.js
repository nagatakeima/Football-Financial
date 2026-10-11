const fs = require('fs');

const code = fs.readFileSync('js/main.js', 'utf8');

const expectedTexts = [
    "this.ball.owner.playerData.skills.includes(1)",
    "this.ball.owner.playerData.skills.includes(9)",
    "this.ball.owner.playerData.skills.includes(3)",
    "benchPlayer.skills.includes(10)"
];

let allPassed = true;
expectedTexts.forEach(text => {
    if (!code.includes(text)) {
        console.error("Missing skill logic: " + text);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("Verification Passed: Match engine passive skills are implemented.");
}
