const express = require('express');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const { 
    fetchCharacterList, 
    fetchNewsList, 
    fetchDevilFruits,
    fetchAnimeEpisodes,
    fetchMangaChapters,
    fetchEvents,
    crawlAll,
    saveData 
} = require('./crawler');

const { initDatabase } = require('./database');
const {
    createUser,
    loginUser,
    getUserById,
    getUserByUsername,
    updateUser,
    updatePassword,
    deleteUser,
    getAllUsers
} = require('./models/user');

// Agent 系统
const QueryAgent = require('./agents/QueryAgent');
const queryAgent = new QueryAgent();
const RecommendAgent = require('./agents/RecommendAgent');
const recommendAgent = new RecommendAgent();
const agentManager = require('./agents/AgentManager');
const scheduler = require('./agents/Scheduler');

const {
    addFavorite,
    removeFavorite,
    getFavoritesByUser,
    isFavorite,
    getFavoriteCount,
    getFavoriteItems
} = require('./models/favorite');

const {
    getLatestVersion,
    saveVersion,
    getAllVersions,
    getVersion,
    compareVersions,
    cleanOldVersions
} = require('./models/version');

const {
    generateToken,
    authenticate,
    optionalAuthenticate
} = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));
app.use(express.json());
app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: false,
    lastModified: false
}));

const BACKUP_DIR = path.join(__dirname, 'data', 'backups');
const MAX_BACKUPS = 10;

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    
    const backupData = {
        timestamp: Date.now(),
        characters: cache.characters || [],
        news: cache.news || [],
        devilFruits: cache.devilFruits || [],
        animeEpisodes: cache.animeEpisodes || [],
        mangaChapters: cache.mangaChapters || [],
        events: cache.events || []
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
    
    cleanOldBackups();
    
    console.log(`[BACKUP] Created backup: ${backupFile}`);
}

function cleanOldBackups() {
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-'))
            .sort((a, b) => b.localeCompare(a));
        
        while (backups.length > MAX_BACKUPS) {
            const oldBackup = backups.pop();
            fs.unlinkSync(path.join(BACKUP_DIR, oldBackup));
            console.log(`[BACKUP] Removed old backup: ${oldBackup}`);
        }
    } catch (error) {
        console.error('[BACKUP] Error cleaning backups:', error);
    }
}

function loadBackup(fileName) {
    try {
        const backupPath = path.join(BACKUP_DIR, fileName);
        const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        
        cache.characters = data.characters || [];
        cache.news = data.news || [];
        cache.devilFruits = data.devilFruits || [];
        cache.animeEpisodes = data.animeEpisodes || [];
        cache.mangaChapters = data.mangaChapters || [];
        cache.events = data.events || [];
        
        saveData(cache);
        
        return { success: true, message: `成功恢复备份: ${fileName}`, timestamp: data.timestamp };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

function getBackupList() {
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-'))
            .map(f => {
                const filePath = path.join(BACKUP_DIR, f);
                const stats = fs.statSync(filePath);
                return {
                    fileName: f,
                    size: stats.size,
                    created: stats.mtime.getTime()
                };
            })
            .sort((a, b) => b.created - a.created);
        
        return { success: true, data: backups };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

setInterval(() => {
    if (cache.characters && cache.characters.length > 0) {
        createBackup();
    }
}, 60 * 60 * 1000);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let cache = {
    characters: null,
    news: null,
    devilFruits: null,
    animeEpisodes: null,
    mangaChapters: null,
    events: null,
    lastCrawlTime: null,
    cacheDuration: 3600000
};

function readJsonFile(filename) {
    const filePath = path.join(dataDir, filename);
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
        return [];
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return [];
    }
}

function isCacheValid() {
    if (!cache.lastCrawlTime) return false;
    return Date.now() - cache.lastCrawlTime < cache.cacheDuration;
}

function loadCache() {
    cache.characters = readJsonFile('characters.json');
    cache.news = readJsonFile('news.json');
    cache.devilFruits = readJsonFile('devil_fruits.json');
    cache.animeEpisodes = readJsonFile('anime_episodes.json');
    cache.mangaChapters = readJsonFile('manga_chapters.json');
    cache.events = readJsonFile('events.json');
    const stats = path.join(dataDir, 'characters.json');
    if (fs.existsSync(stats)) {
        cache.lastCrawlTime = fs.statSync(stats).mtime.getTime();
    }
}

// ==================== Agent API ====================

// 自然语言查询
app.post('/api/agent/query', (req, res) => {
    const { query } = req.body;

    console.log('[QueryAgent] 接收到的查询:', query);
    console.log('[QueryAgent] 查询类型:', typeof query);
    console.log('[QueryAgent] 查询长度:', query ? query.length : 0);

    if (!query) {
        return res.status(400).json({
            success: false,
            error: '请提供查询内容'
        });
    }

    try {
        const result = queryAgent.query(query);
        console.log('[QueryAgent] 查询结果:', result);
        res.json(result);
    } catch (error) {
        console.error('[QueryAgent] 查询错误:', error);
        res.status(500).json({
            success: false,
            error: '查询处理失败',
            message: error.message
        });
    }
});

// 获取 Agent 支持的查询类型
app.get('/api/agent/query-types', (req, res) => {
    res.json({
        success: true,
        types: [
            { type: 'character_bounty', examples: ['路飞的悬赏金是多少？', '索隆的赏金？'] },
            { type: 'character_birthday', examples: ['路飞的生日是哪天？', '娜美的生日？'] },
            { type: 'character_fruit', examples: ['路飞的恶魔果实是什么？', '罗的能力？'] },
            { type: 'character_org', examples: ['路飞属于哪个组织？', '艾斯的团队？'] },
            { type: 'filter_bounty_above', examples: ['悬赏金超过10亿的角色有哪些？'] },
            { type: 'filter_bounty_below', examples: ['悬赏金低于1亿的角色有哪些？'] },
            { type: 'org_members', examples: ['草帽海贼团有哪些成员？', '海军里有哪些人？'] },
            { type: 'fruit_by_type', examples: ['超人系果实有哪些？', '自然系恶魔果实？'] },
            { type: 'fruit_user', examples: ['橡胶果实是谁吃的？', '谁吃了手术果实？'] },
            { type: 'stat_org_count', examples: ['哪个组织的角色最多？'] },
            { type: 'stat_total_characters', examples: ['有多少个角色？', '总共有多少人？'] },
            { type: 'stat_total_fruits', examples: ['有多少种恶魔果实？'] }
        ]
    });
});

// ==================== RecommendAgent API ====================

// 相似角色推荐
app.post('/api/agent/recommend/similar', (req, res) => {
    const { characterName, limit = 5 } = req.body;
    
    if (!characterName) {
        return res.status(400).json({ 
            success: false, 
            error: '请提供角色名称' 
        });
    }
    
    const result = recommendAgent.recommend('similar', { characterName, limit });
    res.json(result);
});

// 组织推荐
app.post('/api/agent/recommend/organization', (req, res) => {
    const { organization, limit = 10 } = req.body;
    
    if (!organization) {
        return res.status(400).json({ 
            success: false, 
            error: '请提供组织名称' 
        });
    }
    
    const result = recommendAgent.recommend('organization', { organization, limit });
    res.json(result);
});

// 果实类型推荐
app.post('/api/agent/recommend/fruit-type', (req, res) => {
    const { fruitType, limit = 10 } = req.body;
    
    if (!fruitType) {
        return res.status(400).json({ 
            success: false, 
            error: '请提供果实类型' 
        });
    }
    
    const result = recommendAgent.recommend('fruit_type', { fruitType, limit });
    res.json(result);
});

// 悬赏金级别推荐
app.post('/api/agent/recommend/bounty-level', (req, res) => {
    const { level, limit = 10 } = req.body;
    
    if (!level) {
        return res.status(400).json({ 
            success: false, 
            error: '请提供悬赏金级别 (high/medium/low)' 
        });
    }
    
    const result = recommendAgent.recommend('bounty_level', { level, limit });
    res.json(result);
});

// 随机推荐
app.get('/api/agent/recommend/random', (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const result = recommendAgent.recommend('random', { limit });
    res.json(result);
});

// 综合推荐
app.post('/api/agent/recommend/comprehensive', (req, res) => {
    const result = recommendAgent.recommend('comprehensive', req.body);
    res.json(result);
});

// ==================== MonitorAgent API ====================

// 健康检查
app.get('/api/agent/health', async (req, res) => {
    try {
        const result = await agentManager.execute('monitor', 'healthCheck');
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 自动修复
app.post('/api/agent/fix', async (req, res) => {
    try {
        const { issues } = req.body;
        const result = await agentManager.execute('monitor', 'autoFix', { issues });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取监控日志
app.get('/api/agent/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const result = await agentManager.execute('monitor', 'getLogs', { limit });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DetectorAgent API ====================

// 检测网站变化
app.post('/api/agent/detect', async (req, res) => {
    try {
        const { type = 'characters' } = req.body;
        const result = await agentManager.execute('detector', 'detectChanges', { type });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取结构快照
app.post('/api/agent/snapshot', async (req, res) => {
    try {
        const { type = 'characters' } = req.body;
        const result = await agentManager.execute('detector', 'takeSnapshot', { type });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 生成选择器建议
app.post('/api/agent/selectors', async (req, res) => {
    try {
        const { type = 'characters' } = req.body;
        const result = await agentManager.execute('detector', 'generateSelectors', { type });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新选择器
app.post('/api/agent/selectors/update', async (req, res) => {
    try {
        const { type = 'characters', selectors } = req.body;
        const result = await agentManager.execute('detector', 'updateSelectors', { type, selectors });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Agent 统一接口 ====================

// 获取 Agent 状态
app.get('/api/agent/status', (req, res) => {
    res.json(agentManager.getStatus());
});

// 获取 Agent 帮助
app.get('/api/agent/help', (req, res) => {
    res.json(agentManager.getHelp());
});

// 统一 Agent 执行接口
app.post('/api/agent/execute', async (req, res) => {
    try {
        const { agent, action, params } = req.body;
        const result = await agentManager.execute(agent, action, params);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Scheduler API ====================

// 获取定时任务状态
app.get('/api/scheduler/status', (req, res) => {
    res.json({
        success: true,
        status: scheduler.getStatus()
    });
});

// 获取定时任务日志
app.get('/api/scheduler/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        success: true,
        logs: scheduler.getLogs(limit)
    });
});

// 手动触发爬取
app.post('/api/scheduler/crawl', async (req, res) => {
    try {
        const result = await scheduler.triggerCrawl();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 手动触发健康检查
app.post('/api/scheduler/health-check', async (req, res) => {
    try {
        const result = await scheduler.triggerHealthCheck();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动所有定时任务
app.post('/api/scheduler/start', (req, res) => {
    scheduler.startAll();
    res.json({ success: true, message: '所有定时任务已启动' });
});

// 停止所有定时任务
app.post('/api/scheduler/stop', (req, res) => {
    scheduler.stopAll();
    res.json({ success: true, message: '所有定时任务已停止' });
});

async function startServer() {
    await initDatabase();
    loadCache();
    
    // 启动定时任务
    scheduler.startAll();
    
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log('API endpoints:');
        console.log('  === 角色 API ===');
        console.log('  GET /api/characters - 获取角色列表');
        console.log('  GET /api/character/:name - 获取单个角色');
        console.log('  POST /api/characters/compare - 角色对比');
        console.log('  === 新闻 API ===');
        console.log('  GET /api/news - 获取新闻列表');
        console.log('  GET /api/news/categories - 获取新闻分类');
        console.log('  === 恶魔果实 API ===');
        console.log('  GET /api/devil-fruits - 获取恶魔果实列表');
        console.log('  GET /api/devil-fruit/types - 获取恶魔果实类型');
        console.log('  === 动画/漫画 API ===');
        console.log('  GET /api/anime - 获取动画章节');
        console.log('  GET /api/manga - 获取漫画章节');
        console.log('  === 事件 API ===');
        console.log('  GET /api/events - 获取事件列表');
        console.log('  === 用户 API ===');
        console.log('  POST /api/auth/register - 用户注册');
        console.log('  POST /api/auth/login - 用户登录');
        console.log('  GET /api/user/me - 获取当前用户');
        console.log('  PUT /api/user/me - 更新用户信息');
        console.log('  === 收藏 API ===');
        console.log('  GET /api/favorites - 获取收藏列表');
        console.log('  POST /api/favorites - 添加收藏');
        console.log('  DELETE /api/favorites/:type/:itemId - 删除收藏');
        console.log('  === 统计 API ===');
        console.log('  GET /api/statistics - 获取数据统计');
        console.log('  === 导出 API ===');
        console.log('  GET /api/export/characters - 导出角色CSV');
        console.log('  === 版本管理 API ===');
        console.log('  GET /api/versions - 获取版本列表');
        console.log('  GET /api/versions/:dataType/:version - 获取指定版本');
        console.log('  GET /api/versions/:dataType/compare - 版本对比');
        console.log('  === 爬取 API ===');
        console.log('  GET /api/crawl - 触发爬取');
        console.log('  === Agent API ===');
        console.log('  POST /api/agent/query - 自然语言查询');
        console.log('  GET /api/agent/query-types - 获取支持的查询类型');
        console.log('  GET /api/agent/health - 数据健康检查');
        console.log('  POST /api/agent/fix - 自动修复问题');
        console.log('  GET /api/agent/logs - 获取监控日志');
        console.log('  POST /api/agent/detect - 检测网站变化');
        console.log('  POST /api/agent/snapshot - 获取结构快照');
        console.log('  POST /api/agent/selectors - 生成选择器建议');
        console.log('  GET /api/agent/status - 获取Agent状态');
        console.log('  GET /api/agent/help - 获取使用帮助');
        console.log('  === Scheduler API ===');
        console.log('  GET /api/scheduler/status - 获取定时任务状态');
        console.log('  GET /api/scheduler/logs - 获取任务日志');
        console.log('  POST /api/scheduler/crawl - 手动触发爬取');
        console.log('  POST /api/scheduler/health-check - 手动健康检查');
        console.log('  POST /api/scheduler/start - 启动定时任务');
        console.log('  POST /api/scheduler/stop - 停止定时任务');
        console.log('  GET /api/cache-status - 查看缓存状态');
    });
}

app.get('/api/characters', (req, res) => {
    const { search, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', organization } = req.query;
    
    console.log('[API] characters request - cache length:', cache.characters.length);
    console.log('[API] search:', search, 'organization:', organization);
    
    let characters = [...cache.characters];
    
    if (search) {
        const query = search.toLowerCase();
        characters = characters.filter(c => 
            c.name.toLowerCase().includes(query) ||
            (c.organization && c.organization.toLowerCase().includes(query)) ||
            (c.devilFruit && c.devilFruit.toLowerCase().includes(query))
        );
    }
    
    if (organization) {
        characters = characters.filter(c => c.organization && c.organization.includes(organization));
    }
    
    characters.sort((a, b) => {
        let aVal, bVal;
        if (sortBy === 'bounty') {
            aVal = parseBounty(a.bounty);
            bVal = parseBounty(b.bounty);
        } else if (sortBy === 'birthday') {
            aVal = a.birthday || '';
            bVal = b.birthday || '';
        } else {
            aVal = a.name || '';
            bVal = b.name || '';
        }
        
        if (sortOrder === 'desc') {
            return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
    });
    
    const total = characters.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedCharacters = characters.slice(start, end);
    
    res.json({ 
        success: true, 
        data: paginatedCharacters,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

app.get('/api/news', (req, res) => {
    const { search, page = 1, limit = 10, category } = req.query;
    
    let news = [...cache.news];
    
    if (search) {
        const query = search.toLowerCase();
        news = news.filter(n => 
            n.title.toLowerCase().includes(query) ||
            (n.category && n.category.toLowerCase().includes(query))
        );
    }
    
    if (category) {
        news = news.filter(n => n.category === category);
    }
    
    const total = news.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedNews = news.slice(start, end);
    
    res.json({ 
        success: true, 
        data: paginatedNews,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

app.get('/api/news/categories', (req, res) => {
    const categories = [...new Set(cache.news.map(n => n.category).filter(Boolean))];
    res.json({ success: true, data: categories });
});

app.get('/api/character/:name', (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const character = cache.characters.find(c => c.name === name);
    
    if (character) {
        res.json({ success: true, data: character });
    } else {
        res.status(404).json({ success: false, message: '角色未找到' });
    }
});

app.post('/api/characters/compare', (req, res) => {
    const { names } = req.body;
    
    if (!names || !Array.isArray(names) || names.length < 2) {
        return res.status(400).json({ success: false, message: '请至少提供两个角色名' });
    }
    
    const characters = names.map(name => {
        const char = cache.characters.find(c => c.name === name);
        return char ? char : { name, notFound: true };
    }).filter(Boolean);
    
    if (characters.length < 2) {
        return res.status(404).json({ success: false, message: '找不到足够的角色进行对比' });
    }
    
    const fields = ['name', 'bounty', 'age', 'height', 'birthday', 'bloodType', 'hometown', 'organization', 'occupation', 'devilFruit'];
    
    const comparison = fields.map(field => ({
        field,
        values: characters.map(c => c[field] || '-')
    }));
    
    res.json({ 
        success: true, 
        data: {
            characters,
            comparison
        }
    });
});

app.get('/api/devil-fruits', (req, res) => {
    const { search, page = 1, limit = 10, type } = req.query;
    
    let fruits = [...cache.devilFruits];
    
    if (search) {
        const query = search.toLowerCase();
        fruits = fruits.filter(f => 
            f.name.toLowerCase().includes(query) ||
            (f.type && f.type.toLowerCase().includes(query)) ||
            (f.ability && f.ability.toLowerCase().includes(query)) ||
            (f.user && f.user.toLowerCase().includes(query))
        );
    }
    
    if (type) {
        fruits = fruits.filter(f => f.type && f.type.includes(type));
    }
    
    const total = fruits.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedFruits = fruits.slice(start, end);
    
    res.json({ 
        success: true, 
        data: paginatedFruits,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

app.get('/api/devil-fruit/types', (req, res) => {
    const types = [...new Set(cache.devilFruits.map(f => f.type).filter(Boolean))];
    res.json({ success: true, data: types });
});

app.get('/api/anime', (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    
    let episodes = [...cache.animeEpisodes];
    
    if (search) {
        const query = search.toLowerCase();
        episodes = episodes.filter(e => 
            e.title.toLowerCase().includes(query) ||
            e.episodeNumber.includes(query)
        );
    }
    
    episodes.sort((a, b) => {
        const numA = parseInt(a.episodeNumber) || 0;
        const numB = parseInt(b.episodeNumber) || 0;
        return numB - numA;
    });
    
    const total = episodes.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedEpisodes = episodes.slice(start, end);
    
    res.json({ 
        success: true, 
        data: paginatedEpisodes,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

app.get('/api/manga', (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    
    let chapters = [...cache.mangaChapters];
    
    if (search) {
        const query = search.toLowerCase();
        chapters = chapters.filter(c => 
            c.title.toLowerCase().includes(query) ||
            c.chapterNumber.includes(query)
        );
    }
    
    chapters.sort((a, b) => {
        const numA = parseInt(a.chapterNumber) || 0;
        const numB = parseInt(b.chapterNumber) || 0;
        return numB - numA;
    });
    
    const total = chapters.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedChapters = chapters.slice(start, end);
    
    res.json({ 
        success: true, 
        data: paginatedChapters,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

app.get('/api/events', (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    
    let events = [...cache.events];
    
    if (search) {
        const query = search.toLowerCase();
        events = events.filter(e => 
            e.title.toLowerCase().includes(query)
        );
    }
    
    const total = events.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedEvents = events.slice(start, end);
    
    res.json({ 
        success: true, 
        data: paginatedEvents,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

app.get('/api/organizations', (req, res) => {
    const organizations = [...new Set(cache.characters.map(c => c.organization).filter(Boolean))];
    res.json({ success: true, data: organizations });
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    
    const result = await createUser(username, password, email);
    
    if (result.success) {
        const token = generateToken(result.data);
        res.json({ 
            success: true, 
            data: { 
                user: result.data, 
                token 
            } 
        });
    } else {
        res.status(400).json(result);
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
        const token = generateToken(result.data);
        res.json({ 
            success: true, 
            data: { 
                user: result.data, 
                token 
            } 
        });
    } else {
        res.status(401).json(result);
    }
});

app.get('/api/user/me', authenticate, (req, res) => {
    res.json({ success: true, data: req.user });
});

app.put('/api/user/me', authenticate, async (req, res) => {
    const { email, avatar } = req.body;
    const result = await updateUser(req.user.id, { email, avatar });
    res.json(result);
});

app.put('/api/user/me/password', authenticate, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const result = await updatePassword(req.user.id, oldPassword, newPassword);
    res.json(result);
});

app.get('/api/favorites', authenticate, async (req, res) => {
    const { type } = req.query;
    const result = await getFavoritesByUser(req.user.id, type);
    res.json(result);
});

app.post('/api/favorites', authenticate, async (req, res) => {
    const { type, itemId, itemName, itemImage } = req.body;
    
    if (!type || !itemId || !itemName) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const result = await addFavorite(req.user.id, type, itemId, itemName, itemImage);
    res.json(result);
});

app.delete('/api/favorites/:type/:itemId', authenticate, async (req, res) => {
    const { type, itemId } = req.params;
    const result = await removeFavorite(req.user.id, type, itemId);
    res.json(result);
});

app.get('/api/favorites/check/:type/:itemId', authenticate, async (req, res) => {
    const { type, itemId } = req.params;
    const result = await isFavorite(req.user.id, type, itemId);
    res.json(result);
});

app.get('/api/favorites/count', authenticate, async (req, res) => {
    const { type } = req.query;
    const result = await getFavoriteCount(req.user.id, type);
    res.json(result);
});

app.get('/api/statistics', (req, res) => {
    const statistics = {
        characters: cache.characters.length,
        news: cache.news.length,
        devilFruits: cache.devilFruits.length,
        animeEpisodes: cache.animeEpisodes.length,
        mangaChapters: cache.mangaChapters.length,
        events: cache.events.length,
        lastCrawlTime: cache.lastCrawlTime,
        cacheValid: isCacheValid()
    };
    
    res.json({ success: true, data: statistics });
});

app.get('/api/backups', (req, res) => {
    const result = getBackupList();
    res.json(result);
});

app.post('/api/backups/create', (req, res) => {
    createBackup();
    res.json({ success: true, message: '备份已创建' });
});

app.post('/api/backups/restore/:fileName', (req, res) => {
    const { fileName } = req.params;
    const result = loadBackup(fileName);
    res.json(result);
});

app.delete('/api/backups/:fileName', (req, res) => {
    const { fileName } = req.params;
    try {
        fs.unlinkSync(path.join(BACKUP_DIR, fileName));
        res.json({ success: true, message: `备份已删除: ${fileName}` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

app.get('/api/export/characters', (req, res) => {
    const fs = require('fs');
    
    // 只导出需要的字段，没有数据的用-代替
    const data = cache.characters.map(c => ({
        name: c.name || '-',
        bounty: c.bounty || '-',
        organization: c.organization || '-',
        birthday: c.birthday || '-'
    }));
    
    // 手动生成CSV内容，添加BOM解决Excel乱码
    const BOM = '\uFEFF';
    const header = '姓名,悬赏金,所属组织,生日\n';
    const rows = data.map(c => 
        `"${c.name}","${c.bounty}","${c.organization}","${c.birthday}"`
    ).join('\n');
    
    const csvContent = BOM + header + rows;
    const filePath = path.join(dataDir, 'characters_export.csv');
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
    res.download(filePath, '海贼王角色列表.csv');
});

app.get('/api/export/devil-fruits', (req, res) => {
    const csvWriter = createCsvWriter({
        path: path.join(dataDir, 'devil_fruits_export.csv'),
        header: [
            { id: 'name', title: '果实名称' },
            { id: 'type', title: '类型' },
            { id: 'ability', title: '能力' },
            { id: 'user', title: '能力者' }
        ]
    });
    
    csvWriter.writeRecords(cache.devilFruits)
        .then(() => {
            res.download(path.join(dataDir, 'devil_fruits_export.csv'), 'devil_fruits.csv');
        })
        .catch(error => {
            res.status(500).json({ success: false, message: '导出失败', error: error.message });
        });
});

app.get('/api/versions', async (req, res) => {
    const { dataType } = req.query;
    const result = await getAllVersions(dataType);
    res.json(result);
});

app.get('/api/versions/:dataType/:version', async (req, res) => {
    const { dataType, version } = req.params;
    const result = await getVersion(dataType, parseInt(version));
    res.json(result);
});

app.get('/api/versions/:dataType/compare', async (req, res) => {
    const { dataType } = req.params;
    const { v1, v2 } = req.query;
    
    if (!v1 || !v2) {
        return res.status(400).json({ success: false, message: '请提供两个版本号' });
    }
    
    const result = await compareVersions(dataType, parseInt(v1), parseInt(v2));
    res.json(result);
});

app.get('/api/crawl', async (req, res) => {
    const { force = 'false' } = req.query;
    
    if (!force && isCacheValid()) {
        res.json({ 
            success: true, 
            message: '数据仍在缓存期内，使用缓存数据',
            cacheValid: true,
            lastCrawlTime: cache.lastCrawlTime,
            charactersCount: cache.characters.length,
            newsCount: cache.news.length,
            devilFruitsCount: cache.devilFruits.length,
            animeEpisodesCount: cache.animeEpisodes.length,
            mangaChaptersCount: cache.mangaChapters.length,
            eventsCount: cache.events.length
        });
        return;
    }
    
    try {
        console.log('开始爬取...');
        
        const result = await crawlAll();
        
        const existingNames = new Set(cache.characters.map(c => c.name));
        const crawledNames = new Set(result.characters.map(c => c.name));
        const mergedCharacters = [...result.characters];
        cache.characters.forEach(c => {
            if (!crawledNames.has(c.name)) {
                mergedCharacters.push(c);
            }
        });
        
        cache.characters = mergedCharacters;
        cache.news = result.news;
        cache.devilFruits = result.devilFruits;
        cache.animeEpisodes = result.animeEpisodes;
        cache.mangaChapters = result.mangaChapters;
        cache.events = result.events;
        cache.lastCrawlTime = Date.now();
        
        saveVersion('characters', mergedCharacters);
        saveVersion('news', result.news);
        saveVersion('devil_fruits', result.devilFruits);
        saveVersion('anime_episodes', result.animeEpisodes);
        saveVersion('manga_chapters', result.mangaChapters);
        saveVersion('events', result.events);
        
        res.json({ 
            success: true, 
            message: '爬取完成',
            cacheValid: false,
            charactersCount: mergedCharacters.length,
            newsCount: result.news.length,
            devilFruitsCount: result.devilFruits.length,
            animeEpisodesCount: result.animeEpisodes.length,
            mangaChaptersCount: result.mangaChapters.length,
            eventsCount: result.events.length
        });
    } catch (error) {
        console.error('Error crawling:', error);
        res.status(500).json({ success: false, message: '爬取失败', error: error.message });
    }
});

app.get('/api/crawl/characters', async (req, res) => {
    try {
        console.log('开始爬取角色数据...');
        
        const characters = await fetchCharacterList();
        
        const existingNames = new Set(cache.characters.map(c => c.name));
        const crawledNames = new Set(characters.map(c => c.name));
        const mergedCharacters = [...characters];
        cache.characters.forEach(c => {
            if (!crawledNames.has(c.name)) {
                mergedCharacters.push(c);
            }
        });
        
        cache.characters = mergedCharacters;
        cache.lastCrawlTime = Date.now();
        
        saveVersion('characters', mergedCharacters);
        
        res.json({ 
            success: true, 
            message: '角色数据爬取完成',
            charactersCount: mergedCharacters.length
        });
    } catch (error) {
        console.error('Error crawling characters:', error);
        res.status(500).json({ success: false, message: '角色数据爬取失败', error: error.message });
    }
});

app.get('/api/cache-status', (req, res) => {
    res.json({
        success: true,
        cacheValid: isCacheValid(),
        lastCrawlTime: cache.lastCrawlTime,
        charactersCount: cache.characters.length,
        newsCount: cache.news.length,
        devilFruitsCount: cache.devilFruits.length,
        animeEpisodesCount: cache.animeEpisodes.length,
        mangaChaptersCount: cache.mangaChapters.length,
        eventsCount: cache.events.length,
        cacheDuration: cache.cacheDuration,
        characterNames: cache.characters.map(c => c.name)
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function parseBounty(bounty) {
    if (!bounty) return 0;
    let value = 0;
    const okuMatch = bounty.match(/(\d+(?:\.\d+)?)\s*億/);
    const manMatch = bounty.match(/(\d+(?:\.\d+)?)\s*万/);
    if (okuMatch) value += parseFloat(okuMatch[1]) * 100000000;
    if (manMatch) value += parseFloat(manMatch[1]) * 10000;
    return value;
}

startServer();