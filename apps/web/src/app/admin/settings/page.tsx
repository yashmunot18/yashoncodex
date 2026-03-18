'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Settings {
  sonographyNotReadyWaitMin: number;
  autoRouteOnComplete: boolean;
  pollIntervalMs: number;
}

interface Rule {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, r] = await Promise.all([
      api.get('/api/admin/settings'),
      api.get('/api/admin/settings/rules'),
    ]);
    setSettings(s.data);
    setRules(r.data);
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put('/api/admin/settings', settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (key: string, value: string) => {
    try {
      await api.put(`/api/admin/settings/rules/${key}`, { value });
      toast.success('Rule updated');
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-blue-600 text-sm">← Admin</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900 text-lg">⚙️ Center Settings</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Core settings */}
        {settings && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Core Settings</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sonography "Not Ready" Wait Time (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={settings.sonographyNotReadyWaitMin}
                  onChange={(e) => setSettings({ ...settings, sonographyNotReadyWaitMin: +e.target.value })}
                  className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Patient is paused for this many minutes before being re-added to queue</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Sync Poll Interval (milliseconds)
                </label>
                <input
                  type="number"
                  min={5000}
                  step={1000}
                  value={settings.pollIntervalMs}
                  onChange={(e) => setSettings({ ...settings, pollIntervalMs: +e.target.value })}
                  className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">How often to fetch new registrations from the reception proxy (60000 = 1 minute)</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRouteOnComplete}
                  onChange={(e) => setSettings({ ...settings, autoRouteOnComplete: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Auto-route on completion</div>
                  <div className="text-xs text-gray-400">Automatically assign patient to their next test after completing one</div>
                </div>
              </label>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Queue Rules */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Queue Rules</h2>
          <div className="space-y-5">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900 font-mono">{rule.key}</div>
                    {rule.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{rule.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    defaultValue={rule.value}
                    id={`rule-${rule.key}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(`rule-${rule.key}`) as HTMLInputElement;
                      updateRule(rule.key, el.value);
                    }}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
