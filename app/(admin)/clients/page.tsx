'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { BodyType, Client, Course } from '@/lib/supabase/types';
import ClientCard from '@/components/admin/ClientCard';

type BodyFilter = 'all' | BodyType;
type CourseFilter = 'all' | '5w' | '7w' | '9w';
type StatusFilter = 'all' | 'active' | 'completed';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [bodyFilter, setBodyFilter] = useState<BodyFilter>('all');
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const load = async () => {
      const [cRes, coRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('courses').select('*').order('start_date', { ascending: false }),
      ]);
      setClients((cRes.data as Client[]) ?? []);
      setCourses((coRes.data as Course[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const courseByClient = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of courses) {
      if (!map.has(c.client_id)) map.set(c.client_id, c);
    }
    return map;
  }, [courses]);

  const filtered = clients.filter((c) => {
    if (query && !c.display_name.toLowerCase().includes(query.toLowerCase())) return false;
    if (bodyFilter !== 'all' && c.body_type !== bodyFilter) return false;
    const course = courseByClient.get(c.id);
    if (courseFilter !== 'all' && course?.course_type !== courseFilter) return false;
    if (statusFilter !== 'all' && course?.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客一覧</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length}名登録</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="氏名で検索..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={bodyFilter}
          onChange={(e) => setBodyFilter(e.target.value as BodyFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">体質（全て）</option>
          <option value="fat_sensitive">脂質敏感</option>
          <option value="carb_sensitive">糖質敏感</option>
        </select>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value as CourseFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">コース（全て）</option>
          <option value="5w">5週間</option>
          <option value="7w">7週間</option>
          <option value="9w">9週間</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">ステータス（全て）</option>
          <option value="active">進行中</option>
          <option value="completed">完了</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          該当する顧客がいません
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((client) => {
            const course = courseByClient.get(client.id);
            return (
              <ClientCard
                key={client.id}
                client={client}
                currentWeight={client.start_weight_kg ?? undefined}
                targetWeight={client.target_weight_kg ?? undefined}
                courseType={course?.course_type}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
