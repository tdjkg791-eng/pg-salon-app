"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Food, BodyType, ServingUnit } from "@/lib/supabase/types";
import { judgeFoodForClient } from "@/lib/utils/food-status";

type Pfc = { protein: number; fat: number; carb: number };

type Props = {
  food: Food | null;
  bodyType?: BodyType | null;
  onAdd: (payload: { food: Food; quantityG: number; pfc: Pfc }) => void;
  onCancel?: () => void;
};

const GRAM_FALLBACK_QUICK = [50, 80, 100, 150, 200];

export default function FoodAddPanel({
  food,
  bodyType,
  onAdd,
  onCancel,
}: Props) {
  const servingUnits: ServingUnit[] = useMemo(() => {
    const raw = (food as any)?.serving_units;
    return Array.isArray(raw) ? raw : [];
  }, [food]);

  const commonUse: string | null = (food as any)?.common_use ?? null;

  // Default-selected unit index
  const defaultUnitIdx = useMemo(() => {
    if (servingUnits.length === 0) return -1;
    const idx = servingUnits.findIndex((u) => u.default);
    return idx >= 0 ? idx : 0;
  }, [servingUnits]);

  const [unitIdx, setUnitIdx] = useState<number>(defaultUnitIdx);
  const [count, setCount] = useState<number>(1);
  const [grams, setGrams] = useState<number>(100);

  // Reset when food changes
  useEffect(() => {
    setUnitIdx(defaultUnitIdx);
    setCount(1);
    if (defaultUnitIdx >= 0) {
      setGrams(servingUnits[defaultUnitIdx].grams);
    } else {
      setGrams(100);
    }
  }, [food, defaultUnitIdx, servingUnits]);

  // Re-sync grams when unit or count changes
  useEffect(() => {
    if (unitIdx >= 0 && unitIdx < servingUnits.length) {
      setGrams(Math.round(servingUnits[unitIdx].grams * count));
    }
  }, [unitIdx, count, servingUnits]);

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
  const hasUnits = servingUnits.length > 0;
  const activeUnit = unitIdx >= 0 ? servingUnits[unitIdx] : null;

  const handleCountDelta = (delta: number) => {
    setCount((c) => Math.max(1, c + delta));
  };

  const handleSelectUnit = (idx: number) => {
    setUnitIdx(idx);
    setCount(1);
  };

  // When the user edits grams directly we drop the unit selection
  const handleGramsChange = (v: number) => {
    setGrams(v);
    setUnitIdx(-1);
  };

  return (
    <div className="mx-3 mb-2.5 rounded-[12px] border-2 border-pg-green bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{food.name}</div>
      </div>

      {commonUse && (
        <div className="mb-2 rounded-lg bg-[#F3F7F5] px-2.5 py-1.5 text-[11px] text-[#4A5E56]">
          {commonUse}
        </div>
      )}

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

      {hasUnits && (
        <>
          <div className="mb-1.5 text-[10px] text-[#888]">1人前単位</div>
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {servingUnits.map((u, i) => {
              const selected = i === unitIdx;
              return (
                <button
                  key={`${u.label}-${i}`}
                  type="button"
                  onClick={() => handleSelectUnit(i)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                    selected
                      ? "border-pg-green bg-[#E1F5EE] text-[#0F6E56]"
                      : "border-[#D3D1C7] bg-white text-[#666]"
                  }`}
                >
                  {u.label}
                  <span className="ml-1 text-[9px] text-[#888]">
                    {u.grams}g
                  </span>
                </button>
              );
            })}
          </div>

          {activeUnit && (
            <div className="mb-2.5 flex items-center justify-between rounded-lg bg-[#FAFAF7] px-2.5 py-2">
              <div className="text-[12px] font-medium">
                {activeUnit.label}{" "}
                <span className="text-[#888]">× {count}</span>
                <span className="ml-2 text-[11px] text-[#888]">
                  ({grams}g)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCountDelta(-1)}
                  disabled={count <= 1}
                  className="h-7 w-7 rounded-full border border-[#D3D1C7] bg-white text-base leading-none disabled:opacity-40"
                  aria-label="個数を減らす"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => handleCountDelta(1)}
                  className="h-7 w-7 rounded-full border border-[#D3D1C7] bg-white text-base leading-none"
                  aria-label="個数を増やす"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="whitespace-nowrap text-xs text-[#888]">
          {hasUnits ? "グラム直接入力" : "分量"}
        </span>
        <input
          type="number"
          value={grams}
          min={0}
          step={1}
          onChange={(e) => handleGramsChange(Number(e.target.value) || 0)}
          className="flex-1 rounded-lg border border-[#D3D1C7] px-2.5 py-2 text-right text-base outline-none"
        />
        <span className="text-[13px] font-medium">g</span>
      </div>

      {!hasUnits && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {GRAM_FALLBACK_QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleGramsChange(q)}
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
      )}

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
