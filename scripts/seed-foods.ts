/**
 * Seed script: foods master data
 * Run with: npm run seed
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

type FoodSeed = {
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

const foods: FoodSeed[] = [
  // ==== OK ====
  { food_code: null, name: '鶏ササミ', name_kana: 'とりささみ', category: '肉', serving_g: 100, calories_kcal: 98, protein_g: 23.9, fat_g: 0.8, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: '鶏むね肉皮なし', name_kana: 'とりむねにくかわなし', category: '肉', serving_g: 100, calories_kcal: 105, protein_g: 23.3, fat_g: 1.9, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'サラダチキン', name_kana: 'さらだちきん', category: '肉', serving_g: 100, calories_kcal: 121, protein_g: 24.1, fat_g: 1.9, carb_g: 1.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: '砂肝', name_kana: 'すなぎも', category: '肉', serving_g: 100, calories_kcal: 86, protein_g: 18.3, fat_g: 1.2, carb_g: 0.0, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: '豚ヒレ', name_kana: 'ぶたひれ', category: '肉', serving_g: 100, calories_kcal: 118, protein_g: 22.2, fat_g: 3.7, carb_g: 0.3, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'カツオ', name_kana: 'かつお', category: '魚', serving_g: 100, calories_kcal: 108, protein_g: 25.8, fat_g: 0.5, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'タラ', name_kana: 'たら', category: '魚', serving_g: 100, calories_kcal: 72, protein_g: 17.6, fat_g: 0.2, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'マグロ赤身', name_kana: 'まぐろあかみ', category: '魚', serving_g: 100, calories_kcal: 115, protein_g: 26.4, fat_g: 1.4, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'えび', name_kana: 'えび', category: '魚', serving_g: 100, calories_kcal: 82, protein_g: 18.7, fat_g: 0.4, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'イカ', name_kana: 'いか', category: '魚', serving_g: 100, calories_kcal: 76, protein_g: 17.9, fat_g: 0.8, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'タコ', name_kana: 'たこ', category: '魚', serving_g: 100, calories_kcal: 70, protein_g: 16.4, fat_g: 0.7, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'しらす', name_kana: 'しらす', category: '魚', serving_g: 100, calories_kcal: 113, protein_g: 24.5, fat_g: 1.7, carb_g: 0.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'ブロッコリー', name_kana: 'ぶろっこりー', category: '野菜', serving_g: 100, calories_kcal: 37, protein_g: 5.4, fat_g: 0.6, carb_g: 6.6, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'もやし', name_kana: 'もやし', category: '野菜', serving_g: 100, calories_kcal: 15, protein_g: 1.7, fat_g: 0.1, carb_g: 2.6, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'きゅうり', name_kana: 'きゅうり', category: '野菜', serving_g: 100, calories_kcal: 13, protein_g: 1.0, fat_g: 0.1, carb_g: 3.0, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'ほうれん草', name_kana: 'ほうれんそう', category: '野菜', serving_g: 100, calories_kcal: 18, protein_g: 2.2, fat_g: 0.4, carb_g: 3.1, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'しいたけ', name_kana: 'しいたけ', category: '野菜', serving_g: 100, calories_kcal: 25, protein_g: 3.1, fat_g: 0.3, carb_g: 6.4, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'わかめ', name_kana: 'わかめ', category: '野菜', serving_g: 100, calories_kcal: 24, protein_g: 1.9, fat_g: 0.2, carb_g: 5.6, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'こんにゃく', name_kana: 'こんにゃく', category: 'その他', serving_g: 100, calories_kcal: 5, protein_g: 0.1, fat_g: 0.0, carb_g: 2.3, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'しらたき', name_kana: 'しらたき', category: 'その他', serving_g: 100, calories_kcal: 7, protein_g: 0.2, fat_g: 0.0, carb_g: 3.0, pg_status: 'ok', pg_note: null, fat_warning: false, carb_warning: false, source: 'mext' },

  // ==== NG ====
  { food_code: null, name: '牛バラ', name_kana: 'ぎゅうばら', category: '肉', serving_g: 100, calories_kcal: 381, protein_g: 12.8, fat_g: 39.4, carb_g: 0.1, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: '鶏モモ', name_kana: 'とりもも', category: '肉', serving_g: 100, calories_kcal: 190, protein_g: 16.6, fat_g: 14.2, carb_g: 0.0, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'サーモン', name_kana: 'さーもん', category: '魚', serving_g: 100, calories_kcal: 218, protein_g: 22.5, fat_g: 14.4, carb_g: 0.1, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: '鯖', name_kana: 'さば', category: '魚', serving_g: 100, calories_kcal: 211, protein_g: 20.6, fat_g: 16.8, carb_g: 0.3, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'アジ', name_kana: 'あじ', category: '魚', serving_g: 100, calories_kcal: 112, protein_g: 19.7, fat_g: 4.5, carb_g: 0.1, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'いわし', name_kana: 'いわし', category: '魚', serving_g: 100, calories_kcal: 156, protein_g: 19.2, fat_g: 9.2, carb_g: 0.2, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: '白米', name_kana: 'はくまい', category: '主食', serving_g: 100, calories_kcal: 156, protein_g: 2.5, fat_g: 0.3, carb_g: 37.1, pg_status: 'ng', pg_note: null, fat_warning: false, carb_warning: true, source: 'mext' },
  { food_code: null, name: '食パン', name_kana: 'しょくぱん', category: '主食', serving_g: 100, calories_kcal: 248, protein_g: 8.9, fat_g: 4.1, carb_g: 46.4, pg_status: 'ng', pg_note: null, fat_warning: false, carb_warning: true, source: 'mext' },
  { food_code: null, name: 'うどん', name_kana: 'うどん', category: '主食', serving_g: 100, calories_kcal: 95, protein_g: 2.6, fat_g: 0.4, carb_g: 21.6, pg_status: 'ng', pg_note: null, fat_warning: false, carb_warning: true, source: 'mext' },
  { food_code: null, name: '豆腐', name_kana: 'とうふ', category: 'その他', serving_g: 100, calories_kcal: 73, protein_g: 7.0, fat_g: 4.9, carb_g: 1.5, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: '納豆', name_kana: 'なっとう', category: 'その他', serving_g: 100, calories_kcal: 190, protein_g: 16.5, fat_g: 10.0, carb_g: 12.1, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: true, source: 'mext' },
  { food_code: null, name: 'りんご', name_kana: 'りんご', category: 'その他', serving_g: 100, calories_kcal: 56, protein_g: 0.1, fat_g: 0.2, carb_g: 15.5, pg_status: 'ng', pg_note: null, fat_warning: false, carb_warning: true, source: 'mext' },
  { food_code: null, name: 'バナナ', name_kana: 'ばなな', category: 'その他', serving_g: 100, calories_kcal: 93, protein_g: 1.1, fat_g: 0.2, carb_g: 22.5, pg_status: 'ng', pg_note: null, fat_warning: false, carb_warning: true, source: 'mext' },
  { food_code: null, name: '牛乳', name_kana: 'ぎゅうにゅう', category: '乳製品', serving_g: 100, calories_kcal: 61, protein_g: 3.3, fat_g: 3.8, carb_g: 4.8, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'オリーブオイル', name_kana: 'おりーぶおいる', category: '油', serving_g: 100, calories_kcal: 894, protein_g: 0.0, fat_g: 100.0, carb_g: 0.0, pg_status: 'ng', pg_note: null, fat_warning: true, carb_warning: false, source: 'mext' },

  // ==== Limited ====
  { food_code: null, name: '鶏卵', name_kana: 'けいらん', category: 'その他', serving_g: 100, calories_kcal: 142, protein_g: 12.2, fat_g: 10.2, carb_g: 0.4, pg_status: 'limited', pg_note: '1日1個まで', fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: '鮭切身', name_kana: 'さけきりみ', category: '魚', serving_g: 100, calories_kcal: 124, protein_g: 22.3, fat_g: 4.1, carb_g: 0.1, pg_status: 'limited', pg_note: '脂質やや多め、週数回まで', fat_warning: true, carb_warning: false, source: 'mext' },
  { food_code: null, name: '糖質0麺', name_kana: 'とうしつぜろめん', category: '主食', serving_g: 100, calories_kcal: 13, protein_g: 0.9, fat_g: 0.0, carb_g: 2.5, pg_status: 'limited', pg_note: '主食代替として1食まで', fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'キャベツ', name_kana: 'きゃべつ', category: '野菜', serving_g: 100, calories_kcal: 21, protein_g: 1.3, fat_g: 0.2, carb_g: 5.2, pg_status: 'limited', pg_note: '食べ過ぎ注意 (糖質やや高)', fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: '白菜', name_kana: 'はくさい', category: '野菜', serving_g: 100, calories_kcal: 13, protein_g: 0.8, fat_g: 0.1, carb_g: 3.2, pg_status: 'limited', pg_note: '冬場は糖度が上がるため注意', fat_warning: false, carb_warning: false, source: 'mext' },
  { food_code: null, name: 'ノンオイルドレッシング', name_kana: 'のんおいるどれっしんぐ', category: 'その他', serving_g: 100, calories_kcal: 82, protein_g: 3.1, fat_g: 0.1, carb_g: 16.1, pg_status: 'limited', pg_note: '糖質注意。大さじ1までを目安に', fat_warning: false, carb_warning: true, source: 'mext' },
];

async function main() {
  console.log(`Seeding ${foods.length} foods...`);

  const { error: deleteError } = await supabase
    .from('foods')
    .delete()
    .eq('source', 'mext');

  if (deleteError) {
    console.error('Failed to clear existing mext foods:', deleteError.message);
    process.exit(1);
  }
  console.log('Cleared existing mext foods.');

  const { data, error } = await supabase.from('foods').insert(foods).select('id, name, pg_status');

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  for (const row of data ?? []) {
    console.log(`  [OK] ${row.name} (${row.pg_status})`);
  }

  console.log(`\nDone. Inserted: ${data?.length ?? 0} / ${foods.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
