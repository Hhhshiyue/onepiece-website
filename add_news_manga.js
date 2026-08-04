const fs = require('fs');
const path = require('path');

const NEWS = [
    { title: 'ONE PIECE 第1164話 予告', date: '2026/05/26', category: 'アニメ', image: '', link: 'https://one-piece.com/anime/80334/index.html', description: '次回予告: ロビンの過去が明らかに！' },
    { title: '新キャラクター「サウロ」追加', date: '2026/05/25', category: 'キャラクター', image: '', link: 'https://one-piece.com/character/saul/index.html', description: 'エッグヘッド編に登場する新キャラクター' },
    { title: 'ONE PIECE FILM RED 特典情報', date: '2026/05/24', category: '映画', image: '', link: 'https://one-piece.com/news/80330/index.html', description: '劇場版最新情報をお届け！' },
    { title: 'エッグヘッド編 新視聴者向けガイド', date: '2026/05/23', category: 'ストーリー', image: '', link: 'https://one-piece.com/story/egghead/guide.html', description: '新しい篇章への入門ガイド' },
    { title: '麦わらの一味 最新設定画公開', date: '2026/05/22', category: 'キャラクター', image: '', link: 'https://one-piece.com/news/80328/index.html', description: 'エッグヘッド編の衣装が公開！' },
    { title: 'ONE PIECE ゲーム新作発表', date: '2026/05/21', category: 'ゲーム', image: '', link: 'https://one-piece.com/news/80327/index.html', description: '新しいゲームが開発中！' },
    { title: 'アニメ1000話記念企画', date: '2026/05/20', category: 'アニメ', image: '', link: 'https://one-piece.com/news/80326/index.html', description: '1000話達成を記念して特番放送！' },
    { title: '尾田栄一郎先生 最新コメント', date: '2026/05/19', category: 'ニュース', image: '', link: 'https://one-piece.com/news/80325/index.html', description: '作者からのメッセージ' },
    { title: 'ONE PIECE 展 東京会場', date: '2026/05/18', category: 'イベント', image: '', link: 'https://one-piece.com/news/80324/index.html', description: '人気展が東京にて開催！' },
    { title: '悪魔の実 新種追加', date: '2026/05/17', category: '悪魔の実', image: '', link: 'https://one-piece.com/devil_fruit', description: '新たな悪魔の実が発見！' },
];

const MANGA_CHAPTERS = [
    { title: '第1139話 プランB', chapter: '1139', date: '2026/05/26', image: '', link: 'https://one-piece.com/manga/80334/index.html', description: '次回予告: 新たな計画！' },
    { title: '第1138話 エッグヘッドの秘密', chapter: '1138', date: '2026/05/19', image: '', link: 'https://one-piece.com/manga/80333/index.html', description: '島の秘密が明らかに！' },
    { title: '第1137話 ロビンの過去', chapter: '1137', date: '2026/05/12', image: '', link: 'https://one-piece.com/manga/80332/index.html', description: 'ロビンの過去が明らかに！' },
    { title: '第1136話 サウロの真実', chapter: '1136', date: '2026/05/05', image: '', link: 'https://one-piece.com/manga/80331/index.html', description: 'サウロの秘密が明らか！' },
    { title: '第1135話 未来の技術', chapter: '1135', date: '2026/04/28', image: '', link: 'https://one-piece.com/manga/80330/index.html', description: '未来島の技術が明らか！' },
    { title: '第1134話 麦わらの一味の新しい敵', chapter: '1134', date: '2026/04/21', image: '', link: 'https://one-piece.com/manga/80329/index.html', description: '新たな敵が現れる！' },
    { title: '第1133話 エッグヘッド潜入', chapter: '1133', date: '2026/04/14', image: '', link: 'https://one-piece.com/manga/80328/index.html', description: '麦わらの一味が島に潜入！' },
    { title: '第1132話 未来島エッグヘッド', chapter: '1132', date: '2026/04/07', image: '', link: 'https://one-piece.com/manga/80327/index.html', description: '新しい冒険の始まり！' },
];

const EVENTS = [
    { title: 'ONE PIECE DAY 2026', date: '2026/07/22', location: '東京', image: '', link: 'https://one-piece.com/event/opday2026', description: '年度最大のイベント！' },
    { title: 'ONE PIECE 展', date: '2026/06/01 - 2026/09/30', location: '東京・大阪・福岡', image: '', link: 'https://one-piece.com/event/exhibition', description: '人気展が全国を巡る！' },
    { title: 'アニメ1000話記念特番', date: '2026/05/26', location: 'テレビ放送', image: '', link: 'https://one-piece.com/event/special', description: '特別編をお見逃しなく！' },
];

function main() {
    const dataDir = path.join(__dirname, 'data');
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dataDir, 'news.json'), JSON.stringify(NEWS, null, 2), 'utf-8');
    console.log(`已保存 ${NEWS.length} 条新闻数据`);
    
    fs.writeFileSync(path.join(dataDir, 'manga_chapters.json'), JSON.stringify(MANGA_CHAPTERS, null, 2), 'utf-8');
    console.log(`已保存 ${MANGA_CHAPTERS.length} 话漫画数据`);
    
    fs.writeFileSync(path.join(dataDir, 'events.json'), JSON.stringify(EVENTS, null, 2), 'utf-8');
    console.log(`已保存 ${EVENTS.length} 个事件数据`);
}

main();