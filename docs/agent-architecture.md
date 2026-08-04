# 海贼王数据 Agent 系统架构

## 系统概述

将现有的海贼王数据爬取项目升级为智能 Agent 系统，实现：
1. **自然语言查询** - 用户用自然语言提问，Agent 自动查询并回答
2. **智能爬虫监控** - 自动检测数据异常，触发修复
3. **网站结构自适应** - 检测官网结构变化，动态调整爬虫

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Manager                             │
│  (统一入口：接收用户请求，调度对应 Agent)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  QueryAgent   │   │ MonitorAgent  │   │ DetectorAgent │
│  自然语言查询   │   │ 爬虫监控      │   │ 结构检测      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  QueryParser  │   │ HealthChecker │   │ DiffDetector  │
│  意图识别      │   │ 数据健康检查   │   │ 结构差异检测   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  QueryBuilder │   │ AutoFixer     │   │ SelectorGen   │
│  SQL生成      │   │ 自动修复      │   │ 选择器生成     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────┐
                    │  Data Layer   │
                    │  数据层        │
                    │  (SQLite/API) │
                    └───────────────┘
```

---

## Agent 详细设计

### 1. QueryAgent（自然语言查询 Agent）

**功能**: 用户用自然语言提问，Agent 自动查询数据库并回答

**支持的查询类型**:
- 角色信息查询: "路飞的悬赏金是多少？" "索隆的生日？"
- 条件筛选: "悬赏金超过10亿的角色有哪些？"
- 统计分析: "哪个组织的角色最多？"
- 恶魔果实查询: "哪些人吃了超人系恶魔果实？"
- 组合查询: "草帽海贼团里有哪些人没有恶魔果实能力？"

**实现方式**:
```javascript
class QueryAgent {
  // 意图识别
  parseIntent(query) {
    // 使用关键词匹配 + 规则引擎
    // 可扩展为 LLM 调用
  }

  // 构建 SQL 查询
  buildQuery(intent) {
    // 根据意图生成 SQL
  }

  // 执行查询
  execute(query) {
    // 调用数据库
  }

  // 格式化回答
  formatAnswer(result) {
    // 自然语言回答
  }
}
```

**API 端点**: `POST /api/agent/query`

---

### 2. MonitorAgent（智能爬虫监控 Agent）

**功能**: 自动监控数据健康状态，检测异常并触发修复

**监控项**:
- 数据完整性: 检测空数据、缺失字段
- 图片有效性: 检测 404 图片链接
- 数据一致性: 检测重复数据、异常值
- 数据时效性: 检测数据过期时间

**自动修复**:
- 检测到空数据 → 自动触发爬虫重新爬取
- 检测到图片失效 → 尝试备用图片源或标记
- 检测到数据异常 → 发送告警通知

**实现方式**:
```javascript
class MonitorAgent {
  // 定时检查
  schedule(interval) {
    // 每小时检查一次
  }

  // 健康检查
  async healthCheck() {
    const results = {
      characters: await this.checkCharacters(),
      devilFruits: await this.checkDevilFruits(),
      images: await this.checkImages()
    }
    return results
  }

  // 自动修复
  async autoFix(issues) {
    for (const issue of issues) {
      await this.fixIssue(issue)
    }
  }

  // 告警
  alert(issue) {
    // 记录日志 + 可选通知
  }
}
```

**API 端点**: `GET /api/agent/health`, `POST /api/agent/fix`

---

### 3. DetectorAgent（网站结构自适应 Agent）

**功能**: 检测官网结构变化，动态调整爬虫选择器

**检测方式**:
- 定期爬取样本页面
- 对比历史结构，检测差异
- 自动生成新的选择器

**自适应调整**:
- 检测到结构变化 → 分析新结构
- 生成新选择器 → 更新爬虫配置
- 记录历史版本 → 支持回滚

**实现方式**:
```javascript
class DetectorAgent {
  // 结构快照
  async takeSnapshot(url) {
    // 抓取页面结构
  }

  // 对比差异
  diff(oldSnapshot, newSnapshot) {
    // 检测选择器变化
  }

  // 生成新选择器
  async generateSelectors(newStructure) {
    // 自动生成 CSS 选择器
  }

  // 更新爬虫配置
  updateCrawlerConfig(newSelectors) {
    // 更新 crawler.js
  }
}
```

**API 端点**: `GET /api/agent/detect`, `POST /api/agent/adapt`

---

## 数据结构

### Agent 日志表
```sql
CREATE TABLE agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_type TEXT NOT NULL,      -- query/monitor/detector
  action TEXT NOT NULL,           -- 执行的动作
  input TEXT,                     -- 输入内容
  output TEXT,                    -- 输出内容
  status TEXT,                    -- success/failure
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 结构快照表
```sql
CREATE TABLE structure_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  selectors TEXT NOT NULL,        -- JSON 格式
  captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 实现计划

### 第一阶段：自然语言查询（优先）
1. 创建 `agents/QueryAgent.js`
2. 实现意图解析器（关键词 + 规则）
3. 实现 SQL 查询构建器
4. 实现自然语言回答生成器
5. 添加 API 端点

### 第二阶段：智能监控
1. 创建 `agents/MonitorAgent.js`
2. 实现数据健康检查
3. 实现图片链接验证
4. 实现自动修复逻辑
5. 添加定时任务

### 第三阶段：结构自适应
1. 创建 `agents/DetectorAgent.js`
2. 实现结构快照功能
3. 实现差异检测算法
4. 实现选择器自动生成
5. 集成到爬虫流程

---

## 技术选型

- **意图识别**: 关键词匹配 + 规则引擎（可扩展为 LLM）
- **定时任务**: node-cron
- **日志存储**: SQLite
- **API**: Express.js

---

## 使用示例

### 自然语言查询
```bash
# 查询角色信息
curl -X POST http://localhost:8080/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "路飞的悬赏金是多少？"}'

# 返回
{
  "success": true,
  "answer": "路飞的悬赏金是 30億ベリー",
  "data": {
    "name": "モンキー・D・ルフィ",
    "bounty": "30億ベリー"
  }
}
```

### 健康检查
```bash
curl http://localhost:8080/api/agent/health

# 返回
{
  "status": "healthy",
  "checks": {
    "characters": { "count": 45, "missing": 0 },
    "devilFruits": { "count": 30, "missing": 0 },
    "images": { "total": 15, "broken": 0 }
  }
}
```

### 结构检测
```bash
curl -X POST http://localhost:8080/api/agent/detect

# 返回
{
  "status": "no_change",
  "message": "网站结构未发生变化"
}
```