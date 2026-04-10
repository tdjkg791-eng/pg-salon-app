'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase/client';
import type { Client, WeightLog } from '@/lib/supabase/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsCharts() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientWeights, setClientWeights] = useState<WeightLog[]>([]);

  useEffect(() => {
    supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setClients(data as Client[]);
          if (data.length > 0) setSelectedClient((data[0] as Client).id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', selectedClient)
      .order('logged_date', { ascending: true })
      .then(({ data }) => setClientWeights((data as WeightLog[]) ?? []));
  }, [selectedClient]);

  const weightLabels = clientWeights.map((w) => w.logged_date);
  const morningData = clientWeights
    .filter((w) => w.slot === 'morning')
    .map((w) => ({ x: w.logged_date, y: w.weight_kg }));
  const eveningData = clientWeights
    .filter((w) => w.slot === 'evening')
    .map((w) => ({ x: w.logged_date, y: w.weight_kg }));

  return (
    <div className="grid grid-cols-2 gap-6">
      <Panel title="体重推移（顧客選択）" className="col-span-2">
        <div className="mb-4">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {clients.length === 0 && <option value="">顧客データなし</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        </div>
        <div className="h-64">
          <Line
            data={{
              labels: weightLabels,
              datasets: [
                {
                  label: '朝体重',
                  data: morningData.map((d) => d.y),
                  borderColor: '#6BBF59',
                  backgroundColor: 'rgba(107,191,89,0.2)',
                  tension: 0.3,
                },
                {
                  label: '晩体重',
                  data: eveningData.map((d) => d.y),
                  borderColor: '#4A90E2',
                  backgroundColor: 'rgba(74,144,226,0.2)',
                  tension: 0.3,
                },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </Panel>

      <Panel title="食事遵守率 × 減量成果">
        <div className="h-64">
          <Scatter
            data={{
              datasets: [
                {
                  label: '顧客',
                  data: [],
                  backgroundColor: '#F5A623',
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { title: { display: true, text: '遵守率 (%)' }, min: 0, max: 100 },
                y: { title: { display: true, text: '減量 (kg)' } },
              },
            }}
          />
        </div>
      </Panel>

      <Panel title="コース別成功率（5w / 7w / 9w）">
        <div className="h-64">
          <Bar
            data={{
              labels: ['5週間', '7週間', '9週間'],
              datasets: [
                {
                  label: '成功率 (%)',
                  data: [0, 0, 0],
                  backgroundColor: ['#6BBF59', '#4A90E2', '#9B59B6'],
                },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </Panel>

      <Panel title="施術前後体重変化（マット有/無）">
        <div className="h-64">
          <Bar
            data={{
              labels: ['マット有', 'マット無'],
              datasets: [
                {
                  label: '平均体重変化 (kg)',
                  data: [0, 0],
                  backgroundColor: ['#F5A623', '#E74C3C'],
                },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </Panel>

      <Panel title="リピート率推移">
        <div className="h-64">
          <Line
            data={{
              labels: [],
              datasets: [
                {
                  label: 'リピート率 (%)',
                  data: [],
                  borderColor: '#E91E63',
                  backgroundColor: 'rgba(233,30,99,0.2)',
                  tension: 0.3,
                },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
