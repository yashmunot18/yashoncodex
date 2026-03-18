'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface RoomDisplay {
  room: { id: string; name: string; type: string };
  nowServing: { entryId: string; patientName: string; tokenNo: number; testName: string } | null;
  upNext: { entryId: string; patientName: string; tokenNo: number; testName: string }[];
}

export default function TVPage() {
  const [rooms, setRooms] = useState<RoomDisplay[]>([]);
  const [time, setTime] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/display/tv');
      setRooms(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const dataTimer = setInterval(load, 8000);
    const clockTimer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => { clearInterval(dataTimer); clearInterval(clockTimer); };
  }, [load]);

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">NDC</div>
          <div>
            <div className="font-bold text-gray-900 text-lg">NDC DIAGNOSTIC CENTRE – THANE</div>
            <div className="text-sm text-gray-400">Queue Status Board</div>
          </div>
        </div>
        <div className="text-3xl font-mono font-bold text-blue-600">{time}</div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {rooms.map((r) => (
          <div key={r.room.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Room header */}
            <div className="bg-gray-900 text-white px-4 py-3">
              <div className="font-semibold text-sm">{r.room.name}</div>
            </div>

            {/* Now serving */}
            <div className="bg-blue-50 px-4 py-4 min-h-[90px]">
              <div className="text-xs font-semibold text-blue-400 uppercase mb-2">Now Serving</div>
              {r.nowServing ? (
                <div>
                  <div className="text-4xl font-black text-blue-700">#{r.nowServing.tokenNo}</div>
                  <div className="font-semibold text-gray-900 text-lg leading-tight mt-1">{r.nowServing.patientName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.nowServing.testName}</div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Waiting…</div>
              )}
            </div>

            {/* Up next */}
            <div className="px-4 py-3 space-y-1.5">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Up Next</div>
              {r.upNext.length === 0 ? (
                <div className="text-gray-300 text-sm">—</div>
              ) : (
                r.upNext.map((n) => (
                  <div key={n.entryId} className="flex items-center gap-2">
                    <span className="font-bold text-gray-600 w-8">#{n.tokenNo}</span>
                    <span className="text-sm text-gray-700 truncate">{n.patientName}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-300 mt-8">
        Auto-refreshes every 8 seconds
      </div>
    </div>
  );
}
