import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FOOD_COLUMNS =
  'id,food_code,name,name_kana,category,serving_g,calories_kcal,' +
  'protein_g,fat_g,carb_g,pg_status,pg_note,fat_warning,carb_warning,' +
  'source,serving_units,common_use,created_at';

async function testExactQuery() {
  console.log('Testing exact queryByKeyword replication...');

  // This is the exact OR clause that should be generated
  const orClause = 'name.ilike.%ナポリタン%,name_kana.ilike.%ナポリタン%,name.ilike.%なぽりたん%,name_kana.ilike.%なぽりたん%';

  // Test 1: Exact queryByKeyword replication
  console.log('\n1. Exact queryByKeyword replication:');
  const result1 = await supabase
    .from('foods')
    .select(FOOD_COLUMNS)
    .or(orClause)
    .order('pg_status', { ascending: true })
    .limit(20);

  console.log('Result:', {
    count: result1.data?.length ?? 0,
    error: result1.error?.message ?? null,
    first_name: result1.data?.[0]?.name ?? null
  });

  // Test 2: Same but with select('*') to confirm it's still broken
  console.log('\n2. Same query with select(*):');
  const result2 = await supabase
    .from('foods')
    .select('*')
    .or(orClause)
    .order('pg_status', { ascending: true })
    .limit(20);

  console.log('Result:', {
    count: result2.data?.length ?? 0,
    error: result2.error?.message ?? null,
    first_name: result2.data?.[0]?.name ?? null
  });

  // Test 3: Minimal working query (just OR, no order/limit)
  console.log('\n3. Minimal OR only:');
  const result3 = await supabase
    .from('foods')
    .select('id,name')
    .or(orClause);

  console.log('Result:', {
    count: result3.data?.length ?? 0,
    error: result3.error?.message ?? null,
    first_name: result3.data?.[0]?.name ?? null
  });
}

testExactQuery().catch(console.error);