// 验证修复后的正则表达式匹配
const tests = [
  // 应该匹配 character_bounty
  { query: '路飞悬赏金多少', expected: 'character_bounty', desc: '路飞悬赏金多少' },
  { query: '路飞的悬赏金是多少', expected: 'character_bounty', desc: '路飞的悬赏金是多少' },
  { query: '索隆的赏金', expected: 'character_bounty', desc: '索隆的赏金' },
  { query: '山治赏金多少', expected: 'character_bounty', desc: '山治赏金多少' },

  // 应该匹配 top_bounty
  { query: '悬赏金最高的前10名角色', expected: 'top_bounty', desc: '悬赏金最高的前10名角色' },
  { query: '悬赏金前10名最高角色', expected: 'top_bounty', desc: '悬赏金前10名最高角色' },
  { query: '悬赏金最高的角色', expected: 'top_bounty', desc: '悬赏金最高的角色' },
  { query: '悬赏金最高前5名', expected: 'top_bounty', desc: '悬赏金最高前5名' },
  { query: '赏金前10名', expected: 'top_bounty', desc: '赏金前10名' },

  // 应该匹配 bottom_bounty
  { query: '悬赏金最低的前5名', expected: 'bottom_bounty', desc: '悬赏金最低的前5名' },
  { query: '悬赏金最低角色', expected: 'bottom_bounty', desc: '悬赏金最低角色' },
];

// character_bounty 模式
const cbPatterns = ['(.+?)的?(悬赏金|赏金)(是)?(多少)?', '(.+?)的?bounty'];

// top_bounty 模式
const tbPatterns = [
  '悬赏金最高(的)?(前)?(\\d+)?名(角色)?',
  '悬赏金最高(的)?前(\\d+)名?(角色)?',
  '悬赏金前(\\d+)名(最高)?(角色)?',
  '赏金最高(的)?(前)?(\\d+)?名(角色)?',
  '赏金最高(的)?前(\\d+)名?(角色)?',
  '赏金前(\\d+)名(最高)?(角色)?'
];

// bottom_bounty 模式
const bbPatterns = [
  '悬赏金最低(的)?(前)?(\\d+)?名(角色)?',
  '悬赏金最低(的)?前(\\d+)名?(角色)?',
  '悬赏金前(\\d+)名(最低)?(角色)?',
  '赏金最低(的)?(前)?(\\d+)?名(角色)?',
  '赏金最低(的)?前(\\d+)名?(角色)?',
  '赏金前(\\d+)名(最低)?(角色)?'
];

console.log('=== 测试正则表达式匹配 ===\n');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  let matched = null;
  let matchedPattern = null;

  // 检查 character_bounty
  cbPatterns.forEach(p => {
    const r = new RegExp(p, 'i');
    const m = test.query.match(r);
    if (m && !matched) {
      // 验证 match[1] 是角色名，不是空串
      if (m[1] && m[1].trim().length > 0) {
        matched = 'character_bounty';
        matchedPattern = p;
      }
    }
  });

  // 检查 top_bounty
  if (!matched) {
    tbPatterns.forEach(p => {
      const r = new RegExp(p, 'i');
      const m = test.query.match(r);
      if (m && !matched) {
        // 确保至少匹配到数字或"最高"字样
        if (m[0].includes('最高') || /\d+/.test(m[0])) {
          matched = 'top_bounty';
          matchedPattern = p;
        }
      }
    });
  }

  // 检查 bottom_bounty
  if (!matched) {
    bbPatterns.forEach(p => {
      const r = new RegExp(p, 'i');
      const m = test.query.match(r);
      if (m && !matched) {
        if (m[0].includes('最低') || /\d+/.test(m[0])) {
          matched = 'bottom_bounty';
          matchedPattern = p;
        }
      }
    });
  }

  const status = matched === test.expected ? '✅ PASS' : '❌ FAIL';
  if (matched === test.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${status}: ${test.desc}`);
  console.log(`   Expected: ${test.expected}, Got: ${matched || 'null'}`);
  if (matchedPattern) console.log(`   Pattern: ${matchedPattern}`);
  console.log('');
});

console.log(`=== 结果：${passed} 通过, ${failed} 失败 ===`);