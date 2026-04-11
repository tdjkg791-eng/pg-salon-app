/**
 * Food search quality test runner.
 *
 * Runs ~70 user-perspective test cases against the real Supabase DB using
 * the same searchFoods() that the Next.js route uses. No HTTP server
 * needed. No external APIs. Pure dictionary + normalization + PostgREST.
 *
 * Usage:
 *   npm run test-search          # run all, print summary
 *   npm run test-search -- -v    # verbose failures
 */
import { createClient } from '@supabase/supabase-js';
import { searchFoods } from '../lib/search/food-search';
import { normalize } from '../lib/utils/kana-convert';

const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

type TestCase = {
  cat: string;
  input: string;
  /** Each keyword must appear as a substring in at least one result name (or name_kana). */
  keywords?: string[];
  /** Minimum total number of results (foods + suggestions). */
  min: number;
  /** Optional description. */
  desc?: string;
};

// ============================================================================
// TEST CASES (70+)
// ============================================================================

const TEST_CASES: TestCase[] = [
  // ── 表記ゆれ: ひらがな / カタカナ / 漢字 ──
  { cat: '表記ゆれ', input: 'ささみ', keywords: ['ささみ'], min: 1 },
  { cat: '表記ゆれ', input: 'とりささみ', keywords: ['ささみ'], min: 1 },
  { cat: '表記ゆれ', input: 'トリササミ', keywords: ['ささみ'], min: 1 },
  { cat: '表記ゆれ', input: '鶏ささみ', keywords: ['ささみ'], min: 1 },
  { cat: '表記ゆれ', input: 'ぎゅうどん', keywords: ['牛丼'], min: 3 },
  { cat: '表記ゆれ', input: '牛丼', keywords: ['牛丼'], min: 3 },
  { cat: '表記ゆれ', input: 'ギュウドン', keywords: ['牛丼'], min: 3 },
  { cat: '表記ゆれ', input: 'ぶたどん', keywords: ['豚'], min: 1 },
  { cat: '表記ゆれ', input: 'ブタドン', keywords: ['豚'], min: 1 },
  { cat: '表記ゆれ', input: 'ひらめ', keywords: ['ひらめ'], min: 1 },
  { cat: '表記ゆれ', input: 'ヒラメ', keywords: ['ひらめ'], min: 1 },
  { cat: '表記ゆれ', input: 'マグロ', keywords: ['まぐろ'], min: 1 },
  { cat: '表記ゆれ', input: 'まぐろ', keywords: ['まぐろ'], min: 1 },

  // ── 店名 ──
  { cat: '店名', input: 'すき家', keywords: ['すき家'], min: 5 },
  { cat: '店名', input: 'すきや', keywords: ['すき家'], min: 3 },
  { cat: '店名', input: 'スキヤ', keywords: ['すき家'], min: 3 },
  { cat: '店名', input: '吉野家', keywords: ['吉野家'], min: 5 },
  { cat: '店名', input: 'よしのや', keywords: ['吉野家'], min: 3 },
  { cat: '店名', input: '松屋', keywords: ['松屋'], min: 5 },
  { cat: '店名', input: 'まつや', keywords: ['松屋'], min: 3 },
  { cat: '店名', input: 'マクドナルド', keywords: ['マクドナルド'], min: 5 },
  { cat: '店名', input: 'マック', keywords: ['マクドナルド'], min: 3 },
  { cat: '店名', input: 'マクド', keywords: ['マクドナルド'], min: 3 },
  { cat: '店名', input: 'モスバーガー', keywords: ['モス'], min: 5 },
  { cat: '店名', input: 'モス', keywords: ['モス'], min: 5 },
  { cat: '店名', input: 'サイゼ', keywords: ['サイゼリヤ'], min: 3 },
  { cat: '店名', input: 'サイゼリヤ', keywords: ['サイゼリヤ'], min: 5 },
  { cat: '店名', input: 'スタバ', keywords: ['スターバックス'], min: 3 },
  { cat: '店名', input: 'スターバックス', keywords: ['スターバックス'], min: 5 },
  { cat: '店名', input: 'セブン', keywords: ['セブン'], min: 5 },
  { cat: '店名', input: 'セブンイレブン', keywords: ['セブン'], min: 5 },
  { cat: '店名', input: 'ローソン', keywords: ['ローソン'], min: 5 },
  { cat: '店名', input: 'ファミマ', keywords: ['ファミリーマート'], min: 3 },
  { cat: '店名', input: 'ファミリーマート', keywords: ['ファミリーマート'], min: 5 },

  // ── 部分一致 (不完全入力) ──
  { cat: '部分一致', input: 'とり', min: 5 },
  { cat: '部分一致', input: 'ぶた', min: 5 },
  { cat: '部分一致', input: 'ぎゅう', keywords: ['牛'], min: 3 },
  { cat: '部分一致', input: 'さけ', min: 3 },
  { cat: '部分一致', input: 'チーズ', min: 5 },
  { cat: '部分一致', input: 'のり', min: 2 },

  // ── 曖昧表現 (同義語展開) ──
  { cat: '曖昧', input: '白身魚', keywords: ['たら'], min: 3 },
  { cat: '曖昧', input: '白身', keywords: ['たら'], min: 3 },
  { cat: '曖昧', input: '青魚', keywords: ['さば'], min: 3 },
  { cat: '曖昧', input: '赤身', keywords: ['まぐろ'], min: 2 },
  { cat: '曖昧', input: '葉物', keywords: ['ほうれん草'], min: 3 },
  { cat: '曖昧', input: '葉物野菜', keywords: ['ほうれん草'], min: 3 },
  { cat: '曖昧', input: '緑黄色野菜', keywords: ['にんじん'], min: 3 },
  { cat: '曖昧', input: 'きのこ', keywords: ['しいたけ'], min: 5 },
  { cat: '曖昧', input: '海藻', keywords: ['わかめ'], min: 3 },
  { cat: '曖昧', input: '大豆製品', keywords: ['豆腐'], min: 3 },

  // ── タイポ・入力ミス ──
  { cat: 'タイポ', input: 'ビクマック', keywords: ['ビッグマック'], min: 1 },
  { cat: 'タイポ', input: 'サモン', keywords: ['サーモン'], min: 1 },
  { cat: 'タイポ', input: 'ハンバガー', keywords: ['ハンバーガー'], min: 1 },

  // ── 俗称・略称 ──
  { cat: '俗称', input: 'サラチキ', keywords: ['サラダチキン'], min: 3 },
  { cat: '俗称', input: 'からあげ', min: 2 },
  { cat: '俗称', input: '唐揚げ', min: 1 },

  // ── カテゴリ検索 ──
  { cat: 'カテゴリ', input: '肉', min: 10 },
  { cat: 'カテゴリ', input: '魚', min: 10 },
  { cat: 'カテゴリ', input: '野菜', min: 10 },
  { cat: 'カテゴリ', input: '果物', min: 3 },
  { cat: 'カテゴリ', input: '飲料', min: 3 },

  // ── 料理名 ──
  { cat: '料理', input: '牛丼', keywords: ['牛丼'], min: 5 },
  { cat: '料理', input: 'カレー', keywords: ['カレー'], min: 3 },
  { cat: '料理', input: 'ラーメン', keywords: ['ラーメン'], min: 3 },
  { cat: '料理', input: 'うどん', keywords: ['うどん'], min: 5 },
  { cat: '料理', input: 'ハンバーグ', keywords: ['ハンバーグ'], min: 3 },
  { cat: '料理', input: 'サラダチキン', keywords: ['サラダチキン'], min: 5 },
  { cat: '料理', input: 'ビッグマック', keywords: ['ビッグマック'], min: 1 },
  { cat: '料理', input: 'フィレオフィッシュ', keywords: ['フィレオフィッシュ'], min: 1 },

  // ── 複合検索 (スペース区切り) ──
  { cat: '複合', input: '鶏 むね', min: 1 },
  { cat: '複合', input: '吉野家 牛丼', keywords: ['吉野家', '牛丼'], min: 1 },
  { cat: '複合', input: 'サラダチキン プレーン', keywords: ['サラダチキン', 'プレーン'], min: 1 },

  // ── 全角/半角 ──
  { cat: '全半角', input: 'ﾋﾞｯｸﾞﾏｯｸ', keywords: ['ビッグマック'], min: 1 },
  { cat: '全半角', input: 'ﾏｸﾄﾞﾅﾙﾄﾞ', keywords: ['マクドナルド'], min: 3 },
];

// ============================================================================
// RUNNER
// ============================================================================

type FailureDetail = {
  cat: string;
  input: string;
  min: number;
  actualTotal: number;
  missingKeywords: string[];
  sampleNames: string[];
  reason: 'too_few_results' | 'missing_keyword';
};

function checkCase(tc: TestCase, result: { foods: any[]; suggestions: any[] }): {
  pass: boolean;
  failure?: Omit<FailureDetail, 'cat' | 'input' | 'min'>;
} {
  const all = [...result.foods, ...result.suggestions];
  const total = all.length;

  if (total < tc.min) {
    return {
      pass: false,
      failure: {
        actualTotal: total,
        missingKeywords: tc.keywords ?? [],
        sampleNames: all.slice(0, 3).map((r) => r.name),
        reason: 'too_few_results',
      },
    };
  }

  if (tc.keywords && tc.keywords.length > 0) {
    const haystackN = all.map((r) =>
      normalize(`${r.name ?? ''} ${r.name_kana ?? ''}`)
    );
    const missing: string[] = [];
    for (const kw of tc.keywords) {
      const nk = normalize(kw);
      const found = haystackN.some((h) => h.includes(nk));
      if (!found) missing.push(kw);
    }
    if (missing.length > 0) {
      return {
        pass: false,
        failure: {
          actualTotal: total,
          missingKeywords: missing,
          sampleNames: all.slice(0, 5).map((r) => r.name),
          reason: 'missing_keyword',
        },
      };
    }
  }

  return { pass: true };
}

async function runOnce() {
  const failures: FailureDetail[] = [];
  const byCategory: Record<string, { pass: number; fail: number }> = {};

  for (const tc of TEST_CASES) {
    byCategory[tc.cat] ??= { pass: 0, fail: 0 };
    try {
      const result = await searchFoods(supabase, tc.input, { limit: 20 });
      const { pass, failure } = checkCase(tc, result);
      if (pass) {
        byCategory[tc.cat].pass += 1;
      } else {
        byCategory[tc.cat].fail += 1;
        failures.push({ cat: tc.cat, input: tc.input, min: tc.min, ...failure! });
      }
    } catch (e: any) {
      byCategory[tc.cat].fail += 1;
      failures.push({
        cat: tc.cat,
        input: tc.input,
        min: tc.min,
        actualTotal: 0,
        missingKeywords: tc.keywords ?? [],
        sampleNames: [],
        reason: 'too_few_results',
      });
      console.error(`  [ERR] ${tc.input}:`, e?.message ?? e);
    }
  }

  const total = TEST_CASES.length;
  const passed = total - failures.length;
  const passRate = (passed / total) * 100;

  return { total, passed, failed: failures.length, passRate, failures, byCategory };
}

async function main() {
  console.log(`Running ${TEST_CASES.length} search quality tests...\n`);
  const t0 = Date.now();
  const report = await runOnce();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('=== Category breakdown ===');
  for (const [cat, s] of Object.entries(report.byCategory)) {
    const total = s.pass + s.fail;
    const rate = total > 0 ? ((s.pass / total) * 100).toFixed(0) : '0';
    const bar = s.fail === 0 ? '✅' : s.pass === 0 ? '❌' : '⚠️ ';
    console.log(`  ${bar} ${cat}: ${s.pass}/${total} (${rate}%)`);
  }

  console.log(`\n=== Result ===`);
  console.log(`Passed: ${report.passed}/${report.total} (${report.passRate.toFixed(1)}%)`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Time:   ${elapsed}s`);

  if (report.failures.length > 0) {
    console.log(`\n=== Failures ===`);
    for (const f of report.failures) {
      const reasonLabel = f.reason === 'too_few_results'
        ? `only ${f.actualTotal} results (need ${f.min})`
        : `missing keywords: [${f.missingKeywords.join(', ')}]`;
      console.log(`  [${f.cat}] "${f.input}" — ${reasonLabel}`);
      if (VERBOSE && f.sampleNames.length > 0) {
        console.log(`      samples: ${f.sampleNames.slice(0, 3).join(' | ')}`);
      }
    }
  }

  // Exit nonzero on failures so CI can catch regressions
  if (report.failures.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
