'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Client, Followup } from '@/lib/supabase/types';

interface FollowupRow extends Followup {
  client?: Client;
}

export default function FollowupsPage() {
  const [rows, setRows] = useState<FollowupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('followups')
      .select('*')
      .is('sent_at', null)
      .order('day_number', { ascending: true });
    const list = (data as Followup[]) ?? [];
    const clientIds = Array.from(new Set(list.map((f) => f.client_id)));
    let clients: Client[] = [];
    if (clientIds.length > 0) {
      const cRes = await supabase.from('clients').select('*').in('id', clientIds);
      clients = (cRes.data as Client[]) ?? [];
    }
    setRows(
      list.map((f) => ({ ...f, client: clients.find((c) => c.id === f.client_id) }))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSendLine = async (row: FollowupRow) => {
    setBusyId(row.id);
    try {
      // TODO: admin server action that calls pushTextMessage(row.client.line_user_id, row.message)
      // Stub: mark as sent locally.
      await supabase
        .from('followups')
        .update({ sent_at: new Date().toISOString(), channel: 'line' })
        .eq('id', row.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkSent = async (row: FollowupRow) => {
    setBusyId(row.id);
    try {
      await supabase
        .from('followups')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">フォローアップ管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          未送信のフォロー: {rows.length} 件
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {loading ? (
          <div className="text-sm text-gray-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            未送信のフォローはありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2">Day</th>
                <th className="py-2">顧客</th>
                <th className="py-2">メッセージ</th>
                <th className="py-2">チャネル</th>
                <th className="py-2 w-48">アクション</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 align-top">
                  <td className="py-3">{r.day_number}</td>
                  <td className="py-3">{r.client?.display_name ?? '—'}</td>
                  <td className="py-3 text-gray-700 whitespace-pre-wrap max-w-md">
                    {r.message}
                  </td>
                  <td className="py-3 text-xs">{r.channel}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendLine(r)}
                        disabled={busyId === r.id || !r.client?.line_user_id}
                        className="bg-pg-green text-white text-xs px-3 py-1.5 rounded disabled:opacity-40"
                      >
                        LINE送信
                      </button>
                      <button
                        onClick={() => handleMarkSent(r)}
                        disabled={busyId === r.id}
                        className="bg-gray-200 text-gray-800 text-xs px-3 py-1.5 rounded disabled:opacity-40"
                      >
                        送信済にする
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
