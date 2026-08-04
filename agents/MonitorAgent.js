/**
 * MonitorAgent - 智能爬虫监控 Agent
 * 自动监控数据健康状态，检测异常并触发修复
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class MonitorAgent {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.logs = [];
    this.maxLogs = 100;
  }

  /**
   * 执行完整健康检查
   * @returns {object} - 健康检查报告
   */
  async healthCheck() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
      issues: [],
      recommendations: []
    };

    // 检查角色数据
    const charactersCheck = await this.checkCharacters();
    report.checks.characters = charactersCheck;
    if (!charactersCheck.healthy) {
      report.status = 'warning';
      report.issues.push(...charactersCheck.issues);
    }

    // 检查恶魔果实数据
    const fruitsCheck = await this.checkDevilFruits();
    report.checks.devilFruits = fruitsCheck;
    if (!fruitsCheck.healthy) {
      report.status = 'warning';
      report.issues.push(...fruitsCheck.issues);
    }

    // 检查图片链接
    const imagesCheck = await this.checkImages();
    report.checks.images = imagesCheck;
    if (!imagesCheck.healthy) {
      report.status = 'warning';
      report.issues.push(...imagesCheck.issues);
    }

    // 检查数据时效性
    const freshnessCheck = await this.checkDataFreshness();
    report.checks.freshness = freshnessCheck;
    if (!freshnessCheck.healthy) {
      report.recommendations.push('建议执行爬虫更新数据');
    }

    // 检查数据一致性
    const consistencyCheck = await this.checkDataConsistency();
    report.checks.consistency = consistencyCheck;
    if (!consistencyCheck.healthy) {
      report.issues.push(...consistencyCheck.issues);
    }

    // 记录日志
    this.log('health_check', report);

    return report;
  }

  /**
   * 检查角色数据
   */
  async checkCharacters() {
    const result = {
      healthy: true,
      count: 0,
      missing: 0,
      issues: []
    };

    try {
      const filePath = path.join(this.dataDir, 'characters.json');
      if (!fs.existsSync(filePath)) {
        result.healthy = false;
        result.issues.push('characters.json 文件不存在');
        return result;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      result.count = data.length;

      // 检查缺失字段
      data.forEach((char, index) => {
        if (!char.name) {
          result.missing++;
          result.issues.push(`角色 #${index + 1} 缺少名字`);
        }
        if (!char.organization) {
          result.missing++;
        }
        if (!char.bounty) {
          result.missing++;
        }
      });

      // 检查数量
      if (result.count < 10) {
        result.healthy = false;
        result.issues.push(`角色数量过少 (${result.count} 个)`);
      }

    } catch (error) {
      result.healthy = false;
      result.issues.push(`检查角色数据失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查恶魔果实数据
   */
  async checkDevilFruits() {
    const result = {
      healthy: true,
      count: 0,
      byType: {},
      issues: []
    };

    try {
      const filePath = path.join(this.dataDir, 'devil_fruits.json');
      if (!fs.existsSync(filePath)) {
        result.healthy = false;
        result.issues.push('devil_fruits.json 文件不存在');
        return result;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      result.count = data.length;

      // 按类型统计
      data.forEach(fruit => {
        if (fruit.type) {
          result.byType[fruit.type] = (result.byType[fruit.type] || 0) + 1;
        }
      });

      // 检查基本数量
      if (result.count < 5) {
        result.healthy = false;
        result.issues.push(`恶魔果实数量过少 (${result.count} 个)`);
      }

    } catch (error) {
      result.healthy = false;
      result.issues.push(`检查恶魔果实数据失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查图片链接有效性
   */
  async checkImages() {
    const result = {
      healthy: true,
      total: 0,
      valid: 0,
      broken: 0,
      brokenUrls: [],
      issues: []
    };

    try {
      // 检查角色图片
      const charactersPath = path.join(this.dataDir, 'characters.json');
      if (fs.existsSync(charactersPath)) {
        const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'));
        
        for (const char of characters) {
          if (char.localImage && char.localImage.startsWith('/images/')) {
            const imagePath = path.join(this.dataDir, '../public', char.localImage);
            if (!fs.existsSync(imagePath)) {
              result.broken++;
              result.brokenUrls.push({
                type: 'character',
                name: char.name,
                url: char.localImage
              });
            } else {
              result.valid++;
            }
            result.total++;
          }
        }
      }

      // 检查恶魔果实图片
      const fruitsPath = path.join(this.dataDir, 'devil_fruits.json');
      if (fs.existsSync(fruitsPath)) {
        const fruits = JSON.parse(fs.readFileSync(fruitsPath, 'utf-8'));
        
        for (const fruit of fruits) {
          if (fruit.fruitImage && fruit.fruitImage.startsWith('/images/')) {
            const imagePath = path.join(this.dataDir, '../public', fruit.fruitImage);
            if (!fs.existsSync(imagePath)) {
              result.broken++;
              result.brokenUrls.push({
                type: 'devilFruit',
                name: fruit.name,
                url: fruit.fruitImage
              });
            } else {
              result.valid++;
            }
            result.total++;
          }
        }
      }

      // 评估健康状态
      if (result.broken > 0) {
        result.healthy = result.broken < result.total * 0.2; // 允许20%的图片缺失
        if (!result.healthy) {
          result.issues.push(`图片缺失过多 (${result.broken}/${result.total})`);
        }
      }

    } catch (error) {
      result.healthy = false;
      result.issues.push(`检查图片失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查数据时效性
   */
  async checkDataFreshness() {
    const result = {
      healthy: true,
      lastUpdate: null,
      hoursAgo: null,
      issues: []
    };

    try {
      const charactersPath = path.join(this.dataDir, 'characters.json');
      if (fs.existsSync(charactersPath)) {
        const stats = fs.statSync(charactersPath);
        result.lastUpdate = stats.mtime;
        const hoursAgo = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        result.hoursAgo = Math.round(hoursAgo);

        // 超过24小时建议更新
        if (hoursAgo > 24) {
          result.healthy = false;
          result.issues.push(`数据已超过 ${result.hoursAgo} 小时未更新`);
        }
      }

    } catch (error) {
      result.healthy = false;
      result.issues.push(`检查数据时效性失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 检查数据一致性
   */
  async checkDataConsistency() {
    const result = {
      healthy: true,
      issues: []
    };

    try {
      // 加载数据
      const characters = JSON.parse(fs.readFileSync(
        path.join(this.dataDir, 'characters.json'), 'utf-8'
      ));
      const fruits = JSON.parse(fs.readFileSync(
        path.join(this.dataDir, 'devil_fruits.json'), 'utf-8'
      ));

      // 检查重复角色
      const nameSet = new Set();
      characters.forEach(char => {
        if (nameSet.has(char.name)) {
          result.issues.push(`发现重复角色: ${char.name}`);
        }
        nameSet.add(char.name);
      });

      // 检查角色引用的恶魔果实是否存在
      const fruitNames = new Set(fruits.map(f => f.name));
      characters.forEach(char => {
        if (char.devilFruit && char.devilFruit.trim()) {
          // 简单匹配（考虑果实名可能不完全一致）
          const fruitFound = fruits.some(f => 
            char.devilFruit.includes(f.name) || f.name.includes(char.devilFruit.split(' ')[0])
          );
          if (!fruitFound) {
            // 只是记录，不视为错误
            // result.issues.push(`角色 ${char.name} 的恶魔果实 "${char.devilFruit}" 未在果实列表中找到`);
          }
        }
      });

      if (result.issues.length > 0) {
        result.healthy = false;
      }

    } catch (error) {
      result.healthy = false;
      result.issues.push(`检查数据一致性失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 自动修复问题
   * @param {array} issues - 问题列表
   * @returns {object} - 修复结果
   */
  async autoFix(issues) {
    const result = {
      fixed: 0,
      failed: 0,
      details: []
    };

    for (const issue of issues) {
      try {
        if (issue.includes('文件不存在')) {
          // 创建空文件
          const fileName = issue.includes('characters') ? 'characters.json' : 'devil_fruits.json';
          const filePath = path.join(this.dataDir, fileName);
          fs.writeFileSync(filePath, '[]', 'utf-8');
          result.fixed++;
          result.details.push(`创建文件: ${fileName}`);
        }
        // 其他自动修复逻辑可以在这里扩展
      } catch (error) {
        result.failed++;
        result.details.push(`修复失败: ${issue} - ${error.message}`);
      }
    }

    this.log('auto_fix', result);
    return result;
  }

  /**
   * 记录日志
   */
  log(action, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      data
    };
    
    this.logs.push(entry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 写入日志文件
    try {
      const logPath = path.join(this.dataDir, '../logs/monitor.jsonl');
      const logDir = path.dirname(logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (error) {
      console.error('[MonitorAgent] 日志写入失败:', error.message);
    }
  }

  /**
   * 获取日志
   */
  getLogs(limit = 20) {
    return this.logs.slice(-limit);
  }

  /**
   * 生成报告摘要
   */
  generateSummary(report) {
    const lines = [
      '=== 海贼王数据监控报告 ===',
      `时间: ${report.timestamp}`,
      `状态: ${report.status === 'healthy' ? '✅ 正常' : '⚠️ 异常'}`,
      '',
      '--- 角色数据 ---',
      `  数量: ${report.checks.characters?.count || 0}`,
      `  健康: ${report.checks.characters?.healthy ? '✅' : '❌'}`,
      '',
      '--- 恶魔果实 ---',
      `  数量: ${report.checks.devilFruits?.count || 0}`,
      `  健康: ${report.checks.devilFruits?.healthy ? '✅' : '❌'}`,
      '',
      '--- 图片资源 ---',
      `  有效: ${report.checks.images?.valid || 0}`,
      `  缺失: ${report.checks.images?.broken || 0}`,
      '',
      '--- 数据时效 ---',
      `  更新于: ${report.checks.freshness?.hoursAgo || '?'} 小时前`,
      ''
    ];

    if (report.issues.length > 0) {
      lines.push('--- 发现问题 ---');
      report.issues.forEach(issue => lines.push(`  ❌ ${issue}`));
    }

    if (report.recommendations.length > 0) {
      lines.push('--- 建议 ---');
      report.recommendations.forEach(rec => lines.push(`  💡 ${rec}`));
    }

    return lines.join('\n');
  }
}

module.exports = MonitorAgent;