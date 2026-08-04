const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'https://one-piece.com';
const characters = JSON.parse(fs.readFileSync('data/characters.json', 'utf-8'));

const imageDir = path.join(__dirname, 'public', 'images', 'characters');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url, localPath) {
    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://one-piece.com/',
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            timeout: 30000
        });
        
        const writer = fs.createWriteStream(localPath);
        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
        console.log(`✓ 下载成功: ${path.basename(localPath)}`);
        return true;
    } catch (error) {
        console.warn(`✗ 下载失败: ${url} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('=== 下载缺失的角色图片 ===');
    console.log(`总角色数: ${characters.length}`);
    
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    
    for (let i = 0; i < characters.length; i++) {
        const character = characters[i];
        const safeName = character.name.replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `${safeName}.jpg`;
        const localPath = path.join(imageDir, fileName);
        
        if (fs.existsSync(localPath)) {
            console.log(`${i + 1}/${characters.length}: ${character.name} - 已存在，跳过`);
            skipped++;
            continue;
        }
        
        let imageUrl = null;
        
        if (character.image && character.image.startsWith('http')) {
            imageUrl = character.image;
        } else if (character.image) {
            imageUrl = `${BASE_URL}${character.image}`;
        } else {
            const urlKey = character.link ? character.link.split('/')[4] : '';
            if (urlKey) {
                imageUrl = `${BASE_URL}/images/character/${urlKey}/face.jpg`;
            }
        }
        
        if (imageUrl) {
            console.log(`${i + 1}/${characters.length}: 下载 ${character.name}...`);
            const success = await downloadImage(imageUrl, localPath);
            if (success) {
                downloaded++;
            } else {
                failed++;
            }
            await sleep(500);
        } else {
            console.log(`${i + 1}/${characters.length}: ${character.name} - 无图片URL，跳过`);
            skipped++;
        }
    }
    
    console.log(`\n下载完成:`);
    console.log(`  ✓ 成功: ${downloaded}`);
    console.log(`  ✗ 失败: ${failed}`);
    console.log(`  - 跳过: ${skipped}`);
}

main().catch(console.error);
