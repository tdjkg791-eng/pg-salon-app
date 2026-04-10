"use client";

import React from "react";

type Props = {
  active: boolean;
  onToggle: (next: boolean) => void;
};

export default function MenstrualToggle({ active, onToggle }: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(!active)}
        className={`mx-3 flex w-[calc(100%-24px)] items-center justify-between rounded-[12px] border bg-white px-3.5 py-3 ${
          active ? "border-pg-pink bg-[#FDF2F6]" : "border-[#E8E6DF]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full border-2 border-pg-pink ${
              active ? "bg-pg-pink" : ""
            }`}
          />
          <span className="text-[13px] font-medium">生理中</span>
        </div>
        <span className="text-xs text-[#888]">{active ? "ON" : "OFF"}</span>
      </button>
      {active && (
        <div className="mx-3 mt-2 rounded-lg bg-[#FDF2F6] px-3 py-2.5 text-xs font-medium leading-relaxed text-[#993556]">
          体重が減りにくい時期です。正常な反応ですので安心してください。食事管理を継続することが大切です。
        </div>
      )}
    </div>
  );
}
