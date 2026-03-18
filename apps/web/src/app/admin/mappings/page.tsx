'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Test { id: string; name: string; code: string }
interface Room { id: string; name: string }
interface Mapping { id: string; testId: string; roomId: string; priority: number; isDefault: boolean; test: Test; room: Room }

export default function AdminMappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [testId, setTestId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [priority, setPriority] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [m, t, r] = await Promise.all([
      api.get('/api/admin/mappings'),
      api.get('/api/admin/tests'),
      api.get('/api/admin/rooms'),
    ]);
    setMappings(m.data);
    setTests(t.data);
    setRooms(r.data);
    if (t.data.length) setTestId(t.data[0].id);
    if (r.data.length) setRoomId(r.data[0].id);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!testId || !roomId) return toast.error('Select test and room');
    setLoading(true);
    try {
      await api.post('/api/admin/mappings', { testId, roomId, priority, isDefault: true });
      toast.success('Mapping created');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Remove this mapping?')) return;
    await api.delete(`/api/admin/mappings/${id}`);
    toast.success('Mapping removed');
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 text-sm">← Admin</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900 text-lg">🔗 Test → Room Mapping</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Add New Mapping</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test</label>
              <select
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tests.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1 = default room)</label>
              <input
                type="number"
                min={1}
                value={priority}
                onChange={(e) => setPriority(+e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={save}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              Create Mapping
            </button>
          </div>
        </div>

        {/* Mappings list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 font-semibold text-gray-900">
            Existing Mappings ({mappings.length})
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px]">
            {mappings.map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{m.test.name}</div>
                  <div className="text-xs text-gray-500">→ {m.room.name} · Priority {m.priority}</div>
                </div>
                <button onClick={() => del(m.id)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
            ))}
            {mappings.length === 0 && <div className="text-gray-400 text-sm text-center py-8">No mappings yet</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
