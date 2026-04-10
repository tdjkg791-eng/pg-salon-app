/**
 * Seed custom (non-mext) foods — product-specific items Pg. considers OK.
 *
 * Run: npm run seed-custom
 *
 * - source='custom' so mext importer (`npm run import-mext`) won't touch these
 * - Existing rows with the same name are skipped (duplicate-safe)
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

type CustomFood = {
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

const DRESSING_BASE = {
  category: '調味料',
  serving_g: 100,
  calories_kcal: 30,
  protein_g: 1.0,
  fat_g: 0.0,
  carb_g: 6.0,
  pg_status: 'ok' as const,
  pg_note: '脂質ゼロのものを選ぶこと',
  fat_warning: false,
  carb_warning: false,
  source: 'custom' as const,
  food_code: null,
};

const TEA_BASE = {
  category: '飲料',
  serving_g: 100,
  calories_kcal: 0,
  protein_g: 0.0,
  fat_g: 0.0,
  carb_g: 0.0,
  pg_status: 'ok' as const,
  pg_note: '無糖・糖質ゼロのもののみOK',
  fat_warning: false,
  carb_warning: false,
  source: 'custom' as const,
  food_code: null,
};

const foods: CustomFood[] = [
  // === ノンオイルドレッシング系 ===
  { ...DRESSING_BASE, name: 'キユーピー ノンオイルドレッシング 青じそ', name_kana: 'きゆーぴー のんおいるどれっしんぐ あおじそ' },
  { ...DRESSING_BASE, name: 'キユーピー ノンオイルドレッシング 玉ねぎ', name_kana: 'きゆーぴー のんおいるどれっしんぐ たまねぎ' },
  { ...DRESSING_BASE, name: 'キユーピー ノンオイルドレッシング 中華', name_kana: 'きゆーぴー のんおいるどれっしんぐ ちゅうか' },
  { ...DRESSING_BASE, name: 'リケン ノンオイル 青じそ', name_kana: 'りけん のんおいる あおじそ' },
  { ...DRESSING_BASE, name: 'リケン ノンオイル 和風たまねぎ', name_kana: 'りけん のんおいる わふうたまねぎ' },
  { ...DRESSING_BASE, name: 'ピエトロ ノンオイル 和ノ実', name_kana: 'ぴえとろ のんおいる わのみ' },
  { ...DRESSING_BASE, name: 'ノンオイルドレッシング（汎用）', name_kana: 'のんおいるどれっしんぐ' },

  // === 糖質ゼロ紅茶・お茶飲料 ===
  { ...TEA_BASE, name: '午後の紅茶 おいしい無糖', name_kana: 'ごごのこうちゃ おいしいむとう' },
  { ...TEA_BASE, name: '午後の紅茶 おいしい無糖 香るレモン', name_kana: 'ごごのこうちゃ おいしいむとう かおるれもん' },
  { ...TEA_BASE, name: '午後の紅茶 おいしい無糖 ピーチティー', name_kana: 'ごごのこうちゃ おいしいむとう ぴーちてぃー' },
  { ...TEA_BASE, name: 'キリン 生茶', name_kana: 'きりん なまちゃ' },
  { ...TEA_BASE, name: '伊藤園 おーいお茶', name_kana: 'いとうえん おーいおちゃ' },
  { ...TEA_BASE, name: 'サントリー 烏龍茶', name_kana: 'さんとりー うーろんちゃ' },
  { ...TEA_BASE, name: '無糖紅茶（汎用）', name_kana: 'むとうこうちゃ' },
  { ...TEA_BASE, name: 'はちみつ風味紅茶（糖質ゼロ）', name_kana: 'はちみつふうみこうちゃ とうしつぜろ' },
];

async function main() {
  console.log(`Seeding ${foods.length} custom foods...`);

  const names = foods.map((f) => f.name);
  const { data: existing, error: fetchErr } = await supabase
    .from('foods')
    .select('name')
    .in('name', names);

  if (fetchErr) {
    console.error('Failed to fetch existing names:', fetchErr.message);
    process.exit(1);
  }

  const existingNames = new Set((existing ?? []).map((r) => r.name));
  const toInsert = foods.filter((f) => !existingNames.has(f.name));
  const skipped = foods.length - toInsert.length;

  if (skipped > 0) {
    console.log(`Skipping ${skipped} already-existing foods:`);
    for (const f of foods) {
      if (existingNames.has(f.name)) console.log(`  [skip] ${f.name}`);
    }
  }

  if (toInsert.length === 0) {
    console.log('\nNothing to insert.');
    return;
  }

  const { data, error } = await supabase
    .from('foods')
    .insert(toInsert)
    .select('id, name, category, pg_status');

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  for (const row of data ?? []) {
    console.log(`  [OK] ${row.name} (${row.category}, ${row.pg_status})`);
  }

  console.log(`\nDone. Inserted: ${data?.length ?? 0} / skipped: ${skipped} / total: ${foods.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
