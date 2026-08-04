const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://one-piece.com';

const CHARACTER_URLS = [
    { name: 'シャンクス', url: '/character/shanks/index.html' },
    { name: 'エドワード・ニューゲート', url: '/character/whitebeard/index.html' },
    { name: 'マルコ', url: '/character/marco/index.html' },
    { name: 'ポートガス・D・エース', url: '/character/ace/index.html' },
    { name: 'バギー', url: '/character/buggy/index.html' },
    { name: 'クロコダイル', url: '/character/crocodile/index.html' },
    { name: 'ドンキホーテ・ドフラミンゴ', url: '/character/doflamingo/index.html' },
    { name: 'モリア', url: '/character/moria/index.html' },
    { name: 'ブルージャン', url: '/character/bigmom/index.html' },
    { name: 'カイドウ', url: '/character/kaido/index.html' },
    { name: 'トラファルガー・ロー', url: '/character/law/index.html' },
    { name: 'EUSTASS・キッド', url: '/character/kid/index.html' },
    { name: 'バーソロミュー・くま', url: '/character/kuma/index.html' },
    { name: 'ジュラキュール・ミホーク', url: '/character/mihawk/index.html' },
    { name: 'ハンコック', url: '/character/hancock/index.html' },
    { name: 'センゴク', url: '/character/sengoku/index.html' },
    { name: 'ガープ', url: '/character/garp/index.html' },
    { name: '青キジ', url: '/character/aokiji/index.html' },
    { name: '黄猿', url: '/character/kizaru/index.html' },
    { name: '赤犬', url: '/character/akainu/index.html' },
    { name: '藤虎', url: '/character/fujitora/index.html' },
    { name: 'サボ', url: '/character/sabo/index.html' },
    { name: 'モンキー・D・ドラゴン', url: '/character/dragon/index.html' },
    { name: 'エンポリオ・イワンコフ', url: '/character/ivankov/index.html' },
    { name: 'シルバー・レイリー', url: '/character/rayleigh/index.html' },
    { name: 'ゴール・D・ロジャー', url: '/character/roger/index.html' },
    { name: 'ギルド・ティーチ', url: '/character/blackbeard/index.html' },
    { name: 'クラッカー', url: '/character/cracker/index.html' },
    { name: 'カタクリ', url: '/character/katakuri/index.html' },
    { name: 'ジャック', url: '/character/jack/index.html' },
    { name: 'キング', url: '/character/king/index.html' },
    { name: 'クイーン', url: '/character/queen/index.html' },
    { name: 'コビ', url: '/character/coby/index.html' },
    { name: 'ヘルメッポ', url: '/character/helmeppo/index.html' },
    { name: 'スモーカー', url: '/character/smoker/index.html' },
    { name: 'タシギ', url: '/character/tashigi/index.html' },
    { name: 'ベックマン', url: '/character/beckman/index.html' },
    { name: 'ラッキー', url: '/character/lucky/index.html' },
    { name: 'ボニー', url: '/character/bonney/index.html' },
    { name: 'メリー', url: '/character/margaret/index.html' },
    { name: 'シャキ', url: '/character/shaqi/index.html' },
    { name: 'ジョズ', url: '/character/jozu/index.html' },
    { name: 'サクラダイオール', url: '/character/sakura_di/index.html' },
    { name: 'ブルック', url: '/character/brook/index.html' },
    { name: 'フランキー', url: '/character/franky/index.html' },
    { name: 'ニコ・ロビン', url: '/character/robin/index.html' },
    { name: 'トニートニー・チョッパー', url: '/character/chopper/index.html' },
    { name: 'サンジ', url: '/character/sanji/index.html' },
    { name: 'ウソップ', url: '/character/usopp/index.html' },
    { name: 'ナミ', url: '/character/nami/index.html' },
    { name: 'ロロノア・ゾロ', url: '/character/zoro/index.html' },
    { name: 'モンキー・D・ルフィ', url: '/character/luffy/index.html' },
    { name: 'ジンベエ', url: '/character/Jinbe/index.html' },
];

const ORGANIZATION_MAP = {
    'モンキー・D・ルフィ': '麦わらの一味',
    'ロロノア・ゾロ': '麦わらの一味',
    'ナミ': '麦わらの一味',
    'ウソップ': '麦わらの一味',
    'サンジ': '麦わらの一味',
    'トニートニー・チョッパー': '麦わらの一味',
    'ニコ・ロビン': '麦わらの一味',
    'フランキー': '麦わらの一味',
    'ブルック': '麦わらの一味',
    'ジンベエ': '麦わらの一味',
    'シャンクス': '赤髪海賊団',
    'ベックマン': '赤髪海賊団',
    'ラッキー': '赤髪海賊団',
    'エドワード・ニューゲート': '白ひげ海賊団',
    'マルコ': '白ひげ海賊団',
    'ジョズ': '白ひげ海賊団',
    'サクラダイオール': '白ひげ海賊団',
    'ポートガス・D・エース': '白ひげ海賊団',
    'ギルド・ティーチ': '黒ひげ海賊団',
    'バギー': 'バギー海賊団',
    'クロコダイル': 'バロックワークス',
    'ドンキホーテ・ドフラミンゴ': 'ドンキホーテ海賊団',
    'モリア': '月光海賊団',
    'ブルージャン': 'ビッグ・マム海賊団',
    'クラッカー': 'ビッグ・マム海賊団',
    'カタクリ': 'ビッグ・マム海賊団',
    'カイドウ': '百獣海賊団',
    'キング': '百獣海賊団',
    'クイーン': '百獣海賊団',
    'ジャック': '百獣海賊団',
    'トラファルガー・ロー': 'ハート海賊団',
    'EUSTASS・キッド': 'キッド海賊団',
    'バーソロミュー・くま': '王下七武海',
    'ジュラキュール・ミホーク': '王下七武海',
    'ハンコック': '九蛇海賊団',
    'メリー': '九蛇海賊団',
    'シャキ': '九蛇海賊団',
    'センゴク': '海軍',
    'ガープ': '海軍',
    '青キジ': '海軍',
    '黄猿': '海軍',
    '赤犬': '海軍',
    '藤虎': '海軍',
    'スモーカー': '海軍',
    'タシギ': '海軍',
    'コビ': '海軍',
    'ヘルメッポ': '海軍',
    'サボ': '革命軍',
    'モンキー・D・ドラゴン': '革命軍',
    'エンポリオ・イワンコフ': '革命軍',
    'ゴール・D・ロジャー': 'ロジャー海賊団',
    'シルバー・レイリー': 'ロジャー海賊団',
    'ボニー': 'ボニー海賊団',
};

const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    },
    responseType: 'arraybuffer',
    timeout: 30000
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function decodeResponse(response) {
    const html = Buffer.from(response.data).toString('utf-8');
    return cheerio.load(html);
}

async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(url, axiosConfig);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            console.warn(`请求失败 (${i + 1}/${maxRetries}): ${url}`, error.message);
        }
        await sleep(1000 * (i + 1));
    }
    throw new Error('请求失败');
}

async function fetchCharacterDetail(name, url) {
    try {
        const response = await fetchWithRetry(BASE_URL + url);
        const $ = decodeResponse(response);

        const detail = {};

        const infoItems = {};
        const listTerms = $('.el-list-term');
        if (listTerms.length > 0) {
            const mainListTerm = $(listTerms[0]);
            mainListTerm.find('.el-list-term__item').each((index, item) => {
                const $item = $(item);
                const key = $item.find('.el-list-term__head span').text().trim();
                const value = $item.find('.el-list-term__body').text().trim().replace(/\s+/g, ' ');
                if (key && value) {
                    infoItems[key] = value;
                }
            });
        }

        if (infoItems['懸賞金']) detail.bounty = infoItems['懸賞金'];
        if (infoItems['悪魔の実']) detail.devilFruit = infoItems['悪魔の実'];
        if (infoItems['所属']) detail.organization = infoItems['所属'];
        if (infoItems['組織']) detail.organization = infoItems['組織'];
        if (infoItems['誕生日']) detail.birthday = infoItems['誕生日'];
        if (infoItems['年齢']) detail.age = infoItems['年齢'];
        if (infoItems['身長']) detail.height = infoItems['身長'];
        if (infoItems['血液型']) detail.bloodType = infoItems['血液型'];
        if (infoItems['出身地']) detail.hometown = infoItems['出身地'];
        if (infoItems['職業']) detail.occupation = infoItems['職業'];
        if (infoItems['夢']) detail.dream = infoItems['夢'];
        if (infoItems['通称']) detail.nickname = infoItems['通称'];
        if (infoItems['性格']) detail.personality = infoItems['性格'];

        const characterKey = url.split('/')[2];
        let image = null;
        $('.el-hero__img img, .el-card-block__pic img, .el-character__img img').each((index, el) => {
            const src = $(el).attr('src');
            if (src && src.includes(`/${characterKey}/`)) {
                image = src;
                return false;
            }
        });
        if (!image) {
            image = $('.el-hero__img img, .el-card-block__pic img').attr('src');
        }
        if (image) {
            detail.image = image.startsWith('http') ? image : `${BASE_URL}${image}`;
        }

        const article = $('article');
        if (article.length > 0) {
            let text = article.text().trim();
            text = text.replace(/\s+/g, ' ');
            detail.description = text.substring(0, 1000);
        }

        return detail;
    } catch (error) {
        console.warn(`爬取 ${name} 失败:`, error.message);
        return null;
    }
}

async function localizeImage(character) {
    if (character.image) {
        try {
            const ext = path.extname(new URL(character.image).pathname);
            const safeName = character.name.replace(/[\\/:*?"<>|]/g, '_');
            const fileName = `${safeName}${ext}`;
            const localPath = path.join(__dirname, 'public', 'images', 'characters', fileName);
            
            if (!fs.existsSync(localPath)) {
                const response = await axios.get(character.image, {
                    responseType: 'stream',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://one-piece.com/',
                        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                    },
                    timeout: 30000
                });
                const dir = path.dirname(localPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                const writer = fs.createWriteStream(localPath);
                await new Promise((resolve, reject) => {
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                console.log(`下载角色图片: ${fileName}`);
            }
            
            character.localImage = `/images/characters/${fileName}`;
        } catch (error) {
            console.warn(`下载角色图片失败: ${character.image}`);
        }
    }
}

async function main() {
    console.log('=== 添加更多角色 ===');
    
    const existingData = JSON.parse(fs.readFileSync('data/characters.json', 'utf-8'));
    const existingNames = new Set(existingData.map(c => c.name));
    
    console.log(`现有角色: ${existingNames.size} 个`);
    
    const newCharacters = [];
    
    for (let i = 0; i < CHARACTER_URLS.length; i++) {
        const { name, url } = CHARACTER_URLS[i];
        
        if (existingNames.has(name)) {
            console.log(`${i + 1}/${CHARACTER_URLS.length}: ${name} 已存在，跳过`);
            continue;
        }
        
        console.log(`${i + 1}/${CHARACTER_URLS.length}: 爬取 ${name}...`);
        
        const detail = await fetchCharacterDetail(name, url);
        
        if (detail) {
            const character = {
                name,
                image: detail.image || null,
                bounty: detail.bounty || '',
                devilFruit: detail.devilFruit || '',
                organization: detail.organization || ORGANIZATION_MAP[name] || '',
                birthday: detail.birthday || '',
                link: BASE_URL + url,
                description: detail.description || '',
                occupation: detail.occupation || '',
                age: detail.age || '',
                height: detail.height || '',
                bloodType: detail.bloodType || '',
                hometown: detail.hometown || '',
                nickname: detail.nickname || '',
                personality: detail.personality || ''
            };
            
            await localizeImage(character);
            newCharacters.push(character);
            console.log(`  ✓ 成功添加: ${name}`);
        } else {
            console.log(`  ✗ 爬取失败: ${name}`);
        }
        
        await sleep(200);
    }
    
    console.log(`\n新增角色: ${newCharacters.length} 个`);
    
    const allCharacters = [...existingData, ...newCharacters];
    console.log(`总角色数: ${allCharacters.length} 个`);
    
    fs.writeFileSync('data/characters.json', JSON.stringify(allCharacters, null, 2), 'utf-8');
    console.log('数据已保存');
    
    const countScript = require('./count_chars');
}

main().catch(console.error);