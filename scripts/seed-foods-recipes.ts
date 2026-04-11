/**
 * Seed home-cooking and popular restaurant dishes (recipe-name search).
 *
 * Run: npm run seed-recipes
 *
 * - source='custom', category='家庭料理' or '外食料理'
 * - PFC and kcal in the spec are per-1人前; converted to per-100g on insert
 *   so they match how mext/foods rows store macros.
 * - serving_units captures the natural portion (1人前 / 1個 / 1杯 / etc).
 * - Skips rows whose `name` already exists.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

type Status = 'ok' | 'ng' | 'limited';
type ServingUnit = { label: string; grams: number; default?: boolean };

type RecipeSpec = {
  name: string;
  kana: string;
  category: '家庭料理' | '外食料理';
  servingG: number;        // 1人前 grams
  kcal: number;            // 1人前 kcal
  p: number;               // 1人前 protein g
  f: number;               // 1人前 fat g
  c: number;               // 1人前 carb g
  status: Status;
  fatWarn?: boolean;
  carbWarn?: boolean;
  units: ServingUnit[];    // primary unit first; default:true is added automatically
  note?: string;
};

// Helper for the most common case: a single 1-人前 unit
const one = (label: string, grams: number, extras: ServingUnit[] = []): ServingUnit[] => [
  { label, grams, default: true },
  ...extras,
];

const SPECS: RecipeSpec[] = [
  // ============================================================
  // パスタ・洋食
  // ============================================================
  { name: 'スパゲッティ ナポリタン', kana: 'すぱげってぃ なぽりたん', category: '外食料理',
    servingG: 350, kcal: 360, p: 12, f: 11, c: 56, status: 'ng', carbWarn: true,
    units: one('1人前', 350) },
  { name: 'スパゲッティ ミートソース', kana: 'すぱげってぃ みーとそーす', category: '外食料理',
    servingG: 350, kcal: 540, p: 20, f: 18, c: 70, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: 'スパゲッティ カルボナーラ', kana: 'すぱげってぃ かるぼなーら', category: '外食料理',
    servingG: 350, kcal: 690, p: 25, f: 35, c: 65, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: 'スパゲッティ ペペロンチーノ', kana: 'すぱげってぃ ぺぺろんちーの', category: '外食料理',
    servingG: 320, kcal: 480, p: 15, f: 15, c: 70, status: 'ng', carbWarn: true,
    units: one('1人前', 320) },
  { name: 'スパゲッティ ボロネーゼ', kana: 'すぱげってぃ ぼろねーぜ', category: '外食料理',
    servingG: 350, kcal: 580, p: 22, f: 20, c: 70, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: 'スパゲッティ たらこ', kana: 'すぱげってぃ たらこ', category: '家庭料理',
    servingG: 320, kcal: 460, p: 18, f: 15, c: 60, status: 'ng', carbWarn: true,
    units: one('1人前', 320) },
  { name: 'スパゲッティ きのこ和風', kana: 'すぱげってぃ きのこわふう', category: '家庭料理',
    servingG: 320, kcal: 420, p: 14, f: 8, c: 70, status: 'ng', carbWarn: true,
    units: one('1人前', 320) },
  { name: 'マカロニグラタン', kana: 'まかろにぐらたん', category: '家庭料理',
    servingG: 300, kcal: 480, p: 20, f: 22, c: 50, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 300) },
  { name: 'ラザニア', kana: 'らざにあ', category: '外食料理',
    servingG: 300, kcal: 510, p: 22, f: 25, c: 50, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 300) },
  { name: 'ペンネアラビアータ', kana: 'ぺんねあらびあーた', category: '外食料理',
    servingG: 320, kcal: 450, p: 15, f: 12, c: 70, status: 'ng', carbWarn: true,
    units: one('1人前', 320) },
  { name: 'マルゲリータピザ 1切', kana: 'まるげりーたぴざ', category: '外食料理',
    servingG: 120, kcal: 280, p: 12, f: 10, c: 35, status: 'ng', carbWarn: true,
    units: [{ label: '1切', grams: 120, default: true }, { label: '2切', grams: 240 }, { label: '1枚(8切)', grams: 960 }] },
  { name: 'ピザトースト', kana: 'ぴざとーすと', category: '家庭料理',
    servingG: 120, kcal: 320, p: 15, f: 12, c: 38, status: 'ng', carbWarn: true,
    units: one('1枚', 120) },

  // ============================================================
  // ご飯もの・丼もの・和食
  // ============================================================
  { name: '親子丼', kana: 'おやこどん', category: '家庭料理',
    servingG: 400, kcal: 700, p: 30, f: 18, c: 100, status: 'ng', carbWarn: true,
    units: one('1杯', 400) },
  { name: 'カツ丼', kana: 'かつどん', category: '外食料理',
    servingG: 420, kcal: 850, p: 30, f: 30, c: 110, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 420) },
  { name: '天丼', kana: 'てんどん', category: '外食料理',
    servingG: 400, kcal: 800, p: 25, f: 22, c: 115, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 400) },
  { name: '海鮮丼', kana: 'かいせんどん', category: '外食料理',
    servingG: 400, kcal: 600, p: 30, f: 8, c: 100, status: 'ng', carbWarn: true,
    units: one('1杯', 400) },
  { name: 'マグロ丼', kana: 'まぐろどん', category: '外食料理',
    servingG: 400, kcal: 580, p: 32, f: 6, c: 100, status: 'ng', carbWarn: true,
    units: one('1杯', 400) },
  { name: 'うな丼', kana: 'うなどん', category: '外食料理',
    servingG: 400, kcal: 750, p: 28, f: 22, c: 100, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 400) },
  { name: '鉄火丼', kana: 'てっかどん', category: '外食料理',
    servingG: 400, kcal: 580, p: 30, f: 5, c: 100, status: 'ng', carbWarn: true,
    units: one('1杯', 400) },
  { name: '中華丼', kana: 'ちゅうかどん', category: '外食料理',
    servingG: 420, kcal: 720, p: 25, f: 22, c: 100, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 420) },
  { name: '麻婆豆腐丼', kana: 'まーぼーどうふどん', category: '家庭料理',
    servingG: 400, kcal: 700, p: 28, f: 25, c: 90, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 400) },
  { name: '三色丼', kana: 'さんしょくどん', category: '家庭料理',
    servingG: 400, kcal: 650, p: 28, f: 18, c: 95, status: 'ng', carbWarn: true,
    units: one('1杯', 400) },
  { name: 'そぼろ丼', kana: 'そぼろどん', category: '家庭料理',
    servingG: 400, kcal: 650, p: 25, f: 18, c: 90, status: 'ng', carbWarn: true,
    units: one('1杯', 400) },
  { name: 'ロコモコ', kana: 'ろこもこ', category: '外食料理',
    servingG: 420, kcal: 780, p: 28, f: 30, c: 90, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 420) },
  { name: 'オムライス', kana: 'おむらいす', category: '家庭料理',
    servingG: 400, kcal: 750, p: 22, f: 25, c: 100, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 400) },
  { name: 'チャーハン', kana: 'ちゃーはん', category: '家庭料理',
    servingG: 350, kcal: 680, p: 18, f: 20, c: 100, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: '焼き飯', kana: 'やきめし', category: '家庭料理',
    servingG: 350, kcal: 680, p: 18, f: 20, c: 100, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: 'カレーライス ビーフ', kana: 'かれーらいす びーふ', category: '家庭料理',
    servingG: 450, kcal: 780, p: 22, f: 25, c: 110, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 450) },
  { name: 'カレーライス チキン', kana: 'かれーらいす ちきん', category: '家庭料理',
    servingG: 450, kcal: 720, p: 25, f: 18, c: 110, status: 'ng', carbWarn: true,
    units: one('1人前', 450) },
  { name: 'カレーライス ポーク', kana: 'かれーらいす ぽーく', category: '家庭料理',
    servingG: 450, kcal: 800, p: 22, f: 28, c: 110, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 450) },
  { name: 'ハヤシライス', kana: 'はやしらいす', category: '家庭料理',
    servingG: 450, kcal: 720, p: 20, f: 22, c: 105, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 450) },
  { name: 'ドライカレー', kana: 'どらいかれー', category: '家庭料理',
    servingG: 400, kcal: 700, p: 22, f: 22, c: 100, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 400) },
  { name: 'ビビンバ', kana: 'びびんば', category: '外食料理',
    servingG: 420, kcal: 680, p: 25, f: 18, c: 100, status: 'ng', carbWarn: true,
    units: one('1杯', 420) },
  { name: '石焼ビビンバ', kana: 'いしやきびびんば', category: '外食料理',
    servingG: 450, kcal: 720, p: 28, f: 20, c: 100, status: 'ng', carbWarn: true,
    units: one('1杯', 450) },
  { name: 'お茶漬け 鮭', kana: 'おちゃづけ さけ', category: '家庭料理',
    servingG: 300, kcal: 230, p: 10, f: 2, c: 45, status: 'ng', carbWarn: true,
    units: one('1杯', 300) },
  { name: 'お茶漬け 梅', kana: 'おちゃづけ うめ', category: '家庭料理',
    servingG: 300, kcal: 200, p: 5, f: 1, c: 45, status: 'ng', carbWarn: true,
    units: one('1杯', 300) },
  { name: '雑炊', kana: 'ぞうすい', category: '家庭料理',
    servingG: 300, kcal: 220, p: 10, f: 3, c: 40, status: 'ng', carbWarn: true,
    units: one('1杯', 300) },
  { name: 'リゾット', kana: 'りぞっと', category: '外食料理',
    servingG: 350, kcal: 480, p: 18, f: 15, c: 65, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 350) },

  // ============================================================
  // おかず系（メイン料理）
  // ============================================================
  { name: 'ハンバーグ デミグラス', kana: 'はんばーぐ でみぐらす', category: '家庭料理',
    servingG: 150, kcal: 380, p: 22, f: 25, c: 12, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 150, default: true }, { label: '2個', grams: 300 }] },
  { name: 'ハンバーグ 和風おろし', kana: 'はんばーぐ わふうおろし', category: '家庭料理',
    servingG: 150, kcal: 320, p: 22, f: 20, c: 8, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 150, default: true }, { label: '2個', grams: 300 }] },
  { name: '煮込みハンバーグ', kana: 'にこみはんばーぐ', category: '家庭料理',
    servingG: 180, kcal: 420, p: 22, f: 28, c: 15, status: 'ng', fatWarn: true,
    units: one('1個', 180) },
  { name: '鶏の唐揚げ', kana: 'とりのからあげ', category: '家庭料理',
    servingG: 30, kcal: 75, p: 5, f: 4, c: 3, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 30, default: true }, { label: '3個', grams: 90 }, { label: '5個', grams: 150 }] },
  { name: '鶏の竜田揚げ', kana: 'とりのたつたあげ', category: '家庭料理',
    servingG: 30, kcal: 70, p: 5, f: 3, c: 3, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 30, default: true }, { label: '5個', grams: 150 }] },
  { name: '鶏むね肉のソテー', kana: 'とりむねにくのそてー', category: '家庭料理',
    servingG: 200, kcal: 280, p: 50, f: 8, c: 2, status: 'ok',
    units: one('1人前', 200) },
  { name: '鶏ささみのソテー', kana: 'とりささみのそてー', category: '家庭料理',
    servingG: 120, kcal: 130, p: 28, f: 1, c: 0, status: 'ok',
    units: one('1人前', 120) },
  { name: 'チキン南蛮', kana: 'ちきんなんばん', category: '外食料理',
    servingG: 200, kcal: 480, p: 25, f: 25, c: 30, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 200) },
  { name: '鶏もも肉の照り焼き', kana: 'とりももにくのてりやき', category: '家庭料理',
    servingG: 200, kcal: 380, p: 30, f: 18, c: 15, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '鶏ささみの梅しそ焼き', kana: 'とりささみのうめしそやき', category: '家庭料理',
    servingG: 120, kcal: 140, p: 28, f: 1, c: 2, status: 'ok',
    units: one('1人前', 120) },
  { name: '鶏ささみのチーズ焼き', kana: 'とりささみのちーずやき', category: '家庭料理',
    servingG: 150, kcal: 220, p: 30, f: 8, c: 2, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: '蒸し鶏', kana: 'むしどり', category: '家庭料理',
    servingG: 150, kcal: 200, p: 32, f: 5, c: 0, status: 'ok',
    units: one('1人前', 150) },
  { name: 'よだれ鶏', kana: 'よだれどり', category: '外食料理',
    servingG: 180, kcal: 280, p: 32, f: 12, c: 5, status: 'ng', fatWarn: true,
    units: one('1人前', 180) },
  { name: '鶏ハム', kana: 'とりはむ', category: '家庭料理',
    servingG: 100, kcal: 120, p: 22, f: 2, c: 1, status: 'ok',
    units: one('1人前', 100) },
  { name: 'サラダチキン 自家製', kana: 'さらだちきん じかせい', category: '家庭料理',
    servingG: 150, kcal: 170, p: 32, f: 2, c: 1, status: 'ok',
    units: one('1人前', 150) },
  { name: '豚の生姜焼き', kana: 'ぶたのしょうがやき', category: '家庭料理',
    servingG: 200, kcal: 380, p: 25, f: 22, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '豚カツ ロース', kana: 'とんかつ ろーす', category: '外食料理',
    servingG: 150, kcal: 480, p: 22, f: 30, c: 20, status: 'ng', fatWarn: true,
    units: one('1枚', 150) },
  { name: '豚カツ ヒレ', kana: 'とんかつ ひれ', category: '外食料理',
    servingG: 150, kcal: 380, p: 25, f: 18, c: 18, status: 'ng', fatWarn: true,
    units: one('1枚', 150) },
  { name: '豚しゃぶ', kana: 'ぶたしゃぶ', category: '家庭料理',
    servingG: 200, kcal: 320, p: 25, f: 20, c: 2, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '豚キムチ', kana: 'ぶたきむち', category: '家庭料理',
    servingG: 200, kcal: 320, p: 22, f: 18, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '酢豚', kana: 'すぶた', category: '外食料理',
    servingG: 250, kcal: 480, p: 20, f: 22, c: 45, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 250) },
  { name: '回鍋肉', kana: 'ほいこーろー', category: '外食料理',
    servingG: 200, kcal: 350, p: 18, f: 22, c: 18, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '麻婆豆腐', kana: 'まーぼーどうふ', category: '家庭料理',
    servingG: 250, kcal: 350, p: 20, f: 22, c: 15, status: 'ng', fatWarn: true,
    units: one('1人前', 250) },
  { name: '麻婆茄子', kana: 'まーぼーなす', category: '家庭料理',
    servingG: 250, kcal: 320, p: 12, f: 18, c: 25, status: 'ng', fatWarn: true,
    units: one('1人前', 250) },
  { name: 'エビチリ', kana: 'えびちり', category: '外食料理',
    servingG: 200, kcal: 280, p: 18, f: 12, c: 25, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: 'エビマヨ', kana: 'えびまよ', category: '外食料理',
    servingG: 200, kcal: 380, p: 18, f: 25, c: 15, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '餃子', kana: 'ぎょうざ', category: '家庭料理',
    servingG: 15, kcal: 35, p: 1.5, f: 2, c: 3, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 15, default: true }, { label: '5個', grams: 75 }, { label: '10個', grams: 150 }] },
  { name: '焼き餃子 5個', kana: 'やきぎょうざ', category: '外食料理',
    servingG: 80, kcal: 200, p: 8, f: 10, c: 20, status: 'ng', fatWarn: true,
    units: one('5個', 80) },
  { name: '水餃子 5個', kana: 'すいぎょうざ', category: '外食料理',
    servingG: 80, kcal: 180, p: 8, f: 8, c: 20, status: 'ng', fatWarn: true,
    units: one('5個', 80) },
  { name: '春巻き', kana: 'はるまき', category: '家庭料理',
    servingG: 40, kcal: 110, p: 3, f: 6, c: 12, status: 'ng', fatWarn: true,
    units: [{ label: '1本', grams: 40, default: true }, { label: '2本', grams: 80 }] },
  { name: '焼売', kana: 'しゅうまい', category: '家庭料理',
    servingG: 20, kcal: 50, p: 2, f: 2.5, c: 5, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 20, default: true }, { label: '5個', grams: 100 }] },
  { name: '肉団子', kana: 'にくだんご', category: '家庭料理',
    servingG: 25, kcal: 60, p: 3, f: 4, c: 3, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 25, default: true }, { label: '5個', grams: 125 }] },
  { name: '牛肉のたたき', kana: 'ぎゅうにくのたたき', category: '家庭料理',
    servingG: 100, kcal: 180, p: 22, f: 8, c: 2, status: 'ng', fatWarn: true,
    units: one('1人前', 100) },
  { name: '牛ステーキ サーロイン', kana: 'ぎゅうすてーき さーろいん', category: '外食料理',
    servingG: 200, kcal: 580, p: 40, f: 45, c: 2, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '牛ステーキ ヒレ', kana: 'ぎゅうすてーき ひれ', category: '外食料理',
    servingG: 200, kcal: 380, p: 45, f: 20, c: 2, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '焼肉 カルビ', kana: 'やきにく かるび', category: '外食料理',
    servingG: 150, kcal: 520, p: 22, f: 45, c: 5, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: '焼肉 ロース', kana: 'やきにく ろーす', category: '外食料理',
    servingG: 150, kcal: 380, p: 28, f: 25, c: 5, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: '焼肉 ハラミ', kana: 'やきにく はらみ', category: '外食料理',
    servingG: 150, kcal: 350, p: 28, f: 22, c: 5, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: '焼肉 タン', kana: 'やきにく たん', category: '外食料理',
    servingG: 100, kcal: 230, p: 15, f: 15, c: 2, status: 'ng', fatWarn: true,
    units: one('1人前', 100) },
  { name: '牛丼の具', kana: 'ぎゅうどんのぐ', category: '家庭料理',
    servingG: 120, kcal: 240, p: 12, f: 12, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 120) },

  // ============================================================
  // 魚料理
  // ============================================================
  { name: '鯖の塩焼き', kana: 'さばのしおやき', category: '家庭料理',
    servingG: 80, kcal: 200, p: 18, f: 12, c: 0, status: 'ng', fatWarn: true,
    units: one('1切', 80) },
  { name: '鯖の味噌煮', kana: 'さばのみそに', category: '家庭料理',
    servingG: 100, kcal: 250, p: 18, f: 14, c: 8, status: 'ng', fatWarn: true,
    units: one('1切', 100) },
  { name: '鮭の塩焼き', kana: 'さけのしおやき', category: '家庭料理',
    servingG: 80, kcal: 160, p: 18, f: 8, c: 0, status: 'ng',
    units: one('1切', 80) },
  { name: '鮭のムニエル', kana: 'さけのむにえる', category: '家庭料理',
    servingG: 100, kcal: 250, p: 20, f: 15, c: 5, status: 'ng', fatWarn: true,
    units: one('1切', 100) },
  { name: '鮭の味噌焼き', kana: 'さけのみそやき', category: '家庭料理',
    servingG: 80, kcal: 180, p: 18, f: 8, c: 5, status: 'ng',
    units: one('1切', 80) },
  { name: '鮭の南蛮漬け', kana: 'さけのなんばんづけ', category: '家庭料理',
    servingG: 150, kcal: 240, p: 20, f: 10, c: 18, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: 'ぶりの照り焼き', kana: 'ぶりのてりやき', category: '家庭料理',
    servingG: 100, kcal: 280, p: 20, f: 18, c: 8, status: 'ng', fatWarn: true,
    units: one('1切', 100) },
  { name: 'ぶり大根', kana: 'ぶりだいこん', category: '家庭料理',
    servingG: 200, kcal: 280, p: 20, f: 15, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: 'たらの煮付け', kana: 'たらのにつけ', category: '家庭料理',
    servingG: 100, kcal: 100, p: 18, f: 0.5, c: 5, status: 'ok',
    units: one('1切', 100) },
  { name: 'たらのちり鍋', kana: 'たらのちりなべ', category: '家庭料理',
    servingG: 300, kcal: 220, p: 30, f: 2, c: 15, status: 'ok',
    units: one('1人前', 300) },
  { name: '鯵の塩焼き', kana: 'あじのしおやき', category: '家庭料理',
    servingG: 100, kcal: 130, p: 22, f: 4, c: 0, status: 'ok',
    units: one('1尾', 100) },
  { name: '鯵のフライ', kana: 'あじのふらい', category: '家庭料理',
    servingG: 120, kcal: 280, p: 18, f: 18, c: 12, status: 'ng', fatWarn: true,
    units: one('1尾', 120) },
  { name: 'いわしの梅煮', kana: 'いわしのうめに', category: '家庭料理',
    servingG: 80, kcal: 180, p: 18, f: 10, c: 5, status: 'ng', fatWarn: true,
    units: one('1尾', 80) },
  { name: '秋刀魚の塩焼き', kana: 'さんまのしおやき', category: '家庭料理',
    servingG: 120, kcal: 320, p: 22, f: 25, c: 0, status: 'ng', fatWarn: true,
    units: one('1尾', 120) },
  { name: 'アジの南蛮漬け', kana: 'あじのなんばんづけ', category: '家庭料理',
    servingG: 150, kcal: 220, p: 18, f: 8, c: 18, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: 'カレイの煮付け', kana: 'かれいのにつけ', category: '家庭料理',
    servingG: 100, kcal: 130, p: 18, f: 2, c: 8, status: 'ok',
    units: one('1切', 100) },
  { name: 'カレイの唐揚げ', kana: 'かれいのからあげ', category: '家庭料理',
    servingG: 120, kcal: 220, p: 18, f: 12, c: 10, status: 'ng', fatWarn: true,
    units: one('1切', 120) },
  { name: '白身魚のフライ', kana: 'しろみざかなのふらい', category: '家庭料理',
    servingG: 120, kcal: 230, p: 15, f: 12, c: 15, status: 'ng', fatWarn: true,
    units: one('1切', 120) },
  { name: 'いか焼き', kana: 'いかやき', category: '家庭料理',
    servingG: 100, kcal: 90, p: 18, f: 1, c: 2, status: 'ok',
    units: one('1人前', 100) },
  { name: 'いかの塩辛', kana: 'いかのしおから', category: '家庭料理',
    servingG: 15, kcal: 18, p: 2, f: 0.5, c: 1, status: 'ok',
    units: [{ label: '大さじ1', grams: 15, default: true }, { label: '小さじ1', grams: 5 }] },
  { name: 'たこの唐揚げ', kana: 'たこのからあげ', category: '家庭料理',
    servingG: 100, kcal: 180, p: 15, f: 8, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 100) },
  { name: 'えびフライ', kana: 'えびふらい', category: '家庭料理',
    servingG: 30, kcal: 75, p: 4, f: 4, c: 5, status: 'ng', fatWarn: true,
    units: [{ label: '1本', grams: 30, default: true }, { label: '2本', grams: 60 }, { label: '3本', grams: 90 }] },
  { name: 'えびマヨ', kana: 'えびまよ', category: '家庭料理',
    servingG: 150, kcal: 320, p: 18, f: 22, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: 'かにクリームコロッケ', kana: 'かにくりーむころっけ', category: '家庭料理',
    servingG: 70, kcal: 180, p: 5, f: 12, c: 15, status: 'ng', fatWarn: true,
    units: [{ label: '1個', grams: 70, default: true }, { label: '2個', grams: 140 }] },
  { name: '刺身盛り合わせ', kana: 'さしみもりあわせ', category: '外食料理',
    servingG: 150, kcal: 180, p: 25, f: 5, c: 2, status: 'ok',
    units: one('1人前', 150) },

  // ============================================================
  // 卵料理
  // ============================================================
  { name: '卵焼き', kana: 'たまごやき', category: '家庭料理',
    servingG: 100, kcal: 150, p: 12, f: 10, c: 2, status: 'limited',
    units: one('1人前', 100) },
  { name: 'だし巻き卵', kana: 'だしまきたまご', category: '家庭料理',
    servingG: 120, kcal: 160, p: 14, f: 10, c: 2, status: 'limited',
    units: one('1人前', 120) },
  { name: '厚焼き卵', kana: 'あつやきたまご', category: '家庭料理',
    servingG: 120, kcal: 200, p: 12, f: 12, c: 8, status: 'limited', fatWarn: true,
    units: one('1人前', 120) },
  { name: 'オムレツ プレーン', kana: 'おむれつ ぷれーん', category: '家庭料理',
    servingG: 120, kcal: 200, p: 15, f: 15, c: 2, status: 'limited', fatWarn: true,
    units: one('1人前', 120) },
  { name: 'スパニッシュオムレツ', kana: 'すぱにっしゅおむれつ', category: '家庭料理',
    servingG: 200, kcal: 280, p: 15, f: 18, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: '茶碗蒸し', kana: 'ちゃわんむし', category: '家庭料理',
    servingG: 140, kcal: 80, p: 6, f: 3, c: 5, status: 'ok',
    units: one('1個', 140) },
  { name: 'ポーチドエッグ', kana: 'ぽーちどえっぐ', category: '家庭料理',
    servingG: 50, kcal: 75, p: 6, f: 5, c: 0, status: 'limited',
    units: [{ label: '1個', grams: 50, default: true }, { label: '2個', grams: 100 }] },
  { name: 'スクランブルエッグ', kana: 'すくらんぶるえっぐ', category: '家庭料理',
    servingG: 100, kcal: 180, p: 12, f: 14, c: 2, status: 'limited', fatWarn: true,
    units: one('1人前', 100) },
  { name: 'ハムエッグ', kana: 'はむえっぐ', category: '家庭料理',
    servingG: 120, kcal: 200, p: 14, f: 15, c: 2, status: 'limited', fatWarn: true,
    units: one('1人前', 120) },
  { name: 'ベーコンエッグ', kana: 'べーこんえっぐ', category: '家庭料理',
    servingG: 120, kcal: 230, p: 12, f: 18, c: 2, status: 'limited', fatWarn: true,
    units: one('1人前', 120) },
  { name: '目玉焼き', kana: 'めだまやき', category: '家庭料理',
    servingG: 55, kcal: 90, p: 6, f: 7, c: 0, status: 'limited',
    units: [{ label: '1個', grams: 55, default: true }, { label: '2個', grams: 110 }] },

  // ============================================================
  // 汁物・スープ
  // ============================================================
  { name: '味噌汁 わかめと豆腐', kana: 'みそしる わかめととうふ', category: '家庭料理',
    servingG: 180, kcal: 50, p: 4, f: 2, c: 4, status: 'ok',
    units: one('1杯', 180) },
  { name: '味噌汁 なめこ', kana: 'みそしる なめこ', category: '家庭料理',
    servingG: 180, kcal: 35, p: 3, f: 1, c: 4, status: 'ok',
    units: one('1杯', 180) },
  { name: '味噌汁 大根', kana: 'みそしる だいこん', category: '家庭料理',
    servingG: 180, kcal: 30, p: 2, f: 1, c: 4, status: 'ok',
    units: one('1杯', 180) },
  { name: '味噌汁 油揚げ', kana: 'みそしる あぶらあげ', category: '家庭料理',
    servingG: 180, kcal: 60, p: 4, f: 3, c: 4, status: 'ok',
    units: one('1杯', 180) },
  { name: '豚汁', kana: 'とんじる', category: '家庭料理',
    servingG: 200, kcal: 130, p: 8, f: 6, c: 12, status: 'ng', fatWarn: true,
    units: one('1杯', 200) },
  { name: 'けんちん汁', kana: 'けんちんじる', category: '家庭料理',
    servingG: 200, kcal: 100, p: 5, f: 4, c: 12, status: 'ok',
    units: one('1杯', 200) },
  { name: 'すまし汁', kana: 'すましじる', category: '家庭料理',
    servingG: 180, kcal: 25, p: 2, f: 0.5, c: 3, status: 'ok',
    units: one('1杯', 180) },
  { name: 'お吸い物', kana: 'おすいもの', category: '家庭料理',
    servingG: 180, kcal: 25, p: 2, f: 0.5, c: 3, status: 'ok',
    units: one('1杯', 180) },
  { name: 'コンソメスープ', kana: 'こんそめすーぷ', category: '家庭料理',
    servingG: 180, kcal: 15, p: 1, f: 0.2, c: 2, status: 'ok',
    units: one('1杯', 180) },
  { name: 'ミネストローネ', kana: 'みねすとろーね', category: '家庭料理',
    servingG: 200, kcal: 100, p: 3, f: 3, c: 15, status: 'ok',
    units: one('1杯', 200) },
  { name: 'クラムチャウダー', kana: 'くらむちゃうだー', category: '家庭料理',
    servingG: 200, kcal: 180, p: 8, f: 8, c: 20, status: 'ng', fatWarn: true,
    units: one('1杯', 200) },
  { name: 'コーンポタージュ', kana: 'こーんぽたーじゅ', category: '家庭料理',
    servingG: 200, kcal: 180, p: 5, f: 8, c: 25, status: 'ng', carbWarn: true,
    units: one('1杯', 200) },
  { name: 'ポトフ', kana: 'ぽとふ', category: '家庭料理',
    servingG: 300, kcal: 220, p: 15, f: 8, c: 20, status: 'ng',
    units: one('1人前', 300) },

  // ============================================================
  // サラダ
  // ============================================================
  { name: 'グリーンサラダ', kana: 'ぐりーんさらだ', category: '家庭料理',
    servingG: 100, kcal: 25, p: 1, f: 0.1, c: 5, status: 'ok',
    units: one('1人前', 100) },
  { name: 'シーザーサラダ', kana: 'しーざーさらだ', category: '外食料理',
    servingG: 150, kcal: 180, p: 5, f: 12, c: 12, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },
  { name: 'コブサラダ', kana: 'こぶさらだ', category: '外食料理',
    servingG: 200, kcal: 280, p: 15, f: 18, c: 10, status: 'ng', fatWarn: true,
    units: one('1人前', 200) },
  { name: 'ポテトサラダ', kana: 'ぽてとさらだ', category: '家庭料理',
    servingG: 100, kcal: 150, p: 3, f: 8, c: 18, status: 'ng', fatWarn: true,
    units: one('1人前', 100) },
  { name: 'マカロニサラダ', kana: 'まかろにさらだ', category: '家庭料理',
    servingG: 100, kcal: 180, p: 3, f: 10, c: 20, status: 'ng', fatWarn: true,
    units: one('1人前', 100) },
  { name: '春雨サラダ', kana: 'はるさめさらだ', category: '家庭料理',
    servingG: 100, kcal: 100, p: 3, f: 2, c: 18, status: 'ng', carbWarn: true,
    units: one('1人前', 100) },
  { name: '海藻サラダ', kana: 'かいそうさらだ', category: '家庭料理',
    servingG: 100, kcal: 30, p: 2, f: 0.5, c: 5, status: 'ok',
    units: one('1人前', 100) },
  { name: '大根サラダ', kana: 'だいこんさらだ', category: '家庭料理',
    servingG: 100, kcal: 25, p: 1, f: 0.1, c: 5, status: 'ok',
    units: one('1人前', 100) },
  { name: 'ツナサラダ', kana: 'つなさらだ', category: '家庭料理',
    servingG: 120, kcal: 150, p: 10, f: 8, c: 5, status: 'ng', fatWarn: true,
    units: one('1人前', 120) },
  { name: '鶏ささみのサラダ', kana: 'とりささみのさらだ', category: '家庭料理',
    servingG: 150, kcal: 130, p: 22, f: 2, c: 5, status: 'ok',
    units: one('1人前', 150) },
  { name: 'カプレーゼ', kana: 'かぷれーぜ', category: '外食料理',
    servingG: 150, kcal: 220, p: 12, f: 18, c: 5, status: 'ng', fatWarn: true,
    units: one('1人前', 150) },

  // ============================================================
  // その他人気料理
  // ============================================================
  { name: '焼きそば 野菜', kana: 'やきそば やさい', category: '家庭料理',
    servingG: 350, kcal: 520, p: 15, f: 18, c: 72, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: '焼きそば 肉', kana: 'やきそば にく', category: '家庭料理',
    servingG: 350, kcal: 580, p: 18, f: 22, c: 72, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 350) },
  { name: 'お好み焼き 豚玉', kana: 'おこのみやき ぶたたま', category: '家庭料理',
    servingG: 350, kcal: 580, p: 22, f: 25, c: 65, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1枚', 350) },
  { name: 'お好み焼き ミックス', kana: 'おこのみやき みっくす', category: '家庭料理',
    servingG: 380, kcal: 650, p: 25, f: 28, c: 70, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1枚', 380) },
  { name: 'たこ焼き 8個', kana: 'たこやき', category: '外食料理',
    servingG: 200, kcal: 380, p: 12, f: 15, c: 50, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('8個', 200) },
  { name: 'もんじゃ焼き', kana: 'もんじゃやき', category: '外食料理',
    servingG: 300, kcal: 350, p: 12, f: 12, c: 50, status: 'ng', carbWarn: true,
    units: one('1人前', 300) },
  { name: '焼きうどん', kana: 'やきうどん', category: '家庭料理',
    servingG: 350, kcal: 480, p: 15, f: 12, c: 75, status: 'ng', carbWarn: true,
    units: one('1人前', 350) },
  { name: '焼きビーフン', kana: 'やきびーふん', category: '家庭料理',
    servingG: 350, kcal: 480, p: 12, f: 15, c: 75, status: 'ng', carbWarn: true,
    units: one('1人前', 350) },
  { name: '中華麺 ラーメン 醤油', kana: 'らーめん しょうゆ', category: '外食料理',
    servingG: 600, kcal: 480, p: 22, f: 12, c: 75, status: 'ng', carbWarn: true,
    units: one('1杯', 600) },
  { name: '中華麺 ラーメン 味噌', kana: 'らーめん みそ', category: '外食料理',
    servingG: 600, kcal: 550, p: 22, f: 18, c: 75, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 600) },
  { name: '中華麺 ラーメン 塩', kana: 'らーめん しお', category: '外食料理',
    servingG: 600, kcal: 450, p: 20, f: 10, c: 75, status: 'ng', carbWarn: true,
    units: one('1杯', 600) },
  { name: '中華麺 ラーメン とんこつ', kana: 'らーめん とんこつ', category: '外食料理',
    servingG: 600, kcal: 600, p: 22, f: 22, c: 75, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1杯', 600) },
  { name: 'つけ麺', kana: 'つけめん', category: '外食料理',
    servingG: 400, kcal: 580, p: 25, f: 15, c: 90, status: 'ng', carbWarn: true,
    units: one('1人前', 400) },
  { name: '冷やし中華', kana: 'ひやしちゅうか', category: '家庭料理',
    servingG: 400, kcal: 480, p: 20, f: 12, c: 75, status: 'ng', carbWarn: true,
    units: one('1人前', 400) },
  { name: 'ざるそば', kana: 'ざるそば', category: '家庭料理',
    servingG: 300, kcal: 280, p: 12, f: 2, c: 58, status: 'ng', carbWarn: true,
    units: one('1人前', 300) },
  { name: '天ぷらそば', kana: 'てんぷらそば', category: '外食料理',
    servingG: 400, kcal: 480, p: 15, f: 15, c: 68, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 400) },
  { name: '月見うどん', kana: 'つきみうどん', category: '家庭料理',
    servingG: 400, kcal: 380, p: 15, f: 8, c: 65, status: 'ng', carbWarn: true,
    units: one('1人前', 400) },
  { name: 'きつねうどん', kana: 'きつねうどん', category: '家庭料理',
    servingG: 400, kcal: 380, p: 12, f: 8, c: 68, status: 'ng', carbWarn: true,
    units: one('1人前', 400) },
  { name: '天ぷらうどん', kana: 'てんぷらうどん', category: '外食料理',
    servingG: 400, kcal: 480, p: 15, f: 15, c: 68, status: 'ng', fatWarn: true, carbWarn: true,
    units: one('1人前', 400) },
];

// Convert per-serving spec → per-100g row that the foods table expects.
function toRow(s: RecipeSpec) {
  const ratio = 100 / s.servingG;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    food_code: null,
    name: s.name,
    name_kana: s.kana,
    category: s.category,
    serving_g: s.servingG,
    calories_kcal: round1(s.kcal * ratio),
    protein_g: round1(s.p * ratio),
    fat_g: round1(s.f * ratio),
    carb_g: round1(s.c * ratio),
    pg_status: s.status,
    pg_note: s.note ?? null,
    fat_warning: s.fatWarn ?? false,
    carb_warning: s.carbWarn ?? false,
    source: 'custom' as const,
    serving_units: s.units,
  };
}

async function main() {
  console.log(`Seeding ${SPECS.length} recipe foods...`);

  const names = SPECS.map((s) => s.name);
  const existingNames = new Set<string>();
  for (let i = 0; i < names.length; i += 30) {
    const chunk = names.slice(i, i + 30);
    const { data, error } = await supabase.from('foods').select('name').in('name', chunk);
    if (error) {
      console.error(`Failed to fetch existing names (chunk ${i}):`, error.message);
      process.exit(1);
    }
    for (const r of data ?? []) existingNames.add(r.name);
  }
  const toInsert = SPECS.filter((s) => !existingNames.has(s.name)).map(toRow);
  const skipped = SPECS.length - toInsert.length;

  if (skipped > 0) {
    console.log(`Skipping ${skipped} already-existing recipes`);
  }

  if (toInsert.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Insert in chunks of 100 to keep payload size reasonable.
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100);
    const { data, error } = await supabase.from('foods').insert(chunk).select('id, name');
    if (error) {
      console.error(`Insert chunk ${i}-${i + chunk.length} failed:`, error.message);
      process.exit(1);
    }
    inserted += data?.length ?? 0;
  }

  console.log(`\nDone. Inserted: ${inserted} / skipped: ${skipped} / total: ${SPECS.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
