'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { MealEntry, MealType } from '@/lib/supabase/types';
import type { MealReviewData } from '@/app/(admin)/meals/page';

type Compliance = 'ok' | 'partial' | 'ng';

const mealLabel: Record<MealType, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食',
};

interface Props {
  data: MealReviewData;
  onUpdated?: () => void;
}

export default function MealReviewCard({ data, onUpdated }: Props) {
  const { report, client, entries, photos } = data;
  const [compliance, setCompliance] = useState<Compliance | null>(null);
  const [ngReason, setNgReason] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const grouped = (['breakfast', 'lunch', 'dinner', 'snack'] as MealType[])
    .map((t) => ({ type: t, items: entries.filter((e) => e.meal_type === t) }))
    .filter((g) => g.items.length > 0);

  const handleJudge = async (value: Compliance) => {
    setCompliance(value);
  };

  const handleSave = async () => {
    if (!compliance) return;
    setSaving(true);
    try {
      // Fields compliance/ng_reason/therapist_comment assumed per spec.
      await supabase
        .from('meal_reports')
        .update({
          compliance,
          ng_reason: ngReason || null,
          therapist_comment: comment || null,
        } as any)
        .eq('id', report.id);
      onUpdated?.();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleLineReply = async () => {
    // TODO: call admin API / server action that invokes pushTextMessage
    // Stub: just save the comment for now.
    await handleSave();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-gray-900">
            {client?.display_name ?? '不明'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {report.report_date} {report.day_number ? `/ Day ${report.day_number}` : ''}
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>P {report.total_protein_g.toFixed(1)} g</div>
          <div>F {report.total_fat_g.toFixed(1)} g</div>
          <div>C {report.total_carb_g.toFixed(1)} g</div>
          <div className="font-semibold text-gray-900 mt-1">
            {Math.round(report.total_calories_kcal)} kcal
          </div>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              {p.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.public_url} alt="meal" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  {mealLabel[p.meal_type]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {grouped.map((g) => (
          <div key={g.type}>
            <div className="text-xs font-semibold text-gray-700">{mealLabel[g.type]}</div>
            <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
              {g.items.map((e: MealEntry) => (
                <li key={e.id}>
                  {e.food_name} ({e.quantity_g} g)
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleJudge('ok')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
            compliance === 'ok'
              ? 'bg-pg-green text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          OK
        </button>
        <button
          onClick={() => handleJudge('partial')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
            compliance === 'partial'
              ? 'bg-pg-orange text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          一部NG
        </button>
        <button
          onClick={() => handleJudge('ng')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
            compliance === 'ng'
              ? 'bg-pg-red text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          NG
        </button>
      </div>

      {(compliance === 'partial' || compliance === 'ng') && (
        <textarea
          value={ngReason}
          onChange={(e) => setNgReason(e.target.value)}
          placeholder="NG理由"
          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          rows={2}
        />
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="セラピストコメント"
        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
        rows={2}
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!compliance || saving}
          className="flex-1 bg-gray-800 text-white text-sm py-2 rounded-lg disabled:opacity-40"
        >
          保存
        </button>
        <button
          onClick={handleLineReply}
          disabled={!comment || saving}
          className="flex-1 bg-pg-green text-white text-sm py-2 rounded-lg disabled:opacity-40"
        >
          LINE返信
        </button>
      </div>
    </div>
  );
}
