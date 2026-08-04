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

async function exploreCharacterPage() {
    console.log('=== 探索角色页面结构 ===');
    
    const url = `${BASE_URL}/character`;
    const response = await fetchWithRetry(url);
    const $ = decodeResponse(response);
    
    console.log('\n页面标题:', $('title').text());
    
    console.log('\n所有链接:');
    const links = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('/character/') && !href.includes('#')) {
            links.push(href);
        }
    });
    console.log(links);
    
    console.log('\n分页相关元素:');
    const pagination = $('.pagination, .pager, .el-pager, *[class*="page"]');
    console.log('找到分页元素:', pagination.length);
    pagination.each((i, el) => {
        console.log('  元素:', $(el).attr('class'));
    });
    
    console.log('\n所有列表项:');
    const allItems = $('.el-card-block__item');
    allItems.each((i, el) => {
        const $el = $(el);
        const link = $el.find('a').attr('href');
        const title = $el.find('.el-heading-lv3 h3').text().trim();
        const image = $el.find('.el-card-block__pic img').attr('src');
        console.log(`  ${title} - ${link}`);
    });
}

async function testCharacterSubpages() {
    console.log('\n=== 测试角色子页面 ===');
    
    const subpages = [
        '/character/strawhat',
        '/character/navy',
        '/character/revolutionary',
        '/character/pirate',
        '/character/warlord',
        '/character/other'
    ];
    
    for (const subpage of subpages) {
        const url = BASE_URL + subpage;
        try {
            const response = await fetchWithRetry(url);
            const $ = decodeResponse(response);
            const items = $('.el-card-block__item');
            console.log(`\n${subpage}: 找到 ${items.length} 个项目`);
            
            const names = [];
            items.each((i, el) => {
                const name = $(el).find('.el-heading-lv3 h3').text().trim();
                if (name && !name.includes('概要') && !name.includes('ストーリー') && !name.includes('とは')) {
                    names.push(name);
                }
            });
            
            if (names.length > 0) {
                console.log('  角色:', names);
            }
        } catch (error) {
            console.log(`${subpage}: 404`);
        }
    }
}

exploreCharacterPage().then(() => testCharacterSubpages());