/**
 * AgentManager - Agent 管理器
 * 统一管理所有 Agent，提供统一的调用接口
 */

const QueryAgent = require('./QueryAgent');
const MonitorAgent = require('./MonitorAgent');
const DetectorAgent = require('./DetectorAgent');

class AgentManager {
  constructor() {
    this.queryAgent = new QueryAgent();
    this.monitorAgent = new MonitorAgent();
    this.detectorAgent = new DetectorAgent();
    
    this.agents = {
      query: this.queryAgent,
      monitor: this.monitorAgent,
      detector: this.detectorAgent
    };
  }

  /**
   * 执行 Agent 任务
   * @param {string} agentType - Agent 类型 (query/monitor/detector)
   * @param {string} action - 动作
   * @param {object} params - 参数
   * @returns {object} - 执行结果
   */
  async execute(agentType, action, params = {}) {
    const agent = this.agents[agentType];
    
    if (!agent) {
      return {
        success: false,
        error: `未知的 Agent 类型: ${agentType}`
      };
    }

    try {
      let result;

      switch (agentType) {
        case 'query':
          result = await this.executeQueryAction(action, params);
          break;
        case 'monitor':
          result = await this.executeMonitorAction(action, params);
          break;
        case 'detector':
          result = await this.executeDetectorAction(action, params);
          break;
        default:
          result = { success: false, error: '未实现该 Agent' };
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * 执行 QueryAgent 动作
   */
  async executeQueryAction(action, params) {
    switch (action) {
      case 'query':
        return this.queryAgent.query(params.query);
      case 'parse':
        return { success: true, intent: this.queryAgent.parseIntent(params.query) };
      default:
        return { success: false, error: `未知的 QueryAgent 动作: ${action}` };
    }
  }

  /**
   * 执行 MonitorAgent 动作
   */
  async executeMonitorAction(action, params) {
    switch (action) {
      case 'healthCheck':
        const report = await this.monitorAgent.healthCheck();
        return {
          success: true,
          report,
          summary: this.monitorAgent.generateSummary(report)
        };
      case 'autoFix':
        return await this.monitorAgent.autoFix(params.issues || []);
      case 'getLogs':
        return { success: true, logs: this.monitorAgent.getLogs(params.limit || 20) };
      default:
        return { success: false, error: `未知的 MonitorAgent 动作: ${action}` };
    }
  }

  /**
   * 执行 DetectorAgent 动作
   */
  async executeDetectorAction(action, params) {
    switch (action) {
      case 'takeSnapshot':
        return await this.detectorAgent.takeSnapshot(params.type || 'characters');
      case 'detectChanges':
        return await this.detectorAgent.detectChanges(params.type || 'characters');
      case 'generateSelectors':
        return await this.detectorAgent.generateNewSelectors(params.type || 'characters');
      case 'updateSelectors':
        return await this.detectorAgent.updateCrawlerConfig(
          params.type || 'characters',
          params.selectors || {}
        );
      case 'getSelectors':
        return { 
          success: true, 
          selectors: this.detectorAgent.getCurrentSelectors() 
        };
      default:
        return { success: false, error: `未知的 DetectorAgent 动作: ${action}` };
    }
  }

  /**
   * 获取所有 Agent 状态
   */
  getStatus() {
    return {
      agents: {
        query: {
          name: 'QueryAgent',
          description: '自然语言查询 Agent',
          status: 'active'
        },
        monitor: {
          name: 'MonitorAgent',
          description: '智能爬虫监控 Agent',
          status: 'active'
        },
        detector: {
          name: 'DetectorAgent',
          description: '网站结构自适应 Agent',
          status: 'active'
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取 Agent 使用帮助
   */
  getHelp() {
    return {
      QueryAgent: {
        actions: ['query', 'parse'],
        examples: [
          { action: 'query', params: { query: '路飞的悬赏金是多少' } },
          { action: 'query', params: { query: '悬赏金超过10亿的角色有哪些' } }
        ]
      },
      MonitorAgent: {
        actions: ['healthCheck', 'autoFix', 'getLogs'],
        examples: [
          { action: 'healthCheck', params: {} },
          { action: 'getLogs', params: { limit: 10 } }
        ]
      },
      DetectorAgent: {
        actions: ['takeSnapshot', 'detectChanges', 'generateSelectors', 'updateSelectors', 'getSelectors'],
        examples: [
          { action: 'detectChanges', params: { type: 'characters' } },
          { action: 'generateSelectors', params: { type: 'characters' } }
        ]
      }
    };
  }
}

// 导出单例
module.exports = new AgentManager();