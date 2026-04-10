'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Client } from '@/lib/supabase/types';

interface Props {
  clients: Client[];
  onCreated?: () => void;
}

export default function TreatmentForm({ clients, onCreated }: Props) {
  const [clientId, setClientId] = useState('');
  const [performedDate, setPerformedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [sessionNumber, setSessionNumber] = useState(1);
  const [lymphMassage, setLymphMassage] = useState(true);
  const [infraredMat, setInfraredMat] = useState(false);
  const [weightBefore, setWeightBefore] = useState<string>('');
  const [weightAfter, setWeightAfter] = useState<string>('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const diff = useMemo(() => {
    const a = parseFloat(weightAfter);
    const b = parseFloat(weightBefore);
    if (isNaN(a) || isNaN(b)) return null;
    return a - b;
  }, [weightBefore, weightAfter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setMessage('顧客を選択してください');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // Look up client's active course
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('client_id', clientId)
        .order('start_date', { ascending: false })
        .limit(1);
      const courseId = courses && courses[0] ? (courses[0] as any).id : null;

      const noteParts: string[] = [];
      if (lymphMassage) noteParts.push('リンパマッサージ');
      if (infraredMat) noteParts.push('遠赤外線マット');
      const combinedNote = [noteParts.join(' / '), note].filter(Boolean).join(' | ');

      const before = weightBefore ? parseFloat(weightBefore) : null;
      const after = weightAfter ? parseFloat(weightAfter) : null;

      const { error } = await supabase.from('treatments').insert({
        client_id: clientId,
        course_id: courseId,
        session_number: sessionNumber,
        performed_at: new Date(performedDate).toISOString(),
        weight_before_kg: before,
        weight_after_kg: after,
        note: combinedNote || null,
      } as any);
      if (error) throw error;

      // Write weight logs (pre/post)
      const rows: any[] = [];
      if (before != null) {
        rows.push({
          client_id: clientId,
          logged_date: performedDate,
          slot: 'unknown',
          weight_kg: before,
          source: 'treatment_pre',
        });
      }
      if (after != null) {
        rows.push({
          client_id: clientId,
          logged_date: performedDate,
          slot: 'unknown',
          weight_kg: after,
          source: 'treatment_post',
        });
      }
      if (rows.length > 0) {
        await supabase.from('weight_logs').insert(rows);
      }

      setMessage('登録しました');
      setNote('');
      setWeightBefore('');
      setWeightAfter('');
      onCreated?.();
    } catch (err: any) {
      setMessage(err?.message ?? '登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">新規施術登録</h2>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">顧客</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">選択してください</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">施術日</label>
          <input
            type="date"
            value={performedDate}
            onChange={(e) => setPerformedDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">回数 (session_number)</label>
          <input
            type="number"
            min={1}
            value={sessionNumber}
            onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lymphMassage}
            onChange={(e) => setLymphMassage(e.target.checked)}
          />
          リンパマッサージ
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={infraredMat}
            onChange={(e) => setInfraredMat(e.target.checked)}
          />
          遠赤外線マット
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">施術前体重 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weightBefore}
            onChange={(e) => setWeightBefore(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">施術後体重 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weightAfter}
            onChange={(e) => setWeightAfter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">差分</label>
          <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm">
            {diff == null ? (
              '—'
            ) : (
              <span className={diff < 0 ? 'text-pg-green' : 'text-pg-red'}>
                {diff > 0 ? '+' : ''}
                {diff.toFixed(2)} kg
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">メモ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        {message && <div className="text-xs text-gray-500">{message}</div>}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto bg-pg-green text-white text-sm px-6 py-2 rounded-lg disabled:opacity-40"
        >
          {saving ? '保存中...' : '登録'}
        </button>
      </div>
    </form>
  );
}
