const fs = require('fs');
const path = require('path');

const characters = [
    { name: 'モンキー・D・ルフィ', imageKey: 'luffy', organization: '麦わらの一味', bounty: '30億ベリー', devilFruit: 'ゴムゴムの実 ヒトヒトの実 幻獣種 モデル 〝ニカ〟', birthday: '5月5日', localImage: '/images/characters/モンキー・D・ルフィ.jpg' },
    { name: 'ロロノア・ゾロ', imageKey: 'zoro', organization: '麦わらの一味', bounty: '11億1100万ベリー', devilFruit: '', birthday: '11月11日', localImage: '/images/characters/ロロノア・ゾロ.jpg' },
    { name: 'ナミ', imageKey: 'nami', organization: '麦わらの一味', bounty: '3億6600万ベリー', devilFruit: '', birthday: '7月3日', localImage: '/images/characters/ナミ.jpg' },
    { name: 'ウソップ', imageKey: 'usopp', organization: '麦わらの一味', bounty: '5億ベリー', devilFruit: '', birthday: '4月1日', localImage: '/images/characters/ウソップ.jpg' },
    { name: 'サンジ', imageKey: 'sanji', organization: '麦わらの一味', bounty: '10億3200万ベリー', devilFruit: '', birthday: '3月2日', localImage: '/images/characters/サンジ.jpg' },
    { name: 'トニートニー・チョッパー', imageKey: 'chopper', organization: '麦わらの一味', bounty: '100ベリー', devilFruit: 'ヒトヒトの実', birthday: '12月24日', localImage: '/images/characters/トニートニー・チョッパー.jpg' },
    { name: 'ニコ・ロビン', imageKey: 'robin', organization: '麦わらの一味', bounty: '9億3000万ベリー', devilFruit: 'ハナハナの実', birthday: '2月6日', localImage: '/images/characters/ニコ・ロビン.jpg' },
    { name: 'フランキー', imageKey: 'franky', organization: '麦わらの一味', bounty: '9億4000万ベリー', devilFruit: '', birthday: '3月9日', localImage: '/images/characters/フランキー.jpg' },
    { name: 'ブルック', imageKey: 'brook', organization: '麦わらの一味', bounty: '3億3000万ベリー', devilFruit: 'ヨミヨミの実', birthday: '4月3日', localImage: '/images/characters/ブルック.jpg' },
    { name: 'ジンベエ', imageKey: 'Jinbe', organization: '麦わらの一味', bounty: '11億ベリー', devilFruit: '', birthday: '4月2日', localImage: '/images/characters/ジンベエ.jpg' },
    { name: 'シャンクス', imageKey: 'shanks', organization: '赤髪海賊団', bounty: '40億4890万ベリー', devilFruit: '', birthday: '3月9日', localImage: '' },
    { name: 'エドワード・ニューゲート', imageKey: 'whitebeard', organization: '白ひげ海賊団', bounty: '50億4600万ベリー', devilFruit: 'グラグラの実', birthday: '4月6日', localImage: '' },
    { name: 'マルコ', imageKey: 'marco', organization: '白ひげ海賊団', bounty: '13億7400万ベリー', devilFruit: 'フェニックスフェニックスの実', birthday: '3月16日', localImage: '/images/characters/マルコ.jpg' },
    { name: 'ポートガス・D・エース', imageKey: 'ace', organization: '白ひげ海賊団', bounty: '5億5000万ベリー', devilFruit: 'メラメラの実', birthday: '1月1日', localImage: '/images/characters/ポートガス・D・エース.jpg' },
    { name: 'ジョズ', imageKey: 'jozu', organization: '白ひげ海賊団', bounty: '10億ベリー', devilFruit: 'キラキラの実', birthday: '11月11日', localImage: '/images/characters/ジョズ.jpg' },
    { name: 'ギルド・ティーチ', imageKey: 'blackbeard', organization: '黒ひげ海賊団', bounty: '22億4760万ベリー', devilFruit: 'ヤミヤミの実', birthday: '8月3日', localImage: '' },
    { name: 'カイドウ', imageKey: 'kaido', organization: '百獣海賊団', bounty: '46億1110万ベリー', devilFruit: 'ウルフウルフの実', birthday: '5月1日', localImage: '' },
    { name: 'キング', imageKey: 'king', organization: '百獣海賊団', bounty: '13億9000万ベリー', devilFruit: 'ウルフウルフの実 モデル:パケケロプテラン', birthday: '', localImage: '' },
    { name: 'クイーン', imageKey: 'queen', organization: '百獣海賊団', bounty: '13億2000万ベリー', devilFruit: 'ウルフウルフの実 モデル:ステゴサウルス', birthday: '', localImage: '' },
    { name: 'ジャック', imageKey: 'jack', organization: '百獣海賊団', bounty: '10億ベリー', devilFruit: 'ウルフウルフの実 モデル:マンモス', birthday: '', localImage: '' },
    { name: 'ブルージャン', imageKey: 'bigmom', organization: 'ビッグ・マム海賊団', bounty: '43億8800万ベリー', devilFruit: 'スーパースーパーの実', birthday: '2月15日', localImage: '' },
    { name: 'カタクリ', imageKey: 'katakuri', organization: 'ビッグ・マム海賊団', bounty: '10億5700万ベリー', devilFruit: 'モチモチの実', birthday: '11月25日', localImage: '' },
    { name: 'クラッカー', imageKey: 'cracker', organization: 'ビッグ・マム海賊団', bounty: '8億6000万ベリー', devilFruit: 'ビスビスの実', birthday: '', localImage: '' },
    { name: 'ドンキホーテ・ドフラミンゴ', imageKey: 'doflamingo', organization: 'ドンキホーテ海賊団', bounty: '34億ベリー', devilFruit: 'ジャクジャクの実', birthday: '10月23日', localImage: '/images/characters/ドンキホーテ・ドフラミンゴ.jpg' },
    { name: 'クロコダイル', imageKey: 'crocodile', organization: 'バロックワークス', bounty: '19億6500万ベリー', devilFruit: 'スナスナの実', birthday: '9月5日', localImage: '' },
    { name: 'バギー', imageKey: 'buggy', organization: 'バギー海賊団', bounty: '31億8900万ベリー', devilFruit: 'バラバラの実', birthday: '8月8日', localImage: '' },
    { name: 'モリア', imageKey: 'moria', organization: '月光海賊団', bounty: '3億2000万ベリー', devilFruit: 'シャドウシャドウの実', birthday: '9月6日', localImage: '' },
    { name: 'トラファルガー・ロー', imageKey: 'law', organization: 'ハート海賊団', bounty: '30億ベリー', devilFruit: 'オペオペの実', birthday: '10月6日', localImage: '/images/characters/トラファルガー・ロー.jpg' },
    { name: 'EUSTASS・キッド', imageKey: 'kid', organization: 'キッド海賊団', bounty: '30億ベリー', devilFruit: 'ジキジキの実', birthday: '1月10日', localImage: '/images/characters/EUSTASS・キッド.jpg' },
    { name: 'ジュラキュール・ミホーク', imageKey: 'mihawk', organization: '王下七武海（元）', bounty: '35億9000万ベリー', devilFruit: '', birthday: '3月9日', localImage: '' },
    { name: 'ハンコック', imageKey: 'hancock', organization: '九蛇海賊団', bounty: '16億5900万ベリー', devilFruit: 'メロメロの実', birthday: '9月2日', localImage: '' },
    { name: 'バーソロミュー・くま', imageKey: 'kuma', organization: '王下七武海', bounty: '29億6000万ベリー', devilFruit: 'バトンバトンの実', birthday: '9月9日', localImage: '' },
    { name: 'ガープ', imageKey: 'garp', organization: '海軍', bounty: '', devilFruit: '', birthday: '5月2日', localImage: '' },
    { name: 'センゴク', imageKey: 'sengoku', organization: '海軍', bounty: '', devilFruit: 'モネモネの実', birthday: '5月9日', localImage: '' },
    { name: '赤犬', imageKey: 'akainu', organization: '海軍', bounty: '', devilFruit: 'マグマグの実', birthday: '8月16日', localImage: '' },
    { name: '青キジ', imageKey: 'aokiji', organization: '海軍', bounty: '', devilFruit: 'ヒエヒエの実', birthday: '9月21日', localImage: '' },
    { name: '黄猿', imageKey: 'kizaru', organization: '海軍', bounty: '', devilFruit: 'ピカピカの実', birthday: '11月23日', localImage: '' },
    { name: '藤虎', imageKey: 'fujitora', organization: '海軍', bounty: '', devilFruit: 'グラビティグラビティの実', birthday: '8月10日', localImage: '/images/characters/藤虎.jpg' },
    { name: 'スモーカー', imageKey: 'smoker', organization: '海軍', bounty: '', devilFruit: 'モクモクの実', birthday: '3月14日', localImage: '/images/characters/スモーカー.jpg' },
    { name: 'タシギ', imageKey: 'tashigi', organization: '海軍', bounty: '', devilFruit: '', birthday: '10月6日', localImage: '/images/characters/タシギ.jpg' },
    { name: 'コビ', imageKey: 'coby', organization: '海軍', bounty: '', devilFruit: '', birthday: '5月6日', localImage: '' },
    { name: 'サボ', imageKey: 'sabo', organization: '革命軍', bounty: '6億2000万ベリー', devilFruit: 'メラメラの実', birthday: '3月20日', localImage: '/images/characters/サボ.jpg' },
    { name: 'モンキー・D・ドラゴン', imageKey: 'dragon', organization: '革命軍', bounty: '', devilFruit: 'ゴロゴロの実', birthday: '10月5日', localImage: '' },
    { name: 'エンポリオ・イワンコフ', imageKey: 'ivankov', organization: '革命軍', bounty: '5億0000万ベリー', devilFruit: 'ホルモンホルモンの実', birthday: '1月8日', localImage: '' },
    { name: 'ゴール・D・ロジャー', imageKey: 'roger', organization: 'ロジャー海賊団', bounty: '55億6480万ベリー', devilFruit: '', birthday: '12月31日', localImage: '' },
    { name: 'シルバー・レイリー', imageKey: 'rayleigh', organization: 'ロジャー海賊団', bounty: '50億4600万ベリー', devilFruit: '', birthday: '5月13日', localImage: '' },
    { name: 'ボニー', imageKey: 'bonney', organization: 'ボニー海賊団', bounty: '3億2000万ベリー', devilFruit: 'アルダアルダの実', birthday: '9月1日', localImage: '' },
    { name: 'ベックマン', imageKey: 'beckman', organization: '赤髪海賊団', bounty: '', devilFruit: '', birthday: '', localImage: '' },
    { name: 'ラッキー', imageKey: 'lucky', organization: '赤髪海賊団', bounty: '', devilFruit: '', birthday: '', localImage: '' },
];

const dataPath = path.join(__dirname, '..', 'data', 'characters.json');
fs.writeFileSync(dataPath, JSON.stringify(characters, null, 2), 'utf-8');

console.log('数据已保存到 characters.json');
console.log(`总共 ${characters.length} 个角色`);
console.log(`有图片的角色: ${characters.filter(c => c.localImage).length} 个`);
console.log(`无图片的角色: ${characters.filter(c => !c.localImage).length} 个`);