'use client';

import Link from 'next/link';
import type { Client, CourseType } from '@/lib/supabase/types';

interface Props {
  client: Client;
  currentWeight?: number;
  targetWeight?: number;
  courseType?: CourseType;
}

const bodyTypeLabel: Record<string, string> = {
  fat_sensitive: '脂質敏感',
  carb_sensitive: '糖質敏感',
};

const bodyTypeColor: Record<string, string> = {
  fat_sensitive: 'bg-pg-orange text-white',
  carb_sensitive: 'bg-pg-blue text-white',
};

const courseLabel: Record<string, string> = {
  '5w': '5週間',
  '7w': '7週間',
  '9w': '9週間',
};

export default function ClientCard({ client, currentWeight, targetWeight, courseType }: Props) {
  const start = client.start_weight_kg ?? currentWeight ?? 0;
  const target = client.target_weight_kg ?? targetWeight ?? 0;
  const current = currentWeight ?? start;
  const totalLoss = start - target;
  const doneLoss = start - current;
  const progress =
    totalLoss > 0 ? Math.max(0, Math.min(100, Math.round((doneLoss / totalLoss) * 100))) : 0;

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-pg-green transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-gray-900">{client.display_name}</div>
          {client.height_cm && (
            <div className="text-xs text-gray-500 mt-1">{client.height_cm} cm</div>
          )}
        </div>
        {client.body_type && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${bodyTypeColor[client.body_type] ?? 'bg-gray-200 text-gray-700'}`}
          >
            {bodyTypeLabel[client.body_type]}
          </span>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        コース: <span className="text-gray-900 font-medium">{courseType ? courseLabel[courseType] : '未設定'}</span>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>体重進捗</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-pg-green transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>開始 {start} kg</span>
          <span>目標 {target} kg</span>
        </div>
      </div>
    </Link>
  );
}
