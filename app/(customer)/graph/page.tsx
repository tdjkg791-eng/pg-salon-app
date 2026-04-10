"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import WeightGraph, {
  type WeightPoint,
} from "@/components/customer/WeightGraph";

// TODO: replace with authenticated client id from LIFF
const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

type Row = {
  date: string;
  morning_kg: number | null;
  evening_kg: number | null;
  is_menstrual: boolean | null;
  is_treatment_day?: boolean | null;
};

type Client = {
  start_weight_kg: number | null;
  target_weight_kg: number | null;
};

export default function GraphPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [client, setClient] = useState<Client | null>(null);

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
        const [wRes, cRes] = await Promise.all([
          supabase
            .from("weight_logs")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .order("date", { ascending: true })
            .limit(60),
          supabase
            .from("clients")
            .select("start_weight_kg, target_weight_kg")
            .eq("id", DEMO_CLIENT_ID)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (wRes.data) setRows(wRes.data as any);
        if (cRes.data) setClient(cRes.data as any);
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

  const points: WeightPoint[] = rows.map((r) => ({
    date: r.date,
    morning: r.morning_kg,
    evening: r.evening_kg,
    isTreatment: !!r.is_treatment_day,
    isMenstrual: !!r.is_menstrual,
  }));

  const latestMorning = [...rows]
    .reverse()
    .find((r) => r.morning_kg != null)?.morning_kg;
  const start = client?.start_weight_kg ?? null;
  const target = client?.target_weight_kg ?? null;
  const current = latestMorning ?? null;
  const lost = start != null && current != null ? start - current : null;
  const toGo = target != null && current != null ? current - target : null;

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center border-b border-[#E8E6DF] bg-white px-4 py-3">
        <div className="flex-1 text-[15px] font-semibold">体重推移グラフ</div>
      </header>

      {loading && (
        <div className="mx-3 mt-3 text-center text-xs text-[#888]">
          読み込み中…
        </div>
      )}
      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-[#FCEBEB] p-2 text-xs text-pg-red">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-3">
            <WeightGraph data={points} />
          </div>

          <section className="mx-3 my-3 rounded-[12px] border border-[#E8E6DF] bg-white p-3.5">
            <div className="mb-2 text-[13px] font-semibold">サマリー</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#F5F4F0] p-2">
                <div className="text-[10px] text-[#888]">開始体重</div>
                <div className="text-base font-semibold">
                  {start != null ? `${start.toFixed(1)} kg` : "--"}
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F4F0] p-2">
                <div className="text-[10px] text-[#888]">現在</div>
                <div className="text-base font-semibold">
                  {current != null ? `${current.toFixed(1)} kg` : "--"}
                </div>
              </div>
              <div className="rounded-lg bg-[#E1F5EE] p-2">
                <div className="text-[10px] text-[#0F6E56]">減量幅</div>
                <div className="text-base font-semibold text-[#0F6E56]">
                  {lost != null ? `-${lost.toFixed(1)} kg` : "--"}
                </div>
              </div>
              <div className="rounded-lg bg-[#FAEEDA] p-2">
                <div className="text-[10px] text-[#854F0B]">目標まで</div>
                <div className="text-base font-semibold text-[#854F0B]">
                  {toGo != null ? `${toGo.toFixed(1)} kg` : "--"}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
