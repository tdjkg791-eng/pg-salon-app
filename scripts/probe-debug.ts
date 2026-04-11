import { createClient } from '@supabase/supabase-js';
import { searchFoods } from '../lib/search/food-search';
import { expandQueryVariants, normalize, kataToHira, hiraToKata } from '../lib/utils/kana-convert';
import { getSynonyms } from '../lib/utils/food-synonyms';

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function trace(q: string) {
  console.log(`\n========= "${q}" =========`);
  console.log('codepoints:', Array.from(q).map(c => c.codePointAt(0)?.toString(16)).join(' '));
  console.log('normalize:', JSON.stringify(normalize(q)));
  console.log('kataToHira:', JSON.stringify(kataToHira(q)));
  console.log('hiraToKata:', JSON.stringify(hiraToKata(q)));
  const variants = expandQueryVariants(q);
  console.log('variants:', JSON.stringify(variants));
  console.log('synonyms:', JSON.stringify(getSynonyms(q)));

  // Raw queries
  const r1 = await s.from('foods').select('id,name,name_kana').ilike('name', `%${q}%`);
  console.log(`raw name ilike → ${r1.data?.length}: ${(r1.data ?? []).map(r => r.name).slice(0, 3).join(' | ')}`);

  // OR
  const conds = variants.flatMap(v => [`name.ilike.%${v}%`, `name_kana.ilike.%${v}%`]);
  const r2 = await s.from('foods').select('id,name').or(conds.join(','));
  console.log(`OR (${conds.length} conds) → ${r2.data?.length}, err=${r2.error?.message ?? 'none'}`);
  if (r2.data) for (const r of r2.data.slice(0, 3)) console.log(`  ${r.name}`);

  // searchFoods
  const sr = await searchFoods(s, q, { limit: 20 });
  console.log(`searchFoods → foods=${sr.foods.length} suggestions=${sr.suggestions.length}`);
  for (const f of sr.foods.slice(0, 3)) console.log(`  ${(f as any).name}`);
}

async function main() {
  for (const q of ['ナポリタン', 'なぽりたん', 'カルボナーラ', 'ハンバーグ', 'ペペロンチーノ', 'ボロネーゼ', 'ミートソース']) {
    await trace(q);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
