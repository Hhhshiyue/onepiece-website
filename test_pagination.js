const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://one-piece.com';

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
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
    throw new Error('请求失败');
}

async function testCorrectPagination() {
    console.log('=== 测试正确的分页URL ===');
    
    for (let page = 1; page <= 10; page++) {
        const url = `${BASE_URL}/character/index.html?page=${page}`;
        try {
            const response = await fetchWithRetry(url);
            const $ = decodeResponse(response);
            
            const items = $('.el-card-block__item');
            const names = [];
            items.each((i, el) => {
                const $el = $(el);
                const name = $el.find('.el-heading-lv3 h3').text().trim();
                const skipNames = ['作品概要', 'これまでのストーリー', '麦わらの一味とは', '悪魔の実とは', 'ゴーイング・メリー号', 'サウザンド・サニー号', '麦わらの一味'];
                
                if (name && !skipNames.includes(name)) {
                    names.push(name);
                }
            });
            
            console.log(`\n页面 ${page}: ${url}`);
            console.log(`  角色数量: ${names.length}`);
            if (names.length > 0) {
                console.log(`  角色:`, names);
            }
            
            if (names.length === 0) {
                console.log('  没有更多角色了');
                break;
            }
        } catch (error) {
            console.log(`页面 ${page}: 404`);
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function testSyllabary() {
    console.log('\n=== 测试音节索引页面 ===');
    
    const url = `${BASE_URL}/character/syllabary/index.html`;
    try {
        const response = await fetchWithRetry(url);
        const $ = decodeResponse(response);
        
        const items = $('.el-card-block__item, .el-list-term__item, li');
        console.log(`找到 ${items.length} 个元素`);
        
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/character/') && !href.includes('#') && !href.includes('index.html') && !href.includes('birthday') && !href.includes('syllabary')) {
                links.push(href);
            }
        });
        
        console.log(`\n找到 ${links.length} 个角色链接:`);
        links.slice(0, 50).forEach((link, i) => {
            console.log(`  ${i + 1}. ${link}`);
        });
        
        return links;
    } catch (error) {
        console.error('音节索引页面请求失败:', error.message);
        return [];
    }
}

testCorrectPagination().then(() => testSyllabary());