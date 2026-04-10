import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSynonyms, getCategoryHint } from '@/lib/utils/food-synonyms';

export const dynamic = 'force-dynamic';

const MIN_DIRECT_HITS = 3;
const MAX_SUGGESTIONS = 15;

type Food = Record<string, any>;
type Supa = ReturnType<typeof createServerClient>;

function sanitizePattern(q: string): string {
  return q.replace(/[%,]/g, ' ').trim();
}

async function searchByKeyword(
  supabase: Supa,
  keyword: string,
  category: string | null,
  limit: number
): Promise<Food[]> {
  const safe = sanitizePattern(keyword);
  if (!safe) return [];
  const pattern = `%${safe}%`;

  let query = supabase
    .from('foods')
    .select('*')
    .or(`name.ilike.${pattern},name_kana.ilike.${pattern}`)
    .order('pg_status', { ascending: true })
    .limit(limit);

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function searchByCategory(
  supabase: Supa,
  category: string,
  limit: number
): Promise<Food[]> {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('category', category)
    .order('pg_status', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const limitParam = req.nextUrl.searchParams.get('limit');
  const category = req.nextUrl.searchParams.get('category');

  if (q.length < 1) {
    return NextResponse.json({ foods: [], suggestions: [] });
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

    // Stage 1: direct substring match
    const foods = await searchByKeyword(supabase, q, category, limit);

    // If we already have enough results, return early
    if (foods.length >= MIN_DIRECT_HITS) {
      return NextResponse.json({ foods, suggestions: [], expanded_from: null });
    }

    const seenIds = new Set(foods.map((f) => f.id));
    const suggestions: Food[] = [];
    let expandedKeyword: string | null = null;
    let expandedSource: 'synonym' | 'category' | null = null;

    // Stage 2: synonym expansion
    const synonyms = getSynonyms(q);
    if (synonyms.length > 0) {
      expandedKeyword = q;
      expandedSource = 'synonym';
      for (const kw of synonyms) {
        if (suggestions.length >= MAX_SUGGESTIONS) break;
        try {
          const rows = await searchByKeyword(supabase, kw, category, 5);
          for (const row of rows) {
            if (seenIds.has(row.id)) continue;
            seenIds.add(row.id);
            suggestions.push(row);
            if (suggestions.length >= MAX_SUGGESTIONS) break;
          }
        } catch (e) {
          console.error('[foods/search] synonym lookup failed', kw, e);
        }
      }
    }

    // Stage 3: category fallback (only if still empty — both direct and synonym)
    if (foods.length === 0 && suggestions.length === 0) {
      const hint = getCategoryHint(q);
      if (hint) {
        expandedKeyword = q;
        expandedSource = 'category';
        try {
          const rows = await searchByCategory(supabase, hint, MAX_SUGGESTIONS);
          for (const row of rows) {
            if (seenIds.has(row.id)) continue;
            seenIds.add(row.id);
            suggestions.push(row);
          }
        } catch (e) {
          console.error('[foods/search] category lookup failed', hint, e);
        }
      }
    }

    return NextResponse.json({
      foods,
      suggestions,
      expanded_from: expandedKeyword
        ? { keyword: expandedKeyword, source: expandedSource }
        : null,
    });
  } catch (err) {
    console.error('[foods/search] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
