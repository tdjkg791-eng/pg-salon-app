'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import type {
  Client,
  Course,
  MealReport,
  Treatment,
  WeightLog,
} from '@/lib/supabase/types';
import WeightChart from '@/components/admin/WeightChart';

const bodyTypeLabel: Record<string, string> = {
  fat_sensitive: '脂質敏感型',
  carb_sensitive: '糖質敏感型',
};
const courseLabel: Record<string, string> = {
  '5w': '5週間',
  '7w': '7週間',
  '9w': '9週間',
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [client, setClient] = useState<Client | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [meals, setMeals] = useState<MealReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [cRes, coRes, wRes, tRes, mRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('courses').select('*').eq('client_id', id).order('start_date', { ascending: false }),
        supabase.from('weight_logs').select('*').eq('client_id', id).order('logged_date', { ascending: true }),
        supabase.from('treatments').select('*').eq('client_id', id).order('performed_at', { ascending: false }),
        supabase.from('meal_reports').select('*').eq('client_id', id).order('report_date', { ascending: false }).limit(20),
      ]);
      setClient((cRes.data as Client | null) ?? null);
      setCourses((coRes.data as Course[]) ?? []);
      setWeights((wRes.data as WeightLog[]) ?? []);
      setTreatments((tRes.data as Treatment[]) ?? []);
      setMeals((mRes.data as MealReport[]) ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="text-sm text-gray-500">読み込み中...</div>;
  if (!client) return <div className="text-sm text-gray-500">顧客が見つかりません</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className="text-xs text-gray-500 hover:text-gray-900">
          ← 顧客一覧へ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{client.display_name}</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">基本情報</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-gray-500">身長</dt>
            <dd className="text-gray-900">{client.height_cm ?? '—'} cm</dd>
            <dt className="text-gray-500">開始時体重</dt>
            <dd className="text-gray-900">{client.start_weight_kg ?? '—'} kg</dd>
            <dt className="text-gray-500">目標体重</dt>
            <dd className="text-gray-900">{client.target_weight_kg ?? '—'} kg</dd>
            <dt className="text-gray-500">電話</dt>
            <dd className="text-gray-900">{client.phone ?? '—'}</dd>
            <dt className="text-gray-500">メール</dt>
            <dd className="text-gray-900">{client.email ?? '—'}</dd>
            <dt className="text-gray-500">メモ</dt>
            <dd className="text-gray-900">{client.note ?? '—'}</dd>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">体質タイプ</h2>
          {client.body_type ? (
            <div
              className={`inline-block px-4 py-2 rounded-full text-white text-sm ${
                client.body_type === 'fat_sensitive' ? 'bg-pg-orange' : 'bg-pg-blue'
              }`}
            >
              {bodyTypeLabel[client.body_type]}
            </div>
          ) : (
            <div className="text-sm text-gray-500">未判定</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">コース履歴</h2>
        {courses.length === 0 ? (
          <div className="text-sm text-gray-500">コース履歴がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2">コース</th>
                <th className="py-2">開始日</th>
                <th className="py-2">終了日</th>
                <th className="py-2">リピート</th>
                <th className="py-2">金額</th>
                <th className="py-2">状態</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-2">{courseLabel[c.course_type]}</td>
                  <td className="py-2">{c.start_date}</td>
                  <td className="py-2">{c.end_date}</td>
                  <td className="py-2">{c.is_repeat ? '有' : '—'}</td>
                  <td className="py-2">¥{c.total_price.toLocaleString()}</td>
                  <td className="py-2">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">体重推移</h2>
        <WeightChart data={weights} treatments={treatments} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">食事記録（直近20件）</h2>
        {meals.length === 0 ? (
          <div className="text-sm text-gray-500">食事記録がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2">日付</th>
                <th className="py-2">Day</th>
                <th className="py-2">P (g)</th>
                <th className="py-2">F (g)</th>
                <th className="py-2">C (g)</th>
                <th className="py-2">kcal</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="py-2">{m.report_date}</td>
                  <td className="py-2">{m.day_number ?? '—'}</td>
                  <td className="py-2">{m.total_protein_g.toFixed(1)}</td>
                  <td className="py-2">{m.total_fat_g.toFixed(1)}</td>
                  <td className="py-2">{m.total_carb_g.toFixed(1)}</td>
                  <td className="py-2">{Math.round(m.total_calories_kcal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
