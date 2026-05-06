import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../index';

const CENTER_ID = 'ndc-thane';

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM format');
const moneySchema = z.coerce.number().min(0);

const BranchSchema = z.object({
  name: z.string().min(1),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

const RevenueStreamSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

const ExpenseCategorySchema = z.object({
  name: z.string().min(1),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

const RevenueEntrySchema = z.object({
  branchId: z.string().min(1),
  streamId: z.string().min(1),
  month: monthSchema,
  amount: moneySchema,
  notes: z.string().optional().nullable(),
});

const CostEntrySchema = z.object({
  branchId: z.string().min(1),
  expenseCategoryId: z.string().min(1),
  month: monthSchema,
  amount: moneySchema,
  notes: z.string().optional().nullable(),
});

const LeadSchema = z.object({
  branchId: z.string().min(1),
  revenueStreamId: z.string().optional().nullable(),
  contactName: z.string().min(1),
  companyName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD']).default('NEW'),
  projectDescription: z.string().optional().nullable(),
  estimatedTurnover: moneySchema.optional().nullable(),
  estimatedExecution: z.string().optional().nullable(),
  nextFollowUp: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const toDecimal = (amount: number) => new Prisma.Decimal(amount);
const toNullableDate = (value?: string | null) => (value ? new Date(value) : null);
const numeric = (value: Prisma.Decimal | number | string | null | undefined) => Number(value ?? 0);

async function seedOperationsDefaults() {
  const center = await prisma.center.upsert({
    where: { id: CENTER_ID },
    update: {},
    create: {
      id: CENTER_ID,
      company: {
        connectOrCreate: {
          where: { id: 'ndc-company' },
          create: { id: 'ndc-company', name: 'NDC DIAGNOSTIC CENTRE' },
        },
      },
      name: 'THANE',
      city: 'Thane',
      address: 'NDC Diagnostic Centre, Thane, Maharashtra',
    },
  });

  const branches = ['Kopat', 'Savarkar Nagar', 'GB Road', 'Rabodi', 'Kalyan', 'Seawoods', 'Kharghar', 'Kurla'];
  for (const [index, name] of branches.entries()) {
    await prisma.businessBranch.upsert({
      where: { centerId_name: { centerId: center.id, name } },
      update: { displayOrder: index + 1, isActive: true },
      create: { centerId: center.id, name, displayOrder: index + 1 },
    });
  }

  const streams = [
    ['Walk-in Sales', 'Retail'],
    ['NDC Health Package', 'Retail'],
    ['Doctor Referrals', 'Referral'],
    ['TPA Sales', 'Standalone Category'],
    ['Corporate Business', 'Corporate'],
    ['Industrial Health Checkups', 'Corporate'],
    ['B2B', 'Partner'],
    ['Franchises', 'Partner'],
    ['Hospitals', 'Partner'],
  ] as const;
  for (const [index, [name, category]] of streams.entries()) {
    await prisma.revenueStream.upsert({
      where: { centerId_name: { centerId: center.id, name } },
      update: { category, displayOrder: index + 1, isActive: true },
      create: { centerId: center.id, name, category, displayOrder: index + 1 },
    });
  }

  const expenses = ['Rent', 'Salaries', 'Consumables', 'Electricity', 'Machine Maintenance', 'Marketing', 'Housekeeping', 'Other Expenses'];
  for (const [index, name] of expenses.entries()) {
    await prisma.expenseCategory.upsert({
      where: { centerId_name: { centerId: center.id, name } },
      update: { displayOrder: index + 1, isActive: true },
      create: { centerId: center.id, name, displayOrder: index + 1 },
    });
  }
}

export default async function operationsRoutes(app: FastifyInstance) {
  app.post('/bootstrap', async () => {
    await seedOperationsDefaults();
    return { success: true };
  });

  app.get('/meta', async () => {
    await seedOperationsDefaults();
    const [branches, streams, expenseCategories] = await Promise.all([
      prisma.businessBranch.findMany({ where: { centerId: CENTER_ID, isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.revenueStream.findMany({ where: { centerId: CENTER_ID, isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.expenseCategory.findMany({ where: { centerId: CENTER_ID, isActive: true }, orderBy: { displayOrder: 'asc' } }),
    ]);
    return { branches, streams, expenseCategories };
  });

  app.get<{ Querystring: { month?: string } }>('/dashboard', async (req) => {
    await seedOperationsDefaults();
    const month = monthSchema.optional().default(new Date().toISOString().slice(0, 7)).parse(req.query.month);
    const [branches, streams, expenseCategories, revenueTargets, revenueActuals, costTargets, costActuals, leads] = await Promise.all([
      prisma.businessBranch.findMany({ where: { centerId: CENTER_ID, isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.revenueStream.findMany({ where: { centerId: CENTER_ID, isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.expenseCategory.findMany({ where: { centerId: CENTER_ID, isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.monthlyRevenueTarget.findMany({ where: { month }, include: { branch: true, stream: true } }),
      prisma.monthlyRevenueActual.findMany({ where: { month }, include: { branch: true, stream: true } }),
      prisma.monthlyCostTarget.findMany({ where: { month }, include: { branch: true, expenseCategory: true } }),
      prisma.monthlyCostActual.findMany({ where: { month }, include: { branch: true, expenseCategory: true } }),
      prisma.lead.findMany({
        include: { branch: true, revenueStream: true },
        orderBy: [{ estimatedExecution: 'asc' }, { updatedAt: 'desc' }],
      }),
    ]);

    const revenueTargetTotal = revenueTargets.reduce((sum, entry) => sum + numeric(entry.amount), 0);
    const revenueActualTotal = revenueActuals.reduce((sum, entry) => sum + numeric(entry.amount), 0);
    const costTargetTotal = costTargets.reduce((sum, entry) => sum + numeric(entry.amount), 0);
    const costActualTotal = costActuals.reduce((sum, entry) => sum + numeric(entry.amount), 0);
    const openLeads = leads.filter((lead) => !['WON', 'LOST'].includes(lead.status));
    const pipelineValue = openLeads.reduce((sum, lead) => sum + numeric(lead.estimatedTurnover), 0);

    const branchPerformance = branches.map((branch) => {
      const target = revenueTargets.filter((entry) => entry.branchId === branch.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      const actual = revenueActuals.filter((entry) => entry.branchId === branch.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      const costTarget = costTargets.filter((entry) => entry.branchId === branch.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      const costActual = costActuals.filter((entry) => entry.branchId === branch.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      return {
        branchId: branch.id,
        branchName: branch.name,
        revenueTarget: target,
        revenueActual: actual,
        revenueAchievement: target > 0 ? Math.round((actual / target) * 100) : 0,
        costTarget,
        costActual,
        costVariance: costTarget - costActual,
        profitTarget: target - costTarget,
        profitActual: actual - costActual,
      };
    });

    const streamPerformance = streams.map((stream) => {
      const target = revenueTargets.filter((entry) => entry.streamId === stream.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      const actual = revenueActuals.filter((entry) => entry.streamId === stream.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      return {
        streamId: stream.id,
        streamName: stream.name,
        target,
        actual,
        achievement: target > 0 ? Math.round((actual / target) * 100) : 0,
      };
    });

    const expensePerformance = expenseCategories.map((expense) => {
      const target = costTargets.filter((entry) => entry.expenseCategoryId === expense.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      const actual = costActuals.filter((entry) => entry.expenseCategoryId === expense.id).reduce((sum, entry) => sum + numeric(entry.amount), 0);
      return {
        expenseCategoryId: expense.id,
        expenseName: expense.name,
        target,
        actual,
        variance: target - actual,
      };
    });

    return {
      month,
      summary: {
        revenueTargetTotal,
        revenueActualTotal,
        revenueAchievement: revenueTargetTotal > 0 ? Math.round((revenueActualTotal / revenueTargetTotal) * 100) : 0,
        costTargetTotal,
        costActualTotal,
        profitTarget: revenueTargetTotal - costTargetTotal,
        profitActual: revenueActualTotal - costActualTotal,
        openLeadCount: openLeads.length,
        pipelineValue,
      },
      branches,
      streams,
      expenseCategories,
      branchPerformance,
      streamPerformance,
      expensePerformance,
      leads,
      revenueTargets,
      revenueActuals,
      costTargets,
      costActuals,
    };
  });

  app.post('/branches', async (req, reply) => {
    const data = BranchSchema.parse(req.body);
    const branch = await prisma.businessBranch.create({ data: { ...data, centerId: CENTER_ID } });
    return reply.code(201).send(branch);
  });

  app.post('/streams', async (req, reply) => {
    const data = RevenueStreamSchema.parse(req.body);
    const stream = await prisma.revenueStream.create({ data: { ...data, centerId: CENTER_ID } });
    return reply.code(201).send(stream);
  });

  app.post('/expense-categories', async (req, reply) => {
    const data = ExpenseCategorySchema.parse(req.body);
    const category = await prisma.expenseCategory.create({ data: { ...data, centerId: CENTER_ID } });
    return reply.code(201).send(category);
  });

  app.post('/revenue-targets', async (req) => {
    const data = RevenueEntrySchema.parse(req.body);
    return prisma.monthlyRevenueTarget.upsert({
      where: { branchId_streamId_month: { branchId: data.branchId, streamId: data.streamId, month: data.month } },
      update: { amount: toDecimal(data.amount), notes: data.notes },
      create: { ...data, amount: toDecimal(data.amount) },
    });
  });

  app.post('/revenue-actuals', async (req) => {
    const data = RevenueEntrySchema.parse(req.body);
    return prisma.monthlyRevenueActual.upsert({
      where: { branchId_streamId_month: { branchId: data.branchId, streamId: data.streamId, month: data.month } },
      update: { amount: toDecimal(data.amount), notes: data.notes },
      create: { ...data, amount: toDecimal(data.amount) },
    });
  });

  app.post('/cost-targets', async (req) => {
    const data = CostEntrySchema.parse(req.body);
    return prisma.monthlyCostTarget.upsert({
      where: { branchId_expenseCategoryId_month: { branchId: data.branchId, expenseCategoryId: data.expenseCategoryId, month: data.month } },
      update: { amount: toDecimal(data.amount), notes: data.notes },
      create: { ...data, amount: toDecimal(data.amount) },
    });
  });

  app.post('/cost-actuals', async (req) => {
    const data = CostEntrySchema.parse(req.body);
    return prisma.monthlyCostActual.upsert({
      where: { branchId_expenseCategoryId_month: { branchId: data.branchId, expenseCategoryId: data.expenseCategoryId, month: data.month } },
      update: { amount: toDecimal(data.amount), notes: data.notes },
      create: { ...data, amount: toDecimal(data.amount) },
    });
  });

  app.get('/leads', async () => prisma.lead.findMany({
    include: { branch: true, revenueStream: true },
    orderBy: [{ estimatedExecution: 'asc' }, { updatedAt: 'desc' }],
  }));

  app.post('/leads', async (req, reply) => {
    const data = LeadSchema.parse(req.body);
    const lead = await prisma.lead.create({
      data: {
        ...data,
        revenueStreamId: data.revenueStreamId || null,
        email: data.email || null,
        estimatedTurnover: data.estimatedTurnover == null ? null : toDecimal(data.estimatedTurnover),
        estimatedExecution: toNullableDate(data.estimatedExecution),
        nextFollowUp: toNullableDate(data.nextFollowUp),
      },
      include: { branch: true, revenueStream: true },
    });
    return reply.code(201).send(lead);
  });

  app.put<{ Params: { id: string } }>('/leads/:id', async (req) => {
    const data = LeadSchema.partial().parse(req.body);
    return prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...data,
        revenueStreamId: data.revenueStreamId === undefined ? undefined : data.revenueStreamId || null,
        email: data.email === undefined ? undefined : data.email || null,
        estimatedTurnover: data.estimatedTurnover === undefined ? undefined : data.estimatedTurnover == null ? null : toDecimal(data.estimatedTurnover),
        estimatedExecution: data.estimatedExecution === undefined ? undefined : toNullableDate(data.estimatedExecution),
        nextFollowUp: data.nextFollowUp === undefined ? undefined : toNullableDate(data.nextFollowUp),
      },
      include: { branch: true, revenueStream: true },
    });
  });
}
