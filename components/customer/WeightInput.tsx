"use client";

import React from "react";
import { judgeDailyVariation } from "@/lib/utils/weight-analysis";

type Props = {
  morning: number | null;
  evening: number | null;
  onChange: (next: { morning: number | null; evening: number | null }) => void;
};

export default function WeightInput({ morning, evening, onChange }: Props) {
  const parse = (v: string): number | null => {
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  let judgement: { label: string; color: string; diff: number | null } = {
    label: "--",
    color: "text-[#888]",
    diff: null,
  };

  if (morning != null && evening != null) {
    try {
      const result: any = judgeDailyVariation(morning, evening);
      const diff = evening - morning;
      const status =
        result?.status ?? result?.level ?? (Math.abs(diff) <= 0.8 ? "ok" : "warn");
      const color =
        status === "ok" || status === "good"
          ? "text-pg-green"
          : status === "warn" || status === "caution"
          ? "text-pg-orange"
          : "text-pg-red";
      judgement = {
        label: result?.message ?? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}kg`,
        color,
        diff,
      };
    } catch {
      const diff = evening - morning;
      judgement = {
        label: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}kg`,
        color: "text-[#888]",
        diff,
      };
    }
  }

  return (
    <div>
      <div className="mx-3 flex gap-2.5">
        <div
          className={`flex-1 rounded-[12px] border bg-white p-3.5 text-center ${
            morning != null ? "border-pg-green bg-[#f8fdfb]" : "border-[#E8E6DF]"
          }`}
        >
          <label className="mb-1.5 block text-xs font-medium text-[#888]">
            朝の体重
          </label>
          <input
            type="number"
            step={0.1}
            value={morning ?? ""}
            placeholder="00.0"
            onChange={(e) => onChange({ morning: parse(e.target.value), evening })}
            className="w-full border-none bg-transparent text-center text-2xl font-semibold outline-none"
          />
          <div className="mt-0.5 text-xs text-[#888]">kg</div>
        </div>
        <div
          className={`flex-1 rounded-[12px] border bg-white p-3.5 text-center ${
            evening != null ? "border-pg-green bg-[#f8fdfb]" : "border-[#E8E6DF]"
          }`}
        >
          <label className="mb-1.5 block text-xs font-medium text-[#888]">
            晩の体重
          </label>
          <input
            type="number"
            step={0.1}
            value={evening ?? ""}
            placeholder="00.0"
            onChange={(e) => onChange({ morning, evening: parse(e.target.value) })}
            className="w-full border-none bg-transparent text-center text-2xl font-semibold outline-none"
          />
          <div className="mt-0.5 text-xs text-[#888]">kg</div>
        </div>
      </div>
      <div className="mx-3 mt-2.5 rounded-[12px] border border-[#E8E6DF] bg-white p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#888]">日内変動</span>
          <span className={`font-semibold ${judgement.color}`}>
            {judgement.label}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] text-[#888]">理想は800g以内</div>
      </div>
    </div>
  );
}
