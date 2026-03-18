'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface VisitTest {
  id: string;
  status: string;
  test: { name: string; requiresPrep: boolean; prepInstructions?: string };
  queueEntry?: { position: number; room: { name: string } };
}

interface PatientStatus {
  visit: {
    id: string;
    registrationNo: string;
    status: string;
    patient: { name: string; age?: number; gender?: string };
    visitTests: VisitTest[];
  };
  progress: { total: number; completed: number; pending: number };
  currentTest: VisitTest | null;
}

const statusIcon: Record<string, string> = {
  PENDING: '⏳',
  QUEUED: '🔢',
  CALLING: '📣',
  IN_PROGRESS: '🔄',
  COMPLETED: '✅',
  NOT_READY: '⏸',
  SKIPPED: '⏭',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  QUEUED: 'In Queue',
  CALLING: 'Being Called',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Done',
  NOT_READY: 'Not Ready',
  SKIPPED: 'Skipped',
};

function PatientContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('regNo') ?? '');
  const [data, setData] = useState<PatientStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/patient/search?registrationNo=${encodeURIComponent(query)}`);
      if (res.data.length === 0) {
        toast.error('No registration found for today');
        return;
      }
      // Load first result
      const statusRes = await api.get(`/api/patient/${res.data[0].id}/status`);
      setData(statusRes.data);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">← Home</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900">📱 Patient Status</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Registration Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="e.g. NDC-2024-001"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={search}
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? '…' : 'Search'}
            </button>
          </div>
        </div>

        {data && (
          <>
            {/* Patient Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
                  {data.visit.patient.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{data.visit.patient.name}</div>
                  {data.visit.patient.age && (
                    <div className="text-sm text-gray-500">
                      Age {data.visit.patient.age} · {data.visit.patient.gender}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">Reg: {data.visit.registrationNo}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-5">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{data.progress.completed}/{data.progress.total} tests completed</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${data.progress.total > 0 ? (data.progress.completed / data.progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Test */}
            {data.currentTest && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
                <div className="text-xs font-medium text-blue-500 uppercase mb-2">Current</div>
                <div className="font-semibold text-gray-900 text-lg">{data.currentTest.test.name}</div>
                {data.currentTest.queueEntry && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      📍 {data.currentTest.queueEntry.room.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      Queue position: #{data.currentTest.queueEntry.position}
                    </span>
                  </div>
                )}
                {data.currentTest.test.requiresPrep && data.currentTest.test.prepInstructions && (
                  <div className="mt-3 bg-white rounded-xl p-3 border border-blue-100">
                    <div className="text-xs font-medium text-blue-600 mb-1">Preparation Required</div>
                    <div className="text-sm text-gray-700">{data.currentTest.test.prepInstructions}</div>
                  </div>
                )}
              </div>
            )}

            {/* All Tests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900">All Tests</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {data.visit.visitTests.map((vt) => (
                  <div key={vt.id} className="px-5 py-4 flex items-center gap-3">
                    <span className="text-xl">{statusIcon[vt.status] ?? '•'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{vt.test.name}</div>
                      {vt.queueEntry && vt.status !== 'COMPLETED' && (
                        <div className="text-xs text-gray-500">
                          {vt.queueEntry.room.name} · Queue #{vt.queueEntry.position}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      vt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      vt.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' :
                      vt.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {statusLabel[vt.status] ?? vt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
      <PatientContent />
    </Suspense>
  );
}
