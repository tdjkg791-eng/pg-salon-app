/**
 * Seed restaurant / fast-food / convenience store menu items.
 *
 * Run: npm run seed-restaurants
 *
 * - source='custom' so `npm run import-mext` won't touch these
 * - category='外食_<店名>' so each chain can be filtered individually
 * - Values mix official figures (supplied by the team) and widely-published
 *   approximate values. Non-verified rows carry
 *   pg_note='推定値 - 公式最新値で要確認'.
 * - Default pg_status='ng' (restaurant food is rarely Pg.-compatible).
 *   Explicit 'ok' / 'limited' exemptions: サラダチキン, 無糖コーヒー・お茶,
 *   プレーンサラダ (ドレッシング別), 刺身単品, 茹で卵 (limited 1日3個まで).
 * - Dedup: skips rows whose `name` already exists in `foods`.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

type Item = {
  store: string;
  menu: string;
  kana?: string;
  g: number;
  kcal: number;
  p: number;
  f: number;
  c: number;
  status?: 'ok' | 'limited'; // default: ng
  note?: string;
};

// ============================================================================
// MENU DATA
// Values marked VERIFIED come from the team's reference sheet; the rest are
// widely-published estimates flagged as 推定値 in pg_note.
// ============================================================================

const ITEMS: Item[] = [
  // ── すき家 ──
  { store: 'すき家', menu: '牛丼 ミニ', g: 220, kcal: 503, p: 15.7, f: 17.0, c: 69.0 },
  { store: 'すき家', menu: '牛丼 並盛', g: 320, kcal: 733, p: 22.9, f: 25.0, c: 100.6 },
  { store: 'すき家', menu: '牛丼 中盛', g: 370, kcal: 839, p: 28, f: 32, c: 108 },
  { store: 'すき家', menu: '牛丼 大盛', g: 430, kcal: 966, p: 30.1, f: 33.0, c: 132.6 },
  { store: 'すき家', menu: '牛丼 特盛', g: 510, kcal: 1068, p: 34, f: 39, c: 144 },
  { store: 'すき家', menu: '牛丼 メガ', g: 610, kcal: 1293, p: 43, f: 48, c: 163 },
  { store: 'すき家', menu: 'チーズ牛丼 並盛', g: 355, kcal: 874, p: 29.4, f: 34.5, c: 104.3 },
  { store: 'すき家', menu: 'おろしポン酢牛丼 並盛', g: 410, kcal: 763, p: 23, f: 26, c: 109 },
  { store: 'すき家', menu: 'ねぎ玉牛丼 並盛', g: 400, kcal: 846, p: 29, f: 31, c: 109 },
  { store: 'すき家', menu: 'キムチ牛丼 並盛', g: 370, kcal: 775, p: 24, f: 26, c: 110 },
  { store: 'すき家', menu: '牛丼ライト 並盛', g: 430, kcal: 488, p: 28.5, f: 23.0, c: 42.0 },
  { store: 'すき家', menu: '鮭定食', g: 360, kcal: 559, p: 23, f: 10, c: 96 },
  { store: 'すき家', menu: 'まぐろたたき丼', g: 310, kcal: 687, p: 29.0, f: 16.0, c: 103.0 },
  { store: 'すき家', menu: '豚生姜焼き丼 並盛', g: 350, kcal: 892, p: 26, f: 37, c: 112 },
  { store: 'すき家', menu: 'カレー 並盛', g: 490, kcal: 754, p: 20.5, f: 24.0, c: 114.3 },

  // ── 吉野家 ──
  { store: '吉野家', menu: '牛丼 小盛', g: 250, kcal: 513, p: 16.1, f: 15.9, c: 76.1 },
  { store: '吉野家', menu: '牛丼 並盛', g: 320, kcal: 635, p: 20.0, f: 20.4, c: 92.8 },
  { store: '吉野家', menu: '牛丼 アタマの大盛', g: 350, kcal: 710, p: 24, f: 26, c: 93 },
  { store: '吉野家', menu: '牛丼 大盛', g: 400, kcal: 846, p: 27.1, f: 27.2, c: 123.4 },
  { store: '吉野家', menu: '牛丼 特盛', g: 470, kcal: 1016, p: 34, f: 38, c: 125 },
  { store: '吉野家', menu: '牛丼 超特盛', g: 580, kcal: 1165, p: 38, f: 40, c: 159 },
  { store: '吉野家', menu: '豚丼 並盛', g: 320, kcal: 678, p: 19.9, f: 24.5, c: 92.3 },
  { store: '吉野家', menu: '牛すき鍋膳', g: 580, kcal: 872, p: 30, f: 35, c: 104 },
  { store: '吉野家', menu: '親子丼 並盛', g: 400, kcal: 637, p: 28, f: 15, c: 98 },
  { store: '吉野家', menu: 'ライザップ牛サラダ', g: 340, kcal: 430, p: 34, f: 20, c: 27, status: 'ok', note: 'ライザップ監修・高タンパク低糖質メニュー' },
  { store: '吉野家', menu: '鮭定食', g: 340, kcal: 482, p: 22, f: 8, c: 85 },
  { store: '吉野家', menu: 'から揚げ定食', g: 380, kcal: 830, p: 28, f: 30, c: 98 },

  // ── 松屋 ──
  { store: '松屋', menu: '牛めし 並盛', g: 330, kcal: 709, p: 20.0, f: 24.5, c: 102.0 },
  { store: '松屋', menu: '牛めし 大盛', g: 420, kcal: 812, p: 24, f: 24, c: 122 },
  { store: '松屋', menu: 'プレミアム牛めし 並盛', g: 320, kcal: 740, p: 21.0, f: 26.0, c: 103.0 },
  { store: '松屋', menu: '豚めし 並盛', g: 330, kcal: 621, p: 19, f: 20, c: 90 },
  { store: '松屋', menu: 'カルビ焼肉定食', g: 490, kcal: 900, p: 28, f: 33, c: 120 },
  { store: '松屋', menu: 'ビビンバ', g: 420, kcal: 684, p: 23, f: 17, c: 108 },
  { store: '松屋', menu: '焼肉定食', g: 480, kcal: 820, p: 30, f: 28, c: 108 },
  { store: '松屋', menu: '豚の生姜焼き定食', g: 460, kcal: 877, p: 28, f: 32, c: 112 },
  { store: '松屋', menu: 'オリジナルカレー', g: 480, kcal: 714, p: 12, f: 15, c: 130 },
  { store: '松屋', menu: 'ロカボチェンジ(牛めし)', g: 420, kcal: 498, p: 24, f: 26, c: 30, status: 'ok', note: 'ライスを豆腐・野菜に変更' },

  // ── 丸亀製麺 ──
  { store: '丸亀製麺', menu: 'かけうどん 並', g: 420, kcal: 290, p: 10.0, f: 2.0, c: 59.0 },
  { store: '丸亀製麺', menu: 'かけうどん 大', g: 560, kcal: 440, p: 14, f: 3, c: 85 },
  { store: '丸亀製麺', menu: 'ぶっかけうどん 並', g: 380, kcal: 356, p: 10.0, f: 3.0, c: 74.0 },
  { store: '丸亀製麺', menu: '釜玉うどん 並', g: 310, kcal: 415, p: 15.0, f: 7.0, c: 73.0 },
  { store: '丸亀製麺', menu: '肉うどん 並', g: 490, kcal: 586, p: 24.0, f: 18.0, c: 82.0 },
  { store: '丸亀製麺', menu: '明太釜玉うどん 並', g: 330, kcal: 530, p: 19, f: 7, c: 85 },
  { store: '丸亀製麺', menu: 'きつねうどん 並', g: 450, kcal: 460, p: 14, f: 10, c: 75 },
  { store: '丸亀製麺', menu: 'ざるうどん 並', g: 310, kcal: 285, p: 9.0, f: 2.0, c: 58.0 },
  { store: '丸亀製麺', menu: 'カレーうどん 並', g: 510, kcal: 540, p: 15, f: 11, c: 88 },
  { store: '丸亀製麺', menu: '鶏の天ぷら', g: 75, kcal: 230, p: 14, f: 15, c: 9 },

  // ── リンガーハット ──
  { store: 'リンガーハット', menu: '長崎ちゃんぽん', g: 670, kcal: 650, p: 28.0, f: 19.0, c: 86.0 },
  { store: 'リンガーハット', menu: '野菜たっぷりちゃんぽん', g: 750, kcal: 657, p: 27.0, f: 19.0, c: 86.0 },
  { store: 'リンガーハット', menu: '野菜たっぷり食べるスープ', g: 620, kcal: 400, p: 18, f: 12, c: 48 },
  { store: 'リンガーハット', menu: '長崎皿うどん', g: 470, kcal: 884, p: 23.0, f: 43.0, c: 99.0 },
  { store: 'リンガーハット', menu: '野菜たっぷり皿うどん', g: 560, kcal: 820, p: 26, f: 30, c: 100 },
  { store: 'リンガーハット', menu: '餃子 5個', g: 95, kcal: 220, p: 7, f: 12, c: 19 },
  { store: 'リンガーハット', menu: '長崎皿うどん 麺2倍', g: 570, kcal: 960, p: 26, f: 36, c: 125 },

  // ── 天下一品 ──
  { store: '天下一品', menu: 'こってりラーメン 並', g: 700, kcal: 957, p: 29, f: 44, c: 105 },
  { store: '天下一品', menu: 'あっさりラーメン 並', g: 700, kcal: 650, p: 23, f: 18, c: 95 },
  { store: '天下一品', menu: 'こってりラーメン 大', g: 900, kcal: 1170, p: 36, f: 55, c: 130 },
  { store: '天下一品', menu: '餃子 5個', g: 120, kcal: 340, p: 10, f: 18, c: 32 },
  { store: '天下一品', menu: 'チャーハン定食', g: 450, kcal: 880, p: 22, f: 30, c: 120 },
  { store: '天下一品', menu: '唐揚げ定食', g: 460, kcal: 980, p: 30, f: 42, c: 108 },

  // ── 幸楽苑 ──
  { store: '幸楽苑', menu: '中華そば', g: 520, kcal: 520, p: 16, f: 11, c: 85 },
  { store: '幸楽苑', menu: '野菜たっぷりタンメン', g: 620, kcal: 710, p: 22, f: 22, c: 95 },
  { store: '幸楽苑', menu: '味噌野菜ラーメン', g: 600, kcal: 720, p: 20, f: 24, c: 98 },
  { store: '幸楽苑', menu: '餃子 6個', g: 150, kcal: 320, p: 10, f: 16, c: 30 },
  { store: '幸楽苑', menu: 'チャーシュー麺', g: 550, kcal: 680, p: 26, f: 18, c: 95 },
  { store: '幸楽苑', menu: '塩野菜ラーメン', g: 600, kcal: 680, p: 18, f: 20, c: 92 },

  // ── マクドナルド ──
  { store: 'マクドナルド', menu: 'ハンバーガー', g: 104, kcal: 256, p: 13, f: 9, c: 30 },
  { store: 'マクドナルド', menu: 'チーズバーガー', g: 118, kcal: 310, p: 16, f: 13, c: 31 },
  { store: 'マクドナルド', menu: 'ダブルチーズバーガー', g: 169, kcal: 457, p: 26.5, f: 25.1, c: 31.8 },
  { store: 'マクドナルド', menu: 'ビッグマック', g: 217, kcal: 525, p: 26.0, f: 28.3, c: 41.8 },
  { store: 'マクドナルド', menu: 'てりやきマックバーガー', g: 161, kcal: 478, p: 16, f: 29, c: 38 },
  { store: 'マクドナルド', menu: 'フィレオフィッシュ', g: 140, kcal: 341, p: 14.6, f: 14.7, c: 37.2 },
  { store: 'マクドナルド', menu: 'エビフィレオ', g: 175, kcal: 395, p: 12, f: 17, c: 47 },
  { store: 'マクドナルド', menu: 'チキンフィレオ', g: 181, kcal: 465, p: 20, f: 22, c: 46 },
  { store: 'マクドナルド', menu: 'チキンマックナゲット 5ピース', g: 87, kcal: 270, p: 15.1, f: 17.2, c: 13.3 },
  { store: 'マクドナルド', menu: 'チキンマックナゲット 15ピース', g: 261, kcal: 810, p: 45, f: 51, c: 48 },
  { store: 'マクドナルド', menu: 'マックフライポテト S', g: 74, kcal: 225, p: 3, f: 11, c: 29 },
  { store: 'マクドナルド', menu: 'マックフライポテト M', g: 135, kcal: 410, p: 5.2, f: 21.5, c: 50.3 },
  { store: 'マクドナルド', menu: 'マックフライポテト L', g: 170, kcal: 517, p: 6.6, f: 27.1, c: 63.4 },
  { store: 'マクドナルド', menu: 'エッグマックマフィン', g: 138, kcal: 311, p: 19, f: 13, c: 28 },
  { store: 'マクドナルド', menu: 'ソーセージエッグマフィン', g: 170, kcal: 448, p: 21, f: 28, c: 28 },
  { store: 'マクドナルド', menu: 'ホットケーキ', g: 150, kcal: 318, p: 9, f: 4, c: 60 },
  { store: 'マクドナルド', menu: 'サイドサラダ', g: 60, kcal: 10, p: 1, f: 0, c: 2, status: 'ok', note: 'ドレッシング別計算' },
  { store: 'マクドナルド', menu: 'プレミアムローストコーヒー(ブラック)', g: 240, kcal: 8, p: 0, f: 0, c: 1, status: 'ok', note: '無糖ブラック' },

  // ── モスバーガー ──
  { store: 'モスバーガー', menu: 'モスバーガー', g: 210, kcal: 367, p: 15.9, f: 15.4, c: 40.8 },
  { store: 'モスバーガー', menu: 'モスチーズバーガー', g: 224, kcal: 409, p: 18.4, f: 18.9, c: 40.7 },
  { store: 'モスバーガー', menu: 'テリヤキバーガー', g: 160, kcal: 395, p: 15.1, f: 19.6, c: 38.2 },
  { store: 'モスバーガー', menu: 'テリヤキチキンバーガー', g: 185, kcal: 350, p: 17, f: 13, c: 39 },
  { store: 'モスバーガー', menu: 'フィッシュバーガー', g: 158, kcal: 339, p: 12, f: 13, c: 42 },
  { store: 'モスバーガー', menu: 'モス野菜バーガー', g: 225, kcal: 362, p: 13, f: 18, c: 38 },
  { store: 'モスバーガー', menu: '海老カツバーガー', g: 165, kcal: 398, p: 13, f: 18, c: 45 },
  { store: 'モスバーガー', menu: 'ライスバーガー海鮮かきあげ', g: 170, kcal: 395, p: 10, f: 12, c: 62 },
  { store: 'モスバーガー', menu: 'モスチキン', g: 82, kcal: 232, p: 15, f: 14, c: 10 },
  { store: 'モスバーガー', menu: 'オニポテ', g: 110, kcal: 314, p: 4, f: 16, c: 38 },
  { store: 'モスバーガー', menu: 'グリーンサラダ', g: 70, kcal: 14, p: 1, f: 0, c: 3, status: 'ok', note: 'ドレッシング別計算' },
  { store: 'モスバーガー', menu: 'オーガニックブレンドコーヒー', g: 195, kcal: 6, p: 0, f: 0, c: 1, status: 'ok', note: '無糖ブラック' },

  // ── サイゼリヤ ──
  { store: 'サイゼリヤ', menu: 'ミラノ風ドリア', g: 350, kcal: 521, p: 15.2, f: 25.0, c: 59.0 },
  { store: 'サイゼリヤ', menu: 'ハンバーグステーキ', g: 220, kcal: 463, p: 25.0, f: 34.0, c: 14.0 },
  { store: 'サイゼリヤ', menu: '辛味チキン', g: 120, kcal: 285, p: 20, f: 19, c: 7 },
  { store: 'サイゼリヤ', menu: 'ペペロンチーノ', g: 295, kcal: 567, p: 20.0, f: 15.0, c: 86.0 },
  { store: 'サイゼリヤ', menu: 'ミートソースボロネーゼ', g: 355, kcal: 533, p: 20, f: 18, c: 70 },
  { store: 'サイゼリヤ', menu: 'ボンゴレ', g: 335, kcal: 488, p: 19, f: 13, c: 73 },
  { store: 'サイゼリヤ', menu: 'シーフードパエリア', g: 370, kcal: 550, p: 18, f: 12, c: 92 },
  { store: 'サイゼリヤ', menu: 'シーザーサラダ', g: 220, kcal: 247, p: 10, f: 19, c: 11 },
  { store: 'サイゼリヤ', menu: '小エビのサラダ', g: 165, kcal: 102, p: 11, f: 3, c: 9 },
  { store: 'サイゼリヤ', menu: 'チキンとブロッコリーのサラダ', g: 200, kcal: 196, p: 17.0, f: 11.0, c: 5.0, status: 'ok', note: '高タンパク低糖質・ドレッシング別計算' },
  { store: 'サイゼリヤ', menu: 'コーンクリームスープ', g: 150, kcal: 100, p: 3, f: 4, c: 14 },
  { store: 'サイゼリヤ', menu: 'ポップコーンシュリンプ', g: 125, kcal: 305, p: 11, f: 15, c: 30 },
  { store: 'サイゼリヤ', menu: 'キャベツのペペロンチーノ', g: 230, kcal: 172, p: 3, f: 11, c: 14 },
  { store: 'サイゼリヤ', menu: 'ほうれん草のソテー', g: 140, kcal: 104, p: 2, f: 9, c: 3, status: 'ok', note: 'ソテー油少量・ほうれん草主体' },
  { store: 'サイゼリヤ', menu: 'ディアボラ風ハンバーグ', g: 285, kcal: 508, p: 24, f: 30, c: 22 },
  { store: 'サイゼリヤ', menu: 'イタリアンプリン', g: 90, kcal: 172, p: 3, f: 11, c: 16 },

  // ── ガスト ──
  { store: 'ガスト', menu: 'チーズinハンバーグ', g: 370, kcal: 730, p: 28, f: 45, c: 45 },
  { store: 'ガスト', menu: '熟成肉のハンバーグ', g: 340, kcal: 660, p: 25, f: 38, c: 42 },
  { store: 'ガスト', menu: '若鶏のグリル', g: 280, kcal: 490, p: 30, f: 24, c: 30 },
  { store: 'ガスト', menu: '日替わりランチ(平均)', g: 500, kcal: 720, p: 22, f: 26, c: 85 },
  { store: 'ガスト', menu: '大葉おろしの和風ハンバーグ', g: 340, kcal: 588, p: 24, f: 32, c: 40 },
  { store: 'ガスト', menu: 'シーザーサラダ', g: 210, kcal: 250, p: 8, f: 19, c: 12 },
  { store: 'ガスト', menu: '1日分の野菜のベジ塩タンメン', g: 650, kcal: 640, p: 22, f: 18, c: 92 },
  { store: 'ガスト', menu: 'ライス', g: 170, kcal: 286, p: 4, f: 0, c: 63 },
  { store: 'ガスト', menu: 'スープバー(コーンスープ)', g: 150, kcal: 90, p: 2, f: 3, c: 13 },
  { store: 'ガスト', menu: 'ブレンドコーヒー', g: 200, kcal: 6, p: 0, f: 0, c: 1, status: 'ok', note: '無糖ブラック' },

  // ── ジョイフル ──
  { store: 'ジョイフル', menu: 'ハンバーグ定食', g: 520, kcal: 820, p: 28, f: 36, c: 92 },
  { store: 'ジョイフル', menu: 'チキン南蛮定食', g: 530, kcal: 950, p: 34, f: 48, c: 88 },
  { store: 'ジョイフル', menu: '生姜焼き定食', g: 500, kcal: 820, p: 26, f: 32, c: 96 },
  { store: 'ジョイフル', menu: 'サーロインステーキ', g: 400, kcal: 780, p: 36, f: 40, c: 55 },
  { store: 'ジョイフル', menu: '唐揚げ定食', g: 480, kcal: 920, p: 30, f: 42, c: 95 },
  { store: 'ジョイフル', menu: '和風おろしハンバーグ', g: 350, kcal: 580, p: 22, f: 32, c: 25 },
  { store: 'ジョイフル', menu: 'シーザーサラダ', g: 180, kcal: 220, p: 7, f: 18, c: 9 },
  { store: 'ジョイフル', menu: 'ライス 小', g: 150, kcal: 252, p: 4, f: 0, c: 56 },

  // ── スシロー (1貫あたり) ──
  { store: 'スシロー', menu: 'まぐろ 1貫', g: 20, kcal: 40, p: 5.0, f: 0.3, c: 4.5 },
  { store: 'スシロー', menu: 'サーモン 1貫', g: 20, kcal: 48, p: 4.0, f: 2.0, c: 4.5 },
  { store: 'スシロー', menu: 'あぶりサーモン 1貫', g: 20, kcal: 52, p: 4.0, f: 2.5, c: 4.5 },
  { store: 'スシロー', menu: 'はまち 1貫', g: 20, kcal: 50, p: 4.0, f: 2.0, c: 4.5 },
  { store: 'スシロー', menu: 'えび 1貫', g: 20, kcal: 38, p: 5.0, f: 0.3, c: 4.5 },
  { store: 'スシロー', menu: 'いか 1貫', g: 20, kcal: 38, p: 4.0, f: 0.3, c: 4.5 },
  { store: 'スシロー', menu: 'たまご 1貫', g: 20, kcal: 50, p: 2.5, f: 1.5, c: 6.0 },
  { store: 'スシロー', menu: 'ネギトロ 1貫(軍艦)', g: 20, kcal: 55, p: 3.0, f: 2.5, c: 4.0 },
  { store: 'スシロー', menu: 'いくら 1貫(軍艦)', g: 25, kcal: 58, p: 5.0, f: 3.0, c: 3.0 },
  { store: 'スシロー', menu: 'うに 1貫(軍艦)', g: 25, kcal: 48, p: 3.0, f: 3.0, c: 3.0 },
  { store: 'スシロー', menu: 'かっぱ巻き 1本', g: 90, kcal: 130, p: 3, f: 0.5, c: 28 },
  { store: 'スシロー', menu: '茶碗蒸し', g: 120, kcal: 90, p: 7, f: 3, c: 6 },

  // ── くら寿司 (1貫あたり) ──
  { store: 'くら寿司', menu: 'まぐろ 1貫', g: 20, kcal: 40, p: 5.0, f: 0.3, c: 4.5 },
  { store: 'くら寿司', menu: 'サーモン 1貫', g: 20, kcal: 48, p: 4.0, f: 2.0, c: 4.5 },
  { store: 'くら寿司', menu: 'えび 1貫', g: 20, kcal: 38, p: 5.0, f: 0.3, c: 4.5 },
  { store: 'くら寿司', menu: 'はまち 1貫', g: 20, kcal: 50, p: 4.0, f: 2.0, c: 4.5 },
  { store: 'くら寿司', menu: 'たまご 1貫', g: 20, kcal: 50, p: 2.5, f: 1.5, c: 6.0 },
  { store: 'くら寿司', menu: 'えんがわ 1貫', g: 20, kcal: 50, p: 3.0, f: 2.5, c: 4.5 },
  { store: 'くら寿司', menu: 'いか 1貫', g: 20, kcal: 38, p: 4.0, f: 0.3, c: 4.5 },
  { store: 'くら寿司', menu: 'あなご 1貫', g: 25, kcal: 58, p: 4.5, f: 2.0, c: 5.0 },
  { store: 'くら寿司', menu: 'かっぱ巻き 1本', g: 90, kcal: 128, p: 3, f: 0.5, c: 27 },
  { store: 'くら寿司', menu: 'シャリカレー', g: 350, kcal: 530, p: 10, f: 16, c: 82 },

  // ── スターバックス ──
  { store: 'スターバックス', menu: 'ドリップコーヒー Short', g: 240, kcal: 10, p: 0.4, f: 0, c: 2.2, status: 'ok', note: '無糖ブラック' },
  { store: 'スターバックス', menu: 'ドリップコーヒー Tall', g: 350, kcal: 17, p: 1, f: 0, c: 3, status: 'ok', note: '無糖ブラック' },
  { store: 'スターバックス', menu: 'アメリカーノ Tall', g: 350, kcal: 15, p: 1, f: 0, c: 2, status: 'ok', note: '無糖ブラック' },
  { store: 'スターバックス', menu: 'カフェラテ Short', g: 240, kcal: 79, p: 4.1, f: 4.4, c: 5.6 },
  { store: 'スターバックス', menu: 'スターバックス ラテ Tall', g: 350, kcal: 187, p: 10, f: 10, c: 14 },
  { store: 'スターバックス', menu: 'ソイ ラテ Tall', g: 350, kcal: 155, p: 9, f: 6, c: 16 },
  { store: 'スターバックス', menu: 'カフェモカ Tall', g: 350, kcal: 280, p: 11, f: 14, c: 30 },
  { store: 'スターバックス', menu: 'キャラメルマキアート Tall', g: 350, kcal: 250, p: 10, f: 10, c: 30 },
  { store: 'スターバックス', menu: '抹茶ティーラテ Tall', g: 350, kcal: 218, p: 9, f: 7, c: 30 },
  { store: 'スターバックス', menu: 'キャラメル フラペチーノ Tall', g: 380, kcal: 282, p: 4.1, f: 10.8, c: 43.3 },
  { store: 'スターバックス', menu: 'コーヒー フラペチーノ Tall', g: 380, kcal: 200, p: 4, f: 3, c: 40 },
  { store: 'スターバックス', menu: 'スタバ ハム&マリボーチーズ', g: 130, kcal: 310, p: 13, f: 16, c: 28 },
  { store: 'スターバックス', menu: 'ベーコンエピ', g: 80, kcal: 220, p: 7, f: 10, c: 25 },
  { store: 'スターバックス', menu: 'アーモンドチョコレート', g: 55, kcal: 260, p: 6, f: 17, c: 22 },

  // ── ドトール ──
  { store: 'ドトール', menu: 'ブレンドコーヒー M', g: 180, kcal: 8, p: 0.5, f: 0, c: 2, status: 'ok', note: '無糖ブラック' },
  { store: 'ドトール', menu: 'カフェ・ラテ M', g: 180, kcal: 91, p: 5, f: 5, c: 7 },
  { store: 'ドトール', menu: 'アイスコーヒー M', g: 180, kcal: 6, p: 0, f: 0, c: 1, status: 'ok', note: '無糖ブラック' },
  { store: 'ドトール', menu: 'ミラノサンドA ハム&マスカルポーネ', g: 200, kcal: 414, p: 16, f: 19, c: 44 },
  { store: 'ドトール', menu: 'ミラノサンドB やわらかチキン', g: 210, kcal: 368, p: 20, f: 14, c: 42 },
  { store: 'ドトール', menu: 'ジャーマンドッグ', g: 110, kcal: 346, p: 10, f: 20, c: 30 },
  { store: 'ドトール', menu: 'ミックスサンド', g: 180, kcal: 350, p: 12, f: 17, c: 36 },
  { store: 'ドトール', menu: 'ツナサンド', g: 165, kcal: 340, p: 13, f: 15, c: 38 },

  // ── セブンイレブン ──
  { store: 'セブンイレブン', menu: 'サラダチキン プレーン', g: 110, kcal: 113, p: 24.1, f: 1.5, c: 0.2, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'セブンイレブン', menu: 'サラダチキン ハーブ', g: 110, kcal: 121, p: 24.3, f: 1.9, c: 0.8, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'セブンイレブン', menu: 'サラダチキン スモーク', g: 110, kcal: 129, p: 25.0, f: 2.5, c: 0.9, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'セブンイレブン', menu: '茹で卵', g: 55, kcal: 63, p: 6.2, f: 4.3, c: 0.2, status: 'limited', note: '1日3個まで' },
  { store: 'セブンイレブン', menu: 'おにぎり 紅鮭', g: 110, kcal: 177, p: 4, f: 1.5, c: 37 },
  { store: 'セブンイレブン', menu: 'おにぎり 梅', g: 110, kcal: 170, p: 3, f: 0.5, c: 38 },
  { store: 'セブンイレブン', menu: 'おにぎり ツナマヨ', g: 110, kcal: 230, p: 5, f: 9, c: 33 },
  { store: 'セブンイレブン', menu: 'おにぎり 明太子', g: 110, kcal: 175, p: 4, f: 0.6, c: 37 },
  { store: 'セブンイレブン', menu: 'ハムたまごサンド', g: 130, kcal: 320, p: 11, f: 18, c: 28 },
  { store: 'セブンイレブン', menu: 'ミックスサンド', g: 140, kcal: 340, p: 12, f: 18, c: 32 },
  { store: 'セブンイレブン', menu: '千切りキャベツ', g: 150, kcal: 35, p: 2, f: 0.2, c: 8, status: 'ok', note: 'ドレッシング別計算' },
  { store: 'セブンイレブン', menu: '蒸し鶏とミックスサラダ', g: 160, kcal: 85, p: 13, f: 2, c: 5, status: 'ok', note: 'ドレッシング別・高タンパク' },
  { store: 'セブンイレブン', menu: 'からあげ棒', g: 60, kcal: 175, p: 10, f: 11, c: 8 },

  // ── ローソン ──
  { store: 'ローソン', menu: 'ブランパン 2個入', g: 70, kcal: 140, p: 11.0, f: 5.0, c: 16.0 },
  { store: 'ローソン', menu: 'ブランブレッド', g: 80, kcal: 150, p: 10, f: 5, c: 14 },
  { store: 'ローソン', menu: 'グリルチキン(香ばしい炙り醤油)', g: 120, kcal: 158, p: 22, f: 4, c: 7, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'ローソン', menu: 'からあげクン レギュラー', g: 88, kcal: 230, p: 14.3, f: 13.5, c: 13.3 },
  { store: 'ローソン', menu: 'からあげクン レッド', g: 88, kcal: 230, p: 13, f: 14, c: 12 },
  { store: 'ローソン', menu: 'からあげクン 北海道チーズ', g: 90, kcal: 240, p: 14, f: 15, c: 13 },
  { store: 'ローソン', menu: 'サラダチキン(プレーン)', g: 115, kcal: 115, p: 25, f: 1, c: 0.5, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'ローソン', menu: 'おにぎり 鮭', g: 110, kcal: 178, p: 4, f: 1.5, c: 37 },
  { store: 'ローソン', menu: 'ミックスサンド', g: 140, kcal: 335, p: 11, f: 17, c: 34 },
  { store: 'ローソン', menu: '蒸し鶏のサラダ', g: 170, kcal: 88, p: 14, f: 2, c: 5, status: 'ok', note: 'ドレッシング別・高タンパク' },

  // ── ファミリーマート ──
  { store: 'ファミリーマート', menu: 'ファミチキ', g: 105, kcal: 244, p: 14.7, f: 14.5, c: 15.0 },
  { store: 'ファミリーマート', menu: 'スパイシーチキン', g: 90, kcal: 230, p: 13, f: 14, c: 12 },
  { store: 'ファミリーマート', menu: 'クリスピーチキン', g: 60, kcal: 165, p: 10, f: 10, c: 8 },
  { store: 'ファミリーマート', menu: 'サラダチキン プレーン', g: 110, kcal: 110, p: 24, f: 1, c: 0.5, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'ファミリーマート', menu: 'サラダチキン バジル', g: 110, kcal: 120, p: 24, f: 1.5, c: 1, status: 'ok', note: '高タンパク低脂質低糖質' },
  { store: 'ファミリーマート', menu: 'おにぎり 鮭', g: 110, kcal: 180, p: 4, f: 1.5, c: 38 },
  { store: 'ファミリーマート', menu: 'おにぎり 昆布', g: 110, kcal: 168, p: 3, f: 0.5, c: 36 },
  { store: 'ファミリーマート', menu: 'ハムたまごサンド', g: 130, kcal: 325, p: 12, f: 17, c: 30 },
  { store: 'ファミリーマート', menu: 'グリーンサラダ', g: 130, kcal: 28, p: 1, f: 0.2, c: 6, status: 'ok', note: 'ドレッシング別計算' },
  { store: 'ファミリーマート', menu: 'ライザップ サラダチキンバー', g: 60, kcal: 64, p: 13, f: 1, c: 0.5, status: 'ok', note: 'ライザップコラボ・高タンパク低糖質' },
];

// ============================================================================
// BUILD DB ROWS
// ============================================================================

type DbRow = {
  food_code: string | null;
  name: string;
  name_kana: string;
  category: string;
  serving_g: number;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  pg_status: 'ok' | 'ng' | 'limited';
  pg_note: string | null;
  fat_warning: boolean;
  carb_warning: boolean;
  source: 'mext' | 'custom';
};

function toDbRow(item: Item): DbRow {
  const status: 'ok' | 'ng' | 'limited' = item.status ?? 'ng';
  const note = item.note ?? '推定値 - 公式最新値で要確認';
  return {
    food_code: null,
    name: `${item.store} ${item.menu}`,
    name_kana: item.kana ?? '',
    category: `外食_${item.store}`,
    serving_g: item.g,
    calories_kcal: item.kcal,
    protein_g: item.p,
    fat_g: item.f,
    carb_g: item.c,
    pg_status: status,
    pg_note: note,
    fat_warning: item.f >= 10,
    carb_warning: item.c >= 30,
    source: 'custom',
  };
}

async function main() {
  const rows = ITEMS.map(toDbRow);
  const stores = new Set(ITEMS.map((i) => i.store));
  console.log(`Seeding ${rows.length} restaurant menu items across ${stores.size} chains...`);

  // Deduplicate by name against existing DB rows (chunked to avoid URL length limits)
  const names = rows.map((r) => r.name);
  const existingNames = new Set<string>();
  const SELECT_CHUNK = 50;
  for (let i = 0; i < names.length; i += SELECT_CHUNK) {
    const slice = names.slice(i, i + SELECT_CHUNK);
    const { data: existing, error: fetchErr } = await supabase
      .from('foods')
      .select('name')
      .in('name', slice);
    if (fetchErr) {
      console.error('Failed to fetch existing names:', fetchErr.message);
      process.exit(1);
    }
    for (const row of existing ?? []) existingNames.add(row.name);
  }
  const toInsert = rows.filter((r) => !existingNames.has(r.name));
  const skipped = rows.length - toInsert.length;

  if (skipped > 0) console.log(`Skipping ${skipped} already-existing items.`);
  if (toInsert.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error } = await supabase.from('foods').insert(chunk);
    if (error) {
      console.error(`Insert failed at chunk ${i}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  inserted ${inserted} / ${toInsert.length}`);
  }

  // Summary by store
  const byStore: Record<string, { total: number; ok: number; ng: number; limited: number }> = {};
  for (const item of ITEMS) {
    const key = item.store;
    if (!byStore[key]) byStore[key] = { total: 0, ok: 0, ng: 0, limited: 0 };
    byStore[key].total += 1;
    const s = item.status ?? 'ng';
    byStore[key][s] += 1;
  }
  console.log('\n=== Breakdown by store ===');
  for (const [store, s] of Object.entries(byStore)) {
    console.log(`  ${store}: ${s.total} (ok ${s.ok}, ng ${s.ng}, limited ${s.limited})`);
  }

  console.log(`\nDone. Inserted: ${inserted} / skipped: ${skipped} / total: ${rows.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
