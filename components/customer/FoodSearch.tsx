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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
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
        setResults(Array.isArray(data) ? data : data.foods ?? []);
      } catch (e: any) {
        setError(e?.message ?? "エラー");
        setResults([]);
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
      {loading && (
        <div className="mx-3 text-xs text-[#888]">検索中…</div>
      )}
      {error && <div className="mx-3 text-xs text-pg-red">{error}</div>}
      {!loading && !error && q && results.length === 0 && (
        <div className="mx-3 text-xs text-[#888]">結果がありません</div>
      )}
      <ul>
        {results.map((food: any) => (
          <li
            key={food.id}
            onClick={() => onSelect(food)}
            className="mx-3 mb-1.5 flex cursor-pointer items-center justify-between rounded-[10px] border border-[#E8E6DF] bg-white px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">
                {food.name}
              </div>
              <div className="text-[10px] text-[#888]">
                100gあたり P{food.protein_g ?? 0}g / F{food.fat_g ?? 0}g / C
                {food.carb_g ?? 0}g
              </div>
            </div>
            <div className="ml-2 flex shrink-0 gap-1">
              <StatusBadge status={statusOf(food)} />
              {isBodyNg(food) && <BodyTypeBadge />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
