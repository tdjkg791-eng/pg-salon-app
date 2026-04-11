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
      // Debug probe — independent raw queries to compare against searchFoods output
      const variants = expandQueryVariants(q);
      const raw1 = await supabase.from('foods').select('id,name')
        .or(`name.ilike.%${q}%,name_kana.ilike.%${q}%`);
      const raw2 = await supabase.from('foods').select('id,name').ilike('name', `%${q}%`);
      const raw3 = await supabase.from('foods').select('id,name').ilike('name_kana', `%${q}%`);
      return NextResponse.json({
        ...result,
        _debug: {
          q,
          q_codepoints: Array.from(q).map((c) => c.codePointAt(0)?.toString(16)),
          variants,
          variants_codepoints: variants.map((v) => Array.from(v).map((c) => c.codePointAt(0)?.toString(16))),
          raw_or_count: raw1.data?.length ?? 0,
          raw_or_error: raw1.error?.message ?? null,
          raw_or_names: (raw1.data ?? []).slice(0, 3).map((r: any) => r.name),
          raw_name_only_count: raw2.data?.length ?? 0,
          raw_name_kana_only_count: raw3.data?.length ?? 0,
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
