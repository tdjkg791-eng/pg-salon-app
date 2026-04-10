import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const limitParam = req.nextUrl.searchParams.get('limit');
  const category = req.nextUrl.searchParams.get('category');

  if (q.length < 1) {
    return NextResponse.json({ foods: [] });
  }

  let limit = 20;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 50);
    }
  }

  // Escape % and , which have special meaning in PostgREST or-filter
  const safe = q.replace(/[%,]/g, ' ').trim();
  const pattern = `%${safe}%`;

  try {
    const supabase = createServerClient();
    let query = supabase
      .from('foods')
      .select('*')
      .or(`name.ilike.${pattern},name_kana.ilike.${pattern}`)
      .order('pg_status', { ascending: true })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[foods/search] db error', error);
      return NextResponse.json({ error: 'database_error' }, { status: 500 });
    }

    return NextResponse.json({ foods: data ?? [] });
  } catch (err) {
    console.error('[foods/search] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
