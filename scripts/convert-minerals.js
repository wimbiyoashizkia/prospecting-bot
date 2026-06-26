const fs = require('fs');
const path = require('path');

const minerals = require('../data/minerals.js');

const outputPath = path.join(__dirname, '../docs/minerals.json');

fs.writeFileSync(outputPath, JSON.stringify(minerals, null, 2));

console.log('minerals.json copied to docs/');
