"use client";

import React, { useMemo, useState } from "react";
import type { Food, BodyType } from "@/lib/supabase/types";
import { judgeFoodForClient } from "@/lib/utils/food-status";

type Pfc = { protein: number; fat: number; carb: number };

type Props = {
  food: Food | null;
  bodyType?: BodyType | null;
  onAdd: (payload: { food: Food; quantityG: number; pfc: Pfc }) => void;
  onCancel?: () => void;
};

const QUICK = [50, 80, 100, 150, 200];

export default function FoodAddPanel({
  food,
  bodyType,
  onAdd,
  onCancel,
}: Props) {
  const [grams, setGrams] = useState<number>(100);

  const judged = useMemo(() => {
    if (!food) return null;
    try {
      return judgeFoodForClient(food as any, bodyType as any);
    } catch {
      return null;
    }
  }, [food, bodyType]);

  const pfc: Pfc = useMemo(() => {
    if (!food) return { protein: 0, fat: 0, carb: 0 };
    const ratio = grams / 100;
    return {
      protein: Math.round(((food as any).protein_g ?? 0) * ratio * 10) / 10,
      fat: Math.round(((food as any).fat_g ?? 0) * ratio * 10) / 10,
      carb: Math.round(((food as any).carb_g ?? 0) * ratio * 10) / 10,
    };
  }, [food, grams]);

  const kcal = Math.round(pfc.protein * 4 + pfc.fat * 9 + pfc.carb * 4);

  if (!food) return null;

  const isNg = (food as any).pg_status === "ng" || judged?.canRegister === false;
  const bodyWarning = judged?.bodyWarning ?? null;

  return (
    <div className="mx-3 mb-2.5 rounded-[12px] border-2 border-pg-green bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{food.name}</div>
      </div>

      {isNg && (
        <div className="mb-2 rounded-lg bg-[#FCEBEB] px-2.5 py-1.5 text-[11px] font-medium text-pg-red">
          この食品はPg.プログラムでNGです。カラダの変化が止まる原因になります。
        </div>
      )}

      {bodyWarning && (
        <div className="mb-2 rounded-lg bg-[#EEEDFE] px-2.5 py-1.5 text-[11px] font-medium text-pg-purple">
          {bodyWarning}
        </div>
      )}

      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="whitespace-nowrap text-xs text-[#888]">分量</span>
        <input
          type="number"
          value={grams}
          min={0}
          step={1}
          onChange={(e) => setGrams(Number(e.target.value) || 0)}
          className="flex-1 rounded-lg border border-[#D3D1C7] px-2.5 py-2 text-right text-base outline-none"
        />
        <span className="text-[13px] font-medium">g</span>
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setGrams(q)}
            className={`rounded-md border px-3 py-1 text-[11px] font-medium ${
              grams === q
                ? "border-pg-green bg-[#E1F5EE] text-[#0F6E56]"
                : "border-[#D3D1C7] bg-white text-[#888]"
            }`}
          >
            {q}g
          </button>
        ))}
      </div>

      <div className="mb-2.5 flex justify-around border-y border-[#F0EEE8] py-2">
        <div className="text-center">
          <div className="text-[10px] text-[#888]">P</div>
          <div className="text-sm font-semibold">{pfc.protein.toFixed(1)}g</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#888]">F</div>
          <div className="text-sm font-semibold">{pfc.fat.toFixed(1)}g</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#888]">C</div>
          <div className="text-sm font-semibold">{pfc.carb.toFixed(1)}g</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#888]">kcal</div>
          <div className="text-sm font-semibold">{kcal}</div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[10px] border border-[#D3D1C7] bg-white py-2.5 text-[13px] text-[#888]"
          >
            キャンセル
          </button>
        )}
        <button
          type="button"
          disabled={isNg || grams <= 0}
          onClick={() => onAdd({ food, quantityG: grams, pfc })}
          className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold text-white ${
            isNg || grams <= 0 ? "bg-[#D3D1C7]" : "bg-pg-green"
          }`}
        >
          登録
        </button>
      </div>
    </div>
  );
}
