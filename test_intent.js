// 直接调用 QueryAgent.parseIntent 验证
const QueryAgent = require('./agents/QueryAgent');
const agent = new QueryAgent();

const tests = [
  // character_bounty
  { query: '路飞悬赏金多少', expected: 'character_bounty' },
  { query: '路飞的悬赏金是多少', expected: 'character_bounty' },
  { query: '索隆的赏金', expected: 'character_bounty' },
  { query: '山治赏金多少', expected: 'character_bounty' },
  { query: '娜美的悬赏金', expected: 'character_bounty' },

  // top_bounty
  { query: '悬赏金最高的前10名角色', expected: 'top_bounty' },
  { query: '悬赏金前10名最高角色', expected: 'top_bounty' },
  { query: '悬赏金最高的角色', expected: 'top_bounty' },
  { query: '悬赏金最高前5名', expected: 'top_bounty' },
  { query: '赏金前10名', expected: 'top_bounty' },

  // bottom_bounty
  { query: '悬赏金最低的前5名', expected: 'bottom_bounty' },
  { query: '悬赏金最低角色', expected: 'bottom_bounty' },

  // filter_bounty
  { query: '悬赏金超过10亿的角色有哪些', expected: 'filter_bounty_above' },
  { query: '悬赏金低于1亿的角色有哪些', expected: 'filter_bounty_below' },
  { query: '悬赏金在10亿到20亿之间的角色', expected: 'filter_bounty_range' },

  // org_members
  { query: '草帽海贼团有哪些成员', expected: 'org_members' },
  { query: '草帽海贼团有哪些人', expected: 'org_members' },
  { query: '海军里有哪些角色', expected: 'org_members' },

  // fruit_by_type
  { query: '自然系果实有哪些', expected: 'fruit_by_type' },
  { query: '超人系恶魔果实', expected: 'fruit_by_type' },

  // no_fruit
  { query: '哪些角色没有恶魔果实', expected: 'no_fruit_characters' },

  // character_info (模糊匹配)
  { query: '多弗朗明哥', expected: 'character_info' },
];

console.log('=== QueryAgent.parseIntent 测试 ===\n');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = agent.parseIntent(test.query);
  const status = result.type === test.expected ? '✅ PASS' : '❌ FAIL';
  if (result.type === test.expected) {
    passed++;
  } else {
    failed++;
  }
  console.log(`${status}: "${test.query}"`);
  console.log(`   Expected: ${test.expected}, Got: ${result.type}`);
  if (result.type !== test.expected) {
    console.log(`   Params: ${JSON.stringify(result.params)}`);
  }
  console.log('');
});

console.log(`=== 结果：${passed} 通过, ${failed} 失败 ===`);
process.exit(failed > 0 ? 1 : 0);