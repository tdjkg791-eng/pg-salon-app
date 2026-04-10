"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  judgeDailyVariation,
  proteinTarget,
} from "@/lib/utils/weight-analysis";
import PFCBar from "@/components/customer/PFCBar";
import MenstrualToggle from "@/components/customer/MenstrualToggle";

// TODO: replace with authenticated client id from LIFF
const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

type WeightLog = {
  date: string;
  morning_kg: number | null;
  evening_kg: number | null;
  is_menstrual: boolean | null;
};

type MealReport = {
  date: string;
  total_protein_g: number | null;
  total_fat_g: number | null;
  total_carb_g: number | null;
  day_complete: boolean | null;
};

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const jpDate = () => {
  const d = new Date();
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${w}）`;
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState<WeightLog | null>(null);
  const [meal, setMeal] = useState<MealReport | null>(null);
  const [menstrual, setMenstrual] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!supabase) {
          if (!cancelled) setLoading(false);
          return;
        }
        const date = todayStr();
        const [wRes, mRes] = await Promise.all([
          supabase
            .from("weight_logs")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .eq("date", date)
            .maybeSingle(),
          supabase
            .from("meal_reports")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .eq("date", date)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (wRes.data) {
          setWeight(wRes.data as any);
          setMenstrual(!!(wRes.data as any).is_menstrual);
        }
        if (mRes.data) setMeal(mRes.data as any);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "読み込みエラー");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const variation =
    weight?.morning_kg != null && weight?.evening_kg != null
      ? (() => {
          try {
            const r: any = judgeDailyVariation(
              weight.morning_kg!,
              weight.evening_kg!
            );
            return r?.message ?? `${(weight.evening_kg! - weight.morning_kg!).toFixed(1)}kg`;
          } catch {
            return `${(weight.evening_kg! - weight.morning_kg!).toFixed(1)}kg`;
          }
        })()
      : "--";

  const pTarget = weight?.morning_kg
    ? (() => {
        try {
          return Math.round(proteinTarget(weight.morning_kg!));
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const protein = meal?.total_protein_g ?? 0;
  const fat = meal?.total_fat_g ?? 0;
  const carb = meal?.total_carb_g ?? 0;

  const handleMenstrual = async (next: boolean) => {
    setMenstrual(next);
    if (!supabase) return;
    try {
      await supabase.from("weight_logs").upsert(
        {
          client_id: DEMO_CLIENT_ID,
          date: todayStr(),
          is_menstrual: next,
        },
        { onConflict: "client_id,date" }
      );
    } catch {
      // ignore
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center border-b border-[#E8E6DF] bg-white px-4 py-3">
        <div className="flex-1 text-[15px] font-semibold">
          Pg. ダイエットコース
        </div>
        <div className="text-xs text-[#888]">ホーム</div>
      </header>

      <div className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[#888]">
        <span>{jpDate()}</span>
      </div>

      <div className="px-4 py-2 text-[13px]">こんにちは、今日もがんばりましょう。</div>

      {loading && (
        <div className="mx-3 rounded-[12px] border border-[#E8E6DF] bg-white p-4 text-center text-xs text-[#888]">
          読み込み中…
        </div>
      )}

      {error && (
        <div className="mx-3 rounded-[12px] border border-pg-red/30 bg-[#FCEBEB] p-3 text-xs text-pg-red">
          {error}
        </div>
      )}

      {!loading && (
        <>
          <section className="mx-3 my-2.5 rounded-[12px] border border-[#E8E6DF] bg-white p-3.5">
            <div className="mb-2.5 text-[13px] font-semibold">今日の体重</div>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-[11px] text-[#888]">朝</div>
                <div className="text-xl font-semibold">
                  {weight?.morning_kg != null
                    ? weight.morning_kg.toFixed(1)
                    : "--.-"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#888]">晩</div>
                <div className="text-xl font-semibold">
                  {weight?.evening_kg != null
                    ? weight.evening_kg.toFixed(1)
                    : "--.-"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#888]">日内変動</div>
                <div className="text-xl font-semibold">{variation}</div>
              </div>
            </div>
          </section>

          <section className="mx-3 my-2.5 rounded-[12px] border border-[#E8E6DF] bg-white p-3.5">
            <div className="mb-2.5 text-[13px] font-semibold">今日のPFC</div>
            <PFCBar
              protein={protein}
              fat={fat}
              carb={carb}
              proteinTarget={pTarget}
            />
            <div className="mt-2 flex items-center justify-between border-t border-[#F0EEE8] pt-2">
              <span className="text-[11px] text-[#888]">合計</span>
              <span className="text-base font-semibold">
                {Math.round(protein * 4 + fat * 9 + carb * 4)} kcal
              </span>
            </div>
          </section>

          <MenstrualToggle active={menstrual} onToggle={handleMenstrual} />

          <div className="mx-3 mt-3 flex gap-2">
            <Link
              href="/weight"
              className="flex-1 rounded-[12px] border border-[#D3D1C7] bg-white py-3 text-center text-xs font-semibold text-[#5F5E5A]"
            >
              体重を記録
            </Link>
            <Link
              href="/meal"
              className="flex-1 rounded-[12px] border border-[#D3D1C7] bg-white py-3 text-center text-xs font-semibold text-[#5F5E5A]"
            >
              食事を記録
            </Link>
          </div>
        </>
      )}
    </>
  );
}
