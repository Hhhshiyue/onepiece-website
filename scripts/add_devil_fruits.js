const fs = require('fs');
const path = require('path');

const devilFruits = [
    // 超人系 (Paramecia)
    { name: 'ゴムゴムの実', type: '超人系', ability: '体がゴムのように伸びる', users: ['モンキー・D・ルフィ'], description: 'ヒトヒトの実 幻獣種 モデル"ニカ"の真の姿' },
    { name: 'ハナハナの実', type: '超人系', ability: '体の一部を咲かせることができる', users: ['ニコ・ロビン'], description: '周囲に自分の体の一部を自由に咲かせることができる' },
    { name: 'バラバラの実', type: '超人系', ability: '体をバラバラにできる', users: ['バギー'], description: '体を分裂させ、自在に操ることができる' },
    { name: 'スナスナの実', type: '超人系', ability: '体を砂に変える', users: ['クロコダイル'], description: '砂の特性を持ち、水分を吸い取ることができる' },
    { name: 'オペオペの実', type: '超人系', ability: '空間を自由に操作できる', users: ['トラファルガー・ロー'], description: 'ROOM内で自由に手術を行うことができる' },
    { name: 'ジキジキの実', type: '超人系', ability: '磁力を操る', users: ['EUSTASS・キッド'], description: '自在に磁力を操り、金属を引き寄せたり反発させたりできる' },
    { name: 'モチモチの実', type: '超人系', ability: '体を餅に変える', users: ['カタクリ'], description: '粘着質の餅のような性質を持ち、捕らえた相手を逃さない' },
    { name: 'ビスビスの実', type: '超人系', ability: 'ビスケットを作り出す', users: ['クラッカー'], description: '無限にビスケットを作り出し、兵士を生成できる' },
    { name: 'イトイトの実', type: '超人系', ability: '糸を操る', users: ['ドンキホーテ・ドフラミンゴ'], description: '極めて強力な糸を操り、切断や操作が可能' },
    { name: 'キラキラの実', type: '超人系', ability: '体をダイヤモンドに変える', users: ['ジョズ'], description: '体をダイヤモンドのように硬化させる' },
    { name: 'メラメラの実', type: '超人系', ability: '炎を作り出す', users: ['ポートガス・D・エース', 'サボ'], description: '体を炎に変え、自在に操ることができる' },
    { name: 'マグマグの実', type: '超人系', ability: 'マグマを作り出す', users: ['赤犬'], description: 'メラメラの実よりも優れた能力を持つ' },
    { name: 'ピカピカの実', type: '超人系', ability: '光を操る', users: ['黄猿'], description: '光速で移動し、光線を放つことができる' },
    { name: 'グラビティグラビティの実', type: '超人系', ability: '重力を操る', users: ['藤虎'], description: '自在に重力を操り、隕石を引き寄せることも可能' },
    { name: 'メロメロの実', type: '超人系', ability: '石化させる', users: ['ハンコック'], description: '相手を石化させる光線を放つ' },
    { name: 'ホルモンホルモンの実', type: '超人系', ability: 'ホルモンを操る', users: ['エンポリオ・イワンコフ'], description: '性転換や治癒などが可能' },
    { name: 'カゲカゲの実', type: '超人系', ability: '影を操る', users: ['モリア'], description: '影を切り取って他人に与えることができる' },
    { name: 'グラグラの実', type: '超人系', ability: '振動を作り出す', users: ['エドワード・ニューゲート', 'マーシャル・D・ティーチ'], description: '世界を壊す力を持つ最強の攻撃力' },
    { name: 'モクモクの実', type: '超人系', ability: '体を煙に変える', users: ['スモーカー'], description: '煙の性質を持ち、物理攻撃を無効化' },
    { name: 'ニキュニキュの実', type: '超人系', ability: '痛みを他人に移す', users: ['バーソロミュー・くま'], description: '自身の痛みを他人に移すことができる' },
    { name: 'ソルソルの実', type: '超人系', ability: '魂を操る', users: ['ブルージャン'], description: '他人の寿命を奪い、物に魂を与える' },
    { name: 'ヨミヨミの実', type: '超人系', ability: '蘇生する', users: ['ブルック'], description: '一度死んでも蘇ることができる' },
    { name: 'トキトキの実', type: '超人系', ability: '年齢を操る', users: ['ボニー'], description: '自分や他人の年齢を自在に操る' },
    { name: 'トリトリの実', type: '超人系', ability: '青い炎を作り出す', users: ['マルコ'], description: '再生能力を持つ青い炎を操る' },

    // 動物系 (Zoan)
    { name: 'ヒトヒトの実', type: '動物系', ability: '人間に変身する', users: ['トニートニー・チョッパー'], description: '動物が人間の能力を得る' },
    { name: 'ウルウルの実', type: '動物系', ability: '獣に変身する', users: ['カイドウ', 'キング', 'クイーン', 'ジャック'], description: '古代種や幻獣種など多くのモデルが存在' },

    // 自然系 (Logia)
    { name: 'ヒエヒエの実', type: '自然系', ability: '氷を作り出す', users: ['青キジ'], description: '体を氷に変え、触れたものを凍らせる' },
    { name: 'ゴロゴロの実', type: '自然系', ability: '雷を操る', users: ['エネル'], description: '雷を自在に操る' },
    { name: 'ヤミヤミの実', type: '自然系', ability: '闇を作り出す', users: ['ギルド・ティーチ'], description: '悪魔の実の能力を無効化する引力を持つ' },
    { name: 'モネモネの実', type: '自然系', ability: '不明', users: ['センゴク'], description: '衝撃波を放つ能力（詳細不明）' },
];

const dataPath = path.join(__dirname, '..', 'data', 'devil_fruits.json');
fs.writeFileSync(dataPath, JSON.stringify(devilFruits, null, 2), 'utf-8');

console.log('恶魔果实数据已更新（无图片，显示果实图标）！');
console.log(`总数: ${devilFruits.length} 个`);