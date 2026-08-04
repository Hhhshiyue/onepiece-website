const fs = require('fs');

const chars = JSON.parse(fs.readFileSync('data/characters.json', 'utf-8'));
const fruits = JSON.parse(fs.readFileSync('data/devil_fruits.json', 'utf-8'));

console.log('=== 角色列表 ===');
console.log('总角色数:', chars.length);
console.log('');

const organizations = {};
chars.forEach(c => {
    const org = c.organization || '无所属';
    if (!organizations[org]) {
        organizations[org] = [];
    }
    organizations[org].push(c);
});

Object.keys(organizations).forEach(org => {
    console.log(`【${org}】(${organizations[org].length}人)`);
    organizations[org].forEach(c => {
        let info = `  ${c.name}`;
        if (c.bounty) info += ` | 悬赏金: ${c.bounty}`;
        if (c.devilFruit) info += ` | 果实: ${c.devilFruit}`;
        if (c.birthday) info += ` | 生日: ${c.birthday}`;
        console.log(info);
    });
    console.log('');
});

console.log('=== 恶魔果实列表 ===');
console.log('总果实数:', fruits.length);

if (fruits.length > 0) {
    const fruitTypes = {};
    fruits.forEach(f => {
        const type = f.type || '未知类型';
        if (!fruitTypes[type]) {
            fruitTypes[type] = [];
        }
        fruitTypes[type].push(f);
    });
    
    Object.keys(fruitTypes).forEach(type => {
        console.log(`\n【${type}】(${fruitTypes[type].length}个)`);
        fruitTypes[type].forEach(f => {
            let info = `  ${f.name}`;
            if (f.ability) info += ` | ${f.ability}`;
            console.log(info);
        });
    });
} else {
    console.log('暂无恶魔果实数据');
}