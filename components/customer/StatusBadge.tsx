"use client";

import React from "react";

type Status = "ok" | "ng" | "limited";
type Size = "sm" | "md";

const LABEL: Record<Status, string> = {
  ok: "OK",
  ng: "NG",
  limited: "注意",
};

const STYLE: Record<Status, string> = {
  ok: "bg-[#E1F5EE] text-[#0F6E56]",
  ng: "bg-[#FCEBEB] text-pg-red",
  limited: "bg-[#FAEEDA] text-[#854F0B]",
};

export default function StatusBadge({
  status,
  size = "sm",
}: {
  status: Status;
  size?: Size;
}) {
  const sz =
    size === "md" ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-block rounded-full font-semibold ${sz} ${STYLE[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}

export function BodyTypeBadge({ size = "sm" }: { size?: Size }) {
  const sz =
    size === "md" ? "text-xs px-2.5 py-1" : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-block rounded-full font-semibold bg-[#EEEDFE] text-pg-purple ${sz}`}
    >
      体質NG
    </span>
  );
}
