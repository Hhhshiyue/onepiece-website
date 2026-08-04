const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://one-piece.com';

const characters = [
    { name: 'モンキー・D・ルフィ', imageKey: 'luffy', organization: '麦わらの一味', bounty: '30億ベリー', devilFruit: 'ゴムゴムの実 ヒトヒトの実 幻獣種 モデル 〝ニカ〟', birthday: '5月5日' },
    { name: 'ロロノア・ゾロ', imageKey: 'zoro', organization: '麦わらの一味', bounty: '11億1100万ベリー', devilFruit: '', birthday: '11月11日' },
    { name: 'ナミ', imageKey: 'nami', organization: '麦わらの一味', bounty: '3億6600万ベリー', devilFruit: '', birthday: '7月3日' },
    { name: 'ウソップ', imageKey: 'usopp', organization: '麦わらの一味', bounty: '5億ベリー', devilFruit: '', birthday: '4月1日' },
    { name: 'サンジ', imageKey: 'sanji', organization: '麦わらの一味', bounty: '10億3200万ベリー', devilFruit: '', birthday: '3月2日' },
    { name: 'トニートニー・チョッパー', imageKey: 'chopper', organization: '麦わらの一味', bounty: '100ベリー', devilFruit: 'ヒトヒトの実', birthday: '12月24日' },
    { name: 'ニコ・ロビン', imageKey: 'robin', organization: '麦わらの一味', bounty: '9億3000万ベリー', devilFruit: 'ハナハナの実', birthday: '2月6日' },
    { name: 'フランキー', imageKey: 'franky', organization: '麦わらの一味', bounty: '9億4000万ベリー', devilFruit: '', birthday: '3月9日' },
    { name: 'ブルック', imageKey: 'brook', organization: '麦わらの一味', bounty: '3億3000万ベリー', devilFruit: 'ヨミヨミの実', birthday: '4月3日' },
    { name: 'ジンベエ', imageKey: 'Jinbe', organization: '麦わらの一味', bounty: '11億ベリー', devilFruit: '', birthday: '4月2日' },
    { name: 'シャンクス', imageKey: 'shanks', organization: '赤髪海賊団', bounty: '40億4890万ベリー', devilFruit: '', birthday: '3月9日' },
    { name: 'エドワード・ニューゲート', imageKey: 'whitebeard', organization: '白ひげ海賊団', bounty: '50億4600万ベリー', devilFruit: 'グラグラの実', birthday: '4月6日' },
    { name: 'マルコ', imageKey: 'marco', organization: '白ひげ海賊団', bounty: '13億7400万ベリー', devilFruit: 'フェニックスフェニックスの実', birthday: '3月16日' },
    { name: 'ポートガス・D・エース', imageKey: 'ace', organization: '白ひげ海賊団', bounty: '5億5000万ベリー', devilFruit: 'メラメラの実', birthday: '1月1日' },
    { name: 'ジョズ', imageKey: 'jozu', organization: '白ひげ海賊団', bounty: '10億ベリー', devilFruit: 'キラキラの実', birthday: '11月11日' },
    { name: 'ギルド・ティーチ', imageKey: 'blackbeard', organization: '黒ひげ海賊団', bounty: '22億4760万ベリー', devilFruit: 'ヤミヤミの実', birthday: '8月3日' },
    { name: 'カイドウ', imageKey: 'kaido', organization: '百獣海賊団', bounty: '46億1110万ベリー', devilFruit: 'ウルフウルフの実', birthday: '5月1日' },
    { name: 'キング', imageKey: 'king', organization: '百獣海賊団', bounty: '13億9000万ベリー', devilFruit: 'ウルフウルフの実 モデル:パケケロプテラン', birthday: '' },
    { name: 'クイーン', imageKey: 'queen', organization: '百獣海賊団', bounty: '13億2000万ベリー', devilFruit: 'ウルフウルフの実 モデル:ステゴサウルス', birthday: '' },
    { name: 'ジャック', imageKey: 'jack', organization: '百獣海賊団', bounty: '10億ベリー', devilFruit: 'ウルフウルフの実 モデル:マンモス', birthday: '' },
    { name: 'ブルージャン', imageKey: 'bigmom', organization: 'ビッグ・マム海賊団', bounty: '43億8800万ベリー', devilFruit: 'スーパースーパーの実', birthday: '2月15日' },
    { name: 'カタクリ', imageKey: 'katakuri', organization: 'ビッグ・マム海賊団', bounty: '10億5700万ベリー', devilFruit: 'モチモチの実', birthday: '11月25日' },
    { name: 'クラッカー', imageKey: 'cracker', organization: 'ビッグ・マム海賊団', bounty: '8億6000万ベリー', devilFruit: 'ビスビスの実', birthday: '' },
    { name: 'ドンキホーテ・ドフラミンゴ', imageKey: 'doflamingo', organization: 'ドンキホーテ海賊団', bounty: '34億ベリー', devilFruit: 'ジャクジャクの実', birthday: '10月23日' },
    { name: 'クロコダイル', imageKey: 'crocodile', organization: 'バロックワークス', bounty: '19億6500万ベリー', devilFruit: 'スナスナの実', birthday: '9月5日' },
    { name: 'バギー', imageKey: 'buggy', organization: 'バギー海賊団', bounty: '31億8900万ベリー', devilFruit: 'バラバラの実', birthday: '8月8日' },
    { name: 'モリア', imageKey: 'moria', organization: '月光海賊団', bounty: '3億2000万ベリー', devilFruit: 'シャドウシャドウの実', birthday: '9月6日' },
    { name: 'トラファルガー・ロー', imageKey: 'law', organization: 'ハート海賊団', bounty: '30億ベリー', devilFruit: 'オペオペの実', birthday: '10月6日' },
    { name: 'EUSTASS・キッド', imageKey: 'kid', organization: 'キッド海賊団', bounty: '30億ベリー', devilFruit: 'ジキジキの実', birthday: '1月10日' },
    { name: 'ジュラキュール・ミホーク', imageKey: 'mihawk', organization: '王下七武海（元）', bounty: '35億9000万ベリー', devilFruit: '', birthday: '3月9日' },
    { name: 'ハンコック', imageKey: 'hancock', organization: '九蛇海賊団', bounty: '16億5900万ベリー', devilFruit: 'メロメロの実', birthday: '9月2日' },
    { name: 'バーソロミュー・くま', imageKey: 'kuma', organization: '王下七武海', bounty: '29億6000万ベリー', devilFruit: 'バトンバトンの実', birthday: '9月9日' },
    { name: 'ガープ', imageKey: 'garp', organization: '海軍', bounty: '', devilFruit: '', birthday: '5月2日' },
    { name: 'センゴク', imageKey: 'sengoku', organization: '海軍', bounty: '', devilFruit: 'モネモネの実', birthday: '5月9日' },
    { name: '赤犬', imageKey: 'akainu', organization: '海軍', bounty: '', devilFruit: 'マグマグの実', birthday: '8月16日' },
    { name: '青キジ', imageKey: 'aokiji', organization: '海軍', bounty: '', devilFruit: 'ヒエヒエの実', birthday: '9月21日' },
    { name: '黄猿', imageKey: 'kizaru', organization: '海軍', bounty: '', devilFruit: 'ピカピカの実', birthday: '11月23日' },
    { name: '藤虎', imageKey: 'fujitora', organization: '海軍', bounty: '', devilFruit: 'グラビティグラビティの実', birthday: '8月10日' },
    { name: 'スモーカー', imageKey: 'smoker', organization: '海軍', bounty: '', devilFruit: 'モクモクの実', birthday: '3月14日' },
    { name: 'タシギ', imageKey: 'tashigi', organization: '海軍', bounty: '', devilFruit: '', birthday: '10月6日' },
    { name: 'コビ', imageKey: 'coby', organization: '海軍', bounty: '', devilFruit: '', birthday: '5月6日' },
    { name: 'サボ', imageKey: 'sabo', organization: '革命軍', bounty: '6億2000万ベリー', devilFruit: 'メラメラの実', birthday: '3月20日' },
    { name: 'モンキー・D・ドラゴン', imageKey: 'dragon', organization: '革命軍', bounty: '', devilFruit: 'ゴロゴロの実', birthday: '10月5日' },
    { name: 'エンポリオ・イワンコフ', imageKey: 'ivankov', organization: '革命軍', bounty: '5億0000万ベリー', devilFruit: 'ホルモンホルモンの実', birthday: '1月8日' },
    { name: 'ゴール・D・ロジャー', imageKey: 'roger', organization: 'ロジャー海賊団', bounty: '55億6480万ベリー', devilFruit: '', birthday: '12月31日' },
    { name: 'シルバー・レイリー', imageKey: 'rayleigh', organization: 'ロジャー海賊団', bounty: '50億4600万ベリー', devilFruit: '', birthday: '5月13日' },
    { name: 'ボニー', imageKey: 'bonney', organization: 'ボニー海賊団', bounty: '3億2000万ベリー', devilFruit: 'アルダアルダの実', birthday: '9月1日' },
    { name: 'ベックマン', imageKey: 'beckman', organization: '赤髪海賊団', bounty: '', devilFruit: '', birthday: '' },
    { name: 'ラッキー', imageKey: 'lucky', organization: '赤髪海賊団', bounty: '', devilFruit: '', birthday: '' },
];

function getImageUrl(imageKey) {
    return `https://one-piece.com/o/assets/images/anime/character/data/${imageKey}/face.jpg`;
}

async function downloadImage(url, localPath) {
    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://one-piece.com/',
            },
            timeout: 30000
        });
        
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const writer = fs.createWriteStream(localPath);
        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        
        return true;
    } catch (error) {
        console.warn(`下载失败: ${url} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('=== 下载所有角色图片 ===');
    console.log(`总共 ${characters.length} 个角色`);
    
    const outputDir = path.join(__dirname, '..', 'public', 'images', 'characters');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < characters.length; i++) {
        const c = characters[i];
        const imageUrl = getImageUrl(c.imageKey);
        const fileName = `${c.name.replace(/[\\/:*?"<>|]/g, '_')}.jpg`;
        const localPath = path.join(outputDir, fileName);
        
        console.log(`${i + 1}/${characters.length}: ${c.name}`);
        
        if (fs.existsSync(localPath)) {
            console.log(`  ✓ 已存在，跳过`);
            successCount++;
            c.localImage = `/images/characters/${fileName}`;
            c.image = imageUrl;
            continue;
        }
        
        const success = await downloadImage(imageUrl, localPath);
        if (success) {
            console.log(`  ✓ 下载成功`);
            successCount++;
            c.localImage = `/images/characters/${fileName}`;
            c.image = imageUrl;
        } else {
            console.log(`  ✗ 下载失败`);
            failCount++;
            c.localImage = '';
            c.image = imageUrl;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n下载完成: 成功 ${successCount} 个，失败 ${failCount} 个`);
    
    const dataPath = path.join(__dirname, '..', 'data', 'characters.json');
    fs.writeFileSync(dataPath, JSON.stringify(characters, null, 2), 'utf-8');
    console.log('数据已保存到 characters.json');
}

main().catch(console.error);