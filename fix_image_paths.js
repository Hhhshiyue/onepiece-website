const fs = require('fs');
const path = require('path');

const data = require('./data/characters.json');
const imageDir = path.join(__dirname, 'public', 'images', 'characters');

let changed = 0;

data.forEach(c => {
    if (!c.localImage) return;
    
    const fileName = path.basename(c.localImage);
    const localPath = path.join(imageDir, fileName);
    
    if (!fs.existsSync(localPath)) {
        c.localImage = '';
        changed++;
        console.log(`修正: ${c.name} - 移除不存在的图片路径`);
    }
});

fs.writeFileSync('data/characters.json', JSON.stringify(data, null, 2), 'utf-8');
console.log(`\n完成: 修改了 ${changed} 个角色的数据`);
