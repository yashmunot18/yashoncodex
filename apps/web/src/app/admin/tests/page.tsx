'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Test {
  id: string;
  name: string;
  code: string;
  defaultDurationMin: number;
  requiresPrep: boolean;
  prepInstructions?: string;
  isActive: boolean;
  displayOrder: number;
}

const blank = (): Partial<Test> => ({
  name: '', code: '', defaultDurationMin: 15,
  requiresPrep: false, prepInstructions: '', isActive: true, displayOrder: 0,
});

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [form, setForm] = useState<Partial<Test>>(blank());
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get('/api/admin/tests');
    setTests(res.data);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim() || !form.code?.trim()) return toast.error('Name and code are required');
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/api/admin/tests/${editing}`, form);
        toast.success('Test updated');
      } else {
        await api.post('/api/admin/tests', form);
        toast.success('Test created');
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
    if (!confirm('Deactivate this test?')) return;
    await api.delete(`/api/admin/tests/${id}`);
    toast.success('Test deactivated');
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 text-sm">← Admin</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900 text-lg">🧪 Manage Tests</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit Test' : 'Add New Test'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
              <input
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. USG Abdomen"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Code *</label>
              <input
                value={form.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. USG-ABD"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={form.defaultDurationMin ?? 15}
                  onChange={(e) => setForm({ ...form, defaultDurationMin: +e.target.value })}
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
                checked={form.requiresPrep ?? false}
                onChange={(e) => setForm({ ...form, requiresPrep: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Requires Preparation</span>
            </label>
            {form.requiresPrep && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Instructions</label>
                <textarea
                  value={form.prepInstructions ?? ''}
                  onChange={(e) => setForm({ ...form, prepInstructions: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}
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
                {editing ? 'Update Test' : 'Add Test'}
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
            All Tests ({tests.length})
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[600px]">
            {tests.map((t) => (
              <div key={t.id} className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">
                    {t.code} · {t.defaultDurationMin}min {t.requiresPrep ? '· Prep required' : ''}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {t.isActive ? 'Active' : 'Off'}
                </span>
                <button onClick={() => { setEditing(t.id); setForm(t); }} className="text-xs text-blue-600">Edit</button>
                <button onClick={() => del(t.id)} className="text-xs text-red-500">Del</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
