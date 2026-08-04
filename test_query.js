// 测试查询匹配
const testQueries = [
  '悬赏金最高的前10名角色',
  '草帽海贼团有哪些成员',
  '悬赏金超过10亿的角色有哪些',
  '悬赏金在10亿到20亿之间的角色'
];

// 测试悬赏金排序查询模式
const topBountyPatterns = [
  '悬赏金最高(的)?(前)?(\\d+)?名?(角色)?',
  '悬赏金(前)?(\\d+)?名?(最高)?(角色)?',
  '赏金最高(的)?(前)?(\\d+)?名?(角色)?'
];

// 测试组织查询模式
const orgMembersPattern = '(\\S+海贼团|\\S+组织|麦わらの一味|草帽.*团)(里|中|里)?有哪些?(人|角色|成员)';

// 测试悬赏金筛选模式
const bountyAbovePattern = '悬赏金(超过|大于|高于)(\\d+)(亿|千万|万)';

console.log('=== 测试悬赏金排序查询 ===');
testQueries.forEach(query => {
  console.log(`\n查询: "${query}"`);
  topBountyPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'i');
    const match = query.match(regex);
    if (match) {
      console.log(`  ✓ 匹配模式: ${pattern}`);
      console.log(`    match[0]: "${match[0]}"`);
      const numbers = match[0].match(/\d+/g);
      console.log(`    提取数字: ${numbers && numbers[0] ? numbers[0] : '无'}`);
    }
  });
});

console.log('\n=== 测试组织查询 ===');
const orgQuery = '草帽海贼团有哪些成员';
console.log(`查询: "${orgQuery}"`);
const orgRegex = new RegExp(orgMembersPattern, 'i');
const orgMatch = orgQuery.match(orgRegex);
if (orgMatch) {
  console.log(`  ✓ 匹配成功`);
  console.log(`    match[1]: "${orgMatch[1]}"`);
} else {
  console.log(`  ✗ 匹配失败`);
}

console.log('\n=== 测试悬赏金筛选查询 ===');
const bountyQuery = '悬赏金超过10亿的角色有哪些';
console.log(`查询: "${bountyQuery}"`);
const bountyRegex = new RegExp(bountyAbovePattern, 'i');
const bountyMatch = bountyQuery.match(bountyRegex);
if (bountyMatch) {
  console.log(`  ✓ 匹配成功`);
  console.log(`    match[0]: "${bountyMatch[0]}"`);
  console.log(`    match[2]: "${bountyMatch[2]}"`);
  console.log(`    match[3]: "${bountyMatch[3]}"`);
} else {
  console.log(`  ✗ 匹配失败`);
}