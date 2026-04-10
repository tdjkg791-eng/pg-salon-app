"use client";

import React, { useEffect, useState } from "react";
import type { Food } from "@/lib/supabase/types";
import StatusBadge, { BodyTypeBadge } from "./StatusBadge";

type Props = {
  onSelect: (food: Food) => void;
  bodyType?: string | null;
};

export default function FoodSearch({ onSelect, bodyType }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setSuggestions([]);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/foods/search?q=${encodeURIComponent(q)}`
        );
        if (!res.ok) throw new Error("検索に失敗しました");
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
          setSuggestions([]);
        } else {
          setResults(data.foods ?? []);
          setSuggestions(data.suggestions ?? []);
        }
      } catch (e: any) {
        setError(e?.message ?? "エラー");
        setResults([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const statusOf = (food: any): "ok" | "ng" | "limited" => {
    const s = (food.pg_status ?? "ok") as string;
    if (s === "ng") return "ng";
    if (s === "limited" || s === "caution") return "limited";
    return "ok";
  };

  const isBodyNg = (food: any) => {
    if (!bodyType) return false;
    const ngList: string[] = food.body_type_ng ?? food.ng_body_types ?? [];
    return Array.isArray(ngList) && ngList.includes(bodyType);
  };

  const renderItem = (food: any, opts?: { suggested?: boolean }) => (
    <li
      key={`${opts?.suggested ? "s-" : ""}${food.id}`}
      onClick={() => onSelect(food)}
      className="mb-1.5 flex cursor-pointer items-center justify-between rounded-[10px] border border-[#E8E6DF] bg-white px-3 py-2.5"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{food.name}</div>
        <div className="text-[10px] text-[#888]">
          100gあたり P{food.protein_g ?? 0}g / F{food.fat_g ?? 0}g / C
          {food.carb_g ?? 0}g
        </div>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1">
        <StatusBadge status={statusOf(food)} />
        {isBodyNg(food) && <BodyTypeBadge />}
      </div>
    </li>
  );

  const hasResults = results.length > 0;
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="space-y-2">
      <div className="mx-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="食品を検索…"
          className="w-full rounded-[10px] border border-[#D3D1C7] bg-white px-3 py-2.5 text-sm outline-none focus:border-pg-green"
        />
      </div>
      {loading && <div className="mx-3 text-xs text-[#888]">検索中…</div>}
      {error && <div className="mx-3 text-xs text-pg-red">{error}</div>}
      {!loading && !error && q && !hasResults && !hasSuggestions && (
        <div className="mx-3 text-xs text-[#888]">結果がありません</div>
      )}

      {hasResults && (
        <ul className="mx-3">{results.map((f) => renderItem(f))}</ul>
      )}

      {hasSuggestions && (
        <div className="mx-3 mt-2 rounded-[12px] bg-[#F2F1EB] px-2.5 pb-2 pt-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 px-1">
            <span className="text-[11px] font-semibold text-[#555]">
              もしかして？
            </span>
            <span className="text-[10px] text-[#888]">関連する食品</span>
          </div>
          <ul>
            {suggestions.map((f) => renderItem(f, { suggested: true }))}
          </ul>
        </div>
      )}
    </div>
  );
}
