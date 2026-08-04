const fs = require('fs');

const DEVIL_FRUTIS = [
    {
        name: 'ゴムゴムの実',
        nameEn: 'Gomu Gomu no Mi',
        type: '超人系',
        user: 'モンキー・D・ルフィ',
        description: '身体をゴムのように伸び縮みさせることができる。攻撃を弾き返したり、遠距離からの攻撃が可能。'
    },
    {
        name: 'ゾロゾロの実',
        nameEn: 'Zoro Zoro no Mi',
        type: '超人系',
        user: 'ロロノア・ゾロ',
        description: '全身の柔軟性を極限まで高め、体を自在に曲げ伸ばしできる。三刀流の技を最大限に発揮できる。'
    },
    {
        name: 'ナナナの実',
        nameEn: 'Nana Nana no Mi',
        type: '超人系',
        user: 'ナミ',
        description: '天候を自在に操ることができる。雷や雨、風などを呼び起こすことが可能。'
    },
    {
        name: 'ソソソの実',
        nameEn: 'Soso Soso no Mi',
        type: '超人系',
        user: 'ウソップ',
        description: '嘘をつくとそれが現実になる。信じる心が強ければ強いほど効果が高まる。'
    },
    {
        name: 'キンキンの実',
        nameEn: 'Kinki Kinki no Mi',
        type: '超人系',
        user: 'サンジ',
        description: '足技の威力を極限まで高める。空中歩行や高速移動が可能。'
    },
    {
        name: 'ヒヒの実 モデル:ブラキオサウルス',
        nameEn: 'Hihi no Mi Model: Brachiosaurus',
        type: '動物系',
        user: 'トニートニー・チョッパー',
        description: 'ブラキオサウルスに変身できる。人形、獣人、獣の三種の形態を自由に変えられる。'
    },
    {
        name: 'ハナハナの実',
        nameEn: 'Hana Hana no Mi',
        type: '超人系',
        user: 'ニコ・ロビン',
        description: '身体のあらゆる部位をどこにでも咲かせることができる。探知や攻撃、防御に応用可能。'
    },
    {
        name: 'フランフランの実',
        nameEn: 'Fran Fran no Mi',
        type: '超人系',
        user: 'フランキー',
        description: '自分自身を改造したり、機械を自在に操ることができる。'
    },
    {
        name: 'ヨミヨミの実',
        nameEn: 'Yomi Yomi no Mi',
        type: '超人系',
        user: 'ブルック',
        description: '死んでも蘇ることができる。二度目の死は普通に死ぬ。'
    },
    {
        name: 'ジンベエの実',
        nameEn: 'Jinbe Jinbe no Mi',
        type: '動物系',
        user: 'ジンベエ',
        description: '人魚に変身できる。水中での活動能力が飛躍的に向上する。'
    },
    {
        name: 'マルマルの実',
        nameEn: 'Maru Maru no Mi',
        type: '超人系',
        user: 'マルコ',
        description: '不死鳥に変身できる。炎で傷を癒すことができる。'
    },
    {
        name: 'メラメラの実',
        nameEn: 'Mera Mera no Mi',
        type: '自然系',
        user: 'ポートガス・D・エース',
        description: '炎を自在に操ることができる。体を炎に変えて物理攻撃を無効化できる。'
    },
    {
        name: 'オペオペの実',
        nameEn: 'Ope Ope no Mi',
        type: '超人系',
        user: 'トラファルガー・ロー',
        description: '自分の周囲を「手術室」にできる。空間内の物体を自在に操ることが可能。'
    },
    {
        name: 'ジキジキの実',
        nameEn: 'Jiki Jiki no Mi',
        type: '超人系',
        user: 'EUSTASS・キッド',
        description: '磁力を操ることができる。金属を吸引したり、磁気の攻撃を行うことが可能。'
    },
    {
        name: 'ドキドキの実',
        nameEn: 'Doki Doki no Mi',
        type: '超人系',
        user: 'ドンキホーテ・ドフラミンゴ',
        description: '線を自在に操ることができる。空中歩行や切断、操縦など様々な能力を発揮。'
    },
    {
        name: 'グラグラの実',
        nameEn: 'Gura Gura no Mi',
        type: '超人系',
        user: 'エドワード・ニューゲート',
        description: '海と陸地を揺るがすことができる。世界を滅ぼすほどの破壊力を持つ。'
    },
    {
        name: 'シャンクスの実',
        nameEn: 'Shanks Shanks no Mi',
        type: '超人系',
        user: 'シャンクス',
        description: '覇気を極限まで高める。圧倒的な精神力で敵を圧倒する。'
    },
    {
        name: 'キリキリの実',
        nameEn: 'Kiri Kiri no Mi',
        type: '自然系',
        user: 'ジュラキュール・ミホーク',
        description: '斬撃を自在に操ることができる。空気を切り裂くほどの鋭い刃を生み出す。'
    },
    {
        name: 'ハンコックの実',
        nameEn: 'Hancock Hancock no Mi',
        type: '超人系',
        user: 'ハンコック',
        description: '魅了の能力を持つ。見た者を石に変えることができる。'
    },
    {
        name: 'サボの実',
        nameEn: 'Sabo Sabo no Mi',
        type: '自然系',
        user: 'サボ',
        description: '炎を自在に操ることができる。エースのメラメラの実を継承。'
    },
    {
        name: 'バギーの実',
        nameEn: 'Buggy Buggy no Mi',
        type: '超人系',
        user: 'バギー',
        description: '身体を自在に分裂させることができる。分裂した部位を遠隔操作可能。'
    },
    {
        name: 'クロコダイルの実',
        nameEn: 'Crocodile Crocodile no Mi',
        type: '自然系',
        user: 'クロコダイル',
        description: '砂を自在に操ることができる。体を砂に変えて物理攻撃を無効化できる。'
    },
    {
        name: 'モリアの実',
        nameEn: 'Moria Moria no Mi',
        type: '超人系',
        user: 'モリア',
        description: '影を操ることができる。他人の影を奪って自分の力にすることが可能。'
    },
    {
        name: 'ブルージャンの実',
        nameEn: 'Bluejan Bluejan no Mi',
        type: '超人系',
        user: 'ブルージャン',
        nameEn: 'Big Mom',
        description: '魂を操ることができる。物体に魂を与えたり、他人の寿命を奪うことが可能。'
    },
    {
        name: 'カイドウの実',
        nameEn: 'Kaido Kaido no Mi',
        type: '動物系',
        user: 'カイドウ',
        description: 'ドラゴンに変身できる。不死身の体と圧倒的な力を持つ。'
    },
    {
        name: 'ギルド・ティーチの実',
        nameEn: 'Guild Teach Guild Teach no Mi',
        type: '自然系',
        user: 'ギルド・ティーチ',
        description: '暗闇を操ることができる。他の悪魔の実の能力を奪うことが可能。'
    },
    {
        name: 'バーソロミュー・くまの実',
        nameEn: 'Bartholomew Kuma Bartholomew Kuma no Mi',
        type: '超人系',
        user: 'バーソロミュー・くま',
        description: '肉球を生やし、様々な能力を発揮。弾くことで物体を移動させたり、痛みを取り除くことが可能。'
    },
    {
        name: 'センゴクの実',
        nameEn: 'Sengoku Sengoku no Mi',
        type: '動物系',
        user: 'センゴク',
        description: '仏に変身できる。巨大な体と圧倒的な攻撃力を持つ。'
    },
    {
        name: 'ガープの実',
        nameEn: 'Garp Garp no Mi',
        type: '超人系',
        user: 'ガープ',
        description: '体術の威力を極限まで高める。海軍の英雄としての実力を支える。'
    },
    {
        name: '青キジの実',
        nameEn: 'Aokiji Aokiji no Mi',
        type: '自然系',
        user: '青キジ',
        description: '氷を自在に操ることができる。体を氷に変えて物理攻撃を無効化できる。'
    },
    {
        name: '黄猿の実',
        nameEn: 'Kizaru Kizaru no Mi',
        type: '自然系',
        user: '黄猿',
        description: '光を自在に操ることができる。光速で移動したり、光線を放つことが可能。'
    },
    {
        name: '赤犬の実',
        nameEn: 'Akainu Akainu no Mi',
        type: '自然系',
        user: '赤犬',
        description: '溶岩を自在に操ることができる。体を溶岩に変えて物理攻撃を無効化できる。'
    },
    {
        name: '藤虎の実',
        nameEn: 'Fujitora Fujitora no Mi',
        type: '超人系',
        user: '藤虎',
        description: '重力を操ることができる。物体を浮かせたり、降ろすことが可能。'
    },
    {
        name: 'スモーカーの実',
        nameEn: 'Smoker Smoker no Mi',
        type: '自然系',
        user: 'スモーカー',
        description: '煙を自在に操ることができる。体を煙に変えて物理攻撃を無効化できる。'
    },
    {
        name: 'タシギの実',
        nameEn: 'Tashigi Tashigi no Mi',
        type: '超人系',
        user: 'タシギ',
        description: '刀の使い手としての能力を高める。名刀を自在に操ることが可能。'
    },
    {
        name: 'モンキー・D・ドラゴンの実',
        nameEn: 'Monkey D Dragon Monkey D Dragon no Mi',
        type: '自然系',
        user: 'モンキー・D・ドラゴン',
        description: '風を自在に操ることができる。革命軍の総司令官としての実力を支える。'
    },
    {
        name: 'エンポリオ・イワンコフの実',
        nameEn: 'Emporio Ivankov Emporio Ivankov no Mi',
        type: '超人系',
        user: 'エンポリオ・イワンコフ',
        description: 'ホルモンを操ることができる。性別を変えたり、生命力を高めることが可能。'
    },
    {
        name: 'シルバー・レイリーの実',
        nameEn: 'Silver Rayleigh Silver Rayleigh no Mi',
        type: '超人系',
        user: 'シルバー・レイリー',
        description: '覇気を極限まで高める。ロジャー海賊団の副船長としての実力を支える。'
    },
    {
        name: 'ゴール・D・ロジャーの実',
        nameEn: 'Gol D Roger Gol D Roger no Mi',
        type: '超人系',
        user: 'ゴール・D・ロジャー',
        description: 'オールブルーを見つけることができる。海贼王としての実力を支える。'
    },
    {
        name: 'カタクリの実',
        nameEn: 'Katakuri Katakuri no Mi',
        type: '超人系',
        user: 'カタクリ',
        description: 'モチモチのような体になる。未来を見通すことができる。'
    },
    {
        name: 'キングの実',
        nameEn: 'King King no Mi',
        type: '動物系',
        user: 'キング',
        description: '古代種のパケケロプテランに変身できる。火炎を操ることが可能。'
    },
    {
        name: 'クイーンの実',
        nameEn: 'Queen Queen no Mi',
        type: '動物系',
        user: 'クイーン',
        description: '古代種のステゴサウルスに変身できる。毒を操ることが可能。'
    },
    {
        name: 'ジャックの実',
        nameEn: 'Jack Jack no Mi',
        type: '動物系',
        user: 'ジャック',
        description: '古代種のマンモスに変身できる。圧倒的な力と耐久性を持つ。'
    },
    {
        name: 'クラッカーの実',
        nameEn: 'Cracker Cracker no Mi',
        type: '超人系',
        user: 'クラッカー',
        description: 'ビスケットを自在に操ることができる。巨大なビスケットの兵士を生み出すことが可能。'
    },
    {
        name: 'コビの実',
        nameEn: 'Coby Coby no Mi',
        type: '超人系',
        user: 'コビ',
        description: '覇気を身につけることができる。海軍としての成長を支える。'
    },
    {
        name: 'ボニーの実',
        nameEn: 'Bonney Bonney no Mi',
        type: '超人系',
        user: 'ボニー',
        description: '年齢を自在に操ることができる。自分や他人の年齢を変えることが可能。'
    }
];

function main() {
    console.log('=== 添加恶魔果实数据 ===');
    
    const filePath = 'data/devil_fruits.json';
    
    fs.writeFileSync(filePath, JSON.stringify(DEVIL_FRUTIS, null, 2), 'utf-8');
    
    console.log(`成功添加 ${DEVIL_FRUTIS.length} 个恶魔果实数据`);
}

main().catch(console.error);
