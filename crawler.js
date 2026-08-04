const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://one-piece.com';

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
    'ボーンズ・D・エッドワード': '白ひげ海賊団',
    'マルコ': '白ひげ海賊団',
    'エース': '白ひげ海賊団',
    'バギー': 'バギー海賊団',
    'クロコダイル': 'バロックワークス',
    'ドンキホーテ・ドフラミンゴ': 'ドンキホーテ海賊団',
    'モリア': '月光海賊団',
    'ブルージャン': 'ビッグ・マム海賊団',
    'カイドウ': '百獣海賊団',
    'ロー': 'ハート海賊団',
    'エUSTASS・キッド': 'キッド海賊団',
    'バーソロミュー・くま': '王下七武海',
    'ジュラキュール・ミホーク': '王下七武海',
    'ハンコック': '九蛇海賊団',
    'センゴク': '海軍',
    'ガープ': '海軍',
    '青キジ': '海軍',
    '黄猿': '海軍',
    '赤犬': '海軍',
    '藤虎': '海軍',
    '緑牛': '海軍',
    'スモーカー': '海軍',
    'タシギ': '海軍',
    'サボ': '革命軍',
    'ドラゴン': '革命軍',
    'イワンコフ': '革命軍',
};

const OCCUPATION_MAP = {
    'モンキー・D・ルフィ': '麦わらの一味船長',
    'ロロノア・ゾロ': '麦わらの一味剣士',
    'ナミ': '麦わらの一味航海士',
    'ウソップ': '麦わらの一味狙撃手',
    'サンジ': '麦わらの一味料理人',
    'トニートニー・チョッパー': '麦わらの一味船医',
    'ニコ・ロビン': '麦わらの一味考古学者',
    'フランキー': '麦わらの一味船大工',
    'ブルック': '麦わらの一味音楽家',
    'ジンベエ': '麦わらの一味舵手',
    'シャンクス': '赤髪海賊団船長',
    'ボーンズ・D・エッドワード': '白ひげ海賊団船長',
    'マルコ': '白ひげ海賊団第1隊隊長',
    'エース': '白ひげ海賊団第2隊隊長',
    'バギー': 'バギー海賊団船長',
    'クロコダイル': 'バロックワークス総帥',
    'ドンキホーテ・ドフラミンゴ': 'ドンキホーテ海賊団船長',
    'モリア': '月光海賊団船長',
    'ブルージャン': 'ビッグ・マム海賊団船長',
    'カイドウ': '百獣海賊団船長',
    'ロー': 'ハート海賊団船長',
    'エUSTASS・キッド': 'キッド海賊団船長',
    'バーソロミュー・くま': '王下七武海',
    'ジュラキュール・ミホーク': '王下七武海',
    'ハンコック': '九蛇海賊団船長',
    'センゴク': '海軍元総帥',
    'ガープ': '海軍中将',
    '青キジ': '海軍大将',
    '黄猿': '海軍大将',
    '赤犬': '海軍総帥',
    '藤虎': '海軍大将',
    '緑牛': '海軍大将',
    'スモーカー': '海軍中将',
    'タシギ': '海軍大佐',
    'サボ': '革命軍参謀総長',
    'ドラゴン': '革命軍総司令官',
    'イワンコフ': '革命軍幹部',
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
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axios.get(url, axiosConfig);
            if (response.status === 200) {
                return response;
            }
        } catch (error) {
            lastError = error;
            console.warn(`请求失败 (${i + 1}/${maxRetries}): ${url}`, error.message);
        }
        await sleep(1000 * (i + 1));
    }
    throw lastError;
}

async function fetchCharacterList() {
    try {
        const characters = [];
        let page = 1;
        let hasMore = true;
        const processedNames = new Set();

        while (hasMore && page <= 10) {
            const url = page === 1 ? `${BASE_URL}/character` : `${BASE_URL}/character?page=${page}`;
            console.log(`爬取角色第 ${page} 页...`);

            try {
                const response = await fetchWithRetry(url);
                const $ = decodeResponse(response);

                const items = $('.el-card-block__item');
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                let foundValid = false;
                items.each((index, element) => {
                    const $element = $(element);
                    
                    const name = $element.find('.el-heading-lv3 h3').text().trim();
                    const image = $element.find('.el-card-block__pic img').attr('src');
                    const link = $element.find('a').attr('href');

                    if (!name || !link) return;

                    const skipNames = ['作品概要', 'これまでのストーリー', '麦わらの一味とは', '悪魔の実とは', 'ゴーイング・メリー号', 'サウザンド・サニー号', '麦わらの一味'];
                    if (skipNames.includes(name)) return;

                    if (processedNames.has(name)) return;
                    processedNames.add(name);

                    foundValid = true;
                    
                    const character = {
                        name,
                        image: image ? (image.startsWith('http') ? image : `https://one-piece.com${image}`) : null,
                        bounty: '',
                        devilFruit: '',
                        organization: ORGANIZATION_MAP[name] || '',
                        birthday: '',
                        link: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : null,
                        description: '',
                        occupation: OCCUPATION_MAP[name] || '',
                        age: '',
                        height: '',
                        bloodType: '',
                        hometown: '',
                        nickname: '',
                        personality: ''
                    };

                    characters.push(character);
                });

                console.log(`第 ${page} 页找到 ${characters.length} 个角色`);

                if (!foundValid) hasMore = false;
                page++;
                await sleep(500);
            } catch (error) {
                console.error(`爬取第 ${page} 页失败:`, error.message);
                hasMore = false;
            }
        }

        console.log(`开始爬取 ${characters.length} 个角色详情...`);
        for (let i = 0; i < characters.length; i++) {
            if (characters[i].link) {
                await sleep(200);
                try {
                    const detail = await fetchCharacterDetail(characters[i].link);
                    if (detail) {
                        Object.assign(characters[i], detail);
                    }
                } catch (error) {
                    console.warn(`爬取 ${characters[i].name} 详情失败:`, error.message);
                }
            }
        }

        return characters;
    } catch (error) {
        console.error('Error fetching character list:', error);
        return [];
    }
}

async function fetchCharacterDetail(url) {
    try {
        const response = await fetchWithRetry(url);
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

        const article = $('article');
        if (article.length > 0) {
            let text = article.text().trim();
            text = text.replace(/\s+/g, ' ');
            detail.description = text.substring(0, 1000);
        }

        return detail;
    } catch (error) {
        console.error('Error fetching character detail:', error);
        return null;
    }
}

async function fetchNewsList() {
    try {
        const newsList = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 5) {
            const url = page === 1 ? `${BASE_URL}/news` : `${BASE_URL}/news?page=${page}`;
            console.log(`爬取新闻第 ${page} 页...`);

            try {
                const response = await fetchWithRetry(url);
                const $ = decodeResponse(response);

                const items = $('.el-card-block__item');
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                items.each((index, element) => {
                    const $element = $(element);
                    
                    const title = $element.find('.el-heading-lv3 h3').text().trim();
                    const date = $element.find('.el-paragraph time').text().trim();
                    const category = $element.find('.el-tag__item p').text().trim();
                    const image = $element.find('.el-card-block__pic img').attr('src');
                    const link = $element.find('a').attr('href');

                    if (title && link) {
                        newsList.push({
                            title,
                            date,
                            category,
                            image: image ? (image.startsWith('http') ? image : `https://one-piece.com${image}`) : null,
                            link: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : null,
                            content: ''
                        });
                    }
                });

                page++;
                await sleep(500);
            } catch (error) {
                console.error(`爬取新闻第 ${page} 页失败:`, error.message);
                hasMore = false;
            }
        }

        return newsList;
    } catch (error) {
        console.error('Error fetching news list:', error);
        return [];
    }
}

async function fetchDevilFruits() {
    try {
        const fruits = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 5) {
            const url = page === 1 ? `${BASE_URL}/devil_fruit` : `${BASE_URL}/devil_fruit?page=${page}`;
            console.log(`爬取恶魔果实第 ${page} 页...`);

            try {
                const response = await fetchWithRetry(url);
                const $ = decodeResponse(response);

                const items = $('.el-card-block__item');
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                items.each((index, element) => {
                    const $element = $(element);
                    
                    const name = $element.find('.el-heading-lv3 h3').text().trim();
                    const image = $element.find('.el-card-block__pic img').attr('src');
                    const link = $element.find('a').attr('href');

                    const info = {};
                    $element.find('.el-list-term__item').each((i, item) => {
                        const key = $(item).find('.el-list-term__head span').text().trim();
                        const value = $(item).find('.el-list-term__body').text().trim().replace(/\s+/g, ' ');
                        info[key] = value;
                    });

                    if (!name || !link) return;

                    fruits.push({
                        name,
                        image: image ? (image.startsWith('http') ? image : `https://one-piece.com${image}`) : null,
                        type: info['タイプ'] || info['種類'] || '',
                        ability: info['能力'] || '',
                        user: info['能力者'] || '',
                        description: '',
                        link: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : null
                    });
                });

                page++;
                await sleep(500);
            } catch (error) {
                console.error(`爬取恶魔果实第 ${page} 页失败:`, error.message);
                hasMore = false;
            }
        }

        return fruits;
    } catch (error) {
        console.error('Error fetching devil fruits:', error);
        return [];
    }
}

async function fetchAnimeEpisodes() {
    try {
        const episodes = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
            const url = page === 1 ? `${BASE_URL}/anime` : `${BASE_URL}/anime?page=${page}`;
            console.log(`爬取动画第 ${page} 页...`);

            try {
                const response = await fetchWithRetry(url);
                const $ = decodeResponse(response);

                const items = $('.el-card-block__item');
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                items.each((index, element) => {
                    const $element = $(element);
                    
                    const title = $element.find('.el-heading-lv3 h3').text().trim();
                    const date = $element.find('.el-paragraph time').text().trim();
                    const image = $element.find('.el-card-block__pic img').attr('src');
                    const link = $element.find('a').attr('href');

                    if (title && link) {
                        const match = title.match(/第(\d+)話/);
                        episodes.push({
                            episodeNumber: match ? match[1] : '',
                            title,
                            date,
                            image: image ? (image.startsWith('http') ? image : `https://one-piece.com${image}`) : null,
                            link: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : null,
                            summary: ''
                        });
                    }
                });

                page++;
                await sleep(500);
            } catch (error) {
                console.error(`爬取动画第 ${page} 页失败:`, error.message);
                hasMore = false;
            }
        }

        return episodes;
    } catch (error) {
        console.error('Error fetching anime episodes:', error);
        return [];
    }
}

async function fetchMangaChapters() {
    try {
        const chapters = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
            const url = page === 1 ? `${BASE_URL}/manga` : `${BASE_URL}/manga?page=${page}`;
            console.log(`爬取漫画第 ${page} 页...`);

            try {
                const response = await fetchWithRetry(url);
                const $ = decodeResponse(response);

                const items = $('.el-card-block__item');
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                items.each((index, element) => {
                    const $element = $(element);
                    
                    const title = $element.find('.el-heading-lv3 h3').text().trim();
                    const date = $element.find('.el-paragraph time').text().trim();
                    const image = $element.find('.el-card-block__pic img').attr('src');
                    const link = $element.find('a').attr('href');

                    if (title && link) {
                        const match = title.match(/第(\d+)話/);
                        chapters.push({
                            chapterNumber: match ? match[1] : '',
                            title,
                            date,
                            image: image ? (image.startsWith('http') ? image : `https://one-piece.com${image}`) : null,
                            link: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : null,
                            summary: ''
                        });
                    }
                });

                page++;
                await sleep(500);
            } catch (error) {
                console.error(`爬取漫画第 ${page} 页失败:`, error.message);
                hasMore = false;
            }
        }

        return chapters;
    } catch (error) {
        console.error('Error fetching manga chapters:', error);
        return [];
    }
}

async function fetchEvents() {
    try {
        const events = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 5) {
            const url = page === 1 ? `${BASE_URL}/event` : `${BASE_URL}/event?page=${page}`;
            console.log(`爬取事件第 ${page} 页...`);

            try {
                const response = await fetchWithRetry(url);
                const $ = decodeResponse(response);

                const items = $('.el-card-block__item');
                if (items.length === 0) {
                    hasMore = false;
                    break;
                }

                items.each((index, element) => {
                    const $element = $(element);
                    
                    const title = $element.find('.el-heading-lv3 h3').text().trim();
                    const date = $element.find('.el-paragraph time').text().trim();
                    const image = $element.find('.el-card-block__pic img').attr('src');
                    const link = $element.find('a').attr('href');

                    if (title && link) {
                        events.push({
                            title,
                            date,
                            image: image ? (image.startsWith('http') ? image : `https://one-piece.com${image}`) : null,
                            link: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : null,
                            description: ''
                        });
                    }
                });

                page++;
                await sleep(500);
            } catch (error) {
                console.error(`爬取事件第 ${page} 页失败:`, error.message);
                hasMore = false;
            }
        }

        return events;
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

async function localizeImages(characters, fruits, episodes, chapters, events) {
    console.log('开始本地化图片...');
    const localImagesDir = path.join(__dirname, 'public', 'images');

    for (const character of characters) {
        if (character.image) {
            try {
                const ext = path.extname(new URL(character.image).pathname);
                const safeName = character.name.replace(/[\\/:*?"<>|]/g, '_');
                const fileName = `${safeName}${ext}`;
                const localPath = path.join(localImagesDir, 'characters', fileName);
                
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
                console.warn(`下载角色图片失败: ${character.image} - ${error.message}`);
            }
            await sleep(100);
        }
    }

    for (const fruit of fruits) {
        if (fruit.image) {
            try {
                const fileName = path.basename(new URL(fruit.image).pathname);
                const localPath = path.join(localImagesDir, 'devil_fruits', fileName);
                if (!fs.existsSync(localPath)) {
                    const response = await axios.get(fruit.image, {
                        responseType: 'stream',
                        headers: axiosConfig.headers,
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
                }
                fruit.localImage = `/images/devil_fruits/${fileName}`;
            } catch (error) {
                console.warn(`下载果实图片失败: ${fruit.image}`);
            }
            await sleep(100);
        }
    }

    for (const episode of episodes) {
        if (episode.image) {
            try {
                const fileName = path.basename(new URL(episode.image).pathname);
                const localPath = path.join(localImagesDir, 'anime', fileName);
                if (!fs.existsSync(localPath)) {
                    const response = await axios.get(episode.image, {
                        responseType: 'stream',
                        headers: axiosConfig.headers,
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
                }
                episode.localImage = `/images/anime/${fileName}`;
            } catch (error) {
                console.warn(`下载动画图片失败: ${episode.image}`);
            }
            await sleep(100);
        }
    }

    for (const chapter of chapters) {
        if (chapter.image) {
            try {
                const fileName = path.basename(new URL(chapter.image).pathname);
                const localPath = path.join(localImagesDir, 'manga', fileName);
                if (!fs.existsSync(localPath)) {
                    const response = await axios.get(chapter.image, {
                        responseType: 'stream',
                        headers: axiosConfig.headers,
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
                }
                chapter.localImage = `/images/manga/${fileName}`;
            } catch (error) {
                console.warn(`下载漫画图片失败: ${chapter.image}`);
            }
            await sleep(100);
        }
    }

    for (const event of events) {
        if (event.image) {
            try {
                const fileName = path.basename(new URL(event.image).pathname);
                const localPath = path.join(localImagesDir, 'events', fileName);
                if (!fs.existsSync(localPath)) {
                    const response = await axios.get(event.image, {
                        responseType: 'stream',
                        headers: axiosConfig.headers,
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
                }
                event.localImage = `/images/events/${fileName}`;
            } catch (error) {
                console.warn(`下载事件图片失败: ${event.image}`);
            }
            await sleep(100);
        }
    }

    console.log('图片本地化完成');
}

async function saveData(data, filename) {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data saved to ${filename}`);
}

function validateData(characters) {
    console.log('\n=== 数据完整性验证 ===');
    const missingOrg = characters.filter(c => !c.organization || c.organization === '').length;
    const missingAge = characters.filter(c => !c.age || c.age === '').length;
    const missingHeight = characters.filter(c => !c.height || c.height === '').length;
    const missingBlood = characters.filter(c => !c.bloodType || c.bloodType === '').length;
    const missingHometown = characters.filter(c => !c.hometown || c.hometown === '').length;
    const missingBounty = characters.filter(c => !c.bounty || c.bounty === '').length;
    const missingDF = characters.filter(c => c.devilFruit && c.devilFruit !== '').length;

    console.log(`总角色数: ${characters.length}`);
    console.log(`缺少所属: ${missingOrg} (${((missingOrg / characters.length) * 100).toFixed(1)}%)`);
    console.log(`缺少年龄: ${missingAge} (${((missingAge / characters.length) * 100).toFixed(1)}%)`);
    console.log(`缺少身高: ${missingHeight} (${((missingHeight / characters.length) * 100).toFixed(1)}%)`);
    console.log(`缺少血型: ${missingBlood} (${((missingBlood / characters.length) * 100).toFixed(1)}%)`);
    console.log(`缺少出身地: ${missingHometown} (${((missingHometown / characters.length) * 100).toFixed(1)}%)`);
    console.log(`缺少悬赏金: ${missingBounty} (${((missingBounty / characters.length) * 100).toFixed(1)}%)`);
    console.log(`有恶魔果实: ${missingDF} (${((missingDF / characters.length) * 100).toFixed(1)}%)`);

    const keyCharacters = ['モンキー・D・ルフィ', 'ロロノア・ゾロ', 'ナミ', 'サンジ'];
    console.log('\n关键角色数据检查:');
    keyCharacters.forEach(name => {
        const char = characters.find(c => c.name === name);
        if (char) {
            console.log(`${name}:`);
            console.log(`  所属: ${char.organization || '缺失'}`);
            console.log(`  年龄: ${char.age || '缺失'}`);
            console.log(`  身高: ${char.height || '缺失'}`);
            console.log(`  悬赏金: ${char.bounty || '缺失'}`);
            console.log(`  恶魔果实: ${char.devilFruit || '无'}`);
        } else {
            console.log(`${name}: 未找到`);
        }
    });
}

async function crawlAll() {
    console.log('=== 开始爬取海贼王官网数据 ===');

    console.log('\n1. 爬取角色列表...');
    const characters = await fetchCharacterList();
    validateData(characters);

    console.log('\n2. 爬取新闻列表...');
    const news = await fetchNewsList();

    console.log('\n3. 爬取恶魔果实...');
    const devilFruits = await fetchDevilFruits();

    console.log('\n4. 爬取动画章节...');
    const animeEpisodes = await fetchAnimeEpisodes();

    console.log('\n5. 爬取漫画章节...');
    const mangaChapters = await fetchMangaChapters();

    console.log('\n6. 爬取事件...');
    const events = await fetchEvents();

    console.log('\n7. 本地化图片...');
    await localizeImages(characters, devilFruits, animeEpisodes, mangaChapters, events);

    console.log('\n8. 保存数据...');
    await saveData(characters, 'characters.json');
    await saveData(news, 'news.json');
    await saveData(devilFruits, 'devil_fruits.json');
    await saveData(animeEpisodes, 'anime_episodes.json');
    await saveData(mangaChapters, 'manga_chapters.json');
    await saveData(events, 'events.json');

    console.log('\n=== 爬取完成 ===');
    console.log(`角色: ${characters.length} 个`);
    console.log(`新闻: ${news.length} 条`);
    console.log(`恶魔果实: ${devilFruits.length} 个`);
    console.log(`动画章节: ${animeEpisodes.length} 集`);
    console.log(`漫画章节: ${mangaChapters.length} 话`);
    console.log(`事件: ${events.length} 个`);

    return { characters, news, devilFruits, animeEpisodes, mangaChapters, events };
}

if (require.main === module) {
    crawlAll();
}

module.exports = {
    fetchCharacterList,
    fetchNewsList,
    fetchCharacterDetail,
    fetchDevilFruits,
    fetchAnimeEpisodes,
    fetchMangaChapters,
    fetchEvents,
    crawlAll,
    saveData
};