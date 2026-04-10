/**
 * Import 文部科学省 日本食品標準成分表 2020年版（八訂）本表 into Supabase.
 *
 * Usage:
 *   npm run import-mext -- --dry-run   # parse only, print samples
 *   npm run import-mext                # delete source='mext' rows and bulk insert
 *
 * Requires data/mext_2020.xlsx (downloaded from mext.go.jp).
 */
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const XLSX_PATH = 'data/mext_2020.xlsx';
const SHEET_NAME = '表全体';
const DATA_START_ROW = 12;

const COL = {
  group: 0,
  food_code: 1,
  name: 3,
  kcal: 6,
  protein: 9,
  fat: 12,
  carb: 20,
} as const;

const GROUP_NAMES: Record<string, string> = {
  '01': '穀類',
  '02': 'いも及びでん粉類',
  '03': '砂糖及び甘味類',
  '04': '豆類',
  '05': '種実類',
  '06': '野菜類',
  '07': '果実類',
  '08': 'きのこ類',
  '09': '藻類',
  '10': '魚介類',
  '11': '肉類',
  '12': '卵類',
  '13': '乳類',
  '14': '油脂類',
  '15': '菓子類',
  '16': 'し好飲料類',
  '17': '調味料及び香辛料類',
  '18': '調理済み流通食品類',
};

type Food = {
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

// Parse numeric cells: "(11.3)" -> 11.3, "Tr" -> 0, "-" -> 0, "" -> 0
function num(v: any): number {
  if (v == null || v === '') return 0;
  const s = String(v).trim();
  if (s === '-' || s === 'Tr' || s === '(Tr)' || s === '*' || s === '(0)') {
    return s === '(0)' ? 0 : 0;
  }
  const cleaned = s.replace(/[()（）]/g, '').replace(/[^\d.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// Clean food name: remove full-width spaces and control chars
function cleanName(v: any): string {
  return String(v ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Determine pg_status based on rules (priority order)
function classify(food: {
  group: string;
  name: string;
  protein: number;
  fat: number;
  carb: number;
  kcal: number;
}): { status: 'ok' | 'ng' | 'limited'; note: string | null } {
  const { group, name, protein, fat, carb, kcal } = food;

  // 1. Explicit ng: grains (rice, bread, noodles) by group '01'
  if (group === '01') return { status: 'ng', note: '主食・糖質多め' };

  // 2. Explicit ng: beef / salmon by name
  if (/うし|ぎゅう|牛/.test(name) && group === '11') {
    return { status: 'ng', note: '牛肉は脂質多め' };
  }
  if (/さけ|サーモン|鮭|さば|鯖|あじ|鰺|いわし|鰯|ぶり|鰤|さんま|秋刀魚/.test(name) && group === '10') {
    return { status: 'ng', note: '青魚・サーモンは脂質多め' };
  }

  // 3. carb ≥ 50 → ng
  if (carb >= 50) return { status: 'ng', note: '糖質50g/100g以上' };

  // 4. Unconditional ok: きのこ・藻類
  if (group === '08' || group === '09') return { status: 'ok', note: null };

  // 5. Low-carb vegetables (approximation of leafy veg)
  if (group === '06' && carb < 10) return { status: 'ok', note: null };

  // 6. High protein, low fat → ok
  if (protein >= 15 && fat <= 5) return { status: 'ok', note: null };

  // 7. Low calorie fallback → ok
  if (kcal > 0 && kcal <= 200 && fat < 10 && carb < 30) {
    return { status: 'ok', note: null };
  }

  // 8. default → limited
  return { status: 'limited', note: '数値判定: 要確認' };
}

function parseXlsx(): Food[] {
  const wb = XLSX.readFile(XLSX_PATH);
  const sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

  const foods: Food[] = [];
  const seenNames = new Set<string>();
  let skipped = 0;

  for (let i = DATA_START_ROW; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const group = String(row[COL.group] ?? '').trim();
    const foodCode = String(row[COL.food_code] ?? '').trim();
    const name = cleanName(row[COL.name]);

    // Skip headers, empty rows, non-standard rows
    if (!group || !/^\d{2}$/.test(group)) { skipped++; continue; }
    if (!foodCode || !/^\d{5}$/.test(foodCode)) { skipped++; continue; }
    if (!name) { skipped++; continue; }

    const kcal = num(row[COL.kcal]);
    const protein = num(row[COL.protein]);
    const fat = num(row[COL.fat]);
    const carb = num(row[COL.carb]);

    // Deduplicate by name (table has some duplicates, e.g. same name different processing)
    let finalName = name;
    if (seenNames.has(finalName)) {
      finalName = `${name} (${foodCode})`;
    }
    seenNames.add(finalName);

    const { status, note } = classify({ group, name, protein, fat, carb, kcal });
    const category = GROUP_NAMES[group] ?? 'その他';

    foods.push({
      food_code: foodCode,
      name: finalName,
      name_kana: '',
      category,
      serving_g: 100,
      calories_kcal: Math.round(kcal * 10) / 10,
      protein_g: Math.round(protein * 10) / 10,
      fat_g: Math.round(fat * 10) / 10,
      carb_g: Math.round(carb * 10) / 10,
      pg_status: status,
      pg_note: note,
      fat_warning: fat >= 10,
      carb_warning: carb >= 30,
      source: 'mext',
    });
  }

  console.log(`Parsed ${foods.length} foods (skipped ${skipped} rows).`);
  return foods;
}

async function importToSupabase(foods: Food[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey);

  console.log('Deleting existing source=mext rows...');
  const { error: delErr } = await supabase.from('foods').delete().eq('source', 'mext');
  if (delErr) {
    console.error('Delete failed:', delErr.message);
    process.exit(1);
  }

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < foods.length; i += CHUNK) {
    const chunk = foods.slice(i, i + CHUNK);
    const { error } = await supabase.from('foods').insert(chunk);
    if (error) {
      console.error(`Insert failed at chunk ${i}-${i + chunk.length}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  inserted ${inserted} / ${foods.length}`);
  }
  console.log(`\nDone. Inserted ${inserted} foods.`);
}

async function main() {
  const foods = parseXlsx();

  // Summary
  const byStatus = { ok: 0, ng: 0, limited: 0 };
  const byCategory: Record<string, number> = {};
  for (const f of foods) {
    byStatus[f.pg_status] += 1;
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
  }
  console.log('\n=== Status breakdown ===');
  console.log(byStatus);
  console.log('\n=== Category breakdown ===');
  console.log(byCategory);

  console.log('\n=== Sample rows ===');
  for (const i of [0, 100, 500, 1000, 1500, 2000, foods.length - 1]) {
    const f = foods[i];
    if (!f) continue;
    console.log(
      `  [${i}] ${f.food_code} ${f.name} | ${f.category} | ${f.calories_kcal}kcal P${f.protein_g} F${f.fat_g} C${f.carb_g} | ${f.pg_status}${f.fat_warning ? ' ⚠F' : ''}${f.carb_warning ? ' ⚠C' : ''}`
    );
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: skipping Supabase write.');
    return;
  }

  await importToSupabase(foods);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
