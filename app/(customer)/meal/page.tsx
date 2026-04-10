"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import MealSlot from "@/components/customer/MealSlot";
import PFCBar from "@/components/customer/PFCBar";

// TODO: replace with authenticated client id from LIFF
const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

type Entry = {
  id: string;
  meal_type: MealType;
  food_name: string;
  quantity_g: number;
  protein_g: number | null;
  fat_g: number | null;
  carb_g: number | null;
  kcal: number | null;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function MealHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dayComplete, setDayComplete] = useState(false);
  const [saving, setSaving] = useState(false);

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
        const [eRes, rRes] = await Promise.all([
          supabase
            .from("meal_entries")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .eq("date", date),
          supabase
            .from("meal_reports")
            .select("day_complete")
            .eq("client_id", DEMO_CLIENT_ID)
            .eq("date", date)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (eRes.data) setEntries(eRes.data as any);
        if (rRes.data) setDayComplete(!!(rRes.data as any).day_complete);
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

  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const byType = (t: MealType) =>
    entries
      .filter((e) => e.meal_type === t)
      .map((e) => ({
        id: e.id,
        name: e.food_name,
        quantity_g: e.quantity_g,
        kcal: e.kcal ?? 0,
      }));

  const totals = entries.reduce(
    (acc, e) => ({
      protein: acc.protein + (e.protein_g ?? 0),
      fat: acc.fat + (e.fat_g ?? 0),
      carb: acc.carb + (e.carb_g ?? 0),
    }),
    { protein: 0, fat: 0, carb: 0 }
  );

  const handleComplete = async () => {
    setSaving(true);
    try {
      if (supabase) {
        await supabase.from("meal_reports").upsert(
          {
            client_id: DEMO_CLIENT_ID,
            date: todayStr(),
            day_complete: true,
          },
          { onConflict: "client_id,date" }
        );
      }
      setDayComplete(true);
    } catch (e: any) {
      setError(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center border-b border-[#E8E6DF] bg-white px-4 py-3">
        <div className="flex-1 text-[15px] font-semibold">食事記録</div>
      </header>

      <section className="mx-3 my-2.5 rounded-[12px] border border-[#E8E6DF] bg-white p-3.5">
        <div className="mb-2.5 text-[13px] font-semibold">今日のPFC合計</div>
        <PFCBar
          protein={totals.protein}
          fat={totals.fat}
          carb={totals.carb}
        />
      </section>

      {loading && (
        <div className="mx-3 text-center text-xs text-[#888]">読み込み中…</div>
      )}
      {error && (
        <div className="mx-3 rounded-lg bg-[#FCEBEB] p-2 text-xs text-pg-red">
          {error}
        </div>
      )}

      {!loading &&
        mealTypes.map((t) => (
          <MealSlot key={t} mealType={t} entries={byType(t)} />
        ))}

      <button
        type="button"
        disabled={dayComplete || saving}
        onClick={handleComplete}
        className={`mx-3 mt-3 block w-[calc(100%-24px)] rounded-[12px] py-3 text-center text-sm font-semibold text-white ${
          dayComplete || saving ? "bg-[#D3D1C7]" : "bg-pg-green"
        }`}
      >
        {dayComplete ? "今日の記録は完了しました" : "今日はこれで終わりです"}
      </button>
    </>
  );
}
