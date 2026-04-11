/**
 * Seed serving_units onto existing foods by name pattern matching.
 *
 * Run: npm run seed-serving-units
 *
 * Requires migration 002_serving_units.sql to have been applied:
 *   ALTER TABLE foods ADD COLUMN serving_units jsonb ...
 *   ALTER TABLE foods ADD COLUMN common_use text
 *
 * Strategy:
 *   For each entry in UNIT_RULES, find foods whose `name` matches the
 *   ILIKE pattern (optionally constrained by source / category / pg_status
 *   to avoid collisions), and UPDATE their serving_units column.
 *
 * Match disambiguation:
 *   - `exact`: exact name match (source-qualified if needed)
 *   - `prefix`: name starts with pattern
 *   - `contains`: name contains pattern
 *   Default is `contains`.
 *
 * Safety:
 *   - Only updates; never inserts.
 *   - Skips rules that match 0 rows (logged).
 *   - Skips rules that match > 50 rows (logged — too broad).
 *   - Idempotent: re-running overwrites serving_units for matched rows.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

type ServingUnit = { label: string; grams: number; default?: boolean };

type Rule = {
  /** Human-readable id for logs. */
  label: string;
  /** ILIKE pattern without %% wrappers (unless `how` says exact). */
  pattern: string;
  /** Optional category filter (exact). */
  category?: string;
  /** Optional source filter. */
  source?: 'mext' | 'custom';
  /** Optional pg_status filter. */
  status?: 'ok' | 'ng' | 'limited';
  /** Match strategy. */
  how?: 'exact' | 'prefix' | 'contains';
  /** Serving units to set. */
  units: ServingUnit[];
  /** Optional common_use hint. */
  use?: string;
};

// Helper builders ------------------------------------------------------------
const packOnly = (g: number): ServingUnit[] => [
  { label: '1パック', grams: g, default: true },
];
const pieceOnly = (label: string, g: number, extras: ServingUnit[] = []): ServingUnit[] => [
  { label, grams: g, default: true },
  ...extras,
];
const bowl = (g: number): ServingUnit[] => [
  { label: '茶碗1杯', grams: g, default: true },
  { label: '大盛', grams: Math.round(g * 1.33) },
  { label: '小盛', grams: Math.round(g * 0.67) },
  { label: 'おにぎり1個', grams: 110 },
  { label: '丼1杯', grams: 300 },
];
const tspTbsp = (g: number): ServingUnit[] => [
  { label: '小さじ1', grams: g, default: true },
  { label: '大さじ1', grams: g * 3 },
];
const ml = (label: string, ml: number): ServingUnit => ({ label, grams: ml });

// ============================================================================
// RULES
// ============================================================================

const RULES: Rule[] = [
  // ========================================================================
  // 卵類
  // ========================================================================
  {
    label: '鶏卵 全卵 生',
    pattern: '鶏卵 全卵 生',
    source: 'mext',
    units: [
      { label: 'M玉1個', grams: 50, default: true },
      { label: 'L玉1個', grams: 60 },
      { label: 'S玉1個', grams: 40 },
      { label: '1パック10個', grams: 500 },
    ],
    use: '自炊の基本。1日1〜3個が目安',
  },
  {
    label: '鶏卵 全卵 ゆで',
    pattern: '鶏卵 全卵 ゆで',
    source: 'mext',
    units: [
      { label: 'M玉1個', grams: 50, default: true },
      { label: 'L玉1個', grams: 60 },
    ],
  },
  {
    label: '鶏卵 目玉焼き',
    pattern: '鶏卵 全卵 目玉焼き',
    source: 'mext',
    units: [{ label: '1個', grams: 50, default: true }],
  },
  {
    label: '鶏卵 いり',
    pattern: '鶏卵 全卵 いり',
    source: 'mext',
    units: [
      { label: '1個分', grams: 50, default: true },
      { label: '2個分', grams: 100 },
    ],
  },
  {
    label: '鶏卵 ポーチドエッグ',
    pattern: '鶏卵 全卵 ポーチドエッグ',
    source: 'mext',
    units: [{ label: '1個', grams: 50, default: true }],
  },
  {
    label: 'うずら卵 生',
    pattern: 'うずら卵 全卵 生',
    source: 'mext',
    units: [
      { label: '1個', grams: 10, default: true },
      { label: '5個', grams: 50 },
      { label: '10個', grams: 100 },
    ],
  },
  {
    label: 'うずら卵 水煮缶詰',
    pattern: 'うずら卵 水煮缶詰',
    source: 'mext',
    units: [
      { label: '1個', grams: 10, default: true },
      { label: '1缶', grams: 80 },
    ],
  },

  // ========================================================================
  // 肉類
  // ========================================================================
  {
    label: '鶏ささみ',
    pattern: 'ささみ',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1本', grams: 40, default: true },
      { label: '2本', grams: 80 },
      { label: '3本', grams: 120 },
      { label: '1パック', grams: 200 },
    ],
    use: '自炊の高タンパク定番。茹でてサラダにも',
  },
  {
    label: '鶏むね 皮なし',
    pattern: 'むね 皮なし',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1枚', grams: 200, default: true },
      { label: '半身', grams: 100 },
      { label: '1切れ', grams: 80 },
    ],
  },
  {
    label: '鶏むね 皮つき',
    pattern: 'むね 皮つき',
    category: '肉類',
    source: 'mext',
    units: [{ label: '1枚', grams: 250, default: true }],
  },
  {
    label: '鶏もも 皮なし',
    pattern: 'もも 皮なし',
    category: '肉類',
    source: 'mext',
    units: [{ label: '1枚', grams: 200, default: true }],
  },
  {
    label: '鶏もも 皮つき',
    pattern: 'もも 皮つき',
    category: '肉類',
    source: 'mext',
    units: [{ label: '1枚', grams: 250, default: true }],
  },
  {
    label: '豚ヒレ',
    pattern: 'ぶた ［大型種肉］ ヒレ 赤肉 生',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1枚', grams: 80, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '豚バラ',
    pattern: 'ぶた ［大型種肉］ ばら 脂身つき 生',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '薄切り1枚', grams: 20, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '豚ロース',
    pattern: 'ぶた ［大型種肉］ ロース 脂身つき 生',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '薄切り1枚', grams: 30, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '豚ひき肉',
    pattern: 'ぶた ［ひき肉］ 生',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '大さじ1', grams: 15, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '牛バラ',
    pattern: 'うし ［和牛肉］ ばら',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '薄切り1枚', grams: 20, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '牛もも',
    pattern: 'うし ［和牛肉］ もも',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '薄切り1枚', grams: 20, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '牛ひき肉',
    pattern: 'うし ［ひき肉］ 生',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '大さじ1', grams: 15, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: 'ベーコン',
    pattern: 'ベーコン',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1枚', grams: 20, default: true },
      { label: '1パック', grams: 80 },
    ],
  },
  {
    label: 'ロースハム',
    pattern: 'ロースハム',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1枚', grams: 10, default: true },
      { label: '1パック', grams: 80 },
    ],
  },
  {
    label: 'ウインナー',
    pattern: 'ウインナー',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1本', grams: 20, default: true },
      { label: '1パック', grams: 120 },
    ],
  },
  {
    label: '鶏レバー',
    pattern: 'にわとり ［副品目］ 肝臓',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1切れ', grams: 30, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '砂肝',
    pattern: 'にわとり ［副品目］ すなぎも',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1個', grams: 15, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: '鶏ハツ',
    pattern: 'にわとり ［副品目］ 心臓',
    category: '肉類',
    source: 'mext',
    units: [
      { label: '1個', grams: 5, default: true },
      { label: '1パック', grams: 100 },
    ],
  },
  {
    label: '合いびきハンバーグ',
    pattern: '洋風料理 ハンバーグステーキ類 合いびきハンバーグ',
    how: 'exact',
    source: 'mext',
    units: [
      { label: '1個', grams: 120, default: true },
      { label: '大1個', grams: 150 },
    ],
  },

  // ========================================================================
  // 魚介類
  // ========================================================================
  {
    label: '鮭 切身',
    pattern: 'しろさけ 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '1切', grams: 80, default: true },
      { label: '大1切', grams: 100 },
    ],
  },
  {
    label: 'ぶり 切身',
    pattern: 'ぶり 成魚 生',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1切', grams: 80, default: true }],
  },
  {
    label: 'たら 切身',
    pattern: 'まだら 生',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1切', grams: 80, default: true }],
  },
  {
    label: '鯖 切身',
    pattern: 'まさば 生',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1切', grams: 80, default: true }],
  },
  {
    label: 'ツナ缶 水煮 ライト',
    pattern: '（まぐろ類） 缶詰 水煮 フレーク ライト',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '1缶', grams: 70, default: true },
      { label: '汁切後', grams: 60 },
    ],
  },
  {
    label: 'ツナ缶 油漬 ライト',
    pattern: '（まぐろ類） 缶詰 油漬 フレーク ライト',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1缶', grams: 70, default: true }],
  },
  {
    label: 'さば 缶詰 水煮',
    pattern: '（さば類） 缶詰 水煮',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1缶', grams: 190, default: true }],
  },
  {
    label: 'さば 缶詰 味噌煮',
    pattern: '（さば類） 缶詰 みそ煮',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1缶', grams: 190, default: true }],
  },
  {
    label: 'まぐろ赤身 刺身',
    pattern: 'くろまぐろ 天然 赤身 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '刺身1切', grams: 15, default: true },
      { label: '5切', grams: 75 },
      { label: '1パック', grams: 100 },
    ],
  },
  {
    label: 'サーモン 刺身',
    pattern: 'たいせいようさけ 養殖 皮つき 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '刺身1切', grams: 15, default: true },
      { label: '5切', grams: 75 },
    ],
  },
  {
    label: 'いか 刺身',
    pattern: 'するめいか 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '刺身1切', grams: 10, default: true },
      { label: '1杯', grams: 200 },
    ],
  },
  {
    label: 'たこ',
    pattern: 'まだこ 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '刺身1切', grams: 10, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: 'ほたて',
    pattern: 'ほたてがい 生',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1個', grams: 20, default: true }],
  },
  {
    label: 'いくら',
    pattern: 'しろさけ イクラ',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 15, default: true }],
  },
  {
    label: 'うに',
    pattern: 'うに 生うに',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '1個', grams: 10, default: true },
      { label: '1パック', grams: 80 },
    ],
  },
  {
    label: 'たらこ',
    pattern: 'すけとうだら たらこ 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '1腹', grams: 50, default: true },
      { label: '1/2腹', grams: 25 },
    ],
  },
  {
    label: '明太子',
    pattern: 'からしめんたいこ',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '1腹', grams: 50, default: true }],
  },
  {
    label: 'しらす 生',
    pattern: 'しらす 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '大さじ1', grams: 10, default: true },
      { label: '1パック', grams: 80 },
    ],
  },
  {
    label: 'しらす干し',
    pattern: 'しらす干し',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 5, default: true }],
  },
  {
    label: 'ちりめんじゃこ',
    pattern: 'かたくちいわし 煮干し',
    category: '魚介類',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 5, default: true }],
  },
  {
    label: 'えび',
    pattern: 'バナメイえび 養殖 生',
    category: '魚介類',
    source: 'mext',
    units: [
      { label: '大1尾', grams: 20, default: true },
      { label: '中1尾', grams: 10 },
      { label: 'むき身1パック', grams: 100 },
    ],
  },

  // ========================================================================
  // 主食類
  // ========================================================================
  {
    label: 'ご飯 精白米',
    pattern: '［水稲めし］ 精白米 うるち米',
    category: '穀類',
    source: 'mext',
    units: bowl(150),
    use: '主食。1人前は150g（茶碗1杯）が目安',
  },
  {
    label: 'ご飯 玄米',
    pattern: '［水稲めし］ 玄米',
    category: '穀類',
    source: 'mext',
    units: bowl(150),
  },
  {
    label: '食パン',
    pattern: '食パン',
    category: '穀類',
    source: 'mext',
    units: [
      { label: '6枚切1枚', grams: 60, default: true },
      { label: '8枚切1枚', grams: 45 },
      { label: '4枚切1枚', grams: 90 },
      { label: '5枚切1枚', grams: 72 },
    ],
  },
  {
    label: 'フランスパン',
    pattern: 'フランスパン',
    source: 'mext',
    units: [{ label: '1切', grams: 30, default: true }],
  },
  {
    label: 'ロールパン',
    pattern: 'ロールパン',
    source: 'mext',
    units: [{ label: '1個', grams: 30, default: true }],
  },
  {
    label: 'クロワッサン',
    pattern: 'クロワッサン',
    source: 'mext',
    units: [{ label: '1個', grams: 40, default: true }],
  },
  {
    label: 'ベーグル',
    pattern: 'ベーグル',
    source: 'mext',
    units: [{ label: '1個', grams: 80, default: true }],
  },
  {
    label: 'うどん 茹で',
    pattern: 'うどん ゆで',
    source: 'mext',
    units: [
      { label: '1玉', grams: 200, default: true },
      { label: '1人前', grams: 250 },
    ],
  },
  {
    label: 'そば 茹で',
    pattern: 'そば ゆで',
    source: 'mext',
    units: [
      { label: '1玉', grams: 170, default: true },
      { label: '1人前', grams: 200 },
    ],
  },
  {
    label: '中華麺 茹で',
    pattern: '中華めん ゆで',
    source: 'mext',
    units: [
      { label: '1玉', grams: 120, default: true },
      { label: 'ラーメン1人前', grams: 200 },
    ],
  },
  {
    label: 'そうめん 乾',
    pattern: 'そうめん・ひやむぎ 乾',
    source: 'mext',
    units: [
      { label: '1束', grams: 50, default: true },
      { label: '1人前', grams: 100 },
    ],
  },
  {
    label: 'パスタ 乾',
    pattern: 'マカロニ・スパゲッティ 乾',
    source: 'mext',
    units: [
      { label: '1人前', grams: 80, default: true },
      { label: '大盛', grams: 120 },
    ],
  },
  {
    label: 'インスタントラーメン',
    pattern: '即席中華めん',
    source: 'mext',
    units: [{ label: '1袋', grams: 85, default: true }],
  },

  // ========================================================================
  // 野菜類
  // ========================================================================
  {
    label: 'キャベツ',
    pattern: 'キャベツ 結球葉 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1枚', grams: 50, default: true },
      { label: '1/4個', grams: 300 },
      { label: '1/2個', grams: 600 },
      { label: '千切り1人前', grams: 50 },
    ],
  },
  {
    label: 'レタス',
    pattern: 'レタス 土耕栽培 結球葉',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1枚', grams: 20, default: true },
      { label: '1/4個', grams: 80 },
    ],
  },
  {
    label: 'サニーレタス',
    pattern: 'サニーレタス',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1枚', grams: 15, default: true }],
  },
  {
    label: 'ほうれん草',
    pattern: 'ほうれんそう 葉 通年平均 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: 'おひたし1人前', grams: 50, default: true },
      { label: '1/2束', grams: 100 },
      { label: '1束', grams: 200 },
    ],
  },
  {
    label: '小松菜',
    pattern: 'こまつな 葉 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: 'おひたし1人前', grams: 50, default: true },
      { label: '1/2束', grams: 100 },
      { label: '1束', grams: 200 },
    ],
  },
  {
    label: '水菜',
    pattern: 'みずな 葉 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1束', grams: 200, default: true }],
  },
  {
    label: '春菊',
    pattern: 'しゅんぎく 葉 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1束', grams: 200, default: true }],
  },
  {
    label: 'にら',
    pattern: 'にら 葉 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1束', grams: 100, default: true }],
  },
  {
    label: 'もやし',
    pattern: 'りょくとうもやし 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1袋', grams: 200, default: true },
      { label: '1/2袋', grams: 100 },
    ],
  },
  {
    label: 'ブロッコリー',
    pattern: 'ブロッコリー 花序 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1房', grams: 15, default: true },
      { label: '5房', grams: 75 },
      { label: '1株', grams: 300 },
    ],
  },
  {
    label: 'カリフラワー',
    pattern: 'カリフラワー 花序 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1房', grams: 20, default: true },
      { label: '1株', grams: 300 },
    ],
  },
  {
    label: 'ピーマン',
    pattern: '青ピーマン 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1個', grams: 30, default: true },
      { label: '5個', grams: 150 },
    ],
  },
  {
    label: 'パプリカ',
    pattern: '赤ピーマン 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1個', grams: 150, default: true }],
  },
  {
    label: 'にんじん',
    pattern: 'にんじん 根 皮つき 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1本', grams: 150, default: true },
      { label: '1/2本', grams: 75 },
      { label: 'スライス1枚', grams: 5 },
    ],
  },
  {
    label: '大根',
    pattern: 'だいこん 根 皮つき 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '輪切り1枚', grams: 30, default: true },
      { label: '1/4本', grams: 250 },
      { label: '1本', grams: 1000 },
    ],
  },
  {
    label: 'かぶ',
    pattern: 'かぶ 根 皮つき 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1個', grams: 80, default: true }],
  },
  {
    label: '玉ねぎ',
    pattern: 'たまねぎ りん茎 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1/4個', grams: 50, default: true },
      { label: '1/2個', grams: 100 },
      { label: '1個', grams: 200 },
      { label: 'スライス1枚', grams: 10 },
    ],
  },
  {
    label: '長ねぎ',
    pattern: '根深ねぎ 葉 軟白 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '5cm', grams: 15, default: true },
      { label: '1本', grams: 100 },
    ],
  },
  {
    label: 'にんにく',
    pattern: 'にんにく りん茎 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1片', grams: 5, default: true },
      { label: '1個', grams: 30 },
    ],
  },
  {
    label: 'しょうが',
    pattern: 'しょうが 根茎 皮なし 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: 'ひとかけ', grams: 15, default: true }],
  },
  {
    label: 'きゅうり',
    pattern: 'きゅうり 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1本', grams: 100, default: true }],
  },
  {
    label: 'トマト',
    pattern: '赤色トマト 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1個', grams: 200, default: true }],
  },
  {
    label: 'ミニトマト',
    pattern: '赤色ミニトマト',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1個', grams: 15, default: true }],
  },
  {
    label: 'なす',
    pattern: 'なす 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1個', grams: 80, default: true }],
  },
  {
    label: 'ズッキーニ',
    pattern: 'ズッキーニ 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1本', grams: 200, default: true }],
  },
  {
    label: 'かぼちゃ',
    pattern: '西洋かぼちゃ 果実 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1切', grams: 30, default: true },
      { label: '1/4個', grams: 400 },
    ],
  },
  {
    label: 'さつまいも',
    pattern: 'さつまいも 塊根 皮つき 生',
    source: 'mext',
    units: [
      { label: '1/2本', grams: 150, default: true },
      { label: '1本', grams: 300 },
    ],
  },
  {
    label: 'じゃがいも',
    pattern: 'じゃがいも 塊茎 皮つき 生',
    source: 'mext',
    units: [{ label: '1個', grams: 150, default: true }],
  },
  {
    label: '里芋',
    pattern: 'さといも 球茎 生',
    source: 'mext',
    units: [{ label: '1個', grams: 50, default: true }],
  },
  {
    label: '山芋',
    pattern: 'ながいも 塊根 生',
    source: 'mext',
    units: [{ label: '5cm', grams: 80, default: true }],
  },
  {
    label: 'れんこん',
    pattern: 'れんこん 根茎 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1節', grams: 200, default: true }],
  },
  {
    label: 'ごぼう',
    pattern: 'ごぼう 根 生',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1本', grams: 200, default: true }],
  },
  {
    label: 'アスパラガス',
    pattern: 'アスパラガス 若茎 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1本', grams: 20, default: true },
      { label: '1束', grams: 100 },
    ],
  },
  {
    label: 'いんげん',
    pattern: 'さやいんげん 若ざや 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1本', grams: 8, default: true },
      { label: '1袋', grams: 100 },
    ],
  },
  {
    label: 'スナップエンドウ',
    pattern: 'スナップえんどう',
    category: '野菜類',
    source: 'mext',
    units: [{ label: '1個', grams: 10, default: true }],
  },
  {
    label: '枝豆',
    pattern: 'えだまめ 生',
    category: '野菜類',
    source: 'mext',
    units: [
      { label: '1人前', grams: 80, default: true },
      { label: 'さや1個', grams: 2 },
    ],
  },
  {
    label: 'とうもろこし',
    pattern: 'スイートコーン 未熟種子 生',
    source: 'mext',
    units: [{ label: '1本', grams: 200, default: true }],
  },

  // ========================================================================
  // きのこ類
  // ========================================================================
  {
    label: 'しいたけ 生',
    pattern: '生しいたけ 菌床栽培 生',
    source: 'mext',
    units: [{ label: '1個', grams: 15, default: true }],
  },
  {
    label: '干しいたけ',
    pattern: '乾しいたけ 乾',
    source: 'mext',
    units: [{ label: '1個', grams: 3, default: true }],
  },
  {
    label: 'しめじ',
    pattern: 'ぶなしめじ 生',
    source: 'mext',
    units: [{ label: '1パック', grams: 100, default: true }],
  },
  {
    label: 'えのき',
    pattern: 'えのきたけ 生',
    source: 'mext',
    units: [{ label: '1袋', grams: 200, default: true }],
  },
  {
    label: 'まいたけ',
    pattern: 'まいたけ 生',
    source: 'mext',
    units: [{ label: '1パック', grams: 100, default: true }],
  },
  {
    label: 'エリンギ',
    pattern: 'エリンギ 生',
    source: 'mext',
    units: [
      { label: '1本', grams: 30, default: true },
      { label: '1パック', grams: 100 },
    ],
  },
  {
    label: 'なめこ',
    pattern: 'なめこ 株採り 生',
    source: 'mext',
    units: [{ label: '1袋', grams: 100, default: true }],
  },
  {
    label: 'マッシュルーム',
    pattern: 'マッシュルーム 生',
    source: 'mext',
    units: [
      { label: '1個', grams: 10, default: true },
      { label: '1パック', grams: 100 },
    ],
  },

  // ========================================================================
  // 海藻類
  // ========================================================================
  {
    label: 'わかめ 生',
    pattern: 'わかめ 原藻 生',
    source: 'mext',
    units: [
      { label: '大さじ1', grams: 10, default: true },
      { label: '1パック', grams: 80 },
    ],
  },
  {
    label: 'わかめ 乾',
    pattern: 'わかめ 乾燥わかめ',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 2, default: true }],
  },
  {
    label: 'ひじき 乾',
    pattern: 'ほしひじき ステンレス',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 5, default: true }],
  },
  {
    label: 'もずく',
    pattern: 'おきなわもずく 塩蔵',
    source: 'mext',
    units: [{ label: '1パック', grams: 80, default: true }],
  },
  {
    label: '焼きのり',
    pattern: 'あまのり 焼きのり',
    source: 'mext',
    units: [
      { label: '全形1枚', grams: 3, default: true },
      { label: '8切1枚', grams: 0.4 },
    ],
  },
  {
    label: '味付けのり',
    pattern: 'あまのり 味付けのり',
    source: 'mext',
    units: [{ label: '1袋', grams: 2, default: true }],
  },
  {
    label: '昆布 素干し',
    pattern: 'まこんぶ 素干し',
    source: 'mext',
    units: [
      { label: 'ひとつまみ', grams: 3, default: true },
      { label: '5cm', grams: 5 },
    ],
  },

  // ========================================================================
  // 大豆製品
  // ========================================================================
  {
    label: '木綿豆腐',
    pattern: '木綿豆腐',
    category: '豆類',
    source: 'mext',
    units: [
      { label: '1/3丁', grams: 100, default: true },
      { label: '1/2丁', grams: 150 },
      { label: '1丁', grams: 300 },
    ],
  },
  {
    label: '絹ごし豆腐',
    pattern: '絹ごし豆腐',
    category: '豆類',
    source: 'mext',
    units: [
      { label: '1/3丁', grams: 100, default: true },
      { label: '1/2丁', grams: 150 },
      { label: '1丁', grams: 300 },
    ],
  },
  {
    label: '厚揚げ(生揚げ)',
    pattern: '［豆腐・油揚げ類］ 生揚げ',
    source: 'mext',
    units: [
      { label: '1/2枚', grams: 60, default: true },
      { label: '1枚', grams: 120 },
    ],
  },
  {
    label: '油揚げ 生',
    pattern: '油揚げ 生',
    category: '豆類',
    source: 'mext',
    units: [
      { label: '1/2枚', grams: 15, default: true },
      { label: '1枚', grams: 30 },
    ],
  },
  {
    label: '納豆',
    pattern: '糸引き納豆',
    source: 'mext',
    units: [
      { label: '1パック', grams: 45, default: true },
      { label: '小粒1パック', grams: 40 },
    ],
  },
  {
    label: '豆乳',
    pattern: '豆乳 豆乳',
    source: 'mext',
    units: [
      { label: 'コップ1杯', grams: 200, default: true },
      { label: 'パック1本', grams: 200 },
    ],
  },
  {
    label: 'おから',
    pattern: 'おから 生',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 10, default: true }],
  },
  {
    label: 'きな粉',
    pattern: 'きな粉 黄大豆 全粒大豆',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 7, default: true }],
  },

  // ========================================================================
  // 果物
  // ========================================================================
  {
    label: 'りんご',
    pattern: 'りんご 皮つき 生',
    source: 'mext',
    units: [
      { label: '1/2個', grams: 125, default: true },
      { label: '1個', grams: 250 },
    ],
  },
  {
    label: 'バナナ',
    pattern: 'バナナ 生',
    source: 'mext',
    units: [
      { label: '1本', grams: 100, default: true },
      { label: '大1本', grams: 120 },
    ],
  },
  {
    label: 'みかん',
    pattern: 'うんしゅうみかん じょうのう 普通 生',
    source: 'mext',
    units: [
      { label: '1個', grams: 80, default: true },
      { label: 'Lサイズ', grams: 100 },
    ],
  },
  {
    label: 'オレンジ',
    pattern: 'オレンジ バレンシア 米国産 砂じょう 生',
    source: 'mext',
    units: [{ label: '1個', grams: 200, default: true }],
  },
  {
    label: 'グレープフルーツ',
    pattern: 'グレープフルーツ',
    source: 'mext',
    units: [{ label: '1個', grams: 300, default: true }],
  },
  {
    label: 'いちご',
    pattern: 'いちご 生',
    source: 'mext',
    units: [
      { label: '5個', grams: 75, default: true },
      { label: '1個', grams: 15 },
      { label: '1パック', grams: 250 },
    ],
  },
  {
    label: 'ぶどう',
    pattern: 'ぶどう 皮なし 生',
    source: 'mext',
    units: [
      { label: '1粒', grams: 8, default: true },
      { label: '1房', grams: 300 },
    ],
  },
  {
    label: '桃',
    pattern: 'もも 白肉種 生',
    source: 'mext',
    units: [{ label: '1個', grams: 200, default: true }],
  },
  {
    label: '梨',
    pattern: '日本なし 生',
    source: 'mext',
    units: [{ label: '1個', grams: 300, default: true }],
  },
  {
    label: 'キウイ',
    pattern: 'キウイフルーツ 緑肉種 生',
    source: 'mext',
    units: [{ label: '1個', grams: 80, default: true }],
  },
  {
    label: 'メロン',
    pattern: 'メロン 温室メロン 生',
    source: 'mext',
    units: [{ label: '1切', grams: 100, default: true }],
  },
  {
    label: 'すいか',
    pattern: 'すいか 赤肉種 生',
    source: 'mext',
    units: [{ label: '1切', grams: 200, default: true }],
  },
  {
    label: 'パイナップル',
    pattern: 'パインアップル 生',
    source: 'mext',
    units: [{ label: '1切', grams: 80, default: true }],
  },
  {
    label: '柿',
    pattern: 'かき 甘がき 生',
    source: 'mext',
    units: [{ label: '1個', grams: 200, default: true }],
  },

  // ========================================================================
  // 乳製品
  // ========================================================================
  {
    label: '牛乳',
    pattern: '普通牛乳',
    source: 'mext',
    units: [
      { label: 'コップ1杯', grams: 200, default: true },
      { label: 'パック1本', grams: 200 },
      { label: '1L', grams: 1000 },
    ],
  },
  {
    label: 'ヨーグルト プレーン',
    pattern: 'ヨーグルト 全脂無糖',
    source: 'mext',
    units: [
      { label: '1個', grams: 100, default: true },
      { label: '大1パック', grams: 400 },
      { label: 'スプーン1杯', grams: 15 },
    ],
  },
  {
    label: 'ヨーグルト 加糖',
    pattern: 'ヨーグルト 脱脂加糖',
    source: 'mext',
    units: [{ label: '1個', grams: 80, default: true }],
  },
  {
    label: 'プロセスチーズ',
    pattern: 'プロセスチーズ',
    source: 'mext',
    units: [{ label: 'スライス1枚', grams: 18, default: true }],
  },
  {
    label: 'パルメザン',
    pattern: 'パルメザン',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 8, default: true }],
  },
  {
    label: 'カマンベール',
    pattern: 'カマンベール',
    source: 'mext',
    units: [
      { label: '1切れ', grams: 17, default: true },
      { label: '1個', grams: 100 },
    ],
  },
  {
    label: 'モッツァレラ',
    pattern: 'モッツァレラ',
    source: 'mext',
    units: [{ label: '1個', grams: 100, default: true }],
  },
  {
    label: 'クリームチーズ',
    pattern: 'クリーム',
    category: '乳類',
    source: 'mext',
    units: [{ label: '大さじ1', grams: 15, default: true }],
  },
  {
    label: '生クリーム',
    pattern: 'クリーム 乳脂肪',
    source: 'mext',
    units: [
      { label: '大さじ1', grams: 15, default: true },
      { label: '1パック', grams: 200 },
    ],
  },
  {
    label: 'バター',
    pattern: '有塩バター',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 4, default: true },
      { label: '大さじ1', grams: 12 },
      { label: '1切れ', grams: 10 },
    ],
  },
  {
    label: 'マーガリン',
    pattern: 'マーガリン 家庭用',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 4, default: true },
      { label: '大さじ1', grams: 12 },
    ],
  },

  // ========================================================================
  // 調味料
  // ========================================================================
  {
    label: '砂糖',
    pattern: '上白糖',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 3, default: true },
      { label: '大さじ1', grams: 9 },
    ],
  },
  {
    label: '塩',
    pattern: '食塩',
    source: 'mext',
    units: [
      { label: 'ひとつまみ', grams: 1, default: true },
      { label: '小さじ1', grams: 6 },
      { label: '大さじ1', grams: 18 },
    ],
  },
  {
    label: 'しょうゆ',
    pattern: 'こいくちしょうゆ',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 6, default: true },
      { label: '大さじ1', grams: 18 },
    ],
  },
  {
    label: '味噌',
    pattern: '米みそ 淡色辛みそ',
    source: 'mext',
    units: [
      { label: '1人前', grams: 15, default: true },
      { label: '小さじ1', grams: 6 },
      { label: '大さじ1', grams: 18 },
    ],
  },
  {
    label: 'みりん',
    pattern: '本みりん',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 6, default: true },
      { label: '大さじ1', grams: 18 },
    ],
  },
  {
    label: '料理酒',
    pattern: '清酒 普通酒',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 5, default: true },
      { label: '大さじ1', grams: 15 },
    ],
  },
  {
    label: '酢',
    pattern: '穀物酢',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 5, default: true },
      { label: '大さじ1', grams: 15 },
    ],
  },
  {
    label: 'ケチャップ',
    pattern: 'トマトケチャップ',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 5, default: true },
      { label: '大さじ1', grams: 15 },
    ],
  },
  {
    label: 'マヨネーズ',
    pattern: 'マヨネーズ 全卵型',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 4, default: true },
      { label: '大さじ1', grams: 12 },
    ],
  },
  {
    label: 'オリーブオイル',
    pattern: 'オリーブ油',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 4, default: true },
      { label: '大さじ1', grams: 12 },
    ],
  },
  {
    label: 'サラダ油',
    pattern: '調合油',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 4, default: true },
      { label: '大さじ1', grams: 12 },
    ],
  },
  {
    label: 'ごま油',
    pattern: 'ごま油',
    source: 'mext',
    units: [
      { label: '小さじ1', grams: 4, default: true },
      { label: '大さじ1', grams: 12 },
    ],
  },

  // ========================================================================
  // コンビニ食品 (custom)
  // ========================================================================
  // セブンイレブン
  { label: 'セブン サラダチキン プレーン', pattern: 'セブンイレブン サラダチキン プレーン', how: 'exact', source: 'custom', units: packOnly(110) },
  { label: 'セブン サラダチキン ハーブ', pattern: 'セブンイレブン サラダチキン ハーブ', how: 'exact', source: 'custom', units: packOnly(110) },
  { label: 'セブン サラダチキン スモーク', pattern: 'セブンイレブン サラダチキン スモーク', how: 'exact', source: 'custom', units: packOnly(110) },
  { label: 'セブン 茹で卵', pattern: 'セブンイレブン 茹で卵', how: 'exact', source: 'custom', units: pieceOnly('1個', 55) },
  { label: 'セブン おにぎり 紅鮭', pattern: 'セブンイレブン おにぎり 紅鮭', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'セブン おにぎり 梅', pattern: 'セブンイレブン おにぎり 梅', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'セブン おにぎり ツナマヨ', pattern: 'セブンイレブン おにぎり ツナマヨ', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'セブン おにぎり 明太子', pattern: 'セブンイレブン おにぎり 明太子', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'セブン ハムたまごサンド', pattern: 'セブンイレブン ハムたまごサンド', how: 'exact', source: 'custom', units: pieceOnly('1パック', 130) },
  { label: 'セブン ミックスサンド', pattern: 'セブンイレブン ミックスサンド', how: 'exact', source: 'custom', units: pieceOnly('1パック', 140) },
  { label: 'セブン 千切りキャベツ', pattern: 'セブンイレブン 千切りキャベツ', how: 'exact', source: 'custom', units: pieceOnly('1パック', 150) },
  { label: 'セブン 蒸し鶏とミックスサラダ', pattern: 'セブンイレブン 蒸し鶏とミックスサラダ', how: 'exact', source: 'custom', units: pieceOnly('1パック', 160) },
  { label: 'セブン からあげ棒', pattern: 'セブンイレブン からあげ棒', how: 'exact', source: 'custom', units: pieceOnly('1本', 60) },

  // ローソン
  { label: 'ローソン ブランパン', pattern: 'ローソン ブランパン 2個入', how: 'exact', source: 'custom', units: [
    { label: '1個', grams: 35, default: true },
    { label: '2個入1袋', grams: 70 },
  ] },
  { label: 'ローソン ブランブレッド', pattern: 'ローソン ブランブレッド', how: 'exact', source: 'custom', units: pieceOnly('1枚', 40) },
  { label: 'ローソン グリルチキン', pattern: 'ローソン グリルチキン(香ばしい炙り醤油)', how: 'exact', source: 'custom', units: packOnly(120) },
  { label: 'ローソン からあげクン', pattern: 'ローソン からあげクン レギュラー', how: 'exact', source: 'custom', units: [
    { label: '5個', grams: 75, default: true },
    { label: '1個', grams: 15 },
  ] },
  { label: 'ローソン からあげクン レッド', pattern: 'ローソン からあげクン レッド', how: 'exact', source: 'custom', units: pieceOnly('5個', 75) },
  { label: 'ローソン からあげクン チーズ', pattern: 'ローソン からあげクン 北海道チーズ', how: 'exact', source: 'custom', units: pieceOnly('5個', 75) },
  { label: 'ローソン サラダチキン', pattern: 'ローソン サラダチキン(プレーン)', how: 'exact', source: 'custom', units: packOnly(115) },
  { label: 'ローソン おにぎり 鮭', pattern: 'ローソン おにぎり 鮭', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'ローソン ミックスサンド', pattern: 'ローソン ミックスサンド', how: 'exact', source: 'custom', units: pieceOnly('1パック', 140) },
  { label: 'ローソン 蒸し鶏のサラダ', pattern: 'ローソン 蒸し鶏のサラダ', how: 'exact', source: 'custom', units: pieceOnly('1パック', 170) },

  // ファミリーマート
  { label: 'ファミマ ファミチキ', pattern: 'ファミリーマート ファミチキ', how: 'exact', source: 'custom', units: pieceOnly('1個', 105) },
  { label: 'ファミマ スパイシーチキン', pattern: 'ファミリーマート スパイシーチキン', how: 'exact', source: 'custom', units: pieceOnly('1個', 90) },
  { label: 'ファミマ クリスピーチキン', pattern: 'ファミリーマート クリスピーチキン', how: 'exact', source: 'custom', units: pieceOnly('1個', 60) },
  { label: 'ファミマ サラダチキン プレーン', pattern: 'ファミリーマート サラダチキン プレーン', how: 'exact', source: 'custom', units: packOnly(110) },
  { label: 'ファミマ サラダチキン バジル', pattern: 'ファミリーマート サラダチキン バジル', how: 'exact', source: 'custom', units: packOnly(110) },
  { label: 'ファミマ おにぎり 鮭', pattern: 'ファミリーマート おにぎり 鮭', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'ファミマ おにぎり 昆布', pattern: 'ファミリーマート おにぎり 昆布', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },
  { label: 'ファミマ ハムたまごサンド', pattern: 'ファミリーマート ハムたまごサンド', how: 'exact', source: 'custom', units: pieceOnly('1パック', 130) },
  { label: 'ファミマ グリーンサラダ', pattern: 'ファミリーマート グリーンサラダ', how: 'exact', source: 'custom', units: pieceOnly('1パック', 130) },
  { label: 'ファミマ ライザップ サラダチキンバー', pattern: 'ファミリーマート ライザップ サラダチキンバー', how: 'exact', source: 'custom', units: pieceOnly('1本', 60) },

  // ========================================================================
  // マクドナルド
  // ========================================================================
  { label: 'マック ハンバーガー', pattern: 'マクドナルド ハンバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 104) },
  { label: 'マック チーズバーガー', pattern: 'マクドナルド チーズバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 118) },
  { label: 'マック ダブルチーズバーガー', pattern: 'マクドナルド ダブルチーズバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 169) },
  { label: 'マック ビッグマック', pattern: 'マクドナルド ビッグマック', how: 'exact', source: 'custom', units: pieceOnly('1個', 217) },
  { label: 'マック てりやきマックバーガー', pattern: 'マクドナルド てりやきマックバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 161) },
  { label: 'マック フィレオフィッシュ', pattern: 'マクドナルド フィレオフィッシュ', how: 'exact', source: 'custom', units: pieceOnly('1個', 140) },
  { label: 'マック エビフィレオ', pattern: 'マクドナルド エビフィレオ', how: 'exact', source: 'custom', units: pieceOnly('1個', 175) },
  { label: 'マック チキンフィレオ', pattern: 'マクドナルド チキンフィレオ', how: 'exact', source: 'custom', units: pieceOnly('1個', 181) },
  { label: 'マック ナゲット5P', pattern: 'マクドナルド チキンマックナゲット 5ピース', how: 'exact', source: 'custom', units: pieceOnly('5ピース', 87) },
  { label: 'マック ナゲット15P', pattern: 'マクドナルド チキンマックナゲット 15ピース', how: 'exact', source: 'custom', units: pieceOnly('15ピース', 261) },
  { label: 'マック ポテトS', pattern: 'マクドナルド マックフライポテト S', how: 'exact', source: 'custom', units: pieceOnly('S', 74) },
  { label: 'マック ポテトM', pattern: 'マクドナルド マックフライポテト M', how: 'exact', source: 'custom', units: pieceOnly('M', 135) },
  { label: 'マック ポテトL', pattern: 'マクドナルド マックフライポテト L', how: 'exact', source: 'custom', units: pieceOnly('L', 170) },
  { label: 'マック エッグマックマフィン', pattern: 'マクドナルド エッグマックマフィン', how: 'exact', source: 'custom', units: pieceOnly('1個', 138) },
  { label: 'マック ソーセージエッグマフィン', pattern: 'マクドナルド ソーセージエッグマフィン', how: 'exact', source: 'custom', units: pieceOnly('1個', 170) },
  { label: 'マック ホットケーキ', pattern: 'マクドナルド ホットケーキ', how: 'exact', source: 'custom', units: pieceOnly('1個', 150) },
  { label: 'マック サイドサラダ', pattern: 'マクドナルド サイドサラダ', how: 'exact', source: 'custom', units: pieceOnly('1個', 60) },
  { label: 'マック コーヒー', pattern: 'マクドナルド プレミアムローストコーヒー(ブラック)', how: 'exact', source: 'custom', units: [ml('1杯', 240)] },

  // モスバーガー
  { label: 'モス モスバーガー', pattern: 'モスバーガー モスバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 210) },
  { label: 'モス モスチーズバーガー', pattern: 'モスバーガー モスチーズバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 224) },
  { label: 'モス テリヤキバーガー', pattern: 'モスバーガー テリヤキバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 160) },
  { label: 'モス テリヤキチキンバーガー', pattern: 'モスバーガー テリヤキチキンバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 185) },
  { label: 'モス フィッシュバーガー', pattern: 'モスバーガー フィッシュバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 158) },
  { label: 'モス モス野菜バーガー', pattern: 'モスバーガー モス野菜バーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 225) },
  { label: 'モス 海老カツバーガー', pattern: 'モスバーガー 海老カツバーガー', how: 'exact', source: 'custom', units: pieceOnly('1個', 165) },
  { label: 'モス ライスバーガー', pattern: 'モスバーガー ライスバーガー海鮮かきあげ', how: 'exact', source: 'custom', units: pieceOnly('1個', 170) },
  { label: 'モス モスチキン', pattern: 'モスバーガー モスチキン', how: 'exact', source: 'custom', units: pieceOnly('1個', 82) },
  { label: 'モス オニポテ', pattern: 'モスバーガー オニポテ', how: 'exact', source: 'custom', units: pieceOnly('1個', 110) },

  // ========================================================================
  // すき家
  // ========================================================================
  { label: 'すき家 牛丼 ミニ', pattern: 'すき家 牛丼 ミニ', how: 'exact', source: 'custom', units: pieceOnly('1杯', 220) },
  { label: 'すき家 牛丼 並盛', pattern: 'すき家 牛丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 320) },
  { label: 'すき家 牛丼 中盛', pattern: 'すき家 牛丼 中盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 370) },
  { label: 'すき家 牛丼 大盛', pattern: 'すき家 牛丼 大盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 430) },
  { label: 'すき家 牛丼 特盛', pattern: 'すき家 牛丼 特盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 510) },
  { label: 'すき家 牛丼 メガ', pattern: 'すき家 牛丼 メガ', how: 'exact', source: 'custom', units: pieceOnly('1杯', 610) },
  { label: 'すき家 チーズ牛丼', pattern: 'すき家 チーズ牛丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 355) },
  { label: 'すき家 おろしポン酢牛丼', pattern: 'すき家 おろしポン酢牛丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 410) },
  { label: 'すき家 ねぎ玉牛丼', pattern: 'すき家 ねぎ玉牛丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 400) },
  { label: 'すき家 キムチ牛丼', pattern: 'すき家 キムチ牛丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 370) },
  { label: 'すき家 牛丼ライト', pattern: 'すき家 牛丼ライト 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 430) },
  { label: 'すき家 鮭定食', pattern: 'すき家 鮭定食', how: 'exact', source: 'custom', units: pieceOnly('1食', 360) },
  { label: 'すき家 まぐろたたき丼', pattern: 'すき家 まぐろたたき丼', how: 'exact', source: 'custom', units: pieceOnly('1杯', 310) },
  { label: 'すき家 豚生姜焼き丼', pattern: 'すき家 豚生姜焼き丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 350) },
  { label: 'すき家 カレー', pattern: 'すき家 カレー 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 490) },

  // ========================================================================
  // 吉野家
  // ========================================================================
  { label: '吉野家 牛丼 小盛', pattern: '吉野家 牛丼 小盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 250) },
  { label: '吉野家 牛丼 並盛', pattern: '吉野家 牛丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 320) },
  { label: '吉野家 牛丼 アタマの大盛', pattern: '吉野家 牛丼 アタマの大盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 350) },
  { label: '吉野家 牛丼 大盛', pattern: '吉野家 牛丼 大盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 400) },
  { label: '吉野家 牛丼 特盛', pattern: '吉野家 牛丼 特盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 470) },
  { label: '吉野家 牛丼 超特盛', pattern: '吉野家 牛丼 超特盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 580) },
  { label: '吉野家 豚丼', pattern: '吉野家 豚丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 320) },
  { label: '吉野家 牛すき鍋膳', pattern: '吉野家 牛すき鍋膳', how: 'exact', source: 'custom', units: pieceOnly('1食', 580) },
  { label: '吉野家 親子丼', pattern: '吉野家 親子丼 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 400) },
  { label: '吉野家 ライザップ牛サラダ', pattern: '吉野家 ライザップ牛サラダ', how: 'exact', source: 'custom', units: pieceOnly('1食', 340) },
  { label: '吉野家 鮭定食', pattern: '吉野家 鮭定食', how: 'exact', source: 'custom', units: pieceOnly('1食', 340) },
  { label: '吉野家 から揚げ定食', pattern: '吉野家 から揚げ定食', how: 'exact', source: 'custom', units: pieceOnly('1食', 380) },

  // 松屋
  { label: '松屋 牛めし 並盛', pattern: '松屋 牛めし 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 330) },
  { label: '松屋 牛めし 大盛', pattern: '松屋 牛めし 大盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 420) },
  { label: '松屋 プレミアム牛めし', pattern: '松屋 プレミアム牛めし 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 320) },
  { label: '松屋 豚めし', pattern: '松屋 豚めし 並盛', how: 'exact', source: 'custom', units: pieceOnly('1杯', 330) },
  { label: '松屋 カルビ焼肉定食', pattern: '松屋 カルビ焼肉定食', how: 'exact', source: 'custom', units: pieceOnly('1食', 490) },

  // 丸亀製麺
  { label: '丸亀 かけうどん 並', pattern: '丸亀製麺 かけうどん 並', how: 'exact', source: 'custom', units: pieceOnly('1杯', 420) },
  { label: '丸亀 かけうどん 大', pattern: '丸亀製麺 かけうどん 大', how: 'exact', source: 'custom', units: pieceOnly('1杯', 560) },
  { label: '丸亀 ぶっかけうどん', pattern: '丸亀製麺 ぶっかけうどん 並', how: 'exact', source: 'custom', units: pieceOnly('1杯', 380) },
  { label: '丸亀 釜玉うどん', pattern: '丸亀製麺 釜玉うどん 並', how: 'exact', source: 'custom', units: pieceOnly('1杯', 310) },
  { label: '丸亀 肉うどん', pattern: '丸亀製麺 肉うどん 並', how: 'exact', source: 'custom', units: pieceOnly('1杯', 490) },
  { label: '丸亀 ざるうどん', pattern: '丸亀製麺 ざるうどん 並', how: 'exact', source: 'custom', units: pieceOnly('1杯', 310) },

  // リンガーハット
  { label: 'リンガー 長崎ちゃんぽん', pattern: 'リンガーハット 長崎ちゃんぽん', how: 'exact', source: 'custom', units: pieceOnly('1杯', 670) },
  { label: 'リンガー 野菜たっぷりちゃんぽん', pattern: 'リンガーハット 野菜たっぷりちゃんぽん', how: 'exact', source: 'custom', units: pieceOnly('1杯', 750) },
  { label: 'リンガー 長崎皿うどん', pattern: 'リンガーハット 長崎皿うどん', how: 'exact', source: 'custom', units: pieceOnly('1皿', 470) },

  // スシロー (1貫単位)
  { label: 'スシロー まぐろ', pattern: 'スシロー まぐろ 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー サーモン', pattern: 'スシロー サーモン 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー あぶりサーモン', pattern: 'スシロー あぶりサーモン 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー はまち', pattern: 'スシロー はまち 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー えび', pattern: 'スシロー えび 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー いか', pattern: 'スシロー いか 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー たまご', pattern: 'スシロー たまご 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー ネギトロ', pattern: 'スシロー ネギトロ 1貫(軍艦)', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'スシロー いくら', pattern: 'スシロー いくら 1貫(軍艦)', how: 'exact', source: 'custom', units: pieceOnly('1貫', 25) },
  { label: 'スシロー うに', pattern: 'スシロー うに 1貫(軍艦)', how: 'exact', source: 'custom', units: pieceOnly('1貫', 25) },
  { label: 'スシロー 茶碗蒸し', pattern: 'スシロー 茶碗蒸し', how: 'exact', source: 'custom', units: pieceOnly('1個', 120) },

  // くら寿司 (1貫)
  { label: 'くら寿司 まぐろ', pattern: 'くら寿司 まぐろ 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'くら寿司 サーモン', pattern: 'くら寿司 サーモン 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'くら寿司 えび', pattern: 'くら寿司 えび 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'くら寿司 はまち', pattern: 'くら寿司 はまち 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'くら寿司 たまご', pattern: 'くら寿司 たまご 1貫', how: 'exact', source: 'custom', units: [
    { label: '1貫', grams: 20, default: true },
    { label: '2貫', grams: 40 },
  ] },
  { label: 'くら寿司 えんがわ', pattern: 'くら寿司 えんがわ 1貫', how: 'exact', source: 'custom', units: pieceOnly('1貫', 20) },
  { label: 'くら寿司 いか', pattern: 'くら寿司 いか 1貫', how: 'exact', source: 'custom', units: pieceOnly('1貫', 20) },
  { label: 'くら寿司 あなご', pattern: 'くら寿司 あなご 1貫', how: 'exact', source: 'custom', units: pieceOnly('1貫', 25) },

  // スターバックス
  { label: 'スタバ ドリップ Short', pattern: 'スターバックス ドリップコーヒー Short', how: 'exact', source: 'custom', units: [ml('Short 240ml', 240)] },
  { label: 'スタバ ドリップ Tall', pattern: 'スターバックス ドリップコーヒー Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ アメリカーノ', pattern: 'スターバックス アメリカーノ Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ カフェラテ Short', pattern: 'スターバックス カフェラテ Short', how: 'exact', source: 'custom', units: [ml('Short 240ml', 240)] },
  { label: 'スタバ ラテ Tall', pattern: 'スターバックス スターバックス ラテ Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ ソイラテ', pattern: 'スターバックス ソイ ラテ Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ カフェモカ', pattern: 'スターバックス カフェモカ Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ キャラメルマキアート', pattern: 'スターバックス キャラメルマキアート Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ 抹茶ティーラテ', pattern: 'スターバックス 抹茶ティーラテ Tall', how: 'exact', source: 'custom', units: [ml('Tall 350ml', 350)] },
  { label: 'スタバ キャラメルフラペ', pattern: 'スターバックス キャラメル フラペチーノ Tall', how: 'exact', source: 'custom', units: [ml('Tall 380ml', 380)] },
  { label: 'スタバ コーヒーフラペ', pattern: 'スターバックス コーヒー フラペチーノ Tall', how: 'exact', source: 'custom', units: [ml('Tall 380ml', 380)] },

  // ドレッシング / 紅茶 (custom から)
  { label: 'キユーピー ノンオイル 青じそ', pattern: 'キユーピー ノンオイルドレッシング 青じそ', how: 'exact', source: 'custom', units: tspTbsp(5) },
  { label: 'キユーピー ノンオイル 玉ねぎ', pattern: 'キユーピー ノンオイルドレッシング 玉ねぎ', how: 'exact', source: 'custom', units: tspTbsp(5) },
  { label: 'キユーピー ノンオイル 中華', pattern: 'キユーピー ノンオイルドレッシング 中華', how: 'exact', source: 'custom', units: tspTbsp(5) },
  { label: 'リケン ノンオイル 青じそ', pattern: 'リケン ノンオイル 青じそ', how: 'exact', source: 'custom', units: tspTbsp(5) },
  { label: 'リケン ノンオイル 和風たまねぎ', pattern: 'リケン ノンオイル 和風たまねぎ', how: 'exact', source: 'custom', units: tspTbsp(5) },
  { label: 'ピエトロ ノンオイル 和ノ実', pattern: 'ピエトロ ノンオイル 和ノ実', how: 'exact', source: 'custom', units: tspTbsp(5) },

  { label: '午後の紅茶 無糖', pattern: '午後の紅茶 おいしい無糖', how: 'exact', source: 'custom', units: [ml('1本 500ml', 500)] },
  { label: '午後の紅茶 無糖 レモン', pattern: '午後の紅茶 おいしい無糖 香るレモン', how: 'exact', source: 'custom', units: [ml('1本 500ml', 500)] },
  { label: '午後の紅茶 無糖 ピーチ', pattern: '午後の紅茶 おいしい無糖 ピーチティー', how: 'exact', source: 'custom', units: [ml('1本 500ml', 500)] },
  { label: 'キリン 生茶', pattern: 'キリン 生茶', how: 'exact', source: 'custom', units: [ml('1本 525ml', 525)] },
  { label: '伊藤園 おーいお茶', pattern: '伊藤園 おーいお茶', how: 'exact', source: 'custom', units: [ml('1本 525ml', 525)] },
  { label: 'サントリー 烏龍茶', pattern: 'サントリー 烏龍茶', how: 'exact', source: 'custom', units: [ml('1本 500ml', 500)] },
];

// ============================================================================
// RUNNER
// ============================================================================

async function applyRule(rule: Rule) {
  let q = supabase.from('foods').select('id, name');

  if (rule.how === 'exact') {
    q = q.eq('name', rule.pattern);
  } else if (rule.how === 'prefix') {
    q = q.ilike('name', `${rule.pattern}%`);
  } else {
    q = q.ilike('name', `%${rule.pattern}%`);
  }
  if (rule.category) q = q.eq('category', rule.category);
  if (rule.source) q = q.eq('source', rule.source);
  if (rule.status) q = q.eq('pg_status', rule.status);

  const { data: matches, error: fetchErr } = await q;
  if (fetchErr) {
    console.error(`  [ERR] ${rule.label}: fetch — ${fetchErr.message}`);
    return { matched: 0, updated: 0 };
  }
  if (!matches || matches.length === 0) {
    return { matched: 0, updated: 0, noMatch: true };
  }
  if (matches.length > 50) {
    console.warn(`  [SKIP] ${rule.label}: matched ${matches.length} rows (too broad)`);
    return { matched: matches.length, updated: 0, tooBroad: true };
  }

  const ids = matches.map((m) => m.id);
  const updatePayload: Record<string, any> = { serving_units: rule.units };
  if (rule.use) updatePayload.common_use = rule.use;

  const { error: updErr } = await supabase
    .from('foods')
    .update(updatePayload)
    .in('id', ids);

  if (updErr) {
    console.error(`  [ERR] ${rule.label}: update — ${updErr.message}`);
    return { matched: matches.length, updated: 0 };
  }

  return { matched: matches.length, updated: matches.length };
}

async function main() {
  console.log(`Applying ${RULES.length} serving-unit rules...\n`);

  let totalUpdated = 0;
  let totalMatched = 0;
  const noMatch: string[] = [];
  const tooBroad: string[] = [];

  for (const rule of RULES) {
    const r = await applyRule(rule);
    totalUpdated += r.updated;
    totalMatched += r.matched;
    if (r.noMatch) {
      noMatch.push(`${rule.label} (pattern: "${rule.pattern}")`);
      console.log(`  [---] ${rule.label}: 0 matches`);
    } else if (r.tooBroad) {
      tooBroad.push(rule.label);
    } else if (r.updated > 0) {
      console.log(`  [OK ] ${rule.label}: ${r.updated} rows`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Rules applied:     ${RULES.length}`);
  console.log(`Rows updated:      ${totalUpdated}`);
  console.log(`Rules with 0 match: ${noMatch.length}`);
  console.log(`Rules too broad:    ${tooBroad.length}`);

  if (noMatch.length > 0) {
    console.log(`\n--- Unmatched rules ---`);
    for (const m of noMatch) console.log(`  ${m}`);
  }
  if (tooBroad.length > 0) {
    console.log(`\n--- Too-broad rules (skipped) ---`);
    for (const m of tooBroad) console.log(`  ${m}`);
  }

  // Verify by counting foods with serving_units set
  const { count } = await supabase
    .from('foods')
    .select('*', { count: 'exact', head: true })
    .not('serving_units', 'eq', '[]');
  console.log(`\nFoods with serving_units in DB now: ${count ?? '?'}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
