import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function probe(q: string, limit = 5) {
  const { data } = await supabase
    .from('foods')
    .select('name')
    .ilike('name', `%${q}%`)
    .eq('source', 'mext')
    .limit(limit);
  console.log(`\n"${q}" → ${data?.length ?? 0}`);
  for (const r of data ?? []) console.log(`  ${r.name}`);
}

async function main() {
  const queries = [
    'うずら', 'ぶた ヒレ', 'ぶた ばら', 'ぶた ロース', 'ぶた ひき',
    'うし ばら', 'うし もも', 'うし ひき',
    '合いびき', '肝臓 にわとり', 'にわとり 筋胃', 'にわとり 心臓',
    'フレーク', 'まぐろ 缶詰', 'さば 缶詰',
    'たいせいよう', 'イクラ', 'ばなめ',
    '水稲めし', '水稲 めし', 'めし 精白米',
    'そうめん', 'ま昆布', '昆布 素干し',
    '木綿', '絹ごし', '生揚げ', '油揚げ',
    'きな粉', 'うんしゅう', 'バレンシア',
    '清酒',
  ];
  for (const q of queries) await probe(q);
}

main();
