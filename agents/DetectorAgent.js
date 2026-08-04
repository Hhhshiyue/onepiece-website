/**
 * DetectorAgent - 网站结构自适应 Agent
 * 检测官网结构变化，动态调整爬虫选择器
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

class DetectorAgent {
  constructor() {
    this.baseUrl = 'https://one-piece.com';
    this.snapshotsDir = path.join(__dirname, '../data/snapshots');
    this.currentSelectors = {
      characters: {
        list: '.el-card-block__item',
        name: '.el-heading-lv3 h3',
        image: '.el-card-block__pic img',
        link: 'a',
        info: '.el-list-term__item',
        infoKey: '.el-list-term__head span',
        infoValue: '.el-list-term__body'
      },
      devilFruits: {
        list: '.el-card-block__item',
        name: '.el-heading-lv3 h3',
        image: '.el-card-block__pic img',
        link: 'a'
      }
    };
    
    this.ensureSnapshotsDir();
  }

  /**
   * 确保快照目录存在
   */
  ensureSnapshotsDir() {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * 抓取页面结构快照
   * @param {string} type - 类型 (characters/devilFruits)
   * @returns {object} - 快照数据
   */
  async takeSnapshot(type = 'characters') {
    const url = type === 'characters' 
      ? `${this.baseUrl}/character` 
      : `${this.baseUrl}/devil_fruit`;
    
    console.log(`[DetectorAgent] 抓取 ${type} 页面结构...`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const snapshot = {
        url,
        timestamp: new Date().toISOString(),
        selectors: {},
        sampleData: []
      };

      // 检测选择器是否有效
      const selectors = this.currentSelectors[type] || this.currentSelectors.characters;
      
      for (const [key, selector] of Object.entries(selectors)) {
        const count = $(selector).length;
        snapshot.selectors[key] = {
          selector,
          count,
          valid: count > 0
        };
      }

      // 提取样本数据
      const items = $(selectors.list);
      items.slice(0, 3).each((index, element) => {
        const $item = $(element);
        const sample = {};
        
        if (selectors.name) {
          sample.name = $item.find(selectors.name).text().trim();
        }
        if (selectors.image) {
          sample.image = $item.find(selectors.image).attr('src');
        }
        if (selectors.link) {
          sample.link = $item.find(selectors.link).attr('href');
        }
        
        if (sample.name || sample.link) {
          snapshot.sampleData.push(sample);
        }
      });

      // 保存快照
      const snapshotFile = path.join(this.snapshotsDir, `${type}_${Date.now()}.json`);
      fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf-8');

      return {
        success: true,
        snapshot,
        file: snapshotFile
      };

    } catch (error) {
      console.error(`[DetectorAgent] 抓取快照失败:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 对比两个快照，检测变化
   * @param {object} oldSnapshot - 旧快照
   * @param {object} newSnapshot - 新快照
   * @returns {object} - 差异报告
   */
  compareSnapshots(oldSnapshot, newSnapshot) {
    const diff = {
      hasChanges: false,
      changes: [],
      selectors: {}
    };

    // 对比选择器有效性
    for (const [key, newData] of Object.entries(newSnapshot.selectors || {})) {
      const oldData = oldSnapshot.selectors?.[key];
      
      if (oldData) {
        if (newData.valid !== oldData.valid) {
          diff.hasChanges = true;
          diff.changes.push({
            type: 'selector_validity',
            key,
            from: oldData.valid,
            to: newData.valid,
            message: `选择器 "${key}" 有效性变化: ${oldData.valid} -> ${newData.valid}`
          });
        }
        
        if (newData.count !== oldData.count && Math.abs(newData.count - oldData.count) > 5) {
          diff.hasChanges = true;
          diff.changes.push({
            type: 'count_change',
            key,
            from: oldData.count,
            to: newData.count,
            message: `选择器 "${key}" 匹配数量变化: ${oldData.count} -> ${newData.count}`
          });
        }
      }
      
      diff.selectors[key] = {
        old: oldData,
        new: newData,
        changed: oldData ? (newData.valid !== oldData.valid) : true
      };
    }

    // 对比样本数据
    if (newSnapshot.sampleData?.length > 0 && oldSnapshot.sampleData?.length > 0) {
      const newNames = newSnapshot.sampleData.map(s => s.name).filter(Boolean);
      const oldNames = oldSnapshot.sampleData.map(s => s.name).filter(Boolean);
      
      // 如果样本数据完全不同，可能结构变了
      const commonNames = newNames.filter(name => oldNames.includes(name));
      if (commonNames.length === 0 && newNames.length > 0 && oldNames.length > 0) {
        diff.hasChanges = true;
        diff.changes.push({
          type: 'sample_data',
          message: '样本数据完全不同，可能网站结构发生重大变化'
        });
      }
    }

    return diff;
  }

  /**
   * 检测网站变化
   * @param {string} type - 类型
   * @returns {object} - 检测结果
   */
  async detectChanges(type = 'characters') {
    // 获取最新快照
    const newResult = await this.takeSnapshot(type);
    if (!newResult.success) {
      return newResult;
    }

    // 获取历史快照
    const history = this.getSnapshotHistory(type, 1);
    
    if (history.length === 0) {
      return {
        success: true,
        status: 'first_snapshot',
        message: '首次快照，无历史数据可对比',
        snapshot: newResult.snapshot
      };
    }

    // 对比快照
    const diff = this.compareSnapshots(history[0], newResult.snapshot);

    return {
      success: true,
      status: diff.hasChanges ? 'changed' : 'no_change',
      message: diff.hasChanges 
        ? `检测到 ${diff.changes.length} 处变化` 
        : '网站结构未发生变化',
      changes: diff.changes,
      snapshot: newResult.snapshot
    };
  }

  /**
   * 自动生成新选择器
   * @param {string} type - 类型
   * @returns {object} - 新选择器建议
   */
  async generateNewSelectors(type = 'characters') {
    const url = type === 'characters' 
      ? `${this.baseUrl}/character` 
      : `${this.baseUrl}/devil_fruit`;

    console.log(`[DetectorAgent] 分析 ${type} 页面结构...`);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const suggestions = {};

      // 尝试常见的选择器模式
      const patterns = {
        list: ['.el-card-block__item', '.card-item', '.character-item', '.item', 'article'],
        name: ['.el-heading-lv3 h3', 'h3', '.name', '.title', '[data-name]'],
        image: ['.el-card-block__pic img', 'img', '.image img', '.thumb img'],
        link: ['a', '.link', '[href]']
      };

      for (const [key, selectors] of Object.entries(patterns)) {
        for (const selector of selectors) {
          const count = $(selector).length;
          if (count > 0) {
            suggestions[key] = {
              selector,
              count,
              confidence: count > 5 ? 'high' : 'medium'
            };
            break;
          }
        }
      }

      return {
        success: true,
        suggestions,
        current: this.currentSelectors[type]
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取快照历史
   * @param {string} type - 类型
   * @param {number} limit - 限制数量
   * @returns {array} - 快照列表
   */
  getSnapshotHistory(type = 'characters', limit = 10) {
    const files = fs.readdirSync(this.snapshotsDir)
      .filter(f => f.startsWith(type) && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    return files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(this.snapshotsDir, file), 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * 更新爬虫配置
   * @param {string} type - 类型
   * @param {object} newSelectors - 新选择器
   * @returns {object} - 更新结果
   */
  async updateCrawlerConfig(type, newSelectors) {
    try {
      // 更新当前选择器
      this.currentSelectors[type] = {
        ...this.currentSelectors[type],
        ...newSelectors
      };

      // 生成配置文件
      const configFile = path.join(this.snapshotsDir, 'current_selectors.json');
      fs.writeFileSync(configFile, JSON.stringify(this.currentSelectors, null, 2), 'utf-8');

      return {
        success: true,
        message: '选择器配置已更新',
        selectors: this.currentSelectors[type]
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取当前选择器配置
   */
  getCurrentSelectors() {
    return this.currentSelectors;
  }
}

module.exports = DetectorAgent;