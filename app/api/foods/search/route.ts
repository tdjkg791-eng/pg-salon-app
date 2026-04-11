import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { searchFoods } from '@/lib/search/food-search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const limitParam = req.nextUrl.searchParams.get('limit');
  const category = req.nextUrl.searchParams.get('category');

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
    return NextResponse.json(result);
  } catch (err) {
    console.error('[foods/search] error', err);
    return NextResponse.json({ error: 'internal_error', detail: String(err) }, { status: 500 });
  }
}
