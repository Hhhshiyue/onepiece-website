const http = require('http');

function fetchData(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: 'localhost', port: 8080, path: path + '&_t=' + Date.now() }, (res) => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(data)));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        const charactersResult = await fetchData('/api/characters');
        const fruitsResult = await fetchData('/api/devil-fruits');
        
        console.log('=== 角色列表 ===');
        console.log('总角色数:', charactersResult.pagination.total);
        console.log('');
        
        const organizations = {};
        charactersResult.data.forEach(c => {
            if (!organizations[c.organization]) {
                organizations[c.organization] = [];
            }
            organizations[c.organization].push(c);
        });
        
        Object.keys(organizations).forEach(org => {
            console.log(`【${org || '无所属'}】`);
            organizations[org].forEach(c => {
                let info = `  ${c.name}`;
                if (c.bounty) info += ` | ${c.bounty}`;
                if (c.devilFruit) info += ` | ${c.devilFruit}`;
                console.log(info);
            });
            console.log('');
        });
        
        console.log('=== 恶魔果实列表 ===');
        console.log('总果实数:', fruitsResult.data.length);
        console.log('');
        
        const fruitTypes = {};
        fruitsResult.data.forEach(f => {
            if (!fruitTypes[f.type]) {
                fruitTypes[f.type] = [];
            }
            fruitTypes[f.type].push(f);
        });
        
        Object.keys(fruitTypes).forEach(type => {
            console.log(`【${type || '未知类型'}】`);
            fruitTypes[type].forEach(f => {
                let info = `  ${f.name}`;
                if (f.ability) info += ` | ${f.ability}`;
                console.log(info);
            });
            console.log('');
        });
        
    } catch (error) {
        console.error('获取数据失败:', error.message);
    }
}

main();