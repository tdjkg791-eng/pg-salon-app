/**
 * 食品検索の曖昧キーワード → 具体食品名 辞書。
 *
 * Abstract keywords ("白身魚", "鶏", "葉物") are expanded into concrete
 * food names, which are then re-queried against the foods table.
 *
 * Lookups are normalized (width, kana, kanji→kana) so that
 * "鶏ささみ" / "とりささみ" / "トリササミ" all hit the same dict entry.
 */
import { normalizeForSynonym } from './kana-convert';

const FOOD_SYNONYMS_RAW: Record<string, string[]> = {
  // === 魚系 ===
  '白身': ['たら', 'ひらめ', 'すずき', 'たい', 'かれい', 'あんこう', 'はも', 'きす', 'あいなめ', 'ほっけ'],
  '白身魚': ['たら', 'ひらめ', 'すずき', 'たい', 'かれい', 'あんこう', 'はも', 'きす', 'あいなめ', 'ほっけ'],
  '赤身': ['まぐろ', 'かつお', 'ぶり'],
  '赤身魚': ['まぐろ', 'かつお', 'ぶり'],
  '青魚': ['さば', 'あじ', 'いわし', 'さんま', 'にしん'],

  // === 肉系 ===
  '鶏': ['ささみ', 'むね', 'もも', 'ひき肉', '砂肝', 'レバー'],
  '鶏肉': ['ささみ', 'むね', 'もも', 'ひき肉', '砂肝', 'レバー'],
  '豚': ['ヒレ', 'もも', 'バラ', 'ロース', 'ひき肉'],
  '豚肉': ['ヒレ', 'もも', 'バラ', 'ロース', 'ひき肉'],
  '牛': ['もも', 'バラ', 'ロース', 'ヒレ', 'ひき肉'],
  '牛肉': ['もも', 'バラ', 'ロース', 'ヒレ', 'ひき肉'],

  // 特定メニューの俗称・かな形: "とりささみ" / "鶏ささみ" 両方から引ける
  'とりささみ': ['ささみ', 'ささ身', 'ササミ'],
  'とりむね': ['むね', '若どり むね'],
  'とりもも': ['もも', '若どり もも'],

  // === 野菜系 ===
  '葉物': ['ほうれん草', '小松菜', 'レタス', 'キャベツ', '白菜', '水菜', '春菊'],
  '葉物野菜': ['ほうれん草', '小松菜', 'レタス', 'キャベツ', '白菜', '水菜', '春菊'],
  '緑黄色野菜': ['ほうれん草', 'ブロッコリー', 'にんじん', 'かぼちゃ', 'トマト', 'ピーマン'],
  'きのこ': ['しいたけ', 'しめじ', 'えのき', 'まいたけ', 'エリンギ', 'なめこ'],
  '海藻': ['わかめ', 'ひじき', 'もずく', '昆布', 'のり'],

  // === 豆系 ===
  '豆': ['大豆', '枝豆', 'そら豆', 'いんげん豆'],
  '大豆製品': ['豆腐', '納豆', '厚揚げ', '油揚げ', 'おから'],

  // === 外食チェーン 略称・俗称 ===
  'すきや': ['すき家'],
  'よしのや': ['吉野家'],
  'まつや': ['松屋'],
  'マック': ['マクドナルド'],
  'マクド': ['マクドナルド'],
  'サイゼ': ['サイゼリヤ'],
  'スタバ': ['スターバックス'],
  'ファミマ': ['ファミリーマート'],
  'セブン': ['セブンイレブン'],
  'モス': ['モスバーガー'],
  'リンガー': ['リンガーハット'],
  'くらずし': ['くら寿司'],

  // === 商品名の俗称・略称 ===
  'サラチキ': ['サラダチキン'],
  'ビクマック': ['ビッグマック'],
  'サモン': ['サーモン'],
  'ハンバガー': ['ハンバーガー'],
  'ポテト': ['マックフライポテト', 'ポテト'],

  // === 料理名の別表記 ===
  'からあげ': ['唐揚げ', 'から揚げ', '鶏の唐揚げ'],
  '唐揚げ': ['唐揚げ', 'から揚げ', 'からあげ'],
  'とんかつ': ['とんかつ', 'トンカツ', '豚カツ'],
  'やきそば': ['焼きそば', '焼そば'],
  'おにぎり': ['おにぎり', 'おむすび'],
};

// Build a normalized lookup index at module load so that all query-side
// spellings collapse to the same entry. Arrays from collisions are merged.
const FOOD_SYNONYMS_INDEX: Map<string, string[]> = new Map();
for (const [key, values] of Object.entries(FOOD_SYNONYMS_RAW)) {
  const normKey = normalizeForSynonym(key);
  const existing = FOOD_SYNONYMS_INDEX.get(normKey) ?? [];
  const merged = Array.from(new Set([...existing, ...values]));
  FOOD_SYNONYMS_INDEX.set(normKey, merged);
}

/**
 * Category hints for queries that should fall back to category search.
 */
export const CATEGORY_HINTS: Record<string, string> = {
  '魚': '魚介類',
  '魚介': '魚介類',
  'さかな': '魚介類',
  '肉': '肉類',
  '野菜': '野菜類',
  '果物': '果実類',
  'フルーツ': '果実類',
  'きのこ': 'きのこ類',
  '海藻': '藻類',
  '藻': '藻類',
  '豆': '豆類',
  '卵': '卵類',
  '芋': 'いも及びでん粉類',
  'いも': 'いも及びでん粉類',
  '飲料': 'し好飲料類',
  '飲み物': 'し好飲料類',
  'お茶': 'し好飲料類',
};

const CATEGORY_HINTS_INDEX: Map<string, string> = new Map();
for (const [key, value] of Object.entries(CATEGORY_HINTS)) {
  CATEGORY_HINTS_INDEX.set(normalizeForSynonym(key), value);
}

/**
 * Look up synonyms for a query string. Handles kana/kanji variants.
 */
export function getSynonyms(keyword: string): string[] {
  return FOOD_SYNONYMS_INDEX.get(normalizeForSynonym(keyword)) ?? [];
}

/**
 * Look up a category hint for a query string.
 */
export function getCategoryHint(keyword: string): string | null {
  return CATEGORY_HINTS_INDEX.get(normalizeForSynonym(keyword)) ?? null;
}

// Backward-compat exports (old shape used by older callers)
export const FOOD_SYNONYMS = FOOD_SYNONYMS_RAW;
