'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface RoomSummary {
  id: string;
  name: string;
  type: string;
  waiting: number;
  serving: number;
  paused: number;
  queue: QueueItem[];
}

interface QueueItem {
  entryId: string;
  position: number;
  status: string;
  patientName: string;
  testName: string;
  addedAt: string;
}

interface Dashboard {
  summary: { totalVisits: number; activeVisits: number; completedVisits: number };
  rooms: RoomSummary[];
}

const statusColor: Record<string, string> = {
  WAITING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CALLED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PAUSED: 'bg-orange-50 text-orange-700 border-orange-200',
  DONE: 'bg-green-50 text-green-700 border-green-200',
};

export default function FloorPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/floor/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const triggerSync = async () => {
    try {
      const res = await api.post('/api/sync/trigger');
      toast.success(`Sync: ${res.data.synced} new, ${res.data.skipped} skipped`);
      load();
    } catch {
      toast.error('Sync failed – check proxy config');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">← Home</Link>
            <span className="text-gray-300">|</span>
            <h1 className="font-bold text-gray-900 text-lg">🏢 Floor Manager</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerSync}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Sync Reception
            </button>
            <button
              onClick={load}
              className="text-sm bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading dashboard…</div>
        ) : (
          <>
            {/* Summary Cards */}
            {data && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Visits Today', value: data.summary.totalVisits, color: 'text-blue-600' },
                  { label: 'Active Patients', value: data.summary.activeVisits, color: 'text-indigo-600' },
                  { label: 'Completed', value: data.summary.completedVisits, color: 'text-green-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {data?.rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                    <div>
                      <h2 className="font-semibold text-gray-900">{room.name}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{room.type.replace(/_/g, ' ')}</p>
                    </div>
                    <Link
                      href={`/room?roomId=${room.id}`}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Open →
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="flex divide-x divide-gray-50 border-b border-gray-50">
                    {[
                      { label: 'Waiting', value: room.waiting, color: 'text-yellow-600' },
                      { label: 'Serving', value: room.serving, color: 'text-blue-600' },
                      { label: 'Paused', value: room.paused, color: 'text-orange-600' },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 py-3 text-center">
                        <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Queue preview */}
                  <div className="px-5 py-3 space-y-2 max-h-40 overflow-y-auto">
                    {room.queue.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">Queue empty</p>
                    ) : (
                      room.queue.slice(0, 5).map((e) => (
                        <div key={e.entryId} className={`flex items-center gap-2 text-xs border rounded-lg px-3 py-2 ${statusColor[e.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          <span className="font-bold w-6 text-center">#{e.position}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{e.patientName}</div>
                            <div className="text-gray-500 truncate">{e.testName}</div>
                          </div>
                          <span className="uppercase text-xs opacity-60">{e.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
