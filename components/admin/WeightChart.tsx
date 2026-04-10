'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Treatment, WeightLog } from '@/lib/supabase/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  data: WeightLog[];
  treatments?: Treatment[];
  menstrualRanges?: { start: string; end: string }[];
}

export default function WeightChart({ data, treatments = [], menstrualRanges = [] }: Props) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500">体重データがありません</div>;
  }

  const dates = Array.from(new Set(data.map((d) => d.logged_date))).sort();

  const morningByDate = new Map<string, number>();
  const eveningByDate = new Map<string, number>();
  data.forEach((d) => {
    if (d.slot === 'morning') morningByDate.set(d.logged_date, d.weight_kg);
    if (d.slot === 'evening') eveningByDate.set(d.logged_date, d.weight_kg);
  });

  const morningData = dates.map((d) => morningByDate.get(d) ?? null);
  const eveningData = dates.map((d) => eveningByDate.get(d) ?? null);

  const treatmentMap = new Map<string, number>();
  treatments.forEach((t) => {
    if (t.performed_at) {
      const key = t.performed_at.slice(0, 10);
      if (t.weight_before_kg) treatmentMap.set(key, t.weight_before_kg);
    }
  });
  const treatmentPoints = dates.map((d) => treatmentMap.get(d) ?? null);

  // TODO: menstrual period background bands via chart.js annotation plugin
  const menstrualNote = menstrualRanges.length > 0;

  return (
    <div>
      <div className="h-80">
        <Line
          data={{
            labels: dates,
            datasets: [
              {
                label: '朝体重',
                data: morningData,
                borderColor: '#6BBF59',
                backgroundColor: 'rgba(107,191,89,0.15)',
                tension: 0.3,
                spanGaps: true,
              },
              {
                label: '晩体重',
                data: eveningData,
                borderColor: '#4A90E2',
                backgroundColor: 'rgba(74,144,226,0.15)',
                tension: 0.3,
                spanGaps: true,
              },
              {
                label: '施術日',
                data: treatmentPoints,
                borderColor: '#F5A623',
                backgroundColor: '#F5A623',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              y: { title: { display: true, text: '体重 (kg)' } },
            },
          }}
        />
      </div>
      {menstrualNote && (
        <div className="mt-2 text-xs text-pg-pink">
          ※ 生理期間の背景表示は TODO（chartjs-plugin-annotation が必要）
        </div>
      )}
    </div>
  );
}
