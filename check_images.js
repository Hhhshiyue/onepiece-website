const fs = require('fs');
const path = require('path');
const data = require('./data/characters.json');

const imageDir = path.join(__dirname, 'public', 'images', 'characters');

let existCount = 0;
let missingCount = 0;
const missing = [];

data.forEach(c => {
    const safeName = c.name.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeName}.jpg`;
    const localPath = path.join(imageDir, fileName);
    if (fs.existsSync(localPath)) {
        existCount++;
    } else {
        missingCount++;
        missing.push(c.name);
    }
});

console.log('存在:', existCount);
console.log('缺失:', missingCount);
console.log('缺失列表:', missing);
