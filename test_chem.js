const fs = require('fs');

global.window = {};

// load chemistry.js
eval(fs.readFileSync('js/models/chemistry.js', 'utf8'));

const formations = ["4-4-2", "4-3-3", "3-2-4-1", "4-1-4-1", "4-2-3-1", "5-3-2", "4-3-1-2", "3-5-2"];
formations.forEach(f => {
    const links = window.ChemistrySystem.getFormationLinks(f);
    console.log(`Formation: ${f} -> ${links.length} links`);
});
