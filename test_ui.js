const fs = require('fs');
const content = fs.readFileSync('js/managementUI.js', 'utf8');

if (content.includes('generateEvents')) {
    console.log("generateEvents is present in the file.");
}
if (content.includes('executeEvent(')) {
    console.log("executeEvent is present in the file.");
}
