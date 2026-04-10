'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';

interface Kpis {
  activeCourses: number;
  pendingMeals: number;
  newClientsThisMonth: number;
  repeatRate: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis>({
    activeCourses: 0,
    pendingMeals: 0,
    newClientsThisMonth: 0,
    repeatRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        const today = now.toISOString().slice(0, 10);

        const [activeRes, mealsRes, newClientsRes, coursesRes] = await Promise.all([
          supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase
            .from('meal_reports')
            .select('id', { count: 'exact', head: true })
            .eq('report_date', today)
            .eq('is_complete', true),
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', monthStart),
          supabase.from('courses').select('client_id,is_repeat'),
        ]);

        let repeatRate = 0;
        if (coursesRes.data && coursesRes.data.length > 0) {
          const total = coursesRes.data.length;
          const repeats = coursesRes.data.filter((c: any) => c.is_repeat).length;
          repeatRate = Math.round((repeats / total) * 100);
        }

        setKpis({
          activeCourses: activeRes.count ?? 0,
          pendingMeals: mealsRes.count ?? 0,
          newClientsThisMonth: newClientsRes.count ?? 0,
          repeatRate,
        });
      } catch (e) {
        // fall back to zeros
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">分析ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">サロン運営の主要指標を俯瞰します</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="アクティブコース数" value={kpis.activeCourses} unit="件" color="pg-green" loading={loading} />
        <KpiCard label="今日の要確認食事報告" value={kpis.pendingMeals} unit="件" color="pg-orange" loading={loading} />
        <KpiCard label="今月の新規顧客" value={kpis.newClientsThisMonth} unit="名" color="pg-blue" loading={loading} />
        <KpiCard label="累計リピート率" value={kpis.repeatRate} unit="%" color="pg-purple" loading={loading} />
      </div>

      <AnalyticsCharts />
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  color,
  loading,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={`text-3xl font-bold text-${color}`}>
          {loading ? '—' : value.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
