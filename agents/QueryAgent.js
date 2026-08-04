/**
 * QueryAgent - 自然语言查询 Agent
 * 支持用自然语言查询海贼王数据
 * 支持多条件组合查询
 */

const fs = require('fs');
const path = require('path');

class QueryAgent {
  constructor() {
    this.characters = [];
    this.devilFruits = [];
    this.queryHistory = []; // 查询历史记录
    this.load();
  }

  // 加载数据
  load() {
    try {
      const charactersPath = path.join(__dirname, '../data/characters.json');
      const devilFruitsPath = path.join(__dirname, '../data/devil_fruits.json');
      
      if (fs.existsSync(charactersPath)) {
        this.characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
      }
      if (fs.existsSync(devilFruitsPath)) {
        this.devilFruits = JSON.parse(fs.readFileSync(devilFruitsPath, 'utf-8'));
      }
    } catch (error) {
      console.error('QueryAgent 数据加载失败:', error.message);
    }
  }

  /**
   * 解析用户查询意图（增强版，支持多条件）
   * @param {string} query - 用户输入的自然语言查询
   * @returns {object} - 解析出的意图对象
   */
  parseIntent(query) {
    const normalizedQuery = query.toLowerCase();

    // 检测是否为多条件查询
    const multiConditionResult = this.parseMultiCondition(query);
    if (multiConditionResult) {
      return multiConditionResult;
    }

    // 意图模板（按优先级排序：筛选/排序 > 角色信息 > 列表）
    const intents = [
      // ============== 高优先级：筛选/排序/统计类 ==============

      // 排序查询 - 必须放在 character_bounty 之前
      {
        patterns: [
          '悬赏金最高(的)?(前)?(\\d+)?名?(角色)?',
          '悬赏金最高(的)?前(\\d+)名?(角色)?',
          '悬赏金前(\\d+)名(最高)?(角色)?',
          '赏金最高(的)?(前)?(\\d+)?名?(角色)?',
          '赏金最高(的)?前(\\d+)名?(角色)?',
          '赏金前(\\d+)名(最高)?(角色)?'
        ],
        type: 'top_bounty',
        extract: (match) => {
          const numbers = match[0].match(/\d+/g);
          return { limit: numbers && numbers[0] ? parseInt(numbers[0]) : 10 };
        }
      },
      {
        patterns: [
          '悬赏金最低(的)?(前)?(\\d+)?名?(角色)?',
          '悬赏金最低(的)?前(\\d+)名?(角色)?',
          '悬赏金前(\\d+)名(最低)?(角色)?',
          '赏金最低(的)?(前)?(\\d+)?名?(角色)?',
          '赏金最低(的)?前(\\d+)名?(角色)?',
          '赏金前(\\d+)名(最低)?(角色)?'
        ],
        type: 'bottom_bounty',
        extract: (match) => {
          const numbers = match[0].match(/\d+/g);
          return { limit: numbers && numbers[0] ? parseInt(numbers[0]) : 10 };
        }
      },

      // 悬赏金区间查询
      {
        patterns: ['悬赏金(在|介于)?(\\d+)(亿|千万|万)?(和|到|与)(\\d+)(亿|千万|万)?(之间)?', '赏金(在|介于)?(\\d+)(亿|千万|万)?(和|到|与)(\\d+)(亿|千万|万)?(之间)?'],
        type: 'filter_bounty_range',
        extract: (match) => ({
          minThreshold: this.parseBounty(match[2], match[3] || '亿'),
          maxThreshold: this.parseBounty(match[5], match[6] || '亿')
        })
      },

      // 悬赏金筛选
      {
        patterns: ['悬赏金(超过|大于|高于)(\\d+)(亿|千万|万)', '赏金(超过|大于|高于)(\\d+)(亿|千万|万)'],
        type: 'filter_bounty_above',
        extract: (match) => ({ threshold: this.parseBounty(match[2], match[3]) })
      },
      {
        patterns: ['悬赏金(低于|小于|少于)(\\d+)(亿|千万|万)', '赏金(低于|小于|少于)(\\d+)(亿|千万|万)'],
        type: 'filter_bounty_below',
        extract: (match) => ({ threshold: this.parseBounty(match[2], match[3]) })
      },

      // 无果实角色查询
      {
        patterns: ['(哪些|哪个|什么)(角色|人)(没有|无)(恶魔)?果实', '(没有|无)(恶魔)?果实的(角色|人)'],
        type: 'no_fruit_characters',
        extract: () => ({})
      },

      // 组织成员查询
      {
        patterns: ['(\\S+海贼团|\\S+组织|麦わらの一味|草帽.*团|海军|革命军|七武海)(里|中|里)?有哪些?(人|角色|成员)'],
        type: 'org_members',
        extract: (match) => ({ organization: match[1] })
      },

      // 恶魔果实类型查询
      {
        patterns: ['(超人系|动物系|自然系|特殊系)(恶魔)?果实(有)?(哪些)?'],
        type: 'fruit_by_type',
        extract: (match) => ({ fruitType: match[1] })
      },

      // 果实能力者查询
      {
        patterns: ['(\\S+果实)是谁吃的', '谁吃了(\\S+果实)', '(\\S+の実)的能力者'],
        type: 'fruit_user',
        extract: (match) => ({ fruitName: match[1] })
      },

      // 统计查询
      {
        patterns: ['(有多少|总共有多少)(个)?(角色|人)'],
        type: 'stat_total_characters',
        extract: () => ({})
      },
      {
        patterns: ['(有多少|总共有多少)(种)?恶魔果实'],
        type: 'stat_total_fruits',
        extract: () => ({})
      },
      {
        patterns: ['(哪个|哪个组织|哪个团队)(的)?(角色|人)(最)?多'],
        type: 'stat_org_count',
        extract: () => ({})
      },

      // ============== 中优先级：角色信息查询 ==============
      // 角色悬赏金 - 必须是从开头就有非"悬赏/赏金"等关键词的字符
      {
        patterns: ['^((?!悬赏金|赏金|最高|最低|超过|低于|前|名|哪些|所有|列出)[\\s\\S]+?)(的)?(悬赏金|赏金)(是)?(多少)?$', '(.+?)的?bounty'],
        type: 'character_bounty',
        extract: (match) => ({ characterName: match[1] })
      },
      {
        patterns: ['(.+?)的?(生日|出生日期)', '(.+?)的?birthday'],
        type: 'character_birthday',
        extract: (match) => ({ characterName: match[1] })
      },
      {
        patterns: ['^((?!超人系|动物系|自然系|特殊系|哪些|所有|列出)[\\s\\S]+?)(的)?(恶魔果实|果实|能力)$', '(.+?)的?devilFruit'],
        type: 'character_fruit',
        extract: (match) => ({ characterName: match[1] })
      },
      {
        patterns: ['(.+?)属于?哪个(组织|团队|海贼团)', '(.+?)的?(组织|团队)'],
        type: 'character_org',
        extract: (match) => ({ characterName: match[1] })
      },

      // ============== 低优先级：列表查询 ==============
      {
        patterns: ['列出?(所有|全部)?(角色|人物)'],
        type: 'list_characters',
        extract: () => ({})
      },
      {
        patterns: ['列出?(所有|全部)?恶魔果实'],
        type: 'list_fruits',
        extract: () => ({})
      }
    ];

    // 匹配意图
    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        const regex = new RegExp(pattern, 'i');
        const match = normalizedQuery.match(regex);
        if (match) {
          // 对角色查询类意图，验证提取的角色名是否合理
          if (intent.type.startsWith('character_')) {
            const params = intent.extract(match);
            const charName = (params.characterName || '').trim();
            // 角色名中包含无效关键词，跳过
            const invalidKeywords = ['最高', '最低', '超过', '大于', '高于', '低于', '小于', '少于',
              '前', '名', '哪些', '所有', '全部', '列出', '属于', '哪个', '组织', '团队', '海贼团',
              '悬赏金', '赏金', '恶魔果实', '果实', '生日', '能力', '海军', '革命军', '七武海',
              '超人系', '动物系', '自然系', '特殊系'];
            const hasInvalid = invalidKeywords.some(kw => charName.includes(kw));
            if (hasInvalid || charName.length === 0) {
              continue;
            }
          }
          return {
            type: intent.type,
            params: intent.extract(match),
            originalQuery: query
          };
        }
      }
    }

    // 尝试模糊匹配角色名
    const characterMatch = this.findCharacterInQuery(normalizedQuery);
    if (characterMatch) {
      return {
        type: 'character_info',
        params: { characterName: characterMatch },
        originalQuery: query
      };
    }

    return {
      type: 'unknown',
      params: {},
      originalQuery: query
    };
  }

  /**
   * 解析多条件查询
   * 支持格式: "悬赏金超过10亿且是自然系果实的角色"
   */
  parseMultiCondition(query) {
    const normalizedQuery = query.toLowerCase();
    
    // 检测分隔符：且、和、并且、同时、,
    const separators = ['且', '和', '并且', '同时', ','];
    let hasSeparator = separators.some(s => query.includes(s));
    
    if (!hasSeparator) return null;
    
    // 解析条件
    const conditions = {
      bountyAbove: null,
      bountyBelow: null,
      organization: null,
      fruitType: null,
      hasFruit: null,
      birthday: null
    };
    
    // 提取悬赏金条件
    const bountyAboveMatch = query.match(/悬赏金(超过|大于|高于)(\d+)(亿|千万|万)/);
    if (bountyAboveMatch) {
      conditions.bountyAbove = this.parseBounty(bountyAboveMatch[2], bountyAboveMatch[3]);
    }
    
    const bountyBelowMatch = query.match(/悬赏金(低于|小于|少于)(\d+)(亿|千万|万)/);
    if (bountyBelowMatch) {
      conditions.bountyBelow = this.parseBounty(bountyBelowMatch[2], bountyBelowMatch[3]);
    }
    
    // 提取组织条件
    const orgPatterns = ['草帽海贼团', '白胡子海贼团', '黑胡子海贼团', '百兽海贼团', '海军', '革命军', '七武海'];
    for (const org of orgPatterns) {
      if (query.includes(org)) {
        conditions.organization = this.normalizeOrganization(org);
        break;
      }
    }
    
    // 提取果实类型条件
    const fruitTypeMatch = query.match(/(超人系|动物系|自然系|特殊系)(恶魔)?果实/);
    if (fruitTypeMatch) {
      conditions.fruitType = fruitTypeMatch[1];
    }
    
    // 提取是否有果实条件
    if (query.includes('有果实') || query.includes('吃了果实') || query.includes('能力者')) {
      conditions.hasFruit = true;
    }
    if (query.includes('没有果实') || query.includes('无果实') || query.includes('没吃果实')) {
      conditions.hasFruit = false;
    }
    
    // 提取生日月份条件
    const birthdayMatch = query.match(/(\d+)月(生日|出生)/);
    if (birthdayMatch) {
      conditions.birthday = parseInt(birthdayMatch[1]);
    }
    
    // 检查是否有有效条件
    const hasConditions = Object.values(conditions).some(v => v !== null);
    if (!hasConditions) return null;
    
    return {
      type: 'multi_condition',
      params: conditions,
      originalQuery: query
    };
  }

  // 解析悬赏金数字
  parseBounty(num, unit) {
    const n = parseInt(num);
    if (unit === '亿') return n * 100000000;
    if (unit === '千万') return n * 10000000;
    if (unit === '万') return n * 10000;
    return n;
  }

  // 在查询中查找角色名
  findCharacterInQuery(query) {
    for (const char of this.characters) {
      // 日文名
      if (query.includes(char.name.toLowerCase())) {
        return char.name;
      }
      // 常见中文别名
      const aliases = this.getCharacterAliases(char.name);
      for (const alias of aliases) {
        if (query.includes(alias.toLowerCase())) {
          return char.name;
        }
      }
    }
    return null;
  }

  // 获取角色中文别名
  getCharacterAliases(japaneseName) {
    const aliasMap = {
      'モンキー・D・ルフィ': ['路飞', '鲁夫', 'luffy'],
      'ロロノア・ゾロ': ['索隆', '佐罗', 'zoro', '罗罗诺亚索隆'],
      'ナミ': ['娜美', 'nami'],
      'ウソップ': ['乌索普', 'usopp'],
      'サンジ': ['山治', '香吉士', 'sanji'],
      'トニートニー・チョッパー': ['乔巴', 'chopper'],
      'ニコ・ロビン': ['罗宾', 'robin', '妮可罗宾'],
      'フランキー': ['弗兰奇', 'franky'],
      'ブルック': ['布鲁克', 'brook'],
      'ジンベエ': ['甚平', 'jinbe'],
      'シャンクス': ['香克斯', '红发', 'shanks'],
      'エドワード・ニューゲート': ['白胡子', 'whitebeard'],
      'ポートガス・D・エース': ['艾斯', 'ace'],
      'トラファルガー・ロー': ['罗', 'law', '罗罗诺亚'],
      'ドンキホーテ・ドフラミンゴ': ['多弗朗明哥', 'doflamingo'],
      'クロコダイル': ['克洛克达尔', '沙鳄鱼', 'crocodile'],
      'ギルド・ティーチ': ['黑胡子', '蒂奇', 'blackbeard'],
      'カイドウ': ['凯多', 'kaido'],
      'ブルージャン': ['bigmom', '大妈', 'big mom'],
      '赤犬': ['萨卡斯基', 'akainu'],
      '青キジ': ['库赞', 'aokiji', '青雉'],
      '黄猿': ['波鲁萨利诺', 'kizaru'],
      '藤虎': ['一笑', 'fujitora'],
      'モンキー・D・ドラゴン': ['龙', 'dragon'],
      'ゴール・D・ロジャー': ['罗杰', 'roger']
    };
    return aliasMap[japaneseName] || [];
  }

  /**
   * 执行查询
   * @param {object} intent - 意图对象
   * @returns {object} - 查询结果
   */
  execute(intent) {
    const { type, params } = intent;
    
    switch (type) {
      case 'character_bounty':
        return this.queryBounty(params.characterName);
      case 'character_birthday':
        return this.queryBirthday(params.characterName);
      case 'character_fruit':
        return this.queryDevilFruit(params.characterName);
      case 'character_org':
        return this.queryOrganization(params.characterName);
      case 'character_info':
        return this.queryCharacterInfo(params.characterName);
      case 'filter_bounty_above':
        return this.filterBountyAbove(params.threshold);
      case 'filter_bounty_below':
        return this.filterBountyBelow(params.threshold);
      case 'filter_bounty_range':
        return this.filterBountyRange(params.minThreshold, params.maxThreshold);
      case 'org_members':
        return this.queryOrgMembers(params.organization);
      case 'fruit_by_type':
        return this.queryFruitsByType(params.fruitType);
      case 'fruit_user':
        return this.queryFruitUser(params.fruitName);
      case 'no_fruit_characters':
        return this.queryNoFruitCharacters();
      case 'stat_org_count':
        return this.statOrgCount();
      case 'stat_total_characters':
        return this.statTotalCharacters();
      case 'stat_total_fruits':
        return this.statTotalFruits();
      case 'list_characters':
        return this.listCharacters();
      case 'list_fruits':
        return this.listFruits();
      case 'top_bounty':
        return this.getTopBounty(params.limit);
      case 'bottom_bounty':
        return this.getBottomBounty(params.limit);
      case 'multi_condition':
        return this.executeMultiCondition(params);
      default:
        return { success: false, error: '无法理解您的查询，请尝试其他表达方式' };
    }
  }

  /**
   * 执行多条件查询
   */
  executeMultiCondition(conditions) {
    let filtered = [...this.characters];
    
    // 悬赏金过滤
    if (conditions.bountyAbove !== null) {
      filtered = filtered.filter(char => {
        const bounty = this.parseJapaneseBounty(char.bounty);
        return bounty >= conditions.bountyAbove;
      });
    }
    
    if (conditions.bountyBelow !== null) {
      filtered = filtered.filter(char => {
        const bounty = this.parseJapaneseBounty(char.bounty);
        return bounty > 0 && bounty <= conditions.bountyBelow;
      });
    }
    
    // 组织过滤
    if (conditions.organization) {
      filtered = filtered.filter(char => {
        return char.organization && this.normalizeOrganization(char.organization) === conditions.organization;
      });
    }
    
    // 果实类型过滤
    if (conditions.fruitType) {
      const typeMap = {
        '超人系': '超人系',
        '动物系': '動物系',
        '自然系': '自然系',
        '特殊系': '特殊系'
      };
      const targetType = typeMap[conditions.fruitType];
      
      // 获取该类型的所有果实
      const fruitsOfType = this.devilFruits.filter(f => f.type === targetType);
      const fruitNames = fruitsOfType.map(f => f.name);
      
      filtered = filtered.filter(char => {
        if (!char.devilFruit) return false;
        return fruitNames.some(fn => char.devilFruit.includes(fn));
      });
    }
    
    // 是否有果实过滤
    if (conditions.hasFruit === true) {
      filtered = filtered.filter(char => char.devilFruit && char.devilFruit.trim() !== '');
    } else if (conditions.hasFruit === false) {
      filtered = filtered.filter(char => !char.devilFruit || char.devilFruit.trim() === '');
    }
    
    // 生日月份过滤
    if (conditions.birthday) {
      filtered = filtered.filter(char => {
        if (!char.birthday) return false;
        const match = char.birthday.match(/(\d+)月/);
        return match && parseInt(match[1]) === conditions.birthday;
      });
    }
    
    if (filtered.length === 0) {
      return { success: true, answer: '没有找到符合条件的角色', data: [] };
    }
    
    const names = filtered.map(c => `${c.name} (${c.bounty || '无悬赏金'})`).join('\n');
    return {
      success: true,
      answer: `找到 ${filtered.length} 个符合条件的角色：\n${names}`,
      data: filtered
    };
  }

  // 查询悬赏金
  queryBounty(characterName) {
    const char = this.findCharacter(characterName);
    if (!char) {
      return { success: false, error: `找不到角色: ${characterName}` };
    }
    return {
      success: true,
      answer: `${char.name} 的悬赏金是 ${char.bounty || '未知'}`,
      data: { name: char.name, bounty: char.bounty }
    };
  }

  // 查询生日
  queryBirthday(characterName) {
    const char = this.findCharacter(characterName);
    if (!char) {
      return { success: false, error: `找不到角色: ${characterName}` };
    }
    return {
      success: true,
      answer: `${char.name} 的生日是 ${char.birthday || '未知'}`,
      data: { name: char.name, birthday: char.birthday }
    };
  }

  // 查询恶魔果实
  queryDevilFruit(characterName) {
    const char = this.findCharacter(characterName);
    if (!char) {
      return { success: false, error: `找不到角色: ${characterName}` };
    }
    const fruit = char.devilFruit || '无（没有吃恶魔果实）';
    return {
      success: true,
      answer: `${char.name} 的恶魔果实是 ${fruit}`,
      data: { name: char.name, devilFruit: char.devilFruit }
    };
  }

  // 查询组织
  queryOrganization(characterName) {
    const char = this.findCharacter(characterName);
    if (!char) {
      return { success: false, error: `找不到角色: ${characterName}` };
    }
    return {
      success: true,
      answer: `${char.name} 属于 ${char.organization || '未知'}`,
      data: { name: char.name, organization: char.organization }
    };
  }

  // 查询角色完整信息
  queryCharacterInfo(characterName) {
    const char = this.findCharacter(characterName);
    if (!char) {
      return { success: false, error: `找不到角色: ${characterName}` };
    }
    return {
      success: true,
      answer: this.formatCharacterInfo(char),
      data: char
    };
  }

  // 格式化角色信息
  formatCharacterInfo(char) {
    const parts = [`【${char.name}】`];
    if (char.organization) parts.push(`组织: ${char.organization}`);
    if (char.bounty) parts.push(`悬赏金: ${char.bounty}`);
    if (char.devilFruit) parts.push(`恶魔果实: ${char.devilFruit}`);
    if (char.birthday) parts.push(`生日: ${char.birthday}`);
    return parts.join('\n');
  }

  // 筛选悬赏金高于阈值的角色
  filterBountyAbove(threshold) {
    const filtered = this.characters.filter(char => {
      if (!char.bounty) return false;
      const bounty = this.parseJapaneseBounty(char.bounty);
      return bounty >= threshold;
    });
    
    if (filtered.length === 0) {
      return { success: true, answer: '没有找到悬赏金超过该金额的角色', data: [] };
    }
    
    const names = filtered.map(c => `${c.name} (${c.bounty})`).join('\n');
    return {
      success: true,
      answer: `悬赏金超过该金额的角色有 ${filtered.length} 个：\n${names}`,
      data: filtered
    };
  }

  // 筛选悬赏金低于阈值的角色
  filterBountyBelow(threshold) {
    const filtered = this.characters.filter(char => {
      if (!char.bounty) return false;
      const bounty = this.parseJapaneseBounty(char.bounty);
      return bounty > 0 && bounty < threshold;
    });
    
    if (filtered.length === 0) {
      return { success: true, answer: '没有找到悬赏金低于该金额的角色', data: [] };
    }
    
    const names = filtered.map(c => `${c.name} (${c.bounty})`).join('\n');
    return {
      success: true,
      answer: `悬赏金低于该金额的角色有 ${filtered.length} 个：\n${names}`,
      data: filtered
    };
  }

  // 筛选悬赏金区间
  filterBountyRange(min, max) {
    const filtered = this.characters.filter(char => {
      if (!char.bounty) return false;
      const bounty = this.parseJapaneseBounty(char.bounty);
      return bounty >= min && bounty <= max;
    });
    
    if (filtered.length === 0) {
      return { success: true, answer: '没有找到悬赏金在该范围内的角色', data: [] };
    }
    
    const names = filtered.map(c => `${c.name} (${c.bounty})`).join('\n');
    return {
      success: true,
      answer: `悬赏金在该范围内的角色有 ${filtered.length} 个：\n${names}`,
      data: filtered
    };
  }

  // 获取悬赏金最高的N个角色
  getTopBounty(limit) {
    const sorted = [...this.characters]
      .filter(c => c.bounty)
      .sort((a, b) => this.parseJapaneseBounty(b.bounty) - this.parseJapaneseBounty(a.bounty))
      .slice(0, limit);
    
    const names = sorted.map((c, i) => `${i + 1}. ${c.name} (${c.bounty})`).join('\n');
    return {
      success: true,
      answer: `悬赏金最高的 ${sorted.length} 个角色：\n${names}`,
      data: sorted
    };
  }

  // 获取悬赏金最低的N个角色
  getBottomBounty(limit) {
    const sorted = [...this.characters]
      .filter(c => c.bounty)
      .sort((a, b) => this.parseJapaneseBounty(a.bounty) - this.parseJapaneseBounty(b.bounty))
      .slice(0, limit);
    
    const names = sorted.map((c, i) => `${i + 1}. ${c.name} (${c.bounty})`).join('\n');
    return {
      success: true,
      answer: `悬赏金最低的 ${sorted.length} 个角色：\n${names}`,
      data: sorted
    };
  }

  // 解析日文悬赏金
  parseJapaneseBounty(bountyStr) {
    if (!bountyStr) return 0;
    const match = bountyStr.match(/(\d+)億(\d+)?千万?/);
    if (match) {
      const oku = parseInt(match[1]) * 100000000;
      const senman = match[2] ? parseInt(match[2]) * 10000000 : 0;
      return oku + senman;
    }
    const match2 = bountyStr.match(/(\d+)億/);
    if (match2) return parseInt(match2[1]) * 100000000;
    const match3 = bountyStr.match(/(\d+)万/);
    if (match3) return parseInt(match3[1]) * 10000;
    return 0;
  }

  // 查询组织成员
  queryOrgMembers(organization) {
    const normalizedOrg = this.normalizeOrganization(organization);
    const members = this.characters.filter(char => 
      char.organization && this.normalizeOrganization(char.organization) === normalizedOrg
    );
    
    if (members.length === 0) {
      return { success: false, error: `找不到组织: ${organization}` };
    }
    
    const names = members.map(c => c.name).join('\n');
    return {
      success: true,
      answer: `${organization} 有 ${members.length} 个成员：\n${names}`,
      data: members
    };
  }

  // 标准化组织名
  normalizeOrganization(org) {
    const orgMap = {
      '草帽海贼团': '麦わらの一味',
      '草帽团': '麦わらの一味',
      '白胡子海贼团': '白ひげ海賊団',
      '黑胡子海贼团': '黒ひげ海賊団',
      '百兽海贼团': '百獣海賊団',
      'bigmom海贼团': 'ビッグ・マム海賊団',
      '大妈海贼团': 'ビッグ・マム海賊団',
      '七武海': '王下七武海',
      '海军': '海軍',
      '革命军': '革命軍'
    };
    return orgMap[org] || org;
  }

  // 按类型查询恶魔果实
  queryFruitsByType(fruitType) {
    const typeMap = {
      '超人系': '超人系',
      '动物系': '動物系',
      '自然系': '自然系',
      '特殊系': '特殊系'
    };
    const targetType = typeMap[fruitType] || fruitType;
    const fruits = this.devilFruits.filter(f => f.type === targetType);
    
    if (fruits.length === 0) {
      return { success: false, error: `找不到类型: ${fruitType}` };
    }
    
    const names = fruits.map(f => f.name).join('\n');
    return {
      success: true,
      answer: `${fruitType}恶魔果实有 ${fruits.length} 个：\n${names}`,
      data: fruits
    };
  }

  // 查询果实能力者
  queryFruitUser(fruitName) {
    const fruit = this.devilFruits.find(f =>
      f.name.includes(fruitName) || fruitName.includes(f.name.replace('の実', ''))
    );

    if (!fruit) {
      return { success: false, error: `找不到恶魔果实: ${fruitName}` };
    }

    const users = fruit.users && fruit.users.length > 0 ? fruit.users.join(', ') : '未知';
    return {
      success: true,
      answer: `${fruit.name} 的能力者是 ${users}`,
      data: fruit
    };
  }

  // 查询没有恶魔果实的角色
  queryNoFruitCharacters() {
    const noFruitChars = this.characters.filter(char =>
      !char.devilFruit || char.devilFruit.trim() === ''
    );

    if (noFruitChars.length === 0) {
      return { success: true, answer: '所有角色都有恶魔果实', data: [] };
    }

    const names = noFruitChars.slice(0, 20).map(c => c.name).join('\n');
    return {
      success: true,
      answer: `没有恶魔果实的角色有 ${noFruitChars.length} 个：\n${names}${noFruitChars.length > 20 ? '\n...(显示前20个)' : ''}`,
      data: noFruitChars
    };
  }

  // 统计组织角色数量
  statOrgCount() {
    const orgCounts = {};
    this.characters.forEach(char => {
      if (char.organization) {
        orgCounts[char.organization] = (orgCounts[char.organization] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(orgCounts).sort((a, b) => b[1] - a[1]);
    const topOrg = sorted[0];
    
    return {
      success: true,
      answer: `角色最多的组织是 ${topOrg[0]}，有 ${topOrg[1]} 个角色`,
      data: { organization: topOrg[0], count: topOrg[1], all: sorted }
    };
  }

  // 统计角色总数
  statTotalCharacters() {
    return {
      success: true,
      answer: `数据库中共有 ${this.characters.length} 个角色`,
      data: { total: this.characters.length }
    };
  }

  // 统计恶魔果实总数
  statTotalFruits() {
    return {
      success: true,
      answer: `数据库中共有 ${this.devilFruits.length} 种恶魔果实`,
      data: { total: this.devilFruits.length }
    };
  }

  // 列出所有角色
  listCharacters() {
    const names = this.characters.map(c => c.name).join('\n');
    return {
      success: true,
      answer: `所有角色列表（${this.characters.length}个）：\n${names}`,
      data: this.characters
    };
  }

  // 列出所有恶魔果实
  listFruits() {
    const names = this.devilFruits.map(f => `${f.name} (${f.type})`).join('\n');
    return {
      success: true,
      answer: `所有恶魔果实列表（${this.devilFruits.length}种）：\n${names}`,
      data: this.devilFruits
    };
  }

  // 查找角色
  findCharacter(name) {
    // 精确匹配
    let char = this.characters.find(c => c.name === name);
    if (char) return char;
    
    // 别名匹配
    for (const c of this.characters) {
      const aliases = this.getCharacterAliases(c.name);
      if (aliases.some(alias => name.includes(alias) || alias.includes(name))) {
        return c;
      }
    }
    
    // 模糊匹配
    char = this.characters.find(c => c.name.includes(name) || name.includes(c.name));
    return char || null;
  }

  /**
   * 获取查询历史
   */
  getHistory(limit = 10) {
    return this.queryHistory.slice(-limit);
  }

  /**
   * 主查询入口
   * @param {string} query - 用户输入的自然语言查询
   * @returns {object} - 查询结果
   */
  query(userQuery) {
    // 重新加载数据（确保数据最新）
    this.load();
    
    // 解析意图
    const intent = this.parseIntent(userQuery);
    
    // 记录查询历史
    this.queryHistory.push({
      query: userQuery,
      intent: intent.type,
      timestamp: new Date().toISOString()
    });
    
    // 限制历史记录数量
    if (this.queryHistory.length > 100) {
      this.queryHistory = this.queryHistory.slice(-100);
    }
    
    // 记录日志
    console.log(`[QueryAgent] 查询: ${userQuery} -> 意图: ${intent.type}`);
    
    // 执行查询
    const result = this.execute(intent);
    
    // 添加元数据
    result.query = userQuery;
    result.intent = intent.type;
    result.timestamp = new Date().toISOString();
    
    return result;
  }
}

module.exports = QueryAgent;