'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Client, Treatment } from '@/lib/supabase/types';
import TreatmentForm from '@/components/admin/TreatmentForm';

interface TreatmentRow extends Treatment {
  client_name?: string;
}

export default function TreatmentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [rows, setRows] = useState<TreatmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cRes, tRes] = await Promise.all([
      supabase.from('clients').select('*').order('display_name'),
      supabase
        .from('treatments')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(30),
    ]);
    const cs = (cRes.data as Client[]) ?? [];
    const ts = (tRes.data as Treatment[]) ?? [];
    setClients(cs);
    setRows(
      ts.map((t) => ({
        ...t,
        client_name: cs.find((c) => c.id === t.client_id)?.display_name,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">施術記録</h1>
        <p className="text-sm text-gray-500 mt-1">新規施術の登録と直近の履歴確認</p>
      </div>

      <TreatmentForm clients={clients} onCreated={load} />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">直近の施術一覧</h2>
        {loading ? (
          <div className="text-sm text-gray-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500">施術記録がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2">日付</th>
                <th className="py-2">顧客</th>
                <th className="py-2">回数</th>
                <th className="py-2">前体重</th>
                <th className="py-2">後体重</th>
                <th className="py-2">差分</th>
                <th className="py-2">メモ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const diff =
                  r.weight_before_kg != null && r.weight_after_kg != null
                    ? r.weight_after_kg - r.weight_before_kg
                    : null;
                return (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2">{r.performed_at?.slice(0, 10) ?? '—'}</td>
                    <td className="py-2">{r.client_name ?? '—'}</td>
                    <td className="py-2">{r.session_number}</td>
                    <td className="py-2">{r.weight_before_kg ?? '—'} kg</td>
                    <td className="py-2">{r.weight_after_kg ?? '—'} kg</td>
                    <td className="py-2">
                      {diff != null ? (
                        <span className={diff < 0 ? 'text-pg-green' : 'text-pg-red'}>
                          {diff > 0 ? '+' : ''}
                          {diff.toFixed(2)} kg
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 text-gray-500 truncate max-w-[200px]">{r.note ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
