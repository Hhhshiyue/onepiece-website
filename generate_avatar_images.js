const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const data = require('./data/characters.json');
const imageDir = path.join(__dirname, 'public', 'images', 'characters');

if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

function getRandomColor() {
    const colors = [
        { bg: '#4a3728', text: '#d4af37' },
        { bg: '#2d1f14', text: '#ffd700' },
        { bg: '#3d2914', text: '#f4a460' },
        { bg: '#5c4033', text: '#deb887' },
        { bg: '#2b1b17', text: '#daa520' },
        { bg: '#6b4423', text: '#ffec8b' },
        { bg: '#3e2723', text: '#d2691e' },
        { bg: '#5d4037', text: '#ffe4b5' },
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function generateAvatar(name, width = 250, height = 170) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const color = getRandomColor();
    
    ctx.fillStyle = color.bg;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = color.text;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    ctx.fillStyle = color.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = 24;
    const maxWidth = width - 40;
    
    ctx.font = `bold ${fontSize}px sans-serif`;
    
    const lines = [];
    let currentLine = '';
    const chars = name.split('');
    
    for (const char of chars) {
        ctx.font = `bold ${fontSize}px sans-serif`;
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, i) => {
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(line, width / 2, startY + i * lineHeight);
    });
    
    return canvas.toBuffer('image/jpeg', { quality: 0.9 });
}

function main() {
    console.log('=== 生成缺失的角色头像 ===');
    console.log(`总角色数: ${data.length}`);
    
    let generated = 0;
    let skipped = 0;
    
    data.forEach(c => {
        const safeName = c.name.replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `${safeName}.jpg`;
        const localPath = path.join(imageDir, fileName);
        
        if (fs.existsSync(localPath)) {
            skipped++;
            return;
        }
        
        console.log(`生成: ${c.name}`);
        const buffer = generateAvatar(c.name);
        fs.writeFileSync(localPath, buffer);
        generated++;
    });
    
    console.log(`\n生成完成:`);
    console.log(`  ✓ 生成: ${generated}`);
    console.log(`  - 跳过: ${skipped}`);
}

main().catch(console.error);
