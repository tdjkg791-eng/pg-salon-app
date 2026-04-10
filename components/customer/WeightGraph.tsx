"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export type WeightPoint = {
  date: string;
  morning: number | null;
  evening: number | null;
  isTreatment?: boolean;
  isMenstrual?: boolean;
};

export default function WeightGraph({ data }: { data: WeightPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="mx-3 rounded-[12px] border border-[#E8E6DF] bg-white p-8 text-center text-xs text-[#888]">
        データがありません
      </div>
    );
  }

  const labels = data.map((d) => d.date.slice(5));

  const chartData = {
    labels,
    datasets: [
      {
        label: "朝",
        data: data.map((d) => d.morning),
        borderColor: "#1D9E75",
        backgroundColor: "#1D9E75",
        pointBackgroundColor: data.map((d) =>
          d.isTreatment ? "#D85A30" : "#1D9E75"
        ),
        pointRadius: data.map((d) => (d.isTreatment ? 6 : 3)),
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: "晩",
        data: data.map((d) => d.evening),
        borderColor: "#378ADD",
        backgroundColor: "#378ADD",
        pointBackgroundColor: data.map((d) =>
          d.isMenstrual ? "#D4537E" : "#378ADD"
        ),
        pointRadius: data.map((d) => (d.isMenstrual ? 5 : 3)),
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom" as const },
    },
    scales: {
      y: {
        ticks: { font: { size: 10 } },
      },
      x: {
        ticks: { font: { size: 10 } },
      },
    },
  };

  return (
    <div className="mx-3 rounded-[12px] border border-[#E8E6DF] bg-white p-3.5">
      <div style={{ height: 220 }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#888]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-pg-green" />朝
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-pg-blue" />晩
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-pg-orange" />施術日
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-pg-pink" />生理
        </span>
      </div>
    </div>
  );
}
