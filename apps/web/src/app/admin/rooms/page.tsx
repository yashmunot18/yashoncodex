'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Room {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  capacity: number;
  displayOrder: number;
}

const ROOM_TYPES = ['SONOGRAPHY','BLOOD_COLLECTION','STRESS_TEST','MAMMOGRAPHY','XRAY','CONSULTATION','EYE_HEARING','OTHER'];

const blank = (): Partial<Room> => ({ name: '', type: 'OTHER', isActive: true, capacity: 1, displayOrder: 0 });

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<Partial<Room>>(blank());
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get('/api/admin/rooms');
    setRooms(res.data);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim()) return toast.error('Room name is required');
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/api/admin/rooms/${editing}`, form);
        toast.success('Room updated');
      } else {
        await api.post('/api/admin/rooms', form);
        toast.success('Room created');
      }
      setForm(blank());
      setEditing(null);
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Deactivate this room?')) return;
    await api.delete(`/api/admin/rooms/${id}`);
    toast.success('Room deactivated');
    load();
  };

  const edit = (r: Room) => {
    setEditing(r.id);
    setForm(r);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 text-sm">← Admin</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900 text-lg">🚪 Manage Rooms</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit Room' : 'Add New Room'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sonography"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                value={form.type ?? 'OTHER'}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity ?? 1}
                  onChange={(e) => setForm({ ...form, capacity: +e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.displayOrder ?? 0}
                  onChange={(e) => setForm({ ...form, displayOrder: +e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {editing ? 'Update Room' : 'Add Room'}
              </button>
              {editing && (
                <button
                  onClick={() => { setEditing(null); setForm(blank()); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 font-semibold text-gray-900">
            Current Rooms ({rooms.length})
          </div>
          <div className="divide-y divide-gray-50">
            {rooms.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.type.replace(/_/g,' ')} · Order {r.displayOrder}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {r.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => edit(r)} className="text-xs text-blue-600 hover:text-blue-700">Edit</button>
                <button onClick={() => del(r.id)} className="text-xs text-red-500 hover:text-red-600">Del</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
