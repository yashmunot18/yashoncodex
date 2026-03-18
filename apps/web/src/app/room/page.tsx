'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface QueueEntry {
  entryId: string;
  position: number;
  status: string;
  patientName: string;
  patientPhone: string;
  testName: string;
  visitId: string;
  visitTestId: string;
  addedAt: string;
  calledAt?: string;
  pausedUntil?: string;
}

interface RoomQueue {
  room: { id: string; name: string; type: string };
  nowServing: QueueEntry | null;
  waiting: QueueEntry[];
  paused: QueueEntry[];
}

interface Room {
  id: string;
  name: string;
  centerId: string;
}

function RoomContent() {
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [queue, setQueue] = useState<RoomQueue | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/admin/rooms').then((r) => {
      setRooms(r.data);
      const qp = searchParams.get('roomId');
      if (qp) setSelectedRoom(qp);
      else if (r.data.length > 0) setSelectedRoom(r.data[0].id);
    });
  }, [searchParams]);

  const loadQueue = useCallback(async () => {
    if (!selectedRoom) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/queue/rooms/${selectedRoom}`);
      setQueue(res.data);
    } catch {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  useEffect(() => {
    loadQueue();
    const t = setInterval(loadQueue, 10000);
    return () => clearInterval(t);
  }, [loadQueue]);

  const action = async (entryId: string, act: string, extra?: object) => {
    try {
      await api.post(`/api/queue/${entryId}/${act}`, extra ?? {});
      toast.success(`${act.charAt(0).toUpperCase() + act.slice(1)} successful`);
      loadQueue();
    } catch {
      toast.error(`Action failed`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">← Home</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900 text-lg">🩺 Room Technician</h1>
          <div className="ml-auto">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading && !queue ? (
          <div className="text-center py-20 text-gray-400">Loading…</div>
        ) : (
          <>
            {/* Now Serving */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
                <h2 className="font-semibold text-lg">Now Serving</h2>
                <button onClick={loadQueue} className="text-blue-100 text-sm hover:text-white">Refresh</button>
              </div>
              <div className="p-6">
                {queue?.nowServing ? (
                  <div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                        #{queue.nowServing.position}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-xl">{queue.nowServing.patientName}</div>
                        <div className="text-sm text-gray-500">{queue.nowServing.testName}</div>
                        {queue.nowServing.patientPhone && (
                          <div className="text-xs text-gray-400">{queue.nowServing.patientPhone}</div>
                        )}
                      </div>
                      <span className="ml-auto text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase">
                        {queue.nowServing.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {queue.nowServing.status === 'WAITING' && (
                        <button
                          onClick={() => action(queue.nowServing!.entryId, 'call')}
                          className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                        >
                          📣 Call
                        </button>
                      )}
                      {['WAITING', 'CALLED'].includes(queue.nowServing.status) && (
                        <button
                          onClick={() => action(queue.nowServing!.entryId, 'start')}
                          className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                        >
                          ▶ Start
                        </button>
                      )}
                      {queue.nowServing.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => action(queue.nowServing!.entryId, 'complete')}
                            className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium"
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => action(queue.nowServing!.entryId, 'not-ready')}
                            className="bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition-colors font-medium"
                          >
                            ⏸ Not Ready
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No patient in service</p>
                )}
              </div>
            </section>

            {/* Waiting Queue */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Waiting Queue <span className="text-gray-400 font-normal">({queue?.waiting.length ?? 0})</span>
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {queue?.waiting.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">Queue is empty</p>
                ) : (
                  queue?.waiting.map((e, i) => (
                    <div key={e.entryId} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-yellow-50 text-yellow-700 flex items-center justify-center font-bold text-sm">
                        #{e.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{e.patientName}</div>
                        <div className="text-sm text-gray-500">{e.testName}</div>
                      </div>
                      {i === 0 && (
                        <button
                          onClick={() => action(e.entryId, 'call')}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          Call
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Paused */}
            {(queue?.paused.length ?? 0) > 0 && (
              <section className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-orange-50">
                  <h2 className="font-semibold text-gray-900">
                    ⏸ Not Ready / Paused <span className="text-gray-400 font-normal">({queue?.paused.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-orange-50">
                  {queue?.paused.map((e) => (
                    <div key={e.entryId} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{e.patientName}</div>
                        <div className="text-sm text-gray-500">{e.testName}</div>
                        {e.pausedUntil && (
                          <div className="text-xs text-orange-500">
                            Come back at: {new Date(e.pausedUntil).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => action(e.entryId, 'call')}
                        className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors"
                      >
                        Re-call
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <RoomContent />
    </Suspense>
  );
}
