'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

type Branch = { id: string; name: string; displayOrder: number };
type Stream = { id: string; name: string; category?: string | null; displayOrder: number };
type ExpenseCategory = { id: string; name: string; displayOrder: number };
type LeadStatus = 'NEW' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST' | 'ON_HOLD';

type Lead = {
  id: string;
  contactName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  status: LeadStatus;
  projectDescription?: string | null;
  estimatedTurnover?: string | number | null;
  estimatedExecution?: string | null;
  nextFollowUp?: string | null;
  notes?: string | null;
  branch: Branch;
  revenueStream?: Stream | null;
};

type Dashboard = {
  month: string;
  summary: {
    revenueTargetTotal: number;
    revenueActualTotal: number;
    revenueAchievement: number;
    costTargetTotal: number;
    costActualTotal: number;
    profitTarget: number;
    profitActual: number;
    openLeadCount: number;
    pipelineValue: number;
  };
  branches: Branch[];
  streams: Stream[];
  expenseCategories: ExpenseCategory[];
  branchPerformance: Array<{
    branchId: string;
    branchName: string;
    revenueTarget: number;
    revenueActual: number;
    revenueAchievement: number;
    costTarget: number;
    costActual: number;
    costVariance: number;
    profitTarget: number;
    profitActual: number;
  }>;
  streamPerformance: Array<{ streamId: string; streamName: string; target: number; actual: number; achievement: number }>;
  expensePerformance: Array<{ expenseCategoryId: string; expenseName: string; target: number; actual: number; variance: number }>;
  leads: Lead[];
};

type RevenueForm = { branchId: string; streamId: string; amount: string; mode: 'target' | 'actual' };
type CostForm = { branchId: string; expenseCategoryId: string; amount: string; mode: 'target' | 'actual' };
type LeadForm = {
  branchId: string;
  revenueStreamId: string;
  contactName: string;
  companyName: string;
  phone: string;
  email: string;
  status: LeadStatus;
  projectDescription: string;
  estimatedTurnover: string;
  estimatedExecution: string;
  nextFollowUp: string;
  notes: string;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD'];

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function pct(actual: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

function dateOnly(value?: string | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function OperationsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueForm, setRevenueForm] = useState<RevenueForm>({ branchId: '', streamId: '', amount: '', mode: 'target' });
  const [costForm, setCostForm] = useState<CostForm>({ branchId: '', expenseCategoryId: '', amount: '', mode: 'target' });
  const [leadForm, setLeadForm] = useState<LeadForm>({
    branchId: '',
    revenueStreamId: '',
    contactName: '',
    companyName: '',
    phone: '',
    email: '',
    status: 'NEW',
    projectDescription: '',
    estimatedTurnover: '',
    estimatedExecution: '',
    nextFollowUp: '',
    notes: '',
  });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/operations/dashboard', { params: { month } });
      setData(res.data);
      const branches = res.data.branches as Branch[];
      const streams = res.data.streams as Stream[];
      const expenses = res.data.expenseCategories as ExpenseCategory[];
      setRevenueForm((form) => ({ ...form, branchId: form.branchId || branches[0]?.id || '', streamId: form.streamId || streams[0]?.id || '' }));
      setCostForm((form) => ({ ...form, branchId: form.branchId || branches[0]?.id || '', expenseCategoryId: form.expenseCategoryId || expenses[0]?.id || '' }));
      setLeadForm((form) => ({ ...form, branchId: form.branchId || branches[0]?.id || '', revenueStreamId: form.revenueStreamId || streams[0]?.id || '' }));
    } catch {
      toast.error('Unable to load operations dashboard');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRevenue = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post(`/api/operations/${revenueForm.mode === 'target' ? 'revenue-targets' : 'revenue-actuals'}`, {
        branchId: revenueForm.branchId,
        streamId: revenueForm.streamId,
        month,
        amount: Number(revenueForm.amount || 0),
      });
      toast.success(`Revenue ${revenueForm.mode} saved`);
      setRevenueForm((form) => ({ ...form, amount: '' }));
      load();
    } catch {
      toast.error('Could not save revenue entry');
    }
  };

  const submitCost = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post(`/api/operations/${costForm.mode === 'target' ? 'cost-targets' : 'cost-actuals'}`, {
        branchId: costForm.branchId,
        expenseCategoryId: costForm.expenseCategoryId,
        month,
        amount: Number(costForm.amount || 0),
      });
      toast.success(`Cost ${costForm.mode} saved`);
      setCostForm((form) => ({ ...form, amount: '' }));
      load();
    } catch {
      toast.error('Could not save cost entry');
    }
  };

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/api/operations/leads', {
        ...leadForm,
        revenueStreamId: leadForm.revenueStreamId || null,
        estimatedTurnover: leadForm.estimatedTurnover ? Number(leadForm.estimatedTurnover) : null,
        estimatedExecution: leadForm.estimatedExecution || null,
        nextFollowUp: leadForm.nextFollowUp || null,
      });
      toast.success('Lead added to timeline');
      setLeadForm((form) => ({
        ...form,
        contactName: '',
        companyName: '',
        phone: '',
        email: '',
        status: 'NEW',
        projectDescription: '',
        estimatedTurnover: '',
        estimatedExecution: '',
        nextFollowUp: '',
        notes: '',
      }));
      load();
    } catch {
      toast.error('Could not add lead');
    }
  };

  const leadGroups = useMemo(() => {
    const grouped = new Map<LeadStatus, Lead[]>();
    statuses.forEach((status) => grouped.set(status, []));
    data?.leads.forEach((lead) => grouped.get(lead.status)?.push(lead));
    return grouped;
  }, [data?.leads]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-10 text-center text-slate-500">Loading NDC operations dashboard…</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">← Home</Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">NDC Diagnostic Centre</p>
              <h1 className="text-2xl font-bold">Sales, Leads & Profitability Command Centre</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className={labelClass} htmlFor="month">Month</label>
            <input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Refresh</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Revenue Target" value={money(data?.summary.revenueTargetTotal)} sub={`${data?.summary.revenueAchievement ?? 0}% achieved`} color="blue" />
          <SummaryCard title="Actual Turnover" value={money(data?.summary.revenueActualTotal)} sub="Manual actual data entered by team" color="emerald" />
          <SummaryCard title="Profitability" value={money(data?.summary.profitActual)} sub={`Target profit ${money(data?.summary.profitTarget)}`} color="violet" />
          <SummaryCard title="Open Pipeline" value={money(data?.summary.pipelineValue)} sub={`${data?.summary.openLeadCount ?? 0} active leads`} color="amber" />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <form onSubmit={submitRevenue} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Set Revenue Targets / Actuals</h2>
            <p className="mb-4 text-sm text-slate-500">Choose any branch and stream, then enter the monthly target or actual turnover.</p>
            <div className="space-y-3">
              <Select label="Branch" value={revenueForm.branchId} onChange={(value) => setRevenueForm({ ...revenueForm, branchId: value })} options={data?.branches.map((b) => ({ value: b.id, label: b.name })) ?? []} />
              <Select label="Stream" value={revenueForm.streamId} onChange={(value) => setRevenueForm({ ...revenueForm, streamId: value })} options={data?.streams.map((s) => ({ value: s.id, label: s.name })) ?? []} />
              <Select label="Entry Type" value={revenueForm.mode} onChange={(value) => setRevenueForm({ ...revenueForm, mode: value as RevenueForm['mode'] })} options={[{ value: 'target', label: 'Target' }, { value: 'actual', label: 'Actual Turnover' }]} />
              <Field label="Amount (₹)" type="number" value={revenueForm.amount} onChange={(value) => setRevenueForm({ ...revenueForm, amount: value })} required />
              <button className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Save Revenue Entry</button>
            </div>
          </form>

          <form onSubmit={submitCost} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Profitability Cost Goals</h2>
            <p className="mb-4 text-sm text-slate-500">Give centre managers cost-reduction goals and record actual expenses manually.</p>
            <div className="space-y-3">
              <Select label="Branch" value={costForm.branchId} onChange={(value) => setCostForm({ ...costForm, branchId: value })} options={data?.branches.map((b) => ({ value: b.id, label: b.name })) ?? []} />
              <Select label="Expense" value={costForm.expenseCategoryId} onChange={(value) => setCostForm({ ...costForm, expenseCategoryId: value })} options={data?.expenseCategories.map((e) => ({ value: e.id, label: e.name })) ?? []} />
              <Select label="Entry Type" value={costForm.mode} onChange={(value) => setCostForm({ ...costForm, mode: value as CostForm['mode'] })} options={[{ value: 'target', label: 'Cost Goal' }, { value: 'actual', label: 'Actual Expense' }]} />
              <Field label="Amount (₹)" type="number" value={costForm.amount} onChange={(value) => setCostForm({ ...costForm, amount: value })} required />
              <button className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">Save Cost Entry</button>
            </div>
          </form>

          <form onSubmit={submitLead} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Add Lead Information</h2>
            <p className="mb-4 text-sm text-slate-500">Capture contact details, expected turnover, project status, and estimated execution date.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Branch" value={leadForm.branchId} onChange={(value) => setLeadForm({ ...leadForm, branchId: value })} options={data?.branches.map((b) => ({ value: b.id, label: b.name })) ?? []} />
              <Select label="Stream" value={leadForm.revenueStreamId} onChange={(value) => setLeadForm({ ...leadForm, revenueStreamId: value })} options={data?.streams.map((s) => ({ value: s.id, label: s.name })) ?? []} />
              <Field label="Contact Name" value={leadForm.contactName} onChange={(value) => setLeadForm({ ...leadForm, contactName: value })} required />
              <Field label="Company / Deal" value={leadForm.companyName} onChange={(value) => setLeadForm({ ...leadForm, companyName: value })} />
              <Field label="Phone" value={leadForm.phone} onChange={(value) => setLeadForm({ ...leadForm, phone: value })} />
              <Field label="Email" type="email" value={leadForm.email} onChange={(value) => setLeadForm({ ...leadForm, email: value })} />
              <Select label="Status" value={leadForm.status} onChange={(value) => setLeadForm({ ...leadForm, status: value as LeadStatus })} options={statuses.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
              <Field label="Estimated Turnover (₹)" type="number" value={leadForm.estimatedTurnover} onChange={(value) => setLeadForm({ ...leadForm, estimatedTurnover: value })} />
              <Field label="Execution Date" type="date" value={leadForm.estimatedExecution} onChange={(value) => setLeadForm({ ...leadForm, estimatedExecution: value })} />
              <Field label="Next Follow-up" type="date" value={leadForm.nextFollowUp} onChange={(value) => setLeadForm({ ...leadForm, nextFollowUp: value })} />
              <div className="sm:col-span-2">
                <Field label="Project Details" value={leadForm.projectDescription} onChange={(value) => setLeadForm({ ...leadForm, projectDescription: value })} />
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Add Lead</button>
          </form>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Branch Target vs Actual + Profitability">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr><th className="py-2">Centre</th><th>Revenue</th><th>Costs</th><th>Profit</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.branchPerformance.map((row) => (
                    <tr key={row.branchId}>
                      <td className="py-3 font-semibold">{row.branchName}<div className="mt-1 h-2 w-36 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct(row.revenueActual, row.revenueTarget)}%` }} /></div></td>
                      <td>{money(row.revenueActual)}<div className="text-xs text-slate-500">Target {money(row.revenueTarget)}</div></td>
                      <td>{money(row.costActual)}<div className={`text-xs ${row.costVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Variance {money(row.costVariance)}</div></td>
                      <td className={row.profitActual >= 0 ? 'font-bold text-emerald-600' : 'font-bold text-red-600'}>{money(row.profitActual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Lead Status Timeline">
            <div className="space-y-4">
              {statuses.map((status) => (
                <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{status.replace(/_/g, ' ')}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">{leadGroups.get(status)?.length ?? 0}</span>
                  </div>
                  <div className="space-y-2">
                    {(leadGroups.get(status) ?? []).slice(0, 4).map((lead) => (
                      <div key={lead.id} className="rounded-xl bg-white p-3 shadow-sm">
                        <div className="flex justify-between gap-3">
                          <div>
                            <div className="font-semibold">{lead.contactName}</div>
                            <div className="text-xs text-slate-500">{lead.companyName || 'No company'} · {lead.branch.name} · {lead.revenueStream?.name || 'No stream'}</div>
                          </div>
                          <div className="text-right text-xs font-bold text-blue-600">{money(lead.estimatedTurnover)}</div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Execution: {dateOnly(lead.estimatedExecution)} · Follow-up: {dateOnly(lead.nextFollowUp)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Revenue Stream Performance">
            <div className="space-y-3">
              {data?.streamPerformance.map((stream) => (
                <ProgressRow key={stream.streamId} name={stream.streamName} actual={stream.actual} target={stream.target} positive />
              ))}
            </div>
          </Panel>
          <Panel title="Expense Goals vs Actuals">
            <div className="space-y-3">
              {data?.expensePerformance.map((expense) => (
                <ProgressRow key={expense.expenseCategoryId} name={expense.expenseName} actual={expense.actual} target={expense.target} positive={expense.actual <= expense.target} />
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: 'blue' | 'emerald' | 'violet' | 'amber' }) {
  const colors = { blue: 'from-blue-600 to-indigo-600', emerald: 'from-emerald-600 to-teal-600', violet: 'from-violet-600 to-fuchsia-600', amber: 'from-amber-500 to-orange-600' };
  return <div className={`rounded-3xl bg-gradient-to-br ${colors[color]} p-5 text-white shadow-sm`}><div className="text-sm opacity-80">{title}</div><div className="mt-2 text-2xl font-black">{value}</div><div className="mt-2 text-xs opacity-80">{sub}</div></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold">{title}</h2>{children}</section>;
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block space-y-1"><span className={labelClass}>{label}</span><input className={inputClass} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="block space-y-1"><span className={labelClass}>{label}</span><select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function ProgressRow({ name, actual, target, positive }: { name: string; actual: number; target: number; positive: boolean }) {
  const percentage = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return <div><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{name}</span><span className={positive ? 'text-emerald-600' : 'text-red-600'}>{money(actual)} / {money(target)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${positive ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} /></div></div>;
}
