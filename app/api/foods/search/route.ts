import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { searchFoods } from '@/lib/search/food-search';

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

    if (debug) {
      // Basic connectivity test
      const healthCheck = await supabase.from('foods').select('id').limit(1);

      // Simple name search
      const nameSearch = await supabase.from('foods').select('id,name').ilike('name', `%${q}%`).limit(5);

      // Check if any foods exist at all
      const totalCount = await supabase.from('foods').select('id', { count: 'exact' }).limit(1);

      return NextResponse.json({
        debug: true,
        q,
        health_check: {
          error: healthCheck.error?.message ?? null,
          has_data: (healthCheck.data?.length ?? 0) > 0
        },
        name_search: {
          error: nameSearch.error?.message ?? null,
          count: nameSearch.data?.length ?? 0,
          names: (nameSearch.data ?? []).map(r => r.name)
        },
        total_foods: {
          error: totalCount.error?.message ?? null,
          count: totalCount.count ?? 0
        },
        env_check: {
          has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          node_env: process.env.NODE_ENV
        }
      });
    }

    const result = await searchFoods(supabase, q, { category, limit });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[foods/search] error', err);
    return NextResponse.json({ error: 'internal_error', detail: String(err) }, { status: 500 });
  }
}
