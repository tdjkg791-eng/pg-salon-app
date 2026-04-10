"use client";

import React from "react";

type Props = {
  protein: number;
  fat: number;
  carb: number;
  proteinTarget?: number;
};

export default function PFCBar({ protein, fat, carb, proteinTarget }: Props) {
  const total = Math.max(protein + fat + carb, 0.0001);
  const pPct = (protein / total) * 100;
  const fPct = (fat / total) * 100;
  const cPct = (carb / total) * 100;

  const achievement = proteinTarget
    ? Math.min(100, Math.round((protein / proteinTarget) * 100))
    : null;

  return (
    <div className="space-y-2">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8E6DF] flex">
        <div className="h-full bg-pg-green" style={{ width: `${pPct}%` }} />
        <div className="h-full bg-pg-orange" style={{ width: `${fPct}%` }} />
        <div className="h-full bg-pg-blue" style={{ width: `${cPct}%` }} />
      </div>
      <div className="flex justify-between text-[11px]">
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-pg-green mr-1" />
          <b>P</b> {protein.toFixed(1)}g
        </div>
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-pg-orange mr-1" />
          <b>F</b> {fat.toFixed(1)}g
        </div>
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-pg-blue mr-1" />
          <b>C</b> {carb.toFixed(1)}g
        </div>
      </div>
      {achievement !== null && (
        <div className="mt-2 rounded-lg bg-[#FAEEDA] px-2.5 py-1.5 text-[11px] font-medium text-[#854F0B]">
          タンパク質目標 {proteinTarget}g：{achievement}%
        </div>
      )}
    </div>
  );
}
