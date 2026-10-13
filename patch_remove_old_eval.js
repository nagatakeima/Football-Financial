const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf-8');

// Find the second evaluateActions(p, context) which is at line 928
// It's the old one that I failed to replace correctly.
// Instead of complex regex, let's just find the second occurrence and delete its block.

const searchString = '    evaluateActions(p, context) {';
let firstIndex = code.indexOf(searchString);
if (firstIndex !== -1) {
    let secondIndex = code.indexOf(searchString, firstIndex + 1);

    if (secondIndex !== -1) {
        // Find the matching closing brace for the second occurrence
        let braceCount = 0;
        let endIdx = -1;
        for (let i = secondIndex; i < code.length; i++) {
            if (code[i] === '{') braceCount++;
            if (code[i] === '}') braceCount--;
            if (braceCount === 0 && i > secondIndex) {
                endIdx = i;
                break;
            }
        }

        if (endIdx !== -1) {
            const blockToDelete = code.substring(secondIndex, endIdx + 1);
            code = code.replace(blockToDelete, '');
            fs.writeFileSync('js/main.js', code);
            console.log("Deleted the old evaluateActions block.");
        } else {
            console.log("Could not find end of old block.");
        }
    } else {
         console.log("Second occurrence not found. Maybe it's already gone?");
    }
} else {
    console.log("No evaluateActions found at all.");
}
