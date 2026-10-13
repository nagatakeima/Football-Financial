const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf-8');

// The second occurrence wasn't deleted properly? Let's check lines 900-950 to see what's actually there.
console.log(code.split('\\n').slice(900, 950).join('\\n'));
