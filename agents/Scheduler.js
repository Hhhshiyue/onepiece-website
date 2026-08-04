/**
 * Scheduler - 定时任务管理器
 * 自动定时爬取数据、健康检查、发送告警
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

class Scheduler {
  constructor() {
    this.jobs = {};
    this.logs = [];
    this.logFile = path.join(__dirname, '../logs/scheduler.jsonl');
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 启动所有定时任务
   */
  startAll() {
    this.startCrawlerSchedule();
    this.startHealthCheckSchedule();
    this.startCleanupSchedule();
    
    console.log('[Scheduler] 所有定时任务已启动');
  }

  /**
   * 停止所有定时任务
   */
  stopAll() {
    Object.values(this.jobs).forEach(job => {
      if (job) job.stop();
    });
    this.jobs = {};
    console.log('[Scheduler] 所有定时任务已停止');
  }

  /**
   * 数据爬取定时任务
   * 每天凌晨 3:00 执行
   */
  startCrawlerSchedule() {
    // 每天 3:00 执行
    this.jobs.crawler = cron.schedule('0 3 * * *', async () => {
      this.log('crawler', 'start', '开始定时爬取数据');
      
      try {
        const { execSync } = require('child_process');
        const output = execSync('node crawler.js', {
          cwd: path.join(__dirname, '..'),
          encoding: 'utf-8',
          timeout: 300000 // 5分钟超时
        });
        
        this.log('crawler', 'success', '数据爬取完成', { output: output.slice(-500) });
      } catch (error) {
        this.log('crawler', 'error', '数据爬取失败', { error: error.message });
        this.alert('数据爬取失败', error.message);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    
    console.log('[Scheduler] 数据爬取任务已启动 (每天 3:00)');
  }

  /**
   * 健康检查定时任务
   * 每小时执行一次
   */
  startHealthCheckSchedule() {
    // 每小时执行
    this.jobs.healthCheck = cron.schedule('0 * * * *', async () => {
      this.log('healthCheck', 'start', '开始健康检查');
      
      try {
        const MonitorAgent = require('./MonitorAgent');
        const monitor = new MonitorAgent();
        const report = await monitor.healthCheck();
        
        if (report.status !== 'healthy') {
          this.log('healthCheck', 'warning', '发现健康问题', { 
            issues: report.issues,
            recommendations: report.recommendations
          });
          
          // 尝试自动修复
          if (report.issues.length > 0) {
            this.log('autoFix', 'start', '开始自动修复');
            const fixResult = await monitor.autoFix(report.issues);
            this.log('autoFix', 'complete', '自动修复完成', fixResult);
          }
        } else {
          this.log('healthCheck', 'success', '系统健康', {
            characters: report.checks.characters?.count,
            devilFruits: report.checks.devilFruits?.count
          });
        }
      } catch (error) {
        this.log('healthCheck', 'error', '健康检查失败', { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    
    console.log('[Scheduler] 健康检查任务已启动 (每小时)');
  }

  /**
   * 日志清理定时任务
   * 每周日凌晨 4:00 执行
   */
  startCleanupSchedule() {
    // 每周日凌晨 4:00 执行
    this.jobs.cleanup = cron.schedule('0 4 * * 0', async () => {
      this.log('cleanup', 'start', '开始清理旧日志');
      
      try {
        // 清理超过 30 天的日志
        const logsDir = path.join(__dirname, '../logs');
        if (fs.existsSync(logsDir)) {
          const files = fs.readdirSync(logsDir);
          const now = Date.now();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          
          files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime.getTime() > thirtyDays) {
              fs.unlinkSync(filePath);
              this.log('cleanup', 'delete', `删除旧日志: ${file}`);
            }
          });
        }
        
        this.log('cleanup', 'success', '日志清理完成');
      } catch (error) {
        this.log('cleanup', 'error', '日志清理失败', { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    
    console.log('[Scheduler] 日志清理任务已启动 (每周日凌晨 4:00)');
  }

  /**
   * 添加自定义定时任务
   * @param {string} name - 任务名称
   * @param {string} cronExpression - cron 表达式
   * @param {function} task - 任务函数
   */
  addJob(name, cronExpression, task) {
    if (this.jobs[name]) {
      this.jobs[name].stop();
    }
    
    this.jobs[name] = cron.schedule(cronExpression, async () => {
      this.log(name, 'start', `开始执行任务: ${name}`);
      try {
        await task();
        this.log(name, 'success', `任务完成: ${name}`);
      } catch (error) {
        this.log(name, 'error', `任务失败: ${name}`, { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai'
    });
    
    console.log(`[Scheduler] 任务 "${name}" 已添加 (${cronExpression})`);
  }

  /**
   * 记录日志
   */
  log(task, status, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      task,
      status,
      message,
      data
    };
    
    this.logs.push(entry);
    
    // 保持最多 1000 条内存日志
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // 写入文件
    try {
      fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (error) {
      console.error('[Scheduler] 日志写入失败:', error.message);
    }
    
    // 控制台输出
    console.log(`[Scheduler] [${task}] ${status}: ${message}`);
  }

  /**
   * 发送告警
   */
  alert(title, message) {
    // 记录告警日志
    this.log('alert', 'warning', title, { message });
    
    // TODO: 可以在这里添加邮件、企业微信等通知方式
    // 例如:
    // this.sendEmail(title, message);
    // this.sendWechatBot(title, message);
    
    console.warn(`[Scheduler] ⚠️ 告警: ${title} - ${message}`);
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    const status = {};
    
    Object.entries(this.jobs).forEach(([name, job]) => {
      status[name] = {
        running: job ? true : false,
        nextRun: job ? job.nextDate?.().toJSDate?.() : null
      };
    });
    
    return status;
  }

  /**
   * 获取最近的日志
   */
  getLogs(limit = 50) {
    return this.logs.slice(-limit);
  }

  /**
   * 手动触发爬取
   */
  async triggerCrawl() {
    this.log('manual', 'start', '手动触发爬取');
    
    try {
      const { execSync } = require('child_process');
      const output = execSync('node crawler.js', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8',
        timeout: 300000
      });
      
      this.log('manual', 'success', '手动爬取完成');
      return { success: true, message: '爬取完成' };
    } catch (error) {
      this.log('manual', 'error', '手动爬取失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * 手动触发健康检查
   */
  async triggerHealthCheck() {
    this.log('manual', 'start', '手动触发健康检查');
    
    try {
      const MonitorAgent = require('./MonitorAgent');
      const monitor = new MonitorAgent();
      const report = await monitor.healthCheck();
      
      this.log('manual', 'success', '健康检查完成', { status: report.status });
      return report;
    } catch (error) {
      this.log('manual', 'error', '健康检查失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// 导出单例
module.exports = new Scheduler();