const fs = require('fs');

const code = fs.readFileSync('js/managementUI.js', 'utf8');
if (code.includes('evt.itemType === \'relic\'') && code.includes('evt.type === \'scout\'')) {
    console.log("Verification Passed: The required logic exists in managementUI.js");
} else {
    console.error("Verification Failed");
}
