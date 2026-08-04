/**
 * RecommendAgent - 角色推荐 Agent
 * 提供角色推荐、相似角色分析、组织关系推荐等功能
 */

const fs = require('fs');
const path = require('path');

class RecommendAgent {
  constructor() {
    this.characters = [];
    this.devilFruits = [];
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
      console.error('RecommendAgent 数据加载失败:', error.message);
    }
  }

  /**
   * 计算两个角色的相似度
   * @param {object} char1 - 角色1
   * @param {object} char2 - 角色2
   * @returns {number} - 相似度分数 (0-100)
   */
  calculateSimilarity(char1, char2) {
    if (!char1 || !char2) return 0;
    if (char1.name === char2.name) return 100;

    let score = 0;
    let factors = 0;

    // 组织相似度 (+40)
    if (char1.organization && char2.organization && char1.organization === char2.organization) {
      score += 40;
      factors++;
    }

    // 恶魔果实类型相似度 (+30)
    if (char1.devilFruit && char2.devilFruit && char1.devilFruit && char2.devilFruit) {
      const fruit1 = this.devilFruits.find(f => char1.devilFruit.includes(f.name));
      const fruit2 = this.devilFruits.find(f => char2.devilFruit.includes(f.name));
      
      if (fruit1 && fruit2) {
        if (fruit1.type === fruit2.type) {
          score += 30;
          factors++;
        }
      }
    }

    // 悬赏金级别相似度 (+20)
    const bounty1 = this.parseJapaneseBounty(char1.bounty);
    const bounty2 = this.parseJapaneseBounty(char2.bounty);
    if (bounty1 > 0 && bounty2 > 0) {
      const ratio = Math.min(bounty1, bounty2) / Math.max(bounty1, bounty2);
      if (ratio > 0.5) {
        score += 20;
        factors++;
      } else if (ratio > 0.2) {
        score += 10;
        factors++;
      }
    }

    // 生日月份相同 (+10)
    if (char1.birthday && char2.birthday) {
      const month1 = char1.birthday.match(/(\d+)月/);
      const month2 = char2.birthday.match(/(\d+)月/);
      if (month1 && month2 && month1[1] === month2[1]) {
        score += 10;
        factors++;
      }
    }

    return score;
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

  /**
   * 查找相似角色
   * @param {string} characterName - 角色名
   * @param {number} limit - 返回数量限制
   * @returns {object} - 推荐结果
   */
  findSimilarCharacters(characterName, limit = 5) {
    this.load();
    
    const targetChar = this.characters.find(c => 
      c.name === characterName || 
      c.name.includes(characterName) || 
      characterName.includes(c.name)
    );

    if (!targetChar) {
      return { success: false, error: `找不到角色: ${characterName}` };
    }

    // 计算所有角色与目标角色的相似度
    const similarities = this.characters
      .filter(c => c.name !== targetChar.name)
      .map(c => ({
        character: c,
        similarity: this.calculateSimilarity(targetChar, c)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    const recommendations = similarities.map(s => ({
      name: s.character.name,
      organization: s.character.organization,
      bounty: s.character.bounty,
      devilFruit: s.character.devilFruit,
      similarity: s.similarity,
      reasons: this.getSimilarityReasons(targetChar, s.character)
    }));

    return {
      success: true,
      answer: `与 ${targetChar.name} 最相似的角色：\n${recommendations.map((r, i) => 
        `${i + 1}. ${r.name} (相似度: ${r.similarity}%) - ${r.reasons.join(', ')}`
      ).join('\n')}`,
      data: {
        target: targetChar,
        recommendations
      }
    };
  }

  /**
   * 获取相似原因
   */
  getSimilarityReasons(char1, char2) {
    const reasons = [];
    
    if (char1.organization && char2.organization && char1.organization === char2.organization) {
      reasons.push(`同属${char1.organization}`);
    }
    
    if (char1.devilFruit && char2.devilFruit) {
      const fruit1 = this.devilFruits.find(f => char1.devilFruit.includes(f.name));
      const fruit2 = this.devilFruits.find(f => char2.devilFruit.includes(f.name));
      if (fruit1 && fruit2 && fruit1.type === fruit2.type) {
        reasons.push(`都是${fruit1.type}果实能力者`);
      }
    }
    
    const bounty1 = this.parseJapaneseBounty(char1.bounty);
    const bounty2 = this.parseJapaneseBounty(char2.bounty);
    if (bounty1 > 0 && bounty2 > 0) {
      const ratio = Math.min(bounty1, bounty2) / Math.max(bounty1, bounty2);
      if (ratio > 0.5) {
        reasons.push(`悬赏金相近`);
      }
    }
    
    if (char1.birthday && char2.birthday) {
      const month1 = char1.birthday.match(/(\d+)月/);
      const month2 = char2.birthday.match(/(\d+)月/);
      if (month1 && month2 && month1[1] === month2[1]) {
        reasons.push(`同月生`);
      }
    }
    
    return reasons.length > 0 ? reasons : ['无明显相似特征'];
  }

  /**
   * 基于组织的推荐
   * @param {string} organization - 组织名
   * @param {number} limit - 返回数量
   */
  recommendByOrganization(organization, limit = 10) {
    this.load();
    
    const normalizedOrg = this.normalizeOrganization(organization);
    const members = this.characters.filter(c => 
      c.organization && this.normalizeOrganization(c.organization) === normalizedOrg
    );

    if (members.length === 0) {
      return { success: false, error: `找不到组织: ${organization}` };
    }

    // 按悬赏金排序
    const sorted = members
      .map(c => ({
        ...c,
        bountyValue: this.parseJapaneseBounty(c.bounty)
      }))
      .sort((a, b) => b.bountyValue - a.bountyValue)
      .slice(0, limit);

    return {
      success: true,
      answer: `${organization} 成员推荐（按悬赏金排序）：\n${sorted.map((c, i) => 
        `${i + 1}. ${c.name} (${c.bounty || '无悬赏金'})`
      ).join('\n')}`,
      data: sorted
    };
  }

  /**
   * 基于恶魔果实类型的推荐
   * @param {string} fruitType - 果实类型
   * @param {number} limit - 返回数量
   */
  recommendByFruitType(fruitType, limit = 10) {
    this.load();
    
    const typeMap = {
      '超人系': '超人系',
      '动物系': '動物系',
      '自然系': '自然系',
      '特殊系': '特殊系'
    };
    const targetType = typeMap[fruitType] || fruitType;
    
    // 获取该类型的所有果实
    const fruitsOfType = this.devilFruits.filter(f => f.type === targetType);
    const fruitNames = fruitsOfType.map(f => f.name);

    // 找出吃这些果实的角色
    const characters = this.characters.filter(c => 
      c.devilFruit && fruitNames.some(fn => c.devilFruit.includes(fn))
    );

    if (characters.length === 0) {
      return { success: false, error: `找不到${fruitType}果实能力者` };
    }

    // 按悬赏金排序
    const sorted = characters
      .map(c => ({
        ...c,
        bountyValue: this.parseJapaneseBounty(c.bounty)
      }))
      .sort((a, b) => b.bountyValue - a.bountyValue)
      .slice(0, limit);

    return {
      success: true,
      answer: `${fruitType}果实能力者推荐：\n${sorted.map((c, i) => 
        `${i + 1}. ${c.name} - ${c.devilFruit} (${c.bounty || '无悬赏金'})`
      ).join('\n')}`,
      data: sorted
    };
  }

  /**
   * 随机推荐角色
   * @param {number} count - 推荐数量
   */
  randomRecommend(count = 5) {
    this.load();
    
    const shuffled = [...this.characters].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return {
      success: true,
      answer: `随机推荐 ${count} 个角色：\n${selected.map((c, i) => 
        `${i + 1}. ${c.name} (${c.organization || '未知组织'}, ${c.bounty || '无悬赏金'})`
      ).join('\n')}`,
      data: selected
    };
  }

  /**
   * 悬赏金级别推荐
   * @param {string} level - 级别 (high/medium/low)
   * @param {number} limit - 返回数量
   */
  recommendByBountyLevel(level, limit = 10) {
    this.load();
    
    const thresholds = {
      high: { min: 1000000000, label: '10亿以上' },
      medium: { min: 100000000, max: 1000000000, label: '1亿-10亿' },
      low: { max: 100000000, label: '1亿以下' }
    };

    const threshold = thresholds[level];
    if (!threshold) {
      return { success: false, error: '无效的悬赏金级别，请使用 high/medium/low' };
    }

    const filtered = this.characters.filter(c => {
      const bounty = this.parseJapaneseBounty(c.bounty);
      if (bounty === 0) return false;
      if (threshold.min && threshold.max) {
        return bounty >= threshold.min && bounty < threshold.max;
      }
      if (threshold.min) return bounty >= threshold.min;
      if (threshold.max) return bounty < threshold.max;
      return false;
    });

    const sorted = filtered
      .map(c => ({ ...c, bountyValue: this.parseJapaneseBounty(c.bounty) }))
      .sort((a, b) => b.bountyValue - a.bountyValue)
      .slice(0, limit);

    return {
      success: true,
      answer: `悬赏金${threshold.label}的角色推荐：\n${sorted.map((c, i) => 
        `${i + 1}. ${c.name} (${c.bounty})`
      ).join('\n')}`,
      data: sorted
    };
  }

  /**
   * 综合推荐（基于多种因素）
   * @param {object} preferences - 用户偏好
   */
  comprehensiveRecommend(preferences = {}) {
    this.load();
    
    const { organization, fruitType, bountyLevel, limit = 5 } = preferences;
    let candidates = [...this.characters];
    let factors = [];

    // 组织偏好
    if (organization) {
      const normalizedOrg = this.normalizeOrganization(organization);
      const orgMembers = candidates.filter(c => 
        c.organization && this.normalizeOrganization(c.organization) === normalizedOrg
      );
      if (orgMembers.length > 0) {
        candidates = orgMembers;
        factors.push(`组织: ${organization}`);
      }
    }

    // 果实类型偏好
    if (fruitType) {
      const typeMap = { '超人系': '超人系', '动物系': '動物系', '自然系': '自然系', '特殊系': '特殊系' };
      const targetType = typeMap[fruitType];
      if (targetType) {
        const fruitsOfType = this.devilFruits.filter(f => f.type === targetType);
        const fruitNames = fruitsOfType.map(f => f.name);
        candidates = candidates.filter(c => 
          c.devilFruit && fruitNames.some(fn => c.devilFruit.includes(fn))
        );
        factors.push(`果实类型: ${fruitType}`);
      }
    }

    // 悬赏金级别偏好
    if (bountyLevel) {
      const thresholds = {
        high: 1000000000,
        medium: 100000000,
        low: 0
      };
      const minBounty = thresholds[bountyLevel] || 0;
      candidates = candidates.filter(c => {
        const bounty = this.parseJapaneseBounty(c.bounty);
        if (bountyLevel === 'high') return bounty >= minBounty;
        if (bountyLevel === 'medium') return bounty >= minBounty && bounty < 1000000000;
        if (bountyLevel === 'low') return bounty > 0 && bounty < 100000000;
        return true;
      });
      factors.push(`悬赏金级别: ${bountyLevel}`);
    }

    // 按悬赏金排序
    const sorted = candidates
      .map(c => ({ ...c, bountyValue: this.parseJapaneseBounty(c.bounty) }))
      .sort((a, b) => b.bountyValue - a.bountyValue)
      .slice(0, limit);

    if (sorted.length === 0) {
      return { success: false, error: '没有找到符合条件的角色' };
    }

    const factorText = factors.length > 0 ? `（${factors.join(', ')}）` : '';

    return {
      success: true,
      answer: `为您推荐 ${sorted.length} 个角色${factorText}：\n${sorted.map((c, i) => 
        `${i + 1}. ${c.name} (${c.bounty || '无悬赏金'}, ${c.organization || '未知组织'})`
      ).join('\n')}`,
      data: sorted
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

  /**
   * 处理推荐请求
   * @param {string} type - 推荐类型
   * @param {object} params - 参数
   */
  recommend(type, params = {}) {
    this.load();

    switch (type) {
      case 'similar':
        return this.findSimilarCharacters(params.characterName, params.limit || 5);
      case 'organization':
        return this.recommendByOrganization(params.organization, params.limit || 10);
      case 'fruit_type':
        return this.recommendByFruitType(params.fruitType, params.limit || 10);
      case 'random':
        return this.randomRecommend(params.limit || 5);
      case 'bounty_level':
        return this.recommendByBountyLevel(params.level, params.limit || 10);
      case 'comprehensive':
        return this.comprehensiveRecommend(params);
      default:
        return { success: false, error: '未知的推荐类型' };
    }
  }
}

module.exports = RecommendAgent;