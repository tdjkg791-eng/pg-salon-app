import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const AI_FALLBACK_THRESHOLD = 3;
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

type Food = Record<string, any>;

function sanitizePattern(q: string): string {
  return q.replace(/[%,]/g, ' ').trim();
}

async function searchFoods(
  supabase: ReturnType<typeof createServerClient>,
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

async function expandKeywordWithClaude(keyword: string): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[foods/search] ANTHROPIC_API_KEY not set, skipping AI fallback');
    return [];
  }

  const prompt = `ユーザーが食品検索で「${keyword}」と入力しました。
これに該当する具体的な食品名を5〜10個、JSON配列で返してください。
日本食品標準成分表に載っている一般的な食品名を使ってください。
返答例: ["たら", "ひらめ", "すずき", "たい", "かれい"]

JSONのみを返してください。説明は不要。`;

  try {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error('[foods/search] Claude API error', res.status, await res.text());
      return [];
    }

    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = json.content?.find((c) => c.type === 'text')?.text ?? '';

    // Extract JSON array from response (may be wrapped in prose or code fence)
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 10);
  } catch (err) {
    console.error('[foods/search] Claude fetch failed', err);
    return [];
  }
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
    const foods = await searchFoods(supabase, q, category, limit);

    // AI fallback: < 3 results → expand keyword via Claude and re-search
    let suggestions: Food[] = [];
    let expandedKeywords: string[] = [];
    if (foods.length < AI_FALLBACK_THRESHOLD) {
      expandedKeywords = await expandKeywordWithClaude(q);

      if (expandedKeywords.length > 0) {
        const seenIds = new Set(foods.map((f) => f.id));
        const collected: Food[] = [];

        for (const kw of expandedKeywords) {
          if (collected.length >= 15) break;
          try {
            const rows = await searchFoods(supabase, kw, category, 5);
            for (const row of rows) {
              if (seenIds.has(row.id)) continue;
              seenIds.add(row.id);
              collected.push(row);
              if (collected.length >= 15) break;
            }
          } catch (e) {
            console.error('[foods/search] expanded lookup failed', kw, e);
          }
        }
        suggestions = collected;
      }
    }

    return NextResponse.json({
      foods,
      suggestions,
      ai_keywords: expandedKeywords,
    });
  } catch (err) {
    console.error('[foods/search] error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
