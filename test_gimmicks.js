const fs = require('fs');

const code = fs.readFileSync('js/main.js', 'utf8');

const expectedTexts = [
    "this.gimmicks = [\"none\", \"fever\", \"fortress\", \"badWeather\"];",
    "if (this.currentGimmick === 'badWeather')",
    "if (this.currentGimmick === 'fever' && this.matchTime < 45)",
    "if (this.currentGimmick === 'fortress')"
];

let allPassed = true;
expectedTexts.forEach(text => {
    if (!code.includes(text)) {
        console.error("Missing logic: " + text);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("Verification Passed: Match Gimmicks logics are present.");
}
