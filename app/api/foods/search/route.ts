import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { searchFoods } from '@/lib/search/food-search';
import { expandQueryVariants } from '@/lib/utils/kana-convert';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const limitParam = req.nextUrl.searchParams.get('limit');
  const category = req.nextUrl.searchParams.get('category');
  const debug = req.nextUrl.searchParams.get('debug') === '1';

  if (q.length < 1) {
    return NextResponse.json({ foods: [], suggestions: [], expanded_from: null });
  }

  let limit = 20;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 50);
    }
  }

  try {
    const supabase = createServerClient();
    const result = await searchFoods(supabase, q, { category, limit });

    if (debug) {
      const variants = expandQueryVariants(q);

      // 2-condition OR (just q itself, both columns)
      const or2 = `name.ilike.%${q}%,name_kana.ilike.%${q}%`;
      const raw2c = await supabase.from('foods').select('id,name').or(or2);

      // 4-condition OR (both variants, both columns) — like queryByKeyword
      const cond4 = variants.flatMap((v) => [`name.ilike.%${v}%`, `name_kana.ilike.%${v}%`]);
      const or4 = cond4.join(',');
      const raw4c = await supabase.from('foods').select('id,name').or(or4);

      // 4-cond + select('*') + order + limit (EXACT replica of queryByKeyword)
      const rawFull = await supabase.from('foods').select('*').or(or4)
        .order('pg_status', { ascending: true }).limit(20);

      // bisection
      const rawA = await supabase.from('foods').select('*').or(or4); // *
      const rawB = await supabase.from('foods').select('id,name').or(or4)
        .order('pg_status', { ascending: true }); // order only
      const rawC = await supabase.from('foods').select('id,name').or(or4).limit(20); // limit only
      const rawD = await supabase.from('foods').select('id,name').or(or4)
        .order('pg_status', { ascending: true }).limit(20); // order + limit (no *)
      const rawE = await supabase.from('foods').select('*').or(or4)
        .order('pg_status', { ascending: true }); // * + order, no limit
      const rawF = await supabase.from('foods').select('*').or(or4).limit(20); // * + limit, no order
      const rawG = await supabase.from('foods').select('*').or(or4)
        .order('id', { ascending: true }).limit(20); // * + order id + limit
      const rawH = await supabase.from('foods').select('*').or(or4)
        .order('name', { ascending: true }).limit(20); // * + order name + limit
      const rawI = await supabase.from('foods').select('id,name,name_kana,pg_status,serving_units').or(or4)
        .order('pg_status', { ascending: true }).limit(20); // narrow select + order + limit

      return NextResponse.json({
        ...result,
        _debug: {
          q,
          q_codepoints: Array.from(q).map((c) => c.codePointAt(0)?.toString(16)),
          variants,
          or2_clause: or2,
          or2_count: raw2c.data?.length ?? 0,
          or2_err: raw2c.error?.message ?? null,
          or4_clause: or4,
          or4_count: raw4c.data?.length ?? 0,
          or4_err: raw4c.error?.message ?? null,
          full_count: rawFull.data?.length ?? 0,
          full_err: rawFull.error?.message ?? null,
          full_names: (rawFull.data ?? []).slice(0, 3).map((r: any) => r.name),
          A_starOnly: { c: rawA.data?.length ?? 0, e: rawA.error?.message ?? null },
          B_orderOnly: { c: rawB.data?.length ?? 0, e: rawB.error?.message ?? null },
          C_limitOnly: { c: rawC.data?.length ?? 0, e: rawC.error?.message ?? null },
          D_orderLimit: { c: rawD.data?.length ?? 0, e: rawD.error?.message ?? null },
          E_starOrder: { c: rawE.data?.length ?? 0, e: rawE.error?.message ?? null },
          F_starLimit: { c: rawF.data?.length ?? 0, e: rawF.error?.message ?? null },
          G_starOrderId: { c: rawG.data?.length ?? 0, e: rawG.error?.message ?? null },
          H_starOrderName: { c: rawH.data?.length ?? 0, e: rawH.error?.message ?? null },
          I_narrowOrderLimit: { c: rawI.data?.length ?? 0, e: rawI.error?.message ?? null },
          searchFoods_foods: result.foods.length,
          searchFoods_first: result.foods.slice(0, 3).map((f: any) => f.name),
          node: process.version,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[foods/search] error', err);
    return NextResponse.json({ error: 'internal_error', detail: String(err) }, { status: 500 });
  }
}
