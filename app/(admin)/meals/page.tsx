'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Client, MealEntry, MealPhoto, MealReport } from '@/lib/supabase/types';
import MealReviewCard from '@/components/admin/MealReviewCard';

export interface MealReviewData {
  report: MealReport;
  client: Client | null;
  entries: MealEntry[];
  photos: MealPhoto[];
}

export default function MealsPage() {
  const [items, setItems] = useState<MealReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // Note: compliance / day_complete columns assumed to exist per spec.
    // Fallback: use is_complete if compliance columns not present.
    const { data: reports } = await supabase
      .from('meal_reports')
      .select('*')
      .eq('is_complete', true)
      .order('report_date', { ascending: false })
      .limit(50);

    const list = (reports as MealReport[]) ?? [];
    if (list.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const clientIds = Array.from(new Set(list.map((r) => r.client_id)));
    const reportIds = list.map((r) => r.id);

    const [clientsRes, entriesRes, photosRes] = await Promise.all([
      supabase.from('clients').select('*').in('id', clientIds),
      supabase.from('meal_entries').select('*').in('meal_report_id', reportIds),
      supabase.from('meal_photos').select('*').in('meal_report_id', reportIds),
    ]);
    const clients = (clientsRes.data as Client[]) ?? [];
    const entries = (entriesRes.data as MealEntry[]) ?? [];
    const photos = (photosRes.data as MealPhoto[]) ?? [];

    const composed: MealReviewData[] = list.map((r) => ({
      report: r,
      client: clients.find((c) => c.id === r.client_id) ?? null,
      entries: entries.filter((e) => e.meal_report_id === r.id),
      photos: photos.filter((p) => p.meal_report_id === r.id),
    }));
    setItems(composed);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // TODO: Supabase Realtime subscription for meal_reports (new/updated rows → refresh)
    // Complex: requires channel + filter. Left as TODO.
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">食事チェック</h1>
        <p className="text-sm text-gray-500 mt-1">
          要確認の食事報告: {items.length} 件
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">読み込み中...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          未チェックの食事報告はありません
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <MealReviewCard key={item.report.id} data={item} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  );
}
