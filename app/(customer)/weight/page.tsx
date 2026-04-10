"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import WeightInput from "@/components/customer/WeightInput";

// TODO: replace with authenticated client id from LIFF
const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";

type WeightLog = {
  date: string;
  morning_kg: number | null;
  evening_kg: number | null;
  is_menstrual: boolean | null;
  is_treatment_day?: boolean | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => dateStr(new Date());
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
};

export default function WeightPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [morning, setMorning] = useState<number | null>(null);
  const [evening, setEvening] = useState<number | null>(null);
  const [prevMorning, setPrevMorning] = useState<number | null>(null);
  const [history, setHistory] = useState<WeightLog[]>([]);

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
        const [tRes, pRes, hRes] = await Promise.all([
          supabase
            .from("weight_logs")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .eq("date", todayStr())
            .maybeSingle(),
          supabase
            .from("weight_logs")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .eq("date", yesterdayStr())
            .maybeSingle(),
          supabase
            .from("weight_logs")
            .select("*")
            .eq("client_id", DEMO_CLIENT_ID)
            .order("date", { ascending: false })
            .limit(14),
        ]);
        if (cancelled) return;
        if (tRes.data) {
          const t = tRes.data as any;
          setMorning(t.morning_kg ?? null);
          setEvening(t.evening_kg ?? null);
        }
        if (pRes.data) {
          setPrevMorning((pRes.data as any).morning_kg ?? null);
        }
        if (hRes.data) setHistory(hRes.data as any);
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

  const diffFromPrev =
    morning != null && prevMorning != null ? morning - prevMorning : null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      if (!supabase) throw new Error("接続エラー");
      const { error: upErr } = await supabase.from("weight_logs").upsert(
        {
          client_id: DEMO_CLIENT_ID,
          date: todayStr(),
          morning_kg: morning,
          evening_kg: evening,
        },
        { onConflict: "client_id,date" }
      );
      if (upErr) throw upErr;
      setSaved(true);
    } catch (e: any) {
      setError(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center border-b border-[#E8E6DF] bg-white px-4 py-3">
        <Link href="/home" className="mr-2.5 text-xl text-[#888]">
          ←
        </Link>
        <div className="flex-1 text-[15px] font-semibold">体重記録</div>
      </header>

      {loading && (
        <div className="mx-3 mt-3 text-center text-xs text-[#888]">
          読み込み中…
        </div>
      )}

      {!loading && (
        <>
          <div className="mt-3">
            <WeightInput
              morning={morning}
              evening={evening}
              onChange={({ morning: m, evening: ev }) => {
                setMorning(m);
                setEvening(ev);
              }}
            />
          </div>

          {diffFromPrev != null && (
            <div className="mx-3 mt-2.5 rounded-[12px] border border-[#E8E6DF] bg-white p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#888]">前日朝との差</span>
                <span
                  className={`font-semibold ${
                    diffFromPrev <= 0 ? "text-pg-green" : "text-pg-orange"
                  }`}
                >
                  {diffFromPrev >= 0 ? "+" : ""}
                  {diffFromPrev.toFixed(1)} kg
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-3 mt-2 rounded-lg bg-[#FCEBEB] p-2 text-xs text-pg-red">
              {error}
            </div>
          )}
          {saved && (
            <div className="mx-3 mt-2 rounded-lg bg-[#E1F5EE] p-2 text-xs text-[#0F6E56]">
              保存しました
            </div>
          )}

          <button
            type="button"
            disabled={saving || (morning == null && evening == null)}
            onClick={handleSave}
            className={`mx-3 mt-3 block w-[calc(100%-24px)] rounded-[12px] py-3 text-sm font-semibold text-white ${
              saving || (morning == null && evening == null)
                ? "bg-[#D3D1C7]"
                : "bg-pg-green"
            }`}
          >
            {saving ? "保存中…" : "保存する"}
          </button>

          <div className="mx-3 mt-4 text-[11px] font-semibold text-[#888]">
            過去の記録
          </div>
          <div className="mx-3 mt-1.5">
            {history.length === 0 && (
              <div className="rounded-[10px] border border-[#E8E6DF] bg-white px-3 py-3 text-xs text-[#888]">
                記録がありません
              </div>
            )}
            {history.map((h) => (
              <div
                key={h.date}
                className="mb-1.5 flex items-center justify-between rounded-[10px] border border-[#E8E6DF] bg-white px-3.5 py-2.5"
              >
                <div className="text-xs font-medium">
                  {h.date.slice(5)}
                  {h.is_treatment_day && (
                    <span className="ml-1.5 rounded bg-[#FAEEDA] px-1 py-0.5 text-[9px] text-[#854F0B]">
                      施術日
                    </span>
                  )}
                  {h.is_menstrual && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-pg-pink align-middle" />
                  )}
                </div>
                <div className="flex gap-3 text-xs text-[#888]">
                  <span>
                    朝 <b className="text-[#2C2C2A]">{h.morning_kg ?? "--"}</b>
                  </span>
                  <span>
                    晩 <b className="text-[#2C2C2A]">{h.evening_kg ?? "--"}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
