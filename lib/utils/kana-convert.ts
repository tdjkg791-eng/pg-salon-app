/**
 * Kana / width / kanji normalization utilities for Japanese food search.
 *
 * The food DB stores items in a mix of kanji, hiragana, katakana, and
 * full-width latin. Users type in any of these forms. We bridge them by:
 *   - Generating katakana/hiragana/full-width variants of the query
 *   - Substituting known kana sequences with their kanji equivalents
 *     (e.g. "ぎゅうどん" → adds variant "牛丼")
 *   - Normalizing synonym dictionary lookups with kanji→kana so that
 *     "鶏ささみ" and "とりささみ" hit the same dict key.
 */

/** Katakana → hiragana (U+30A1..U+30F6 → U+3041..U+3096). */
export function kataToHira(s: string): string {
  return s.replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

/** Hiragana → katakana. */
export function hiraToKata(s: string): string {
  return s.replace(/[\u3041-\u3096]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + 0x60)
  );
}

// Half-width katakana (incl. dakuten) → full-width katakana.
const HALF_DAKUTEN: Record<string, string> = {
  'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
  'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
  'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
  'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
  'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
  'ｳﾞ': 'ヴ',
};

const HALF_SINGLE: Record<string, string> = {
  'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
  'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ',
  'ｰ': 'ー', '｡': '。', '､': '、', '｢': '「', '｣': '」',
};

/** Half-width kana/symbols → full-width. */
export function halfToFullKana(s: string): string {
  let out = s;
  for (const [h, f] of Object.entries(HALF_DAKUTEN)) {
    out = out.split(h).join(f);
  }
  for (const [h, f] of Object.entries(HALF_SINGLE)) {
    out = out.split(h).join(f);
  }
  return out;
}

/** Full-width ASCII → half-width ASCII. */
export function fullToHalfAscii(s: string): string {
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3000/g, ' ');
}

/** Full normalization: half→full kana, full→half ASCII, lowercase, trim. */
export function normalize(s: string): string {
  return fullToHalfAscii(halfToFullKana(s)).toLowerCase().trim();
}

// ============================================================================
// Kana ↔ Kanji bridge
// ============================================================================

/**
 * Kana sequences that can be substituted with kanji in DB names.
 * Used to expand queries: "ぎゅうどん" → variant "牛丼" which then matches
 * DB rows like "すき家 牛丼 並盛".
 *
 * Order matters: longer keys should come first so "ぎゅうどん" is handled
 * as a unit before individual "ぎゅう"/"どん" substitutions.
 */
const KANA_TO_KANJI: Array<[string, string[]]> = [
  // Full compound words first (most specific)
  ['すきや', ['すき家']],
  ['よしのや', ['吉野家']],
  ['まつや', ['松屋']],
  ['ぎゅうどん', ['牛丼']],
  ['ぶたどん', ['豚丼']],
  ['ぎゅうめし', ['牛めし']],
  ['ぶためし', ['豚めし']],
  ['やきにく', ['焼肉']],
  ['からあげ', ['唐揚げ']],
  ['しょうがやき', ['生姜焼き']],
  ['たまごやき', ['卵焼き']],
  ['とりにく', ['鶏肉', '鶏']],
  ['ぶたにく', ['豚肉', '豚']],
  ['ぎゅうにく', ['牛肉', '牛']],
  // Individual characters (used when compound doesn't match)
  ['ぎゅう', ['牛']],
  ['うし', ['牛']],
  ['ぶた', ['豚']],
  ['とり', ['鶏']],
  ['にわとり', ['鶏']],
  ['さけ', ['鮭']],
  ['さかな', ['魚']],
  ['たまご', ['卵']],
  ['こめ', ['米']],
  ['にく', ['肉']],
  ['どん', ['丼']],
];

/**
 * Kanji → representative kana. Used for synonym dictionary normalization so
 * that "鶏ささみ" can hit the same dict key as "とりささみ". This mapping
 * is one-way and lossy; do not use it for DB queries.
 */
const KANJI_TO_KANA: Record<string, string> = {
  '鶏': 'とり',
  '牛': 'ぎゅう',
  '豚': 'ぶた',
  '鮭': 'さけ',
  '魚': 'さかな',
  '肉': 'にく',
  '卵': 'たまご',
  '米': 'こめ',
  '丼': 'どん',
  '家': 'や',
  '屋': 'や',
  '吉野': 'よしの',
  '松': 'まつ',
  '焼': 'やき',
  '煮': 'に',
  '唐': 'から',
  '揚': 'あげ',
  '生': 'なま',
  '茹': 'ゆで',
  '蒸': 'むし',
};

/**
 * Expand a query by substituting known kana sequences with their kanji
 * equivalents. Bounded exponential expansion (cap at 12 variants).
 */
function expandKanjiSubstitutions(q: string): string[] {
  const variants = new Set<string>([q]);
  const MAX = 12;
  for (const [kana, kanjis] of KANA_TO_KANJI) {
    if (variants.size >= MAX) break;
    const snapshot = Array.from(variants);
    for (const v of snapshot) {
      if (variants.size >= MAX) break;
      if (v.includes(kana)) {
        for (const k of kanjis) {
          variants.add(v.split(kana).join(k));
          if (variants.size >= MAX) break;
        }
      }
    }
  }
  return Array.from(variants);
}

/**
 * Apply kanji→kana replacement for every kanji in the dict. Used only for
 * synonym dictionary key normalization.
 */
export function kanjiToKana(s: string): string {
  let out = s;
  // Apply longest keys first
  const keys = Object.keys(KANJI_TO_KANA).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    out = out.split(k).join(KANJI_TO_KANA[k]);
  }
  return out;
}

/**
 * Return a de-duplicated list of query variants to match against DB.
 * Covers kana family swaps and kana→kanji substitutions.
 */
export function expandQueryVariants(q: string): string[] {
  const base = normalize(q);
  if (!base) return [];

  const kanaFamily = new Set<string>([
    base,
    kataToHira(base),
    hiraToKata(base),
  ]);

  const all = new Set<string>();
  for (const v of kanaFamily) {
    for (const kv of expandKanjiSubstitutions(v)) {
      all.add(kv);
    }
  }
  return Array.from(all).filter((v) => v.length > 0);
}

/**
 * Normalize a string for synonym-dict key lookup: collapse widths,
 * katakana→hiragana, and replace common kanji with representative kana.
 * Used both when building the dict index and when looking up queries.
 */
export function normalizeForSynonym(s: string): string {
  return kanjiToKana(kataToHira(normalize(s)));
}
