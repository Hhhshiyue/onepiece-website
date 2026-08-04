const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/characters.json', 'utf-8'));
console.log('当前角色数量:', data.length);
console.log('\n角色列表:');
data.forEach((c, i) => console.log((i + 1) + '. ' + c.name + ' - ' + (c.organization || '无所属')));