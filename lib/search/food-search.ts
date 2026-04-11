/**
 * Pure food search pipeline. Callable from both the Next.js API route
 * and the offline test runner — both pass a SupabaseClient instance.
 *
 * Pipeline:
 *   1. Direct substring match with kana-variant OR against name / name_kana
 *   2. If < MIN_DIRECT_HITS: expand query via synonym dictionary and re-query
 *   3. If still 0: fall back to category hint
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSynonyms, getCategoryHint } from '@/lib/utils/food-synonyms';
import { expandQueryVariants, normalize } from '@/lib/utils/kana-convert';

export type Food = Record<string, any>;

export type SearchResult = {
  foods: Food[];
  suggestions: Food[];
  expanded_from: { keyword: string; source: 'synonym' | 'category' } | null;
};

export type SearchOptions = {
  category?: string | null;
  limit?: number;
};

const MIN_DIRECT_HITS = 3;
const MAX_SUGGESTIONS = 15;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function escapePattern(s: string): string {
  // PostgREST or-filter treats , and % specially in LIKE patterns.
  // Also strip () and other characters that can break the or() grammar.
  return s.replace(/[%,()]/g, ' ').trim();
}

async function queryByKeyword(
  supabase: SupabaseClient,
  keyword: string,
  category: string | null,
  limit: number
): Promise<Food[]> {
  const safe = escapePattern(keyword);
  if (!safe) return [];

  const variants = expandQueryVariants(safe)
    .map(escapePattern)
    .filter((v) => v.length > 0);

  // Build OR clause covering both name and name_kana for every variant.
  const conditions: string[] = [];
  const seen = new Set<string>();
  for (const v of variants) {
    if (seen.has(v)) continue;
    seen.add(v);
    const pattern = `%${v}%`;
    conditions.push(`name.ilike.${pattern}`);
    conditions.push(`name_kana.ilike.${pattern}`);
  }
  if (conditions.length === 0) return [];

  let query = supabase
    .from('foods')
    .select('*')
    .or(conditions.join(','))
    .order('pg_status', { ascending: true })
    .limit(limit);

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function queryByCategory(
  supabase: SupabaseClient,
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

/**
 * Split a multi-token query like "鶏 むね" into tokens and intersect results
 * (AND semantics). Returns the direct matches for each token intersected.
 */
async function queryMultiToken(
  supabase: SupabaseClient,
  tokens: string[],
  category: string | null,
  limit: number
): Promise<Food[]> {
  if (tokens.length === 0) return [];
  if (tokens.length === 1) return queryByKeyword(supabase, tokens[0], category, limit);

  // Fetch results for the most selective token first (longest token = most specific)
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const first = await queryByKeyword(supabase, sorted[0], category, limit * 3);

  // Then filter client-side by remaining tokens (substring match on name or name_kana,
  // with kana variants).
  const rest = sorted.slice(1);
  const filtered = first.filter((row) => {
    const haystackRaw = `${row.name ?? ''} ${row.name_kana ?? ''}`;
    const haystack = normalize(haystackRaw);
    return rest.every((tok) => {
      const variants = expandQueryVariants(tok);
      return variants.some((v) => haystack.includes(v));
    });
  });
  return filtered.slice(0, limit);
}

export async function searchFoods(
  supabase: SupabaseClient,
  rawQ: string,
  opts: SearchOptions = {}
): Promise<SearchResult> {
  const q = rawQ.trim();
  if (!q) return { foods: [], suggestions: [], expanded_from: null };

  const category = opts.category ?? null;
  const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  // Stage 1: direct search (multi-token aware)
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  const foods =
    tokens.length > 1
      ? await queryMultiToken(supabase, tokens, category, limit)
      : await queryByKeyword(supabase, q, category, limit);

  if (foods.length >= MIN_DIRECT_HITS) {
    return { foods, suggestions: [], expanded_from: null };
  }

  const seen = new Set(foods.map((f) => f.id));
  const suggestions: Food[] = [];
  let expandedKeyword: string | null = null;
  let expandedSource: 'synonym' | 'category' | null = null;

  // Stage 2: synonym expansion. Try the original query, then each token.
  const synonymKeys = [q, ...tokens];
  for (const key of synonymKeys) {
    const syns = getSynonyms(key);
    if (syns.length === 0) continue;
    expandedKeyword = key;
    expandedSource = 'synonym';
    for (const kw of syns) {
      if (suggestions.length >= MAX_SUGGESTIONS) break;
      try {
        const rows = await queryByKeyword(supabase, kw, category, 5);
        for (const row of rows) {
          if (seen.has(row.id)) continue;
          seen.add(row.id);
          suggestions.push(row);
          if (suggestions.length >= MAX_SUGGESTIONS) break;
        }
      } catch (e) {
        console.error('[food-search] synonym lookup failed', kw, e);
      }
    }
    if (suggestions.length > 0) break;
  }

  // Stage 3: category fallback (only if still empty everywhere)
  if (foods.length === 0 && suggestions.length === 0) {
    for (const key of synonymKeys) {
      const hint = getCategoryHint(key);
      if (!hint) continue;
      expandedKeyword = key;
      expandedSource = 'category';
      try {
        const rows = await queryByCategory(supabase, hint, MAX_SUGGESTIONS);
        for (const row of rows) {
          if (seen.has(row.id)) continue;
          seen.add(row.id);
          suggestions.push(row);
        }
      } catch (e) {
        console.error('[food-search] category lookup failed', hint, e);
      }
      if (suggestions.length > 0) break;
    }
  }

  return {
    foods,
    suggestions,
    expanded_from: expandedKeyword
      ? { keyword: expandedKeyword, source: expandedSource! }
      : null,
  };
}
