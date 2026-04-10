"use client";

import Link from "next/link";
import React from "react";

type Entry = {
  id: string;
  name: string;
  quantity_g: number;
  kcal?: number;
};

type Props = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  entries?: Entry[];
};

const LABEL: Record<Props["mealType"], { icon: string; name: string }> = {
  breakfast: { icon: "◐", name: "朝食" },
  lunch: { icon: "◑", name: "昼食" },
  dinner: { icon: "◒", name: "夕食" },
  snack: { icon: "◓", name: "間食" },
};

export default function MealSlot({ mealType, entries = [] }: Props) {
  const meta = LABEL[mealType];
  const totalKcal = entries.reduce((s, e) => s + (e.kcal ?? 0), 0);

  return (
    <Link
      href={`/meal/${mealType}`}
      className="mx-3 mb-2 block rounded-[12px] border border-[#E8E6DF] bg-white px-3.5 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{meta.icon}</span>
          <span className="text-[13px] font-semibold">{meta.name}</span>
          <span className="text-[11px] text-[#888]">
            {entries.length > 0 ? `${entries.length}件` : "未記録"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalKcal > 0 && (
            <span className="text-[11px] text-[#888]">{totalKcal} kcal</span>
          )}
          <span className="text-[#ccc]">›</span>
        </div>
      </div>
      {entries.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {entries.slice(0, 4).map((e) => (
            <span
              key={e.id}
              className="rounded bg-[#F5F4F0] px-1.5 py-0.5 text-[10px] text-[#5F5E5A]"
            >
              {e.name} {e.quantity_g}g
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
